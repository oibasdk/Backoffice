#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple feature-flag reporter: scans .ts/.tsx/.js/.jsx files for common feature-flag patterns
const ROOT = process.cwd();
const IGNORES = ['node_modules', '.git', 'dist', 'build'];
const patterns = [
  /useFeatureFlag\(['"`]([\w-_.]+)['"`]\)/g,
  /featureFlags?\.([\w_]+)/g,
  /isFeatureOn\(['"`]([\w-_.]+)['"`]\)/g,
  /FEATURE_FLAG_([A-Z0-9_]+)/g,
];

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORES.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const results = {};

function scanFile(file) {
  if (!/\.(js|jsx|ts|tsx)$/.test(file)) return;
  let src = '';
  try { src = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  patterns.forEach((pat) => {
    let m;
    while ((m = pat.exec(src)) !== null) {
      const flag = m[1] || m[0];
      if (!results[flag]) results[flag] = new Set();
      results[flag].add(file.replace(ROOT + path.sep, ''));
    }
  });
}

walk(ROOT, scanFile);

const out = Object.entries(results).map(([flag, files]) => ({
  flag,
  files: Array.from(files).slice(0, 50),
  count: files.size,
})).sort((a,b)=>b.count-a.count);

const reportPath = path.join(ROOT, 'feature-flag-report.json');
fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), report: out }, null, 2));
console.log('Wrote', reportPath);
