import { test, expect } from '@playwright/test';
import { testCredentials } from '../fixtures/test-data';

/**
 * P0 Critical Test: Authentication Flow
 * Tests the SignIn.tsx page - the gateway to the entire application
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
  });

  test('should display sign-in page', async ({ page }) => {
    // Verify page loads correctly
    await expect(page).toHaveTitle(/Sign In|BSR Quality Checker/i);

    // Check for Clerk sign-in component
    const signInForm = page.locator('[data-clerk-component]').or(
      page.locator('form').filter({ hasText: /sign in|email|password/i })
    );
    await expect(signInForm).toBeVisible();
  });

  test('should show validation error for invalid credentials', async ({ page }) => {
    // This test depends on Clerk's UI - adjust selectors based on actual implementation
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Attempt login with invalid credentials
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    // Wait for error message (Clerk shows errors differently - adjust as needed)
    const errorMessage = page.locator('[role="alert"], .error, .cl-formFieldErrorText');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    // Skip if no test credentials are configured
    if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
      test.skip();
    }

    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Perform login
    await emailInput.fill(testCredentials.email);
    await passwordInput.fill(testCredentials.password);
    await submitButton.click();

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/packs/i, { timeout: 10000 });
  });

  test('should handle social authentication options if configured', async ({ page }) => {
    // Check if Google/Microsoft OAuth buttons are present
    const socialButtons = page.locator('button').filter({
      hasText: /continue with google|continue with microsoft/i,
    });

    const count = await socialButtons.count();
    if (count > 0) {
      // Verify social auth buttons are clickable
      await expect(socialButtons.first()).toBeEnabled();
    }
  });
});
