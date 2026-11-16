import { BRAND_NAME } from '../config.js';
import { icons } from './icons.js';
import { logoIcon } from './logo.js';
import {
  screenOggi,
  screenPiani,
  screenAssistente,
  screenSettaggi,
  modalCalcolatore,
  splash,
} from './screens.js';

const NAV = [
  { id: 'oggi', label: 'Oggi' },
  { id: 'piani', label: 'I miei piani', badge: '1' },
  { id: 'assistente', label: 'Assistente' },
  { id: 'settaggi', label: 'Settaggi' },
  { id: 'calcolatore', label: 'Calcolatore' },
];

const navItem = (n) => `
  <span class="app__nav-item" data-nav-item="${n.id}">
    <span class="app__nav-icon">${icons[n.id]}${n.badge ? `<span class="app__nav-badge">${n.badge}</span>` : ''}</span>
    <span>${n.label}</span>
  </span>`;

/**
 * Telefono in CSS con l'app ricostruita.
 * @param {object} o
 * @param {string} o.screen   schermata iniziale: oggi | piani | assistente | settaggi | calcolatore
 * @param {'on'|'off'|'splash'} o.state  schermo spento, splash o app
 * @param {string} o.label    aria-label del mockup
 */
export function phone({ screen = 'oggi', state = 'on', label, time = '14:02', className = '' } = {}) {
  return `
<div class="phone ${className}" data-phone data-initial="${screen}" data-state="${state}" role="img" aria-label="${label ?? `App ${BRAND_NAME} sul telefono`}">
  <div class="phone__screen">
    <div class="app" aria-hidden="true">
      <div class="app__status">
        <span class="app__time">${time}</span>
        <span class="app__status-icons">${icons.signal}${icons.wifi}${icons.battery}</span>
      </div>
      <div class="app__header">
        <span class="app__brand">${logoIcon({ size: 22, title: '' })}<span>${BRAND_NAME}</span></span>
        <span class="app__avatar">M</span>
        <span class="app__logout">Esci</span>
      </div>
      <div class="app__main">
        ${screenOggi()}
        ${screenPiani()}
        ${screenAssistente()}
        ${screenSettaggi()}
      </div>
      <nav class="app__nav">${NAV.map(navItem).join('')}</nav>
      ${modalCalcolatore()}
      ${splash()}
    </div>
    <span class="phone__island"><i></i></span>
    <span class="phone__off"></span>
  </div>
</div>`;
}

/** Cambia schermata attiva + voce della bottom nav. "calcolatore" apre il modale sopra la schermata corrente. */
export function setScreen(phoneEl, name) {
  const isModal = name === 'calcolatore';
  if (!isModal) {
    phoneEl.querySelectorAll('.screen').forEach((s) => s.classList.toggle('is-active', s.dataset.screen === name));
  }
  phoneEl.querySelector('[data-modal="calcolatore"]').classList.toggle('is-open', isModal);
  phoneEl.querySelectorAll('[data-nav-item]').forEach((n) => n.classList.toggle('is-active', n.dataset.navItem === name));
}

/** Monta i telefoni dichiarati in HTML: <div data-phone-mount="oggi" data-state="on"></div> */
export function mountPhones(root = document) {
  root.querySelectorAll('[data-phone-mount]').forEach((el) => {
    const screen = el.dataset.phoneMount || 'oggi';
    el.outerHTML = phone({ screen, state: el.dataset.state, label: el.dataset.label, className: el.className });
  });
  root.querySelectorAll('[data-phone]').forEach((p) => {
    // La schermata di base resta "oggi" sotto al modale del calcolatore.
    setScreen(p, 'oggi');
    if (p.dataset.initial !== 'oggi') setScreen(p, p.dataset.initial);
  });
}
