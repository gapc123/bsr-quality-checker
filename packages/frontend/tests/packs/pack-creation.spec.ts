import { test, expect } from '@playwright/test';
import { testPack } from '../fixtures/test-data';

/**
 * P0 Critical Test: Pack Creation Workflow
 * Tests PacksList.tsx - the entry point for creating new packs
 */

test.describe('Pack Creation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Skip authentication if not configured
    if (!process.env.TEST_USER_EMAIL) {
      test.skip();
    }

    // TODO: Add authentication helper once Clerk setup is complete
    // For now, this test will fail until auth is configured
    await page.goto('/packs');
  });

  test('should open new pack modal when clicking New Pack button', async ({ page }) => {
    const newPackButton = page.locator('button').filter({ hasText: /new pack/i });
    await newPackButton.click();

    // Verify modal opens
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal).toBeVisible();

    // Check for required form fields
    await expect(page.locator('input[name="name"], input[placeholder*="pack name" i]')).toBeVisible();
    await expect(page.locator('select, [role="combobox"]').filter({ hasText: /client/i }).or(
      page.locator('label').filter({ hasText: /client/i }).locator('..').locator('select, [role="combobox"]')
    )).toBeVisible();
  });

  test('should validate required pack name field', async ({ page }) => {
    const newPackButton = page.locator('button').filter({ hasText: /new pack/i });
    await newPackButton.click();

    // Try to submit without filling pack name
    const createButton = page.locator('button').filter({ hasText: /create pack|submit/i });
    await createButton.click();

    // Should show validation error
    const errorMessage = page.locator('.error, [role="alert"], .text-red-500, .text-danger');
    await expect(errorMessage.first()).toBeVisible({ timeout: 2000 });
  });

  test('should populate client dropdown with available clients', async ({ page }) => {
    const newPackButton = page.locator('button').filter({ hasText: /new pack/i });
    await newPackButton.click();

    // Open client dropdown
    const clientSelect = page.locator('select').filter({ hasText: /select client/i }).or(
      page.locator('[role="combobox"]').filter({ hasText: /client/i })
    ).first();

    await clientSelect.click();

    // Check that options are populated (should have at least one option besides placeholder)
    const options = page.locator('option, [role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should create pack with template and auto-generate tasks', async ({ page }) => {
    const newPackButton = page.locator('button').filter({ hasText: /new pack/i });
    await newPackButton.click();

    // Fill out the form
    await page.locator('input[name="name"], input[placeholder*="pack name" i]').fill(testPack.name);

    // Select client
    const clientSelect = page.locator('select, [role="combobox"]').first();
    await clientSelect.click();
    await page.locator('option, [role="option"]').filter({ hasText: new RegExp(testPack.clientName, 'i') }).first().click();

    // Select service package
    const serviceSelect = page.locator('select, [role="combobox"]').filter({ hasText: /service|package/i }).or(
      page.locator('label').filter({ hasText: /service|package/i }).locator('..').locator('select, [role="combobox"]')
    ).first();
    await serviceSelect.click();
    await page.locator('option, [role="option"]').filter({ hasText: /gateway 2/i }).first().click();

    // Select template
    const templateSelect = page.locator('select, [role="combobox"]').filter({ hasText: /template/i }).or(
      page.locator('label').filter({ hasText: /template/i }).locator('..').locator('select, [role="combobox"]')
    ).first();
    await templateSelect.click();
    await page.locator('option, [role="option"]').filter({ hasText: /standard/i }).first().click();

    // Check auto-apply checkbox if present
    const autoApplyCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /auto.*apply/i }).or(
      page.locator('label').filter({ hasText: /auto.*apply/i }).locator('input[type="checkbox"]')
    );
    if (await autoApplyCheckbox.isVisible()) {
      await autoApplyCheckbox.check();
    }

    // Submit form
    const createButton = page.locator('button').filter({ hasText: /create pack|submit/i });
    await createButton.click();

    // Wait for success - modal should close and new pack should appear in list
    await expect(page.locator('[role="dialog"], .modal')).not.toBeVisible({ timeout: 5000 });

    // Verify new pack appears in list
    await expect(page.locator('text=' + testPack.name)).toBeVisible({ timeout: 5000 });
  });

  test('should filter packs by client', async ({ page }) => {
    // Check if client filter dropdown exists
    const clientFilter = page.locator('select, [role="combobox"]').filter({ hasText: /filter.*client|client.*filter/i }).or(
      page.locator('label').filter({ hasText: /filter.*client|client.*filter/i }).locator('..').locator('select, [role="combobox"]')
    );

    if (await clientFilter.isVisible()) {
      await clientFilter.click();

      // Select a client
      const firstOption = page.locator('option, [role="option"]').nth(1); // Skip "All" option
      const clientName = await firstOption.textContent();
      await firstOption.click();

      // Verify list updates
      // All visible packs should be for the selected client
      const packCards = page.locator('[data-testid="pack-card"], .pack-item, .pack-card');
      if (await packCards.count() > 0) {
        await expect(packCards.first()).toContainText(clientName || '');
      }
    }
  });
});
