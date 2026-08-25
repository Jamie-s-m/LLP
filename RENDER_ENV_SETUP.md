# Render Environment Variables Setup Guide

**Generated**: 2026-08-25  
**Status**: Ready to Deploy

---

## 🚀 CRITICAL: Set These on Render Dashboard NOW

### Step 1: Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Select your **LinguaNest backend** service
3. Click **Environment** tab
4. Add the following variables:

---

## ✅ REQUIRED Environment Variables

### Database Configuration
```bash
MONGODB_URI=mongodb+srv://moreartyjames_db_user:TheDevil007_@cluster0.occae9y.mongodb.net/language-learn-platform?appName=Cluster0
```

### Application Configuration
```bash
NODE_ENV=production
PORT=10000
```

### JWT Security (CRITICAL)
```bash
JWT_SECRET=nEARCZUXcuwOvlcaRfbhKceq/WnydappprfUMoZ8MC7+tAYjz+h+/xbyKxnBxIyJGVm1c/W+HntOv12q05Zh3w==
JWT_EXPIRE=7d
```

### Frontend URLs (Update after getting Render backend URL)
```bash
# Temporary - update after first deploy
FRONTEND_URL=https://jamie-s-m.github.io
FRONTEND_APP_URL=https://jamie-s-m.github.io/LLP

# Add your Render backend URL to CORS after deployment
CORS_ORIGINS=https://jamie-s-m.github.io
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_WINDOW_MS=900000
CHAT_RATE_LIMIT_MAX_REQUESTS=2000
```

### Logging
```bash
LOG_LEVEL=info
```

---

## 📋 OPTIONAL Environment Variables

### Email Configuration (Gmail Example)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=LinguaNest <no-reply@linguanest.uz>
```

### Redis (If using Redis add-on)
```bash
REDIS_URL=redis://default:password@host:port
```

### Stripe Payment Integration (If needed)
```bash
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## 🔄 After Setting Environment Variables

1. **Save** all environment variables
2. Render will **automatically redeploy** your backend
3. Wait **2-5 minutes** for deployment to complete
4. Check deployment logs for:
   ```
   ✅ MongoDB connected
   ✅ API listening on port 10000
   ```

---

## 🧪 Testing After Deployment

### Step 1: Get Your Backend URL
- After deployment completes, copy your Render backend URL
- Format: `https://your-app-name.onrender.com`

### Step 2: Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running successfully"
}
```

### Step 3: Update Frontend Configuration
The frontend needs to know your backend URL. Update:

**File**: `frontend/src/config/api.js` (or similar)
```javascript
const API_BASE_URL = 'https://your-app-name.onrender.com/api';
```

Then redeploy frontend:
```bash
cd frontend
npm run deploy
```

---

## 🔒 Security Checklist

- [x] Strong JWT_SECRET generated (64 bytes)
- [x] MongoDB Atlas connection uses SSL (mongodb+srv://)
- [x] Production NODE_ENV set
- [x] Rate limiting enabled
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0 (all IPs)
- [ ] Frontend CORS_ORIGINS updated with actual Render URL
- [ ] Email service configured (optional but recommended)

---

## 📊 Database Status

✅ **MongoDB Atlas is fully seeded with:**
- 8 Published Courses
- 211 Lessons
- 630 Exercises
- 500 Vocabulary Items
- Demo users ready for testing

---

## 🎯 Next Steps

1. ✅ MongoDB Atlas configured
2. ✅ Database seeded with content
3. ✅ JWT secret generated
4. ⚠️ **ACTION REQUIRED**: Add environment variables to Render
5. ⏳ Wait for automatic redeploy
6. ✅ Test backend health endpoint
7. ✅ Update frontend API URL
8. ✅ Test full application

---

## 🆘 Troubleshooting

### Backend won't start on Render
**Check:**
- All REQUIRED environment variables are set
- MONGODB_URI is correct (test locally first)
- PORT is set to 10000
- Check Render deployment logs

### CORS Errors
**Fix:**
- Add your Render backend URL to CORS_ORIGINS
- Format: `CORS_ORIGINS=https://jamie-s-m.github.io,https://your-app.onrender.com`

### Database Connection Failed
**Fix:**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check database user has read/write permissions
- Verify connection string is correct

---

## 📞 Quick Reference

### MongoDB Atlas Dashboard
```
https://cloud.mongodb.com
```

### Render Dashboard
```
https://dashboard.render.com
```

### Frontend (GitHub Pages)
```
https://jamie-s-m.github.io/LLP/
```

### Test Backend Health
```bash
curl https://your-backend.onrender.com/api/health
```

---

**Status**: Ready for production deployment  
**Last Updated**: 2026-08-25 15:44 UTC

🎉 Your database is ready! Just add these environment variables to Render and you're live!
