# Testing Guide for Cinextma

This guide provides comprehensive information about the testing infrastructure, how to run tests, maintain them, and monitor application stability.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Categories](#test-categories)
3. [Running Tests](#running-tests)
4. [Test Maintenance](#test-maintenance)
5. [Performance Monitoring](#performance-monitoring)
6. [Continuous Integration](#continuous-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Overview

Cinextma uses a multi-layered testing approach:

- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: API route and database integration testing
- **E2E Tests**: Playwright for full user flow testing
- **Performance Tests**: Lighthouse and custom performance monitoring
- **Load Tests**: k6 and custom load testing scripts
- **Security Tests**: Automated security validation

### Test Statistics

- **Unit Tests**: 15+ test files covering player components, auth, schemas, and utilities
- **E2E Tests**: 5 test suites covering auth, movie/TV watching, security, and stability
- **Performance Tests**: Baseline tests with configurable thresholds
- **Load Tests**: API load testing with concurrent request simulation

## Test Categories

### 1. Unit Tests (Vitest)

**Location**: `src/**/*.test.ts`, `src/**/*.test.tsx`

**Coverage**:
- Player components (`usePlayerEvents`, `MoviePlayer`, `TvShowPlayer`)
- Authentication actions and schemas
- API route validation
- Utility functions (URL validation, localStorage)

**Running**:
```bash
npm test              # Run all unit tests
npm run test:ui       # Run with UI interface
```

### 2. Integration Tests

**Location**: `src/app/api/**/*.route.test.ts`

**Coverage**:
- API route endpoints (`/api/player/save-history`, `/api/auth/*`)
- Database integration with Supabase
- Request validation and error handling

**Running**:
```bash
npm test              # Includes integration tests
```

### 3. E2E Tests (Playwright)

**Location**: `e2e/*.spec.ts`

**Coverage**:
- Authentication flows (sign in, sign up, password reset)
- Movie watching flows (browse, search, playback)
- TV show watching flows (season/episode selection)
- Security tests (popup blocking, CSP, input validation)
- Stability tests (memory management, session persistence)

**Running**:
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui          # Run with UI interface
npm run test:e2e:debug        # Run in debug mode
npm run test:e2e:headed      # Run with visible browser
```

**Electron E2E Tests**:
```bash
npx playwright test --config=playwright.electron.config.ts
```

### 4. Performance Tests

**Location**: `scripts/performance-baseline.mjs`

**Coverage**:
- Core Web Vitals (FCP, LCP, TTI, CLS, TBT)
- Page load performance
- Resource loading optimization

**Running**:
```bash
npm run test:performance          # Run performance baseline tests
npm run test:performance:report  # Generate performance report
```

**Thresholds**:
- First Contentful Paint: < 1800ms
- Largest Contentful Paint: < 2500ms
- Time to Interactive: < 3800ms
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

### 5. Load Tests

**Location**: `load-tests/`

**Coverage**:
- API endpoint load testing
- Concurrent request handling
- Response time under load

**Running**:
```bash
npm run test:load      # Run simple load test
npm run test:load:k6   # Run k6 load test (requires k6 installation)
```

**Thresholds**:
- Average response time: < 500ms
- Success rate: > 95%
- Max response time: < 2000ms

### 6. Security Tests

**Location**: `e2e/security.spec.ts`, `scripts/security-guard.mjs`

**Coverage**:
- Popup blocking mechanisms
- Content Security Policy validation
- Input sanitization
- Authentication security
- Iframe security
- Open redirect prevention

**Running**:
```bash
npm run test:e2e              # Includes security tests
npm run security-guard        # Run security guard script
```

## Running Tests

### Quick Start

Run all tests:
```bash
npm test              # Unit and integration tests
npm run test:e2e      # E2E tests
```

Run specific test suites:
```bash
# Unit tests only
npm test

# E2E tests only
npm run test:e2e

# Performance tests
npm run test:performance

# Load tests
npm run test:load
```

### Development Workflow

1. **Before committing**: Run unit tests
   ```bash
   npm test
   ```

2. **Before major changes**: Run E2E tests
   ```bash
   npm run test:e2e
   ```

3. **Before deployment**: Run full test suite
   ```bash
   npm test && npm run test:e2e && npm run test:performance
   ```

### CI/CD Integration

Run tests in CI environment:
```bash
# Set CI environment variable
export CI=true

# Run tests with CI configuration
npm test
npm run test:e2e
```

## Test Maintenance

### Adding New Tests

**Unit Tests**:
1. Create test file next to the component: `ComponentName.test.tsx`
2. Import testing utilities: `import { describe, expect, it } from 'vitest'`
3. Mock external dependencies
4. Write test cases following existing patterns

**E2E Tests**:
1. Create test file in `e2e/`: `feature-name.spec.ts`
2. Import Playwright: `import { test, expect } from '@playwright/test'`
3. Use data-testid attributes for element selection
4. Follow existing test patterns

### Updating Tests

When changing component behavior:
1. Update corresponding test files
2. Ensure all related tests pass
3. Add new tests for new functionality
4. Remove obsolete tests

### Test Data Management

**Unit Tests**: Use mock data and fixtures
```typescript
const mockMovie = {
  id: 123,
  title: "Test Movie",
  // ... other properties
};
```

**E2E Tests**: Use test-specific data
- Use test accounts for authentication
- Use test-specific media IDs
- Clean up test data after tests

### Test Coverage Goals

- **Critical paths**: > 90% coverage
- **Overall coverage**: > 80% coverage
- **E2E coverage**: All major user flows

Check coverage:
```bash
npm test -- --coverage
```

## Performance Monitoring

### Performance Metrics

**Web Vitals**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

**API Performance**:
- Response time
- Database query time
- External API call time

**Memory Usage**:
- JavaScript heap size
- Memory leak detection

### Monitoring Setup

**Generate Performance Report**:
```bash
npm run test:performance:report
```

This generates `performance-report.md` with:
- Latest metrics
- Performance trends
- Threshold violations
- Recommendations

### Performance Thresholds

Update thresholds in:
- `scripts/performance-baseline.mjs` - Web Vitals thresholds
- `scripts/performance-monitor.mjs` - API and memory thresholds
- `lighthouserc.json` - Lighthouse CI thresholds

### Performance Regression Detection

Compare performance over time:
```bash
# Run performance tests
npm run test:performance

# Generate report
npm run test:performance:report

# Check for regressions in the report
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
      - run: npm run test:performance
```

### Pre-commit Hooks

Install husky for pre-commit hooks:
```bash
npm install -D husky lint-staged
npx husky install
```

Add pre-commit hook:
```bash
# .husky/pre-commit
npm test
```

## Troubleshooting

### Common Issues

**Tests timing out**:
- Increase timeout in test configuration
- Check if application is running on expected port
- Verify network connectivity

**E2E tests failing**:
- Ensure dev server is running: `npm run dev`
- Check if data-testid attributes are present
- Verify element selectors are correct
- Run in headed mode to see what's happening: `npm run test:e2e:headed`

**Performance tests failing**:
- Check if thresholds are realistic for your environment
- Run tests multiple times to account for variance
- Check system resources during test execution

**Load tests failing**:
- Ensure API server is running
- Check if API endpoints are accessible
- Verify load test configuration matches your setup

### Debugging Tests

**Unit tests**:
```bash
npm run test:ui    # Interactive UI for debugging
```

**E2E tests**:
```bash
npm run test:e2e:debug    # Step through tests
npm run test:e2e:headed  # Watch browser execution
```

**Performance tests**:
```bash
# Check performance-metrics.json for detailed data
cat performance-metrics.json
```

### Test Environment Issues

**Port conflicts**:
- Change port in `playwright.config.ts`
- Change port in `vitest.config.ts`

**Database connection issues**:
- Ensure Supabase is running: `npm run sb-start`
- Check database connection string
- Verify test database schema

**Authentication issues in tests**:
- Use test accounts with known credentials
- Mock authentication in unit tests
- Ensure test users exist in test database

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert pattern**:
   ```typescript
   // Arrange
   const mockData = { /* ... */ };
   
   // Act
   const result = functionUnderTest(mockData);
   
   // Assert
   expect(result).toBe(expected);
   ```

2. **Test one thing per test**:
   - Each test should verify a single behavior
   - Use descriptive test names

3. **Use meaningful assertions**:
   - Prefer specific assertions over generic ones
   - Include error messages in assertions

4. **Keep tests independent**:
   - Tests should not depend on each other
   - Clean up after each test

5. **Mock external dependencies**:
   - Don't make real API calls in unit tests
   - Use consistent mock data

### Test Organization

- Group related tests with `describe`
- Use descriptive test names with `it`
- Keep test files close to implementation
- Use consistent naming conventions

### Performance Considerations

- Keep unit tests fast (< 100ms per test)
- Use test isolation to prevent interference
- Parallelize tests when possible
- Cache expensive operations

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [k6 Documentation](https://k6.io/docs/)

### Internal Documentation
- `STABILITY_TESTING_PLAN.md` - Comprehensive testing strategy
- `performance-report.md` - Generated performance reports
- `performance-metrics.json` - Raw performance data

### Configuration Files
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `lighthouserc.json` - Lighthouse CI configuration
- `package.json` - Test scripts and dependencies

## Support

For testing-related issues:
1. Check this guide first
2. Review test error messages carefully
3. Run tests in debug mode if needed
4. Check GitHub issues for similar problems
5. Contact the development team for persistent issues

## Changelog

### Version 1.0.0 (Current)
- Initial comprehensive testing setup
- Unit tests for core components
- E2E tests for major user flows
- Performance monitoring infrastructure
- Load testing capabilities
- Security testing suite
- Cross-platform testing support (Electron)