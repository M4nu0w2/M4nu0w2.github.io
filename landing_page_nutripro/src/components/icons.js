// Icone monolinea usate dentro l'app ricostruita (stroke = currentColor).
const svg = (body, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  oggi: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none"/>'),
  piani: svg('<rect x="4" y="4.5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16M4 13h16M4 16.5h16"/>'),
  assistente: svg('<path d="M12 3c.8 4.8 4.2 8.2 9 9-4.8.8-8.2 4.2-9 9-.8-4.8-4.2-8.2-9-9 4.8-.8 8.2-4.2 9-9z"/>', 'stroke-width="1.6"'),
  settaggi: svg('<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  calcolatore: svg('<path d="M4 8h15l-4-4M20 16H5l4 4"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: svg('<path d="m7 10 5 5 5-5"/>'),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="3.2"'),
  plan: svg('<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M5 9h14M5 12.5h14M5 16h14"/>'),
  signal: `<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>`,
  wifi: `<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 6.9a6.4 6.4 0 0 1 9 0l-1.5 1.5a4.3 4.3 0 0 0-6 0zM1 4.4a9.9 9.9 0 0 1 14 0l-1.5 1.5a7.8 7.8 0 0 0-11 0z" fill="currentColor"/></svg>`,
  battery: `<svg viewBox="0 0 27 13" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill="currentColor" opacity=".5"/></svg>`,
};
