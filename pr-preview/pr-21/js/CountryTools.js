// Country Data Tools for Function Calling
import { debugLog } from "./debug.js";
import { executeQuery, getAvailableStats } from "./data.js";

export class CountryTools {
    static getToolDefinitions() {
        return [
            {
                type: "function",
                function: {
                    name: "search_countries",
                    description: "Search for countries based on specific criteria",
                    parameters: {
                        type: "object",
                        properties: {
                            region: {
                                type: "string",
                                description: "Geographic region (Europe, Asia, Africa, Americas, Oceania)",
                                enum: ["Europe", "Asia", "Africa", "Americas", "Oceania"]
                            },
                            min_population: {
                                type: "number",
                                description: "Minimum population threshold"
                            },
                            max_population: {
                                type: "number", 
                                description: "Maximum population threshold"
                            },
                            language: {
                                type: "string",
                                description: "Language spoken in the country"
                            },
                            flag_color: {
                                type: "string",
                                description: "Color present in the country's flag"
                            },
                            currency: {
                                type: "string",
                                description: "Currency used in the country"
                            }
                        },
                        required: []
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_country_details",
                    description: "Get detailed information about specific countries",
                    parameters: {
                        type: "object",
                        properties: {
                            country_names: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of country names to get details for"
                            },
                            fields: {
                                type: "array",
                                items: { type: "string" },
                                description: "Specific fields to retrieve (name, population, area, region, etc.)"
                            }
                        },
                        required: ["country_names"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "compare_countries",
                    description: "Compare two or more countries across different metrics",
                    parameters: {
                        type: "object",
                        properties: {
                            country_names: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of countries to compare (2-5 countries)"
                            },
                            metrics: {
                                type: "array",
                                items: { type: "string" },
                                description: "Metrics to compare (population, area, region, languages, etc.)"
                            }
                        },
                        required: ["country_names", "metrics"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_statistics",
                    description: "Get statistical information about countries",
                    parameters: {
                        type: "object",
                        properties: {
                            statistic_type: {
                                type: "string",
                                description: "Type of statistic to calculate",
                                enum: ["largest", "smallest", "most_populated", "least_populated", "count_by_region"]
                            },
                            field: {
                                type: "string",
                                description: "Field to calculate statistics for (population, area)"
                            },
                            limit: {
                                type: "number",
                                description: "Number of results to return (default 10)",
                                default: 10
                            },
                            region: {
                                type: "string",
                                description: "Filter by specific region (optional)"
                            }
                        },
                        required: ["statistic_type"]
                    }
                }
            }
        ];
    }

    static async executeFunction(functionName, parameters) {
        debugLog(`Executing function: ${functionName}`, parameters);
        
        try {
            switch (functionName) {
                case "search_countries":
                    return await this.searchCountries(parameters);
                case "get_country_details":
                    return await this.getCountryDetails(parameters);
                case "compare_countries":
                    return await this.compareCountries(parameters);
                case "get_statistics":
                    return await this.getStatistics(parameters);
                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        } catch (error) {
            debugLog(`Error executing function ${functionName}:`, error);
            throw error;
        }
    }

    static async searchCountries(params) {
        let conditions = [];
        
        if (params.region) {
            conditions.push(`region = '${params.region}'`);
        }
        
        if (params.min_population) {
            conditions.push(`population >= ${params.min_population}`);
        }
        
        if (params.max_population) {
            conditions.push(`population <= ${params.max_population}`);
        }
        
        if (params.language) {
            conditions.push(`languages LIKE '%${params.language}%'`);
        }
        
        if (params.flag_color) {
            conditions.push(`flagDescription LIKE '%${params.flag_color}%'`);
        }
        
        if (params.currency) {
            conditions.push(`currencies LIKE '%${params.currency}%'`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT name, ISO_A3, region, population FROM countries ${whereClause} ORDER BY name`;
        
        debugLog(`Generated search SQL: ${sql}`);
        const results = executeQuery(sql);
        
        return {
            success: true,
            count: results.length,
            countries: results,
            sql: sql
        };
    }

    static async getCountryDetails(params) {
        const { country_names, fields = ['name', 'ISO_A3', 'region', 'population', 'area'] } = params;
        
        // Build country name conditions
        const nameConditions = country_names.map(name => 
            `name LIKE '%${name}%'`
        ).join(' OR ');
        
        const fieldList = fields.join(', ');
        const sql = `SELECT ${fieldList} FROM countries WHERE ${nameConditions} ORDER BY name`;
        
        debugLog(`Generated details SQL: ${sql}`);
        const results = executeQuery(sql);
        
        return {
            success: true,
            count: results.length,
            countries: results,
            requested_fields: fields,
            sql: sql
        };
    }

    static async compareCountries(params) {
        const { country_names, metrics } = params;
        
        if (country_names.length < 2) {
            throw new Error("At least 2 countries required for comparison");
        }
        
        if (country_names.length > 5) {
            throw new Error("Maximum 5 countries allowed for comparison");
        }

        // Build country name conditions
        const nameConditions = country_names.map(name => 
            `name LIKE '%${name}%'`
        ).join(' OR ');
        
        const fieldList = ['name', 'ISO_A3', ...metrics].join(', ');
        const sql = `SELECT ${fieldList} FROM countries WHERE ${nameConditions} ORDER BY name`;
        
        debugLog(`Generated comparison SQL: ${sql}`);
        const results = executeQuery(sql);
        
        // Create comparison structure
        const comparison = {
            countries: results,
            metrics: metrics,
            analysis: {}
        };
        
        // Add basic analysis for numeric fields
        metrics.forEach(metric => {
            if (['population', 'area'].includes(metric)) {
                const values = results.map(c => c[metric]).filter(v => v != null);
                if (values.length > 0) {
                    comparison.analysis[metric] = {
                        highest: Math.max(...values),
                        lowest: Math.min(...values),
                        average: values.reduce((a, b) => a + b, 0) / values.length
                    };
                }
            }
        });
        
        return {
            success: true,
            comparison: comparison,
            sql: sql
        };
    }

    static async getStatistics(params) {
        const { statistic_type, field = 'population', limit = 10, region } = params;
        
        let sql = '';
        let regionFilter = region ? `WHERE region = '${region}'` : '';
        
        switch (statistic_type) {
            case 'largest':
                sql = `SELECT name, ISO_A3, ${field} FROM countries ${regionFilter} ORDER BY ${field} DESC LIMIT ${limit}`;
                break;
            case 'smallest':
                sql = `SELECT name, ISO_A3, ${field} FROM countries ${regionFilter} ORDER BY ${field} ASC LIMIT ${limit}`;
                break;
            case 'most_populated':
                sql = `SELECT name, ISO_A3, population FROM countries ${regionFilter} ORDER BY population DESC LIMIT ${limit}`;
                break;
            case 'least_populated':
                sql = `SELECT name, ISO_A3, population FROM countries ${regionFilter} ORDER BY population ASC LIMIT ${limit}`;
                break;
            case 'count_by_region':
                sql = `SELECT region, COUNT(*) as country_count FROM countries GROUP BY region ORDER BY country_count DESC`;
                break;
            default:
                throw new Error(`Unknown statistic type: ${statistic_type}`);
        }
        
        debugLog(`Generated statistics SQL: ${sql}`);
        const results = executeQuery(sql);
        
        return {
            success: true,
            statistic_type: statistic_type,
            field: field,
            results: results,
            sql: sql
        };
    }
}

// Helper function to format tool results for display
export function formatToolResult(functionName, result) {
    const { success, count, countries, comparison, results } = result;
    
    if (!success) {
        return `<div class="error">Tool execution failed</div>`;
    }
    
    switch (functionName) {
        case "search_countries":
            return `
                <div class="tool-result">
                    <h4>🔍 Search Results</h4>
                    <p>Found ${count} countries</p>
                    ${countries.map(c => `<span class="country-tag">${c.name}</span>`).join(' ')}
                </div>
            `;
        case "get_country_details":
            return `
                <div class="tool-result">
                    <h4>📊 Country Details</h4>
                    ${countries.map(c => `
                        <div class="country-detail">
                            <strong>${c.name}</strong> (${c.ISO_A3})
                            ${c.region ? `<br>Region: ${c.region}` : ''}
                            ${c.population ? `<br>Population: ${c.population.toLocaleString()}` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        case "compare_countries":
            return `
                <div class="tool-result">
                    <h4>⚖️ Country Comparison</h4>
                    <table class="comparison-table">
                        <tr>
                            <th>Country</th>
                            ${comparison.metrics.map(m => `<th>${m}</th>`).join('')}
                        </tr>
                        ${comparison.countries.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                ${comparison.metrics.map(m => `<td>${c[m] || 'N/A'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
        case "get_statistics":
            return `
                <div class="tool-result">
                    <h4>📈 Statistics: ${result.statistic_type}</h4>
                    ${results.map((r, i) => `
                        <div class="stat-item">
                            ${i + 1}. ${r.name} ${r[result.field] ? `- ${r[result.field].toLocaleString()}` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        default:
            return `<div class="tool-result">Result: ${JSON.stringify(result, null, 2)}</div>`;
    }
}