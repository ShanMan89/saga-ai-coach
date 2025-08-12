# 🚀 Complete Deployment Instructions

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Click "New repository"** (green button)
3. **Repository name**: `saga-ai-coach` (or your preferred name)
4. **Description**: `AI-powered relationship coaching application with subscription billing`
5. **Make it Public** (recommended for Vercel free tier)
6. **DO NOT** initialize with README (we already have one)
7. **Click "Create repository"**

## Step 2: Push Your Code to GitHub

Copy and run these commands in your terminal:

```bash
cd "C:\Users\shayn\OneDrive\Desktop\src"

# Add your GitHub repository as origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/saga-ai-coach.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Set Up GitHub Secrets

1. **Go to your GitHub repository**
2. **Click "Settings" tab**
3. **Click "Secrets and variables" → "Actions"**
4. **Click "New repository secret"** for each:

### Required Secrets:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id

GOOGLE_API_KEY=your-google-ai-api-key

STRIPE_SECRET_KEY=sk_test_your-test-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-test-publishable-key

STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID=price_growth_monthly
STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID=price_growth_yearly
STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID=price_transformation_monthly
STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID=price_transformation_yearly

VERCEL_TOKEN=your-vercel-token (for auto-deployment)
```

## Step 4: Deploy to Vercel

### Option A: Automatic (Recommended)
1. **Go to Vercel.com** and sign in with GitHub
2. **Click "Import Project"**
3. **Select your `saga-ai-coach` repository**
4. **Vercel will auto-detect Next.js**
5. **Add all environment variables** (same as GitHub secrets, but without VERCEL_TOKEN)
6. **Click "Deploy"**

### Option B: Manual via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 5: Configure Stripe Price IDs

1. **Go to Stripe Dashboard** → Products
2. **Create products for**:
   - Growth Plan Monthly/Yearly
   - Transformation Plan Monthly/Yearly
3. **Copy the price IDs** and update them in:
   - Vercel environment variables
   - GitHub secrets

## Step 6: Test Your Deployment

1. **Visit your Vercel URL**
2. **Test the promo codes**:
   - `WELCOME25` - 25% off first month
   - `GROWTH50` - 50% off Growth Plan
   - `TRANSFORM30` - 30% off Transformation Plan
   - `SAVE10` - $10 off any plan
   - `EARLYBIRD` - 40% off first 3 months
   - `STUDENT` - 60% off (student discount)
3. **Test subscription flow** (use Stripe test cards)
4. **Verify health check**: `https://your-app.vercel.app/api/health`

## Step 7: Set Up Monitoring (Optional)

1. **Add Slack webhook** to GitHub secrets: `SLACK_WEBHOOK_URL`
2. **Connect Google Analytics** (add tracking ID to environment)
3. **Set up Sentry** for error tracking

---

## 🎯 Your App Will Be Live At:
- **Vercel URL**: `https://saga-ai-coach.vercel.app` (or similar)
- **Custom domain**: Configure in Vercel dashboard

## 🔧 Troubleshooting

### Build Fails?
- Check environment variables are correctly set
- Ensure Firebase credentials are properly formatted
- Check the build logs in Vercel dashboard

### Stripe Integration Issues?
- Verify webhook endpoint: `https://your-app.vercel.app/api/stripe/webhooks`
- Test with Stripe CLI: `stripe listen --forward-to your-app.vercel.app/api/stripe/webhooks`

### Need Help?
- Check `.github/DEPLOYMENT_SETUP.md` for detailed guides
- Review error logs in Vercel dashboard
- Test locally first with `npm run dev`

---

## 🎉 You're Ready to Launch!

Your relationship coaching app is now:
- ✅ Deployed with CI/CD
- ✅ Secured with proper authentication
- ✅ Ready for subscriptions with 6 promo codes
- ✅ Monitored with health checks
- ✅ Optimized for performance

**Start helping couples improve their relationships! 💕**