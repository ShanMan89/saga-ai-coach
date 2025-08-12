# 🚀 DEPLOY TO VERCEL - DO THIS AFTER GITHUB SECRETS!

## **Step 1: Sign Up for Vercel**
**Click this link:** https://vercel.com/signup

1. **Click "Continue with GitHub"**
2. **Authorize Vercel** to access your repositories
3. **Complete your profile**

## **Step 2: Import Your Project**
**After signing in to Vercel:**

1. **Click "New Project"** (big button)
2. **Find "saga-ai-coach"** in your repository list
3. **Click "Import"**

## **Step 3: Configure Deployment**
**Vercel will auto-detect Next.js - just click "Deploy"**

⚠️ **First deployment will FAIL** - this is expected! We need to add environment variables.

## **Step 4: Add Environment Variables**
**After the failed deployment:**

1. **Go to "Settings" tab** in your Vercel project
2. **Click "Environment Variables"**
3. **Add each variable below:**

---

## 🔐 **VERCEL ENVIRONMENT VARIABLES**

### **Firebase Configuration:**
```
NEXT_PUBLIC_FIREBASE_API_KEY = [Same as GitHub secret]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = [Same as GitHub secret]
NEXT_PUBLIC_FIREBASE_PROJECT_ID = [Same as GitHub secret]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = [Same as GitHub secret]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = [Same as GitHub secret]
NEXT_PUBLIC_FIREBASE_APP_ID = [Same as GitHub secret]

FIREBASE_PROJECT_ID = [Same as GitHub secret]
FIREBASE_PRIVATE_KEY_ID = [Same as GitHub secret]
FIREBASE_PRIVATE_KEY = [Same as GitHub secret - include quotes and line breaks]
FIREBASE_CLIENT_EMAIL = [Same as GitHub secret]
FIREBASE_CLIENT_ID = [Same as GitHub secret]
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI = https://oauth2.googleapis.com/token
```

### **Google AI:**
```
GOOGLE_API_KEY = [Same as GitHub secret]
```

### **Stripe Configuration:**
```
STRIPE_SECRET_KEY = [Same as GitHub secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = [Same as GitHub secret]
STRIPE_WEBHOOK_SECRET = [Leave empty for now - will add after deployment]

STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID = [Same as GitHub secret]
STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID = [Same as GitHub secret]
STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID = [Same as GitHub secret]
STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID = [Same as GitHub secret]
```

### **App URL (replace with your actual Vercel URL):**
```
NEXT_PUBLIC_APP_URL = https://saga-ai-coach-shanman89.vercel.app
```

## **Step 5: Redeploy**
1. **Go to "Deployments" tab**
2. **Click the 3 dots** on latest deployment
3. **Click "Redeploy"**
4. ✅ **Should deploy successfully now!**

---

## **Step 6: Configure Stripe Webhook**

### **After successful deployment:**

1. **Copy your Vercel app URL** (e.g., `https://saga-ai-coach-shanman89.vercel.app`)
2. **Go to Stripe Dashboard:** https://dashboard.stripe.com/webhooks
3. **Click "Add endpoint"**
4. **Endpoint URL:** `https://your-app-url.vercel.app/api/stripe/webhooks`
5. **Select events:**
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. **Click "Add endpoint"**
7. **Copy the "Signing secret"**
8. **Add to Vercel environment variables:**
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_[your webhook secret]`
9. **Redeploy one more time**

---

## **Step 7: Test Your App! 🎉**

### **Visit your live app:**
**Your URL:** `https://your-app-name.vercel.app`

### **Test promo codes:**
Go to pricing page and try:
- `WELCOME25` - 25% off first month
- `GROWTH50` - 50% off Growth Plan
- `TRANSFORM30` - 30% off Transformation Plan
- `SAVE10` - $10 off any plan
- `EARLYBIRD` - 40% off first 3 months
- `STUDENT` - 60% off student discount

### **Test subscription flow:**
- Use Stripe test card: `4242 4242 4242 4242`
- Any future date for expiry
- Any 3-digit CVC

### **Check health endpoint:**
Visit: `https://your-app-url.vercel.app/api/health`

---

## 🎯 **SUCCESS CHECKLIST:**

- ✅ App loads without errors
- ✅ Can sign up/sign in with Firebase
- ✅ Promo codes work on pricing page
- ✅ Stripe checkout opens successfully
- ✅ Health endpoint returns OK
- ✅ GitHub Actions are passing

**You now have a fully functional relationship coaching app! 🎉💕**

---

## 🆘 **Troubleshooting:**

### **Build fails in Vercel?**
- Check all environment variables are set correctly
- Ensure Firebase private key includes quotes and line breaks
- Check build logs for specific errors

### **Stripe not working?**
- Verify webhook URL is correct
- Check webhook secret is properly set
- Test with Stripe test cards only

### **Firebase auth issues?**
- Add your Vercel domain to Firebase authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains

**Need help? Check the Vercel deployment logs for detailed error messages!**