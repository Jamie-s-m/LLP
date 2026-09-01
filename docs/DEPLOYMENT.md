# Render deployment

**`render.yaml` in this repo is not fully authoritative.** Verified directly
against the live Render API (2026-09-01): the backend service's *actual*
runtime is a Docker build from the repo-root `Dockerfile`, not the Node
buildpack `render.yaml` declares, and the live frontend service's Render-side
name doesn't match `render.yaml`'s either. This isn't broken - both services
deploy and run correctly - but treat the Render dashboard as the source of
truth for anything below that you need to double-check, not this file or
`render.yaml`.

**Deployment is automatic, not something this repo's CI triggers.** Both
services have Render's native GitHub auto-deploy enabled
(`autoDeploy: "yes"`, `autoDeployTrigger: "commit"`) - Render watches `main`
directly and deploys every push on its own. There is no GitHub Actions step
that triggers a deploy (a previous one was removed - see `.github/workflows/`
- it duplicated this native mechanism and never actually worked, since its
target secret was never configured).

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

- Runtime: **Docker** (root `Dockerfile`), not the Node buildpack -
  confirmed live, `render.yaml` is stale on this point.
- Health check: `/api/health` (the Dockerfile also has its own internal
  `HEALTHCHECK` directive independent of Render's platform-level check)
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
