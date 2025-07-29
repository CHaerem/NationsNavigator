// Performance Report Generation Utilities
export class PerformanceReportGenerator {
    constructor() {
        this.templates = {
            console: this.generateConsoleReport.bind(this),
            markdown: this.generateMarkdownReport.bind(this),
            json: this.generateJSONReport.bind(this),
            html: this.generateHTMLReport.bind(this)
        };
    }

    /**
     * Generate performance report in specified format
     * @param {Object} results - Evaluation results
     * @param {string} format - Report format (console, markdown, json, html)
     * @returns {string} Generated report
     */
    generateReport(results, format = 'console') {
        const generator = this.templates[format];
        if (!generator) {
            throw new Error(`Unknown report format: ${format}`);
        }
        return generator(results);
    }

    /**
     * Generate console report for immediate feedback
     * @param {Object} results - Evaluation results
     * @returns {string} Console report
     */
    generateConsoleReport(results) {
        const { summary, detailed, recommendations } = results;
        const metrics = detailed.queryAnalysis.metrics;
        
        let report = '';
        
        // Header
        report += '🚀 NationsNavigator LLM Performance Evaluation\n';
        report += '='.repeat(60) + '\n';
        report += `Timestamp: ${results.metadata.timestamp}\n`;
        report += `Duration: ${results.metadata.duration}ms\n\n`;
        
        // Overall Summary
        report += '📊 Overall Performance\n';
        report += '-'.repeat(30) + '\n';
        report += `Grade: ${summary.overall.grade} (${summary.overall.status})\n`;
        report += `Accuracy: ${(summary.overall.accuracy * 100).toFixed(1)}%\n`;
        report += `Success Rate: ${(summary.overall.successRate * 100).toFixed(1)}%\n`;
        report += `Avg Response Time: ${summary.overall.responseTime.toFixed(1)}ms\n\n`;
        
        // Component Breakdown
        report += '🔍 Component Performance\n';
        report += '-'.repeat(30) + '\n';
        report += `Intent Classification: ${summary.components.intentClassification.grade} (${(summary.components.intentClassification.accuracy * 100).toFixed(1)}%)\n`;
        report += `Complexity Assessment: ${summary.components.complexityAssessment.grade} (${(summary.components.complexityAssessment.accuracy * 100).toFixed(1)}%)\n`;
        report += `Entity Extraction: ${summary.components.entityExtraction.grade} (${(summary.components.entityExtraction.accuracy * 100).toFixed(1)}%)\n\n`;
        
        // Query Results Table
        report += '📋 Query Results\n';
        report += '-'.repeat(30) + '\n';
        report += 'Query'.padEnd(40) + 'Status'.padEnd(8) + 'Accuracy'.padEnd(10) + 'Time(ms)\n';
        report += '='.repeat(70) + '\n';
        
        for (const result of detailed.queryAnalysis.results) {
            if (result.status !== 'ERROR') {
                const queryTrunc = result.query.length > 37 ? result.query.substring(0, 37) + '...' : result.query;
                const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
                const accuracy = `${(result.scores.overallAccuracy * 100).toFixed(1)}%`;
                const time = result.duration.toFixed(1);
                
                report += queryTrunc.padEnd(40) + status.padEnd(8) + accuracy.padEnd(10) + time + '\n';
            } else {
                const queryTrunc = result.query.length > 37 ? result.query.substring(0, 37) + '...' : result.query;
                report += queryTrunc.padEnd(40) + '💥 ERROR'.padEnd(8) + 'N/A'.padEnd(10) + 'N/A\n';
            }
        }
        
        // Category Performance
        if (Object.keys(metrics.byCategory).length > 0) {
            report += '\n📈 Performance by Category\n';
            report += '-'.repeat(30) + '\n';
            
            for (const [category, categoryMetrics] of Object.entries(metrics.byCategory)) {
                const categoryName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                report += `${categoryName}: ${(categoryMetrics.averageAccuracy * 100).toFixed(1)}% (${categoryMetrics.count} queries)\n`;
            }
        }
        
        // Recommendations
        if (recommendations.length > 0) {
            report += '\n💡 Recommendations\n';
            report += '-'.repeat(30) + '\n';
            
            recommendations.forEach((rec, index) => {
                const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
                report += `${index + 1}. ${priority} ${rec.component}: ${rec.recommendation}\n`;
            });
        }
        
        report += '\n' + '='.repeat(60) + '\n';
        return report;
    }

    /**
     * Generate markdown report for documentation
     * @param {Object} results - Evaluation results
     * @returns {string} Markdown report
     */
    generateMarkdownReport(results) {
        const { summary, detailed, recommendations } = results;
        
        let report = '';
        
        // Header
        report += '# 📊 LLM Performance Evaluation Report\n\n';
        report += `**Generated**: ${results.metadata.timestamp}\n`;
        report += `**Duration**: ${results.metadata.duration}ms\n`;
        report += `**Version**: ${results.metadata.version.evaluator}\n\n`;
        
        // Summary
        report += '## 🎯 Executive Summary\n\n';
        report += `**Overall Grade**: ${summary.overall.grade} (${summary.overall.status})\n\n`;
        report += '| Metric | Value | Grade |\n';
        report += '|--------|-------|-------|\n';
        report += `| Accuracy | ${(summary.overall.accuracy * 100).toFixed(1)}% | ${summary.overall.grade} |\n`;
        report += `| Success Rate | ${(summary.overall.successRate * 100).toFixed(1)}% | - |\n`;
        report += `| Response Time | ${summary.overall.responseTime.toFixed(1)}ms | - |\n\n`;
        
        // Component Performance
        report += '## 🔍 Component Performance\n\n';
        report += '| Component | Accuracy | Grade |\n';
        report += '|-----------|----------|-------|\n';
        report += `| Intent Classification | ${(summary.components.intentClassification.accuracy * 100).toFixed(1)}% | ${summary.components.intentClassification.grade} |\n`;
        report += `| Complexity Assessment | ${(summary.components.complexityAssessment.accuracy * 100).toFixed(1)}% | ${summary.components.complexityAssessment.grade} |\n`;
        report += `| Entity Extraction | ${(summary.components.entityExtraction.accuracy * 100).toFixed(1)}% | ${summary.components.entityExtraction.grade} |\n\n`;
        
        // Detailed Results
        report += '## 📋 Detailed Results\n\n';
        report += '| Query | Category | Status | Accuracy | Time (ms) |\n';
        report += '|-------|----------|--------|----------|----------|\n';
        
        for (const result of detailed.queryAnalysis.results) {
            if (result.status !== 'ERROR') {
                const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
                const accuracy = `${(result.scores.overallAccuracy * 100).toFixed(1)}%`;
                report += `| ${result.query} | ${result.category} | ${status} | ${accuracy} | ${result.duration.toFixed(1)} |\n`;
            } else {
                report += `| ${result.query} | ${result.category} | 💥 ERROR | N/A | N/A |\n`;
            }
        }
        
        // Recommendations
        if (recommendations.length > 0) {
            report += '\n## 💡 Recommendations\n\n';
            
            recommendations.forEach((rec, index) => {
                const priority = rec.priority === 'HIGH' ? '🔴 HIGH' : rec.priority === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW';
                report += `### ${index + 1}. ${rec.component}\n`;
                report += `**Priority**: ${priority}\n`;
                report += `**Issue**: ${rec.issue}\n`;
                report += `**Recommendation**: ${rec.recommendation}\n\n`;
            });
        }
        
        return report;
    }

    /**
     * Generate JSON report for programmatic use
     * @param {Object} results - Evaluation results
     * @returns {string} JSON report
     */
    generateJSONReport(results) {
        return JSON.stringify(results, null, 2);
    }

    /**
     * Generate HTML report for web viewing
     * @param {Object} results - Evaluation results
     * @returns {string} HTML report
     */
    generateHTMLReport(results) {
        const { summary, detailed, recommendations } = results;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLM Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 10px 0; }
        .grade-a { color: #059669; font-weight: bold; }
        .grade-b { color: #0891b2; font-weight: bold; }
        .grade-c { color: #d97706; font-weight: bold; }
        .grade-d { color: #dc2626; font-weight: bold; }
        .grade-f { color: #dc2626; font-weight: bold; }
        .status-pass { color: #059669; }
        .status-fail { color: #dc2626; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-medium { color: #d97706; font-weight: bold; }
        .priority-low { color: #059669; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 LLM Performance Evaluation Report</h1>
        <p><strong>Generated:</strong> ${results.metadata.timestamp}</p>
        <p><strong>Duration:</strong> ${results.metadata.duration}ms</p>
    </div>

    <div class="metric-card">
        <h2>🎯 Overall Performance</h2>
        <p><strong>Grade:</strong> <span class="grade-${summary.overall.grade.toLowerCase()}">${summary.overall.grade}</span> (${summary.overall.status})</p>
        <p><strong>Accuracy:</strong> ${(summary.overall.accuracy * 100).toFixed(1)}%</p>
        <p><strong>Success Rate:</strong> ${(summary.overall.successRate * 100).toFixed(1)}%</p>
        <p><strong>Response Time:</strong> ${summary.overall.responseTime.toFixed(1)}ms</p>
    </div>

    <h2>🔍 Component Performance</h2>
    <table>
        <tr>
            <th>Component</th>
            <th>Accuracy</th>
            <th>Grade</th>
        </tr>
        <tr>
            <td>Intent Classification</td>
            <td>${(summary.components.intentClassification.accuracy * 100).toFixed(1)}%</td>
            <td><span class="grade-${summary.components.intentClassification.grade.toLowerCase()}">${summary.components.intentClassification.grade}</span></td>
        </tr>
        <tr>
            <td>Complexity Assessment</td>
            <td>${(summary.components.complexityAssessment.accuracy * 100).toFixed(1)}%</td>
            <td><span class="grade-${summary.components.complexityAssessment.grade.toLowerCase()}">${summary.components.complexityAssessment.grade}</span></td>
        </tr>
        <tr>
            <td>Entity Extraction</td>
            <td>${(summary.components.entityExtraction.accuracy * 100).toFixed(1)}%</td>
            <td><span class="grade-${summary.components.entityExtraction.grade.toLowerCase()}">${summary.components.entityExtraction.grade}</span></td>
        </tr>
    </table>

    <h2>📋 Query Results</h2>
    <table>
        <tr>
            <th>Query</th>
            <th>Category</th>
            <th>Status</th>
            <th>Accuracy</th>
            <th>Time (ms)</th>
        </tr>
        ${detailed.queryAnalysis.results.map(result => `
        <tr>
            <td>${result.query}</td>
            <td>${result.category}</td>
            <td><span class="status-${result.status.toLowerCase()}">${result.status}</span></td>
            <td>${result.status !== 'ERROR' ? (result.scores.overallAccuracy * 100).toFixed(1) + '%' : 'N/A'}</td>
            <td>${result.status !== 'ERROR' ? result.duration.toFixed(1) : 'N/A'}</td>
        </tr>
        `).join('')}
    </table>

    ${recommendations.length > 0 ? `
    <h2>💡 Recommendations</h2>
    ${recommendations.map((rec, index) => `
    <div class="metric-card">
        <h3>${index + 1}. ${rec.component}</h3>
        <p><strong>Priority:</strong> <span class="priority-${rec.priority.toLowerCase()}">${rec.priority}</span></p>
        <p><strong>Issue:</strong> ${rec.issue}</p>
        <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
    </div>
    `).join('')}
    ` : ''}
</body>
</html>`;
    }

    /**
     * Save report to file
     * @param {string} content - Report content
     * @param {string} filename - Output filename
     * @param {string} format - File format
     * @returns {string} Filename
     */
    saveReport(content, filename, format) {
        // In a browser environment, this would trigger a download
        // In Node.js, this would write to filesystem
        const blob = new Blob([content], { 
            type: this.getMimeType(format) 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return filename;
    }

    /**
     * Get MIME type for format
     * @param {string} format - Report format
     * @returns {string} MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            json: 'application/json',
            markdown: 'text/markdown',
            html: 'text/html',
            console: 'text/plain'
        };
        return mimeTypes[format] || 'text/plain';
    }
}