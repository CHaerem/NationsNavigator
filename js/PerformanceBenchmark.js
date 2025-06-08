// Performance Benchmarking System for LLM Capabilities
import { debugLog } from "./debug.js";
import { generateSQLQuery, generateEnhancedSQLQuery, processQueryWithTools } from "./llm.js";
import { executeQuery } from "./data.js";
import { QueryAnalyzer } from "./QueryAnalyzer.js";
import { PerformanceEvaluator } from "../tests/performance/performance-evaluator.js";
import { PerformanceReportGenerator } from "../tests/performance/report-generator.js";

export class PerformanceBenchmark {
    constructor() {
        this.results = [];
        this.testQueries = this.getTestQueries();
    }

    getTestQueries() {
        return [
            // Simple geographic queries
            {
                query: "Countries in Europe",
                category: "simple_geographic",
                expectedComplexity: "low",
                expectedIntent: "geographic"
            },
            {
                query: "Countries in Asia",
                category: "simple_geographic", 
                expectedComplexity: "low",
                expectedIntent: "geographic"
            },
            // Population queries
            {
                query: "Most populated countries",
                category: "simple_population",
                expectedComplexity: "low",
                expectedIntent: "population"
            },
            {
                query: "Countries with population over 100 million",
                category: "complex_population",
                expectedComplexity: "medium",
                expectedIntent: "population"
            },
            // Flag queries
            {
                query: "Countries with red flags",
                category: "simple_flag",
                expectedComplexity: "low",
                expectedIntent: "flag"
            },
            {
                query: "European countries with crosses in their flags",
                category: "complex_flag",
                expectedComplexity: "medium",
                expectedIntent: "complex"
            },
            // Language queries
            {
                query: "Spanish speaking countries",
                category: "simple_language",
                expectedComplexity: "low",
                expectedIntent: "language"
            },
            {
                query: "Countries that speak French or German",
                category: "complex_language",
                expectedComplexity: "medium",
                expectedIntent: "language"
            },
            // Complex comparative queries
            {
                query: "Compare France, Germany, and Italy by population and area",
                category: "comparison",
                expectedComplexity: "high",
                expectedIntent: "complex"
            },
            {
                query: "What are the largest countries in Africa by area?",
                category: "complex_geographic",
                expectedComplexity: "medium",
                expectedIntent: "size"
            },
            // Multi-criteria queries
            {
                query: "Island nations in the Pacific with population under 1 million",
                category: "multi_criteria",
                expectedComplexity: "high",
                expectedIntent: "complex"
            }
        ];
    }

    async runFullBenchmark() {
        debugLog("Starting comprehensive performance benchmark...");
        
        const benchmark = {
            timestamp: new Date().toISOString(),
            results: {
                queryAnalysis: await this.benchmarkQueryAnalysis(),
                sqlGeneration: await this.benchmarkSQLGeneration(),
                enhancedGeneration: await this.benchmarkEnhancedGeneration(),
                toolUsage: await this.benchmarkToolUsage(),
                endToEnd: await this.benchmarkEndToEnd()
            },
            summary: {}
        };

        // Calculate summary statistics
        benchmark.summary = this.calculateSummary(benchmark.results);
        
        // Store results for later analysis
        this.results.push(benchmark);
        
        debugLog("Benchmark completed:", benchmark);
        return benchmark;
    }

    async benchmarkQueryAnalysis() {
        debugLog("Benchmarking query analysis...");
        const results = [];

        for (const testQuery of this.testQueries) {
            const start = performance.now();
            const analysis = QueryAnalyzer.analyzeQuery(testQuery.query);
            const end = performance.now();

            const result = {
                query: testQuery.query,
                category: testQuery.category,
                duration: end - start,
                analysis: analysis,
                accuracy: {
                    complexityMatch: analysis.complexity === testQuery.expectedComplexity,
                    intentMatch: analysis.intent === testQuery.expectedIntent,
                    entitiesFound: Object.values(analysis.entities).flat().length
                }
            };

            results.push(result);
        }

        return {
            totalQueries: results.length,
            averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
            accuracyRate: results.reduce((sum, r) => 
                sum + (r.accuracy.complexityMatch && r.accuracy.intentMatch ? 1 : 0), 0
            ) / results.length,
            results: results
        };
    }

    async benchmarkSQLGeneration() {
        debugLog("Benchmarking standard SQL generation...");
        const results = [];

        // Test with simpler queries that should work well with standard approach
        const simpleQueries = this.testQueries.filter(q => q.expectedComplexity === 'low');

        for (const testQuery of simpleQueries) {
            try {
                const start = performance.now();
                const sql = await generateSQLQuery(testQuery.query);
                const sqlEnd = performance.now();
                
                // Test SQL execution
                const queryResult = executeQuery(sql);
                const end = performance.now();

                const result = {
                    query: testQuery.query,
                    category: testQuery.category,
                    sqlGenerationTime: sqlEnd - start,
                    totalTime: end - start,
                    sql: sql,
                    resultCount: queryResult.length,
                    success: true,
                    sqlValid: sql.toLowerCase().includes('select'),
                    hasResults: queryResult.length > 0
                };

                results.push(result);
            } catch (error) {
                results.push({
                    query: testQuery.query,
                    category: testQuery.category,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            totalQueries: results.length,
            successRate: results.filter(r => r.success).length / results.length,
            averageSQLTime: results.filter(r => r.success).reduce((sum, r) => sum + r.sqlGenerationTime, 0) / results.filter(r => r.success).length,
            averageTotalTime: results.filter(r => r.success).reduce((sum, r) => sum + r.totalTime, 0) / results.filter(r => r.success).length,
            results: results
        };
    }

    async benchmarkEnhancedGeneration() {
        debugLog("Benchmarking enhanced SQL generation with JSON mode...");
        const results = [];

        for (const testQuery of this.testQueries) {
            try {
                const start = performance.now();
                const enhanced = await generateEnhancedSQLQuery(testQuery.query);
                const sqlEnd = performance.now();
                
                // Test SQL execution
                const queryResult = executeQuery(enhanced.sql);
                const end = performance.now();

                const result = {
                    query: testQuery.query,
                    category: testQuery.category,
                    enhancedGenerationTime: sqlEnd - start,
                    totalTime: end - start,
                    sql: enhanced.sql,
                    analysis: enhanced.analysis,
                    llmResponse: enhanced.llmResponse,
                    resultCount: queryResult.length,
                    success: true,
                    hasStructuredOutput: !!enhanced.llmResponse.explanation,
                    confidenceScore: enhanced.llmResponse.confidence || 0
                };

                results.push(result);
            } catch (error) {
                results.push({
                    query: testQuery.query,
                    category: testQuery.category,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            totalQueries: results.length,
            successRate: results.filter(r => r.success).length / results.length,
            averageEnhancedTime: results.filter(r => r.success).reduce((sum, r) => sum + r.enhancedGenerationTime, 0) / results.filter(r => r.success).length,
            averageConfidence: results.filter(r => r.success && r.confidenceScore).reduce((sum, r) => sum + r.confidenceScore, 0) / results.filter(r => r.success && r.confidenceScore).length,
            structuredOutputRate: results.filter(r => r.hasStructuredOutput).length / results.length,
            results: results
        };
    }

    async benchmarkToolUsage() {
        debugLog("Benchmarking function calling with tools...");
        const results = [];

        // Focus on complex queries that should benefit from tools
        const complexQueries = this.testQueries.filter(q => 
            q.expectedComplexity === 'medium' || q.expectedComplexity === 'high'
        );

        for (const testQuery of complexQueries) {
            try {
                const start = performance.now();
                
                // Simulate tool usage by calling processQueryWithTools logic manually
                // (avoiding DOM dependencies in benchmark)
                const analysis = QueryAnalyzer.analyzeQuery(testQuery.query);
                const end = performance.now();

                const result = {
                    query: testQuery.query,
                    category: testQuery.category,
                    analysisTime: end - start,
                    analysis: analysis,
                    shouldUseFunctionCalling: analysis.complexity === 'medium' || 
                        analysis.complexity === 'high' || 
                        analysis.intent === 'complex',
                    success: true
                };

                results.push(result);
            } catch (error) {
                results.push({
                    query: testQuery.query,
                    category: testQuery.category,
                    error: error.message,
                    success: false
                });
            }
        }

        return {
            totalQueries: results.length,
            successRate: results.filter(r => r.success).length / results.length,
            functionCallingRecommendationRate: results.filter(r => r.shouldUseFunctionCalling).length / results.length,
            averageAnalysisTime: results.filter(r => r.success).reduce((sum, r) => sum + r.analysisTime, 0) / results.filter(r => r.success).length,
            results: results
        };
    }

    async benchmarkEndToEnd() {
        debugLog("Benchmarking end-to-end performance comparison...");
        const results = [];

        // Test a subset of queries with both approaches
        const testSet = this.testQueries.slice(0, 5);

        for (const testQuery of testSet) {
            const comparison = {
                query: testQuery.query,
                category: testQuery.category,
                standard: null,
                enhanced: null
            };

            // Test standard approach
            try {
                const start = performance.now();
                const sql = await generateSQLQuery(testQuery.query);
                const queryResult = executeQuery(sql);
                const end = performance.now();

                comparison.standard = {
                    duration: end - start,
                    sql: sql,
                    resultCount: queryResult.length,
                    success: true
                };
            } catch (error) {
                comparison.standard = {
                    error: error.message,
                    success: false
                };
            }

            // Test enhanced approach
            try {
                const start = performance.now();
                const enhanced = await generateEnhancedSQLQuery(testQuery.query);
                const queryResult = executeQuery(enhanced.sql);
                const end = performance.now();

                comparison.enhanced = {
                    duration: end - start,
                    sql: enhanced.sql,
                    resultCount: queryResult.length,
                    analysis: enhanced.analysis,
                    llmResponse: enhanced.llmResponse,
                    success: true
                };
            } catch (error) {
                comparison.enhanced = {
                    error: error.message,
                    success: false
                };
            }

            results.push(comparison);
        }

        return {
            totalComparisons: results.length,
            standardSuccessRate: results.filter(r => r.standard?.success).length / results.length,
            enhancedSuccessRate: results.filter(r => r.enhanced?.success).length / results.length,
            results: results
        };
    }

    calculateSummary(results) {
        return {
            queryAnalysis: {
                averageDuration: results.queryAnalysis.averageDuration,
                accuracyRate: results.queryAnalysis.accuracyRate,
                status: results.queryAnalysis.accuracyRate > 0.8 ? 'excellent' : 
                        results.queryAnalysis.accuracyRate > 0.6 ? 'good' : 'needs_improvement'
            },
            sqlGeneration: {
                successRate: results.sqlGeneration.successRate,
                averageTime: results.sqlGeneration.averageTotalTime,
                status: results.sqlGeneration.successRate > 0.9 ? 'excellent' : 
                        results.sqlGeneration.successRate > 0.7 ? 'good' : 'needs_improvement'
            },
            enhancedGeneration: {
                successRate: results.enhancedGeneration.successRate,
                averageTime: results.enhancedGeneration.averageEnhancedTime,
                averageConfidence: results.enhancedGeneration.averageConfidence,
                structuredOutputRate: results.enhancedGeneration.structuredOutputRate,
                status: results.enhancedGeneration.successRate > 0.8 && 
                        results.enhancedGeneration.structuredOutputRate > 0.8 ? 'excellent' : 'good'
            },
            overallImprovement: {
                enhancedVsStandard: results.endToEnd.enhancedSuccessRate - results.endToEnd.standardSuccessRate,
                recommendsTools: results.toolUsage.functionCallingRecommendationRate,
                status: results.endToEnd.enhancedSuccessRate >= results.endToEnd.standardSuccessRate ? 
                        'improved' : 'regression'
            }
        };
    }

    generatePerformanceReport(benchmark) {
        const report = `
# LLM Performance Benchmark Report
Generated: ${benchmark.timestamp}

## Summary
- **Query Analysis**: ${benchmark.summary.queryAnalysis.status} (${(benchmark.summary.queryAnalysis.accuracyRate * 100).toFixed(1)}% accuracy)
- **Standard SQL Generation**: ${benchmark.summary.sqlGeneration.status} (${(benchmark.summary.sqlGeneration.successRate * 100).toFixed(1)}% success)  
- **Enhanced Generation**: ${benchmark.summary.enhancedGeneration.status} (${(benchmark.summary.enhancedGeneration.successRate * 100).toFixed(1)}% success)
- **Overall Improvement**: ${benchmark.summary.overallImprovement.status}

## Detailed Metrics

### Query Analysis Performance
- Average analysis time: ${benchmark.results.queryAnalysis.averageDuration.toFixed(2)}ms
- Intent classification accuracy: ${(benchmark.summary.queryAnalysis.accuracyRate * 100).toFixed(1)}%
- Entities extracted per query: ${(benchmark.results.queryAnalysis.results.reduce((sum, r) => sum + r.accuracy.entitiesFound, 0) / benchmark.results.queryAnalysis.results.length).toFixed(1)}

### SQL Generation Comparison
- Standard approach: ${(benchmark.summary.sqlGeneration.successRate * 100).toFixed(1)}% success, ${benchmark.summary.sqlGeneration.averageTime.toFixed(0)}ms avg
- Enhanced approach: ${(benchmark.summary.enhancedGeneration.successRate * 100).toFixed(1)}% success, ${(benchmark.summary.enhancedGeneration.averageTime || 0).toFixed(0)}ms avg
- Structured output rate: ${(benchmark.summary.enhancedGeneration.structuredOutputRate * 100).toFixed(1)}%
- Average confidence score: ${(benchmark.summary.enhancedGeneration.averageConfidence || 0).toFixed(2)}

### Function Calling Recommendations
- Queries recommended for advanced processing: ${(benchmark.summary.overallImprovement.recommendsTools * 100).toFixed(1)}%
- Success rate improvement: ${(benchmark.summary.overallImprovement.enhancedVsStandard * 100).toFixed(1)}%

## Test Queries Performance

${benchmark.results.queryAnalysis.results.map(r => `
### "${r.query}"
- Category: ${r.category}
- Analysis time: ${r.duration.toFixed(2)}ms
- Intent: ${r.analysis.intent} (expected: ${this.testQueries.find(q => q.query === r.query)?.expectedIntent})
- Complexity: ${r.analysis.complexity} (expected: ${this.testQueries.find(q => q.query === r.query)?.expectedComplexity})
- Entities found: ${Object.values(r.analysis.entities).flat().length}
`).join('')}

## Recommendations

${benchmark.summary.queryAnalysis.status !== 'excellent' ? '- Improve query analysis accuracy by expanding entity recognition\n' : ''}
${benchmark.summary.sqlGeneration.status !== 'excellent' ? '- Optimize SQL generation for better reliability\n' : ''}
${benchmark.summary.overallImprovement.status === 'regression' ? '- Enhanced approach showing regression - investigate prompting strategy\n' : ''}
${benchmark.summary.overallImprovement.status === 'improved' ? '✅ Enhanced approach is performing better than standard approach\n' : ''}
`;

        return report;
    }

    exportResults() {
        return {
            timestamp: new Date().toISOString(),
            results: this.results,
            testQueries: this.testQueries
        };
    }
}

// Utility function to run quick performance test using new system
export async function runQuickPerformanceTest() {
    debugLog("Running quick performance test with new evaluation system");
    
    try {
        const evaluator = new PerformanceEvaluator();
        const reportGenerator = new PerformanceReportGenerator();
        
        // Run evaluation
        const results = await evaluator.runEvaluation();
        
        // Generate console report
        const report = reportGenerator.generateReport(results, 'console');
        console.log(report);
        
        debugLog("Quick performance test completed", results.summary);
        
        return {
            success: true,
            grade: results.summary.overall.grade,
            accuracy: results.summary.overall.accuracy,
            report: report
        };
        
    } catch (error) {
        console.error("Performance test failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Legacy function for backward compatibility
export async function runLegacyPerformanceTest() {
    const benchmark = new PerformanceBenchmark();
    const result = await benchmark.runFullBenchmark();
    const report = benchmark.generatePerformanceReport(result);
    
    console.log(report);
    debugLog("Legacy performance test completed", result);
    
    return { result, report };
}