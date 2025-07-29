#!/usr/bin/env node
// Complete Performance Evaluation Runner
import { PerformanceEvaluator } from '../performance-evaluator.js';
import { PerformanceReportGenerator } from '../report-generator.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runEvaluation(options = {}) {
    console.log('🚀 NationsNavigator Performance Evaluation\n');
    
    const evaluator = new PerformanceEvaluator();
    const reportGenerator = new PerformanceReportGenerator();
    
    try {
        // Run evaluation
        const results = await evaluator.runEvaluation(options);
        
        // Ensure results directory exists
        const resultsDir = join(__dirname, '../results');
        try {
            mkdirSync(resultsDir, { recursive: true });
        } catch (e) {
            // Directory already exists
        }
        
        // Generate timestamp for filenames
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Generate and save reports
        console.log('\n📄 Generating Reports...');
        
        // Console report (immediate feedback)
        const consoleReport = reportGenerator.generateReport(results, 'console');
        console.log('\n' + consoleReport);
        
        // Save JSON results
        const jsonReport = reportGenerator.generateReport(results, 'json');
        const jsonFilename = join(resultsDir, `${timestamp}-results.json`);
        writeFileSync(jsonFilename, jsonReport);
        console.log(`💾 JSON results saved: ${jsonFilename}`);
        
        // Save Markdown report
        const markdownReport = reportGenerator.generateReport(results, 'markdown');
        const markdownFilename = join(resultsDir, `${timestamp}-report.md`);
        writeFileSync(markdownFilename, markdownReport);
        console.log(`📝 Markdown report saved: ${markdownFilename}`);
        
        // Save HTML report
        const htmlReport = reportGenerator.generateReport(results, 'html');
        const htmlFilename = join(resultsDir, `${timestamp}-report.html`);
        writeFileSync(htmlFilename, htmlReport);
        console.log(`🌐 HTML report saved: ${htmlFilename}`);
        
        // Save as baseline if specified
        if (options.saveBaseline) {
            const baselineFilename = join(resultsDir, 'baseline-results.json');
            writeFileSync(baselineFilename, jsonReport);
            console.log(`📊 Baseline results saved: ${baselineFilename}`);
        }
        
        console.log('\n✅ Evaluation complete!');
        
        // Return summary for programmatic use
        return {
            success: true,
            grade: results.summary.overall.grade,
            accuracy: results.summary.overall.accuracy,
            successRate: results.summary.overall.successRate,
            responseTime: results.summary.overall.responseTime,
            status: results.summary.overall.status,
            files: {
                json: jsonFilename,
                markdown: markdownFilename,
                html: htmlFilename
            }
        };
        
    } catch (error) {
        console.error('❌ Evaluation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {
        saveBaseline: args.includes('--baseline'),
        verbose: args.includes('--verbose')
    };
    
    runEvaluation(options).then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

export { runEvaluation };