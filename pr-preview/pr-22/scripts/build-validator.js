#!/usr/bin/env node

import { promises as fs } from 'fs';
import { join } from 'path';

const requiredFiles = [
    'index.html',
    'css/base.css',
    'css/components.css',
    'css/map.css',
    'js/main.js',
    'js/map.js',
    'js/data.js',
    'js/llm.js',
    'data/countryData.json'
];

const requiredDirectories = [
    'css',
    'js',
    'js/components',
    'js/services',
    'js/config',
    'data'
];

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function validateFileStructure() {
    console.log('🏗️  Validating build structure...\n');
    
    const errors = [];
    
    // Check required directories
    for (const dir of requiredDirectories) {
        if (!(await fileExists(dir))) {
            errors.push(`Missing required directory: ${dir}`);
        }
    }
    
    // Check required files
    for (const file of requiredFiles) {
        if (!(await fileExists(file))) {
            errors.push(`Missing required file: ${file}`);
        }
    }
    
    return errors;
}

async function validateFileContents() {
    console.log('📄 Validating file contents...\n');
    
    const errors = [];
    
    try {
        // Validate index.html contains required elements
        const indexContent = await fs.readFile('index.html', 'utf-8');
        const requiredElements = [
            'id="map"',
            'id="search-bar"',
            'id="country-info"',
            'id="message"'
        ];
        
        for (const element of requiredElements) {
            if (!indexContent.includes(element)) {
                errors.push(`index.html missing required element: ${element}`);
            }
        }
        
        // Validate country data format
        const countryDataContent = await fs.readFile('data/countryData.json', 'utf-8');
        const countryData = JSON.parse(countryDataContent);
        
        if (!countryData.metadata) {
            errors.push('countryData.json missing metadata section');
        }
        
        if (!countryData.countries || !Array.isArray(countryData.countries)) {
            errors.push('countryData.json missing or invalid countries array');
        } else if (countryData.countries.length === 0) {
            errors.push('countryData.json countries array is empty');
        }
        
        // Validate at least one country has required fields
        const firstCountry = countryData.countries[0];
        const requiredFields = ['name', 'ISO_A3', 'region', 'population'];
        for (const field of requiredFields) {
            if (!firstCountry[field]) {
                errors.push(`countryData.json countries missing required field: ${field}`);
            }
        }
        
    } catch (error) {
        errors.push(`Error validating file contents: ${error.message}`);
    }
    
    return errors;
}

async function simulateDeploymentBuild() {
    console.log('🚀 Simulating deployment build...\n');
    
    const errors = [];
    
    try {
        // Create temporary deployment directory
        const deployDir = './temp-deploy';
        await fs.mkdir(deployDir, { recursive: true });
        
        // Copy files as done in deployment
        await fs.copyFile('index.html', join(deployDir, 'index.html'));
        await fs.cp('css', join(deployDir, 'css'), { recursive: true });
        await fs.cp('js', join(deployDir, 'js'), { recursive: true });
        await fs.cp('data', join(deployDir, 'data'), { recursive: true });
        
        // Remove performance files as done in deployment
        const performanceFiles = [
            join(deployDir, 'js/PerformanceBenchmark.js'),
            join(deployDir, 'js/components/PerformanceDashboard.js')
        ];
        
        for (const file of performanceFiles) {
            try {
                await fs.unlink(file);
            } catch {
                // File might not exist, which is fine
            }
        }
        
        // Verify essential files exist in deployment
        const deploymentFiles = [
            join(deployDir, 'index.html'),
            join(deployDir, 'css/base.css'),
            join(deployDir, 'js/main.js'),
            join(deployDir, 'data/countryData.json')
        ];
        
        for (const file of deploymentFiles) {
            if (!(await fileExists(file))) {
                errors.push(`Deployment missing file: ${file}`);
            }
        }
        
        // Clean up
        await fs.rm(deployDir, { recursive: true, force: true });
        
    } catch (error) {
        errors.push(`Deployment simulation failed: ${error.message}`);
    }
    
    return errors;
}

async function main() {
    console.log('🔧 Build Validation\n');
    
    const structureErrors = await validateFileStructure();
    const contentErrors = await validateFileContents();
    const deploymentErrors = await simulateDeploymentBuild();
    
    const allErrors = [...structureErrors, ...contentErrors, ...deploymentErrors];
    
    if (allErrors.length > 0) {
        console.log('❌ Build validation failed:\n');
        allErrors.forEach(error => console.log(`  ${error}`));
        console.log(`\n${allErrors.length} error(s) found.`);
        process.exit(1);
    } else {
        console.log('✅ Build validation passed!');
        console.log('   All required files and structure are present.');
    }
}

main().catch(error => {
    console.error('Build validation failed:', error);
    process.exit(1);
});