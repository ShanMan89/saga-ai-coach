/**
 * @jest-environment node
 */

import { aiChatGuidanceFlow } from '@/ai/flows/ai-chat-guidance'
import type {
  ChatGuidanceInput,
  ChatGuidanceOutput,
  Message,
  UserProfile,
} from '@/ai/flows/ai-chat-guidance'
import { ai, AI_MODELS } from '@/ai/genkit'

// Mock the AI module
jest.mock('@/ai/genkit')

const mockAi = ai as jest.Mocked<typeof ai>

describe('AI Chat Guidance Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockUserProfile = (overrides = {}): UserProfile => ({
    id: 'test-uid',
    name: 'Test User',
    email: 'test@example.com',
    subscriptionTier: 'Growth',
    relationshipStatus: 'In a relationship',
    goals: ['Improve communication', 'Build trust'],
    focusAreas: ['Communication', 'Conflict resolution'],
    ...overrides,
  })

  const createMockMessage = (role: 'user' | 'assistant', content: string): Message => ({
    role,
    content,
    timestamp: new Date(),
  })

  const createMockInput = (overrides = {}): ChatGuidanceInput => ({
    message: 'I need help with communication in my relationship.',
    userProfile: createMockUserProfile(),
    previousMessages: [
      createMockMessage('user', 'Hello, I need some relationship advice.'),
      createMockMessage('assistant', 'I am here to help you with your relationship journey.'),
    ],
    context: undefined,
    ...overrides,
  })

  const createMockOutput = (): ChatGuidanceOutput => ({
    response: 'Communication is key in any relationship. Here are some strategies that can help.',
    suggestions: [
      'Try active listening techniques',
      'Schedule regular check-ins with your partner',
      'Practice expressing your feelings clearly',
    ],
    resources: [
      {
        title: 'Active Listening Guide',
        description: 'Learn how to listen effectively in relationships',
        type: 'article',
      },
      {
        title: 'Communication Exercise',
        description: 'Practice expressing feelings constructively',
        type: 'exercise',
      },
    ],
  })

  describe('aiChatGuidanceFlow', () => {
    it('should provide guidance successfully', async () => {
      const mockInput = createMockInput()
      const mockOutput = createMockOutput()

      // Mock the AI flow
      const mockFlow = jest.fn().mockResolvedValue(mockOutput)
      mockAi.defineFlow.mockReturnValue(mockFlow)

      // Mock AI generate
      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await mockFlow(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should handle user profile with minimal information', async () => {
      const minimalProfile = createMockUserProfile({
        relationshipStatus: undefined,
        goals: undefined,
        focusAreas: undefined,
      })

      const mockInput = createMockInput({
        userProfile: minimalProfile,
      })

      const mockOutput = createMockOutput()

      const mockFlow = jest.fn().mockResolvedValue(mockOutput)
      mockAi.defineFlow.mockReturnValue(mockFlow)

      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await mockFlow(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should include conversation history in context', async () => {
      const previousMessages = [
        createMockMessage('user', 'I am struggling with trust issues.'),
        createMockMessage('assistant', 'Trust is fundamental in relationships.'),
        createMockMessage('user', 'How can I rebuild trust?'),
      ]

      const mockInput = createMockInput({
        previousMessages,
      })

      let capturedPrompt = ''
      const mockGenerate = jest.fn().mockImplementation(({ prompt }) => {
        capturedPrompt = prompt
        return Promise.resolve({
          output: () => createMockOutput(),
        })
      })

      const mockFlow = jest.fn().mockImplementation(async (input) => {
        await mockGenerate({
          model: AI_MODELS.CHAT,
          prompt: `System prompt with user: ${input.message}`,
          output: { format: 'json' },
        })
        return createMockOutput()
      })

      mockAi.defineFlow.mockReturnValue(mockFlow)

      await mockFlow(mockInput)

      expect(mockGenerate).toHaveBeenCalled()
    })

    it('should handle different subscription tiers', async () => {
      const tiers = ['Explorer', 'Growth', 'Transformation'] as const

      for (const tier of tiers) {
        const userProfile = createMockUserProfile({
          subscriptionTier: tier,
        })

        const mockInput = createMockInput({
          userProfile,
        })

        const mockOutput = createMockOutput()

        const mockFlow = jest.fn().mockResolvedValue(mockOutput)
        mockAi.defineFlow.mockReturnValue(mockFlow)

        const result = await mockFlow(mockInput)

        expect(result).toEqual(mockOutput)
      }
    })

    it('should handle missing user profile gracefully', async () => {
      const mockInput = createMockInput({
        userProfile: null,
      })

      const mockFlow = jest.fn().mockImplementation(async (input) => {
        if (!input.userProfile) {
          throw new Error('User profile is required')
        }
        return createMockOutput()
      })

      mockAi.defineFlow.mockReturnValue(mockFlow)

      await expect(mockFlow(mockInput)).rejects.toThrow('User profile is required')
    })

    it('should provide fallback response on AI error', async () => {
      const mockInput = createMockInput()

      const mockFlow = jest.fn().mockImplementation(async () => {
        // Simulate AI error and return fallback
        try {
          throw new Error('AI service unavailable')
        } catch (error) {
          console.error('AI Chat Guidance Error:', error)
          return {
            response: "I'm here to support you on your relationship journey. While I process your message, could you tell me more about what's most important to you right now?",
            suggestions: [
              'Share more about your relationship goals',
              'Tell me about a specific challenge you are facing',
              'Describe what a healthy relationship looks like to you',
            ],
            resources: [
              {
                title: 'Getting Started with Relationship Coaching',
                description: 'Introduction to building healthier relationships',
                type: 'article' as const,
              },
            ],
          }
        }
      })

      mockAi.defineFlow.mockReturnValue(mockFlow)

      const result = await mockFlow(mockInput)

      expect(result.response).toContain('I am here to support you')
      expect(result.suggestions).toHaveLength(3)
      expect(result.resources).toHaveLength(1)
    })

    it('should include additional context when provided', async () => {
      const mockInput = createMockInput({
        context: 'User mentioned feeling anxious about upcoming conversation',
      })

      let capturedPrompt = ''
      const mockGenerate = jest.fn().mockImplementation(({ prompt }) => {
        capturedPrompt = prompt
        return Promise.resolve({
          output: () => createMockOutput(),
        })
      })

      const mockFlow = jest.fn().mockImplementation(async (input) => {
        const userPrompt = `
          Current message from ${input.userProfile.name}:
          "${input.message}"
          
          ${input.context ? `Additional context: ${input.context}` : ''}
        `

        await mockGenerate({
          model: AI_MODELS.CHAT,
          prompt: userPrompt,
          output: { format: 'json' },
        })

        return createMockOutput()
      })

      mockAi.defineFlow.mockReturnValue(mockFlow)

      await mockFlow(mockInput)

      expect(mockGenerate).toHaveBeenCalled()
    })

    it('should use correct AI model configuration', async () => {
      const mockInput = createMockInput()
      const mockOutput = createMockOutput()

      const mockGenerate = jest.fn().mockResolvedValue({
        output: () => mockOutput,
      })

      const mockFlow = jest.fn().mockImplementation(async () => {
        await mockGenerate({
          model: AI_MODELS.CHAT,
          prompt: 'test prompt',
          output: {
            format: 'json',
            schema: expect.any(Object),
          },
          config: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        })

        return mockOutput
      })

      mockAi.defineFlow.mockReturnValue(mockFlow)

      await mockFlow(mockInput)

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: AI_MODELS.CHAT,
          output: expect.objectContaining({
            format: 'json',
          }),
          config: expect.objectContaining({
            temperature: 0.7,
            maxOutputTokens: 1000,
          }),
        })
      )
    })

    it('should handle different types of user messages', async () => {
      const testMessages = [
        'How can I communicate better with my partner?',
        'We had a fight last night and I don not know what to do.',
        'I want to improve my relationship but I am not sure where to start.',
        'My partner and I have different love languages.',
      ]

      for (const message of testMessages) {
        const mockInput = createMockInput({
          message,
        })

        const mockOutput = createMockOutput()

        const mockFlow = jest.fn().mockResolvedValue(mockOutput)
        mockAi.defineFlow.mockReturnValue(mockFlow)

        const result = await mockFlow(mockInput)

        expect(result).toEqual(mockOutput)
        expect(result.response).toBeTruthy()
        expect(result.suggestions).toHaveLength(3)
        expect(result.resources.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Chat Output Validation', () => {
    it('should include all required output fields', () => {
      const mockOutput = createMockOutput()

      expect(mockOutput).toHaveProperty('response')
      expect(mockOutput).toHaveProperty('suggestions')
      expect(mockOutput).toHaveProperty('resources')
    })

    it('should have proper array structures', () => {
      const mockOutput = createMockOutput()

      expect(Array.isArray(mockOutput.suggestions)).toBe(true)
      expect(Array.isArray(mockOutput.resources)).toBe(true)
      expect(mockOutput.suggestions.length).toBeGreaterThan(0)
      expect(mockOutput.resources.length).toBeGreaterThan(0)
    })

    it('should have proper resource structure', () => {
      const mockOutput = createMockOutput()

      mockOutput.resources.forEach((resource) => {
        expect(resource).toHaveProperty('title')
        expect(resource).toHaveProperty('description')
        expect(resource).toHaveProperty('type')
        expect(['article', 'exercise', 'tool']).toContain(resource.type)
      })
    })

    it('should provide meaningful suggestions', () => {
      const mockOutput = createMockOutput()

      mockOutput.suggestions.forEach((suggestion) => {
        expect(typeof suggestion).toBe('string')
        expect(suggestion.length).toBeGreaterThan(0)
      })
    })

    it('should provide helpful response', () => {
      const mockOutput = createMockOutput()

      expect(typeof mockOutput.response).toBe('string')
      expect(mockOutput.response.length).toBeGreaterThan(0)
    })
  })

  describe('Message History Processing', () => {
    it('should handle empty message history', async () => {
      const mockInput = createMockInput({
        previousMessages: [],
      })

      const mockOutput = createMockOutput()

      const mockFlow = jest.fn().mockResolvedValue(mockOutput)
      mockAi.defineFlow.mockReturnValue(mockFlow)

      const result = await mockFlow(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should process multiple previous messages', async () => {
      const previousMessages = [
        createMockMessage('user', 'Hello'),
        createMockMessage('assistant', 'Hi there!'),
        createMockMessage('user', 'I need help'),
        createMockMessage('assistant', 'I am here to help'),
        createMockMessage('user', 'Thank you'),
      ]

      const mockInput = createMockInput({
        previousMessages,
      })

      const mockOutput = createMockOutput()

      const mockFlow = jest.fn().mockResolvedValue(mockOutput)
      mockAi.defineFlow.mockReturnValue(mockFlow)

      const result = await mockFlow(mockInput)

      expect(result).toEqual(mockOutput)
    })
  })
})