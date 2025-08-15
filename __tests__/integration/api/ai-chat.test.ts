/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/ai/chat/route'
import { authAdmin } from '@/lib/firebase-admin'
import { aiChatGuidanceFlow } from '@/ai/flows/ai-chat-guidance'

// Mock dependencies
jest.mock('@/lib/firebase-admin')
jest.mock('@/ai/flows/ai-chat-guidance')

const mockAuthAdmin = authAdmin as jest.Mocked<typeof authAdmin>
const mockAiChatGuidanceFlow = aiChatGuidanceFlow as jest.MockedFunction<typeof aiChatGuidanceFlow>

describe('/api/ai/chat Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (
    body: any,
    authHeader?: string
  ): NextRequest => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('Authorization', authHeader)
    }

    return {
      headers: {
        get: (key: string) => headers.get(key),
      },
      json: () => Promise.resolve(body),
    } as unknown as NextRequest
  }

  const validRequestBody = {
    message: 'How can I improve communication with my partner?',
    userProfile: {
      uid: 'test-user-123',
      subscriptionTier: 'Growth',
      messageCount: 5,
    },
    previousMessages: [],
    context: 'User is seeking relationship advice',
  }

  const mockAiResponse = {
    response: 'Great question! Communication is the foundation of any healthy relationship.',
    suggestions: [
      'Practice active listening',
      'Use "I" statements when expressing feelings',
      'Schedule regular check-ins',
    ],
    resources: [
      {
        title: 'Communication Fundamentals',
        description: 'Basic principles of effective communication',
        type: 'article',
      },
    ],
  }

  describe('Authentication', () => {
    it('should return 401 for missing Authorization header', async () => {
      const request = createMockRequest(validRequestBody)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toContain('Unauthorized')
    })

    it('should return 401 for invalid Authorization header format', async () => {
      const request = createMockRequest(validRequestBody, 'InvalidToken')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toContain('Unauthorized')
    })

    it('should return 500 when authAdmin is not initialized', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')
      ;(authAdmin as any) = null

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toContain('Server configuration error')
    })

    it('should return 401 for invalid token', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer invalid-token')

      mockAuthAdmin.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toContain('Unauthorized')
    })

    it('should proceed with valid token', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)
    })

    it('should return 400 for missing message', async () => {
      const invalidBody = { ...validRequestBody, message: undefined }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
      expect(result.details).toBeDefined()
    })

    it('should return 400 for empty message', async () => {
      const invalidBody = { ...validRequestBody, message: '' }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
    })

    it('should return 400 for message too long', async () => {
      const invalidBody = { ...validRequestBody, message: 'a'.repeat(5001) }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
    })

    it('should return 400 for missing userProfile', async () => {
      const invalidBody = { ...validRequestBody, userProfile: undefined }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
    })

    it('should return 400 for invalid subscription tier', async () => {
      const invalidBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          subscriptionTier: 'InvalidTier',
        },
      }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toBe('Invalid input')
    })

    it('should accept valid input with all fields', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })

    it('should accept valid input with optional fields omitted', async () => {
      const minimalBody = {
        message: 'Help me with my relationship',
        userProfile: {
          uid: 'test-user-123',
          subscriptionTier: 'Explorer',
        },
      }
      const request = createMockRequest(minimalBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })
  })

  describe('Authorization', () => {
    beforeEach(() => {
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)
    })

    it('should return 403 when user accesses different user data', async () => {
      const invalidBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          uid: 'different-user-456',
        },
      }
      const request = createMockRequest(invalidBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toContain('Forbidden')
    })

    it('should allow user to access their own data', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)
    })

    it('should return 429 for Explorer tier exceeding message limit', async () => {
      const explorerBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          subscriptionTier: 'Explorer',
          messageCount: 10, // At limit
        },
      }
      const request = createMockRequest(explorerBody, 'Bearer valid-token')

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(429)
      expect(result.error).toContain('Rate limit exceeded')
    })

    it('should allow Explorer tier within message limit', async () => {
      const explorerBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          subscriptionTier: 'Explorer',
          messageCount: 5, // Under limit
        },
      }
      const request = createMockRequest(explorerBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })

    it('should allow Growth tier unlimited messages', async () => {
      const growthBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          subscriptionTier: 'Growth',
          messageCount: 100, // High number
        },
      }
      const request = createMockRequest(growthBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })

    it('should allow Transformation tier unlimited messages', async () => {
      const transformationBody = {
        ...validRequestBody,
        userProfile: {
          ...validRequestBody.userProfile,
          subscriptionTier: 'Transformation',
          messageCount: 1000, // Very high number
        },
      }
      const request = createMockRequest(transformationBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })
  })

  describe('AI Flow Integration', () => {
    beforeEach(() => {
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)
    })

    it('should call AI flow with correct parameters', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      await POST(request)

      expect(mockAiChatGuidanceFlow).toHaveBeenCalledWith({
        message: validRequestBody.message,
        userProfile: validRequestBody.userProfile,
        previousMessages: validRequestBody.previousMessages,
        context: validRequestBody.context,
      })
    })

    it('should return AI response', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockResolvedValue(mockAiResponse)

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result).toEqual(mockAiResponse)
    })

    it('should return fallback response when AI flow fails', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      mockAiChatGuidanceFlow.mockRejectedValue(new Error('AI service unavailable'))

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.response).toContain('here to help')
      expect(result.suggestions).toHaveLength(3)
      expect(result.resources).toHaveLength(1)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuthAdmin.verifyIdToken.mockResolvedValue({
        uid: 'test-user-123',
      } as any)
    })

    it('should handle malformed JSON', async () => {
      const request = {
        headers: {
          get: () => 'Bearer valid-token',
        },
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as NextRequest

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.response).toContain('here to help')
    })

    it('should handle unexpected errors gracefully', async () => {
      const request = createMockRequest(validRequestBody, 'Bearer valid-token')

      // Mock an unexpected error in the processing
      mockAiChatGuidanceFlow.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.response).toContain('here to help')
    })
  })
})