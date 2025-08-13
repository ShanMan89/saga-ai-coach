/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'lh3.googleusercontent.com', 'firebasestorage.googleapis.com'],
  },
  env: {
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  experimental: {
    serverComponentsExternalPackages: ['@genkit-ai/core', '@genkit-ai/googleai'],
  },
  webpack: (config, { isServer }) => {
    // Fix for undici module compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        undici: false,
      };
      
      // Skip processing undici on client side
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig