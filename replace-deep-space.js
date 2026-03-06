import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
    // Backgrounds
    'bg-gray-950': 'bg-[#0a0e1a]',
    'bg-gray-900': 'bg-[#0d1117]',
    'bg-gray-800': 'bg-[#141c2e]',
    'bg-gray-700': 'bg-[#1a2540]',
    'bg-gray-800/50': 'bg-[#141c2e]/50',
    'bg-gray-900/50': 'bg-[#0d1117]/50',
    'bg-gray-800/30': 'bg-[#141c2e]/30',

    // Borders
    'border-gray-800': 'border-[#1e2d4a]',
    'border-gray-700': 'border-[#2a3f6a]',
    'border-gray-600': 'border-[#3a5080]',

    // Text
    'text-gray-100': 'text-[#f0f4ff]',
    'text-gray-200': 'text-[#d0d8f0]',
    'text-gray-300': 'text-[#a8b8d8]',
    'text-gray-400': 'text-[#8899bb]',
    'text-gray-500': 'text-[#4a5a7a]'
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // Strict exact matching using splits
            for (let [oldStr, newStr] of Object.entries(replacements)) {
                const regex = new RegExp(`(?<!-)\\b${oldStr.replace('/', '\\/')}\\b`, 'g');
                content = content.replace(regex, newStr);
            }

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Hex color replacements for Deep Space palette complete!');
