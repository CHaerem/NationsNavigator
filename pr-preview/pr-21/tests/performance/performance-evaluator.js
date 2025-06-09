// Core Performance Evaluation Engine
import { QueryAnalyzer } from '../../js/QueryAnalyzer.js';
import { BENCHMARK_CONFIG, BASELINE_EXPECTATIONS } from './benchmark-config.js';

export class PerformanceEvaluator {
    constructor() {
        this.results = [];
        this.config = BENCHMARK_CONFIG;
        this.baseline = BASELINE_EXPECTATIONS;
    }

    /**
     * Run complete performance evaluation
     * @param {Object} options - Evaluation options
     * @returns {Object} Complete evaluation results
     */
    async runEvaluation(options = {}) {
        const startTime = Date.now();
        
        console.log('🚀 Starting Performance Evaluation...\n');
        
        const results = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: this.getSystemVersion(),
                duration: 0,
                options
            },
            summary: {},
            detailed: {},
            recommendations: []
        };

        try {
            // Run query analysis evaluation
            results.detailed.queryAnalysis = await this.evaluateQueryAnalysis();
            
            // Calculate summary metrics
            results.summary = this.calculateSummaryMetrics(results.detailed);
            
            // Generate recommendations
            results.recommendations = this.generateRecommendations(results);
            
            results.metadata.duration = Date.now() - startTime;
            
            console.log(`\n✅ Evaluation completed in ${results.metadata.duration}ms`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Evaluation failed:', error);
            throw error;
        }
    }

    /**
     * Evaluate query analysis performance
     * @returns {Object} Query analysis results
     */
    async evaluateQueryAnalysis() {
        console.log('📊 Evaluating Query Analysis Performance...');
        
        const results = {
            totalQueries: this.config.testQueries.length,
            results: [],
            metrics: {}
        };

        for (const [index, testQuery] of this.config.testQueries.entries()) {
            console.log(`Testing ${index + 1}/${results.totalQueries}: "${testQuery.query}"`);
            
            const result = await this.evaluateQuery(testQuery);
            results.results.push(result);
        }

        // Calculate aggregate metrics
        results.metrics = this.calculateQueryAnalysisMetrics(results.results);
        
        return results;
    }

    /**
     * Evaluate a single query
     * @param {Object} testQuery - Test query configuration
     * @returns {Object} Evaluation result
     */
    async evaluateQuery(testQuery) {
        const startTime = performance.now();
        
        try {
            // Run query analysis
            const analysis = QueryAnalyzer.analyzeQuery(testQuery.query);
            const endTime = performance.now();
            
            // Calculate accuracy scores
            const intentAccuracy = analysis.intent === testQuery.expected.intent ? 1 : 0;
            const complexityAccuracy = analysis.complexity === testQuery.expected.complexity ? 1 : 0;
            const entityScore = this.calculateEntityScore(analysis.entities, testQuery.expected.entities);
            
            // Calculate weighted accuracy
            const criteria = this.config.evaluationCriteria;
            const overallAccuracy = 
                (intentAccuracy * criteria.intentAccuracy.weight) +
                (complexityAccuracy * criteria.complexityAccuracy.weight) +
                (entityScore * criteria.entityExtraction.weight) +
                (this.getResponseTimeScore(endTime - startTime) * criteria.responseTime.weight);

            const result = {
                id: testQuery.id,
                query: testQuery.query,
                category: testQuery.category,
                weight: testQuery.weight,
                duration: endTime - startTime,
                expected: testQuery.expected,
                actual: {
                    intent: analysis.intent,
                    complexity: analysis.complexity,
                    entities: analysis.entities,
                    confidence: analysis.confidence
                },
                scores: {
                    intentAccuracy,
                    complexityAccuracy,
                    entityScore,
                    overallAccuracy
                },
                status: overallAccuracy >= 0.8 ? 'PASS' : 'FAIL'
            };

            return result;
            
        } catch (error) {
            return {
                id: testQuery.id,
                query: testQuery.query,
                category: testQuery.category,
                error: error.message,
                status: 'ERROR'
            };
        }
    }

    /**
     * Calculate entity extraction score
     * @param {Object} actualEntities - Extracted entities
     * @param {Object} expectedEntities - Expected entities
     * @returns {number} Entity score (0-1)
     */
    calculateEntityScore(actualEntities, expectedEntities) {
        if (!expectedEntities || Object.keys(expectedEntities).length === 0) {
            return 1; // No entities expected, full score
        }

        let totalExpected = 0;
        let totalMatched = 0;

        for (const [entityType, expectedValues] of Object.entries(expectedEntities)) {
            if (expectedValues && expectedValues.length > 0) {
                totalExpected += expectedValues.length;
                
                const actualValues = actualEntities[entityType] || [];
                const matched = expectedValues.filter(expected =>
                    actualValues.some(actual => 
                        actual.toLowerCase().includes(expected.toLowerCase()) ||
                        expected.toLowerCase().includes(actual.toLowerCase())
                    )
                ).length;
                
                totalMatched += matched;
            }
        }

        return totalExpected > 0 ? totalMatched / totalExpected : 1;
    }

    /**
     * Calculate response time score
     * @param {number} responseTime - Response time in ms
     * @returns {number} Score (0-1)
     */
    getResponseTimeScore(responseTime) {
        const thresholds = this.config.thresholds.responseTime;
        
        if (responseTime <= thresholds.excellent) return 1;
        if (responseTime <= thresholds.good) return 0.8;
        if (responseTime <= thresholds.acceptable) return 0.6;
        return 0.3;
    }

    /**
     * Calculate query analysis aggregate metrics
     * @param {Array} results - Individual query results
     * @returns {Object} Aggregate metrics
     */
    calculateQueryAnalysisMetrics(results) {
        const validResults = results.filter(r => r.status !== 'ERROR');
        const passedResults = results.filter(r => r.status === 'PASS');
        
        if (validResults.length === 0) {
            return { error: 'No valid results to analyze' };
        }

        const metrics = {
            successRate: passedResults.length / results.length,
            averageAccuracy: validResults.reduce((sum, r) => sum + r.scores.overallAccuracy, 0) / validResults.length,
            averageResponseTime: validResults.reduce((sum, r) => sum + r.duration, 0) / validResults.length,
            intentAccuracy: validResults.reduce((sum, r) => sum + r.scores.intentAccuracy, 0) / validResults.length,
            complexityAccuracy: validResults.reduce((sum, r) => sum + r.scores.complexityAccuracy, 0) / validResults.length,
            entityAccuracy: validResults.reduce((sum, r) => sum + r.scores.entityScore, 0) / validResults.length,
            errorRate: (results.length - validResults.length) / results.length,
            byCategory: {}
        };

        // Calculate per-category metrics
        const categories = [...new Set(results.map(r => r.category))];
        for (const category of categories) {
            const categoryResults = results.filter(r => r.category === category && r.status !== 'ERROR');
            if (categoryResults.length > 0) {
                metrics.byCategory[category] = {
                    count: categoryResults.length,
                    successRate: categoryResults.filter(r => r.status === 'PASS').length / categoryResults.length,
                    averageAccuracy: categoryResults.reduce((sum, r) => sum + r.scores.overallAccuracy, 0) / categoryResults.length,
                    averageResponseTime: categoryResults.reduce((sum, r) => sum + r.duration, 0) / categoryResults.length
                };
            }
        }

        return metrics;
    }

    /**
     * Calculate summary metrics across all evaluations
     * @param {Object} detailed - Detailed results
     * @returns {Object} Summary metrics
     */
    calculateSummaryMetrics(detailed) {
        const queryMetrics = detailed.queryAnalysis.metrics;
        
        return {
            overall: {
                grade: this.calculateGrade(queryMetrics.averageAccuracy),
                accuracy: queryMetrics.averageAccuracy,
                successRate: queryMetrics.successRate,
                responseTime: queryMetrics.averageResponseTime,
                status: this.getOverallStatus(queryMetrics)
            },
            components: {
                intentClassification: {
                    accuracy: queryMetrics.intentAccuracy,
                    grade: this.calculateGrade(queryMetrics.intentAccuracy)
                },
                complexityAssessment: {
                    accuracy: queryMetrics.complexityAccuracy,
                    grade: this.calculateGrade(queryMetrics.complexityAccuracy)
                },
                entityExtraction: {
                    accuracy: queryMetrics.entityAccuracy,
                    grade: this.calculateGrade(queryMetrics.entityAccuracy)
                }
            }
        };
    }

    /**
     * Calculate letter grade from accuracy score
     * @param {number} accuracy - Accuracy score (0-1)
     * @returns {string} Letter grade
     */
    calculateGrade(accuracy) {
        if (accuracy >= 0.9) return 'A';
        if (accuracy >= 0.8) return 'B';
        if (accuracy >= 0.7) return 'C';
        if (accuracy >= 0.6) return 'D';
        return 'F';
    }

    /**
     * Get overall system status
     * @param {Object} metrics - Performance metrics
     * @returns {string} Status
     */
    getOverallStatus(metrics) {
        const thresholds = this.config.thresholds;
        
        if (metrics.averageAccuracy >= thresholds.accuracy.excellent && 
            metrics.averageResponseTime <= thresholds.responseTime.excellent &&
            metrics.successRate >= thresholds.successRate.excellent) {
            return 'EXCELLENT';
        }
        
        if (metrics.averageAccuracy >= thresholds.accuracy.good && 
            metrics.averageResponseTime <= thresholds.responseTime.good &&
            metrics.successRate >= thresholds.successRate.good) {
            return 'GOOD';
        }
        
        if (metrics.averageAccuracy >= thresholds.accuracy.acceptable) {
            return 'ACCEPTABLE';
        }
        
        return 'NEEDS_IMPROVEMENT';
    }

    /**
     * Generate improvement recommendations
     * @param {Object} results - Complete evaluation results
     * @returns {Array} Recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];
        const metrics = results.detailed.queryAnalysis.metrics;
        const thresholds = this.config.thresholds;

        // Intent accuracy recommendations
        if (metrics.intentAccuracy < thresholds.accuracy.good) {
            recommendations.push({
                type: 'CRITICAL',
                component: 'Intent Classification',
                issue: `Intent accuracy is ${(metrics.intentAccuracy * 100).toFixed(1)}% (target: ${thresholds.accuracy.good * 100}%)`,
                recommendation: 'Expand keyword patterns and improve intent classification logic',
                priority: 'HIGH'
            });
        }

        // Complexity accuracy recommendations
        if (metrics.complexityAccuracy < thresholds.accuracy.good) {
            recommendations.push({
                type: 'IMPORTANT',
                component: 'Complexity Assessment',
                issue: `Complexity accuracy is ${(metrics.complexityAccuracy * 100).toFixed(1)}% (target: ${thresholds.accuracy.good * 100}%)`,
                recommendation: 'Refine complexity scoring algorithm and multi-criteria detection',
                priority: 'MEDIUM'
            });
        }

        // Entity extraction recommendations
        if (metrics.entityAccuracy < thresholds.accuracy.good) {
            recommendations.push({
                type: 'ENHANCEMENT',
                component: 'Entity Extraction',
                issue: `Entity extraction accuracy is ${(metrics.entityAccuracy * 100).toFixed(1)}% (target: ${thresholds.accuracy.good * 100}%)`,
                recommendation: 'Improve entity recognition patterns and add more comprehensive dictionaries',
                priority: 'MEDIUM'
            });
        }

        // Response time recommendations
        if (metrics.averageResponseTime > thresholds.responseTime.good) {
            recommendations.push({
                type: 'OPTIMIZATION',
                component: 'Performance',
                issue: `Average response time is ${metrics.averageResponseTime.toFixed(1)}ms (target: <${thresholds.responseTime.good}ms)`,
                recommendation: 'Optimize query analysis algorithms and consider caching',
                priority: 'LOW'
            });
        }

        // Category-specific recommendations
        for (const [category, categoryMetrics] of Object.entries(metrics.byCategory)) {
            const expected = this.baseline.byCategory[category];
            if (expected && categoryMetrics.averageAccuracy < expected.accuracy) {
                recommendations.push({
                    type: 'CATEGORY_SPECIFIC',
                    component: `${category} queries`,
                    issue: `Category accuracy is ${(categoryMetrics.averageAccuracy * 100).toFixed(1)}% (target: ${expected.accuracy * 100}%)`,
                    recommendation: `Focus on improving ${category.replace('_', ' ')} query patterns`,
                    priority: 'MEDIUM'
                });
            }
        }

        return recommendations;
    }

    /**
     * Get system version info
     * @returns {Object} Version information
     */
    getSystemVersion() {
        return {
            evaluator: '1.0.0',
            queryAnalyzer: '1.0.0',
            timestamp: new Date().toISOString()
        };
    }
}