# Firebase Authentication System Guide

This guide explains the complete Firebase authentication system implementation with role-based access control.

## 🏗️ Architecture Overview

The authentication system consists of several layers:

1. **Firebase Configuration** (`lib/firebase.ts`)
2. **Authentication Context** (`hooks/use-auth.tsx`)
3. **Protected Routes** (`components/auth/protected-route.tsx`)
4. **Role Guards** (`components/auth/role-guard.tsx`)
5. **Permission Guards** (`components/auth/permission-guard.tsx`)
6. **Error Boundaries** (`components/auth/auth-error-boundary.tsx`)

## 🔑 Key Features

### ✅ Complete Authentication Flows
- ✅ Email/Password sign up and sign in
- ✅ Google OAuth authentication
- ✅ Apple OAuth authentication
- ✅ Automatic session management
- ✅ Token refresh handling

### ✅ Role-Based Access Control
- ✅ Admin and User roles
- ✅ Route-level protection
- ✅ Component-level guards
- ✅ Permission-based feature access

### ✅ User Experience
- ✅ Loading states throughout
- ✅ Error handling and recovery
- ✅ Seamless redirects
- ✅ Mobile-responsive design

## 🔧 How to Use

### Basic Authentication Hook

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, profile, loading, isProfileLoading } = useAuth();
  
  if (loading || isProfileLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;
  
  return <div>Hello, {profile?.name}!</div>;
}
```

### Protected Routes

```typescript
import { ProtectedRoute } from '@/components/auth/protected-route';

function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin" fallbackPath="/">
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Role Guards

```typescript
import { RoleGuard } from '@/components/auth/role-guard';

function MyComponent() {
  return (
    <div>
      <RoleGuard requiredRole="admin">
        <AdminOnlyContent />
      </RoleGuard>
      
      <RoleGuard requiredRole="user">
        <UserContent />
      </RoleGuard>
    </div>
  );
}
```

### Permission Guards

```typescript
import { PermissionGuard } from '@/components/auth/permission-guard';

function PremiumFeature() {
  return (
    <PermissionGuard 
      permission="ai_unlimited"
      fallback={<UpgradePrompt />}
    >
      <PremiumContent />
    </PermissionGuard>
  );
}
```

## 🛡️ Security Features

### Security Headers
- CSP (Content Security Policy)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### Authentication Security
- Secure token storage
- Automatic token refresh
- Protected API endpoints
- Role-based authorization

## 📱 User Flows

### New User Registration
1. User visits `/auth/signup`
2. Enters email/password or uses OAuth
3. Firebase creates account
4. Cloud function creates user document
5. User redirected to dashboard

### Existing User Login
1. User visits `/auth/signin`
2. Enters credentials or uses OAuth
3. Firebase authenticates
4. Profile loaded from Firestore
5. Role-based redirect (admin → `/admin`, user → `/`)

### Role-Based Navigation
- **Admin users**: Access to admin dashboard, user management, appointments
- **Regular users**: Access to main app features, AI chat, journal, community
- **Automatic redirects**: Users trying to access unauthorized pages are redirected appropriately

## 🔍 Testing the System

Visit `/auth/test` to see the comprehensive auth test panel that shows:
- Authentication status
- User profile data
- Role assignments
- Permission matrix
- Navigation testing

## 📦 Files Structure

```
src/
├── components/auth/
│   ├── auth-error-boundary.tsx    # Error boundary for auth failures
│   ├── auth-test-panel.tsx        # Testing and debug interface
│   ├── permission-guard.tsx       # Component-level permission checks
│   ├── protected-route.tsx        # Route-level protection
│   └── role-guard.tsx            # Component-level role checks
├── hooks/
│   └── use-auth.tsx              # Main authentication hook
├── lib/
│   ├── firebase.ts               # Firebase configuration
│   └── types.ts                  # TypeScript types
├── app/
│   ├── auth/
│   │   ├── signin/               # Sign in pages
│   │   ├── signup/               # Sign up pages
│   │   └── test/                 # Auth testing page
│   ├── admin/                    # Admin-only pages
│   └── layout.tsx               # Root layout with AuthProvider
└── middleware.ts                 # Security headers
```

## 🚀 Getting Started

1. **Ensure Firebase is configured** in `lib/firebase.ts`
2. **Set up custom claims** in Firebase Admin for roles
3. **Wrap your app** with `AuthProvider` (already done in layout.tsx)
4. **Use auth hooks** in your components
5. **Protect routes** with guards as needed

## 🐛 Troubleshooting

### Common Issues

1. **User profile not loading**: Check Firestore rules and user document creation
2. **Role redirects not working**: Verify custom claims are set correctly
3. **Permission checks failing**: Ensure subscription tiers match the permission matrix
4. **Loading states persist**: Check Firebase connection and error console

### Debug Steps

1. Visit `/auth/test` to see auth status
2. Check browser console for errors
3. Verify Firebase configuration
4. Check Firestore security rules
5. Confirm custom claims are set

## 🔄 Future Enhancements

- [ ] Email verification flow
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Session management dashboard
- [ ] Advanced permission system
- [ ] Audit logging