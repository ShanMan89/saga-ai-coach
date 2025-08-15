/**
 * Admin Authentication Module
 * Handles admin role verification and access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { authAdmin } from '@/lib/firebase-admin';

/**
 * Check if user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    if (!authAdmin) {
      console.error('Firebase Admin not initialized');
      return false;
    }

    const userRecord = await authAdmin.getUser(userId);
    const customClaims = userRecord.customClaims;
    
    return customClaims?.role === 'admin' || customClaims?.admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Set admin role for a user
 */
export async function setAdminRole(userId: string, isAdmin: boolean = true): Promise<boolean> {
  try {
    if (!authAdmin) {
      console.error('Firebase Admin not initialized');
      return false;
    }

    await authAdmin.setCustomUserClaims(userId, {
      role: isAdmin ? 'admin' : 'user',
      admin: isAdmin
    });

    console.log(`Admin role ${isAdmin ? 'granted' : 'revoked'} for user:`, userId);
    return true;
  } catch (error) {
    console.error('Error setting admin role:', error);
    return false;
  }
}

/**
 * Middleware function to require admin access
 */
export async function requireAdminAccess(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!authAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify and decode token
    const decodedToken = await authAdmin.verifyIdToken(token);
    
    // Check if user has admin role
    const userIsAdmin = await isAdmin(decodedToken.uid);
    
    if (!userIsAdmin) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Forbidden: Admin access required',
          message: 'You do not have permission to access this resource'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // User is admin, allow access
    return null;
  } catch (authError: any) {
    console.error('Admin auth error:', authError);
    
    if (authError.code === 'auth/id-token-expired') {
      return new NextResponse(
        JSON.stringify({ error: 'Token expired', code: 'TOKEN_EXPIRED' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (authError.code === 'auth/argument-error') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ error: 'Authentication failed' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Extract user info from authenticated request
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!authAdmin) {
      return null;
    }

    const decodedToken = await authAdmin.verifyIdToken(token);
    const userIsAdmin = await isAdmin(decodedToken.uid);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      isAdmin: userIsAdmin,
      customClaims: decodedToken
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Admin utilities for user management
 */
export class AdminUtils {
  /**
   * List all users with pagination
   */
  static async listUsers(pageToken?: string, maxResults = 1000) {
    if (!authAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      const listUsersResult = await authAdmin.listUsers(maxResults, pageToken);
      
      return {
        users: listUsersResult.users.map(user => ({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          disabled: user.disabled,
          emailVerified: user.emailVerified,
          customClaims: user.customClaims,
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
          isAdmin: user.customClaims?.admin === true || user.customClaims?.role === 'admin'
        })),
        pageToken: listUsersResult.pageToken
      };
    } catch (error) {
      console.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Delete a user account
   */
  static async deleteUser(userId: string): Promise<boolean> {
    if (!authAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      await authAdmin.deleteUser(userId);
      console.log('Successfully deleted user:', userId);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Disable/Enable a user account
   */
  static async setUserDisabled(userId: string, disabled: boolean): Promise<boolean> {
    if (!authAdmin) {
      throw new Error('Firebase Admin not initialized');
    }

    try {
      await authAdmin.updateUser(userId, { disabled });
      console.log(`User ${disabled ? 'disabled' : 'enabled'}:`, userId);
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Generate admin dashboard stats
   */
  static async getDashboardStats() {
    // This would typically query your database for metrics
    // For now, return placeholder data
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalSessions: 0,
      totalRevenue: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Helper function to check if a route requires admin access
export function isAdminRoute(pathname: string): boolean {
  const adminPaths = [
    '/api/admin',
    '/admin',
    '/dashboard/admin'
  ];
  
  return adminPaths.some(path => pathname.startsWith(path));
}