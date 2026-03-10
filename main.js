// ─────────────────────────────────────────
// Logo parallax on scroll
// ─────────────────────────────────────────
const hero = document.getElementById('hero');

function initParallax() {
  const logoEl = document.querySelector('.hero-logo');
  if (!logoEl || !hero) return;

  function onScroll() {
    const scrollY = window.scrollY;
    const heroH   = hero.offsetHeight;

    // Only active while hero is in view
    if (scrollY > heroH) return;

    // Logo moves up at 35% of scroll speed — floats behind the page
    const y       = scrollY * 0.35;
    // Gentle fade starts at 60% through the hero, finishes at 100%
    const progress = scrollY / heroH;
    const opacity  = Math.max(1 - Math.max(progress - 0.6, 0) * 2.5, 0);

    logoEl.style.transform = `translateY(-${y}px)`;
    logoEl.style.opacity   = opacity;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

window.addEventListener('load', initParallax);

// ─────────────────────────────────────────
// Scroll reveal
// ─────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => revealObserver.observe(el));

// ─────────────────────────────────────────
// Nav border on scroll
// ─────────────────────────────────────────
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─────────────────────────────────────────
// Expand thumbnail on title OR image hover
// ─────────────────────────────────────────
document.querySelectorAll('.project').forEach(project => {
  const triggers = [
    project.querySelector('.project-text'),
    project.querySelector('.project-media')
  ].filter(Boolean);

  const hovering = new Set();

  triggers.forEach(el => {
    el.addEventListener('mouseenter', () => {
      hovering.add(el);
      project.classList.add('title-hover');
    });
    el.addEventListener('mouseleave', () => {
      hovering.delete(el);
      if (hovering.size === 0) project.classList.remove('title-hover');
    });
  });
});

// ─────────────────────────────────────────
// Smooth scroll for anchor links
// ─────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const id = this.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const offset = nav.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
