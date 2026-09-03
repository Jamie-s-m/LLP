import { findBillingPlan, getBillingPlans, serializeBilling } from '../src/utils/billing.js';

describe('billing configuration helpers', () => {
  it('returns the expected commercial plan catalog', () => {
    const plans = getBillingPlans();

    expect(plans.map((plan) => plan.key)).toEqual(['learner', 'family', 'teaching']);
    expect(plans.every((plan) => typeof plan.available === 'boolean')).toBe(true);
    expect(plans.every((plan) => typeof plan.priceUzs === 'number' && plan.priceUzs > 0)).toBe(true);
  });

  it('finds known plans and ignores unknown plan keys', () => {
    expect(findBillingPlan('learner')).toEqual(expect.objectContaining({ key: 'learner', name: 'Learner', priceUzs: 55000 }));
    expect(findBillingPlan('missing-plan')).toBeUndefined();
  });

  it('derives priceLabel from priceUzs rather than a second hand-maintained string', () => {
    const learner = getBillingPlans().find((plan) => plan.key === 'learner');
    expect(learner.priceLabel).toBe("55,000 so'm/month");
  });

  it('every plan is available whenever either Payme or Click is configured - Stripe removed the per-plan price-ID gate', async () => {
    const previousPaymeId = process.env.PAYME_MERCHANT_ID;
    const previousClickServiceId = process.env.CLICK_SERVICE_ID;

    try {
      delete process.env.PAYME_MERCHANT_ID;
      delete process.env.CLICK_SERVICE_ID;
      expect(getBillingPlans().every((plan) => plan.available === false)).toBe(true);

      process.env.PAYME_MERCHANT_ID = 'test-merchant';
      expect(getBillingPlans().every((plan) => plan.available === true)).toBe(true);

      delete process.env.PAYME_MERCHANT_ID;
      process.env.CLICK_SERVICE_ID = 'test-service';
      expect(getBillingPlans().every((plan) => plan.available === true)).toBe(true);
    } finally {
      if (previousPaymeId === undefined) delete process.env.PAYME_MERCHANT_ID;
      else process.env.PAYME_MERCHANT_ID = previousPaymeId;
      if (previousClickServiceId === undefined) delete process.env.CLICK_SERVICE_ID;
      else process.env.CLICK_SERVICE_ID = previousClickServiceId;
    }
  });

  it('serializes billing status into the public shape', () => {
    expect(
      serializeBilling({
        plan: 'family',
        status: 'active',
        provider: 'payme',
        currentPeriodEnd: new Date('2030-01-01T00:00:00.000Z'),
        cancelAtPeriodEnd: true,
      })
    ).toEqual({
      plan: 'family',
      status: 'active',
      provider: 'payme',
      currentPeriodEnd: new Date('2030-01-01T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
    });
  });
});
