/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import {
  isAdmin,
  setAdminRole,
  requireAdminAccess,
  getAuthenticatedUser,
  AdminUtils,
  isAdminRoute,
} from '@/lib/admin-auth'
import { authAdmin } from '@/lib/firebase-admin'

// Mock the firebase-admin module
jest.mock('@/lib/firebase-admin')

const mockAuthAdmin = authAdmin as jest.Mocked<typeof authAdmin>

describe('Admin Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isAdmin', () => {
    it('should return true for user with admin role', async () => {
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'test-uid',
        customClaims: { role: 'admin' },
      } as any)

      const result = await isAdmin('test-uid')
      expect(result).toBe(true)
      expect(mockAuthAdmin.getUser).toHaveBeenCalledWith('test-uid')
    })

    it('should return true for user with admin flag', async () => {
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'test-uid',
        customClaims: { admin: true },
      } as any)

      const result = await isAdmin('test-uid')
      expect(result).toBe(true)
    })

    it('should return false for regular user', async () => {
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'test-uid',
        customClaims: { role: 'user' },
      } as any)

      const result = await isAdmin('test-uid')
      expect(result).toBe(false)
    })

    it('should return false when Firebase Admin is not initialized', async () => {
      ;(authAdmin as any) = null

      const result = await isAdmin('test-uid')
      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      mockAuthAdmin.getUser.mockRejectedValue(new Error('Firebase error'))

      const result = await isAdmin('test-uid')
      expect(result).toBe(false)
    })
  })

  describe('setAdminRole', () => {
    it('should set admin role successfully', async () => {
      mockAuthAdmin.setCustomUserClaims.mockResolvedValue(undefined)

      const result = await setAdminRole('test-uid', true)
      expect(result).toBe(true)
      expect(mockAuthAdmin.setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: 'admin',
        admin: true,
      })
    })

    it('should remove admin role successfully', async () => {
      mockAuthAdmin.setCustomUserClaims.mockResolvedValue(undefined)

      const result = await setAdminRole('test-uid', false)
      expect(result).toBe(true)
      expect(mockAuthAdmin.setCustomUserClaims).toHaveBeenCalledWith('test-uid', {
        role: 'user',
        admin: false,
      })
    })

    it('should handle Firebase Admin not initialized', async () => {
      ;(authAdmin as any) = null

      const result = await setAdminRole('test-uid', true)
      expect(result).toBe(false)
    })

    it('should handle errors gracefully', async () => {
      mockAuthAdmin.setCustomUserClaims.mockRejectedValue(new Error('Firebase error'))

      const result = await setAdminRole('test-uid', true)
      expect(result).toBe(false)
    })
  })

  describe('requireAdminAccess', () => {
    const createMockRequest = (authHeader?: string) => {
      return {
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'Authorization') return authHeader
            return null
          }),
        },
      } as unknown as NextRequest
    }

    it('should return null for valid admin user', async () => {
      const request = createMockRequest('Bearer valid-token')
      
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'admin-uid',
      } as any)
      
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'admin-uid',
        customClaims: { role: 'admin' },
      } as any)

      const result = await requireAdminAccess(request)
      expect(result).toBeNull()
    })

    it('should return 401 for missing Authorization header', async () => {
      const request = createMockRequest()

      const result = await requireAdminAccess(request)
      expect(result?.status).toBe(401)
    })

    it('should return 401 for invalid token format', async () => {
      const request = createMockRequest('InvalidToken')

      const result = await requireAdminAccess(request)
      expect(result?.status).toBe(401)
    })

    it('should return 403 for non-admin user', async () => {
      const request = createMockRequest('Bearer valid-token')
      
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'user-uid',
      } as any)
      
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'user-uid',
        customClaims: { role: 'user' },
      } as any)

      const result = await requireAdminAccess(request)
      expect(result?.status).toBe(403)
    })

    it('should handle expired token', async () => {
      const request = createMockRequest('Bearer expired-token')
      
      const error = new Error('Token expired')
      ;(error as any).code = 'auth/id-token-expired'
      mockAuthAdmin.verifyIdToken.mockRejectedValue(error)

      const result = await requireAdminAccess(request)
      expect(result?.status).toBe(401)
    })
  })

  describe('getAuthenticatedUser', () => {
    const createMockRequest = (authHeader?: string) => {
      return {
        headers: {
          get: jest.fn().mockImplementation((key: string) => {
            if (key === 'Authorization') return authHeader
            return null
          }),
        },
      } as unknown as NextRequest
    }

    it('should return user info for valid token', async () => {
      const request = createMockRequest('Bearer valid-token')
      
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
      } as any)
      
      mockAuthAdmin.getUser.mockResolvedValue({
        uid: 'test-uid',
        customClaims: { role: 'user' },
      } as any)

      const result = await getAuthenticatedUser(request)
      expect(result).toEqual({
        uid: 'test-uid',
        email: 'test@example.com',
        name: 'Test User',
        isAdmin: false,
        customClaims: expect.any(Object),
      })
    })

    it('should return null for invalid request', async () => {
      const request = createMockRequest()

      const result = await getAuthenticatedUser(request)
      expect(result).toBeNull()
    })
  })

  describe('AdminUtils', () => {
    describe('listUsers', () => {
      it('should list users successfully', async () => {
        const mockUsers = [
          {
            uid: 'user1',
            email: 'user1@example.com',
            displayName: 'User 1',
            disabled: false,
            emailVerified: true,
            customClaims: { role: 'user' },
            metadata: {
              creationTime: '2023-01-01',
              lastSignInTime: '2023-01-02',
            },
          },
        ]

        mockAuthAdmin.listUsers.mockResolvedValue({
          users: mockUsers,
          pageToken: 'next-page',
        } as any)

        const result = await AdminUtils.listUsers()
        expect(result.users).toHaveLength(1)
        expect(result.users[0].isAdmin).toBe(false)
        expect(result.pageToken).toBe('next-page')
      })

      it('should handle errors in listing users', async () => {
        mockAuthAdmin.listUsers.mockRejectedValue(new Error('Firebase error'))

        await expect(AdminUtils.listUsers()).rejects.toThrow('Firebase error')
      })
    })

    describe('deleteUser', () => {
      it('should delete user successfully', async () => {
        mockAuthAdmin.deleteUser.mockResolvedValue(undefined)

        const result = await AdminUtils.deleteUser('test-uid')
        expect(result).toBe(true)
        expect(mockAuthAdmin.deleteUser).toHaveBeenCalledWith('test-uid')
      })

      it('should handle deletion errors', async () => {
        mockAuthAdmin.deleteUser.mockRejectedValue(new Error('Firebase error'))

        await expect(AdminUtils.deleteUser('test-uid')).rejects.toThrow('Firebase error')
      })
    })

    describe('setUserDisabled', () => {
      it('should disable user successfully', async () => {
        mockAuthAdmin.updateUser.mockResolvedValue({} as any)

        const result = await AdminUtils.setUserDisabled('test-uid', true)
        expect(result).toBe(true)
        expect(mockAuthAdmin.updateUser).toHaveBeenCalledWith('test-uid', { disabled: true })
      })

      it('should enable user successfully', async () => {
        mockAuthAdmin.updateUser.mockResolvedValue({} as any)

        const result = await AdminUtils.setUserDisabled('test-uid', false)
        expect(result).toBe(true)
        expect(mockAuthAdmin.updateUser).toHaveBeenCalledWith('test-uid', { disabled: false })
      })
    })

    describe('getDashboardStats', () => {
      it('should return dashboard stats', async () => {
        const stats = await AdminUtils.getDashboardStats()
        expect(stats).toHaveProperty('totalUsers')
        expect(stats).toHaveProperty('activeUsers')
        expect(stats).toHaveProperty('totalSessions')
        expect(stats).toHaveProperty('totalRevenue')
        expect(stats).toHaveProperty('lastUpdated')
      })
    })
  })

  describe('isAdminRoute', () => {
    it('should identify admin routes correctly', () => {
      expect(isAdminRoute('/api/admin/users')).toBe(true)
      expect(isAdminRoute('/admin/dashboard')).toBe(true)
      expect(isAdminRoute('/dashboard/admin/settings')).toBe(true)
      expect(isAdminRoute('/api/public')).toBe(false)
      expect(isAdminRoute('/user/profile')).toBe(false)
    })
  })
})