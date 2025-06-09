#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];

async function checkFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for console.log in production files
        if (filePath.includes('/js/') && 
            !filePath.includes('.test.js') && 
            !filePath.includes('debug.js') && 
            content.includes('console.log')) {
            errors.push(`${filePath}: Contains console.log statements`);
        }
        
        // Check for TODO/FIXME comments
        const todoMatches = content.match(/TODO|FIXME/g);
        if (todoMatches) {
            warnings.push(`${filePath}: Contains ${todoMatches.length} TODO/FIXME comment(s)`);
        }
        
        // Check for potential secrets
        const secretPatterns = [
            /api[_-]?key/i,
            /secret/i,
            /token/i,
            /password/i
        ];
        
        for (const pattern of secretPatterns) {
            if (pattern.test(content) && 
                !content.includes('placeholder') && 
                !content.includes('example') && 
                !content.includes('mock')) {
                errors.push(`${filePath}: Potential secret found matching ${pattern}`);
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