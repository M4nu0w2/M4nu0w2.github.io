import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { BRAND_NAME, SEO, SITE_URL, CONTACT_EMAIL, WAITLIST_ENDPOINT } from './src/config.js';

// Sostituisce i segnaposto %BRAND% ecc. nell'HTML, così il nome vive solo in src/config.js
// ed è già presente nell'HTML statico (SEO, no-JS).
const brandHtml = () => ({
  name: 'brand-html',
  transformIndexHtml(html) {
    return html
      .replaceAll('%BRAND%', BRAND_NAME)
      .replaceAll('%SEO_TITLE%', SEO.title)
      .replaceAll('%SEO_DESCRIPTION%', SEO.description)
      .replaceAll('%SITE_URL%', SITE_URL)
      .replaceAll('%CONTACT_LINE%', CONTACT_EMAIL ? ` Email: ${CONTACT_EMAIL}` : '')
      .replace(/<a href="mailto:%CONTACT_EMAIL%">%CONTACT_EMAIL%<\/a>\s*/g, CONTACT_EMAIL ? `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
        ` : '')
      .replaceAll('%CONTACT_EMAIL%', CONTACT_EMAIL)
      .replaceAll('%WAITLIST_ENDPOINT%', WAITLIST_ENDPOINT)
      .replaceAll('%YEAR%', String(new Date().getFullYear()));
  },
});

export default defineConfig({
  plugins: [brandHtml()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
      },
    },
  },
});
