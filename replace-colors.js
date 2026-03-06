import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
    // Dark Mode
    'bg-gray-950': 'bg-[#0a0f0d]',
    'bg-gray-900': 'bg-[#0d1a14]',
    'bg-gray-800': 'bg-[#142b1e]',
    'bg-gray-700': 'bg-[#1a3526]',
    'border-gray-800': 'border-[#1f4a2e]',
    'border-gray-700': 'border-[#2d6e43]',
    'text-gray-400': 'text-[#7ab896]',
    'text-gray-500': 'text-[#4a7a60]',
    'text-gray-100': 'text-[#e8f5ee]',
    'text-gray-200': 'text-[#c8e6d4]',

    // Light Mode
    'bg-white': 'bg-[#ffffff]',
    'bg-slate-50': 'bg-[#f0faf4]',
    'border-gray-200': 'border-[#c8e6d4]',
    'text-gray-900': 'text-[#0d2b1a]',
    'text-gray-600': 'text-[#5a8a70]'
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (let file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            for (let [oldStr, newStr] of Object.entries(replacements)) {
                // Use regex with word boundaries to ensure exact match of class
                const regex = new RegExp(oldStr + '\\b', 'g');
                content = content.replace(regex, newStr);
            }

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Hex color replacer complete!');
