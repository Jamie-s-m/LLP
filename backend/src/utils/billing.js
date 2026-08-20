import Stripe from 'stripe';

const frontendAppUrl = process.env.FRONTEND_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const billingPlans = [
  {
    key: 'learner',
    name: 'Learner',
    priceId: process.env.STRIPE_PRICE_LEARNER_MONTHLY || '',
    priceLabel: '$19/month',
    roleHint: 'student',
    description: 'For individual students building daily momentum.',
  },
  {
    key: 'family',
    name: 'Family',
    priceId: process.env.STRIPE_PRICE_FAMILY_MONTHLY || '',
    priceLabel: '$39/month',
    roleHint: 'parent',
    description: 'For parents supporting one or more learners together.',
  },
  {
    key: 'teaching',
    name: 'Teaching team',
    priceId: process.env.STRIPE_PRICE_TEACHING_MONTHLY || '',
    priceLabel: '$99/month',
    roleHint: 'teacher',
    description: 'For teachers or academies running guided programs.',
  },
];

let stripeClient;

export const getFrontendAppUrl = () => frontendAppUrl;

export const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing.');
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
};

export const getBillingPlans = () =>
  billingPlans.map((plan) => ({
    ...plan,
    available: Boolean(plan.priceId),
  }));

export const findBillingPlan = (key) => billingPlans.find((plan) => plan.key === key);

export const findPlanByPriceId = (priceId) =>
  billingPlans.find((plan) => plan.priceId && plan.priceId === priceId);

export const serializeBilling = (billing = {}) => ({
  plan: billing.plan || 'none',
  status: billing.status || 'inactive',
  currentPeriodEnd: billing.currentPeriodEnd || null,
  cancelAtPeriodEnd: Boolean(billing.cancelAtPeriodEnd),
});
