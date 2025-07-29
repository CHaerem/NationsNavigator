// Query Analysis and Validation Module
import { debugLog } from "./debug.js";

export class QueryAnalyzer {
    static analyzeQuery(userQuery) {
        const analysis = {
            intent: this.classifyIntent(userQuery),
            entities: this.extractEntities(userQuery),
            complexity: this.assessComplexity(userQuery),
            confidence: 0.8,
            suggestions: []
        };

        // Add validation suggestions
        analysis.suggestions = this.generateSuggestions(analysis);
        
        debugLog("Query analysis:", analysis);
        return analysis;
    }

    static classifyIntent(query) {
        const queryLower = query.toLowerCase();
        
        // Geographic queries
        if (this.matchesPattern(queryLower, ['countries in', 'located in', 'region', 'continent'])) {
            return 'geographic';
        }
        
        // Population queries
        if (this.matchesPattern(queryLower, ['population', 'people', 'inhabitants', 'populous'])) {
            return 'population';
        }
        
        // Language queries
        if (this.matchesPattern(queryLower, ['language', 'speak', 'speaking', 'official language'])) {
            return 'language';
        }
        
        // Flag queries
        if (this.matchesPattern(queryLower, ['flag', 'color', 'red flag', 'blue flag', 'star', 'cross'])) {
            return 'flag';
        }
        
        // Currency queries
        if (this.matchesPattern(queryLower, ['currency', 'money', 'euro', 'dollar', 'use'])) {
            return 'currency';
        }
        
        // Size/area queries
        if (this.matchesPattern(queryLower, ['largest', 'biggest', 'smallest', 'area', 'size', 'km'])) {
            return 'size';
        }
        
        // Border queries
        if (this.matchesPattern(queryLower, ['border', 'neighbor', 'next to', 'adjacent'])) {
            return 'border';
        }
        
        return 'general';
    }

    static extractEntities(query) {
        const entities = {
            regions: [],
            countries: [],
            languages: [],
            colors: [],
            numbers: [],
            comparisons: []
        };

        const queryLower = query.toLowerCase();

        // Extract regions
        const regions = ['europe', 'asia', 'africa', 'americas', 'oceania', 'north america', 'south america'];
        regions.forEach(region => {
            if (queryLower.includes(region)) {
                entities.regions.push(region);
            }
        });

        // Extract common country names (sample)
        const commonCountries = ['france', 'germany', 'italy', 'spain', 'uk', 'usa', 'china', 'japan', 'india', 'brazil'];
        commonCountries.forEach(country => {
            if (queryLower.includes(country)) {
                entities.countries.push(country);
            }
        });

        // Extract languages
        const languages = ['english', 'spanish', 'french', 'german', 'portuguese', 'arabic', 'chinese'];
        languages.forEach(language => {
            if (queryLower.includes(language)) {
                entities.languages.push(language);
            }
        });

        // Extract colors
        const colors = ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange'];
        colors.forEach(color => {
            if (queryLower.includes(color)) {
                entities.colors.push(color);
            }
        });

        // Extract numbers and comparisons
        const numberMatches = query.match(/\d+/g);
        if (numberMatches) {
            entities.numbers = numberMatches.map(n => parseInt(n));
        }

        const comparisonWords = ['more than', 'less than', 'over', 'under', 'above', 'below', 'greater', 'smaller'];
        comparisonWords.forEach(comp => {
            if (queryLower.includes(comp)) {
                entities.comparisons.push(comp);
            }
        });

        return entities;
    }

    static assessComplexity(query) {
        let score = 0;
        const queryLower = query.toLowerCase();

        // Basic complexity indicators
        if (queryLower.includes('and') || queryLower.includes('or')) score += 1;
        if (queryLower.includes('but') || queryLower.includes('except')) score += 1;
        if (queryLower.includes('compare') || queryLower.includes('vs')) score += 2;
        if (queryLower.match(/\d+/)) score += 1;
        if (queryLower.split(' ').length > 10) score += 1;

        if (score >= 4) return 'high';
        if (score >= 2) return 'medium';
        return 'low';
    }

    static generateSuggestions(analysis) {
        const suggestions = [];

        // Intent-specific suggestions
        switch (analysis.intent) {
            case 'geographic':
                if (analysis.entities.regions.length === 0) {
                    suggestions.push("Consider specifying a region like 'Europe' or 'Asia'");
                }
                break;
            case 'population':
                if (analysis.entities.numbers.length === 0) {
                    suggestions.push("You can specify population thresholds like 'over 100 million'");
                }
                break;
            case 'language':
                if (analysis.entities.languages.length === 0) {
                    suggestions.push("Try specifying a language like 'Spanish' or 'French'");
                }
                break;
        }

        // Complexity suggestions
        if (analysis.complexity === 'high') {
            suggestions.push("This is a complex query. Consider breaking it into simpler parts.");
        }

        return suggestions;
    }

    static matchesPattern(text, patterns) {
        return patterns.some(pattern => text.includes(pattern));
    }

    static validateQueryResult(analysis, sqlQuery, results) {
        const validation = {
            isValid: true,
            issues: [],
            suggestions: []
        };

        // Check if results match expected intent
        if (analysis.intent === 'geographic' && results.length === 0) {
            validation.issues.push("No countries found for geographic query");
            validation.suggestions.push("Try a broader region or check spelling");
        }

        if (analysis.intent === 'population' && results.length > 50) {
            validation.suggestions.push("Large result set - consider adding population filters");
        }

        // Validate SQL structure
        if (!sqlQuery.toLowerCase().includes('order by')) {
            validation.suggestions.push("Results might be more readable with sorting");
        }

        return validation;
    }
}

// Pre-defined query templates for common patterns
export const QueryTemplates = {
    geographic: {
        pattern: "Countries in {region}",
        sql: "SELECT name, ISO_A3 FROM countries WHERE region = '{region}' ORDER BY name"
    },
    population: {
        pattern: "Countries with population over {number}",
        sql: "SELECT name, ISO_A3 FROM countries WHERE population > {number} ORDER BY population DESC"
    },
    language: {
        pattern: "Countries that speak {language}",
        sql: "SELECT name, ISO_A3 FROM countries WHERE languages LIKE '%{language}%' ORDER BY name"
    },
    flag: {
        pattern: "Countries with {color} flags",
        sql: "SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%{color}%' ORDER BY name"
    }
};