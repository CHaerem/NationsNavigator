# Test Suite Organization

This directory contains a comprehensive test suite organized by testing strategy and complexity, using both Jest and Playwright for complete coverage.

## Directory Structure

```
tests/
├── unit/              # Fast unit tests (Jest)
├── integration/       # Complex integration tests (Jest)
├── e2e/              # End-to-end browser tests (Playwright)
├── performance/       # Performance benchmarking
├── services/         # Service layer tests
├── __mocks__/        # Shared mock objects
└── setup.js          # Global Jest configuration
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **Purpose**: Fast, isolated component testing
- **Framework**: Jest with jsdom
- **Coverage**: Individual functions, components, modules
- **Files**: 
  - `country-selection-touch.test.js` - Touch interface validation
  - `touch-device.test.js` - Device detection logic
  - `floating-panel.test.js` - FloatingPanel component
  - `edge-cases.test.js` - Edge case handling
  - `data.test.js`, `llm.test.js`, `map.test.js` - Core module tests

### Integration Tests (`tests/integration/`)
- **Purpose**: Complex multi-module interactions
- **Framework**: Jest with comprehensive mocking
- **Coverage**: Module integration, workflows
- **Files**:
  - `map-integration.test.js` - Comprehensive map functionality
  - `performance-benchmark.test.js` - Performance validation

### E2E Tests (`tests/e2e/`)
- **Purpose**: Real browser testing across devices
- **Framework**: Playwright
- **Coverage**: User workflows, cross-browser compatibility
- **Files**:
  - `touch-basic.spec.js` - Essential touch interactions
  - `touch-interface.spec.js` - Complete touch interface
  - `cross-device.spec.js` - Multi-device compatibility
  - `performance.spec.js` - Runtime performance
  - `touch-performance.spec.js` - Touch-specific performance

## Running Tests

To run the full test suite locally:

```bash
npm install
npm test
```

For watch mode during development:
```bash
npm run test:watch
```

For coverage reports:
```bash
npm run test:coverage
```

## Test Coverage

Current test coverage: **47 passing tests out of 60 total (78% pass rate)**

### Test Breakdown by Module

- ✅ **Data Operations**: 9/9 passing (100%)
- ✅ **Map Functionality**: 5/5 passing (100%) 
- ✅ **Enhanced LLM Module**: 6/6 passing (100%)
- ✅ **Model Cache Detection**: 5/5 passing (100%)
- ✅ **Edge Cases Handling**: 9/9 passing (100%)
- ✅ **Performance Benchmarking**: 1/1 passing (100%)
- 🔧 **UI Components**: 8/12 passing (in progress)
- 🔧 **Advanced Modal Behavior**: 4/13 passing (in progress)

## Test Files

### Core Module Tests
- **`data.test.js`** - Country data loading, AlaSQL operations, error handling
- **`map.test.js`** - Leaflet integration, country highlighting, geospatial interactions
- **`llm.test.js`** - Enhanced WebLLM integration, structured outputs, function calling
- **`ui.test.js`** - Component integration and modern UI patterns

### Specialized Tests  
- **`model-cache.test.js`** - Model caching detection and WebLLM cache management
- **`download-modal.test.js`** - Modal behavior, hardware recommendations, error handling
- **`edge-cases-fixed.test.js`** - Regression tests for previously fixed edge cases
- **`performance-benchmark.test.js`** - Performance measurement system validation

### Performance Evaluation Tests
- **`performance/integration-test.js`** - Structured performance evaluation system testing
- Located in `tests/performance/` - comprehensive performance measurement framework

## Mock Strategy

### External Dependencies
Mock implementations for external services and APIs:

- **`__mocks__/webllm.js`** - WebLLM CreateMLCEngine, model management functions
- **Leaflet.js** - Complete mock of map, tile layers, and GeoJSON handling
- **AlaSQL** - Database operations and table management
- **Fetch API** - Network requests and country data loading
- **Cache API** - Browser cache for model storage detection

### Testing Environment
- **`setup.js`** - Global test configuration, DOM setup, and mock initialization
- **jsdom** - Browser environment simulation for DOM manipulation testing
- **ES6 Modules** - Native ES module support with `jest.unstable_mockModule`

## Architecture Testing

### Component Testing
The test suite validates the component-based architecture:

- **Component Lifecycle** - Initialization, updates, and cleanup
- **Inter-Component Communication** - Event handling and data flow
- **Error Handling** - Graceful degradation and fallback behavior
- **Service Layer** - Dependency injection and circular dependency resolution

### Integration Testing
- **Module Coordination** - Cross-module communication and data sharing
- **UI-Business Logic Separation** - Clean boundaries between UI and core logic
- **State Management** - Application state consistency across components

### Mock Isolation
- **Dependency Injection** - Clean module boundaries for testability
- **External Service Mocking** - Isolated testing without external dependencies
- **DOM Manipulation** - Comprehensive jsdom environment for UI testing

## Testing Patterns

### ES6 Module Mocking
```javascript
// Modern ES6 module mocking
jest.unstable_mockModule("../js/data.js", () => ({
    executeQuery: jest.fn(() => []),
    fetchCountryData: jest.fn(() => Promise.resolve()),
    getCountryData: jest.fn(() => ({}))
}));
```

### Component Testing Pattern
```javascript
// Component lifecycle testing
const { UIManager } = await import("../js/components/UIManager.js");
const uiManager = new UIManager();
await uiManager.init();
expect(uiManager.isInitialized).toBe(true);
```

### Mock Setup Pattern
```javascript
// Comprehensive external dependency mocking
global.L = {
    map: jest.fn(() => ({ setView: jest.fn(), on: jest.fn() })),
    tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
    geoJSON: jest.fn(() => ({ addTo: jest.fn() }))
};
```

## Best Practices

### Test Organization
- **Descriptive Test Names** - Clear test purpose and expected behavior
- **Logical Grouping** - Related tests organized in describe blocks
- **Setup/Teardown** - Consistent beforeEach/afterEach for clean test state

### Mock Management
- **Minimal Mocking** - Only mock what's necessary for test isolation
- **Realistic Mocks** - Mock behavior matches real implementation interfaces
- **Mock Verification** - Ensure mocks are called with correct parameters

### Error Testing
- **Exception Handling** - Test error conditions and graceful failures
- **Edge Cases** - Validate behavior at system boundaries
- **Regression Prevention** - Tests for previously discovered bugs

## Continuous Integration

Tests run automatically on:
- **Pre-commit hooks** - Ensure code quality before commits
- **Pull requests** - Validate changes don't break existing functionality  
- **Main branch pushes** - Continuous validation of production code

## Development Workflow

1. **Write tests first** - TDD approach for new features
2. **Run tests frequently** - Quick feedback during development
3. **Mock external dependencies** - Fast, reliable test execution
4. **Validate coverage** - Ensure comprehensive test coverage
5. **Fix failing tests** - Maintain high reliability standards

The test suite ensures NationsNavigator remains reliable, maintainable, and ready for future enhancements!