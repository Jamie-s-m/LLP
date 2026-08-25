# LinguaNest Production Deployment Checklist

**Platform**: Language Learning & Tutoring Marketplace  
**Target**: linguanest.uz  
**Date**: 2026-08-25

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### 1. Environment Configuration

#### Backend Environment Variables (Required)
```bash
# Critical - Must Be Set
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/linguanest
JWT_SECRET=<generate-with-openssl-rand-base64-64>
JWT_EXPIRE=7d
FRONTEND_URL=https://linguanest.uz
FRONTEND_APP_URL=https://linguanest.uz

# Email & Notifications
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
EMAIL_FROM="LinguaNest <no-reply@linguanest.uz>"
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_SUBJECT=mailto:support@linguanest.uz

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_LEARNER_MONTHLY=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_TEACHING_MONTHLY=price_...

# Optional but Recommended
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_MAX_REQUESTS=240
PORT=5000
```

#### Generate Secure JWT Secret
```bash
openssl rand -base64 64
```

#### Generate VAPID Keys (Push Notifications)
```bash
cd backend
npx web-push generate-vapid-keys
```

---

### 2. Database Setup

#### MongoDB Atlas Configuration
- [x] Create production cluster
- [x] Whitelist application server IPs
- [x] Create database user with appropriate permissions
- [x] Enable authentication
- [x] Configure backup schedule
- [x] Set up monitoring alerts

#### Database Indexes (Auto-created on startup)
```javascript
// Indexes are automatically created by backend/src/utils/indexes.js
// Verify after first startup:
// - User: 8 indexes
// - Course: 4 indexes  
// - ChatConversation: 2 indexes
// - ChatMessage: 3 indexes
```

---

### 3. Stripe Configuration

#### Setup Steps
1. Create production Stripe account at stripe.com
2. Create three recurring price objects:
   - Learner Monthly ($X/month)
   - Family Monthly ($Y/month)
   - Teaching Monthly ($Z/month)
3. Configure webhook endpoint: `https://api.linguanest.uz/api/billing/webhook`
4. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Enable customer portal
6. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

---

### 4. Frontend Build & Deploy

#### GitHub Pages Deployment
```bash
cd frontend

# Update base URL in vite.config.ts if needed
# Set VITE_API_URL in environment

npm install
npm run build
npm run deploy
```

#### Environment Variables (Frontend)
```env
VITE_API_URL=https://api.linguanest.uz/api
VITE_VAPID_PUBLIC_KEY=<your-vapid-public-key>
```

---

### 5. Backend Deployment (Render)

#### Render Configuration
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables (see section 1)
6. Set health check path: `/api/health`
7. Enable auto-deploy from main branch

#### Manual Deployment
```bash
cd backend
npm install --production
npm start
```

---

### 6. DNS & SSL Configuration

#### DNS Records
```
A     linguanest.uz           → <GitHub-Pages-IP>
CNAME www.linguanest.uz       → username.github.io
A     api.linguanest.uz       → <Render-IP>
```

#### SSL/TLS
- [x] GitHub Pages: Automatic (Let's Encrypt)
- [x] Render: Automatic (Let's Encrypt)
- [x] Verify HTTPS on both domains

---

### 7. Security Verification

#### Pre-Launch Security Checks
- [x] JWT_SECRET is strong (64+ characters)
- [x] No secrets in git repository
- [x] .env files in .gitignore
- [x] CORS origins whitelisted
- [x] Rate limiting enabled
- [x] Input sanitization active
- [x] HTTPS enforced
- [x] Security headers configured (Helmet)
- [x] Database authentication enabled
- [x] Password reset tokens hashed
- [x] Email verification tokens hashed

```bash
# Run security audit
cd backend && npm audit
cd frontend && npm audit

# Should return: found 0 vulnerabilities
```

---

### 8. Testing Before Go-Live

#### Backend Health Check
```bash
curl https://api.linguanest.uz/api/health
# Expected: {"success":true,"message":"API is running successfully"}
```

#### Authentication Flow Test
1. Register new account
2. Verify email
3. Login
4. Access protected routes
5. Logout

#### Payment Flow Test
1. Create test subscription (use Stripe test mode first)
2. Verify webhook received
3. Check subscription status updated
4. Test customer portal
5. Test cancellation flow

#### Real-time Features Test
1. Open chat
2. Send messages
3. Verify delivery receipts
4. Test notifications
5. Verify Socket.io connection

---

### 9. Monitoring Setup

#### Error Tracking (Recommended: Sentry)
```bash
npm install @sentry/node --save

# Add to backend/src/server.js
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

#### Uptime Monitoring
- Set up monitoring with UptimeRobot or similar
- Monitor endpoints:
  - `https://linguanest.uz` (frontend)
  - `https://api.linguanest.uz/api/health` (backend)
- Alert contacts: your-email@domain.com

#### Log Management
- Logs stored in `backend/logs/` (production)
- Consider: CloudWatch, Papertrail, or ELK stack
- Set up log rotation (already configured via Winston)

---

### 10. Performance Optimization

#### CDN Configuration (Optional but Recommended)
- Use Cloudflare for:
  - DDoS protection
  - Asset caching
  - SSL/TLS optimization
  - Global CDN

#### Database Performance
- [x] Indexes created automatically on startup
- Monitor slow queries in MongoDB Atlas
- Set up query profiling

#### Application Performance
- Enable gzip compression (already enabled)
- Monitor API response times
- Set up alerts for >2s response times

---

### 11. Backup Strategy

#### Database Backups
- Enable MongoDB Atlas automated backups
- Schedule: Daily
- Retention: 30 days
- Test restore procedure monthly

#### Code Backups
- Git repository (already version controlled)
- Tag releases: `git tag -a v1.0.0 -m "Production release"`

---

### 12. Launch Day Checklist

#### Final Verifications
- [ ] All environment variables set correctly
- [ ] Database connection tested
- [ ] Stripe webhooks working
- [ ] Email delivery tested
- [ ] Push notifications tested
- [ ] SSL certificates valid
- [ ] DNS propagated
- [ ] Health checks passing
- [ ] Monitoring alerts configured
- [ ] Team notified of launch

#### Go-Live Commands
```bash
# 1. Tag the release
git tag -a v1.0.0 -m "Production launch"
git push origin v1.0.0

# 2. Deploy frontend
cd frontend && npm run deploy

# 3. Deploy backend (if manual)
cd backend && npm start

# 4. Verify health
curl https://api.linguanest.uz/api/health
curl https://linguanest.uz

# 5. Monitor logs
cd backend && tail -f logs/combined.log
```

---

### 13. Post-Launch Monitoring (First 24 Hours)

#### What to Watch
- [ ] Error rates (target: <1%)
- [ ] API response times (target: <500ms avg)
- [ ] Database query performance
- [ ] Memory usage (target: <80%)
- [ ] Active user connections
- [ ] Payment processing success rate
- [ ] Email delivery rate

#### Immediate Response Plan
If issues detected:
1. Check error logs: `backend/logs/error.log`
2. Check application logs: `backend/logs/combined.log`
3. Verify all environment variables
4. Check database connection
5. Verify external service status (Stripe, MongoDB)
6. Rollback if critical: `git revert` and redeploy

---

### 14. Communication Plan

#### Announcement Schedule
- [ ] Internal team notification
- [ ] Beta tester invitation emails
- [ ] Social media announcement
- [ ] Website banner/notification
- [ ] Email newsletter

#### Support Readiness
- [ ] Support email configured: support@linguanest.uz
- [ ] FAQ documentation prepared
- [ ] Known issues documented
- [ ] Escalation process defined

---

## 🚀 DEPLOYMENT COMMANDS

### Quick Deploy (Production)

#### Backend (Render - Auto Deploy)
```bash
git push origin main
# Render auto-deploys on push to main
# Monitor: https://dashboard.render.com
```

#### Frontend (GitHub Pages)
```bash
cd frontend
npm run deploy
# Deploys to: https://linguanest.uz
```

### Verify Deployment
```bash
# Backend health
curl https://api.linguanest.uz/api/health

# Frontend
curl https://linguanest.uz

# Check version
curl https://api.linguanest.uz/api/health | jq
```

---

## 📊 SUCCESS METRICS

### Launch Day KPIs
- API uptime: 99.9%+
- Average response time: <500ms
- Error rate: <1%
- Successful registrations: Track
- Successful payments: Track

### Week 1 Goals
- 100+ registered users
- 10+ paying subscribers
- <5 critical bugs
- 95%+ uptime

---

## 🆘 EMERGENCY CONTACTS

### Technical Issues
- Developer: [Your contact]
- Database: MongoDB Atlas support
- Hosting: Render support
- Payments: Stripe support

### Service Status Pages
- MongoDB: https://status.mongodb.com
- Render: https://status.render.com
- Stripe: https://status.stripe.com
- GitHub: https://www.githubstatus.com

---

## 📝 POST-LAUNCH TASKS

### Week 1
- [ ] Monitor all metrics daily
- [ ] Address critical bugs immediately
- [ ] Collect user feedback
- [ ] Update documentation based on issues

### Month 1
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback analysis
- [ ] Feature prioritization

---

**Checklist Last Updated**: 2026-08-25  
**Status**: Ready for Production Deployment  
**Next Review**: Post-launch + 7 days
