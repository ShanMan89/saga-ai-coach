# Saga AI Coach - Next.js Application

A premium relationship coaching application with comprehensive Firebase authentication and role-based access control.

## Features

- 🔐 **Complete Firebase Authentication**
  - Email/password sign up and sign in
  - Google and Apple OAuth integration
  - Secure session management

- 🛡️ **Role-Based Access Control**
  - Admin dashboard and user management
  - Permission-based feature access
  - Protected routes and components

- 📱 **Modern UI/UX**
  - Mobile-responsive design
  - shadcn/ui component library
  - Tailwind CSS styling

- ⚡ **Real-time Features**
  - Firestore integration
  - Live data synchronization
  - Real-time notifications

## Quick Start

1. **Clone and install dependencies**

   ```bash
   # Note: package.json not found - needs to be created
   npm install
   ```

2. **Set up Firebase**
   - Configure your Firebase project
   - Update `lib/firebase.ts` with your config

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Visit the application**
   - Main app: `http://localhost:3000`
   - Auth test page: `http://localhost:3000/auth/test`

## Project Structure

See [PLANNING.md](./PLANNING.md) for detailed architecture information.

## Authentication System

See [FIREBASE_AUTH_GUIDE.md](./FIREBASE_AUTH_GUIDE.md) for comprehensive authentication documentation.

## Configuration

This project requires:

- Node.js and npm/yarn
- Firebase project with Auth and Firestore enabled
- Environment variables for Firebase configuration
