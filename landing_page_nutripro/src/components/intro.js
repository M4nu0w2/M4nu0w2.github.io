import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { logoWordmark } from './logo.js';

gsap.registerPlugin(MotionPathPlugin);

// Coordinate nel viewBox del logotipo (160×64).
const LEAF_ON_N = { x: 30, y: 20, rotation: -8, scale: 1.35 }; // come nell'icona
const LEAF_ON_A = { x: 134, y: 3, rotation: 75, scale: 1 }; // accento grave
const LEAF_FALL = 'M30 20 C36 -14 58 -30 76 -16 C90 -4 102 -36 117 -27 C128 -20 131 -7 134 3';
const N_CENTER_OFFSET = (80 - 17) / 160; // sposta la "n" al centro dello schermo

/**
 * Intro del logo (~2.6s). Attiva solo se lo script in <head> ha messo html.intro-active
 * (non con prefers-reduced-motion). Si salta con click, scroll, tocco o tasto.
 * @param {{ onReveal?: (tl: gsap.core.Timeline, at: number) => void, onDone?: () => void }} o
 *   onReveal aggiunge alla timeline l'entrata della pagina (es. il telefono che sale);
 *   onDone viene chiamata a intro finita (o subito, se l'intro non parte).
 */
export function playIntro({ onReveal, onDone } = {}) {
  const root = document.documentElement;
  const overlay = document.getElementById('intro');
  if (!overlay || !root.classList.contains('intro-active')) {
    onDone?.();
    return;
  }

  overlay.innerHTML = `<div class="intro__bg"></div><div class="intro__logo">${logoWordmark({ height: 64, title: '' })}</div>`;
  overlay.classList.add('is-ready');
  const wrap = overlay.querySelector('.intro__logo');
  const svg = wrap.querySelector('svg');
  const n = svg.querySelector('.logo-n');
  const letters = svg.querySelectorAll('.logo-letter');
  const leaf = svg.querySelector('.logo-leaf');

  // Maschera che rivela le lettere a partire dalla "n" + alone per il "pulse".
  svg.querySelector('defs').insertAdjacentHTML(
    'beforeend',
    `<clipPath id="introClip"><rect x="34" y="-40" width="0" height="140"/></clipPath>
     <radialGradient id="introPulse"><stop offset="0" stop-color="#10B981" stop-opacity=".85"/><stop offset="1" stop-color="#10B981" stop-opacity="0"/></radialGradient>`,
  );
  svg.insertAdjacentHTML('afterbegin', '<circle class="intro-pulse" cx="140" cy="12" r="24" fill="url(#introPulse)" opacity="0"/>');
  letters[0].parentNode.setAttribute('clip-path', 'url(#introClip)');
  const clipRect = svg.querySelector('#introClip rect');
  const pulse = svg.querySelector('.intro-pulse');

  const len = n.getTotalLength();
  gsap.set(n, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(svg, { xPercent: N_CENTER_OFFSET * 100 });

  // La foglia è guidata da un oggetto proxy che riscrive l'attributo transform:
  // stessa forma "translate rotate scale" del logo statico, quindi atterra esatta sull'accento.
  const leafState = { ...LEAF_ON_N, scale: 0 };
  const paintLeaf = () =>
    leaf.setAttribute(
      'transform',
      `translate(${leafState.x} ${leafState.y}) rotate(${leafState.rotation}) scale(${leafState.scale})`,
    );
  paintLeaf();

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onUpdate: paintLeaf });

  // 1. La "n" si disegna, la foglia spunta sopra.
  tl.to(n, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.1)
    .to(leafState, { scale: LEAF_ON_N.scale, duration: 0.4, ease: 'back.out(2.2)' }, 0.55)

    // 2. La "n" scivola a sinistra, le lettere escono una alla volta.
    .to(svg, { xPercent: 0, duration: 0.65, ease: 'power3.inOut' }, 0.85)
    .to(clipRect, { attr: { width: 130 }, duration: 0.6 }, 1.0)
    .from(letters, { opacity: 0, x: '-=10', duration: 0.45, stagger: 0.08 }, 1.0)

    // 3. La foglia si stacca e cade svolazzando fino alla "a".
    .to(leafState, { motionPath: { path: LEAF_FALL }, duration: 1.15, ease: 'sine.inOut' }, 1.1)
    .to(
      leafState,
      {
        keyframes: { rotation: [LEAF_ON_N.rotation, 25, -22, 24, -12, LEAF_ON_A.rotation], easeEach: 'sine.inOut' },
        scale: LEAF_ON_A.scale,
        duration: 1.15,
        ease: 'none',
      },
      1.1,
    )
    .fromTo(pulse, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1.3, duration: 0.25 }, 2.2)
    .to(pulse, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 2.45);

  // 4. FLIP: il logotipo vola nella navbar mentre lo sfondo si apre.
  const target = document.querySelector('.nav__brand svg');
  const FLIP_AT = 2.5;
  if (target) {
    tl.to(
      wrap,
      {
        x: () => target.getBoundingClientRect().left - svg.getBoundingClientRect().left,
        y: () => target.getBoundingClientRect().top - svg.getBoundingClientRect().top,
        scale: () => target.getBoundingClientRect().width / svg.getBoundingClientRect().width,
        transformOrigin: '0 0',
        duration: 0.75,
        ease: 'power3.inOut',
      },
      FLIP_AT,
    );
  }
  tl.to(overlay.querySelector('.intro__bg'), { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, FLIP_AT + 0.1);
  onReveal?.(tl, FLIP_AT + 0.15);

  const finish = () => {
    removeSkip();
    root.classList.remove('intro-active');
    overlay.remove();
    onDone?.();
  };
  tl.eventCallback('onComplete', finish);

  // Solo sviluppo: ?introAt=1.5 ferma l'intro a quel secondo (per controllare i fotogrammi).
  const at = import.meta.env.DEV && new URLSearchParams(location.search).get('introAt');
  if (at) {
    tl.pause(Number(at));
    paintLeaf();
    return;
  }

  // Skip: porta la timeline alla fine (gli stati finali restano coerenti).
  const skip = () => tl.progress(1);
  const events = ['pointerdown', 'wheel', 'touchmove', 'keydown'];
  const removeSkip = () => events.forEach((e) => window.removeEventListener(e, skip));
  events.forEach((e) => window.addEventListener(e, skip, { passive: true }));
}
