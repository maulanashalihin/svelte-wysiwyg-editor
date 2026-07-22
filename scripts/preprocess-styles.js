/**
 * Post-process svelte-package output: replace @apply directives in
 * <style> blocks with raw CSS so consumers don't need PostCSS/Tailwind
 * to process .svelte files from node_modules.
 *
 * Why: svelte-package copies .svelte files verbatim — it does NOT
 * preprocess <style> blocks. @apply is a Tailwind/PostCSS feature.
 * In Vite build mode, PostCSS runs on all CSS including from
 * node_modules, so @apply works. In Vite dev mode, PostCSS may not
 * process <style> blocks from node_modules .svelte files, leaving
 * @apply unprocessed and the component unstyled.
 *
 * This script reads each .svelte file in dist/, extracts <style>
 * blocks, runs them through PostCSS + Tailwind, and writes the
 * processed CSS back into the .svelte file.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = resolve(__dirname, '..', 'dist');

function findSvelteFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findSvelteFiles(fullPath));
    } else if (extname(fullPath) === '.svelte') {
      files.push(fullPath);
    }
  }
  return files;
}

async function processStyleBlocks(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  // Match all <style ...>...</style> blocks
  const styleRegex = /<style(\s[^>]*)?>([\s\S]*?)<\/style>/g;
  let hasChanges = false;

  const matches = [...content.matchAll(styleRegex)];
  if (matches.length === 0) return;

  for (const match of matches) {
    const [fullMatch, attrs, cssContent] = match;
    if (!cssContent.includes('@apply')) continue;

    hasChanges = true;
    const processed = await postcss([
      tailwindcss({ config: './tailwind.config.js' }),
      autoprefixer,
    ]).process(cssContent, { from: undefined });

    const replacement = `<style${attrs || ''}>${processed.css}</style>`;
    content = content.replace(fullMatch, replacement);
  }

  if (hasChanges) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  processed: ${filePath}`);
  }
}

async function main() {
  console.log('Preprocessing @apply in dist/ .svelte files...');
  const files = findSvelteFiles(DIST_DIR);
  for (const file of files) {
    await processStyleBlocks(file);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
