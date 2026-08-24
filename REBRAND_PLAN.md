LinguaNest Rebrand Plan — Safe rename & asset-replacement checklist

Purpose

This document is a safe, low-risk plan to rename the product from "LLP" / "Auralex" to "LinguaNest" across the repository and public assets. The approach favors small commits, CI verification, and staged rollout.

Strategy

1) Create a dedicated branch: linguanest/rebrand
2) Make small, reviewed commits grouped by concern (assets, meta, env, docs)
3) Run full frontend build and tests after each commit
4) Keep the backend behavior untouched in the first pass: only update configuration and branding assets
5) After rebrand PR is merged, continue with feature work (payments, bookings)

Search & replace plan (safe order)

- Step 1 (metadata & docs)
  - package.json (frontend & backend): name, description, homepage
  - README.md, DEVELOPMENT.md: replace product names and initial brand badges
  - LICENSEs and footer legal notices if they reference previous brand

- Step 2 (web assets & meta)
  - frontend/index.html: <title>, meta description, OG tags
  - src/assets/logo-*.svg, favicon(s): add new LinguaNest variants and update references
  - manifest.json / site icons

- Step 3 (code & UI strings)
  - Replace literal strings like "LLP", "Language Learn Platform", "Auralex" in UI copy
  - Avoid touching API contract keys and enum values that are persisted in DB (e.g., role codes)
  - For any ambiguous string where replacement might affect persisted data, wrap change in a migration or present a feature-flagged rename

- Step 4 (env & deployment)
  - .env.example: add LINGUANEST defaults
  - docker-compose.linguanest.yml: new compose file
  - CI: update pipeline environment variable names (if they include old brand names)
  - GitHub Pages: update homepage (note: DNS changes external)

- Step 5 (email templates)
  - Update subject lines and HTML templates but keep placeholders intact (e.g., {{user.name}})
  - Use staged testing via Mailtrap before sending to real users

Files & locations to check manually

- frontend/package.json
- backend/package.json
- frontend/public/index.html
- frontend/src/components/* (Navbar, Footer, meta components)
- backend/.env and backend/config files
- README.md and DEVELOPMENT.md at repo root
- CI/CD config: .github/workflows/*
- Any Dockerfile labels that include product name

Commit & verification workflow

1) Create branch linguanest/rebrand
2) Commit A1: package.json + index.html title + README header + .env.example + small placeholder logo files
   - Run: npm install (if package updates) && npm run build (frontend) && backend typecheck/test
3) Commit A2: theme tokens & color variables; run build, visually check critical pages locally
4) Commit A3: chat message color adjustments, add read receipt icons (UI only). Run build
5) Open PR with screenshots and smoke-test notes. Tag reviewers.

Rollout notes

- Keep redirect from old GitHub Pages (if still used) to a LinguaNest marketing page; implement at DNS/host-level.
- Update email sending domains and SPF/DKIM settings when switching to production email domain.

Rollback plan

- If a rebrand commit breaks builds or creates regressions, revert the specific commit and re-open a follow-up fix PR.
- For DNS or TLS issues, revert DNS or Cloudflare changes and keep the previous domain active during investigation.

End of REBRAND_PLAN.md
