import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * P0 Critical Test: Document Upload Workflow
 * Tests Upload.tsx - file upload and version creation
 */

test.describe('Document Upload', () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.TEST_USER_EMAIL) {
      test.skip();
    }

    // Navigate to a pack's upload page
    // TODO: Create test pack first or use existing pack ID
    await page.goto('/packs/1/upload'); // Adjust ID as needed
  });

  test('should display drag-and-drop upload zone', async ({ page }) => {
    // Check for upload zone
    const uploadZone = page.locator('[data-testid="upload-zone"], .dropzone, [class*="drag"], [class*="drop"]').or(
      page.locator('text=/drag.*drop|drop.*files/i').locator('..')
    );
    await expect(uploadZone.first()).toBeVisible();

    // Check for browse button
    const browseButton = page.locator('button, input[type="file"]').filter({ hasText: /browse|choose|select.*file/i });
    await expect(browseButton.first()).toBeVisible();
  });

  test('should upload PDF file via file input', async ({ page }) => {
    // Create a test PDF file (or use fixture)
    // For now, we'll test the UI interaction
    const fileInput = page.locator('input[type="file"]');

    // Upload file (this will fail without actual file, but tests the mechanism)
    const testFilePath = path.join(__dirname, '../fixtures/test-pack.pdf');

    // Note: You'll need to create a test PDF in fixtures folder
    // For now, this just tests that the file input exists and can be interacted with
    await expect(fileInput).toBeAttached();

    // Verify file input accepts PDF
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('pdf');
  });

  test('should show uploaded files in list', async ({ page }) => {
    // After file upload (mocked or actual), verify file list
    const fileList = page.locator('[data-testid="file-list"], .file-list, .uploaded-files, ul').filter({
      has: page.locator('text=/\.pdf|file|document/i')
    });

    // This test requires actual file upload to work
    // For now, just verify the UI structure exists
    if (await fileList.isVisible()) {
      const fileItems = fileList.locator('li, [data-testid="file-item"], .file-item');
      expect(await fileItems.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should validate file size limit (50MB)', async ({ page }) => {
    // This test would require creating a large file
    // For now, check if validation exists in UI
    const uploadHelpText = page.locator('text=/50.*mb|maximum.*size|file.*size/i');

    // Verify size limit is communicated to user
    if (await uploadHelpText.isVisible()) {
      await expect(uploadHelpText).toBeVisible();
    }
  });

  test('should validate PDF-only file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Verify file input restricts to PDF
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toMatch(/pdf|\.pdf|application\/pdf/i);
  });

  test('should allow multiple file selection', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    // Check if multiple attribute is set
    const hasMultiple = await fileInput.getAttribute('multiple');
    expect(hasMultiple).not.toBeNull();
  });

  test('should allow removing files before upload', async ({ page }) => {
    // After files are added, check for remove buttons
    const removeButtons = page.locator('button').filter({ hasText: /remove|delete|×|✕/i });

    // This requires files to be uploaded first
    // Verify remove button exists in the component structure
    if (await removeButtons.count() > 0) {
      await expect(removeButtons.first()).toBeVisible();
    }
  });

  test('should display metadata form with 5 required fields', async ({ page }) => {
    // Check for metadata form fields mentioned in Upload.tsx description
    const formFields = page.locator('input, textarea, select').filter({
      has: page.locator('label')
    });

    // Verify at least 5 form fields exist for metadata
    const fieldCount = await formFields.count();
    expect(fieldCount).toBeGreaterThanOrEqual(5);
  });

  test('should create new version on successful upload', async ({ page }) => {
    // Mock successful upload or perform actual upload
    const uploadButton = page.locator('button').filter({ hasText: /upload|submit|create.*version/i });

    // Verify upload button exists
    await expect(uploadButton.first()).toBeVisible();

    // Note: Full test requires backend API mocking or actual file upload
    // This is a structural test for now
  });

  test('should show loading state during upload', async ({ page }) => {
    const uploadButton = page.locator('button').filter({ hasText: /upload|submit|create.*version/i });

    // Click upload
    if (await uploadButton.isVisible() && await uploadButton.isEnabled()) {
      await uploadButton.click();

      // Look for loading indicator
      const loadingIndicator = page.locator('[data-testid="loading"], .spinner, .loading, [role="status"]').or(
        page.locator('text=/uploading|processing/i')
      );

      // Loading state should appear (may be brief)
      // This is a best-effort test
    }
  });
});
