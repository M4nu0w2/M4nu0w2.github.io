import { BRAND_NAME } from '../config.js';

// Geometria del logo: tratti monolinea arrotondati, x-height 22–50 su viewBox alto 64.
// Ogni lettera è un <g> con classe propria per l'intro animata.
const STROKE = 7;

export const LEAF_PATH = 'M0 0 C2.5 -6.5 8 -10.5 15 -10.5 C13.5 -4 8.5 0.8 0 0 Z';
const LEAF_RIB = 'M2 -1.2 L11.5 -7.6';

const N_PATH = 'M0 22 V50 M0 34 C0 26.5 5.5 22 13 22 C20.5 22 26 26.5 26 34 V50';
const U_PATH = 'M0 22 V38 C0 45.5 5.5 50 13 50 C20.5 50 26 45.5 26 38 M26 22 V50';
const T_PATH = 'M7 11 V41 C7 47 10 50 16 50 M0 22 H16';
const R_PATH = 'M0 22 V50 M0 34 C0 26.5 5.5 22 14 22';
const A_PATH = 'M27 36 A13.5 13.5 0 1 1 27 35.9 M27 22 V50';

let uid = 0;

const gradient = (id) => `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6EE7B7"/>
    <stop offset="1" stop-color="#10B981"/>
  </linearGradient>`;

export const leafSvg = (transform = '') => `
  <g class="logo-leaf" transform="${transform}">
    <path d="${LEAF_PATH}" fill="#A3E635"/>
    <path d="${LEAF_RIB}" stroke="#4D7C0F" stroke-width="1.2" stroke-linecap="round" fill="none"/>
  </g>`;

/** Icona: "n" + foglia in alto a destra. */
export function logoIcon({ size = 32, className = '', title = BRAND_NAME } = {}) {
  const id = `nGrad${++uid}`;
  return `
<svg class="logo-icon ${className}" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${title}">
  <defs>${gradient(id)}</defs>
  <g fill="none" stroke="url(#${id})" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
    <path class="logo-n" d="${N_PATH}" transform="translate(14 0)"/>
  </g>
  ${leafSvg('translate(40 20) rotate(-8) scale(1.35)')}
</svg>`;
}

/** Logotipo "nutrà": la foglia è l'accento grave sulla "a". */
export function logoWordmark({ height = 28, className = '', title = BRAND_NAME } = {}) {
  const id = `nGrad${++uid}`;
  const w = Math.round((160 / 64) * height);
  return `
<svg class="logo-wordmark ${className}" width="${w}" height="${height}" viewBox="0 0 160 64" role="img" aria-label="${title}">
  <defs>${gradient(id)}</defs>
  <g fill="none" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round">
    <path class="logo-n" d="${N_PATH}" stroke="url(#${id})" transform="translate(4 0)"/>
    <g stroke="currentColor">
      <path class="logo-letter logo-u" d="${U_PATH}" transform="translate(43 0)"/>
      <path class="logo-letter logo-t" d="${T_PATH}" transform="translate(80 0)"/>
      <path class="logo-letter logo-r" d="${R_PATH}" transform="translate(106 0)"/>
      <path class="logo-letter logo-a" d="${A_PATH}" transform="translate(128 0)"/>
    </g>
  </g>
  ${leafSvg('translate(134 3) rotate(75)')}
</svg>`;
}

/** Icona + nome testuale (come nell'header dell'app). */
export function logoLockup({ size = 22 } = {}) {
  return `<span class="logo-lockup">${logoIcon({ size, title: '' })}<span>${BRAND_NAME}</span></span>`;
}

/** Monta i loghi dichiarati in HTML: <span data-logo="wordmark|icon|lockup" data-size="28"></span> */
export function mountLogos(root = document) {
  root.querySelectorAll('[data-logo]').forEach((el) => {
    const size = Number(el.dataset.size) || undefined;
    const kind = el.dataset.logo;
    if (kind === 'icon') el.innerHTML = logoIcon({ size });
    else if (kind === 'lockup') el.innerHTML = logoLockup({ size });
    else el.innerHTML = logoWordmark({ height: size });
  });
}
