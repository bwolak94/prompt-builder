// Post-build: copy manifest.json and icons into dist/
// Chrome loads the extension from dist/, so the manifest must live there.

import { copyFile, cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// Copy manifest
await copyFile(resolve(root, 'manifest.json'), resolve(dist, 'manifest.json'));
console.log('Copied manifest.json → dist/');

// Copy icons if they exist
const iconsDir = resolve(root, 'icons');
if (existsSync(iconsDir)) {
  await mkdir(resolve(dist, 'icons'), { recursive: true });
  await cp(iconsDir, resolve(dist, 'icons'), { recursive: true });
  console.log('Copied icons/ → dist/icons/');
} else {
  console.warn('No icons/ directory found — creating placeholder icons dir.');
  await mkdir(resolve(dist, 'icons'), { recursive: true });
}
