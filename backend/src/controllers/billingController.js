import crypto from 'crypto';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import {
  findBillingPlan,
  findPlanByPriceId,
  getBillingPlans,
  getFrontendAppUrl,
  getPaymeCheckoutBaseUrl,
  getPaymeMerchantId,
  getStripeClient,
  serializeBilling,
} from '../utils/billing.js';
import User from '../models/User.js';
import PaymeTransaction from '../models/PaymeTransaction.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import logger from '../utils/logger.js';

// Fire-and-forget: a webhook's job is to confirm payment with the provider and update
// billing state - it must return successfully to Stripe/Payme even if this insert fails.
const recordBillingEvent = (event, userId, metadata) => {
  AnalyticsEvent.create({ event, user: userId, metadata }).catch(() => {});
};

// Read lazily, not captured at module-load time: billingController.js is statically imported
// before app.js calls dotenv.config(), so a module-level constant would always read as empty
// in any process relying on a .env file (local dev, scripts) - only Render's directly-injected
// env vars happened to dodge that ordering issue.
const getPaymeMerchantKey = () => process.env.PAYME_MERCHANT_KEY || '';

export const getBillingPlansController = (_req, res) => {
  try {
    const merchantId = getPaymeMerchantId();
    return res.status(200).json({
      success: true,
      data: {
        plans: getBillingPlans(),
        payme: {
          available: Boolean(merchantId),
          merchantId,
          checkoutBaseUrl: getPaymeCheckoutBaseUrl(),
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
        canStartCheckout: Boolean(process.env.STRIPE_SECRET_KEY),
        hasCustomerPortal: Boolean(process.env.STRIPE_SECRET_KEY && billing?.stripeCustomerId),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load billing state' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { plan, planKey, planId } = req.body || {};
    const selectedPlan = getBillingPlans().find((item) => item.key === plan || item.key === planKey || item.key === planId);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'Billing plan not found' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && selectedPlan.priceId) {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
        success_url: `${getFrontendAppUrl()}/pricing?checkout=success`,
        cancel_url: `${getFrontendAppUrl()}/pricing?checkout=canceled`,
        customer_email: req.user.email,
        metadata: {
          userId: String(req.user._id),
          planKey: selectedPlan.key,
        },
      });

      return res.status(200).json({ success: true, data: { url: session.url, provider: 'stripe', plan: selectedPlan.key } });
    }

    return res.status(503).json({ success: false, message: 'Selected billing plan is not configured for checkout' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to create checkout session' });
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

export const handleStripeWebhook = async (req, res) => {
  const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers['stripe-signature'];

  if (!stripeSecret || !signature) {
    return res.status(501).json({ success: false, message: 'Stripe webhook is not configured on this server' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    const event = stripe.webhooks.constructEvent(req.body, signature, stripeSecret);

    const payload = event.data.object;
    const customerId = payload.customer || payload.customer_details?.id;
    const user = payload.metadata?.userId
      ? await User.findById(payload.metadata.userId)
      : customerId
        ? await User.findOne({ 'billing.stripeCustomerId': customerId })
        : payload.customer_email
          ? await User.findOne({ email: payload.customer_email.toLowerCase() })
          : null;

    if (!user) {
      return res.status(200).json({ success: true, received: true, type: event.type, ignored: true });
    }

    // Build the field updates first (pure computation, no writes yet), then apply them with a
    // single atomic, filter-guarded update instead of read -> mutate in memory -> save(). The
    // old pattern (findById earlier, then user.save() here) had a real TOCTOU window: two
    // genuinely concurrent deliveries of the same event (Stripe retries are routine) could both
    // pass the lastStripeEventId check before either wrote, double-applying the event. The
    // filter below (`lastStripeEventId: { $ne: event.id }`) closes that window the same way the
    // Payme handler's findOneAndUpdate calls already do elsewhere in this file - at most one
    // concurrent request can match it.
    const billing = user.billing || {};
    const updates = {};

    if (event.type === 'checkout.session.completed') {
      updates.stripeCustomerId = String(payload.customer || billing.stripeCustomerId || '');
      updates.stripeSubscriptionId = String(payload.subscription || billing.stripeSubscriptionId || '');
      updates.plan = payload.metadata?.planKey || billing.plan || 'none';
      updates.provider = 'stripe';
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const priceId = payload.items?.data?.[0]?.price?.id || '';
      const plan = findPlanByPriceId(priceId);
      updates.stripeCustomerId = String(payload.customer || billing.stripeCustomerId || '');
      updates.stripeSubscriptionId = String(payload.id || billing.stripeSubscriptionId || '');
      updates.stripePriceId = priceId;
      updates.plan = plan?.key || billing.plan || 'none';
      updates.provider = 'stripe';
      updates.status = event.type === 'customer.subscription.deleted' ? 'canceled' : payload.status || 'inactive';
      updates.currentPeriodEnd = payload.current_period_end ? new Date(payload.current_period_end * 1000) : null;
      updates.cancelAtPeriodEnd = Boolean(payload.cancel_at_period_end);
    }

    if (event.type === 'invoice.payment_failed') {
      updates.status = 'past_due';
    }

    // A full refund revokes access the same way a cancellation does (billing.status just needs
    // to not be 'active' - see serializeBilling/access checks elsewhere). A partial refund does
    // NOT change access by itself - Stripe doesn't revoke a subscription for a partial refund -
    // so billing state is deliberately left untouched; only the analytics event below records
    // it, for revenue accounting.
    let isFullRefund = false;
    if (event.type === 'charge.refunded') {
      const amount = Number(payload.amount) || 0;
      const amountRefunded = Number(payload.amount_refunded) || 0;
      isFullRefund = amount > 0 && amountRefunded >= amount;
      if (isFullRefund) {
        updates.status = 'refunded';
      }
    }

    // event.created is when Stripe generated the event, not when it was delivered - Stripe
    // does not guarantee delivery order, so a same-event-id dedup alone isn't enough: a
    // subscription.updated that logically happened BEFORE a later subscription.deleted can
    // still arrive AFTER it (retry, redelivery, network reordering) and would silently revert
    // real billing state back to active with no error. Requiring this event to be at least as
    // new as whatever was last applied closes that window the same way the event-id check
    // closes the exact-duplicate window.
    const eventCreatedAt = event.created ? new Date(event.created * 1000) : new Date();
    updates.lastStripeEventId = event.id;
    updates.lastStripeEventCreatedAt = eventCreatedAt;
    const setPayload = Object.fromEntries(Object.entries(updates).map(([key, value]) => [`billing.${key}`, value]));

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        'billing.lastStripeEventId': { $ne: event.id },
        $or: [
          { 'billing.lastStripeEventCreatedAt': null },
          { 'billing.lastStripeEventCreatedAt': { $lte: eventCreatedAt } },
        ],
      },
      { $set: setPayload },
      { new: true }
    );

    if (!updatedUser) {
      // Distinguish an exact redelivery (same event id - a true no-op) from an out-of-order
      // event (different id, but older than what's already applied - correctly ignored, not
      // an error) for observability; both cases skip writing.
      const current = await User.findById(user._id).select('billing.lastStripeEventId');
      const isDuplicate = current?.billing?.lastStripeEventId === event.id;
      return res.status(200).json({
        success: true,
        received: true,
        type: event.type,
        duplicate: isDuplicate,
        outOfOrder: !isDuplicate,
      });
    }

    if (event.type === 'checkout.session.completed') {
      recordBillingEvent('payment_completed', updatedUser._id, { provider: 'stripe', plan: updatedUser.billing.plan });
    }
    if (event.type === 'customer.subscription.deleted') {
      recordBillingEvent('subscription_cancelled', updatedUser._id, { provider: 'stripe', plan: updatedUser.billing.plan });
    }
    if (event.type === 'charge.refunded') {
      recordBillingEvent('payment_refunded', updatedUser._id, {
        provider: 'stripe',
        plan: updatedUser.billing.plan,
        full: isFullRefund,
        amountRefunded: Number(payload.amount_refunded) || 0,
      });
    }

    return res.status(200).json({ success: true, received: true, type: event.type });
  } catch (error) {
    logger.error('Stripe webhook error:', { message: error.message });
    return res.status(400).json({ success: false, message: 'Invalid Stripe signature' });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const customerId = req.user?.billing?.stripeCustomerId;
    if (!process.env.STRIPE_SECRET_KEY || !customerId) {
      return res.status(400).json({ success: false, message: 'Billing portal is not available for this account' });
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getFrontendAppUrl()}/pricing`,
    });

    return res.status(200).json({ success: true, data: { url: session.url } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to open billing portal' });
  }
};