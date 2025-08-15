import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to signup page
      await page.click('text=Sign Up')
      await expect(page).toHaveURL('/auth/signup')

      // Fill registration form
      const testEmail = `test-${Date.now()}@example.com`
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.fill('input[placeholder*="name" i]', 'Test User')

      // Submit registration
      await page.click('button[type="submit"]')

      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/)
    })

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.click('text=Sign Up')
      await expect(page).toHaveURL('/auth/signup')

      // Enter invalid email
      await page.fill('input[type="email"]', 'invalid-email')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      // Should show validation error
      await expect(page.locator('text=valid email')).toBeVisible()
    })

    test('should show validation errors for weak password', async ({ page }) => {
      await page.click('text=Sign Up')
      await expect(page).toHaveURL('/auth/signup')

      // Enter weak password
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', '123')
      await page.click('button[type="submit"]')

      // Should show validation error
      await expect(page.locator('text=password')).toBeVisible()
    })

    test('should handle registration with existing email', async ({ page }) => {
      await page.click('text=Sign Up')
      await expect(page).toHaveURL('/auth/signup')

      // Try to register with existing email
      await page.fill('input[type="email"]', 'existing@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.fill('input[placeholder*="name" i]', 'Test User')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=already exists')).toBeVisible()
    })
  })

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Navigate to login page
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')

      // Fill login form
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')

      // Submit login
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')

      // Enter invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com')
      await page.fill('input[type="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=Invalid')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')

      // Try to submit without filling fields
      await page.click('button[type="submit"]')

      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible()
    })
  })

  test.describe('Password Reset', () => {
    test('should send password reset email', async ({ page }) => {
      await page.click('text=Sign In')
      await expect(page).toHaveURL('/auth/signin')

      // Click forgot password link
      await page.click('text=Forgot Password')

      // Enter email for password reset
      await page.fill('input[type="email"]', 'test@example.com')
      await page.click('button[type="submit"]')

      // Should show success message
      await expect(page.locator('text=reset email sent')).toBeVisible()
    })

    test('should validate email for password reset', async ({ page }) => {
      await page.click('text=Sign In')
      await page.click('text=Forgot Password')

      // Try to submit without email
      await page.click('button[type="submit"]')

      // Should show validation error
      await expect(page.locator('text=required')).toBeVisible()
    })
  })

  test.describe('Navigation Protection', () => {
    test('should redirect unauthenticated users to signin', async ({ page }) => {
      // Try to access protected route
      await page.goto('/dashboard')

      // Should redirect to signin
      await expect(page).toHaveURL('/auth/signin')
    })

    test('should redirect unauthenticated users from profile', async ({ page }) => {
      await page.goto('/profile')

      // Should redirect to signin
      await expect(page).toHaveURL('/auth/signin')
    })

    test('should redirect unauthenticated users from chat', async ({ page }) => {
      await page.goto('/chat')

      // Should redirect to signin
      await expect(page).toHaveURL('/auth/signin')
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // First login
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')

      // Click logout button
      await page.click('[data-testid="user-menu"]')
      await page.click('text=Logout')

      // Should redirect to home page
      await expect(page).toHaveURL('/')

      // Should not be able to access protected routes
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/auth/signin')
    })
  })

  test.describe('Onboarding Flow', () => {
    test('should complete onboarding flow for new user', async ({ page }) => {
      // Register new user
      await page.click('text=Sign Up')
      const testEmail = `test-${Date.now()}@example.com`
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.fill('input[placeholder*="name" i]', 'Test User')
      await page.click('button[type="submit"]')

      // Should be on onboarding page
      await expect(page).toHaveURL('/onboarding')

      // Step 1: Welcome
      await expect(page.locator('text=Welcome')).toBeVisible()
      await page.click('button:has-text("Continue")')

      // Step 2: Relationship Status
      await page.click('text=Single')
      await page.click('button:has-text("Continue")')

      // Step 3: Goals
      await page.click('text=Better Communication')
      await page.click('text=Build Trust')
      await page.click('button:has-text("Continue")')

      // Step 4: Journal Prompt
      await page.fill('textarea', 'I want to improve my relationship skills and learn better communication.')
      await page.click('button:has-text("Complete")')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    test('should allow skipping optional onboarding steps', async ({ page }) => {
      // Register new user
      await page.click('text=Sign Up')
      const testEmail = `test-${Date.now()}@example.com`
      await page.fill('input[type="email"]', testEmail)
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.fill('input[placeholder*="name" i]', 'Test User')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/onboarding')

      // Skip through steps
      await page.click('button:has-text("Skip")')
      await page.click('button:has-text("Skip")')
      await page.click('button:has-text("Skip")')
      await page.click('button:has-text("Skip")')

      // Should still reach dashboard
      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')

      // Reload page
      await page.reload()

      // Should still be on dashboard
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle session expiration gracefully', async ({ page }) => {
      // Login
      await page.click('text=Sign In')
      await page.fill('input[type="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')

      // Simulate session expiration by clearing storage
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      // Try to access protected route
      await page.goto('/profile')

      // Should redirect to signin
      await expect(page).toHaveURL('/auth/signin')
    })
  })
})