/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, renderHook, waitFor, act } from '@testing-library/react'
import { User, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('firebase/auth')
jest.mock('firebase/firestore')
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/firebase')
jest.mock('@/lib/avatar-utils', () => ({
  getPlaceholderAvatar: jest.fn().mockReturnValue('placeholder-avatar-url'),
}))

const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>
const mockDoc = doc as jest.MockedFunction<typeof doc>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

const mockToast = jest.fn()

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToast.mockReturnValue({ toast: mockToast })
    
    // Mock doc function
    mockDoc.mockReturnValue({} as any)
  })

  const createMockUser = (overrides = {}): User => ({
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'test-photo-url',
    getIdTokenResult: jest.fn().mockResolvedValue({
      claims: { role: 'user', subscriptionTier: 'Explorer' },
    }),
    ...overrides,
  } as any)

  const renderHookWithProvider = (hook: () => any) => {
    return renderHook(hook, {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    })
  }

  it('should initialize with loading state', () => {
    // Mock onAuthStateChanged to not call the callback immediately
    mockOnAuthStateChanged.mockImplementation(() => jest.fn())

    const { result } = renderHookWithProvider(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.isProfileLoading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('should set user and profile when authenticated', async () => {
    const mockUser = createMockUser()
    const mockUserData = {
      name: 'Test User',
      avatar: 'test-avatar',
      subscriptionTier: 'Growth',
      messageCount: 5,
      role: 'user',
      stripeCustomerId: 'cus_123',
      relationshipStatus: 'Single',
      goals: ['goal1'],
      focusAreas: ['area1'],
    }

    // Mock successful Firestore document fetch
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    } as any)

    // Mock onAuthStateChanged to call with user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBe(mockUser)
    expect(result.current.profile).toEqual({
      uid: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'test-avatar',
      subscriptionTier: 'Explorer', // Overridden by token claims
      messageCount: 5,
      role: 'user',
      stripeCustomerId: 'cus_123',
      relationshipStatus: 'Single',
      goals: ['goal1'],
      focusAreas: ['area1'],
    })
  })

  it('should handle user with no profile document', async () => {
    const mockUser = createMockUser()

    // Mock no Firestore document
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as any)

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toEqual({
      uid: 'test-uid',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'test-photo-url',
      subscriptionTier: 'Explorer',
      messageCount: 0,
      role: 'user',
    })
  })

  it('should handle admin user with correct permissions', async () => {
    const mockUser = createMockUser({
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: { role: 'admin', subscriptionTier: 'admin' },
      }),
    })

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    } as any)

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile?.role).toBe('admin')
    expect(result.current.profile?.subscriptionTier).toBe('Transformation')
    expect(result.current.hasPermission('ai_unlimited')).toBe(true)
    expect(result.current.hasPermission('weekly_insights')).toBe(true)
  })

  it('should handle logout', async () => {
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.isProfileLoading).toBe(false)
  })

  it('should handle permission checks correctly', async () => {
    const mockUser = createMockUser()
    const mockUserData = {
      subscriptionTier: 'Growth',
      role: 'user',
    }

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserData,
    } as any)

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Growth tier permissions
    expect(result.current.hasPermission('ai_unlimited')).toBe(true)
    expect(result.current.hasPermission('community_write')).toBe(true)
    expect(result.current.hasPermission('weekly_insights')).toBe(false) // Transformation only
    expect(result.current.hasPermission('session_prep')).toBe(false) // Transformation only
  })

  it('should refresh profile when requested', async () => {
    const mockUser = createMockUser()
    const initialData = { name: 'Initial Name', subscriptionTier: 'Explorer' }
    const updatedData = { name: 'Updated Name', subscriptionTier: 'Growth' }

    // First call returns initial data
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => initialData,
    } as any)

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile?.name).toBe('Initial Name')

    // Mock updated data for refresh
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => updatedData,
    } as any)

    await act(async () => {
      await result.current.refreshProfile()
    })

    expect(result.current.profile?.name).toBe('Updated Name')
  })

  it('should handle Firestore errors gracefully', async () => {
    const mockUser = createMockUser()

    mockGetDoc.mockRejectedValue(new Error('Firestore error'))

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error loading profile',
      description: 'Firestore error',
      variant: 'destructive',
    })
  })

  it('should not show toast for network errors', async () => {
    const mockUser = createMockUser()

    mockGetDoc.mockRejectedValue(new Error('Failed to fetch'))

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.profile).toBeNull()
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('should handle Explorer tier permissions', async () => {
    const mockUser = createMockUser()

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ subscriptionTier: 'Explorer', role: 'user' }),
    } as any)

    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUser)
      return jest.fn()
    })

    const { result } = renderHookWithProvider(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Explorer tier should not have premium permissions
    expect(result.current.hasPermission('ai_unlimited')).toBe(false)
    expect(result.current.hasPermission('community_write')).toBe(false)
    expect(result.current.hasPermission('journal_analysis')).toBe(false)
  })
})