VAPID key generation and deployment steps

Overview
- VAPID keys are used for Web Push notifications. The public key is used by the client (frontend) to subscribe; the private key is used by the backend to sign push requests.

Generate keys locally (safe, offline)
- Ensure backend dependencies are installed: (from repo root)
  cd backend
  npm ci
- Run the helper script to generate keys:
  node backend/scripts/generate-vapid.js

What to set in Render (backend service)
- Add these environment variables to your Render service (or other hosting environment):
  VAPID_PUBLIC_KEY  - the public key printed by the script
  VAPID_PRIVATE_KEY - the private key printed by the script
  VAPID_SUBJECT     - a contact URI, e.g. mailto:support@linguanest.uz

What to set in the frontend build environment
- Set VITE_VAPID_PUBLIC_KEY to the same public key in your frontend build environment (GitHub Actions, Render static site, netlify env, etc.). This ensures the NotificationOptIn component can subscribe using the correct key.

Verification
- Deploy backend with the above envs set.
- Deploy frontend with VITE_VAPID_PUBLIC_KEY set.
- Sign in as a user on the site, enable push via Dashboard → Push Notifications, and allow the browser prompt.
- Use Admin → Support → Send test push or call the admin API to send a test push to the subscribed user(s).

Security
- Never commit the private key to source control.
- Store the private key in secure environment variables.
- Rotate keys if they are ever exposed.

Troubleshooting
- If subscription fails in the browser, check console errors and ensure the site is served over HTTPS or localhost.
- If sending fails, ensure backend has VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY and that the web-push package is installed.
