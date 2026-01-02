#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current version from package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = packageJson.version;

// Generate cache version from package version + timestamp
const timestamp = Date.now();
const cacheVersion = `quick-store-v${version.replace(/\./g, '-')}-${timestamp}`;

console.log('Updating service worker cache version to:', cacheVersion);

// Read service worker file
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace cache name
swContent = swContent.replace(
  /const CACHE_NAME = 'quick-store-[^']*';/,
  `const CACHE_NAME = '${cacheVersion}';`
);

// Write back
fs.writeFileSync(swPath, swContent);
console.log('Service worker updated successfully');