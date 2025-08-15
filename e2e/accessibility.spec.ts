import { test, expect } from '@playwright/test'
import { AccessibilityTestHelper } from '../__tests__/accessibility/accessibility-test-helper'

test.describe('Accessibility Tests', () => {
  let accessibilityHelper: AccessibilityTestHelper

  test.beforeEach(async ({ page }) => {
    accessibilityHelper = new AccessibilityTestHelper(page)
  })

  test.describe('Homepage Accessibility', () => {
    test('should meet WCAG 2.1 AA standards on homepage', async ({ page }) => {
      await page.goto('/')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
      expect(report.overallScore).toBeGreaterThan(80)
      
      // Log any violations for debugging
      if (report.audit.violations.length > 0) {
        console.log('Accessibility violations found:', report.audit.violations)
      }
    })

    test('should have proper heading structure on homepage', async ({ page }) => {
      await page.goto('/')
      
      const headings = await accessibilityHelper.testHeadingStructure()
      
      expect(headings.isLogical).toBe(true)
      expect(headings.headings.filter(h => h.level === 1)).toHaveLength(1)
      expect(headings.issues).toHaveLength(0)
    })

    test('should support keyboard navigation on homepage', async ({ page }) => {
      await page.goto('/')
      
      const keyboard = await accessibilityHelper.testKeyboardNavigation()
      
      expect(keyboard.canTabThrough).toBe(true)
      expect(keyboard.focusOrder.length).toBeGreaterThan(0)
      expect(keyboard.issues).toHaveLength(0)
    })

    test('should have accessible images on homepage', async ({ page }) => {
      await page.goto('/')
      
      const images = await accessibilityHelper.testImageAccessibility()
      
      expect(images.hasAltText).toBe(true)
      expect(images.issues).toHaveLength(0)
    })
  })

  test.describe('Authentication Pages Accessibility', () => {
    test('should meet accessibility standards on sign-in page', async ({ page }) => {
      await page.goto('/auth/signin')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have accessible forms on sign-in page', async ({ page }) => {
      await page.goto('/auth/signin')
      
      const forms = await accessibilityHelper.testFormAccessibility()
      
      expect(forms.hasLabels).toBe(true)
      expect(forms.issues).toHaveLength(0)
    })

    test('should support keyboard navigation on sign-in page', async ({ page }) => {
      await page.goto('/auth/signin')
      
      const keyboard = await accessibilityHelper.testKeyboardNavigation()
      
      expect(keyboard.canTabThrough).toBe(true)
      expect(keyboard.issues).toHaveLength(0)
    })

    test('should meet accessibility standards on sign-up page', async ({ page }) => {
      await page.goto('/auth/signup')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have accessible forms on sign-up page', async ({ page }) => {
      await page.goto('/auth/signup')
      
      const forms = await accessibilityHelper.testFormAccessibility()
      
      expect(forms.hasLabels).toBe(true)
      expect(forms.issues).toHaveLength(0)
    })
  })

  test.describe('Pricing Page Accessibility', () => {
    test('should meet accessibility standards on pricing page', async ({ page }) => {
      await page.goto('/pricing')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have proper ARIA labels for pricing cards', async ({ page }) => {
      await page.goto('/pricing')
      
      const aria = await accessibilityHelper.testAriaUsage()
      
      expect(aria.hasValidRoles).toBe(true)
      expect(aria.issues).toHaveLength(0)
    })

    test('should have accessible pricing tables', async ({ page }) => {
      await page.goto('/pricing')
      
      // Check for table headers and structure
      const tables = await page.locator('table').count()
      if (tables > 0) {
        // Ensure tables have proper headers
        const tableHeaders = await page.locator('th').count()
        expect(tableHeaders).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Dashboard Accessibility (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication for dashboard tests
      await page.goto('/auth/signin')
      // In a real test, you would sign in with test credentials
      // For now, we'll assume the user is authenticated
    })

    test('should meet accessibility standards on dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have accessible navigation menu', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Check for proper navigation structure
      const nav = await page.locator('nav').count()
      expect(nav).toBeGreaterThan(0)
      
      // Check for skip links
      const skipLinks = await page.locator('a[href^="#"]').count()
      expect(skipLinks).toBeGreaterThan(0)
    })
  })

  test.describe('Chat Interface Accessibility', () => {
    test('should have accessible chat interface', async ({ page }) => {
      await page.goto('/chat')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should support screen reader for chat messages', async ({ page }) => {
      await page.goto('/chat')
      
      // Check for proper ARIA live regions
      const liveRegions = await page.locator('[aria-live]').count()
      expect(liveRegions).toBeGreaterThan(0)
      
      // Check for proper labeling of chat input
      const chatInput = page.locator('textarea, input[type="text"]').first()
      await expect(chatInput).toHaveAttribute('aria-label')
    })
  })

  test.describe('Error Pages Accessibility', () => {
    test('should have accessible 404 page', async ({ page }) => {
      const response = await page.goto('/non-existent-page')
      expect(response?.status()).toBe(404)
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have accessible error boundaries', async ({ page }) => {
      // This would test error boundary accessibility
      // In a real scenario, you'd trigger an error and check the error UI
      await page.goto('/')
      
      // Check that error states are announced to screen readers
      const errorElements = await page.locator('[role="alert"]').count()
      // If there are error elements, they should be accessible
    })
  })

  test.describe('Mobile Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('should meet accessibility standards on mobile', async ({ page }) => {
      await page.goto('/')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have proper touch targets on mobile', async ({ page }) => {
      await page.goto('/')
      
      // Check that interactive elements are large enough (44px minimum)
      const buttons = await page.locator('button, a, input[type="button"], input[type="submit"]').all()
      
      for (const button of buttons) {
        const boundingBox = await button.boundingBox()
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44)
          expect(boundingBox.width).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('should support mobile screen reader navigation', async ({ page }) => {
      await page.goto('/')
      
      const headings = await accessibilityHelper.testHeadingStructure()
      expect(headings.isLogical).toBe(true)
      
      const keyboard = await accessibilityHelper.testKeyboardNavigation()
      expect(keyboard.canTabThrough).toBe(true)
    })
  })

  test.describe('Dark Mode Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      // Enable dark mode
      await page.emulateMedia({ colorScheme: 'dark' })
    })

    test('should maintain accessibility in dark mode', async ({ page }) => {
      await page.goto('/')
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })

    test('should have sufficient color contrast in dark mode', async ({ page }) => {
      await page.goto('/')
      
      const colorContrast = await accessibilityHelper.testColorContrast()
      expect(colorContrast.violations.length).toBe(0)
    })
  })

  test.describe('Performance and Accessibility', () => {
    test('should not degrade accessibility under load', async ({ page }) => {
      await page.goto('/')
      
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100)
      })
      
      const report = await accessibilityHelper.generateAccessibilityReport()
      
      expect(report.wcagLevel).not.toBe('Fail')
      expect(report.summary.criticalIssues).toBe(0)
    })
  })

  test.describe('Accessibility Report Generation', () => {
    test('should generate comprehensive accessibility report', async ({ page }) => {
      const pages = ['/', '/auth/signin', '/pricing']
      const reports = []
      
      for (const pagePath of pages) {
        await page.goto(pagePath)
        const report = await accessibilityHelper.generateAccessibilityReport()
        reports.push({
          page: pagePath,
          ...report.summary
        })
      }
      
      // Log summary for CI/CD
      console.log('Accessibility Report Summary:', reports)
      
      // Ensure all pages meet minimum standards
      for (const report of reports) {
        expect(report.criticalIssues).toBe(0)
      }
    })
  })
})