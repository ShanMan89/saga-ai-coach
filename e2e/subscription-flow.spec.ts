import { test, expect } from '@playwright/test'

test.describe('Subscription and Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test.describe('Pricing Page', () => {
    test('should display all subscription plans', async ({ page }) => {
      await page.goto('/pricing')

      // Should show all three plans
      await expect(page.locator('text=Explorer')).toBeVisible()
      await expect(page.locator('text=Growth')).toBeVisible()
      await expect(page.locator('text=Transformation')).toBeVisible()

      // Should show pricing
      await expect(page.locator('text=$19')).toBeVisible() // Growth monthly
      await expect(page.locator('text=$39')).toBeVisible() // Transformation monthly

      // Should show features
      await expect(page.locator('text=10 AI chats per month')).toBeVisible()
      await expect(page.locator('text=Unlimited AI chats')).toBeVisible()
    })

    test('should toggle between monthly and annual pricing', async ({ page }) => {
      await page.goto('/pricing')

      // Check monthly pricing is default
      await expect(page.locator('text=$19/month')).toBeVisible()

      // Switch to annual
      await page.click('text=Annual')

      // Should show annual pricing with discount
      await expect(page.locator('text=$190/year')).toBeVisible() // 2 months free
      await expect(page.locator('text=Save 17%')).toBeVisible()
    })

    test('should show current plan for logged in users', async ({ page }) => {
      await page.goto('/pricing')

      // Should highlight current plan (Explorer for free user)
      await expect(page.locator('[data-testid="current-plan"]')).toBeVisible()
      await expect(page.locator('text=Current Plan')).toBeVisible()
    })
  })

  test.describe('Subscription Upgrade', () => {
    test('should upgrade to Growth plan', async ({ page }) => {
      await page.goto('/pricing')

      // Click upgrade to Growth
      await page.click('[data-testid="growth-plan"] button:has-text("Upgrade")')

      // Should redirect to Stripe Checkout
      await expect(page).toHaveURL(/checkout\.stripe\.com/)

      // Verify checkout page elements
      await expect(page.locator('text=Growth Plan')).toBeVisible()
      await expect(page.locator('text=$19.00')).toBeVisible()
    })

    test('should upgrade to Transformation plan', async ({ page }) => {
      await page.goto('/pricing')

      // Click upgrade to Transformation
      await page.click('[data-testid="transformation-plan"] button:has-text("Upgrade")')

      // Should redirect to Stripe Checkout
      await expect(page).toHaveURL(/checkout\.stripe\.com/)

      // Verify checkout page elements
      await expect(page.locator('text=Transformation Plan')).toBeVisible()
      await expect(page.locator('text=$39.00')).toBeVisible()
    })

    test('should handle promo codes', async ({ page }) => {
      await page.goto('/pricing')

      // Enter promo code
      await page.fill('input[placeholder*="promo" i]', 'WELCOME20')
      await page.click('button:has-text("Apply")')

      // Should show discount
      await expect(page.locator('text=20% off')).toBeVisible()

      // Proceed with discounted upgrade
      await page.click('[data-testid="growth-plan"] button:has-text("Upgrade")')

      // Should redirect with promo code applied
      await expect(page).toHaveURL(/checkout\.stripe\.com/)
    })

    test('should handle invalid promo codes', async ({ page }) => {
      await page.goto('/pricing')

      // Enter invalid promo code
      await page.fill('input[placeholder*="promo" i]', 'INVALID')
      await page.click('button:has-text("Apply")')

      // Should show error
      await expect(page.locator('text=Invalid promo code')).toBeVisible()
    })
  })

  test.describe('Subscription Management', () => {
    test('should access billing portal from profile', async ({ page, context }) => {
      // Mock user with active subscription
      await page.goto('/profile')

      // Click manage subscription
      await page.click('text=Manage Subscription')

      // Should open billing portal in new tab
      const [billingPage] = await Promise.all([
        context.waitForEvent('page'),
        page.click('text=Billing Portal')
      ])

      await expect(billingPage).toHaveURL(/billing\.stripe\.com/)
    })

    test('should display current subscription info', async ({ page }) => {
      await page.goto('/profile')

      // Should show subscription details
      await expect(page.locator('text=Current Plan')).toBeVisible()
      await expect(page.locator('text=Growth')).toBeVisible()
      await expect(page.locator('text=Next billing')).toBeVisible()
    })

    test('should show usage limits', async ({ page }) => {
      await page.goto('/dashboard')

      // Should show usage for current tier
      await expect(page.locator('text=AI Chats Used')).toBeVisible()
      await expect(page.locator('text=5 / 10')).toBeVisible() // Explorer limit
    })
  })

  test.describe('Payment Success Flow', () => {
    test('should handle successful payment', async ({ page }) => {
      // Mock successful payment redirect
      await page.goto('/dashboard?payment=success&session_id=cs_test_123')

      // Should show success message
      await expect(page.locator('text=Payment successful')).toBeVisible()
      await expect(page.locator('text=Welcome to Growth')).toBeVisible()

      // Should update UI to reflect new plan
      await page.goto('/profile')
      await expect(page.locator('text=Growth Plan')).toBeVisible()
    })

    test('should handle canceled payment', async ({ page }) => {
      // Mock canceled payment redirect
      await page.goto('/pricing?payment=canceled')

      // Should show cancellation message
      await expect(page.locator('text=Payment was canceled')).toBeVisible()

      // Should still be able to retry
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
    })

    test('should handle payment errors', async ({ page }) => {
      // Mock payment error redirect
      await page.goto('/dashboard?payment=error')

      // Should show error message
      await expect(page.locator('text=Payment failed')).toBeVisible()
      await expect(page.locator('text=Contact support')).toBeVisible()
    })
  })

  test.describe('Feature Access Control', () => {
    test('should restrict features for Explorer tier', async ({ page }) => {
      // Go to chat page
      await page.goto('/chat')

      // Should show message limit
      await expect(page.locator('text=5 messages remaining')).toBeVisible()

      // Should show upgrade prompt when limit reached
      await page.evaluate(() => {
        localStorage.setItem('userProfile', JSON.stringify({
          subscriptionTier: 'Explorer',
          messageCount: 10
        }))
      })

      await page.reload()

      // Should show upgrade prompt
      await expect(page.locator('text=Upgrade to continue')).toBeVisible()
      await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible()
    })

    test('should allow unlimited features for Growth tier', async ({ page }) => {
      // Mock Growth tier user
      await page.evaluate(() => {
        localStorage.setItem('userProfile', JSON.stringify({
          subscriptionTier: 'Growth',
          messageCount: 50
        }))
      })

      await page.goto('/chat')

      // Should not show message limit
      await expect(page.locator('text=Unlimited messages')).toBeVisible()

      // Should have access to advanced features
      await expect(page.locator('text=AI Scenarios')).toBeVisible()
    })

    test('should allow all features for Transformation tier', async ({ page }) => {
      // Mock Transformation tier user
      await page.evaluate(() => {
        localStorage.setItem('userProfile', JSON.stringify({
          subscriptionTier: 'Transformation',
          messageCount: 100
        }))
      })

      await page.goto('/dashboard')

      // Should have access to all features
      await expect(page.locator('text=Priority Support')).toBeVisible()
      await expect(page.locator('text=Weekly Insights')).toBeVisible()
      await expect(page.locator('text=Personal Coach')).toBeVisible()
    })
  })

  test.describe('Subscription Cancellation', () => {
    test('should handle subscription cancellation', async ({ page }) => {
      // Go to billing portal
      await page.goto('/profile')
      await page.click('text=Manage Subscription')

      // Mock cancellation process
      await page.evaluate(() => {
        // Simulate webhook updating subscription status
        localStorage.setItem('subscriptionStatus', 'cancel_at_period_end')
      })

      await page.reload()

      // Should show cancellation notice
      await expect(page.locator('text=Subscription ending')).toBeVisible()
      await expect(page.locator('text=Access until')).toBeVisible()

      // Should offer reactivation
      await expect(page.locator('button:has-text("Reactivate")')).toBeVisible()
    })

    test('should handle subscription expiration', async ({ page }) => {
      // Mock expired subscription
      await page.evaluate(() => {
        localStorage.setItem('userProfile', JSON.stringify({
          subscriptionTier: 'Explorer',
          subscriptionStatus: 'canceled'
        }))
      })

      await page.goto('/dashboard')

      // Should show downgrade notice
      await expect(page.locator('text=Subscription expired')).toBeVisible()
      await expect(page.locator('text=Explorer features')).toBeVisible()

      // Should offer resubscription
      await expect(page.locator('button:has-text("Resubscribe")')).toBeVisible()
    })
  })

  test.describe('Enterprise Features', () => {
    test('should show enterprise options for high-value users', async ({ page }) => {
      await page.goto('/pricing')

      // Should show enterprise contact option
      await expect(page.locator('text=Enterprise')).toBeVisible()
      await expect(page.locator('text=Contact Sales')).toBeVisible()

      // Click contact sales
      await page.click('button:has-text("Contact Sales")')

      // Should open contact form
      await expect(page.locator('text=Enterprise Inquiry')).toBeVisible()
    })
  })
})