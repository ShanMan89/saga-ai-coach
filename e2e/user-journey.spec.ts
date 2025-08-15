import { test, expect } from '@playwright/test'

test.describe('Complete User Journey', () => {
  test.describe('New User Complete Journey', () => {
    test('should complete full user journey from signup to SOS booking', async ({ page }) => {
      // Step 1: Homepage and Signup
      await page.goto('/')
      
      // Should see landing page
      await expect(page.locator('text=Saga AI Coach')).toBeVisible()
      await expect(page.locator('text=Transform Your Relationships')).toBeVisible()

      // Click getting started
      await page.click('button:has-text("Get Started")')
      await expect(page).toHaveURL('/auth/signup')

      // Register new user
      const testEmail = `journey-test-${Date.now()}@example.com`
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.fill('input[placeholder*="name" i]', 'Journey Test User')
      await page.click('button[type="submit"]')

      // Step 2: Onboarding
      await expect(page).toHaveURL('/onboarding')

      // Complete onboarding steps
      await page.click('button:has-text("Continue")') // Welcome step
      await page.click('text=In a relationship') // Relationship status
      await page.click('button:has-text("Continue")')
      await page.click('text=Better Communication') // Goals
      await page.click('text=Conflict Resolution')
      await page.click('button:has-text("Continue")')
      await page.fill('textarea', 'I want to improve my communication skills with my partner and learn to resolve conflicts better.')
      await page.click('button:has-text("Complete")')

      // Step 3: Dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Welcome, Journey Test User')).toBeVisible()
      await expect(page.locator('text=Explorer Plan')).toBeVisible()

      // Step 4: Chat with AI
      await page.click('nav a:has-text("Chat")')
      await expect(page).toHaveURL('/chat')

      // Send first message
      await page.fill('textarea', 'Hi, I need help with communication in my relationship.')
      await page.click('button:has-text("Send")')

      // Should receive AI response
      await expect(page.locator('text=Communication is key')).toBeVisible()
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible()

      // Step 5: Journal Entry
      await page.click('nav a:has-text("Journal")')
      await expect(page).toHaveURL('/journal')

      // Create journal entry
      await page.click('button:has-text("New Entry")')
      await page.fill('textarea', 'Today my partner and I had a productive conversation about our future plans. I felt heard and understood.')
      await page.click('button:has-text("Save Entry")')

      // Should see analysis
      await expect(page.locator('text=Analysis complete')).toBeVisible()
      await expect(page.locator('text=Positive sentiment')).toBeVisible()

      // Step 6: Upgrade to Growth Plan
      await page.click('nav a:has-text("Pricing")')
      await page.click('[data-testid="growth-plan"] button:has-text("Upgrade")')

      // Mock successful payment (in real test, would go through Stripe)
      await page.goto('/dashboard?payment=success&session_id=cs_test_123')
      await expect(page.locator('text=Welcome to Growth')).toBeVisible()

      // Step 7: Access Premium Features
      await page.click('nav a:has-text("Chat")')

      // Should now have unlimited access
      await expect(page.locator('text=Unlimited messages')).toBeVisible()

      // Try AI Scenarios
      await page.click('button:has-text("AI Scenarios")')
      await page.click('text=Communication Practice')
      await page.fill('textarea', 'I want to practice having a difficult conversation with my partner about finances.')
      await page.click('button:has-text("Start Scenario")')

      // Should receive scenario response
      await expect(page.locator('text=practice scenario')).toBeVisible()

      // Step 8: Book SOS Session
      await page.click('nav a:has-text("SOS")')
      await expect(page).toHaveURL('/sos')

      // Fill SOS booking form
      await page.fill('textarea[placeholder*="situation"]', 'My partner and I had a big fight last night and I need help on how to approach making up.')
      await page.selectOption('select', 'Urgent - Within 24 hours')
      await page.click('button:has-text("Book SOS Session")')

      // Should show booking confirmation
      await expect(page.locator('text=SOS session booked')).toBeVisible()
      await expect(page.locator('text=You will receive')).toBeVisible()

      // Step 9: Profile Management
      await page.click('[data-testid="user-menu"]')
      await page.click('text=Profile')
      await expect(page).toHaveURL('/profile')

      // Should see updated profile
      await expect(page.locator('text=Growth Plan')).toBeVisible()
      await expect(page.locator('text=In a relationship')).toBeVisible()
      await expect(page.locator('text=Better Communication')).toBeVisible()

      // Update profile
      await page.click('button:has-text("Edit Profile")')
      await page.fill('input[value="Journey Test User"]', 'Journey Test User Updated')
      await page.click('button:has-text("Save Changes")')

      // Should see updated name
      await expect(page.locator('text=Journey Test User Updated')).toBeVisible()
    })
  })

  test.describe('Returning User Journey', () => {
    test('should handle returning user with existing data', async ({ page }) => {
      // Login as existing user
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'returning@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      // Should go directly to dashboard (skip onboarding)
      await expect(page).toHaveURL('/dashboard')

      // Should see existing data
      await expect(page.locator('text=Welcome back')).toBeVisible()
      await expect(page.locator('text=Growth Plan')).toBeVisible()

      // Check chat history
      await page.click('nav a:has-text("Chat")')
      await expect(page.locator('[data-testid="previous-conversations"]')).toBeVisible()

      // Check journal entries
      await page.click('nav a:has-text("Journal")')
      await expect(page.locator('[data-testid="journal-entries"]')).toBeVisible()
      await expect(page.locator('text=Previous entries')).toBeVisible()

      // Should see analytics
      await page.click('nav a:has-text("Dashboard")')
      await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible()
      await expect(page.locator('text=Your Progress')).toBeVisible()
    })
  })

  test.describe('Admin User Journey', () => {
    test('should access admin features', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'admin@example.com')
      await page.fill('input[type="password"]', 'AdminPassword123!')
      await page.click('button[type="submit"]')

      // Should have admin menu
      await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible()

      // Access admin dashboard
      await page.click('text=Admin Dashboard')
      await expect(page).toHaveURL('/admin')

      // Should see admin stats
      await expect(page.locator('text=Total Users')).toBeVisible()
      await expect(page.locator('text=Active Subscriptions')).toBeVisible()
      await expect(page.locator('text=Revenue')).toBeVisible()

      // Manage users
      await page.click('text=Users')
      await expect(page).toHaveURL('/admin/users')
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible()

      // View user details
      await page.click('[data-testid="view-user"]:first-child')
      await expect(page.locator('text=User Details')).toBeVisible()

      // Manage appointments
      await page.click('text=Appointments')
      await expect(page).toHaveURL('/admin/appointments')
      await expect(page.locator('[data-testid="appointments-list"]')).toBeVisible()

      // Calendar management
      await page.click('text=Calendar')
      await expect(page).toHaveURL('/admin/calendar')
      await expect(page.locator('[data-testid="admin-calendar"]')).toBeVisible()
    })
  })

  test.describe('Mobile User Journey', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Navigate to homepage
      await page.goto('/')

      // Should see mobile layout
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      // Sign in on mobile
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', 'mobile@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      // Should see mobile dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

      // Test mobile chat
      await page.click('[data-testid="mobile-nav"] [href="/chat"]')
      await expect(page.locator('[data-testid="mobile-chat"]')).toBeVisible()

      // Send message on mobile
      await page.fill('textarea', 'How can I improve my relationship?')
      await page.click('button:has-text("Send")')

      // Should work on mobile
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible()
    })
  })

  test.describe('Error Recovery Journey', () => {
    test('should handle and recover from errors gracefully', async ({ page }) => {
      // Login
      await page.goto('/auth/signin')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      // Simulate network error during chat
      await page.route('**/api/ai/chat', route => route.abort())
      
      await page.click('nav a:has-text("Chat")')
      await page.fill('textarea', 'This message should fail')
      await page.click('button:has-text("Send")')

      // Should show error message
      await expect(page.locator('text=Connection error')).toBeVisible()
      await expect(page.locator('button:has-text("Retry")')).toBeVisible()

      // Restore network and retry
      await page.unroute('**/api/ai/chat')
      await page.click('button:has-text("Retry")')

      // Should work after retry
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible()

      // Test offline functionality
      await page.context().setOffline(true)
      await page.reload()

      // Should show offline message
      await expect(page.locator('text=You are offline')).toBeVisible()

      // Should still show cached data
      await expect(page.locator('[data-testid="cached-content"]')).toBeVisible()

      // Restore connection
      await page.context().setOffline(false)
      await page.reload()

      // Should work normally
      await expect(page.locator('text=You are offline')).not.toBeVisible()
    })
  })

  test.describe('Performance Journey', () => {
    test('should load pages quickly', async ({ page }) => {
      // Measure page load times
      const navigationPromise = page.waitForLoadState('networkidle')
      
      await page.goto('/')
      await navigationPromise

      // Homepage should load quickly
      const performanceEntries = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'))
      })
      
      const navigation = JSON.parse(performanceEntries)[0]
      expect(navigation.loadEventEnd - navigation.loadEventStart).toBeLessThan(3000)

      // Test subsequent page navigation speed
      const startTime = Date.now()
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')
      const endTime = Date.now()

      // Navigation should be fast
      expect(endTime - startTime).toBeLessThan(1000)
    })
  })
})