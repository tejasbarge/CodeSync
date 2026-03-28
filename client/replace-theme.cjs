const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src');

const replacements = {
    'bg-[#1e1e2e]': 'bg-[var(--bg-main)]',
    'bg-[#1e1e2e]/50': 'bg-[var(--bg-main)]/50',
    'bg-[#282a36]': 'bg-[var(--bg-card)]',
    'text-white': 'text-[var(--text-main)]',
    'text-gray-400': 'text-[var(--text-muted)]',
    'border-gray-700': 'border-[var(--border-color)]',
    'border-gray-700/50': 'border-[var(--border-color)]/50',
    'text-[#4aee88]': 'text-[var(--color-accent)]',
    'bg-[#4aee88]': 'bg-[var(--color-accent)]',
    'hover:bg-[#2bca6a]': 'hover:bg-[var(--color-accent-hover)]',
    'shadow-[#4aee88]/10': 'shadow-[var(--color-accent)]/10',
    'focus:border-[#4aee88]': 'focus:border-[var(--color-accent)]',
    'group-hover:border-[#4aee88]/30': 'group-hover:border-[var(--color-accent)]/30'
};

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = content;
            
            for (const [key, value] of Object.entries(replacements)) {
                // Escape logic for string replaceAll
                modified = modified.split(key).join(value);
            }
            
            if (content !== modified) {
                fs.writeFileSync(fullPath, modified, 'utf8');
                console.log(`Updated: ${file}`);
            }
        }
    });
}

processDirectory(directory);
console.log('Theming replacements complete!');
