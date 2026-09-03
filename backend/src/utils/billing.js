// Stripe was removed - it isn't available to merchants in Uzbekistan. Every plan is now sold
// exclusively through Payme and Click, both UZS-native, so there's no more USD/local split to
// track per plan (priceId, paymeOnly) - every plan carries one priceUzs and is available
// whenever at least one of the two local rails is configured.
const frontendAppUrl = process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

// Repriced against real Uzbekistan market data (Tashkent in-person English-center fees,
// Preply/Duolingo/Busuu/Babbel/Memrise/ELSA pricing where regionalized, national/Tashkent wage
// data - see the Phase 19 plan). The old "Local" (39,000) and "Learner" (800,000) plans were
// confirmed functionally identical - same feature list, no code path unlocked anything extra for
// the 20.5x-more-expensive Learner tier - so they've been consolidated into one plan under the
// `learner` key at Local's affordable price point, not Learner's old overpriced one.
//
// Family/Teaching are flat monthly prices for now, not seat/usage-based - a real per-additional-
// child add-on for Family and per-seat pricing for Teaching are both real future enhancements
// once there's actual demand signal to size them against (matching how Phase 10's tutor
// marketplace scope is gated on real demand rather than built speculatively), not something to
// invent checkout-quantity/proration logic for on a guess. Teaching team's price specifically has
// no solid local B2B comparable behind it (unlike the other three) and should be validated with
// real Tashkent teachers/academy owners before being treated as settled.
const billingPlans = [
  {
    key: 'learner',
    name: 'Learner',
    priceUzs: 55000,
    roleHint: 'student',
    description: "LinguaNest's full learner plan, priced for Uzbekistan and paid through Payme or Click.",
  },
  {
    key: 'family',
    name: 'Family',
    priceUzs: 149000,
    roleHint: 'parent',
    description: 'For parents supporting one or more learners together.',
  },
  {
    key: 'teaching',
    name: 'Teaching team',
    priceUzs: 350000,
    roleHint: 'teacher',
    description: 'For teachers or academies running guided programs.',
  },
];

export const getFrontendAppUrl = () => frontendAppUrl;

export const getPaymeMerchantId = () => process.env.PAYME_MERCHANT_ID || '';

export const getPaymeCheckoutBaseUrl = () => process.env.PAYME_CHECKOUT_URL || 'https://checkout.test.paycom.uz';

// service_id and merchant_id are two distinct identifiers Click issues per merchant - both are
// required on every checkout redirect and every webhook signature, per Click's Merchant
// Shop-API. merchant_id is sometimes called "merchant" in Click's own docs/dashboard.
export const getClickServiceId = () => process.env.CLICK_SERVICE_ID || '';

export const getClickMerchantId = () => process.env.CLICK_MERCHANT_ID || '';

export const getClickCheckoutBaseUrl = () => process.env.CLICK_CHECKOUT_URL || 'https://my.click.uz/services/pay';

// A plain string label built from priceUzs at read time, rather than a second hand-maintained
// field - eliminates the exact "priceLabel silently drifted out of sync with priceUzs" bug
// class (this migration's own audit found the old Learner/Family/Teaching labels were still
// USD strings like "$19/month" while priceUzs had always been the real UZS-denominated price).
const formatPriceLabel = (priceUzs) => `${priceUzs.toLocaleString('en-US')} so'm/month`;

export const getBillingPlans = () => {
  // Every plan is sold through both rails identically now - available whenever either is
  // configured. Kept as a per-plan computation (not one global flag) so a future plan that's
  // deliberately restricted to one rail can override this without changing the shape callers
  // already depend on.
  const available = Boolean(getPaymeMerchantId()) || Boolean(getClickServiceId());
  return billingPlans.map((plan) => ({
    ...plan,
    priceLabel: formatPriceLabel(plan.priceUzs),
    available,
  }));
};

export const findBillingPlan = (key) => billingPlans.find((plan) => plan.key === key);

export const serializeBilling = (billing = {}) => ({
  plan: billing.plan || 'none',
  status: billing.status || 'inactive',
  provider: billing.provider || 'none',
  currentPeriodEnd: billing.currentPeriodEnd || null,
  cancelAtPeriodEnd: Boolean(billing.cancelAtPeriodEnd),
});
