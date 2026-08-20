import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

let configured = false;

const ensureConfigured = () => {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (configured || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return configured;
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:support@linguanest.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return configured;
};

// Best-effort push: silently skips when VAPID isn't configured or a user has no subscriptions.
export const sendPushToUsers = async (userIds, payload) => {
  if (!ensureConfigured() || !userIds?.length) return;

  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];
  const subscriptions = await PushSubscription.find({ user: { $in: uniqueIds } });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: subscription.keys },
          JSON.stringify(payload)
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        }
      }
    })
  );
};
