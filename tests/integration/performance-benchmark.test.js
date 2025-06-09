import { jest } from '@jest/globals';

// Mock external dependencies
jest.unstable_mockModule('../js/llm.js', () => ({
    generateSQLQuery: jest.fn(),
    generateEnhancedSQLQuery: jest.fn(),
    processQueryWithTools: jest.fn()
}));

jest.unstable_mockModule('../js/data.js', () => ({
    executeQuery: jest.fn(),
    getAvailableStats: jest.fn(() => ['name', 'ISO_A3', 'region', 'population']),
    getExampleCountry: jest.fn(() => ({ name: 'France', ISO_A3: 'FRA', region: 'Europe' }))
}));

jest.unstable_mockModule('../js/debug.js', () => ({
    debugLog: jest.fn()
}));

const { PerformanceBenchmark } = await import('../js/PerformanceBenchmark.js');
const { generateSQLQuery, generateEnhancedSQLQuery } = await import('../js/llm.js');
const { executeQuery } = await import('../js/data.js');

describe('Performance Benchmark', () => {
    let benchmark;

    beforeEach(() => {
        benchmark = new PerformanceBenchmark();
        jest.clearAllMocks();
    });

    describe('Query Analysis', () => {
        test('should have predefined test queries', () => {
            expect(benchmark.testQueries).toBeDefined();
            expect(benchmark.testQueries.length).toBeGreaterThan(0);
            
            // Check that test queries have required properties
            benchmark.testQueries.forEach(query => {
                expect(query).toHaveProperty('query');
                expect(query).toHaveProperty('category');
                expect(query).toHaveProperty('expectedComplexity');
                expect(query).toHaveProperty('expectedIntent');
            });
        });

        test('should analyze query performance', async () => {
            const result = await benchmark.benchmarkQueryAnalysis();
            
            expect(result).toHaveProperty('totalQueries');
            expect(result).toHaveProperty('averageDuration');
            expect(result).toHaveProperty('accuracyRate');
            expect(result).toHaveProperty('results');
            expect(result.results).toBeInstanceOf(Array);
            expect(result.totalQueries).toBe(benchmark.testQueries.length);
        });
    });

    describe('SQL Generation Benchmark', () => {
        test('should benchmark SQL generation', async () => {
            // Mock successful SQL generation
            generateSQLQuery.mockResolvedValue('SELECT name, ISO_A3 FROM countries WHERE region = \'Europe\' ORDER BY name');
            executeQuery.mockReturnValue([
                { name: 'France', ISO_A3: 'FRA' },
                { name: 'Germany', ISO_A3: 'DEU' }
            ]);

            const result = await benchmark.benchmarkSQLGeneration();
            
            expect(result).toHaveProperty('totalQueries');
            expect(result).toHaveProperty('successRate');
            expect(result).toHaveProperty('averageSQLTime');
            expect(result).toHaveProperty('averageTotalTime');
            expect(result).toHaveProperty('results');
            
            expect(result.successRate).toBeGreaterThan(0);
            expect(result.results).toBeInstanceOf(Array);
        });

        test('should handle SQL generation failures', async () => {
            // Mock failed SQL generation
            generateSQLQuery.mockRejectedValue(new Error('LLM not available'));

            const result = await benchmark.benchmarkSQLGeneration();
            
            expect(result.successRate).toBe(0);
            expect(result.results.every(r => !r.success)).toBe(true);
        });
    });

    describe('Enhanced Generation Benchmark', () => {
        test('should benchmark enhanced SQL generation', async () => {
            // Mock successful enhanced generation
            generateEnhancedSQLQuery.mockResolvedValue({
                sql: 'SELECT name, ISO_A3 FROM countries WHERE region = \'Europe\' ORDER BY name',
                analysis: { intent: 'geographic', complexity: 'low' },
                llmResponse: { explanation: 'Test explanation', confidence: 0.95 }
            });
            executeQuery.mockReturnValue([
                { name: 'France', ISO_A3: 'FRA' },
                { name: 'Germany', ISO_A3: 'DEU' }
            ]);

            const result = await benchmark.benchmarkEnhancedGeneration();
            
            expect(result).toHaveProperty('totalQueries');
            expect(result).toHaveProperty('successRate');
            expect(result).toHaveProperty('averageEnhancedTime');
            expect(result).toHaveProperty('structuredOutputRate');
            expect(result).toHaveProperty('averageConfidence');
            
            expect(result.successRate).toBeGreaterThan(0);
            expect(result.structuredOutputRate).toBeGreaterThan(0);
        });
    });

    describe('Full Benchmark', () => {
        test('should run complete benchmark suite', async () => {
            // Mock all dependencies
            generateSQLQuery.mockResolvedValue('SELECT name, ISO_A3 FROM countries ORDER BY name');
            generateEnhancedSQLQuery.mockResolvedValue({
                sql: 'SELECT name, ISO_A3 FROM countries ORDER BY name',
                analysis: { intent: 'general', complexity: 'low' },
                llmResponse: { explanation: 'Test', confidence: 0.8 }
            });
            executeQuery.mockReturnValue([{ name: 'Test', ISO_A3: 'TST' }]);

            const result = await benchmark.runFullBenchmark();
            
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('results');
            expect(result).toHaveProperty('summary');
            
            expect(result.results).toHaveProperty('queryAnalysis');
            expect(result.results).toHaveProperty('sqlGeneration');
            expect(result.results).toHaveProperty('enhancedGeneration');
            expect(result.results).toHaveProperty('toolUsage');
            expect(result.results).toHaveProperty('endToEnd');
            
            expect(result.summary).toHaveProperty('queryAnalysis');
            expect(result.summary).toHaveProperty('sqlGeneration');
            expect(result.summary).toHaveProperty('enhancedGeneration');
            expect(result.summary).toHaveProperty('overallImprovement');
        });
    });

    describe('Report Generation', () => {
        test('should generate performance report', async () => {
            // Create mock benchmark result
            const mockResult = {
                timestamp: new Date().toISOString(),
                results: {
                    queryAnalysis: { totalQueries: 5, averageDuration: 10, accuracyRate: 0.8, results: [] },
                    sqlGeneration: { totalQueries: 3, successRate: 0.9, averageTotalTime: 150 },
                    enhancedGeneration: { successRate: 0.95, averageEnhancedTime: 120, structuredOutputRate: 0.9, averageConfidence: 0.85 },
                    toolUsage: { functionCallingRecommendationRate: 0.4 },
                    endToEnd: { standardSuccessRate: 0.9, enhancedSuccessRate: 0.95 }
                },
                summary: {
                    queryAnalysis: { status: 'good', accuracyRate: 0.8, averageDuration: 10 },
                    sqlGeneration: { status: 'excellent', successRate: 0.9, averageTime: 150 },
                    enhancedGeneration: { status: 'excellent', successRate: 0.95, structuredOutputRate: 0.9, averageConfidence: 0.85 },
                    overallImprovement: { status: 'improved', enhancedVsStandard: 0.05, recommendsTools: 0.4 }
                }
            };

            const report = benchmark.generatePerformanceReport(mockResult);
            
            expect(report).toContain('LLM Performance Benchmark Report');
            expect(report).toContain('Query Analysis');
            expect(report).toContain('SQL Generation');
            expect(report).toContain('Enhanced Generation');
            expect(report).toContain('80.0% accuracy');
            expect(report).toContain('90.0% success');
        });
    });

    describe('Export Functionality', () => {
        test('should export results in correct format', () => {
            // Add some mock results
            benchmark.results = [{
                timestamp: '2024-01-01T00:00:00.000Z',
                summary: { test: 'data' }
            }];

            const exported = benchmark.exportResults();
            
            expect(exported).toHaveProperty('timestamp');
            expect(exported).toHaveProperty('results');
            expect(exported).toHaveProperty('testQueries');
            expect(exported.results).toHaveLength(1);
            expect(exported.testQueries).toBe(benchmark.testQueries);
        });
    });
});