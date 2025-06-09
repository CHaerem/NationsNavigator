// Performance Benchmark Configuration
export const BENCHMARK_CONFIG = {
    // Test query definitions with expected results
    testQueries: [
        {
            id: 'geo_simple_1',
            query: "Countries in Europe",
            category: "simple_geographic",
            expected: {
                intent: "geographic",
                complexity: "low",
                entities: {
                    regions: ["europe"]
                }
            },
            weight: 1.0
        },
        {
            id: 'geo_simple_2', 
            query: "Countries in Asia",
            category: "simple_geographic",
            expected: {
                intent: "geographic", 
                complexity: "low",
                entities: {
                    regions: ["asia"]
                }
            },
            weight: 1.0
        },
        {
            id: 'pop_simple_1',
            query: "Most populated countries",
            category: "simple_population",
            expected: {
                intent: "population",
                complexity: "low",
                entities: {}
            },
            weight: 1.0
        },
        {
            id: 'pop_complex_1',
            query: "Countries with population over 100 million",
            category: "complex_population", 
            expected: {
                intent: "population",
                complexity: "medium",
                entities: {
                    numbers: [100]
                }
            },
            weight: 1.2
        },
        {
            id: 'flag_simple_1',
            query: "Countries with red flags",
            category: "simple_flag",
            expected: {
                intent: "flag",
                complexity: "low", 
                entities: {
                    colors: ["red"]
                }
            },
            weight: 1.0
        },
        {
            id: 'flag_complex_1',
            query: "European countries with crosses in their flags",
            category: "complex_flag",
            expected: {
                intent: "complex",
                complexity: "medium",
                entities: {
                    regions: ["europe"],
                    colors: ["cross"]
                }
            },
            weight: 1.3
        },
        {
            id: 'lang_simple_1',
            query: "Spanish speaking countries", 
            category: "simple_language",
            expected: {
                intent: "language",
                complexity: "low",
                entities: {
                    languages: ["spanish"]
                }
            },
            weight: 1.0
        },
        {
            id: 'lang_complex_1',
            query: "Countries that speak French or German",
            category: "complex_language",
            expected: {
                intent: "language",
                complexity: "medium", 
                entities: {
                    languages: ["french", "german"]
                }
            },
            weight: 1.2
        },
        {
            id: 'comparison_1',
            query: "Compare France, Germany, and Italy by population and area",
            category: "comparison",
            expected: {
                intent: "complex",
                complexity: "high",
                entities: {
                    countries: ["france", "germany", "italy"]
                }
            },
            weight: 1.5
        },
        {
            id: 'multi_criteria_1',
            query: "Island nations in the Pacific with population under 1 million",
            category: "multi_criteria",
            expected: {
                intent: "complex", 
                complexity: "high",
                entities: {
                    numbers: [1000000],
                    comparisons: ["under"]
                }
            },
            weight: 1.5
        },
        {
            id: 'geo_complex_1',
            query: "What are the largest countries in Africa by area?",
            category: "complex_geographic",
            expected: {
                intent: "size",
                complexity: "medium",
                entities: {
                    regions: ["africa"]
                }
            },
            weight: 1.3
        }
    ],

    // Performance thresholds
    thresholds: {
        accuracy: {
            excellent: 0.9,
            good: 0.8,
            acceptable: 0.7
        },
        responseTime: {
            excellent: 10,   // ms
            good: 50,        // ms
            acceptable: 100  // ms
        },
        successRate: {
            excellent: 0.95,
            good: 0.85,
            acceptable: 0.75
        }
    },

    // Test weights by category
    categoryWeights: {
        simple_geographic: 1.0,
        simple_population: 1.0, 
        simple_flag: 1.0,
        simple_language: 1.0,
        complex_population: 1.2,
        complex_flag: 1.3,
        complex_language: 1.2,
        complex_geographic: 1.3,
        comparison: 1.5,
        multi_criteria: 1.5
    },

    // Evaluation criteria
    evaluationCriteria: {
        intentAccuracy: {
            weight: 0.4,
            description: "Correct intent classification"
        },
        complexityAccuracy: {
            weight: 0.3,
            description: "Accurate complexity assessment"
        },
        entityExtraction: {
            weight: 0.2,
            description: "Successful entity identification"
        },
        responseTime: {
            weight: 0.1,
            description: "Processing speed"
        }
    }
};

// Baseline performance expectations
export const BASELINE_EXPECTATIONS = {
    overall: {
        accuracy: 0.85,
        responseTime: 20,
        successRate: 0.9
    },
    byCategory: {
        simple_geographic: { accuracy: 0.95, responseTime: 10 },
        simple_population: { accuracy: 0.90, responseTime: 10 },
        simple_flag: { accuracy: 0.95, responseTime: 10 },
        simple_language: { accuracy: 0.95, responseTime: 10 },
        complex_population: { accuracy: 0.85, responseTime: 25 },
        complex_flag: { accuracy: 0.80, responseTime: 30 },
        complex_language: { accuracy: 0.85, responseTime: 25 },
        complex_geographic: { accuracy: 0.80, responseTime: 30 },
        comparison: { accuracy: 0.75, responseTime: 40 },
        multi_criteria: { accuracy: 0.70, responseTime: 50 }
    }
};