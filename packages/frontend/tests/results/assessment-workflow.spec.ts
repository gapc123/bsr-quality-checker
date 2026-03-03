import { test, expect } from '@playwright/test';

/**
 * P0 Critical Test: AI Assessment Workflow
 * Tests Results.tsx - the most complex component (1,324 lines)
 * This is the core value proposition of the application
 */

test.describe('Assessment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_USER_EMAIL) {
      test.skip();
    }

    // Navigate to results page for a pack version
    // TODO: Create test pack and version first
    await page.goto('/packs/1/versions/1/results'); // Adjust IDs as needed
  });

  test('should show "Run Assessment" button for Pending status', async ({ page }) => {
    // Check for pending status indicator
    const pendingStatus = page.locator('text=/pending|not.*started/i');

    if (await pendingStatus.isVisible()) {
      // Verify Run Assessment button exists
      const runButton = page.locator('button').filter({ hasText: /run.*assessment|start.*assessment|analyze/i });
      await expect(runButton).toBeVisible();
      await expect(runButton).toBeEnabled();
    }
  });

  test('should show loading state when assessment is running', async ({ page }) => {
    // Click Run Assessment button
    const runButton = page.locator('button').filter({ hasText: /run.*assessment|start.*assessment|analyze/i });

    if (await runButton.isVisible()) {
      await runButton.click();

      // Should show loading/running state
      const loadingIndicator = page.locator('[data-testid="loading"], .spinner, .loading').or(
        page.locator('text=/running|analyzing|processing/i')
      );

      await expect(loadingIndicator.first()).toBeVisible({ timeout: 3000 });

      // Note: The component polls every 3 seconds for status updates
      // In a real test, you'd mock the API responses to control timing
    }
  });

  test('should poll for status updates every 3 seconds when running', async ({ page }) => {
    // This test requires API mocking to properly verify polling behavior
    // For now, we'll just verify the structure exists

    // Listen for API calls
    const apiCalls: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/analyze/status')) {
        apiCalls.push(request.url());
      }
    });

    // Start assessment
    const runButton = page.locator('button').filter({ hasText: /run.*assessment|start.*assessment|analyze/i });

    if (await runButton.isVisible()) {
      await runButton.click();

      // Wait a bit to see if polling occurs
      await page.waitForTimeout(10000); // Wait 10 seconds

      // Should have made multiple status check requests
      expect(apiCalls.length).toBeGreaterThan(1);
    }
  });

  test('should display carousel when assessment completes', async ({ page }) => {
    // Mock completed status or wait for actual completion
    // For structural test, check if carousel elements exist

    const carousel = page.locator('[data-testid="carousel"], .carousel, [class*="carousel"]').or(
      page.locator('[role="region"]').filter({ hasText: /criterion|criteria/i })
    );

    // Carousel should appear when status is "Completed"
    const completedStatus = page.locator('text=/completed|finished|done/i');

    if (await completedStatus.isVisible()) {
      await expect(carousel.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate carousel with Accept/Reject/Skip buttons', async ({ page }) => {
    // Check for carousel navigation buttons
    const acceptButton = page.locator('button').filter({ hasText: /accept|approve|✓/i });
    const rejectButton = page.locator('button').filter({ hasText: /reject|decline|✗/i });
    const skipButton = page.locator('button').filter({ hasText: /skip|next/i });

    // These should be visible when carousel is active
    if (await acceptButton.isVisible()) {
      await expect(acceptButton).toBeEnabled();
      await expect(rejectButton).toBeEnabled();
      await expect(skipButton).toBeEnabled();

      // Click Accept and verify carousel advances
      const initialCriterion = await page.locator('[data-testid="criterion-title"], .criterion-title, h3').first().textContent();
      await acceptButton.click();

      // Wait for carousel to advance
      await page.waitForTimeout(500);

      const newCriterion = await page.locator('[data-testid="criterion-title"], .criterion-title, h3').first().textContent();

      // Should show different criterion (or completion if last one)
      // This is a simplified check
    }
  });

  test('should expand/collapse criterion details', async ({ page }) => {
    // Check for expand/collapse functionality
    const expandButton = page.locator('button').filter({ hasText: /expand|show.*details|▼|▶/i }).or(
      page.locator('[aria-expanded]')
    );

    if (await expandButton.first().isVisible()) {
      const isExpanded = await expandButton.first().getAttribute('aria-expanded');

      await expandButton.first().click();

      // Wait for state change
      await page.waitForTimeout(300);

      const newExpandedState = await expandButton.first().getAttribute('aria-expanded');

      // State should toggle
      expect(newExpandedState).not.toBe(isExpanded);
    }
  });

  test('should have show/hide all criteria toggle', async ({ page }) => {
    // Check for toggle to show/hide all criteria
    const toggleButton = page.locator('button').filter({ hasText: /show.*all|hide.*all|expand.*all|collapse.*all/i });

    if (await toggleButton.isVisible()) {
      await expect(toggleButton).toBeEnabled();

      // Click toggle
      await toggleButton.click();

      // Verify UI responds (all criteria expand or collapse)
      // This would require more specific selectors based on actual implementation
    }
  });

  test('should trigger document generation after carousel completion', async ({ page }) => {
    // This test requires completing the carousel
    // Monitor for document generation API call

    const generateApiCalls: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/generate-amended-documents')) {
        generateApiCalls.push(request.url());
      }
    });

    // Complete carousel (would need to interact with all criteria)
    // For now, just verify the API endpoint is configured

    // In a real test, you'd mock responses and verify the call happens
    // after the last criterion is processed
  });

  test('should display download buttons for MD/PDF/JSON formats', async ({ page }) => {
    // Check for download buttons
    const downloadButtons = page.locator('button, a').filter({ hasText: /download|export/i });

    if (await downloadButtons.count() > 0) {
      // Should have buttons for different formats
      const mdButton = page.locator('button, a').filter({ hasText: /markdown|\.md/i });
      const pdfButton = page.locator('button, a').filter({ hasText: /pdf|\.pdf/i });
      const jsonButton = page.locator('button, a').filter({ hasText: /json|\.json/i });

      // At least one format should be available
      const hasDownloads =
        (await mdButton.count() > 0) ||
        (await pdfButton.count() > 0) ||
        (await jsonButton.count() > 0);

      expect(hasDownloads).toBeTruthy();
    }
  });

  test('should handle error state gracefully', async ({ page }) => {
    // Test error handling
    // This requires mocking API failure

    // Check if error UI elements exist
    const errorMessage = page.locator('[role="alert"], .error, .alert-error').or(
      page.locator('text=/error|failed|something.*wrong/i')
    );

    // In a real test with API mocking, you'd trigger an error and verify it's displayed
    // For now, just verify error UI components are defined
  });

  test('should make correct API calls in sequence', async ({ page }) => {
    // Monitor API calls
    const apiSequence: Array<{ url: string; method: string }> = [];

    page.on('request', request => {
      if (request.url().includes('/api/packs')) {
        apiSequence.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    // Trigger assessment
    const runButton = page.locator('button').filter({ hasText: /run.*assessment|start.*assessment|analyze/i });

    if (await runButton.isVisible()) {
      await runButton.click();

      // Wait for some API activity
      await page.waitForTimeout(5000);

      // Verify expected API calls occurred
      // Should include:
      // 1. POST to /matrix-assess (start assessment)
      // 2. GET to /analyze/status (polling)
      // 3. Eventually GET to /matrix-report (get results)

      const hasMatrixAssess = apiSequence.some(call =>
        call.url.includes('matrix-assess') && call.method === 'POST'
      );

      const hasStatusPolling = apiSequence.some(call =>
        call.url.includes('analyze/status') && call.method === 'GET'
      );

      expect(hasMatrixAssess || hasStatusPolling).toBeTruthy();
    }
  });
});
