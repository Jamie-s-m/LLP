# Render deployment

## Frontend Static Site

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Custom domain: `linguanest.uz`
- Environment:
  - `VITE_API_URL=https://api.linguanest.uz`
  - `VITE_APP_MODE=production`
  - `VITE_DEMO_MODE=false`

The Render rewrite `/* -> /index.html` is defined in `render.yaml` so direct
client-side routes work.

## Backend Web Service

- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/api/health`
- Custom domain: `api.linguanest.uz`

Required production secrets are configured in the Render dashboard, never in
Git. Set `FRONTEND_URL` and `FRONTEND_APP_URL` to `https://linguanest.uz`, and
set `CORS_ORIGINS` to the frontend and API HTTPS origins.

## DNS

In the domain provider, use the exact records shown by Render for the
frontend custom domain. Add a CNAME for `api` to the backend Render hostname.
Remove old GitHub Pages records. After propagation, verify:

```text
https://linguanest.uz
https://api.linguanest.uz/api/health
```
