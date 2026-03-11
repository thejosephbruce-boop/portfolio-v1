// ─────────────────────────────────────────
// Hero scroll animation
// Phase 1 (0–50%): tagline → CREATIVE crossfade, logo parallax
// Phase 2 (50–100%): lockup exits upward
// ─────────────────────────────────────────
(function () {
  const hero       = document.getElementById('hero');
  const lockup     = document.getElementById('heroLockup');
  const logo       = document.getElementById('heroLogo');
  const tagline    = document.getElementById('heroTagline');
  const creative   = document.getElementById('heroCreative');
  const scrollWrap = document.getElementById('heroScrollWrap');

  if (!hero || !lockup) return;

  let rafId = null;

  function tick() {
    rafId = null;
    const maxScroll = hero.offsetHeight - window.innerHeight;
    if (maxScroll <= 0) return;

    const p = Math.min(1, Math.max(0, window.scrollY / maxScroll));

    // ── Tagline fades out: progress 0 → 0.35
    tagline.style.opacity = Math.max(0, 1 - p / 0.35).toFixed(3);

    // ── CREATIVE fades in: progress 0.2 → 0.5
    creative.style.opacity = Math.max(0, Math.min(1, (p - 0.2) / 0.3)).toFixed(3);

    // ── Scroll line fades in: progress 0.35 → 0.5
    scrollWrap.style.opacity = Math.max(0, Math.min(1, (p - 0.35) / 0.15)).toFixed(3);

    // ── Logo: subtle upward parallax during phase 1 (max 20px)
    const logoY = -(Math.min(p / 0.5, 1) * 20);
    logo.style.transform = `translateY(${logoY.toFixed(1)}px)`;

    // ── Lockup exits upward: phase 2 (0.5 → 1.0), ease-in curve
    const p2 = Math.max(0, (p - 0.5) / 0.5);
    const lockupY = -(p2 * p2) * (window.innerHeight * 1.2);
    lockup.style.transform = `translateY(${lockupY.toFixed(1)}px)`;
  }

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', tick);
  tick();
}());

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
// — scroll guard + open delay + close grace period
// ─────────────────────────────────────────
(function () {
  let isScrolling = false;
  let scrollTimer = null;

  window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { isScrolling = false; }, 250);
  }, { passive: true });

  document.querySelectorAll('.project').forEach(project => {
    const triggers = [
      project.querySelector('.project-text'),
      project.querySelector('.project-media')
    ].filter(Boolean);

    let openTimer  = null;
    let closeTimer = null;

    triggers.forEach(el => {
      el.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);        // cancel any pending close
        if (isScrolling) return;
        openTimer = setTimeout(() => {
          project.classList.add('title-hover');
        }, 1000);
      });

      el.addEventListener('mouseleave', () => {
        clearTimeout(openTimer);         // cancel pending open
        closeTimer = setTimeout(() => {  // grace period before closing
          project.classList.remove('title-hover');
        }, 200);
      });
    });
  });
}());

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
