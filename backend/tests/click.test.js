import crypto from 'crypto';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import ClickTransaction from '../src/models/ClickTransaction.js';

// Mirrors payme.test.js's structure and level of coverage for the equivalent Click flow
// (Prepare = action 0, Complete = action 1). Field names/signature algorithm here match
// billingController.js's own documented understanding of Click's Merchant Shop-API - see that
// file's comment on verifyClickSignature for the "verify against Click's live docs once real
// credentials exist" caveat this test suite inherits.
describe('Click merchant webhook (/api/billing/click)', () => {
  let learner;
  const AMOUNT_LEARNER = 55000; // priceUzs, so'm (not tiyin - Click's native unit)
  let transIdCounter = 0;
  const nextClickTransId = () => `click_txn_${Date.now()}_${transIdCounter++}`;

  const sign = (fields) => {
    const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time } = fields;
    const isComplete = Number(action) === 1;
    const pieces = isComplete
      ? [click_trans_id, service_id, process.env.CLICK_SECRET_KEY, merchant_trans_id, merchant_prepare_id, amount, action, sign_time]
      : [click_trans_id, service_id, process.env.CLICK_SECRET_KEY, merchant_trans_id, amount, action, sign_time];
    return crypto.createHash('md5').update(pieces.map((p) => p ?? '').join('')).digest('hex');
  };

  const call = (fields) => {
    const body = { service_id: process.env.CLICK_SERVICE_ID, sign_time: String(Date.now()), ...fields };
    body.sign_string = sign(body);
    return request(app).post('/api/billing/click').send(body);
  };

  const prepare = ({ clickTransId, merchantTransId, amount = AMOUNT_LEARNER }) =>
    call({ click_trans_id: clickTransId, merchant_trans_id: merchantTransId, amount, action: 0 });

  const complete = ({ clickTransId, merchantTransId, merchantPrepareId, amount = AMOUNT_LEARNER, error = 0 }) =>
    call({ click_trans_id: clickTransId, merchant_trans_id: merchantTransId, merchant_prepare_id: merchantPrepareId, amount, action: 1, error });

  beforeAll(async () => {
    expect(process.env.CLICK_SECRET_KEY).toBeTruthy();

    learner = await User.create({
      firstName: 'Click',
      lastName: 'Payer',
      email: 'click-payer@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await ClickTransaction.deleteMany({ user: learner._id });
    await User.deleteOne({ _id: learner._id });
  });

  test('rejects a request with a forged signature', async () => {
    const clickTransId = nextClickTransId();
    const merchantTransId = `${learner._id}:learner:nonce1`;
    const res = await request(app)
      .post('/api/billing/click')
      .send({
        click_trans_id: clickTransId,
        service_id: process.env.CLICK_SERVICE_ID,
        merchant_trans_id: merchantTransId,
        amount: AMOUNT_LEARNER,
        action: 0,
        sign_time: String(Date.now()),
        sign_string: 'not-a-real-signature',
      });
    expect(res.body.error).toBe(-1);

    const stored = await ClickTransaction.findOne({ clickTransId });
    expect(stored).toBeNull();
  });

  test('Prepare rejects an unknown user_id encoded in merchant_trans_id', async () => {
    const res = await prepare({ clickTransId: nextClickTransId(), merchantTransId: '64b64b64b64b64b64b64b64:learner:nonce' });
    expect(res.body.error).toBe(-5);
  });

  test('Prepare rejects an unknown plan', async () => {
    const res = await prepare({ clickTransId: nextClickTransId(), merchantTransId: `${learner._id}:not-a-plan:nonce` });
    expect(res.body.error).toBe(-8);
  });

  test('Prepare rejects a mismatched amount', async () => {
    const res = await prepare({ clickTransId: nextClickTransId(), merchantTransId: `${learner._id}:learner:nonce`, amount: 1 });
    expect(res.body.error).toBe(-2);
  });

  test('Prepare succeeds and is idempotent on replay for the same click_trans_id', async () => {
    const clickTransId = nextClickTransId();
    const merchantTransId = `${learner._id}:learner:nonce-idem`;

    const first = await prepare({ clickTransId, merchantTransId });
    expect(first.body.error).toBe(0);
    expect(first.body.merchant_prepare_id).toBeTruthy();

    const second = await prepare({ clickTransId, merchantTransId });
    expect(second.body.error).toBe(0);
    expect(second.body.merchant_prepare_id).toBe(first.body.merchant_prepare_id);

    const stored = await ClickTransaction.findOne({ clickTransId });
    expect(stored.state).toBe(0);
  });

  test('full lifecycle: Prepare then Complete grants the plan', async () => {
    const clickTransId = nextClickTransId();
    const merchantTransId = `${learner._id}:learner:nonce-lifecycle`;

    const prepared = await prepare({ clickTransId, merchantTransId });
    const merchantPrepareId = prepared.body.merchant_prepare_id;
    expect(merchantPrepareId).toBeTruthy();

    const completed = await complete({ clickTransId, merchantTransId, merchantPrepareId });
    expect(completed.body.error).toBe(0);
    expect(completed.body.merchant_confirm_id).toBe(merchantPrepareId);

    const grantedUser = await User.findById(learner._id);
    expect(grantedUser.billing.plan).toBe('learner');
    expect(grantedUser.billing.status).toBe('active');
    expect(grantedUser.billing.provider).toBe('click');
    expect(grantedUser.billing.clickTransactionId).toBe(clickTransId);
    expect(new Date(grantedUser.billing.currentPeriodEnd).getTime()).toBeGreaterThan(Date.now());

    // Idempotent replay: completing again must not double-grant or error.
    const replay = await complete({ clickTransId, merchantTransId, merchantPrepareId });
    expect(replay.body.error).toBe(0);

    const stillOneTransaction = await ClickTransaction.countDocuments({ clickTransId });
    expect(stillOneTransaction).toBe(1);
  });

  test('genuinely concurrent Complete calls for the same transaction grant the plan exactly once', async () => {
    const clickTransId = nextClickTransId();
    const merchantTransId = `${learner._id}:learner:nonce-concurrent`;
    const prepared = await prepare({ clickTransId, merchantTransId });
    const merchantPrepareId = prepared.body.merchant_prepare_id;

    const [first, second] = await Promise.all([
      complete({ clickTransId, merchantTransId, merchantPrepareId }),
      complete({ clickTransId, merchantTransId, merchantPrepareId }),
    ]);
    expect(first.body.error).toBe(0);
    expect(second.body.error).toBe(0);

    const txn = await ClickTransaction.findOne({ clickTransId });
    expect(txn.state).toBe(1);

    const grantedUser = await User.findById(learner._id);
    expect(grantedUser.billing.clickTransactionId).toBe(clickTransId);
  });

  test('Complete reporting a Click-side payment failure (error != 0) cancels the transaction and never grants', async () => {
    const clickTransId = nextClickTransId();
    const merchantTransId = `${learner._id}:learner:nonce-failed`;
    const prepared = await prepare({ clickTransId, merchantTransId });
    const merchantPrepareId = prepared.body.merchant_prepare_id;

    const before = await User.findById(learner._id);

    const failed = await complete({ clickTransId, merchantTransId, merchantPrepareId, error: -5017 });
    expect(failed.body.error).toBe(0); // merchant acknowledges receipt of the failure report

    const txn = await ClickTransaction.findOne({ clickTransId });
    expect(txn.state).toBe(-1);

    const after = await User.findById(learner._id);
    expect(after.billing.clickTransactionId).toBe(before.billing.clickTransactionId);
  });

  test('Complete for an unknown click_trans_id/merchant_prepare_id pair returns -6', async () => {
    const res = await complete({ clickTransId: 'does-not-exist', merchantTransId: `${learner._id}:learner:x`, merchantPrepareId: 'also-fake' });
    expect(res.body.error).toBe(-6);
  });

  test('an unrecognized action returns -3', async () => {
    const res = await call({
      click_trans_id: nextClickTransId(),
      merchant_trans_id: `${learner._id}:learner:nonce-badaction`,
      amount: AMOUNT_LEARNER,
      action: 5,
    });
    expect(res.body.error).toBe(-3);
  });
});
