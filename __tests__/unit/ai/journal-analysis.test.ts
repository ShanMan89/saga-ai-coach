/**
 * @jest-environment node
 */

import { analyzeJournalEntry } from '@/ai/flows/journal-analysis'
import { ai, AI_MODELS } from '@/ai/genkit'
import type { AnalyzeJournalEntryInput, AnalyzeJournalEntryOutput, UserProfile } from '@/lib/types'

// Mock the AI module
jest.mock('@/ai/genkit')

const mockAi = ai as jest.Mocked<typeof ai>

describe('Journal Analysis Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockUserProfile = (overrides = {}): UserProfile => ({
    uid: 'test-uid',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'test-avatar',
    subscriptionTier: 'Growth',
    messageCount: 0,
    role: 'user',
    goals: ['Improve communication', 'Build trust'],
    relationshipStatus: 'In a relationship',
    focusAreas: ['Communication', 'Conflict resolution'],
    ...overrides,
  })

  const createMockInput = (overrides = {}): AnalyzeJournalEntryInput => ({
    journalEntry: 'Today I had a difficult conversation with my partner about our future plans.',
    userProfile: createMockUserProfile(),
    ...overrides,
  })

  const createMockOutput = (): AnalyzeJournalEntryOutput => ({
    overallSentiment: 'Mixed',
    emotionalThemes: ['Anxiety', 'Hope', 'Uncertainty'],
    communicationPatterns: [
      'Direct communication about concerns',
      'Willingness to discuss difficult topics',
    ],
    personalGrowthIndicators: [
      'Taking initiative in relationship discussions',
      'Showing emotional awareness',
    ],
    areasForDevelopment: [
      'Active listening skills',
      'Managing anxiety during conversations',
    ],
    celebrateProgress: [
      'Courage to bring up important topics',
      'Commitment to relationship growth',
    ],
    insights: [
      'You showed great courage in initiating a difficult but necessary conversation.',
      'Consider preparing for such discussions to manage anxiety better.',
    ],
    actionableRecommendations: [
      'Practice active listening techniques',
      'Set regular check-ins with your partner',
    ],
    suggestedResources: [
      {
        title: 'Effective Communication in Relationships',
        description: 'Learn techniques for better relationship communication',
        type: 'article',
      },
    ],
  })

  describe('analyzeJournalEntry', () => {
    it('should analyze journal entry successfully', async () => {
      const mockInput = createMockInput()
      const mockOutput = createMockOutput()

      // Mock the AI flow
      const mockFlow = {
        generate: jest.fn(),
        output: jest.fn().mockReturnValue(mockOutput),
      }

      mockAi.defineFlow.mockReturnValue(mockFlow as any)
      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await analyzeJournalEntry(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should handle user profile with minimal information', async () => {
      const minimalProfile = createMockUserProfile({
        goals: undefined,
        relationshipStatus: undefined,
        focusAreas: undefined,
      })

      const mockInput = createMockInput({
        userProfile: minimalProfile,
      })

      const mockOutput = createMockOutput()

      mockAi.defineFlow.mockReturnValue({
        generate: jest.fn(),
        output: jest.fn().mockReturnValue(mockOutput),
      } as any)

      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await analyzeJournalEntry(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should return null when AI fails to generate response', async () => {
      const mockInput = createMockInput()

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockResolvedValue({
        output: () => null,
      } as any)

      const result = await analyzeJournalEntry(mockInput)

      expect(result).toBeNull()
    })

    it('should handle different journal entry types', async () => {
      const testCases = [
        {
          entry: 'I feel so grateful for my partner today. They really listened when I needed to talk.',
          expectedSentiment: 'Positive',
        },
        {
          entry: 'We had another fight today. I feel like we are not understanding each other.',
          expectedSentiment: 'Negative',
        },
        {
          entry: 'Mixed feelings about our relationship. Some good moments, some challenging ones.',
          expectedSentiment: 'Mixed',
        },
      ]

      for (const testCase of testCases) {
        const mockInput = createMockInput({
          journalEntry: testCase.entry,
        })

        const mockOutput = createMockOutput()
        mockOutput.overallSentiment = testCase.expectedSentiment as any

        mockAi.defineFlow.mockReturnValue({} as any)
        mockAi.generate.mockResolvedValue({
          output: () => mockOutput,
        } as any)

        const result = await analyzeJournalEntry(mockInput)

        expect(result?.overallSentiment).toBe(testCase.expectedSentiment)
      }
    })

    it('should include user-specific context in the prompt', async () => {
      const userProfile = createMockUserProfile({
        name: 'Alice',
        goals: ['Better communication'],
        relationshipStatus: 'Married',
        focusAreas: ['Trust building'],
      })

      const mockInput = createMockInput({
        userProfile,
        journalEntry: 'Today was a good day for our relationship.',
      })

      let capturedPrompt = ''
      const mockGenerate = jest.fn().mockImplementation(({ prompt }) => {
        capturedPrompt = prompt
        return Promise.resolve({
          output: () => createMockOutput(),
        })
      })

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockImplementation(mockGenerate)

      await analyzeJournalEntry(mockInput)

      expect(capturedPrompt).toContain('Alice')
      expect(capturedPrompt).toContain('Better communication')
      expect(capturedPrompt).toContain('Married')
      expect(capturedPrompt).toContain('Trust building')
      expect(capturedPrompt).toContain('Today was a good day for our relationship.')
    })

    it('should use correct AI model for analysis', async () => {
      const mockInput = createMockInput()
      const mockOutput = createMockOutput()

      const mockGenerate = jest.fn().mockResolvedValue({
        output: () => mockOutput,
      })

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockImplementation(mockGenerate)

      await analyzeJournalEntry(mockInput)

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: AI_MODELS.ANALYSIS,
          output: expect.objectContaining({
            format: 'json',
          }),
        })
      )
    })

    it('should handle empty journal entries', async () => {
      const mockInput = createMockInput({
        journalEntry: '',
      })

      const mockOutput = createMockOutput()

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await analyzeJournalEntry(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should handle very long journal entries', async () => {
      const longEntry = 'A'.repeat(5000) // Very long journal entry
      const mockInput = createMockInput({
        journalEntry: longEntry,
      })

      const mockOutput = createMockOutput()

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockResolvedValue({
        output: () => mockOutput,
      } as any)

      const result = await analyzeJournalEntry(mockInput)

      expect(result).toEqual(mockOutput)
    })

    it('should provide appropriate analysis areas', async () => {
      const mockInput = createMockInput()
      const mockOutput = createMockOutput()

      let capturedPrompt = ''
      const mockGenerate = jest.fn().mockImplementation(({ prompt }) => {
        capturedPrompt = prompt
        return Promise.resolve({
          output: () => mockOutput,
        })
      })

      mockAi.defineFlow.mockReturnValue({} as any)
      mockAi.generate.mockImplementation(mockGenerate)

      await analyzeJournalEntry(mockInput)

      // Check that the prompt includes key analysis areas
      expect(capturedPrompt).toContain('Emotional awareness')
      expect(capturedPrompt).toContain('Relationship dynamics')
      expect(capturedPrompt).toContain('Personal growth')
      expect(capturedPrompt).toContain('Areas for development')
      expect(capturedPrompt).toContain('Positive progress')
    })
  })

  describe('Journal Analysis Output Validation', () => {
    it('should include all required output fields', () => {
      const mockOutput = createMockOutput()

      expect(mockOutput).toHaveProperty('overallSentiment')
      expect(mockOutput).toHaveProperty('emotionalThemes')
      expect(mockOutput).toHaveProperty('communicationPatterns')
      expect(mockOutput).toHaveProperty('personalGrowthIndicators')
      expect(mockOutput).toHaveProperty('areasForDevelopment')
      expect(mockOutput).toHaveProperty('celebrateProgress')
      expect(mockOutput).toHaveProperty('insights')
      expect(mockOutput).toHaveProperty('actionableRecommendations')
      expect(mockOutput).toHaveProperty('suggestedResources')
    })

    it('should have proper array structures', () => {
      const mockOutput = createMockOutput()

      expect(Array.isArray(mockOutput.emotionalThemes)).toBe(true)
      expect(Array.isArray(mockOutput.communicationPatterns)).toBe(true)
      expect(Array.isArray(mockOutput.personalGrowthIndicators)).toBe(true)
      expect(Array.isArray(mockOutput.areasForDevelopment)).toBe(true)
      expect(Array.isArray(mockOutput.celebrateProgress)).toBe(true)
      expect(Array.isArray(mockOutput.insights)).toBe(true)
      expect(Array.isArray(mockOutput.actionableRecommendations)).toBe(true)
      expect(Array.isArray(mockOutput.suggestedResources)).toBe(true)
    })

    it('should have proper resource structure', () => {
      const mockOutput = createMockOutput()

      mockOutput.suggestedResources.forEach((resource) => {
        expect(resource).toHaveProperty('title')
        expect(resource).toHaveProperty('description')
        expect(resource).toHaveProperty('type')
        expect(['article', 'exercise', 'tool']).toContain(resource.type)
      })
    })
  })
})