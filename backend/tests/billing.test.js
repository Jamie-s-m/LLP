import request from 'supertest';
import Stripe from 'stripe';
import { findBillingPlan, getBillingPlans, serializeBilling } from '../src/utils/billing.js';
import app from '../src/app.js';
import User from '../src/models/User.js';
import AnalyticsEvent from '../src/models/AnalyticsEvent.js';

describe('billing configuration helpers', () => {
  it('returns the expected commercial plan catalog', () => {
    const plans = getBillingPlans();

    expect(plans.map((plan) => plan.key)).toEqual(['local', 'learner', 'family', 'teaching']);
    expect(plans.every((plan) => typeof plan.available === 'boolean')).toBe(true);
  });

  it('finds known plans and ignores unknown plan keys', () => {
    expect(findBillingPlan('learner')).toEqual(expect.objectContaining({ key: 'learner', name: 'Learner' }));
    expect(findBillingPlan('missing-plan')).toBeUndefined();
  });

  it('marks the Payme-only Local plan available based on Payme config, not a Stripe price', () => {
    const previousKey = process.env.PAYME_MERCHANT_ID;
    try {
      process.env.PAYME_MERCHANT_ID = 'test-merchant';
      const withPayme = getBillingPlans().find((plan) => plan.key === 'local');
      expect(withPayme.paymeOnly).toBe(true);
      expect(withPayme.priceId).toBe('');
      expect(withPayme.available).toBe(true);

      delete process.env.PAYME_MERCHANT_ID;
      const withoutPayme = getBillingPlans().find((plan) => plan.key === 'local');
      expect(withoutPayme.available).toBe(false);
    } finally {
      if (previousKey === undefined) {
        delete process.env.PAYME_MERCHANT_ID;
      } else {
        process.env.PAYME_MERCHANT_ID = previousKey;
      }
    }
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
      provider: 'none',
      currentPeriodEnd: new Date('2030-01-01T00:00:00.000Z'),
      cancelAtPeriodEnd: true,
    });
  });
});

describe('Payme webhook auth', () => {
  it('rejects Basic "Paycom:" (empty password) when PAYME_MERCHANT_KEY is unset, instead of matching by default', async () => {
    // getPaymeMerchantKey() reads process.env lazily on every request (not a module-load-time
    // constant), so the env var can be unset just for this one test and restored afterward -
    // this is what makes it possible to exercise both the "configured" and "unconfigured"
    // branches within the same test run at all.
    const previousKey = process.env.PAYME_MERCHANT_KEY;
    delete process.env.PAYME_MERCHANT_KEY;

    try {
      const emptyPasswordAuth = Buffer.from('Paycom:').toString('base64');
      const res = await request(app)
        .post('/api/billing/payme')
        .set('Authorization', `Basic ${emptyPasswordAuth}`)
        .send({ method: 'CheckPerformTransaction', params: {}, id: 1 });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    } finally {
      if (previousKey === undefined) {
        delete process.env.PAYME_MERCHANT_KEY;
      } else {
        process.env.PAYME_MERCHANT_KEY = previousKey;
      }
    }
  });
});

// Regression coverage for a release blocker: charge.refunded was never handled at all, so a
// real Stripe refund left billing.status untouched - the user kept paid access and kept
// counting as revenue. These tests use Stripe's own offline test-signature helper
// (stripe.webhooks.generateTestHeaderString) to build genuinely-signed webhook fixtures - no
// network call, no real Stripe account needed - and exercise the real
// POST /api/billing/webhook route end to end.
describe('Stripe webhook - refunds, idempotency, and signature verification', () => {
  const WEBHOOK_SECRET = 'whsec_test_phase3';
  const stripe = new Stripe('sk_test_dummy');
  let previousWebhookSecret;
  let previousSecretKey;

  const sendEvent = (eventPayload, { secret = WEBHOOK_SECRET } = {}) => {
    const rawBody = JSON.stringify(eventPayload);
    const signature = stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret });
    return request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', signature)
      .send(rawBody);
  };

  beforeAll(() => {
    previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    previousSecretKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
  });

  afterAll(() => {
    if (previousWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
    if (previousSecretKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousSecretKey;
  });

  const makeSubscriber = async (email, customerId) => {
    const user = await User.create({
      firstName: 'Stripe',
      lastName: 'Subscriber',
      email,
      password: 'testpass123',
      role: 'student',
      isEmailVerified: true,
      billing: { plan: 'learner', status: 'active', provider: 'stripe', stripeCustomerId: customerId },
    });
    return user;
  };

  it('rejects a forged signature and makes no billing change', async () => {
    const user = await makeSubscriber('stripe-forge@example.com', 'cus_forge_1');
    const res = await sendEvent(
      { id: 'evt_forged_1', type: 'charge.refunded', data: { object: { customer: 'cus_forge_1', amount: 1900, amount_refunded: 1900 } } },
      { secret: 'whsec_completely_wrong' }
    );
    expect(res.status).toBe(400);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('active');
  });

  it('a full refund sets billing.status to refunded and records payment_refunded', async () => {
    const user = await makeSubscriber('stripe-full-refund@example.com', 'cus_full_refund_1');

    const res = await sendEvent({
      id: 'evt_refund_full_1',
      type: 'charge.refunded',
      data: { object: { customer: 'cus_full_refund_1', amount: 1900, amount_refunded: 1900 } },
    });
    expect(res.status).toBe(200);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('refunded');

    const stored = await AnalyticsEvent.findOne({ event: 'payment_refunded', user: user._id });
    expect(stored).not.toBeNull();
    expect(stored.metadata.full).toBe(true);
  });

  it('a partial refund does NOT change billing.status but still records the event', async () => {
    const user = await makeSubscriber('stripe-partial-refund@example.com', 'cus_partial_refund_1');

    const res = await sendEvent({
      id: 'evt_refund_partial_1',
      type: 'charge.refunded',
      data: { object: { customer: 'cus_partial_refund_1', amount: 1900, amount_refunded: 500 } },
    });
    expect(res.status).toBe(200);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('active');

    const stored = await AnalyticsEvent.findOne({ event: 'payment_refunded', user: user._id });
    expect(stored).not.toBeNull();
    expect(stored.metadata.full).toBe(false);
  });

  it('a redelivered (duplicate) event id is a true no-op the second time', async () => {
    const user = await makeSubscriber('stripe-dup@example.com', 'cus_dup_1');
    const eventPayload = {
      id: 'evt_dup_1',
      type: 'charge.refunded',
      data: { object: { customer: 'cus_dup_1', amount: 1900, amount_refunded: 1900 } },
    };

    const first = await sendEvent(eventPayload);
    expect(first.status).toBe(200);
    expect(first.body.duplicate).toBeFalsy();

    const second = await sendEvent(eventPayload);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);

    const events = await AnalyticsEvent.find({ event: 'payment_refunded', user: user._id });
    expect(events).toHaveLength(1);
  });

  it('genuinely concurrent duplicate deliveries apply the refund exactly once (no TOCTOU double-apply)', async () => {
    const user = await makeSubscriber('stripe-concurrent-dup@example.com', 'cus_concurrent_dup_1');
    const eventPayload = {
      id: 'evt_concurrent_dup_1',
      type: 'charge.refunded',
      data: { object: { customer: 'cus_concurrent_dup_1', amount: 1900, amount_refunded: 1900 } },
    };

    const [first, second] = await Promise.all([sendEvent(eventPayload), sendEvent(eventPayload)]);
    const results = [first, second];
    const appliedCount = results.filter((res) => !res.body.duplicate).length;
    const duplicateCount = results.filter((res) => res.body.duplicate === true).length;

    expect(appliedCount).toBe(1);
    expect(duplicateCount).toBe(1);

    const events = await AnalyticsEvent.find({ event: 'payment_refunded', user: user._id });
    expect(events).toHaveLength(1);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('refunded');
  });

  it('an active subscription webhook still works normally alongside refund handling', async () => {
    const user = await makeSubscriber('stripe-sub-active@example.com', 'cus_sub_active_1');

    const res = await sendEvent({
      id: 'evt_sub_active_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_active_1',
          customer: 'cus_sub_active_1',
          status: 'active',
          items: { data: [{ price: { id: 'price_unknown' } }] },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
        },
      },
    });
    expect(res.status).toBe(200);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('active');
    expect(reloaded.billing.stripeSubscriptionId).toBe('sub_active_1');
  });

  // Regression coverage for a Phase 3 security-re-audit finding: the same-event-id dedup guard
  // (blocker 5) closes exact redelivery, but Stripe does not guarantee delivery ORDER - a
  // subscription.updated that logically happened before a later subscription.deleted could
  // still arrive after it and silently revert a real cancellation back to active.
  it('an out-of-order webhook (older event.created, different event id) does not revert a later cancellation', async () => {
    const user = await makeSubscriber('stripe-out-of-order@example.com', 'cus_out_of_order_1');
    const earlier = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const later = Math.floor(Date.now() / 1000); // now

    const cancelEvent = await sendEvent({
      id: 'evt_ooo_deleted',
      type: 'customer.subscription.deleted',
      created: later,
      data: { object: { id: 'sub_ooo_1', customer: 'cus_out_of_order_1', status: 'canceled' } },
    });
    expect(cancelEvent.status).toBe(200);
    expect((await User.findById(user._id)).billing.status).toBe('canceled');

    // A stale "still active" update, generated BEFORE the cancellation but delivered after it.
    const staleUpdateEvent = await sendEvent({
      id: 'evt_ooo_updated_stale',
      type: 'customer.subscription.updated',
      created: earlier,
      data: {
        object: {
          id: 'sub_ooo_1', customer: 'cus_out_of_order_1', status: 'active',
          items: { data: [{ price: { id: 'price_unknown' } }] },
          current_period_end: later + 30 * 24 * 60 * 60, cancel_at_period_end: false,
        },
      },
    });
    expect(staleUpdateEvent.status).toBe(200);
    expect(staleUpdateEvent.body.outOfOrder).toBe(true);

    const reloaded = await User.findById(user._id);
    expect(reloaded.billing.status).toBe('canceled');
  });

  it('ignores an event for an unrecognized customer without error', async () => {
    const res = await sendEvent({
      id: 'evt_unknown_customer_1',
      type: 'charge.refunded',
      data: { object: { customer: 'cus_does_not_exist', amount: 1900, amount_refunded: 1900 } },
    });
    expect(res.status).toBe(200);
    expect(res.body.ignored).toBe(true);
  });
});
