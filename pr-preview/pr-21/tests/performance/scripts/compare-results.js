#!/usr/bin/env node
// Performance Results Comparison Utility
import { readFileSync } from 'fs';
import { join } from 'path';

class ResultsComparator {
    /**
     * Compare two performance evaluation results
     * @param {string} baselineFile - Path to baseline results JSON
     * @param {string} currentFile - Path to current results JSON
     * @returns {Object} Comparison results
     */
    static compare(baselineFile, currentFile) {
        try {
            const baseline = JSON.parse(readFileSync(baselineFile, 'utf8'));
            const current = JSON.parse(readFileSync(currentFile, 'utf8'));
            
            const comparison = {
                metadata: {
                    baselineDate: baseline.metadata.timestamp,
                    currentDate: current.metadata.timestamp,
                    comparisonDate: new Date().toISOString()
                },
                overall: this.compareOverall(baseline.summary.overall, current.summary.overall),
                components: this.compareComponents(baseline.summary.components, current.summary.components),
                recommendations: this.compareRecommendations(baseline.recommendations, current.recommendations),
                improvement: {}
            };
            
            // Calculate overall improvement
            comparison.improvement = this.calculateImprovement(comparison);
            
            return comparison;
            
        } catch (error) {
            throw new Error(`Failed to compare results: ${error.message}`);
        }
    }

    /**
     * Compare overall metrics
     * @param {Object} baseline - Baseline overall metrics
     * @param {Object} current - Current overall metrics
     * @returns {Object} Overall comparison
     */
    static compareOverall(baseline, current) {
        return {
            accuracy: {
                baseline: baseline.accuracy,
                current: current.accuracy,
                change: current.accuracy - baseline.accuracy,
                percentChange: ((current.accuracy - baseline.accuracy) / baseline.accuracy) * 100
            },
            successRate: {
                baseline: baseline.successRate,
                current: current.successRate,
                change: current.successRate - baseline.successRate,
                percentChange: ((current.successRate - baseline.successRate) / baseline.successRate) * 100
            },
            responseTime: {
                baseline: baseline.responseTime,
                current: current.responseTime,
                change: current.responseTime - baseline.responseTime,
                percentChange: ((current.responseTime - baseline.responseTime) / baseline.responseTime) * 100
            },
            grade: {
                baseline: baseline.grade,
                current: current.grade,
                improved: this.isGradeImprovement(baseline.grade, current.grade)
            }
        };
    }

    /**
     * Compare component metrics
     * @param {Object} baseline - Baseline component metrics
     * @param {Object} current - Current component metrics
     * @returns {Object} Component comparison
     */
    static compareComponents(baseline, current) {
        const components = {};
        
        for (const [component, baselineMetrics] of Object.entries(baseline)) {
            const currentMetrics = current[component];
            components[component] = {
                accuracy: {
                    baseline: baselineMetrics.accuracy,
                    current: currentMetrics.accuracy,
                    change: currentMetrics.accuracy - baselineMetrics.accuracy,
                    percentChange: ((currentMetrics.accuracy - baselineMetrics.accuracy) / baselineMetrics.accuracy) * 100
                },
                grade: {
                    baseline: baselineMetrics.grade,
                    current: currentMetrics.grade,
                    improved: this.isGradeImprovement(baselineMetrics.grade, currentMetrics.grade)
                }
            };
        }
        
        return components;
    }

    /**
     * Compare recommendations
     * @param {Array} baseline - Baseline recommendations
     * @param {Array} current - Current recommendations
     * @returns {Object} Recommendations comparison
     */
    static compareRecommendations(baseline, current) {
        return {
            baseline: {
                count: baseline.length,
                critical: baseline.filter(r => r.type === 'CRITICAL').length,
                high: baseline.filter(r => r.priority === 'HIGH').length
            },
            current: {
                count: current.length,
                critical: current.filter(r => r.type === 'CRITICAL').length,
                high: current.filter(r => r.priority === 'HIGH').length
            },
            resolved: baseline.filter(baselineRec => 
                !current.some(currentRec => 
                    currentRec.component === baselineRec.component && 
                    currentRec.type === baselineRec.type
                )
            ),
            new: current.filter(currentRec => 
                !baseline.some(baselineRec => 
                    baselineRec.component === currentRec.component && 
                    baselineRec.type === currentRec.type
                )
            )
        };
    }

    /**
     * Calculate overall improvement assessment
     * @param {Object} comparison - Comparison results
     * @returns {Object} Improvement assessment
     */
    static calculateImprovement(comparison) {
        const { overall, components, recommendations } = comparison;
        
        let score = 0;
        let maxScore = 0;
        
        // Overall metrics (weight: 40%)
        if (overall.accuracy.change > 0) score += 2;
        else if (overall.accuracy.change < -0.05) score -= 2;
        maxScore += 2;
        
        if (overall.successRate.change > 0) score += 2;
        else if (overall.successRate.change < -0.05) score -= 2;
        maxScore += 2;
        
        if (overall.responseTime.change < 0) score += 1; // Lower is better
        else if (overall.responseTime.change > 10) score -= 1;
        maxScore += 1;
        
        // Component improvements (weight: 40%)
        for (const component of Object.values(components)) {
            if (component.accuracy.change > 0) score += 1;
            else if (component.accuracy.change < -0.05) score -= 1;
            maxScore += 1;
        }
        
        // Recommendations (weight: 20%)
        if (recommendations.current.critical < recommendations.baseline.critical) score += 1;
        if (recommendations.current.count < recommendations.baseline.count) score += 1;
        maxScore += 2;
        
        const improvementScore = maxScore > 0 ? (score / maxScore) : 0;
        
        let status;
        if (improvementScore >= 0.7) status = 'SIGNIFICANT_IMPROVEMENT';
        else if (improvementScore >= 0.3) status = 'MODERATE_IMPROVEMENT';
        else if (improvementScore >= -0.3) status = 'MINIMAL_CHANGE';
        else status = 'REGRESSION';
        
        return {
            score: improvementScore,
            status,
            highlights: this.getImprovementHighlights(comparison)
        };
    }

    /**
     * Get improvement highlights
     * @param {Object} comparison - Comparison results
     * @returns {Array} Improvement highlights
     */
    static getImprovementHighlights(comparison) {
        const highlights = [];
        
        // Accuracy improvements
        if (comparison.overall.accuracy.change > 0.1) {
            highlights.push(`🎯 Accuracy improved by ${(comparison.overall.accuracy.change * 100).toFixed(1)}%`);
        }
        
        // Success rate improvements
        if (comparison.overall.successRate.change > 0.1) {
            highlights.push(`✅ Success rate improved by ${(comparison.overall.successRate.change * 100).toFixed(1)}%`);
        }
        
        // Performance improvements
        if (comparison.overall.responseTime.change < -5) {
            highlights.push(`⚡ Response time improved by ${Math.abs(comparison.overall.responseTime.change).toFixed(1)}ms`);
        }
        
        // Grade improvements
        if (comparison.overall.grade.improved) {
            highlights.push(`📈 Overall grade improved from ${comparison.overall.grade.baseline} to ${comparison.overall.grade.current}`);
        }
        
        // Component improvements
        for (const [component, metrics] of Object.entries(comparison.components)) {
            if (metrics.grade.improved) {
                highlights.push(`🔧 ${component} grade improved from ${metrics.grade.baseline} to ${metrics.grade.current}`);
            }
        }
        
        // Resolved recommendations
        if (comparison.recommendations.resolved.length > 0) {
            highlights.push(`💡 Resolved ${comparison.recommendations.resolved.length} recommendation(s)`);
        }
        
        return highlights;
    }

    /**
     * Check if grade improved
     * @param {string} baseline - Baseline grade
     * @param {string} current - Current grade
     * @returns {boolean} True if improved
     */
    static isGradeImprovement(baseline, current) {
        const gradeOrder = { 'F': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4 };
        return gradeOrder[current] > gradeOrder[baseline];
    }

    /**
     * Generate comparison report
     * @param {Object} comparison - Comparison results
     * @returns {string} Formatted report
     */
    static generateReport(comparison) {
        let report = '';
        
        // Header
        report += '📊 Performance Comparison Report\n';
        report += '='.repeat(50) + '\n';
        report += `Baseline: ${comparison.metadata.baselineDate}\n`;
        report += `Current:  ${comparison.metadata.currentDate}\n`;
        report += `Status:   ${comparison.improvement.status}\n\n`;
        
        // Overall changes
        report += '📈 Overall Changes\n';
        report += '-'.repeat(25) + '\n';
        report += `Accuracy:     ${(comparison.overall.accuracy.baseline * 100).toFixed(1)}% → ${(comparison.overall.accuracy.current * 100).toFixed(1)}% `;
        report += `(${comparison.overall.accuracy.change >= 0 ? '+' : ''}${(comparison.overall.accuracy.change * 100).toFixed(1)}%)\n`;
        
        report += `Success Rate: ${(comparison.overall.successRate.baseline * 100).toFixed(1)}% → ${(comparison.overall.successRate.current * 100).toFixed(1)}% `;
        report += `(${comparison.overall.successRate.change >= 0 ? '+' : ''}${(comparison.overall.successRate.change * 100).toFixed(1)}%)\n`;
        
        report += `Response Time: ${comparison.overall.responseTime.baseline.toFixed(1)}ms → ${comparison.overall.responseTime.current.toFixed(1)}ms `;
        report += `(${comparison.overall.responseTime.change >= 0 ? '+' : ''}${comparison.overall.responseTime.change.toFixed(1)}ms)\n`;
        
        report += `Grade:        ${comparison.overall.grade.baseline} → ${comparison.overall.grade.current} `;
        report += `${comparison.overall.grade.improved ? '📈' : '📊'}\n\n`;
        
        // Component changes
        report += '🔧 Component Changes\n';
        report += '-'.repeat(25) + '\n';
        for (const [component, metrics] of Object.entries(comparison.components)) {
            const componentName = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            report += `${componentName}: ${metrics.grade.baseline} → ${metrics.grade.current} `;
            report += `(${(metrics.accuracy.baseline * 100).toFixed(1)}% → ${(metrics.accuracy.current * 100).toFixed(1)}%)\n`;
        }
        
        // Highlights
        if (comparison.improvement.highlights.length > 0) {
            report += '\n🌟 Highlights\n';
            report += '-'.repeat(25) + '\n';
            comparison.improvement.highlights.forEach(highlight => {
                report += `${highlight}\n`;
            });
        }
        
        // Recommendations
        report += '\n💡 Recommendations Status\n';
        report += '-'.repeat(25) + '\n';
        report += `Total: ${comparison.recommendations.baseline.count} → ${comparison.recommendations.current.count}\n`;
        report += `Critical: ${comparison.recommendations.baseline.critical} → ${comparison.recommendations.current.critical}\n`;
        report += `Resolved: ${comparison.recommendations.resolved.length}\n`;
        report += `New: ${comparison.recommendations.new.length}\n`;
        
        return report;
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node compare-results.js <baseline-file> <current-file>');
        process.exit(1);
    }
    
    try {
        const comparison = ResultsComparator.compare(args[0], args[1]);
        const report = ResultsComparator.generateReport(comparison);
        console.log(report);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

export { ResultsComparator };