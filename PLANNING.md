# Project Planning Document

## Project Structure
```
src/
├── ai/                     # AI-related functionality (TypeScript)
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin-only pages  
│   ├── auth/              # Authentication pages
│   └── [other pages]      # User-facing pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components (shadcn/ui)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── services/             # Service layer (Firestore, etc.)
└── middleware.ts         # Next.js middleware
```

## Technology Stack
- **Framework**: Next.js (React)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **State Management**: React Context (useAuth)

## Key Features
- Firebase Authentication (email/password, Google, Apple)
- Role-based access control (admin/user)
- Permission-based feature access
- Protected routes and components
- Mobile-responsive design
- Real-time data with Firestore

## Architecture Decisions
- Client-side authentication with Firebase SDK
- Role-based routing via AppLayout component  
- Context-based state management for auth
- Component-level guards for granular access control
- Middleware for security headers only