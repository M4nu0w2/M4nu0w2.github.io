// Navbar: sfondo sfocato dopo i primi pixel di scroll.
export function initNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}
