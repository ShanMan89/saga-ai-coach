# 🚀 Deploy to Vercel - Step by Step

## **Option 1: Easy Deployment (Recommended)**

### **Step 1: Connect GitHub to Vercel**
1. Go to [Vercel.com](https://vercel.com)
2. Click **"Sign up"** → **"Continue with GitHub"**
3. Authorize Vercel to access your repositories

### **Step 2: Import Your Project**
1. Click **"New Project"** 
2. Find **"saga-ai-coach"** in your repositories
3. Click **"Import"**

### **Step 3: Configure Project**
1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. Click **"Deploy"** (it will fail first time - this is expected!)

### **Step 4: Add Environment Variables**
1. After first deployment fails, go to **"Settings"** tab
2. Click **"Environment Variables"**
3. Add each variable below:

## 🔐 **VERCEL ENVIRONMENT VARIABLES**

### **Firebase Configuration:**
```
NEXT_PUBLIC_FIREBASE_API_KEY = your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID = your-app-id

FIREBASE_PROJECT_ID = your-project-id
FIREBASE_PRIVATE_KEY_ID = your-private-key-id
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----
your-actual-private-key-content
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = your-client-id
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI = https://oauth2.googleapis.com/token
```

### **Google AI:**
```
GOOGLE_API_KEY = your-google-ai-api-key
```

### **Stripe Configuration:**
```
STRIPE_SECRET_KEY = sk_test_your-test-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_your-test-publishable-key
STRIPE_WEBHOOK_SECRET = whsec_your-webhook-secret

STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID = price_growth_monthly
STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID = price_growth_yearly
STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID = price_transformation_monthly
STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID = price_transformation_yearly
```

### **App Configuration:**
```
NEXT_PUBLIC_APP_URL = https://your-app-name.vercel.app
```

### **Step 5: Redeploy**
1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment
3. ✅ Your app should now deploy successfully!

---

## **Option 2: CLI Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🔧 **Configure Stripe Webhooks**

### **Step 1: Get Your Vercel URL**
After deployment, copy your app URL: `https://your-app-name.vercel.app`

### **Step 2: Add Webhook in Stripe**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **"Developers"** → **"Webhooks"**
3. Click **"Add endpoint"**
4. **Endpoint URL**: `https://your-app-name.vercel.app/api/stripe/webhooks`
5. **Events to send**:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed` 
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Click **"Add endpoint"**
7. Copy the **"Signing secret"** and update `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 🎯 **Test Your Deployment**

### **Step 1: Visit Your App**
Go to: `https://your-app-name.vercel.app`

### **Step 2: Test Promo Codes**
Try these codes on the pricing page:
- `WELCOME25` - 25% off first month
- `GROWTH50` - 50% off Growth Plan  
- `TRANSFORM30` - 30% off Transformation Plan
- `SAVE10` - $10 off any plan
- `EARLYBIRD` - 40% off first 3 months
- `STUDENT` - 60% off (student discount)

### **Step 3: Test Subscription Flow**
Use Stripe test card: `4242 4242 4242 4242`

### **Step 4: Check Health**
Visit: `https://your-app-name.vercel.app/api/health`

---

## 🎉 **SUCCESS!**

Your relationship coaching app is now:
- ✅ **Live on the internet**
- ✅ **Fully functional with payments**
- ✅ **6 promo codes ready to use**
- ✅ **Automatic deployments from GitHub**
- ✅ **Professional CI/CD pipeline**

**You're ready to help couples improve their relationships! 💕**

---

## 🆘 **Troubleshooting**

### **Build Fails?**
- Check all environment variables are set correctly
- Ensure Firebase private key is properly formatted (with quotes)
- Check the build logs in Vercel dashboard

### **Stripe Not Working?**
- Verify webhook URL is correct
- Test webhook with Stripe CLI: `stripe listen --forward-to your-app.vercel.app/api/stripe/webhooks`
- Check webhook secret matches

### **Firebase Auth Issues?**
- Verify all Firebase config values are correct
- Check Firebase console for authorized domains
- Add your Vercel domain to Firebase authorized domains

**Need help? Check the error logs in Vercel dashboard!**