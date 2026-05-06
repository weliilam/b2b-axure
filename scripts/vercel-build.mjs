// Vercel 构建入口：代替 npx vite build
// 逐个入口构建，避免 index.html 缺失问题
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const entriesPath = path.resolve(root, '.axhub/make/entries.json');

// 1. 扫描入口
console.log('--- 扫描入口 ---');
spawnSync('node', ['scripts/scan-entries.js'], { cwd: root, stdio: 'inherit' });

if (!fs.existsSync(entriesPath)) {
  console.error('入口清单未生成');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
const entries = manifest.js || {};
const keys = Object.keys(entries);

console.log(`发现 ${keys.length} 个 JS 入口`);

// 2. 只构建原型页面（prototypes/）
const targetKeys = keys.filter(k => k.startsWith('prototypes/'));

if (targetKeys.length === 0) {
  console.log('没有需要构建的原型入口');
  process.exit(0);
}

// 3. 清理 dist
const distDir = path.resolve(root, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

// 4. 逐个入口构建
let failed = false;
for (const key of targetKeys) {
  console.log(`\n==== 构建: ${key} ====\n`);
  const result = spawnSync('npx', ['vite', 'build'], {
    cwd: root,
    env: { ...process.env, ENTRY_KEY: key },
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`构建 ${key} 失败`);
    failed = true;
    break;
  }
}

if (failed) {
  process.exit(1);
}

// 5. 生成 HTML
console.log('\n--- 生成 HTML ---');
spawnSync('node', ['scripts/generate-dist-html.js'], { cwd: root, stdio: 'inherit' });

console.log('\n--- 构建完成 ---');
