import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import PaymeTransaction from '../src/models/PaymeTransaction.js';

describe('Payme merchant webhook (/api/billing/payme)', () => {
  let learner;
  const AMOUNT_LEARNER = 800000 * 100; // priceUzs -> tiyin

  const authHeader = () => `Basic ${Buffer.from(`Paycom:${process.env.PAYME_MERCHANT_KEY}`).toString('base64')}`;

  const rpc = (body) =>
    request(app)
      .post('/api/billing/payme')
      .set('Authorization', authHeader())
      .send({ jsonrpc: '2.0', id: 1, ...body });

  beforeAll(async () => {
    expect(process.env.PAYME_MERCHANT_KEY).toBeTruthy();

    learner = await User.create({
      firstName: 'Payme',
      lastName: 'Payer',
      email: 'payme-payer@example.com',
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
    });
  });

  afterAll(async () => {
    await PaymeTransaction.deleteMany({ user: learner._id });
    await User.deleteOne({ _id: learner._id });
  });

  test('rejects requests with no/wrong Basic auth', async () => {
    const noAuth = await request(app).post('/api/billing/payme').send({ jsonrpc: '2.0', id: 1, method: 'CheckPerformTransaction', params: {} });
    expect(noAuth.body.error.code).toBe(-32504);

    const wrongAuth = await request(app)
      .post('/api/billing/payme')
      .set('Authorization', `Basic ${Buffer.from('Paycom:wrong-key').toString('base64')}`)
      .send({ jsonrpc: '2.0', id: 1, method: 'CheckPerformTransaction', params: {} });
    expect(wrongAuth.body.error.code).toBe(-32504);
  });

  test('unknown method returns -32601', async () => {
    const res = await rpc({ method: 'NotARealMethod', params: {} });
    expect(res.body.error.code).toBe(-32601);
  });

  test('CheckPerformTransaction rejects an unknown user_id', async () => {
    const res = await rpc({
      method: 'CheckPerformTransaction',
      params: { amount: AMOUNT_LEARNER, account: { user_id: '64b64b64b64b64b64b64b64', plan: 'learner' } },
    });
    expect(res.body.error.code).toBe(-31050);
    expect(res.body.error.data).toBe('user_id');
  });

  test('CheckPerformTransaction rejects an unknown plan', async () => {
    const res = await rpc({
      method: 'CheckPerformTransaction',
      params: { amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'not-a-plan' } },
    });
    expect(res.body.error.code).toBe(-31050);
    expect(res.body.error.data).toBe('plan');
  });

  test('CheckPerformTransaction rejects a mismatched amount', async () => {
    const res = await rpc({
      method: 'CheckPerformTransaction',
      params: { amount: 1, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });
    expect(res.body.error.code).toBe(-31001);
  });

  test('CheckPerformTransaction allows a valid learner-plan request', async () => {
    const res = await rpc({
      method: 'CheckPerformTransaction',
      params: { amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });
    expect(res.body.result.allow).toBe(true);
  });

  test('full lifecycle: create -> perform grants the plan -> cancel revokes it', async () => {
    const paycomId = 'paycom_txn_lifecycle_1';

    const create1 = await rpc({
      method: 'CreateTransaction',
      params: { id: paycomId, time: Date.now(), amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });
    expect(create1.body.result.state).toBe(1);
    const createTime = create1.body.result.create_time;

    // Idempotent replay: same id, same create_time echoed back, not regenerated.
    const create2 = await rpc({
      method: 'CreateTransaction',
      params: { id: paycomId, time: Date.now(), amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });
    expect(create2.body.result.create_time).toBe(createTime);

    // A second, different transaction for the same user+plan while one is still pending must conflict.
    const conflicting = await rpc({
      method: 'CreateTransaction',
      params: { id: 'paycom_txn_conflict', time: Date.now(), amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });
    expect(conflicting.body.error.code).toBe(-31008);

    const perform1 = await rpc({ method: 'PerformTransaction', params: { id: paycomId } });
    expect(perform1.body.result.state).toBe(2);
    const performTime = perform1.body.result.perform_time;

    const grantedUser = await User.findById(learner._id);
    expect(grantedUser.billing.plan).toBe('learner');
    expect(grantedUser.billing.status).toBe('active');
    expect(grantedUser.billing.paymeTransactionId).toBe(paycomId);
    expect(new Date(grantedUser.billing.currentPeriodEnd).getTime()).toBeGreaterThan(Date.now());

    // Idempotent replay: performing again returns the same perform_time, doesn't error or double-grant.
    const perform2 = await rpc({ method: 'PerformTransaction', params: { id: paycomId } });
    expect(perform2.body.result.perform_time).toBe(performTime);

    const check = await rpc({ method: 'CheckTransaction', params: { id: paycomId } });
    expect(check.body.result.state).toBe(2);
    expect(check.body.result.perform_time).toBe(performTime);

    const cancel1 = await rpc({ method: 'CancelTransaction', params: { id: paycomId, reason: 5 } });
    expect(cancel1.body.result.state).toBe(-2); // cancelled after having been performed

    const revokedUser = await User.findById(learner._id);
    expect(revokedUser.billing.plan).toBe('none');
    expect(revokedUser.billing.status).toBe('canceled');

    // Cancel is idempotent-successful, not an error, on replay.
    const cancel2 = await rpc({ method: 'CancelTransaction', params: { id: paycomId, reason: 5 } });
    expect(cancel2.body.result.state).toBe(-2);
    expect(cancel2.body.result.cancel_time).toBe(cancel1.body.result.cancel_time);
  });

  test('PerformTransaction/CancelTransaction/CheckTransaction on an unknown id return -31003', async () => {
    const perform = await rpc({ method: 'PerformTransaction', params: { id: 'does-not-exist' } });
    expect(perform.body.error.code).toBe(-31003);

    const cancel = await rpc({ method: 'CancelTransaction', params: { id: 'does-not-exist', reason: 1 } });
    expect(cancel.body.error.code).toBe(-31003);

    const check = await rpc({ method: 'CheckTransaction', params: { id: 'does-not-exist' } });
    expect(check.body.error.code).toBe(-31003);
  });

  test('cancelling a still-pending (never performed) transaction never grants the plan', async () => {
    const paycomId = 'paycom_txn_cancel_before_perform';

    await rpc({
      method: 'CreateTransaction',
      params: { id: paycomId, time: Date.now(), amount: AMOUNT_LEARNER, account: { user_id: learner._id.toString(), plan: 'learner' } },
    });

    const cancel = await rpc({ method: 'CancelTransaction', params: { id: paycomId, reason: 4 } });
    expect(cancel.body.result.state).toBe(-1); // cancelled while still pending, never performed

    const untouchedUser = await User.findById(learner._id);
    expect(untouchedUser.billing.plan).toBe('none');
  });
});
