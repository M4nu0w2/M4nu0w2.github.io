import { icons } from './icons.js';
import { logoIcon } from './logo.js';

// Dati di esempio (piano fittizio). 15 alimenti in tutto, come nell'app.
export const PLAN = {
  name: 'Piano di prova',
  days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  water: { done: 0, goal: '2,4' },
  meals: [
    {
      id: 'colazione',
      emoji: '🌅',
      name: 'Colazione',
      foods: [
        { name: 'Latte scremato', qty: '1 bicchiere', note: '= 200 g · 1 bicchiere latte = 200 ml' },
        { name: "Fiocchi d'avena", qty: '1 bicchiere', note: '= 40 g · 1 bicchiere fiocchi = 40 g' },
      ],
    },
    {
      id: 'meta-mattina',
      emoji: '🍎',
      name: 'Metà mattina',
      foods: [
        { name: 'Mela', qty: '150 g' },
        { name: 'Noci sgusciate', qty: '15 g' },
      ],
    },
    {
      id: 'pranzo',
      emoji: '🥗',
      name: 'Pranzo',
      foods: [
        { name: 'Pasta integrale', qty: '80 g' },
        { name: 'Zucchine', qty: '200 g' },
        { name: 'Olio extravergine', qty: '1 cucchiaio', note: '= 10 g' },
        { name: 'Pane integrale', qty: '50 g' },
        { name: 'Parmigiano', qty: '10 g' },
      ],
    },
    {
      id: 'merenda',
      emoji: '🥛',
      name: 'Merenda',
      foods: [
        { name: 'Yogurt greco 0%', qty: '1 vasetto', note: '= 150 g' },
        { name: 'Frutti di bosco', qty: '100 g' },
      ],
    },
    {
      id: 'cena',
      emoji: '🐟',
      name: 'Cena',
      foods: [
        { name: 'Salmone', qty: '150 g' },
        { name: 'Insalata mista', qty: 'a volontà' },
        { name: 'Olio extravergine', qty: '1 cucchiaio', note: '= 10 g' },
        { name: 'Pane integrale', qty: '50 g' },
      ],
    },
  ],
};

export const TOTAL_FOODS = PLAN.meals.reduce((n, m) => n + m.foods.length, 0);

const pageHead = (eyebrow, title, sub) => `
  <div class="ui-head">
    <span class="ui-eyebrow">${eyebrow}</span>
    <h3 class="ui-title">${title}</h3>
    ${sub ? `<p class="ui-sub">${sub}</p>` : ''}
  </div>`;

const foodRow = (f, i) => `
  <li class="ui-food" data-food="${i}">
    <span class="ui-check" aria-hidden="true">${icons.check}</span>
    <span class="ui-food__body">
      <span class="ui-food__name">${f.name}</span>
      ${f.note ? `<span class="ui-food__note">${f.note}</span>` : ''}
    </span>
    <span class="ui-food__qty">${f.qty}</span>
  </li>`;

let foodIndex = 0;
const mealCard = (m) => `
  <div class="ui-card ui-meal" data-meal="${m.id}">
    <div class="ui-meal__head">
      <span class="ui-meal__emoji" aria-hidden="true">${m.emoji}</span>
      <span class="ui-meal__name">${m.name}</span>
      <span class="ui-pill" data-meal-count>0/${m.foods.length}</span>
    </div>
    <ul class="ui-foods">${m.foods.map((f) => foodRow(f, foodIndex++)).join('')}</ul>
  </div>`;

export function screenOggi() {
  foodIndex = 0;
  return `
  <section class="screen" data-screen="oggi" aria-label="Schermata Oggi">
    <div class="screen__scroll">
      ${pageHead('Il tuo piano attivo', 'Il menu di oggi', PLAN.name)}
      <div class="ui-actions">
        <span class="ui-btn">Gestisci piani</span>
        <span class="ui-btn ui-btn--primary" data-export>Esporta lista della spesa</span>
      </div>
      <div class="ui-grid">
        <div class="ui-card ui-stat">
          <span class="ui-stat__label">Progressi del giorno</span>
          <span class="ui-stat__value"><b data-progress>0</b> / ${TOTAL_FOODS} alimenti</span>
          <span class="ui-bar"><span class="ui-bar__fill" data-progress-bar></span></span>
        </div>
        <div class="ui-card ui-stat">
          <span class="ui-stat__label">Idratazione</span>
          <span class="ui-stat__value"><b data-water>0</b> / ${PLAN.water.goal} litri</span>
        </div>
        <div class="ui-card ui-stat ui-span-2">
          <span class="ui-stat__label">Il tuo piano</span>
          <span class="ui-stat__value"><b>7</b> giorni di menu</span>
        </div>
      </div>
      <div class="ui-days" data-days>
        ${PLAN.days.map((d, i) => `<span class="ui-day${i === 0 ? ' is-active' : ''}">${d}</span>`).join('')}
      </div>
      <div class="ui-meals">${PLAN.meals.map(mealCard).join('')}</div>
    </div>
  </section>`;
}

export function screenPiani() {
  const plan = (title, meta, active) => `
    <div class="ui-card ui-plan${active ? ' is-active' : ''}">
      <span class="ui-plan__icon">${icons.plan}</span>
      <span class="ui-plan__body">
        <span class="ui-badge${active ? ' ui-badge--mint' : ''}">${active ? 'Attivo' : 'Precedente'}</span>
        <span class="ui-plan__title">${title}</span>
        <span class="ui-plan__meta">${meta}</span>
      </span>
    </div>`;
  return `
  <section class="screen" data-screen="piani" aria-label="Schermata I miei piani">
    <div class="screen__scroll">
      ${pageHead('Il tuo percorso, nel tempo', 'I miei piani', 'Un piano attivo. Tutti i precedenti sempre a disposizione.')}
      <span class="ui-btn ui-btn--primary ui-btn--inline">+ Nuovo piano</span>
      <div class="ui-grid">
        <div class="ui-card ui-stat"><span class="ui-stat__label">Piani conservati</span><span class="ui-stat__value"><b>3</b></span></div>
        <div class="ui-card ui-stat"><span class="ui-stat__label">Piano attivo</span><span class="ui-stat__value"><b>1</b> alla volta</span></div>
        <div class="ui-card ui-stat ui-span-2"><span class="ui-stat__label">Nello storico</span><span class="ui-stat__value"><b>2</b></span></div>
      </div>
      <span class="ui-input ui-input--placeholder">Cerca un piano…</span>
      <div class="ui-filters">
        <span class="ui-filter is-active">Tutti</span>
        <span class="ui-filter">Attivo</span>
        <span class="ui-filter">Precedenti</span>
      </div>
      <div class="ui-plans">
        ${plan(PLAN.name, 'Caricato il 6 ottobre · 7 giorni', true)}
        ${plan('Piano estivo', 'Giugno – settembre · 7 giorni')}
        ${plan('Piano di partenza', 'Marzo – maggio · 7 giorni')}
      </div>
    </div>
  </section>`;
}

export function screenAssistente() {
  return `
  <section class="screen" data-screen="assistente" aria-label="Schermata Assistente">
    <div class="screen__scroll">
      ${pageHead('Gemini', 'Assistente', 'Uno spazio per le tue domande generali.')}
      <span class="ui-btn ui-btn--block ui-btn--disabled">Nuova conversazione</span>
      <span class="ui-badge ui-badge--slate">In preparazione</span>
      <p class="ui-text">I piani e i PDF restano nel tuo archivio e non vengono inviati. Le domande e le risposte vengono elaborate da Google; la cronologia rimane solo in questa pagina e si svuota quando la lasci. Evita dati personali o sanitari.</p>
      <div class="ui-empty">
        <span class="ui-empty__title">Assistente non ancora attivo</span>
        <p>La configurazione di Gemini è in preparazione. Potrai iniziare una conversazione quando sarà disponibile.</p>
      </div>
    </div>
  </section>`;
}

export function screenSettaggi() {
  const row = (title, desc, control) => `
    <div class="ui-setting">
      <span><span class="ui-setting__title">${title}</span><span class="ui-setting__desc">${desc}</span></span>
      ${control}
    </div>`;
  const check = (on) => `<span class="ui-check ui-check--setting${on ? ' is-checked' : ''}" aria-hidden="true">${icons.check}</span>`;
  const radio = (on) => `<span class="ui-radio${on ? ' is-checked' : ''}" aria-hidden="true"></span>`;
  return `
  <section class="screen" data-screen="settaggi" aria-label="Schermata Settaggi">
    <div class="screen__scroll">
      ${pageHead('Il tuo account', 'Settaggi', 'Valgono per tutti i tuoi piani. Cambiare piano attivo non li modifica.')}
      <div class="ui-card ui-settings">
        <span class="ui-settings__title">Tracking</span>
        ${row('Tracking acqua', 'Bicchieri bevuti nella pagina Oggi.', check(true))}
        ${row('Tracking olio', 'Quantità di olio usata sulle voci olio spuntate.', check(false))}
        <p class="ui-settings__note">Spegnere un tracking lo nasconde: lo storico resta e ricompare quando lo riaccendi.</p>
      </div>
      <div class="ui-card ui-settings">
        <span class="ui-settings__title">Unità</span>
        ${row('Unità del PDF', 'Cucchiai, bicchieri e porzioni come nel piano, con i grammi in nota.', radio(true))}
        ${row('Solo grammi', 'Tutte le quantità convertite in grammi.', radio(false))}
      </div>
    </div>
  </section>`;
}

export function modalCalcolatore() {
  const field = (label, value, select, attr = '') => `
    <span class="ui-label">${label}</span>
    <span class="ui-input${select ? ' ui-input--select' : ''}" ${attr}>${value}${select ? icons.chevron : ''}</span>`;
  return `
  <div class="app__modal" data-modal="calcolatore" aria-label="Calcolatore porzioni">
    <div class="ui-modal">
      <div class="ui-modal__head">
        <span class="ui-modal__title">Calcolatore porzioni</span>
        <span class="ui-icon-btn" aria-hidden="true">${icons.close}</span>
      </div>
      <p class="ui-text">Stime indicative: la cottura e la misura domestica possono variare.</p>
      <span class="ui-section">Da crudo a cotto</span>
      ${field('Alimento', 'Pasta', true)}
      ${field('Peso crudo (g)', '<span data-raw>80</span>', false)}
      <span class="ui-result"><b data-cooked>176</b> g cotti</span>
      <span class="ui-section">Misure domestiche</span>
      ${field('Misura', 'Cucchiaino olio', true)}
      ${field('Quantità', '1', false)}
      <span class="ui-result"><b data-measure>4</b> g</span>
    </div>
  </div>`;
}

export function splash() {
  return `<div class="app__splash" aria-hidden="true"><span class="app__splash-glow"></span>${logoIcon({ size: 96, title: '' })}</div>`;
}
