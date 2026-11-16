import { BRAND_NAME } from '../config.js';
import { logoIcon } from './logo.js';

// Pazienti di esempio (nomi fittizi). Aderenza = % di alimenti spuntati negli ultimi 7 giorni.
export const PATIENTS = [
  { name: 'Giulia R.', plan: 'Piano di prova · sett. 2', today: '9/15', adherence: 92 },
  { name: 'Marco B.', plan: 'Piano estivo · sett. 5', today: '0/14', adherence: 38, alert: true },
  { name: 'Sara L.', plan: 'Piano di partenza · sett. 1', today: '11/16', adherence: 85 },
  { name: 'Luca F.', plan: 'Piano di prova · sett. 3', today: '6/15', adherence: 74 },
  { name: 'Elena M.', plan: 'Piano estivo · sett. 2', today: '12/15', adherence: 88 },
  { name: 'Paolo C.', plan: 'Piano di partenza · sett. 4', today: '5/13', adherence: 67 },
];

const avg = Math.round(PATIENTS.reduce((s, p) => s + p.adherence, 0) / PATIENTS.length);

const row = (p, i) => `
  <li class="dash-row${p.alert ? ' is-alert' : ''}" data-patient="${i}">
    <span class="dash-avatar">${p.name[0]}</span>
    <span class="dash-row__who"><b>${p.name}</b><span>${p.plan}</span></span>
    <span class="dash-chip">Oggi ${p.today}</span>
    <span class="dash-adh">
      <span class="dash-adh__val">${p.adherence}%</span>
      <span class="dash-adh__bar"><i style="--v:${p.adherence / 100}" data-adh></i></span>
    </span>
  </li>`;

function dashboard() {
  return `
  <div class="dash">
    <div class="dash-top">
      <span class="app__brand">${logoIcon({ size: 20, title: '' })}<span>${BRAND_NAME}</span></span>
      <span class="dash-pill">Studio</span>
      <span class="dash-soon">Anteprima · In arrivo</span>
      <span class="dash-me">A</span>
    </div>
    <div class="dash-body">
      <div class="ui-head">
        <span class="ui-eyebrow">I tuoi pazienti</span>
        <span class="ui-title">Dashboard</span>
        <span class="ui-sub">Aderenza al piano negli ultimi 7 giorni.</span>
      </div>
      <div class="dash-stats">
        <div class="ui-card dash-stat"><span>Pazienti collegati</span><b>${PATIENTS.length}</b></div>
        <div class="ui-card dash-stat"><span>Aderenza media</span><b>${avg}%</b></div>
        <div class="ui-card dash-stat"><span>Avvisi</span><b class="dash-warn">1</b></div>
      </div>
      <div class="dash-cols">
        <ul class="ui-card dash-list">${PATIENTS.map(row).join('')}</ul>
        <div class="dash-side">
          <div class="dash-alert" data-alert>
            <span class="dash-alert__icon" aria-hidden="true">!</span>
            <span><b>Marco non segna i pasti da 3 giorni</b><span>Ultimo pasto spuntato: lunedì, pranzo.</span></span>
            <span class="dash-alert__btn">Scrivi a Marco</span>
          </div>
          <div class="ui-card dash-feed">
            <span class="dash-feed__title">In tempo reale</span>
            <span class="dash-feed__item" data-live><i></i>Giulia ha spuntato il pranzo <em>adesso</em></span>
            <span class="dash-feed__item"><i></i>Sara ha bevuto 1,6 l d'acqua <em>12 min</em></span>
            <span class="dash-feed__item"><i></i>Elena ha completato la colazione <em>1 h</em></span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

/** Laptop in CSS con la dashboard del nutrizionista (funzione in arrivo). La dimensione si regola con --lw. */
export function laptop({ className = '' } = {}) {
  return `
<div class="laptop ${className}" role="img" aria-label="Anteprima della dashboard ${BRAND_NAME} per il nutrizionista, in arrivo: pazienti con aderenza al piano e avvisi">
  <div class="laptop__lid">
    <span class="laptop__cam"></span>
    <div class="laptop__screen" aria-hidden="true">${dashboard()}</div>
  </div>
  <div class="laptop__base"><span></span></div>
</div>`;
}

export function mountLaptops(root = document) {
  root.querySelectorAll('[data-laptop-mount]').forEach((el) => {
    el.outerHTML = laptop({ className: el.className });
  });
}
