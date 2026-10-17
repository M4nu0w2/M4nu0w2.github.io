import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TOTAL_FOODS } from '../components/screens.js';
import { anchors } from '../anchors.js';

gsap.registerPlugin(ScrollTrigger);

// Storyboard completo solo su desktop con animazioni attive; altrove resta il layout impilato (fase 6).
const DESKTOP = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)';

// Quanti px di scroll per ogni secondo di timeline (in frazioni di viewport).
const SCROLL_PER_UNIT = 0.33; // ~137vh per scena

export function initStory() {
  const story = document.querySelector('[data-story]');
  if (!story) return;
  gsap.matchMedia().add(DESKTOP, () => {
    story.classList.add('is-pinned');
    const cleanup = buildStory(story);
    return () => {
      cleanup();
      story.classList.remove('is-pinned');
    };
  });
}

function buildStory(story) {
  const $ = (sel, root = story) => root.querySelector(sel);
  const $$ = (sel, root = story) => [...root.querySelectorAll(sel)];
  const vw = () => window.innerWidth;
  const vh = () => window.innerHeight;

  const wrap = $('.story__phone');
  const phone = $('[data-phone]', wrap);
  const glow = $('.story__glow');
  const pdf = $('.pdf');
  const rows = $$('.pdf__row');
  const receipt = $('.receipt');
  const texts = $$('[data-scene] .scene__text');
  const hint = $('.scroll-hint');

  const screens = Object.fromEntries($$('.screen', phone).map((s) => [s.dataset.screen, s]));
  const oggiScroll = $('.screen__scroll', screens.oggi);
  const pianiScroll = $('.screen__scroll', screens.piani);
  const meals = $$('.ui-meal', screens.oggi);
  const foods = $$('.ui-food', screens.oggi);
  const days = $$('.ui-day', screens.oggi);
  const modal = $('[data-modal]', phone);
  const foodLists = meals.map((m) => $('.ui-foods', m));

  // Lo stato "a scatti" (spunte, nav, filtri, contatori) è derivato dal tempo della timeline in sync():
  // resta corretto anche quando ScrollTrigger la riposiziona senza lanciare callback (refresh, resize).
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: () => sync() });

  // ---------- Helper ----------

  /** Evento a scatto reversibile: fwd quando la timeline supera `at` in avanti, back all'indietro. */
  const marks = [];
  const step = (at, fwd, back) => marks.push({ at, fwd, back, on: false });
  const paints = [];

  // Pose del telefono (x/y in px dal centro dello stage). fromTo espliciti = stati deterministici anche dopo un resize.
  const POSE = {
    hero: { x: 0, y: () => vh() * 0.4, scale: 1, rotationX: 16, rotationY: -18, rotationZ: 4 },
    s1: { x: () => vw() * 0.25, y: 0, scale: 0.82, rotationX: 0, rotationY: -12, rotationZ: 0 },
    s2: { x: () => -vw() * 0.22, y: 0, scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0 },
    s3: { x: () => vw() * 0.21, y: 0, scale: 0.96, rotationX: 4, rotationY: -16, rotationZ: 3 },
    s4: { x: () => -vw() * 0.22, y: 0, scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0 },
    s5: { x: () => vw() * 0.22, y: 0, scale: 0.96, rotationX: 0, rotationY: -10, rotationZ: 0 },
  };
  let pose = POSE.hero;
  const move = (next, at, duration = 1) => {
    tl.fromTo(wrap, { ...pose }, { ...next, duration, immediateRender: at === 0 }, at);
    tl.fromTo(glow, { x: pose.x, y: pose.y }, { x: next.x, y: next.y, duration, immediateRender: at === 0 }, at);
    pose = next;
  };

  // Scroll interno delle schermate: porta un elemento in cima all'area contenuti.
  const offsetOf = (el) => () => -(el.offsetTop - 14);
  const scrollPos = { oggi: 0, piani: 0 };
  const scrollScreen = (name, to, at, duration = 0.7) => {
    const el = name === 'oggi' ? oggiScroll : pianiScroll;
    tl.fromTo(el, { y: scrollPos[name] }, { y: to, duration, immediateRender: false }, at);
    scrollPos[name] = to;
  };

  const textIn = (i, at) =>
    tl.fromTo(texts[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', immediateRender: false }, at);
  const textOut = (i, at) =>
    tl.fromTo(texts[i], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -40, duration: 0.5, ease: 'power2.in', immediateRender: false }, at);

  const setNav = (name) =>
    $$('[data-nav-item]', phone).forEach((n) => n.classList.toggle('is-active', n.dataset.navItem === name));

  const switchScreen = (from, to, at) => {
    tl.fromTo(screens[from], { autoAlpha: 1, xPercent: 0 }, { autoAlpha: 0, xPercent: -12, duration: 0.45, ease: 'power2.in', immediateRender: false }, at);
    tl.fromTo(screens[to], { autoAlpha: 0, xPercent: 12 }, { autoAlpha: 1, xPercent: 0, duration: 0.5, ease: 'power2.out', immediateRender: false }, at + 0.3);
    step(at + 0.3, () => setNav(to), () => setNav(from));
  };

  const updatePills = () =>
    meals.forEach((m) => {
      const items = $$('.ui-food', m);
      $('[data-meal-count]', m).textContent = `${items.filter((f) => f.classList.contains('is-checked')).length}/${items.length}`;
    });
  const tick = (i, at) =>
    step(
      at,
      () => (foods[i].classList.add('is-checked'), updatePills()),
      () => (foods[i].classList.remove('is-checked'), updatePills()),
    );

  // Contatori
  const progressEl = $('[data-progress]', phone);
  const barEl = $('[data-progress-bar]', phone);
  // Due tratti di conteggio (0→4, 4→9) su oggetti separati: un solo oggetto condiviso
  // verrebbe sovrascritto dal tween disegnato per ultimo durante i refresh.
  const progressA = { v: 0 };
  const progressB = { v: 4 };
  const paintProgress = () => {
    const v = progressA.v + progressB.v - 4;
    progressEl.textContent = Math.round(v);
    barEl.style.transform = `scaleX(${v / TOTAL_FOODS})`;
  };
  const waterEl = $('[data-water]', phone);
  const water = { v: 0 };
  const paintWater = () => {
    waterEl.textContent = water.v < 0.05 ? '0' : water.v.toFixed(1).replace('.', ',');
  };
  const counter = (obj, from, to, at, duration, paint) => {
    paints.push(paint);
    tl.fromTo(obj, { v: from }, { v: to, duration, ease: 'none', immediateRender: false }, at);
  };

  let shownDay = 0;
  const day = { d: 0 };
  const sync = () => {
    const t = tl.time();
    // Prima spegne (dal più recente), poi accende (dal più vecchio): l'ordine conta per nav e filtri.
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i];
      if (m.on && t < m.at) (m.on = false), m.back();
    }
    for (const m of marks) if (!m.on && t >= m.at) (m.on = true), m.fwd();
    paints.forEach((paint) => paint());
    const d = Math.round(day.d);
    if (d !== shownDay) {
      shownDay = d;
      days.forEach((el, k) => el.classList.toggle('is-active', k === d));
      gsap.fromTo(foodLists, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.07, overwrite: true });
    }
  };

  // Posizione di layout (senza trasformazioni) rispetto alla sezione.
  const layoutBox = (el) => {
    let x = 0;
    let y = 0;
    for (let n = el; n && n !== story; n = n.offsetParent) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  const evalPose = (p, key) => (typeof p[key] === 'function' ? p[key]() : p[key]);

  /** Dove appare a schermo il centro di `el` (dentro il telefono) quando il telefono è nella posa `p`. */
  const pointInPhone = (el, p, innerScroll = 0) => {
    const w = layoutBox(wrap);
    const b = layoutBox(el);
    const s = evalPose(p, 'scale');
    const px = b.x + b.w / 2 - w.x;
    const py = b.y + b.h / 2 - w.y + innerScroll;
    return { x: w.x + evalPose(p, 'x') + (px - w.w / 2) * s, y: w.y + evalPose(p, 'y') + (py - w.h / 2) * s };
  };

  // ---------- Stato iniziale ----------
  gsap.set([wrap, glow], { xPercent: -50, yPercent: -50 });
  gsap.set(wrap, { transformPerspective: 1600 });
  gsap.set(texts.slice(1), { autoAlpha: 0 });
  gsap.set([pdf, receipt], { autoAlpha: 0 });
  gsap.set(Object.values(screens), { autoAlpha: 0 });
  gsap.set(screens.oggi, { autoAlpha: 1 });
  gsap.set(modal, { autoAlpha: 0 });
  modal.classList.add('is-open'); // la visibilità ora la gestisce autoAlpha
  setNav('oggi');

  // ---------- Scena 0: hero ----------
  move(POSE.hero, 0, 0.01);

  // ---------- Scena 1: dal PDF all'app ----------
  tl.addLabel('scene1', 0.2);
  textOut(0, 0.2);
  tl.to(hint, { autoAlpha: 0, duration: 0.3 }, 0.2);
  move(POSE.s1, 0.2, 1);
  scrollScreen('oggi', offsetOf($('[data-days]', phone)), 0.5, 0.6);
  tl.to(meals, { autoAlpha: 0, duration: 0.3 }, 0.6);
  tl.fromTo(pdf, { autoAlpha: 0, y: 60, rotation: -6 }, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.7, ease: 'power3.out' }, 0.7);
  textIn(1, 0.9);

  const daysTop = offsetOf($('[data-days]', phone));
  rows.forEach((row, i) => {
    const at = 1.7 + i * 0.5;
    const target = () => pointInPhone(meals[i], POSE.s1, daysTop());
    const start = () => {
      const b = layoutBox(row);
      return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    };
    tl.to(row, { x: () => target().x - start().x, y: () => target().y - start().y, scale: 0.85, duration: 0.75, ease: 'power2.in' }, at);
    tl.to(row, { autoAlpha: 0, duration: 0.2, ease: 'none' }, at + 0.6);
    tl.fromTo(meals[i], { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)', immediateRender: false }, at + 0.65);
  });
  tl.fromTo(meals.slice(3), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }, 3.3);
  tl.to(pdf, { autoAlpha: 0, scale: 0.94, y: 30, duration: 0.6, ease: 'power2.in' }, 3.3);

  // ---------- Scena 2: il menu di oggi ----------
  tl.addLabel('scene2', 4.1);
  textOut(1, 4.1);
  move(POSE.s2, 4.1, 1.1);
  textIn(2, 4.8);
  tl.fromTo(day, { d: 0 }, { d: 2, duration: 1.4, ease: 'none', immediateRender: false }, 5.3);

  // ---------- Scena 3: spunta e traccia ----------
  tl.addLabel('scene3', 7.2);
  textOut(2, 7.2);
  move(POSE.s3, 7.2, 1.1);
  scrollScreen('oggi', offsetOf($('.ui-grid', phone)), 7.4, 0.8);
  textIn(3, 7.9);
  [0, 1, 2, 3].forEach((i, k) => tick(i, 8.4 + k * 0.28));
  counter(progressA, 0, 4, 8.4, 1.1, paintProgress);
  scrollScreen('oggi', offsetOf($('[data-meal="pranzo"]', phone)), 9.7, 0.6);
  [4, 5, 6, 7, 8].forEach((i, k) => tick(i, 10.4 + k * 0.22));
  counter(progressB, 4, 9, 10.4, 1.1, paintProgress);
  scrollScreen('oggi', offsetOf($('.ui-grid', phone)), 11.7, 0.6);
  counter(water, 0, 1.6, 12.1, 0.9, paintWater);

  // ---------- Scena 4: calcolatore e lista della spesa ----------
  tl.addLabel('scene4', 13.6);
  textOut(3, 13.6);
  move(POSE.s4, 13.6, 1.1);
  textIn(4, 14.3);
  tl.fromTo(modal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, immediateRender: false }, 14.2);
  tl.fromTo($('.ui-modal', modal), { y: 40, scale: 0.96 }, { y: 0, scale: 1, duration: 0.45, ease: 'power3.out', immediateRender: false }, 14.2);
  step(14.2, () => setNav('calcolatore'), () => setNav('oggi'));

  const cookedEl = $('[data-cooked]', modal);
  const cooked = { v: 80 };
  const result1 = cookedEl.parentElement;
  tl.fromTo(result1, { color: '#f1f5f9' }, { color: '#6ee7b7', duration: 0.3, immediateRender: false }, 14.8);
  counter(cooked, 80, 176, 14.8, 0.8, () => (cookedEl.textContent = Math.round(cooked.v)));
  const measureEl = $('[data-measure]', modal);
  const measure = { v: 0 };
  const result2 = measureEl.parentElement;
  tl.fromTo(result2, { color: '#f1f5f9' }, { color: '#6ee7b7', duration: 0.3, immediateRender: false }, 15.8);
  counter(measure, 0, 4, 15.8, 0.6, () => (measureEl.textContent = Math.round(measure.v)));

  tl.fromTo(modal, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.35, immediateRender: false }, 16.7);
  step(16.7, () => setNav('oggi'), () => setNav('calcolatore'));
  scrollScreen('oggi', 0, 16.8, 0.6);
  const exportBtn = $('[data-export]', phone);
  tl.to(exportBtn, { scale: 0.92, duration: 0.15, ease: 'power1.out' }, 17.5);
  tl.to(exportBtn, { scale: 1, duration: 0.2, ease: 'back.out(3)' }, 17.65);
  tl.fromTo(
    receipt,
    { autoAlpha: 0, x: 0, y: 0, rotation: 0 },
    { autoAlpha: 1, x: () => wrap.offsetWidth * 0.8, y: -20, rotation: 5, duration: 1.1, ease: 'power3.out', immediateRender: false },
    17.8,
  );

  // ---------- Scena 5: tutti i piani ----------
  tl.addLabel('scene5', 19.6);
  textOut(4, 19.6);
  tl.to(receipt, { autoAlpha: 0, x: () => wrap.offsetWidth * 0.5, y: 60, rotation: 10, duration: 0.6, ease: 'power2.in' }, 19.6);
  move(POSE.s5, 19.7, 1.1);
  switchScreen('oggi', 'piani', 20.0);
  textIn(5, 20.4);
  scrollScreen('piani', offsetOf($('.ui-filters', screens.piani)), 21.0, 0.8);

  const filters = $$('.ui-filter', screens.piani);
  const plans = $$('.ui-plan', screens.piani);
  const setFilter = (i) => filters.forEach((f, k) => f.classList.toggle('is-active', k === i));
  step(22.0, () => setFilter(1), () => setFilter(0));
  tl.to(plans.slice(1), { autoAlpha: 0.25, duration: 0.3 }, 22.0);
  tl.fromTo(plans[0], { scale: 1 }, { scale: 1.03, duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut', immediateRender: false }, 22.1);
  step(22.9, () => setFilter(2), () => setFilter(1));
  tl.to(plans.slice(1), { autoAlpha: 1, duration: 0.3 }, 22.9);
  tl.to(plans[0], { autoAlpha: 0.25, duration: 0.3 }, 22.9);
  step(23.8, () => setFilter(0), () => setFilter(2));
  tl.to(plans[0], { autoAlpha: 1, duration: 0.3 }, 23.8);

  // ---------- Scena 6: il collegamento (in arrivo) ----------
  const laptopWrap = $('.story__laptop');
  const link = $('.story__link');
  const linkPath = $('.story__link-path');
  const dots = $$('.story__link-dot');
  const adhBars = $$('[data-adh]', laptopWrap);
  const alertBox = $('[data-alert]', laptopWrap);
  const live = $('[data-live]', laptopWrap);

  const LPOSE = {
    out: { x: () => vw() * 0.8, y: () => vh() * 0.1, scale: 0.6 },
    s6: { x: () => vw() * 0.2, y: () => vh() * 0.1, scale: 0.6 },
    s7: { x: () => vw() * 0.19, y: () => vh() * 0.05, scale: 1 },
  };
  POSE.s6 = { x: () => -vw() * 0.27, y: () => vh() * 0.1, scale: 0.62, rotationX: 0, rotationY: 8, rotationZ: 0 };
  POSE.s7 = { x: () => -vw() * 0.62, y: () => vh() * 0.1, scale: 0.5, rotationX: 0, rotationY: 8, rotationZ: 0 };

  gsap.set(laptopWrap, { xPercent: -50, yPercent: -50, ...resolvePose(LPOSE.out) });
  gsap.set([live, alertBox], { autoAlpha: 0 });
  gsap.set(adhBars, { scaleX: 0 });

  // Linea telefono → laptop, calcolata dalle pose della scena 6 (si ricalcola a ogni refresh).
  const updateLink = () => {
    const W = story.offsetWidth;
    const H = story.offsetHeight;
    link.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const sx = W / 2 + evalPose(POSE.s6, 'x') + (wrap.offsetWidth * evalPose(POSE.s6, 'scale')) / 2;
    const sy = H / 2 + evalPose(POSE.s6, 'y');
    const ex = W / 2 + evalPose(LPOSE.s6, 'x') - (laptopWrap.offsetWidth * evalPose(LPOSE.s6, 'scale')) / 2;
    const ey = H / 2 + evalPose(LPOSE.s6, 'y') - 10;
    const dx = ex - sx;
    linkPath.setAttribute('d', `M${sx} ${sy} C${sx + dx * 0.35} ${sy - dx * 0.3} ${ex - dx * 0.35} ${ey - dx * 0.3} ${ex} ${ey}`);
  };
  updateLink();

  // Impulsi che viaggiano sulla linea: posizione derivata dal progresso (vedi sync).
  const pulses = dots.map(() => ({ p: 0 }));
  paints.push(() => {
    const len = linkPath.getTotalLength();
    dots.forEach((dot, i) => {
      const { p } = pulses[i];
      const pt = linkPath.getPointAtLength(p * len);
      dot.setAttribute('cx', pt.x);
      dot.setAttribute('cy', pt.y);
      dot.style.opacity = p > 0 && p < 1 ? 1 : 0;
    });
  });

  tl.addLabel('scene6', 24.6);
  textOut(5, 24.6);
  move(POSE.s6, 24.6, 1.1);
  switchScreen('piani', 'oggi', 24.8);
  tl.fromTo(laptopWrap, resolvePose(LPOSE.out, true), { ...LPOSE.s6, duration: 1.2, ease: 'power3.out', immediateRender: false }, 24.9);
  textIn(6, 25.5);
  tl.fromTo(linkPath, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, immediateRender: false }, 26.0);
  pulses.forEach((pulse, i) =>
    tl.fromTo(pulse, { p: 0 }, { p: 1, duration: 0.9, ease: 'power1.inOut', immediateRender: false }, 26.5 + i * 0.3),
  );
  tl.fromTo(live, { autoAlpha: 0, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power2.out', immediateRender: false }, 27.4);

  // ---------- Scena 7: dashboard nutrizionista (in arrivo) ----------
  tl.addLabel('scene7', 28.4);
  textOut(6, 28.4);
  tl.fromTo(link, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, immediateRender: false }, 28.4);
  move(POSE.s7, 28.4, 1.1);
  tl.fromTo([wrap, glow], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6, immediateRender: false }, 28.7);
  tl.fromTo(laptopWrap, resolvePose(LPOSE.s6, true), { ...LPOSE.s7, duration: 1.2, immediateRender: false }, 28.5);
  textIn(7, 29.2);
  tl.fromTo(adhBars, { scaleX: 0 }, { scaleX: (i, el) => Number(el.style.getPropertyValue('--v')), duration: 0.7, stagger: 0.08, ease: 'power2.out', immediateRender: false }, 29.6);
  tl.fromTo(alertBox, { autoAlpha: 0, y: 16, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.6)', immediateRender: false }, 30.3);
  tl.to({}, { duration: 1 }, 31); // pausa finale prima di sbloccare la sezione

  const st = ScrollTrigger.create({
    trigger: story,
    start: 'top top',
    end: () => `+=${tl.duration() * vh() * SCROLL_PER_UNIT}`,
    pin: true,
    scrub: 0.8,
    animation: tl,
    invalidateOnRefresh: true,
    anticipatePin: 1,
    onRefresh: () => (updateLink(), sync()),
  });
  sync();

  // I link #scena-dashboard ecc. puntano dentro la sezione pinnata: risolti come posizione di scroll.
  const labelScroll = (label) => () => st.start + (tl.labels[label] / tl.duration()) * (st.end - st.start);
  anchors.set('#scena-dashboard', labelScroll('scene7'));

  // Solo sviluppo: espone timeline e trigger per i controlli visivi automatici.
  if (import.meta.env.DEV) window.__story = { tl, st };
  return () => anchors.delete('#scena-dashboard');
}

/** Valuta le funzioni di una posa (x/y in base al viewport). `lazy` le lascia come funzioni per i tween. */
function resolvePose(pose, lazy = false) {
  if (lazy) return { ...pose };
  return Object.fromEntries(Object.entries(pose).map(([k, v]) => [k, typeof v === 'function' ? v() : v]));
}
