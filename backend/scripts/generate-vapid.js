#!/usr/bin/env node
// Helper: generate VAPID keys locally and print environment variables
// Usage: node backend/scripts/generate-vapid.js

try {
  const wp = require('web-push')
  const keys = wp.generateVAPIDKeys()
  console.log('\nVAPID keypair generated (do NOT commit these keys)\n')
  console.log('VAPID_PUBLIC_KEY=' + keys.publicKey)
  console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
  console.log('\nWindows PowerShell (set for current session):')
  console.log("$env:VAPID_PUBLIC_KEY = '" + keys.publicKey + "'")
  console.log("$env:VAPID_PRIVATE_KEY = '" + keys.privateKey + "'")
  console.log("$env:VAPID_SUBJECT = 'mailto:support@linguanest.uz'\n")
  console.log('Render dashboard: add these as environment variables to your Render service: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT')
  console.log('\nFrontend (build-time): set VITE_VAPID_PUBLIC_KEY to the public key in your frontend build environment')
  console.log('\nExample curl to verify (after deploy):')
  console.log("curl -X POST 'https://<your-backend>/api/admin/push/send' -H 'Authorization: Bearer <ADMIN_TOKEN>' -H 'Content-Type: application/json' -d '{\"userIds\":[\"<USER_ID>\"],\"payload\":{\"title\":\"Test\",\"body\":\"Test push\"}}'")
} catch (err) {
  console.error('Failed to generate VAPID keys. Ensure web-push is installed (npm ci in backend).')
  console.error(err)
  process.exit(1)
}
