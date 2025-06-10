#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];

async function checkFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for console.log in production files (excluding legitimate use cases)
        if (filePath.includes('/js/') && 
            !filePath.includes('.test.js') && 
            !filePath.includes('debug.js') &&
            !filePath.includes('PerformanceBenchmark.js') &&
            !filePath.includes('PerformanceDashboard.js') &&
            content.includes('console.log')) {
            
            // Allow console.log in specific contexts
            const allowedPatterns = [
                /console\.log.*not available in production build/,
                /console\.log.*=== .* DEBUG ===/,
                /console\.log.*Starting deletion of/,
                /console\.log.*Successfully deleted/,
                /console\.log.*WebLLM.*completed/,
                /console\.log.*IndexedDB databases/,
                /console\.log.*Cache.*contains.*entries/,
                /console\.log.*Error checking/
            ];
            
            const lines = content.split('\n');
            const consoleLogLines = lines.filter(line => line.includes('console.log'));
            
            for (const line of consoleLogLines) {
                const isAllowed = allowedPatterns.some(pattern => pattern.test(line));
                if (!isAllowed) {
                    errors.push(`${filePath}: Contains unauthorized console.log: ${line.trim()}`);
                }
            }
        }
        
        // Check for TODO/FIXME comments
        const todoMatches = content.match(/TODO|FIXME/g);
        if (todoMatches) {
            warnings.push(`${filePath}: Contains ${todoMatches.length} TODO/FIXME comment(s)`);
        }
        
        // Check for potential secrets (excluding legitimate API parameters)
        const secretPatterns = [
            /api[_-]?key\s*[:=]/i,
            /secret\s*[:=]/i,
            /(?<!max_)token\s*[:=]/i,  // Exclude max_tokens
            /password\s*[:=]/i
        ];
        
        const allowedPatterns = [
            /max_tokens/i,
            /placeholder/i,
            /example/i,
            /mock/i,
            /test/i,
            /_TOKEN\s*:/,  // Allow constant definitions
            /console\.log/,  // Allow in logging
            /github\.com.*token/i  // Allow GitHub URLs with token
        ];
        
        for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
                const lines = content.split('\n');
                const matchingLines = lines.filter(line => pattern.test(line));
                
                for (const line of matchingLines) {
                    const isAllowed = allowedPatterns.some(allowedPattern => 
                        allowedPattern.test(line)
                    );
                    
                    if (!isAllowed) {
                        errors.push(`${filePath}: Potential secret found: ${line.trim()}`);
                    }
                }
            }
        }
        
        // Basic syntax check for JavaScript files
        if (filePath.endsWith('.js')) {
            try {
                // This is a basic check - in a real scenario you'd use a proper parser
                if (content.includes('function(') && !content.includes(')')) {
                    errors.push(`${filePath}: Potential syntax error - unmatched parentheses`);
                }
            } catch (e) {
                errors.push(`${filePath}: Syntax error - ${e.message}`);
            }
        }
        
    } catch (error) {
        errors.push(`${filePath}: Error reading file - ${error.message}`);
    }
}

async function walkDirectory(dir, extensions = ['.js', '.css']) {
    const files = [];
    
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                files.push(...await walkDirectory(fullPath, extensions));
            } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }
    
    return files;
}

async function main() {
    console.log('🔍 Running code quality checks...\n');
    
    // Check JavaScript files
    const jsFiles = await walkDirectory('./js', ['.js']);
    const cssFiles = await walkDirectory('./css', ['.css']);
    
    const allFiles = [...jsFiles, ...cssFiles];
    
    console.log(`Checking ${allFiles.length} files...`);
    
    for (const file of allFiles) {
        await checkFile(file);
    }
    
    // Report results
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => console.log(`  ${error}`));
        console.log(`\n${errors.length} error(s) found.`);
        process.exit(1);
    } else {
        console.log('\n✅ Code quality checks passed!');
        if (warnings.length > 0) {
            console.log(`   (${warnings.length} warning(s) found)`);
        }
    }
}

main().catch(error => {
    console.error('Lint check failed:', error);
    process.exit(1);
});