# Test Suite

Comprehensive automated test suite for NationsNavigator using [Jest](https://jestjs.io/) with ES6 modules support. The tests ensure reliability and maintainability of the component-based architecture.

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

Current test coverage: **43 passing tests out of 52 total (83% pass rate)**

### Test Breakdown by Module

- ✅ **Data Operations**: 9/9 passing (100%)
- ✅ **Map Functionality**: 10/10 passing (100%) 
- ✅ **UI Legacy Functions**: 6/6 passing (100%)
- ✅ **Model Cache Detection**: 8/8 passing (100%)
- ✅ **Edge Cases Handling**: 7/7 passing (100%)
- 🔧 **Advanced Modal Behavior**: 3/9 passing (in progress)

## Test Files

### Core Module Tests
- **`data.test.js`** - Country data loading, AlaSQL operations, error handling
- **`map.test.js`** - Leaflet integration, country highlighting, geospatial interactions
- **`llm.test.js`** - WebLLM integration, SQL generation, model management
- **`ui.test.js`** - Legacy UI function delegation and component integration

### Specialized Tests  
- **`model-cache.test.js`** - Model caching detection and WebLLM cache management
- **`download-modal.test.js`** - Modal behavior, hardware recommendations, error handling
- **`edge-cases-fixed.test.js`** - Regression tests for previously fixed edge cases

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