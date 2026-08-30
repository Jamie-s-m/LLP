import request from 'supertest';
import { findBillingPlan, getBillingPlans, serializeBilling } from '../src/utils/billing.js';
import app from '../src/app.js';

describe('billing configuration helpers', () => {
  it('returns the expected commercial plan catalog', () => {
    const plans = getBillingPlans();

    expect(plans.map((plan) => plan.key)).toEqual(['learner', 'family', 'teaching']);
    expect(plans.every((plan) => typeof plan.available === 'boolean')).toBe(true);
  });

  it('finds known plans and ignores unknown plan keys', () => {
    expect(findBillingPlan('learner')).toEqual(expect.objectContaining({ key: 'learner', name: 'Learner' }));
    expect(findBillingPlan('missing-plan')).toBeUndefined();
  });

  it('serializes billing status into the public auth-safe shape', () => {
    expect(
      serializeBilling({
        plan: 'family',
        status: 'active',
        currentPeriodEnd: new Date('2030-01-01T00:00:00.000Z'),
        cancelAtPeriodEnd: true,
        stripeCustomerId: 'cus_hidden',
      })
    ).toEqual({
      plan: 'family',
      status: 'active',
      currentPeriodEnd: new Date('2030-01-01T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
    });
  });
});

describe('Payme webhook auth', () => {
  it('rejects Basic "Paycom:" (empty password) when PAYME_MERCHANT_KEY is unset, instead of matching by default', async () => {
    expect(process.env.PAYME_MERCHANT_KEY).toBeFalsy();

    const emptyPasswordAuth = Buffer.from('Paycom:').toString('base64');
    const res = await request(app)
      .post('/api/billing/payme')
      .set('Authorization', `Basic ${emptyPasswordAuth}`)
      .send({ method: 'CheckPerformTransaction', params: {}, id: 1 });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
