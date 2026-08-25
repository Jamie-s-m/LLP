# 🔧 CRITICAL FIX NEEDED: MongoDB Atlas Configuration

**Issue**: Your `.env` file is pointing to localhost MongoDB, but you need MongoDB Atlas for cloud deployment.

---

## 🚨 IMMEDIATE ACTION REQUIRED

Your current `.env` has:
```
MONGODB_URI=mongodb://localhost:27017/linguanest
```

You need to change this to your MongoDB Atlas connection string.

---

## ✅ SOLUTION: Set Up MongoDB Atlas

### Step 1: Create MongoDB Atlas Account (If you haven't)

1. Go to: https://cloud.mongodb.com
2. Sign up for free (M0 cluster - free forever)
3. Create a cluster (takes 1-3 minutes)

### Step 2: Get Your Connection String

1. In MongoDB Atlas Dashboard, click **"Connect"**
2. Choose **"Connect your application"**
3. Select **Driver: Node.js**
4. Copy the connection string (looks like this):
```
mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 3: Configure Database Access

1. In Atlas, go to **"Database Access"**
2. Click **"Add New Database User"**
3. Create username and password (save these!)
4. Set privileges to **"Read and write to any database"**

### Step 4: Configure Network Access

1. In Atlas, go to **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed for Render deployment
4. Click **"Confirm"**

### Step 5: Update Your .env File

Replace the MONGODB_URI in `.env`:

```env
# OLD (localhost - won't work for cloud deployment)
MONGODB_URI=mongodb://localhost:27017/linguanest

# NEW (MongoDB Atlas - works everywhere)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/linguanest?retryWrites=true&w=majority
```

**Important**: Replace:
- `your-username` with your database username
- `your-password` with your database password (URL encode if it has special characters)
- `cluster0.xxxxx` with your actual cluster address

---

## 📝 COMPLETE .ENV FILE TEMPLATE

Here's what your `.env` should look like:

```env
# Environment
NODE_ENV=development
PORT=5000

# MongoDB Atlas (REQUIRED - Replace with your connection string)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/linguanest?retryWrites=true&w=majority

# JWT Secret (Generate new one for production)
JWT_SECRET=local-development-only-secret-CHANGE-IN-PRODUCTION

# Frontend URLs
FRONTEND_URL=http://localhost:5173
FRONTEND_APP_URL=http://localhost:5173

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:4173,https://jamie-s-m.github.io

# Email (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=LinguaNest <no-reply@linguanest.uz>

# Rate Limiting (Optional - defaults are fine)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CHAT_RATE_LIMIT_WINDOW_MS=900000
CHAT_RATE_LIMIT_MAX_REQUESTS=240

# Redis (Optional - for caching)
# REDIS_URL=redis://default:password@host:port

# Stripe (Optional - for payments)
# STRIPE_SECRET_KEY=sk_live_your_key
# STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

---

## 🚀 AFTER UPDATING .ENV

### 1. Test Local Connection
```bash
cd backend
npm run seed
```

Expected output:
```
🔌 Connecting to MongoDB...
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
✅ Content seeded successfully!
```

### 2. Update Render Environment Variables

Go to Render Dashboard and add the **same** MONGODB_URI:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/linguanest?retryWrites=true&w=majority
```

---

## ❓ TROUBLESHOOTING

### Error: "Authentication failed"
- Check username and password are correct
- Ensure password is URL encoded if it contains special characters like @, #, $

### Error: "Network timeout"
- Check "Network Access" in Atlas allows 0.0.0.0/0
- Wait 1-2 minutes after adding IP address

### Error: "Database access denied"
- Ensure database user has "Read and write" privileges
- Check user is added to the correct project/cluster

### How to URL Encode Password
If your password has special characters:
```
Original: Pass@word#123
Encoded:  Pass%40word%23123

Replace:
  @ with %40
  # with %23
  $ with %24
  % with %25
```

Or use: https://www.urlencoder.org/

---

## 🎯 QUICK START CHECKLIST

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster
- [ ] Created database user with username/password
- [ ] Added IP whitelist (0.0.0.0/0)
- [ ] Got connection string from Atlas
- [ ] Updated `.env` file with Atlas connection string
- [ ] Tested locally with `npm run seed`
- [ ] Updated Render environment variables
- [ ] Redeployed backend (git push)

---

## 💡 WHY THIS IS NEEDED

**Local MongoDB** (`mongodb://localhost:27017`) only works on your computer. When you deploy to Render, it can't connect to your local database.

**MongoDB Atlas** is a cloud database that works from anywhere:
- ✅ Your local computer
- ✅ Render backend
- ✅ Any cloud platform
- ✅ Team members

---

## 📞 NEED HELP?

If you need a quick MongoDB Atlas connection string for testing, you can:

1. **Use MongoDB Atlas Free Tier** (Recommended)
   - Free forever
   - 512MB storage
   - Perfect for development and small production apps

2. **Alternative: MongoDB connection string format**
```
mongodb+srv://linguanest-user:MySecurePass123@cluster0.abcde.mongodb.net/linguanest?retryWrites=true&w=majority
```

Replace:
- `linguanest-user` → your database username
- `MySecurePass123` → your database password
- `cluster0.abcde` → your cluster name (from Atlas)
- `linguanest` → database name (can keep this)

---

**Once you update the MONGODB_URI, run:**
```bash
cd backend
npm run seed
```

**This will sync all courses to your MongoDB Atlas database!** ✅
