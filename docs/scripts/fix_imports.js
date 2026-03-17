import fs from 'fs';
import path from 'path';

const directory = process.cwd();

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!['node_modules', '.git', '.next', 'dist'].includes(file)) {
                walk(fullPath);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Simple regex to find relative imports/exports that don't have an extension
    // Matches: import { something } from './some/path'
    // Matches: export { something } from '../another/path'
    // Captures the prefix (import/export ... from ') and the path
    const regex = /((?:import|export)\s+[\s\S]*?from\s+['"])(\.?\.\/[^'"]+)(?=['"])/g;
    
    let changed = false;
    const newContent = content.replace(regex, (match, prefix, path) => {
        // If it already has an extension, don't add .js
        if (/\.[a-z0-9]+$/i.test(path)) {
            return match;
        }
        changed = true;
        return prefix + path + '.js';
    });

    if (changed) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, newContent, 'utf8');
    }
}

console.log(`Starting import fix in: ${directory}`);
walk(directory);
console.log('Import fix complete.');
