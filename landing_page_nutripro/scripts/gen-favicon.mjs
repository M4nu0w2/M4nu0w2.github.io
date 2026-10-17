// Genera public/favicon.svg dall'icona del logo (stessa geometria, sfondo scuro arrotondato).
import { writeFileSync, mkdirSync } from 'node:fs';
import { logoIcon } from '../src/components/logo.js';

const inner = logoIcon({ size: 64 })
  .replace(/^\s*<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#0B1220"/>
  ${inner.trim()}
</svg>
`;

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg);
console.log('favicon.svg generata');
