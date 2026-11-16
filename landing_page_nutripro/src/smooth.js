import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { anchors } from './anchors.js';

gsap.registerPlugin(ScrollTrigger);

/** Smooth scroll con Lenis, sincronizzato col ticker di GSAP. Disattivo con prefers-reduced-motion. */
export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Link interni (#sezione) con lo stesso scroll morbido.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    const id = link?.getAttribute('href');
    if (!id || id.length < 2) return;
    const resolve = anchors.get(id);
    const target = resolve ? resolve() : document.querySelector(id);
    if (target == null) return;
    e.preventDefault();
    lenis.scrollTo(target);
    history.replaceState(null, '', id);
  });

  return lenis;
}
