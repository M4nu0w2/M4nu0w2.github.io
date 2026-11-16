import './styles/main.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountLogos } from './components/logo.js';
import { initNav } from './components/nav.js';
import { mountPhones } from './components/phone.js';
import { mountLaptops } from './components/laptop.js';
import { playIntro } from './components/intro.js';
import { initWaitlist } from './components/waitlist.js';
import { initSmoothScroll } from './smooth.js';
import { initStory } from './story/story.js';
import { initReveals } from './reveal.js';

mountPhones();
mountLaptops();
mountLogos();
initNav();
initWaitlist();

const lenis = initSmoothScroll();
initStory();
initReveals();

/** Accensione del telefono nella hero: schermo spento, splash con l'icona, poi l'app. */
function powerOn() {
  const phone = document.querySelector('.story__phone [data-phone]');
  if (!phone) return;
  gsap
    .timeline()
    .call(() => (phone.dataset.state = 'splash'), null, 0.15)
    .call(() => (phone.dataset.state = 'on'), null, 1.3);
}

const introActive = document.documentElement.classList.contains('intro-active');
if (introActive) lenis?.stop();

playIntro({
  // Fine intro: il telefono sale dal basso e il testo della hero entra.
  onReveal(tl, at) {
    tl.from('.story__phone .phone', { y: () => window.innerHeight * 0.55, duration: 1, ease: 'power3.out' }, at)
      .from('.hero__text > *', { opacity: 0, y: 24, duration: 0.7, stagger: 0.08 }, at + 0.15)
      .from('.scroll-hint', { opacity: 0, duration: 0.6 }, at + 0.6)
      .call(powerOn, null, at + 0.3);
  },
  onDone() {
    lenis?.start();
    ScrollTrigger.refresh();
    if (!introActive) powerOn();
  },
});
