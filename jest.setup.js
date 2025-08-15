import '@testing-library/jest-dom'

// Mock Firebase Admin
jest.mock('./lib/firebase-admin', () => ({
  authAdmin: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    listUsers: jest.fn(),
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
  },
  firestoreAdmin: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}))

// Mock Firebase Client
jest.mock('./lib/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
}))

// Mock Stripe
jest.mock('./lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))

// Mock Google Calendar
jest.mock('./services/google-calendar', () => ({
  GoogleCalendarService: {
    scheduleAppointment: jest.fn(),
    cancelAppointment: jest.fn(),
    getAvailableSlots: jest.fn(),
  },
}))

// Mock Email Service
jest.mock('./lib/email-service', () => ({
  emailService: {
    sendWelcomeEmail: jest.fn(),
    sendPaymentSuccessEmail: jest.fn(),
    sendPaymentFailedEmail: jest.fn(),
    sendSOSBookingConfirmation: jest.fn(),
  },
}))

// Mock Next.js Router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Global test utilities
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock fetch globally
global.fetch = jest.fn()

// Mock environment variables
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
process.env.GOOGLE_CALENDAR_CREDENTIALS = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: 'test-private-key',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: 'test-client-id',
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})