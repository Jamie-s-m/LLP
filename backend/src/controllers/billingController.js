import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  findBillingPlan,
  getBillingPlans,
  getClickCheckoutBaseUrl,
  getClickMerchantId,
  getClickServiceId,
  getPaymeCheckoutBaseUrl,
  getPaymeMerchantId,
  serializeBilling,
} from '../utils/billing.js';
import User from '../models/User.js';
import PaymeTransaction from '../models/PaymeTransaction.js';
import ClickTransaction from '../models/ClickTransaction.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import logger from '../utils/logger.js';

// Fire-and-forget: a webhook's job is to confirm payment with the provider and update
// billing state - it must return successfully to Payme/Click even if this insert fails.
const recordBillingEvent = (event, userId, metadata) => {
  AnalyticsEvent.create({ event, user: userId, metadata }).catch(() => {});
};

// Read lazily, not captured at module-load time: billingController.js is statically imported
// before app.js calls dotenv.config(), so a module-level constant would always read as empty
// in any process relying on a .env file (local dev, scripts) - only Render's directly-injected
// env vars happened to dodge that ordering issue.
const getPaymeMerchantKey = () => process.env.PAYME_MERCHANT_KEY || '';
const getClickSecretKey = () => process.env.CLICK_SECRET_KEY || '';

export const getBillingPlansController = (_req, res) => {
  try {
    const merchantId = getPaymeMerchantId();
    const clickServiceId = getClickServiceId();
    return res.status(200).json({
      success: true,
      data: {
        plans: getBillingPlans(),
        payme: {
          available: Boolean(merchantId),
          merchantId,
          checkoutBaseUrl: getPaymeCheckoutBaseUrl(),
        },
        click: {
          available: Boolean(clickServiceId) && Boolean(getClickMerchantId()),
          serviceId: clickServiceId,
          merchantId: getClickMerchantId(),
          checkoutBaseUrl: getClickCheckoutBaseUrl(),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load billing plans' });
  }
};

export const getMyBillingState = async (req, res) => {
  try {
    const user = req.user;
    const billing = user?.billing || {};

    return res.status(200).json({
      success: true,
      data: {
        billing: serializeBilling(billing),
        plan: billing?.plan || 'none',
        role: user?.role || 'student',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load billing state' });
  }
};

const validatePaymeAuth = (req) => {
  const merchantKey = getPaymeMerchantKey();
  // An unset merchant key must never authenticate - otherwise Basic "Paycom:" (empty password)
  // would pass once the key defaults to '', before the integration is configured.
  if (!merchantKey) return false;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
  const [login, password] = credentials.split(':');
  if (login !== 'Paycom') return false;

  // Constant-time comparison: a plain === short-circuits at the first mismatched character,
  // which leaks a timing signal an attacker could use to recover the key byte-by-byte.
  const passwordBuffer = Buffer.from(password || '');
  const keyBuffer = Buffer.from(merchantKey);
  if (passwordBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(passwordBuffer, keyBuffer);
};

// Error shapes follow Payme's Merchant API spec exactly - the numeric codes are meaningful
// to Payme's own servers (and their certification test suite), not just human-readable text.
const paymeError = (code, message, data) => ({ code, message, ...(data ? { data } : {}) });

const PAYME_ERRORS = {
  AUTH: paymeError(-32504, { ru: 'Недостаточно привилегий', en: 'Insufficient privileges', uz: "Ruxsat yetarli emas" }),
  METHOD_NOT_FOUND: paymeError(-32601, { ru: 'Метод не найден', en: 'Method not found', uz: 'Metod topilmadi' }),
  INVALID_AMOUNT: paymeError(-31001, { ru: 'Неверная сумма', en: 'Invalid amount', uz: "Summa noto'g'ri" }),
  TRANSACTION_NOT_FOUND: paymeError(-31003, { ru: 'Транзакция не найдена', en: 'Transaction not found', uz: 'Tranzaksiya topilmadi' }),
  COULD_NOT_CANCEL: paymeError(-31007, { ru: 'Невозможно отменить, заказ выполнен', en: 'Could not cancel, order completed', uz: "Bekor qilib bo'lmadi" }),
  COULD_NOT_PERFORM: paymeError(-31008, { ru: 'Невозможно выполнить операцию', en: 'Could not perform this operation', uz: "Amalni bajarib bo'lmadi" }),
  SYSTEM_ERROR: paymeError(-32400, { ru: 'Внутренняя ошибка сервера', en: 'Internal server error', uz: 'Server xatosi' }),
  invalidAccount: (field) =>
    paymeError(-31050, { ru: 'Неверные данные счёта', en: 'Invalid account', uz: "Hisob ma'lumotlari noto'g'ri" }, field),
};

// account.user_id / account.plan are our own field names - we choose them when a checkout
// link is built, and Payme echoes them back verbatim on every call for this transaction.
const resolvePaymeAccount = async (account) => {
  const userId = account?.user_id;
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return { error: PAYME_ERRORS.invalidAccount('user_id') };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { error: PAYME_ERRORS.invalidAccount('user_id') };
  }

  const planKey = account?.plan;
  const plan = findBillingPlan(planKey);
  if (!plan || !plan.priceUzs) {
    return { error: PAYME_ERRORS.invalidAccount('plan') };
  }

  return { user, planKey, expectedAmount: plan.priceUzs * 100 };
};

export const handlePaymeRequest = async (req, res) => {
  const { method, params, id } = req.body || {};

  if (!validatePaymeAuth(req)) {
    return res.status(401).json({ error: PAYME_ERRORS.AUTH, id: id ?? null });
  }

  try {
    switch (method) {
      case 'CheckPerformTransaction': {
        const resolved = await resolvePaymeAccount(params?.account);
        if (resolved.error) return res.json({ error: resolved.error, id });

        const amount = Number(params?.amount);
        if (!Number.isFinite(amount) || amount !== resolved.expectedAmount) {
          return res.json({ error: PAYME_ERRORS.INVALID_AMOUNT, id });
        }

        const pendingConflict = await PaymeTransaction.findOne({
          user: resolved.user._id,
          plan: resolved.planKey,
          state: 1,
        });
        if (pendingConflict) {
          return res.json({ error: PAYME_ERRORS.COULD_NOT_PERFORM, id });
        }

        return res.json({ result: { allow: true }, id });
      }

      case 'CreateTransaction': {
        const paycomTransactionId = String(params?.id || '');
        if (!paycomTransactionId) {
          return res.json({ error: PAYME_ERRORS.invalidAccount('id'), id });
        }

        const existing = await PaymeTransaction.findOne({ paycomTransactionId });
        if (existing) {
          if (existing.state !== 1) {
            return res.json({ error: PAYME_ERRORS.COULD_NOT_PERFORM, id });
          }
          // Idempotent replay: echo the original create_time, never regenerate it.
          return res.json({ result: { create_time: existing.createTime, transaction: String(existing._id), state: 1 }, id });
        }

        const resolved = await resolvePaymeAccount(params?.account);
        if (resolved.error) return res.json({ error: resolved.error, id });

        const amount = Number(params?.amount);
        if (!Number.isFinite(amount) || amount !== resolved.expectedAmount) {
          return res.json({ error: PAYME_ERRORS.INVALID_AMOUNT, id });
        }

        const conflicting = await PaymeTransaction.findOne({
          user: resolved.user._id,
          plan: resolved.planKey,
          state: 1,
        });
        if (conflicting) {
          return res.json({ error: PAYME_ERRORS.COULD_NOT_PERFORM, id });
        }

        const createTime = Date.now();
        let txn;
        try {
          txn = await PaymeTransaction.create({
            paycomTransactionId,
            user: resolved.user._id,
            plan: resolved.planKey,
            amount,
            state: 1,
            createTime,
          });
        } catch (createError) {
          // Two concurrent CreateTransaction calls for the same id (a plausible Payme
          // retry-on-timeout) can both pass the findOne-above as null and both attempt
          // create() - the unique index on paycomTransactionId then rejects the loser with
          // an E11000, which must resolve to the same idempotent-replay response the winner
          // gets, not a system error (a retried create is not really a failure).
          if (createError?.code !== 11000) throw createError;
          const raced = await PaymeTransaction.findOne({ paycomTransactionId });
          if (!raced) throw createError;
          return res.json({ result: { create_time: raced.createTime, transaction: String(raced._id), state: raced.state }, id });
        }

        return res.json({ result: { create_time: createTime, transaction: String(txn._id), state: 1 }, id });
      }

      case 'PerformTransaction': {
        const paycomTransactionId = String(params?.id || '');
        const performTime = Date.now();

        // Atomic, state-guarded claim: only the request that actually flips state 1 -> 2
        // proceeds to grant the plan. A concurrent duplicate (or a Cancel racing in) can no
        // longer observe a stale "still state 1" snapshot and act on it - findOneAndUpdate's
        // filter is evaluated against MongoDB's own current document state, the same pattern
        // already used for the daily-reward claim slot above.
        const claimed = await PaymeTransaction.findOneAndUpdate(
          { paycomTransactionId, state: 1 },
          { $set: { state: 2, performTime } },
          { new: false }
        );

        if (!claimed) {
          const txn = await PaymeTransaction.findOne({ paycomTransactionId });
          if (!txn) {
            return res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
          }
          if (txn.state === 2) {
            // Idempotent replay: the plan was already granted, don't re-grant it.
            return res.json({ result: { transaction: String(txn._id), perform_time: txn.performTime, state: 2 }, id });
          }
          return res.json({ error: PAYME_ERRORS.COULD_NOT_PERFORM, id });
        }

        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Atomic $set on the user doc too (not a read-modify-write .save()), so a concurrent
        // CancelTransaction's own atomic revoke below can't be lost to a last-write-wins
        // overwrite of the whole billing subdocument.
        const grantedUser = await User.findOneAndUpdate(
          { _id: claimed.user },
          {
            $set: {
              'billing.plan': claimed.plan,
              'billing.status': 'active',
              'billing.provider': 'payme',
              'billing.paymeTransactionId': claimed.paycomTransactionId,
              'billing.currentPeriodEnd': periodEnd,
              'billing.cancelAtPeriodEnd': false,
            },
          },
          { new: true }
        );

        if (!grantedUser) {
          // The user account no longer exists - roll the transaction back to state 1 rather
          // than stranding it as "performed" with nothing actually granted.
          await PaymeTransaction.updateOne({ _id: claimed._id, state: 2 }, { $set: { state: 1 }, $unset: { performTime: 1 } });
          return res.json({ error: PAYME_ERRORS.COULD_NOT_PERFORM, id });
        }

        recordBillingEvent('payment_completed', claimed.user, { provider: 'payme', plan: claimed.plan, amount: claimed.amount });
        return res.json({ result: { transaction: String(claimed._id), perform_time: performTime, state: 2 }, id });
      }

      case 'CancelTransaction': {
        const paycomTransactionId = String(params?.id || '');
        const cancelTime = Date.now();
        const reason = Number(params?.reason) || null;

        // Atomic, state-guarded cancel: try to claim it from state 2 (performed) first, then
        // from state 1 (pending) - whichever the document's real current state is. This closes
        // the same TOCTOU window as PerformTransaction: a stale snapshot can no longer decide
        // whether billing needs revoking.
        const claimedPerformed = await PaymeTransaction.findOneAndUpdate(
          { paycomTransactionId, state: 2 },
          { $set: { state: -2, cancelTime, reason } },
          { new: true }
        );

        if (claimedPerformed) {
          // Atomic revoke, conditioned on this still being the transaction that granted the
          // plan - a newer Payme transaction on the same account won't be clobbered.
          await User.updateOne(
            { _id: claimedPerformed.user, 'billing.paymeTransactionId': claimedPerformed.paycomTransactionId },
            { $set: { 'billing.plan': 'none', 'billing.status': 'canceled' } }
          );
          recordBillingEvent('subscription_cancelled', claimedPerformed.user, { provider: 'payme', plan: claimedPerformed.plan, reason });
          return res.json({ result: { transaction: String(claimedPerformed._id), cancel_time: cancelTime, state: -2, reason }, id });
        }

        const claimedPending = await PaymeTransaction.findOneAndUpdate(
          { paycomTransactionId, state: 1 },
          { $set: { state: -1, cancelTime, reason } },
          { new: true }
        );

        if (claimedPending) {
          return res.json({ result: { transaction: String(claimedPending._id), cancel_time: cancelTime, state: -1, reason }, id });
        }

        // Neither guarded update matched: either the transaction doesn't exist, or it's
        // already cancelled - Cancel is always idempotent-successful in the Payme spec.
        const txn = await PaymeTransaction.findOne({ paycomTransactionId });
        if (!txn) {
          return res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
        }
        return res.json({ result: { transaction: String(txn._id), cancel_time: txn.cancelTime, state: txn.state, reason: txn.reason }, id });
      }

      case 'CheckTransaction': {
        const paycomTransactionId = String(params?.id || '');
        const txn = await PaymeTransaction.findOne({ paycomTransactionId });
        if (!txn) {
          return res.json({ error: PAYME_ERRORS.TRANSACTION_NOT_FOUND, id });
        }

        return res.json({
          result: {
            create_time: txn.createTime,
            perform_time: txn.performTime,
            cancel_time: txn.cancelTime,
            transaction: String(txn._id),
            state: txn.state,
            reason: txn.reason,
          },
          id,
        });
      }

      default:
        return res.status(200).json({ error: PAYME_ERRORS.METHOD_NOT_FOUND, id });
    }
  } catch (error) {
    logger.error('Payme webhook error:', { message: error.message });
    return res.status(200).json({ error: PAYME_ERRORS.SYSTEM_ERROR, id: id ?? null });
  }
};

// Click's Merchant Shop-API error codes (https://docs.click.uz - merchant cabinet). Unlike
// Payme's JSON-RPC error objects, Click expects a flat { error, error_note } pair on every
// response, success included (error: 0).
const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  INVALID_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  USER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE: -7,
  ERROR_IN_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
};

const clickReply = (data, error, errorNote) => ({ ...data, error, error_note: errorNote });

// Click signs every webhook call with an MD5 hash of a specific field concatenation, order
// matters, and the Complete call (action=1) additionally includes merchant_prepare_id in the
// hashed string. This is Click's documented algorithm as of this integration - verify it
// against the merchant cabinet's own API reference once real CLICK_SECRET_KEY credentials are
// issued, the same way Payme's integration was verified against its own docs at setup time.
const verifyClickSignature = (params, secretKey) => {
  const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time, sign_string } = params;
  if (!sign_string) return false;

  const isComplete = Number(action) === 1;
  const pieces = isComplete
    ? [click_trans_id, service_id, secretKey, merchant_trans_id, merchant_prepare_id, amount, action, sign_time]
    : [click_trans_id, service_id, secretKey, merchant_trans_id, amount, action, sign_time];

  const expected = crypto.createHash('md5').update(pieces.map((piece) => (piece ?? '')).join('')).digest('hex');
  return expected === String(sign_string);
};

// merchant_trans_id is a single opaque string field (Click has no structured "account" object
// the way Payme does) - built client-side as "<userId>:<planKey>:<nonce>" when the checkout
// redirect is constructed (see ClickCheckoutButton.tsx). The nonce only exists so a user
// retrying the same plan doesn't reuse an identical merchant_trans_id across attempts.
const parseMerchantTransId = (merchantTransId) => {
  const [userId, planKey] = String(merchantTransId || '').split(':');
  return { userId, planKey };
};

const handleClickPrepare = async (params, res) => {
  const { click_trans_id, merchant_trans_id, amount } = params;
  const echo = { click_trans_id, merchant_trans_id };

  const { userId, planKey } = parseMerchantTransId(merchant_trans_id);
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.json(clickReply(echo, CLICK_ERROR.USER_NOT_FOUND, 'User not found'));
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.json(clickReply(echo, CLICK_ERROR.USER_NOT_FOUND, 'User not found'));
  }

  const plan = findBillingPlan(planKey);
  if (!plan || !plan.priceUzs) {
    return res.json(clickReply(echo, CLICK_ERROR.ERROR_IN_REQUEST, 'Invalid plan'));
  }

  // Click sends amount as a decimal so'm string (e.g. "39000.00"); a small epsilon avoids a
  // false mismatch from floating-point round-tripping, unlike Payme's tiyin (always integer).
  const expectedAmount = plan.priceUzs;
  if (!Number.isFinite(Number(amount)) || Math.abs(Number(amount) - expectedAmount) > 1) {
    return res.json(clickReply(echo, CLICK_ERROR.INVALID_AMOUNT, 'Invalid amount'));
  }

  // Idempotent replay: a retried Prepare for a click_trans_id we've already seen must echo the
  // same merchant_prepare_id, never generate a second one.
  const existing = await ClickTransaction.findOne({ clickTransId: String(click_trans_id) });
  if (existing) {
    return res.json(clickReply({ ...echo, merchant_prepare_id: existing.merchantPrepareId }, CLICK_ERROR.SUCCESS, 'Success'));
  }

  const merchantPrepareId = new mongoose.Types.ObjectId().toString();
  const createTime = Date.now();
  try {
    await ClickTransaction.create({
      clickTransId: String(click_trans_id),
      merchantTransId: String(merchant_trans_id),
      merchantPrepareId,
      user: user._id,
      plan: planKey,
      amount: Number(amount),
      state: 0,
      createTime,
    });
  } catch (createError) {
    // Two concurrent Prepare calls for the same click_trans_id (a plausible Click retry) can
    // both pass the findOne above as null - the unique index on clickTransId then rejects the
    // loser, which must resolve to the same idempotent-replay reply the winner gets.
    if (createError?.code !== 11000) throw createError;
    const raced = await ClickTransaction.findOne({ clickTransId: String(click_trans_id) });
    if (raced) {
      return res.json(clickReply({ ...echo, merchant_prepare_id: raced.merchantPrepareId }, CLICK_ERROR.SUCCESS, 'Success'));
    }
    throw createError;
  }

  return res.json(clickReply({ ...echo, merchant_prepare_id: merchantPrepareId }, CLICK_ERROR.SUCCESS, 'Success'));
};

const handleClickComplete = async (params, res) => {
  const { click_trans_id, merchant_trans_id, merchant_prepare_id, error: clickReportedError } = params;
  const echo = { click_trans_id, merchant_trans_id, merchant_confirm_id: merchant_prepare_id };

  const txn = await ClickTransaction.findOne({ clickTransId: String(click_trans_id), merchantPrepareId: String(merchant_prepare_id || '') });
  if (!txn) {
    return res.json(clickReply({ click_trans_id, merchant_trans_id }, CLICK_ERROR.TRANSACTION_NOT_FOUND, 'Transaction not found'));
  }

  // Click reports its own payment outcome via `error` on the Complete call - a nonzero value
  // means the charge itself failed on Click's side (declined card, timeout, etc.); mark our
  // record cancelled and never grant.
  if (Number(clickReportedError) !== 0) {
    await ClickTransaction.updateOne({ _id: txn._id, state: 0 }, { $set: { state: -1, cancelTime: Date.now() } });
    return res.json(clickReply(echo, CLICK_ERROR.SUCCESS, 'Success'));
  }

  if (txn.state === 1) {
    // Idempotent replay - already granted, don't re-grant.
    return res.json(clickReply(echo, CLICK_ERROR.SUCCESS, 'Already paid'));
  }
  if (txn.state !== 0) {
    return res.json(clickReply({ click_trans_id, merchant_trans_id }, CLICK_ERROR.TRANSACTION_CANCELLED, 'Transaction cancelled'));
  }

  const performTime = Date.now();
  // Atomic, state-guarded claim - only the request that actually flips state 0 -> 1 proceeds
  // to grant the plan, mirroring PerformTransaction's race-safety above.
  const claimed = await ClickTransaction.findOneAndUpdate(
    { _id: txn._id, state: 0 },
    { $set: { state: 1, performTime } },
    { new: false }
  );

  if (!claimed) {
    // Lost the race to another concurrent Complete for the same transaction - reply
    // idempotently rather than granting twice.
    return res.json(clickReply(echo, CLICK_ERROR.SUCCESS, 'Already paid'));
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const grantedUser = await User.findOneAndUpdate(
    { _id: claimed.user },
    {
      $set: {
        'billing.plan': claimed.plan,
        'billing.status': 'active',
        'billing.provider': 'click',
        'billing.clickTransactionId': claimed.clickTransId,
        'billing.currentPeriodEnd': periodEnd,
        'billing.cancelAtPeriodEnd': false,
      },
    },
    { new: true }
  );

  if (!grantedUser) {
    // The user account no longer exists - roll the transaction back to state 0 rather than
    // stranding it as "performed" with nothing actually granted.
    await ClickTransaction.updateOne({ _id: claimed._id, state: 1 }, { $set: { state: 0 }, $unset: { performTime: 1 } });
    return res.json(clickReply({ click_trans_id, merchant_trans_id }, CLICK_ERROR.USER_NOT_FOUND, 'User not found'));
  }

  recordBillingEvent('payment_completed', claimed.user, { provider: 'click', plan: claimed.plan, amount: claimed.amount });
  return res.json(clickReply(echo, CLICK_ERROR.SUCCESS, 'Success'));
};

export const handleClickRequest = async (req, res) => {
  const params = req.body || {};

  try {
    const secretKey = getClickSecretKey();
    if (!secretKey || !verifyClickSignature(params, secretKey)) {
      return res.json(clickReply(
        { click_trans_id: params.click_trans_id, merchant_trans_id: params.merchant_trans_id },
        CLICK_ERROR.SIGN_FAILED,
        'SIGN CHECK FAILED!'
      ));
    }

    const action = Number(params.action);
    if (action === 0) return await handleClickPrepare(params, res);
    if (action === 1) return await handleClickComplete(params, res);

    return res.json(clickReply(
      { click_trans_id: params.click_trans_id, merchant_trans_id: params.merchant_trans_id },
      CLICK_ERROR.ACTION_NOT_FOUND,
      'Action not found'
    ));
  } catch (error) {
    logger.error('Click webhook error:', { message: error.message });
    return res.json(clickReply(
      { click_trans_id: params.click_trans_id, merchant_trans_id: params.merchant_trans_id },
      CLICK_ERROR.ERROR_IN_REQUEST,
      'Internal server error'
    ));
  }
};
