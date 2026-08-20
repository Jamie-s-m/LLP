import User from '../models/User.js';
import { findBillingPlan, findPlanByPriceId, getBillingPlans, getFrontendAppUrl, getStripeClient, serializeBilling } from '../utils/billing.js';

const activeStatuses = new Set(['trialing', 'active', 'past_due', 'unpaid', 'incomplete']);

const applySubscriptionToUser = async ({ customerId, subscriptionId, priceId, status, currentPeriodEnd, cancelAtPeriodEnd, metadata = {} }) => {
  const plan = findPlanByPriceId(priceId)?.key || metadata.plan || 'none';
  const user = customerId
    ? await User.findOne({ 'billing.stripeCustomerId': customerId })
    : null;

  const targetUser = user || (metadata.userId ? await User.findById(metadata.userId) : null);
  if (!targetUser) {
    return null;
  }

  if (!targetUser.billing) {
    targetUser.billing = {};
  }

  targetUser.billing.plan = status === 'canceled' ? 'none' : plan;
  targetUser.billing.status = status || 'inactive';
  targetUser.billing.stripeCustomerId = customerId || targetUser.billing.stripeCustomerId || '';
  targetUser.billing.stripeSubscriptionId = status === 'canceled' ? '' : (subscriptionId || '');
  targetUser.billing.stripePriceId = status === 'canceled' ? '' : (priceId || '');
  targetUser.billing.currentPeriodEnd = currentPeriodEnd || null;
  targetUser.billing.cancelAtPeriodEnd = Boolean(cancelAtPeriodEnd);
  await targetUser.save();
  return targetUser;
};

export const getBillingPlansController = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      provider: 'stripe',
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      plans: getBillingPlans(),
    },
  });
};

export const getMyBillingState = async (req, res) => {
  const user = await User.findById(req.user.id).select('billing email firstName lastName role');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      billing: serializeBilling(user.billing),
      hasCustomerPortal: Boolean(user.billing?.stripeCustomerId),
      canStartCheckout: !activeStatuses.has(user.billing?.status || 'inactive'),
    },
  });
};

export const createCheckoutSession = async (req, res) => {
  try {
    const selectedPlan = findBillingPlan(String(req.body.plan || ''));
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: 'A valid billing plan is required' });
    }

    if (!selectedPlan.priceId) {
      return res.status(503).json({ success: false, message: `${selectedPlan.name} is not configured for checkout yet` });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (activeStatuses.has(user.billing?.status || 'inactive')) {
      return res.status(409).json({
        success: false,
        message: 'This account already has an active or pending subscription. Open the billing portal to manage it.',
      });
    }

    const stripe = getStripeClient();
    let customerId = user.billing?.stripeCustomerId || '';
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: { userId: user.id.toString() },
      });
      customerId = customer.id;
      user.billing = {
        ...user.billing,
        stripeCustomerId: customerId,
      };
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id.toString(),
        plan: selectedPlan.key,
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          plan: selectedPlan.key,
        },
      },
      success_url: `${getFrontendAppUrl()}/pricing?checkout=success`,
      cancel_url: `${getFrontendAppUrl()}/pricing?checkout=canceled`,
    });

    return res.status(200).json({
      success: true,
      data: {
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Create Checkout Session Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Checkout could not be started' });
  }
};

export const createPortalSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('billing');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.billing?.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No Stripe customer exists for this account yet' });
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.billing.stripeCustomerId,
      return_url: `${getFrontendAppUrl()}/pricing`,
    });

    return res.status(200).json({ success: true, data: { url: session.url } });
  } catch (error) {
    console.error('Create Billing Portal Session Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Billing portal could not be opened' });
  }
};

export const handleStripeWebhook = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Stripe webhook signature configuration is missing' });
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.mode === 'subscription') {
        await applySubscriptionToUser({
          customerId: typeof session.customer === 'string' ? session.customer : '',
          subscriptionId: typeof session.subscription === 'string' ? session.subscription : '',
          priceId: '',
          status: 'incomplete',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          metadata: session.metadata || {},
        });
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object;
      const priceId = subscription.items?.data?.[0]?.price?.id || '';
      await applySubscriptionToUser({
        customerId: typeof subscription.customer === 'string' ? subscription.customer : '',
        subscriptionId: subscription.id,
        priceId,
        status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
        metadata: subscription.metadata || {},
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe Webhook Error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Stripe webhook handling failed' });
  }
};
