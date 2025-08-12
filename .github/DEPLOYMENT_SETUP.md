# Deployment Setup Guide

This guide will help you configure the CI/CD pipeline for your Next.js relationship coaching application.

## Required GitHub Secrets

Configure the following secrets in your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

### Firebase Configuration (Public - Safe to expose in builds)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Firebase Admin (Server-side - Keep Secret)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
```

### Google AI
```
GOOGLE_API_KEY=your_google_ai_api_key
```

### Stripe Configuration
```
STRIPE_SECRET_KEY_DEV=sk_test_your_test_secret_key
STRIPE_SECRET_KEY_PROD=sk_live_your_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_DEV=pk_test_your_test_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PROD=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET_DEV=whsec_your_test_webhook_secret
STRIPE_WEBHOOK_SECRET_PROD=whsec_your_live_webhook_secret
```

### Stripe Product Price IDs
```
STRIPE_GROWTH_PLAN_MONTHLY_PRICE_ID=price_growth_monthly
STRIPE_GROWTH_PLAN_YEARLY_PRICE_ID=price_growth_yearly
STRIPE_TRANSFORMATION_PLAN_MONTHLY_PRICE_ID=price_transformation_monthly
STRIPE_TRANSFORMATION_PLAN_YEARLY_PRICE_ID=price_transformation_yearly
```

### Application URLs
```
NEXT_PUBLIC_APP_URL_DEV=https://your-app-dev.vercel.app
NEXT_PUBLIC_APP_URL_PROD=https://your-domain.com
```

### Optional: Notifications
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

## Vercel Setup Instructions

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Login and Link Project
```bash
vercel login
vercel link
```

### 3. Get Project Details
```bash
vercel project ls
```

### 4. Set Environment Variables in Vercel
You can set environment variables in the Vercel dashboard or via CLI:

```bash
# Production environment
vercel env add FIREBASE_PROJECT_ID production
vercel env add STRIPE_SECRET_KEY production
vercel env add GOOGLE_API_KEY production

# Preview environment (for staging)
vercel env add FIREBASE_PROJECT_ID preview
vercel env add STRIPE_SECRET_KEY preview
vercel env add GOOGLE_API_KEY preview
```

## Branch Strategy

The CI/CD pipeline is configured for:

- **`main` branch**: Deploys to production
- **`develop` branch**: Deploys to staging/preview
- **Pull requests**: Run all checks without deployment

## Monitoring & Alerts

### Health Checks
The application includes a health check endpoint at `/api/health` that monitors:
- Application status
- Memory usage
- Database connectivity (if configured)

### Performance Monitoring
- Lighthouse CI runs on every deployment
- Performance budgets are enforced
- Reports are generated and stored as artifacts

### Security Scanning
- Daily dependency audits
- CodeQL static analysis
- Secret scanning with TruffleHog
- Trivy vulnerability scanning

## Troubleshooting

### Common Issues

1. **Build failures**: Check TypeScript errors and linting issues
2. **Environment variables**: Ensure all required secrets are configured
3. **Vercel deployment**: Verify project linking and token permissions
4. **Performance issues**: Review Lighthouse reports for optimization opportunities

### Debug Commands
```bash
# Local build test
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Security audit
npm audit
```

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment-specific secrets** for development vs production
3. **Rotate secrets regularly**, especially in production
4. **Monitor security scan results** and address vulnerabilities promptly
5. **Review dependency updates** before merging

## Next Steps

1. Configure all required GitHub secrets
2. Set up Vercel project and link it to your repository
3. Configure environment variables in Vercel dashboard
4. Test the pipeline with a pull request
5. Monitor the first production deployment
6. Set up monitoring and alerting for your application