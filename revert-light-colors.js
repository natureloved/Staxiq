import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = {
    // We only revert the Light Mode colors that were injected
    'bg-[#ffffff]': 'bg-white',
    'bg-[#f0faf4]': 'bg-slate-50',
    'border-[#c8e6d4]': 'border-gray-200',
    'text-[#0d2b1a]': 'text-gray-900',
    'text-[#5a8a70]': 'text-gray-600'
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
console.log('Hex color revert to light mode tailwind classes complete!');
