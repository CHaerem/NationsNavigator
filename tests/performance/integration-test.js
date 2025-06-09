// Integration test for performance evaluation system
import { jest } from '@jest/globals';

// Mock dependencies for isolated testing
jest.unstable_mockModule('/Users/christopherhaerem/Privat/NationsNavigator/js/debug.js', () => ({
    debugLog: jest.fn()
}));

const { PerformanceEvaluator } = await import('./performance-evaluator.js');
const { PerformanceReportGenerator } = await import('./report-generator.js');
const { BENCHMARK_CONFIG } = await import('./benchmark-config.js');

describe('Performance Evaluation System', () => {
    let evaluator;
    let reportGenerator;

    beforeEach(() => {
        evaluator = new PerformanceEvaluator();
        reportGenerator = new PerformanceReportGenerator();
    });

    describe('PerformanceEvaluator', () => {
        test('should initialize with proper configuration', () => {
            expect(evaluator.config).toBeDefined();
            expect(evaluator.config.testQueries).toHaveLength(11);
            expect(evaluator.baseline).toBeDefined();
        });

        test('should evaluate individual queries', async () => {
            const testQuery = {
                id: 'test_1',
                query: "Countries in Europe",
                category: "simple_geographic",
                expected: {
                    intent: "geographic",
                    complexity: "low",
                    entities: { regions: ["europe"] }
                },
                weight: 1.0
            };

            const result = await evaluator.evaluateQuery(testQuery);
            
            expect(result).toHaveProperty('id', 'test_1');
            expect(result).toHaveProperty('query', 'Countries in Europe');
            expect(result).toHaveProperty('actual');
            expect(result).toHaveProperty('scores');
            expect(result).toHaveProperty('status');
            expect(result.duration).toBeGreaterThanOrEqual(0);
        });

        test('should calculate entity extraction scores', () => {
            const actualEntities = {
                regions: ['europe'],
                countries: [],
                languages: ['spanish'],
                colors: [],
                numbers: []
            };

            const expectedEntities = {
                regions: ['europe'],
                languages: ['spanish']
            };

            const score = evaluator.calculateEntityScore(actualEntities, expectedEntities);
            expect(score).toBe(1.0); // Perfect match
        });

        test('should calculate response time scores', () => {
            expect(evaluator.getResponseTimeScore(5)).toBe(1.0);    // Excellent
            expect(evaluator.getResponseTimeScore(25)).toBe(0.8);   // Good
            expect(evaluator.getResponseTimeScore(75)).toBe(0.6);   // Acceptable
            expect(evaluator.getResponseTimeScore(150)).toBe(0.3);  // Poor
        });

        test('should calculate grades correctly', () => {
            expect(evaluator.calculateGrade(0.95)).toBe('A');
            expect(evaluator.calculateGrade(0.85)).toBe('B');
            expect(evaluator.calculateGrade(0.75)).toBe('C');
            expect(evaluator.calculateGrade(0.65)).toBe('D');
            expect(evaluator.calculateGrade(0.55)).toBe('F');
        });
    });

    describe('PerformanceReportGenerator', () => {
        test('should generate console reports', () => {
            const mockResults = {
                metadata: {
                    timestamp: '2025-01-01T00:00:00Z',
                    duration: 1000
                },
                summary: {
                    overall: {
                        grade: 'B',
                        accuracy: 0.85,
                        successRate: 0.8,
                        responseTime: 15.5,
                        status: 'GOOD'
                    },
                    components: {
                        intentClassification: { accuracy: 0.9, grade: 'A' },
                        complexityAssessment: { accuracy: 0.8, grade: 'B' },
                        entityExtraction: { accuracy: 0.85, grade: 'B' }
                    }
                },
                detailed: {
                    queryAnalysis: {
                        results: [
                            {
                                query: 'Test query',
                                category: 'test',
                                status: 'PASS',
                                scores: { overallAccuracy: 0.9 },
                                duration: 5.0
                            }
                        ]
                    }
                },
                recommendations: [
                    {
                        type: 'ENHANCEMENT',
                        component: 'Test Component',
                        recommendation: 'Test recommendation',
                        priority: 'MEDIUM'
                    }
                ]
            };

            const report = reportGenerator.generateReport(mockResults, 'console');
            
            expect(report).toContain('Performance Evaluation');
            expect(report).toContain('Grade: B');
            expect(report).toContain('Accuracy: 85.0%');
            expect(report).toContain('Test recommendation');
        });

        test('should generate markdown reports', () => {
            const mockResults = {
                metadata: { timestamp: '2025-01-01T00:00:00Z', duration: 1000, version: { evaluator: '1.0.0' } },
                summary: {
                    overall: { grade: 'A', accuracy: 0.9, successRate: 0.95, responseTime: 10, status: 'EXCELLENT' },
                    components: {
                        intentClassification: { accuracy: 0.95, grade: 'A' },
                        complexityAssessment: { accuracy: 0.9, grade: 'A' },
                        entityExtraction: { accuracy: 0.88, grade: 'B' }
                    }
                },
                detailed: { queryAnalysis: { results: [] } },
                recommendations: []
            };

            const report = reportGenerator.generateReport(mockResults, 'markdown');
            
            expect(report).toContain('# 📊 LLM Performance Evaluation Report');
            expect(report).toContain('**Overall Grade**: A');
            expect(report).toContain('| Accuracy | 90.0% | A |');
        });

        test('should generate JSON reports', () => {
            const mockResults = { test: 'data' };
            const report = reportGenerator.generateReport(mockResults, 'json');
            
            expect(() => JSON.parse(report)).not.toThrow();
            expect(JSON.parse(report)).toEqual(mockResults);
        });
    });

    describe('Configuration', () => {
        test('should have valid test query configuration', () => {
            expect(BENCHMARK_CONFIG.testQueries).toBeInstanceOf(Array);
            expect(BENCHMARK_CONFIG.testQueries.length).toBeGreaterThan(0);
            
            BENCHMARK_CONFIG.testQueries.forEach(query => {
                expect(query).toHaveProperty('id');
                expect(query).toHaveProperty('query');
                expect(query).toHaveProperty('category');
                expect(query).toHaveProperty('expected');
                expect(query).toHaveProperty('weight');
                expect(query.expected).toHaveProperty('intent');
                expect(query.expected).toHaveProperty('complexity');
            });
        });

        test('should have valid thresholds', () => {
            expect(BENCHMARK_CONFIG.thresholds).toHaveProperty('accuracy');
            expect(BENCHMARK_CONFIG.thresholds).toHaveProperty('responseTime');
            expect(BENCHMARK_CONFIG.thresholds).toHaveProperty('successRate');
            
            expect(BENCHMARK_CONFIG.thresholds.accuracy.excellent).toBeGreaterThan(0.8);
            expect(BENCHMARK_CONFIG.thresholds.responseTime.excellent).toBeLessThan(50);
        });
    });
});