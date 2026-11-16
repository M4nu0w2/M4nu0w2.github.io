import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Reveal allo scroll per feature grid e CTA (solo se l'utente non chiede movimento ridotto). */
export function initReveals() {
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set('.features .section-head > *, .feature', { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch('.features .section-head > *, .feature', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
    });

    gsap.from('.cta__text > *', {
      autoAlpha: 0,
      y: 30,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true },
    });
    gsap.from('.cta__visual', {
      autoAlpha: 0,
      y: 60,
      scale: 0.94,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true },
    });
  });
}
