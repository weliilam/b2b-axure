import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
fs.writeFileSync(path.join(distDir, 'index.html'), '<meta http-equiv="refresh" content="0;url=./prototypes/b2b-kanban.html">', 'utf8');
console.log('✓ dist/index.html redirect created');
