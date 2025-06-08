// Performance Dashboard Component
import { BaseComponent } from './BaseComponent.js';
import { PerformanceBenchmark } from '../PerformanceBenchmark.js';
import { debugLog } from '../debug.js';

export class PerformanceDashboard extends BaseComponent {
    constructor() {
        super('#performance-dashboard');
        this.benchmark = new PerformanceBenchmark();
        this.isRunning = false;
        this.currentResults = null;
    }

    init() {
        if (!this.element) {
            this.createDashboard();
        }
        this.setupEventListeners();
        this.isInitialized = true;
    }

    createDashboard() {
        // Create dashboard if it doesn't exist
        const dashboardHTML = `
            <div id="performance-dashboard" class="performance-dashboard" style="display: none;">
                <div class="dashboard-header">
                    <h3>🚀 LLM Performance Dashboard</h3>
                    <button id="close-dashboard" class="close-btn">×</button>
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-controls">
                        <button id="run-benchmark" class="benchmark-btn">Run Full Benchmark</button>
                        <button id="run-quick-test" class="benchmark-btn secondary">Quick Test</button>
                        <button id="export-results" class="benchmark-btn secondary" disabled>Export Results</button>
                    </div>
                    <div id="benchmark-status" class="benchmark-status"></div>
                    <div id="benchmark-results" class="benchmark-results"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        this.element = document.getElementById('performance-dashboard');
    }

    setupEventListeners() {
        const runBenchmarkBtn = document.getElementById('run-benchmark');
        const runQuickTestBtn = document.getElementById('run-quick-test');
        const exportResultsBtn = document.getElementById('export-results');
        const closeDashboardBtn = document.getElementById('close-dashboard');

        if (runBenchmarkBtn) {
            runBenchmarkBtn.addEventListener('click', () => this.runFullBenchmark());
        }

        if (runQuickTestBtn) {
            runQuickTestBtn.addEventListener('click', () => this.runQuickTest());
        }

        if (exportResultsBtn) {
            exportResultsBtn.addEventListener('click', () => this.exportResults());
        }

        if (closeDashboardBtn) {
            closeDashboardBtn.addEventListener('click', () => this.hide());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    async runFullBenchmark() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateStatus('🔄 Running comprehensive performance benchmark...');
        this.disableControls();

        try {
            const result = await this.benchmark.runFullBenchmark();
            this.currentResults = result;
            
            const report = this.benchmark.generatePerformanceReport(result);
            this.displayResults(result, report);
            this.updateStatus('✅ Benchmark completed successfully');
            
            debugLog('Full benchmark completed:', result);
        } catch (error) {
            this.updateStatus(`❌ Benchmark failed: ${error.message}`);
            console.error('Benchmark error:', error);
        } finally {
            this.isRunning = false;
            this.enableControls();
        }
    }

    async runQuickTest() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateStatus('🔄 Running quick performance test...');
        this.disableControls();

        try {
            // Run a subset of tests
            const queryAnalysis = await this.benchmark.benchmarkQueryAnalysis();
            const sqlGeneration = await this.benchmark.benchmarkSQLGeneration();
            
            const quickResult = {
                timestamp: new Date().toISOString(),
                results: { queryAnalysis, sqlGeneration },
                summary: this.benchmark.calculateSummary({ queryAnalysis, sqlGeneration, enhancedGeneration: sqlGeneration, toolUsage: { functionCallingRecommendationRate: 0.5 }, endToEnd: { standardSuccessRate: sqlGeneration.successRate, enhancedSuccessRate: sqlGeneration.successRate } })
            };

            this.currentResults = quickResult;
            this.displayQuickResults(quickResult);
            this.updateStatus('✅ Quick test completed');
            
            debugLog('Quick test completed:', quickResult);
        } catch (error) {
            this.updateStatus(`❌ Quick test failed: ${error.message}`);
            console.error('Quick test error:', error);
        } finally {
            this.isRunning = false;
            this.enableControls();
        }
    }

    displayResults(result, report) {
        const resultsDiv = document.getElementById('benchmark-results');
        if (!resultsDiv) return;

        const summary = result.summary;
        
        resultsDiv.innerHTML = `
            <div class="results-summary">
                <h4>📊 Performance Summary</h4>
                <div class="metrics-grid">
                    <div class="metric-card ${this.getStatusClass(summary.queryAnalysis.status)}">
                        <h5>Query Analysis</h5>
                        <div class="metric-value">${(summary.queryAnalysis.accuracyRate * 100).toFixed(1)}%</div>
                        <div class="metric-label">Accuracy</div>
                        <div class="metric-detail">${summary.queryAnalysis.averageDuration.toFixed(2)}ms avg</div>
                    </div>
                    
                    <div class="metric-card ${this.getStatusClass(summary.sqlGeneration.status)}">
                        <h5>SQL Generation</h5>
                        <div class="metric-value">${(summary.sqlGeneration.successRate * 100).toFixed(1)}%</div>
                        <div class="metric-label">Success Rate</div>
                        <div class="metric-detail">${summary.sqlGeneration.averageTime.toFixed(0)}ms avg</div>
                    </div>
                    
                    <div class="metric-card ${this.getStatusClass(summary.enhancedGeneration.status)}">
                        <h5>Enhanced Mode</h5>
                        <div class="metric-value">${(summary.enhancedGeneration.successRate * 100).toFixed(1)}%</div>
                        <div class="metric-label">Success Rate</div>
                        <div class="metric-detail">${(summary.enhancedGeneration.structuredOutputRate * 100).toFixed(1)}% structured</div>
                    </div>
                    
                    <div class="metric-card ${this.getStatusClass(summary.overallImprovement.status === 'improved' ? 'excellent' : 'needs_improvement')}">
                        <h5>Improvement</h5>
                        <div class="metric-value">${summary.overallImprovement.status === 'improved' ? '✅' : '⚠️'}</div>
                        <div class="metric-label">${summary.overallImprovement.status}</div>
                        <div class="metric-detail">${(summary.overallImprovement.enhancedVsStandard * 100).toFixed(1)}% better</div>
                    </div>
                </div>
            </div>
            
            <div class="detailed-results">
                <h4>📈 Detailed Analysis</h4>
                <div class="result-tabs">
                    <button class="tab-btn active" data-tab="overview">Overview</button>
                    <button class="tab-btn" data-tab="queries">Query Analysis</button>
                    <button class="tab-btn" data-tab="comparison">Before/After</button>
                    <button class="tab-btn" data-tab="recommendations">Recommendations</button>
                </div>
                
                <div class="tab-content">
                    <div class="tab-panel active" id="overview-panel">
                        ${this.generateOverviewPanel(result)}
                    </div>
                    <div class="tab-panel" id="queries-panel">
                        ${this.generateQueriesPanel(result)}
                    </div>
                    <div class="tab-panel" id="comparison-panel">
                        ${this.generateComparisonPanel(result)}
                    </div>
                    <div class="tab-panel" id="recommendations-panel">
                        ${this.generateRecommendationsPanel(result)}
                    </div>
                </div>
            </div>
        `;

        this.setupTabNavigation();
    }

    displayQuickResults(result) {
        const resultsDiv = document.getElementById('benchmark-results');
        if (!resultsDiv) return;

        const { queryAnalysis, sqlGeneration } = result.results;
        
        resultsDiv.innerHTML = `
            <div class="quick-results">
                <h4>⚡ Quick Test Results</h4>
                <div class="metrics-row">
                    <div class="metric-item">
                        <span class="metric-label">Query Analysis Accuracy:</span>
                        <span class="metric-value ${queryAnalysis.accuracyRate > 0.8 ? 'good' : 'warning'}">${(queryAnalysis.accuracyRate * 100).toFixed(1)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">SQL Generation Success:</span>
                        <span class="metric-value ${sqlGeneration.successRate > 0.8 ? 'good' : 'warning'}">${(sqlGeneration.successRate * 100).toFixed(1)}%</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Average Response Time:</span>
                        <span class="metric-value">${sqlGeneration.averageTotalTime.toFixed(0)}ms</span>
                    </div>
                </div>
                <div class="quick-recommendation">
                    ${queryAnalysis.accuracyRate > 0.8 && sqlGeneration.successRate > 0.8 ? 
                        '✅ Performance looks good! Run full benchmark for complete analysis.' :
                        '⚠️ Some issues detected. Consider running full benchmark to identify optimization opportunities.'}
                </div>
            </div>
        `;
    }

    generateOverviewPanel(result) {
        const tests = result.results.queryAnalysis.totalQueries;
        const successfulAnalyses = Math.round(result.results.queryAnalysis.accuracyRate * tests);
        const successfulQueries = Math.round(result.results.sqlGeneration.successRate * result.results.sqlGeneration.totalQueries);
        
        return `
            <div class="overview-stats">
                <p><strong>Total test queries:</strong> ${tests}</p>
                <p><strong>Successful analyses:</strong> ${successfulAnalyses}/${tests}</p>
                <p><strong>Successful SQL generations:</strong> ${successfulQueries}/${result.results.sqlGeneration.totalQueries}</p>
                <p><strong>Average query analysis time:</strong> ${result.results.queryAnalysis.averageDuration.toFixed(2)}ms</p>
                <p><strong>Average SQL generation time:</strong> ${result.results.sqlGeneration.averageTotalTime.toFixed(0)}ms</p>
                <p><strong>Structured output rate:</strong> ${(result.results.enhancedGeneration.structuredOutputRate * 100).toFixed(1)}%</p>
            </div>
        `;
    }

    generateQueriesPanel(result) {
        return `
            <div class="queries-breakdown">
                <h5>Query Performance by Category</h5>
                <table class="performance-table">
                    <thead>
                        <tr>
                            <th>Query</th>
                            <th>Category</th>
                            <th>Intent Match</th>
                            <th>Complexity Match</th>
                            <th>Analysis Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.results.queryAnalysis.results.map(r => `
                            <tr>
                                <td>${r.query}</td>
                                <td>${r.category}</td>
                                <td>${r.accuracy.intentMatch ? '✅' : '❌'}</td>
                                <td>${r.accuracy.complexityMatch ? '✅' : '❌'}</td>
                                <td>${r.duration.toFixed(2)}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    generateComparisonPanel(result) {
        return `
            <div class="comparison-analysis">
                <h5>Standard vs Enhanced Approach</h5>
                <div class="comparison-grid">
                    <div class="comparison-item">
                        <h6>Standard SQL Generation</h6>
                        <ul>
                            <li>Success Rate: ${(result.results.sqlGeneration.successRate * 100).toFixed(1)}%</li>
                            <li>Average Time: ${result.results.sqlGeneration.averageTotalTime.toFixed(0)}ms</li>
                            <li>Simple text parsing</li>
                            <li>Basic error handling</li>
                        </ul>
                    </div>
                    <div class="comparison-item">
                        <h6>Enhanced Generation</h6>
                        <ul>
                            <li>Success Rate: ${(result.results.enhancedGeneration.successRate * 100).toFixed(1)}%</li>
                            <li>Average Time: ${result.results.enhancedGeneration.averageEnhancedTime.toFixed(0)}ms</li>
                            <li>Structured JSON output: ${(result.results.enhancedGeneration.structuredOutputRate * 100).toFixed(1)}%</li>
                            <li>Query analysis integration</li>
                            <li>Confidence scoring: ${(result.results.enhancedGeneration.averageConfidence || 0).toFixed(2)}</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    generateRecommendationsPanel(result) {
        const recommendations = [];
        
        if (result.summary.queryAnalysis.status !== 'excellent') {
            recommendations.push('🎯 Improve query analysis by expanding entity recognition patterns');
        }
        
        if (result.summary.sqlGeneration.status !== 'excellent') {
            recommendations.push('🔧 Optimize SQL generation prompts for better reliability');
        }
        
        if (result.summary.enhancedGeneration.structuredOutputRate < 0.9) {
            recommendations.push('📝 Improve structured output consistency with better JSON schema prompting');
        }
        
        if (result.summary.overallImprovement.status === 'regression') {
            recommendations.push('⚠️ Enhanced approach showing regression - review prompting strategy');
        } else {
            recommendations.push('✅ Enhanced approach is performing well');
        }
        
        if (result.summary.overallImprovement.recommendsTools > 0.3) {
            recommendations.push('🔧 Good candidate for function calling - many complex queries detected');
        }

        return `
            <div class="recommendations-list">
                ${recommendations.map(rec => `<div class="recommendation-item">${rec}</div>`).join('')}
            </div>
        `;
    }

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Update button states
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update panel visibility
                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `${targetTab}-panel`) {
                        panel.classList.add('active');
                    }
                });
            });
        });
    }

    getStatusClass(status) {
        switch (status) {
            case 'excellent': return 'status-excellent';
            case 'good': return 'status-good';
            case 'needs_improvement': return 'status-warning';
            default: return 'status-neutral';
        }
    }

    updateStatus(message) {
        const statusDiv = document.getElementById('benchmark-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="status-message">${message}</div>`;
        }
    }

    disableControls() {
        const buttons = document.querySelectorAll('.benchmark-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    enableControls() {
        const buttons = document.querySelectorAll('.benchmark-btn');
        buttons.forEach(btn => btn.disabled = false);
        
        const exportBtn = document.getElementById('export-results');
        if (exportBtn && this.currentResults) {
            exportBtn.disabled = false;
        }
    }

    exportResults() {
        if (!this.currentResults) return;

        const exportData = {
            timestamp: new Date().toISOString(),
            benchmark: this.currentResults,
            userAgent: navigator.userAgent,
            performance: {
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : null,
                timing: performance.timing ? performance.timing : null
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `llm-performance-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.updateStatus('📁 Results exported successfully');
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    isVisible() {
        return this.element && this.element.style.display !== 'none';
    }
}