import Stripe from 'stripe';
import { getBillingPlans, getStripeClient, serializeBilling } from '../utils/billing.js';

const PAYME_MERCHANT_KEY = process.env.PAYME_MERCHANT_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.FRONTEND_APP_URL || 'http://localhost:5173';

export const getBillingPlansController = (_req, res) => {
  try {
    return res.status(200).json({
      success: true,
      plans: getBillingPlans(),
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
      billing: serializeBilling(billing),
      plan: billing?.plan || 'none',
      role: user?.role || 'student',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to load billing state' });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { planKey, amountInUzS, planId } = req.body || {};
    const plan = getBillingPlans().find((item) => item.key === planKey || item.key === planId);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!plan) {
      return res.status(400).json({ success: false, message: 'Billing plan not found' });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && plan.priceId) {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: plan.priceId, quantity: 1 }],
        success_url: `${FRONTEND_URL}/pricing?checkout=success`,
        cancel_url: `${FRONTEND_URL}/pricing?checkout=cancelled`,
        customer_email: req.user.email,
        metadata: {
          userId: String(req.user._id),
          planKey: plan.key,
        },
      });

      return res.status(200).json({ success: true, url: session.url, provider: 'stripe' });
    }

    const merchantId = process.env.PAYME_MERCHANT_ID;
    const normalizedAmount = Number(amountInUzS || 0);
    const amountInTiyin = Number.isFinite(normalizedAmount) ? normalizedAmount * 100 : 0;
    const params = `m=${merchantId};ac.user_id=${req.user._id};ac.plan_id=${plan.key};a=${amountInTiyin}`;
    const encodedParams = Buffer.from(params, 'utf8').toString('base64');
    const checkoutUrl = `https://checkout.paycom.uz/${encodedParams}`;

    return res.status(200).json({
      success: true,
      url: checkoutUrl,
      provider: 'payme',
      plan: plan.key,
      amountInUzS: normalizedAmount,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to create checkout session' });
  }
};

const validatePaymeAuth = (req) => {
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Stripe checkout session completed', {
        customerEmail: session.customer_email,
        metadata: session.metadata,
      });
    }

    return res.status(200).json({ success: true, received: true, type: event.type });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid Stripe signature' });
  }
};