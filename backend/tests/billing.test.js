import { findBillingPlan, getBillingPlans, serializeBilling } from '../src/utils/billing.js';

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
