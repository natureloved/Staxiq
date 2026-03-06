import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
    'bg-[#0a0f0d]': 'bg-gray-950',
    'bg-[#0d1a14]': 'bg-gray-900',
    'bg-[#142b1e]': 'bg-gray-800',
    'bg-[#1a3526]': 'bg-gray-700',
    'border-[#1f4a2e]': 'border-gray-800',
    'border-[#2d6e43]': 'border-gray-700',
    'text-[#7ab896]': 'text-gray-400',
    'text-[#4a7a60]': 'text-gray-500',
    'text-[#e8f5ee]': 'text-gray-100',
    'text-[#c8e6d4]': 'text-gray-200'
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
                content = content.split(oldStr).join(newStr);
            }

            fs.writeFileSync(fullPath, content);
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Hex color revert to dark mode tailwind classes complete!');
