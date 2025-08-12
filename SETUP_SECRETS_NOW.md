# 🔐 SET UP GITHUB SECRETS - DO THIS NOW!

## **Step 1: Go to Your Repository Settings**
**Click this link:** https://github.com/ShanMan89/saga-ai-coach/settings/secrets/actions

## **Step 2: Add Each Secret**
Click **"New repository secret"** for each item below:

---

## 🚨 **CRITICAL SECRETS** (Required for deployment)

### **Firebase Project Configuration:**
```
Name: FIREBASE_PROJECT_ID
Value: [Your Firebase project ID - get from Firebase console]

Name: FIREBASE_PRIVATE_KEY_ID  
Value: [Get from Firebase service account JSON]

Name: FIREBASE_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----
[Your actual private key content]
-----END PRIVATE KEY-----"

Name: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@yourproject.iam.gserviceaccount.com

Name: FIREBASE_CLIENT_ID
Value: [Get from Firebase service account JSON]
```

### **Firebase Public Config (from Firebase web app config):**
```
Name: NEXT_PUBLIC_FIREBASE_API_KEY
Value: [Your Firebase API key]

Name: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: yourproject.firebaseapp.com

Name: NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: [Same as FIREBASE_PROJECT_ID above]

Name: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: yourproject.appspot.com

Name: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: [Your sender ID number]

Name: NEXT_PUBLIC_FIREBASE_APP_ID
Value: [Your Firebase app ID]
```

### **Stripe Configuration:**
```
Name: STRIPE_SECRET_KEY
Value: sk_test_[your test secret key]

Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_[your test publishable key]

Name: STRIPE_WEBHOOK_SECRET
Value: whsec_[will get this after Vercel deployment]
```

### **Stripe Price IDs (create these in Stripe Dashboard):**
```
Name: STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID
Value: price_[create in Stripe for Growth Monthly]

Name: STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID
Value: price_[create in Stripe for Growth Yearly]

Name: STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID
Value: price_[create in Stripe for Transformation Monthly]

Name: STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID
Value: price_[create in Stripe for Transformation Yearly]
```

### **Google AI:**
```
Name: GOOGLE_API_KEY
Value: [Your Google AI Studio API key]
```

---

## 📍 **WHERE TO GET THESE VALUES:**

### **🔥 Firebase Values:**
1. Go to: https://console.firebase.google.com
2. Select your project (or create new one)
3. **For public config:** Settings → General → Your apps → Web app config
4. **For private key:** Settings → Service accounts → Generate new private key

### **💳 Stripe Values:**
1. Go to: https://dashboard.stripe.com
2. **API Keys:** Developers → API keys
3. **Price IDs:** Products → Create plans → Copy price IDs
4. **Webhook:** (Set up after Vercel deployment)

### **🤖 Google AI Key:**
1. Go to: https://aistudio.google.com
2. Get API key → Create new key

---

## ✅ **After Adding All Secrets:**

1. **Go back to your repository:** https://github.com/ShanMan89/saga-ai-coach
2. **GitHub Actions will automatically run** (check Actions tab)
3. **Next step:** Deploy to Vercel!

---

## 🚨 **IMPORTANT NOTES:**

- **Use TEST keys only** (sk_test_, pk_test_) for now
- **Firebase private key** must include the quotes and line breaks
- **Don't share these values** with anyone
- **You can update them later** as needed

**Ready? Start adding secrets now!** 🔐