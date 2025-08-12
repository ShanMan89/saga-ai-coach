# 🚀 Deployment Checklist

Use this checklist to ensure a smooth deployment of your Next.js relationship coaching application.

## Pre-Deployment Setup

### 🔐 Security & Secrets
- [ ] All sensitive data moved to environment variables
- [ ] No API keys or secrets in code
- [ ] `.env` files added to `.gitignore`
- [ ] GitHub repository secrets configured
- [ ] Firebase admin credentials secured
- [ ] Stripe webhook secrets configured

### 🏗️ Build & Testing
- [ ] Application builds successfully (`npm run build`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No high/critical security vulnerabilities (`npm audit`)
- [ ] All environment variables referenced correctly

### 🔧 Configuration Files
- [ ] `vercel.json` configured with proper headers
- [ ] `next.config.js` optimized for production
- [ ] `.lighthouserc.json` configured for performance monitoring
- [ ] Health check endpoint (`/api/health`) working

## Vercel Setup

### 📁 Project Setup
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Project imported and linked
- [ ] Build settings configured (Framework: Next.js)

### 🌍 Environment Variables
- [ ] **Firebase Config** (Public)
  - [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
  - [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

- [ ] **Firebase Admin** (Secret)
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_PRIVATE_KEY_ID`
  - [ ] `FIREBASE_PRIVATE_KEY`
  - [ ] `FIREBASE_CLIENT_EMAIL`
  - [ ] `FIREBASE_CLIENT_ID`
  - [ ] `FIREBASE_AUTH_URI`
  - [ ] `FIREBASE_TOKEN_URI`

- [ ] **Google AI**
  - [ ] `GOOGLE_API_KEY`

- [ ] **Stripe Configuration**
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] Price IDs for all subscription plans

- [ ] **Application URLs**
  - [ ] `NEXT_PUBLIC_APP_URL` (for production)

### 🌐 Domain Configuration
- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated
- [ ] SSL certificate verified
- [ ] Domain redirects configured

## GitHub Actions Setup

### 🔑 Repository Secrets
- [ ] All Vercel secrets configured
- [ ] Firebase secrets configured
- [ ] Stripe secrets (dev and prod)
- [ ] Google AI API key
- [ ] Slack webhook URL (optional)

### 🔄 Workflow Testing
- [ ] Create test pull request
- [ ] Verify all CI checks pass
- [ ] Confirm build artifacts generated
- [ ] Test security scans complete
- [ ] Verify Lighthouse audit runs

## Deployment Testing

### 🧪 Staging Environment
- [ ] Deploy to preview/staging first
- [ ] Test user registration flow
- [ ] Test user authentication
- [ ] Test subscription workflow
- [ ] Test Stripe payments (test mode)
- [ ] Test AI chat functionality
- [ ] Test journal features
- [ ] Test SOS booking feature

### 🔍 Production Validation
- [ ] Health check endpoint responds (`/api/health`)
- [ ] Home page loads correctly
- [ ] Authentication pages work
- [ ] Dashboard accessible after login
- [ ] Payment flow functional
- [ ] All API routes respond correctly

## Post-Deployment

### 📊 Monitoring Setup
- [ ] Vercel analytics enabled
- [ ] Performance metrics baseline established
- [ ] Error tracking configured
- [ ] Lighthouse scores documented

### 🔔 Alerts & Notifications
- [ ] Deployment success/failure notifications
- [ ] Performance alert thresholds set
- [ ] Error rate monitoring active
- [ ] Uptime monitoring configured

### 📈 Performance Optimization
- [ ] Initial Lighthouse audit completed
- [ ] Core Web Vitals measured
- [ ] Image optimization verified
- [ ] API response times measured
- [ ] Bundle size analyzed

## Security Verification

### 🛡️ Security Headers
- [ ] CSP (Content Security Policy) configured
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] HTTPS redirect working
- [ ] Secure cookie configuration

### 🔐 API Security
- [ ] Rate limiting implemented
- [ ] Input validation working
- [ ] Authentication middleware active
- [ ] CORS properly configured
- [ ] Webhook signature verification

## Business Continuity

### 💾 Backup Strategy
- [ ] Firebase data backup configured
- [ ] Environment variables documented
- [ ] Repository access documented
- [ ] Deployment rollback procedure tested

### 📞 Emergency Procedures
- [ ] Rollback process documented
- [ ] Emergency contact list created
- [ ] Incident response plan defined
- [ ] Service status page configured (optional)

## Documentation

### 📚 Team Documentation
- [ ] Deployment guide updated
- [ ] Environment setup documented
- [ ] Troubleshooting guide created
- [ ] Architecture documentation current

### 🎓 User Documentation
- [ ] Feature documentation updated
- [ ] Privacy policy current
- [ ] Terms of service updated
- [ ] Support contact information current

## Final Verification

### ✅ Go-Live Checklist
- [ ] All above items completed
- [ ] Stakeholder approval received
- [ ] Marketing team notified
- [ ] Support team briefed
- [ ] Analytics tracking active
- [ ] Social media accounts ready

### 🎉 Launch Day
- [ ] Final deployment executed
- [ ] All systems operational
- [ ] Performance metrics normal
- [ ] User feedback channels active
- [ ] Team monitoring actively

---

## Emergency Rollback Procedure

If issues are discovered post-deployment:

1. **Immediate**: Revert to previous Vercel deployment
2. **Short-term**: Fix issues in development
3. **Long-term**: Re-deploy with fixes and additional testing

### Rollback Commands:
```bash
# Via Vercel CLI
vercel rollback [deployment-url]

# Via GitHub
# Revert the problematic commit and push
```

---

## Support Contacts

- **Vercel Support**: Via dashboard or email
- **Firebase Support**: Via Google Cloud Console
- **Stripe Support**: Via Stripe dashboard
- **GitHub Support**: Via GitHub support portal

Remember: **Test everything thoroughly in staging before promoting to production!**