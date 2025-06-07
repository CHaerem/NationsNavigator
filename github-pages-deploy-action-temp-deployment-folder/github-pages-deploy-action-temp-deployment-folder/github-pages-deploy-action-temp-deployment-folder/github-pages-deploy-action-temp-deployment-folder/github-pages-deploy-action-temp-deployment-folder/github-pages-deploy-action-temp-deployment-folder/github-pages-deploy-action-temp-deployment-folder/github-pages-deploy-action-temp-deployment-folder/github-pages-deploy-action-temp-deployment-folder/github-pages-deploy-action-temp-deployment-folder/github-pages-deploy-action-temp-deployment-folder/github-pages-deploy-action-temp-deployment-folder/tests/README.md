# Test Suite

Automated tests for NationsNavigator are written with [Jest](https://jestjs.io/). They cover data loading, map behaviour and WebLLM integration.

To run the tests locally:

```bash
npm install
npm test
```

Mock implementations for external services live in `__mocks__/` and the environment is configured in `setup.js`.
