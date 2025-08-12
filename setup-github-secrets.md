# 🔐 GitHub Secrets Setup Guide

## After creating your GitHub repository, follow these steps:

### **Step 1: Go to Repository Settings**
1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/saga-ai-coach`
2. Click the **"Settings"** tab (top right)
3. Click **"Secrets and variables"** → **"Actions"** (left sidebar)

### **Step 2: Add Repository Secrets**
Click **"New repository secret"** for each of these:

## 🔥 **FIREBASE SECRETS** (Get from Firebase Console)

```
Name: FIREBASE_PROJECT_ID
Value: your-project-id

Name: FIREBASE_PRIVATE_KEY_ID  
Value: your-private-key-id

Name: FIREBASE_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----
your-actual-private-key-content
-----END PRIVATE KEY-----"

Name: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

Name: FIREBASE_CLIENT_ID
Value: your-client-id
```

## 🎯 **PUBLIC FIREBASE SECRETS** (From Firebase Config)

```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: your-firebase-api-key

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: your-project.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: your-project-id

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: your-project.appspot.com

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: your-sender-id

Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: your-app-id
```

## 🤖 **GOOGLE AI SECRET**

```
Name: GOOGLE_API_KEY
Value: your-google-ai-api-key
```

## 💳 **STRIPE SECRETS** (From Stripe Dashboard)

```
Name: STRIPE_SECRET_KEY
Value: sk_test_your-test-secret-key

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_your-test-publishable-key

Name: STRIPE_WEBHOOK_SECRET
Value: whsec_your-webhook-secret

Name: STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID
Value: price_1234567890

Name: STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID
Value: price_0987654321

Name: STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID
Value: price_1111111111

Name: STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID
Value: price_2222222222
```

## 🚀 **VERCEL SECRET** (Optional - for auto-deployment)

```
Name: VERCEL_TOKEN
Value: your-vercel-token
```

---

## 📝 **Where to Find These Values:**

### **Firebase Config:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **"Project Settings"** (gear icon)
4. **"General"** tab → Your apps → Web app → Config object
5. **"Service accounts"** tab → Generate new private key

### **Stripe Keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **"Developers"** → **"API keys"**
3. Copy Publishable key and Secret key
4. **"Products"** → Create pricing plans → Copy price IDs
5. **"Webhooks"** → Add endpoint → Copy signing secret

### **Google AI Key:**
1. Go to [Google AI Studio](https://aistudio.google.com)
2. **"Get API key"** → Create new key
3. Copy the key

---

## ✅ **After Adding All Secrets:**

Your GitHub repository will automatically:
- Run security scans
- Type check your code  
- Build and test the app
- Deploy to Vercel (if token provided)

**Next step: Deploy to Vercel!** 🚀