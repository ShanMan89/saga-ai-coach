# Firebase Private Key Fix for Vercel

## Problem
Getting "Failed to parse private key: Error: Too few bytes to parse DER" in production.

## Solution
Your Firebase private key in Vercel needs to be formatted correctly:

### Option 1: Base64 Encoded (Recommended)
1. Take your original private key from Firebase service account JSON
2. Base64 encode the ENTIRE key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. Set this base64 string as your `FIREBASE_PRIVATE_KEY` environment variable
4. Update the code to decode it

### Option 2: Properly Escaped
If the key has newlines like `\n`, make sure they are properly escaped in Vercel:
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BA...\n-----END PRIVATE KEY-----
```

### Option 3: Use JSON Format Instead
Set `FIREBASE_SERVICE_ACCOUNT_JSON` with the entire service account JSON as a single line string.

## Check Your Current Setup
Go to Vercel → Project Settings → Environment Variables and verify:
- `FIREBASE_PRIVATE_KEY` is set correctly
- Or `FIREBASE_SERVICE_ACCOUNT_JSON` is set with full JSON
- `FIREBASE_PROJECT_ID` and `FIREBASE_CLIENT_EMAIL` are set

The build completed successfully despite this warning, so Firebase Admin is falling back to other methods, but fixing this will ensure all server-side Firebase operations work properly.