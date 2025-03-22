# Running Tests for Activity Tracker App

This document provides instructions for running the test suite for the Activity Tracker App.

## Prerequisites

Make sure you have Node.js and npm installed on your system, and that all dependencies have been installed:

```bash
npm install
```

## Running Tests

### Run All Tests

To run all tests once:

```bash
npm test
```

### Run Tests in Watch Mode

To run tests in watch mode (tests will re-run when files change):

```bash
npm run test:watch
```

### Run Tests with Coverage Report

To generate a test coverage report:

```bash
npm run test:coverage
```

This will create a `coverage` directory with detailed reports on test coverage.

## Test Structure

The tests are organized as follows:

- `test/api.test.js` - API endpoint integration tests
- `test/models.test.js` - Unit tests for database models
- `test/setup.js` - Test configuration and mocks

## Mocking

The tests use Jest's mocking capabilities to:

1. Mock database connections to avoid actual database operations
2. Mock email services to avoid sending real emails
3. Mock authentication to test protected routes

## Adding New Tests

When adding new tests:

1. Use the appropriate test file based on what you're testing
2. Add mocks in `test/setup.js` for new external dependencies
3. Follow the existing patterns for testing similar functionality

## Troubleshooting

If you encounter issues running tests:

- Make sure all dependencies are installed
- Check that your environment variables are set correctly
- Verify that the database connection details are correct
- Check for any syntax errors in test files

If you need to debug a specific test, you can run it in isolation:

```bash
npx jest -t "your test description"
```

## Test Coverage Goals

The project aims for at least 70% test coverage across:
- Branches
- Functions
- Lines
- Statements

Current coverage reports are generated in the coverage directory after running `npm run test:coverage`.

