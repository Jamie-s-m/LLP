import Stripe from 'stripe';
import { findPlanByPriceId, getBillingPlans, getFrontendAppUrl, getStripeClient, serializeBilling } from '../utils/billing.js';
import User from '../models/User.js';

const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY || '';
export const getBillingPlansController = (_req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: { plans: getBillingPlans() },
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
  // An unset merchant key must never authenticate - otherwise Basic "Paycom:" (empty password)
  // would pass once PAYME_MERCHANT_KEY defaults to '', before the integration is configured.
  if (!PAYME_MERCHANT_KEY) return false;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) return false;

  const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('ascii');
  const [login, password] = credentials.split(':');

  return login === 'Paycom' && password === PAYME_MERCHANT_KEY;
};

export const handlePaymeRequest = async (req, res) => {
  if (!validatePaymeAuth(req)) {
    return res.status(401).json({
      error: { code: -32504, message: { ru: 'Неавторизован', en: 'Unauthorized' } },
      id: req.body?.id || null,
    });
  }

  const { method, params, id } = req.body || {};

  try {
    switch (method) {
      case 'CheckPerformTransaction':
        return res.json({ result: { allow: true }, id });
      case 'CreateTransaction':
        return res.json({
          result: {
            create_time: Date.now(),
            transaction: String(params?.account?.id || 'payme_internal_txn'),
            state: 1,
          },
          id,
        });
      case 'PerformTransaction':
        return res.json({
          result: {
            perform_time: Date.now(),
            transaction: String(params?.transaction || 'payme_internal_txn'),
            state: 2,
          },
          id,
        });
      case 'CancelTransaction':
        return res.json({
          result: {
            cancel_time: Date.now(),
            transaction: String(params?.transaction || 'payme_internal_txn'),
            state: -1,
          },
          id,
        });
      case 'CheckTransaction':
        return res.json({
          result: {
            create_time: Date.now(),
            perform_time: Date.now(),
            cancel_time: 0,
            transaction: String(params?.transaction || 'payme_internal_txn'),
            state: 2,
            reason: null,
          },
          id,
        });
      default:
        return res.status(404).json({
          error: { code: -32601, message: { ru: 'Метод не найден', en: 'Method not found' } },
          id,
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: { code: -31008, message: { ru: error.message, en: error.message } },
      id,
    });
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

    if (user.billing?.lastStripeEventId === event.id) {
      return res.status(200).json({ success: true, received: true, type: event.type, duplicate: true });
    }

    const billing = user.billing || {};
    if (event.type === 'checkout.session.completed') {
      billing.stripeCustomerId = String(payload.customer || billing.stripeCustomerId || '');
      billing.stripeSubscriptionId = String(payload.subscription || billing.stripeSubscriptionId || '');
      billing.plan = payload.metadata?.planKey || billing.plan || 'none';
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const priceId = payload.items?.data?.[0]?.price?.id || '';
      const plan = findPlanByPriceId(priceId);
      billing.stripeCustomerId = String(payload.customer || billing.stripeCustomerId || '');
      billing.stripeSubscriptionId = String(payload.id || billing.stripeSubscriptionId || '');
      billing.stripePriceId = priceId;
      billing.plan = plan?.key || billing.plan || 'none';
      billing.status = event.type === 'customer.subscription.deleted' ? 'canceled' : payload.status || 'inactive';
      billing.currentPeriodEnd = payload.current_period_end ? new Date(payload.current_period_end * 1000) : null;
      billing.cancelAtPeriodEnd = Boolean(payload.cancel_at_period_end);
    }

    if (event.type === 'invoice.payment_failed') {
      billing.status = 'past_due';
    }

    billing.lastStripeEventId = event.id;
    user.billing = billing;
    await user.save();
    return res.status(200).json({ success: true, received: true, type: event.type });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
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