# 📊 Performance Testing Suite

This directory contains the performance evaluation and benchmarking system for NationsNavigator's enhanced LLM capabilities.

## Structure

```
tests/performance/
├── README.md                    # This file
├── benchmark-config.js          # Test configuration and query definitions
├── performance-evaluator.js     # Core evaluation engine
├── report-generator.js          # Report generation utilities
├── results/                     # Generated performance reports
│   ├── baseline-results.json    # Baseline performance metrics
│   └── [timestamp]-results.json # Timestamped evaluation results
└── scripts/                     # Evaluation automation scripts
    ├── run-evaluation.js        # Complete evaluation runner
    └── compare-results.js       # Results comparison utility
```

## Usage

### Quick Performance Check
```bash
npm run perf:quick
```

### Full Performance Evaluation
```bash
npm run perf:full
```

### Compare Results
```bash
npm run perf:compare baseline-results.json latest-results.json
```

### Generate Report
```bash
npm run perf:report
```

## Test Categories

1. **Query Analysis Performance**: Intent classification, entity extraction, complexity assessment
2. **SQL Generation Benchmarks**: Standard vs enhanced SQL generation comparison
3. **Function Calling Evaluation**: Tool selection and execution performance
4. **End-to-End Performance**: Complete query processing workflows
5. **Regression Testing**: Ensure improvements don't break existing functionality

## Metrics Tracked

- **Accuracy**: Intent classification, entity extraction success rates
- **Performance**: Response times, processing latency
- **Reliability**: Success rates, error handling effectiveness
- **Quality**: Confidence scores, structured output compliance

## Integration

The performance system integrates with:
- Jest test suite for automated testing
- Interactive dashboard for manual evaluation
- CI/CD pipeline for continuous performance monitoring
- Development workflow for regression detection