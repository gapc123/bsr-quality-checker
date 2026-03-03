# BSR Quality Checker - E2E Test Suite

Playwright-based end-to-end tests for the BSR Quality Checker frontend.

## Test Structure

```
tests/
├── auth/
│   └── signin.spec.ts           # P0: Authentication tests
├── clients/
│   └── (future client CRUD tests)
├── packs/
│   ├── pack-creation.spec.ts    # P0: Pack creation workflow
│   ├── pack-status.spec.ts      # P0: Status change workflow
│   └── upload.spec.ts           # P0: Document upload
├── results/
│   └── assessment-workflow.spec.ts # P0: Core AI assessment workflow
├── tasks/
│   └── (future task management tests)
└── fixtures/
    ├── test-data.ts             # Test data constants
    └── test-pack.pdf            # Sample PDF for upload tests
```

## Running Tests

### Prerequisites

1. Set up test environment variables:
```bash
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="your-test-password"
```

2. Ensure the development server is running, or tests will start it automatically.

### Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug a specific test
npm run test:debug

# View HTML report
npm run test:report

# Run specific test file
npx playwright test tests/auth/signin.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
```

## Test Priority Levels

### P0 (Critical) - Currently Implemented
- **SignIn** (`auth/signin.spec.ts`) - Authentication flow
- **Pack Creation** (`packs/pack-creation.spec.ts`) - Creating new packs
- **Upload** (`packs/upload.spec.ts`) - Document upload workflow
- **Assessment Workflow** (`results/assessment-workflow.spec.ts`) - AI assessment
- **Status Changes** (`packs/pack-status.spec.ts`) - Pack status transitions

### P1 (High) - To Be Implemented
- Client management CRUD operations
- Task checklist functionality
- Task detail modal interactions
- Download functionality

### P2 (Medium) - Future
- AI regeneration features
- Comment functionality
- Template management

### P3 (Low) - Future
- UI toggles
- Empty state handling
- Filter interactions

## Test Fixtures

### Required Files

Create the following fixture file for upload tests:

```bash
# Create a test PDF (or copy an existing one)
cp /path/to/sample.pdf tests/fixtures/test-pack.pdf
```

### Test Data

Test data constants are defined in `fixtures/test-data.ts`:
- Client information
- Pack configuration
- Task templates
- API endpoints

## Authentication Setup

Tests requiring authentication use Clerk. Configure test credentials:

1. Create a test user in your Clerk dashboard
2. Set environment variables (see Prerequisites)
3. Tests will skip if credentials are not configured

## API Mocking

For deterministic tests, consider mocking API responses:

```typescript
await page.route('**/api/packs', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ id: 1, name: 'Test Pack' })
  });
});
```

## CI/CD Integration

Tests are configured for CI in `playwright.config.ts`:
- Automatic retries on failure
- Single worker for stability
- HTML report generation

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

1. **Use data-testid attributes** - Add `data-testid` to key elements for stable selectors
2. **Avoid brittle selectors** - Prefer semantic selectors over class names
3. **Test user journeys** - Test complete workflows, not just isolated interactions
4. **Mock external dependencies** - Use API mocking for consistent results
5. **Clean up test data** - Ensure tests don't leave artifacts

## Debugging Tips

### Visual Debugging
```bash
# Run with UI mode
npm run test:ui

# Run in headed mode
npm run test:headed

# Step through with debugger
npm run test:debug
```

### Selector Debugging
```bash
# Use Playwright Inspector
npx playwright test --debug

# Generate selectors
npx playwright codegen http://localhost:5173
```

### Screenshot on Failure
Screenshots are automatically captured on failure. Find them in:
```
test-results/
└── [test-name]-[browser]/
    └── test-failed-1.png
```

## Coverage Goals

- **P0 pages**: 80%+ E2E coverage
- **P1 pages**: 60%+ E2E coverage
- **P2/P3 pages**: Manual testing acceptable

## Known Limitations

1. **File Upload**: Requires actual PDF files in fixtures/
2. **Authentication**: Depends on Clerk configuration
3. **API Dependencies**: Some tests require backend API to be running
4. **Polling Tests**: Assessment status polling tests may be flaky without API mocking

## Contributing

When adding new tests:
1. Follow the existing structure (group by feature area)
2. Add descriptive test names
3. Include comments explaining complex interactions
4. Update this README with new test coverage
5. Ensure tests pass in CI before merging

## Support

For issues with tests:
1. Check test logs in `test-results/`
2. Review HTML report: `npm run test:report`
3. Run specific test in debug mode: `npm run test:debug`
