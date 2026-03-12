// ─────────────────────────────────────────
// Splash → Portfolio transition (+ reverse)
// ─────────────────────────────────────────
(function () {
  const splash      = document.getElementById('splash');
  const splashLogo  = document.getElementById('splashLogo');
  const tagline     = document.getElementById('splashTagline');
  const logoReveal  = document.getElementById('logoReveal');
  const projectList = document.querySelector('.project-list');
  if (!splash) return;

  let triggered    = false;
  let taglineTimer = null;   // tracked so we can cancel it if the user reverses quickly

  function reveal() {
    if (triggered) return;
    triggered = true;

    // Cancel any pending tagline fade-in from a previous reverse
    if (taglineTimer) { clearTimeout(taglineTimer); taglineTimer = null; }

    // 1. Fade out tagline immediately
    tagline.style.opacity = '0';

    // 2. After tagline fades, FLIP the logo from splash position to portfolio position
    setTimeout(() => {
      const from = splashLogo.getBoundingClientRect();
      const to   = logoReveal.getBoundingClientRect();

      const dx    = (to.left + to.width  / 2) - (from.left + from.width  / 2);
      const dy    = (to.top  + to.height / 2) - (from.top  + from.height / 2);
      const scale = to.width / from.width;

      // Move splash logo to portfolio logo position
      splashLogo.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
      splashLogo.style.transform  = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';

      // Fade out splash background
      splash.style.transition      = 'background-color 0.7s 0.2s ease';
      splash.style.backgroundColor = 'transparent';

      // Fade out splash logo once it arrives, and hand off to the masked logo-reveal
      setTimeout(() => {
        splashLogo.style.transition += ', opacity 0.3s ease';
        splashLogo.style.opacity     = '0';
        logoReveal.classList.add('is-visible');
        if (projectList) projectList.classList.add('is-visible');
      }, 480);

      // Keep splash in DOM for reverse — just disable pointer events
      setTimeout(() => {
        splash.style.pointerEvents = 'none';
      }, 1100);

    }, 300);
  }

  function reverse() {
    if (!triggered) return;
    triggered = false;

    // Fade out portfolio
    if (projectList) projectList.classList.remove('is-visible');
    logoReveal.classList.remove('is-visible');

    // Fade splash background back in smoothly (not an instant snap)
    splash.style.transition      = 'background-color 0.5s ease';
    splash.style.backgroundColor = 'var(--bg)';
    splash.style.pointerEvents   = 'auto';

    // Snap logo back to center — invisible because opacity is still 0
    splashLogo.style.transition = 'none';
    splashLogo.style.transform  = '';

    // Once background has appeared, fade the logo back in
    setTimeout(() => {
      splashLogo.style.transition = 'opacity 0.5s ease';
      splashLogo.style.opacity    = '1';
    }, 300);

    // Fade tagline back in just after the logo — track the timer so reveal() can cancel it
    taglineTimer = setTimeout(() => {
      tagline.style.opacity = '1';
      taglineTimer = null;
    }, 500);

    // Re-attach mouseenter listener so the user can trigger forward again
    setTimeout(() => {
      splashLogo.addEventListener('mouseenter', reveal, { once: true });
    }, 900);
  }

  // Trigger forward reveal when cursor enters the logo
  splashLogo.addEventListener('mouseenter', reveal, { once: true });

  // Scroll down → reveal; also track when we arrive at the top
  let atTopSince  = null;
  let touchStartY = 0;

  window.addEventListener('scroll', () => {
    if (!triggered && window.scrollY > 0) {
      reveal();
      atTopSince = null;
    } else if (triggered) {
      if (window.scrollY === 0 && atTopSince === null) {
        atTopSince = Date.now();   // note when we landed at the top
      } else if (window.scrollY > 0) {
        atTopSince = null;         // left the top — reset
      }
    }
  }, { passive: true });

  // Desktop: wheel up while already at the top (after a 300ms dwell) → reverse
  // The dwell stops scroll momentum from accidentally triggering it on arrival
  window.addEventListener('wheel', (e) => {
    if (triggered && window.scrollY === 0 && e.deltaY < 0) {
      if (atTopSince && Date.now() - atTopSince > 300) {
        reverse();
      }
    }
  }, { passive: true });

  // Mobile: pull-down overscroll at the top → reverse
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (triggered && window.scrollY === 0 && atTopSince) {
      if (Date.now() - atTopSince > 300 && e.touches[0].clientY - touchStartY > 40) {
        reverse();
      }
    }
  }, { passive: true });

}());

// ─────────────────────────────────────────
// Logo thumbnail reveal — crossfade on hover
// ─────────────────────────────────────────
(function () {
  const thumbA   = document.getElementById('logoThumbA');
  const thumbB   = document.getElementById('logoThumbB');
  const projects = Array.from(document.querySelectorAll('.project'));

  if (!thumbA || !thumbB || !projects.length) return;

  let activeLayer    = 'a';
  let currentProject = null;

  function setThumb(url) {
    const next    = activeLayer === 'a' ? thumbB : thumbA;
    const current = activeLayer === 'a' ? thumbA : thumbB;
    next.style.backgroundImage = "url('" + url + "')";
    next.style.opacity = '1';
    current.style.opacity = '0';
    activeLayer = activeLayer === 'a' ? 'b' : 'a';
  }

  function activateProject(project) {
    if (project === currentProject) return;
    currentProject = project;
    const url = project.dataset.thumb;
    if (url) setThumb(url);
    projects.forEach(p => p.classList.toggle('is-active', p === project));
  }

  // Set first project as initial state
  const firstWithThumb = projects.find(p => p.dataset.thumb);
  if (firstWithThumb) {
    thumbA.style.backgroundImage = "url('" + firstWithThumb.dataset.thumb + "')";
  }
  activateProject(projects[0]);

  // Activate on hover — last hovered project stays active when cursor leaves
  projects.forEach(p => p.addEventListener('mouseenter', () => activateProject(p)));
}());

// ─────────────────────────────────────────
// Scroll reveal (about / contact sections)
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
// About view — logo slides right, about appears left
// ─────────────────────────────────────────
(function () {
  const logoPanelEl = document.getElementById('logoPanel');
  const aboutView   = document.getElementById('aboutView');
  const aboutCol    = document.getElementById('aboutCol');
  if (!logoPanelEl || !aboutView) return;

  let inAbout       = false;
  let atBottomSince = null;
  let aboutTouchY   = 0;

  function transitionToAbout() {
    if (inAbout) return;
    inAbout = true;
    atBottomSince = null;

    const rect    = logoPanelEl.getBoundingClientRect();
    const targetX = window.innerWidth - rect.width - rect.left;

    // Instantly show about-view background — hides the grid collapsing behind it
    aboutView.style.transition  = 'none';
    aboutView.style.opacity     = '1';
    aboutView.style.pointerEvents = 'auto';
    aboutCol.style.opacity      = '0';

    // Pull logo panel out of the grid and fix it at its current position
    logoPanelEl.style.position  = 'fixed';
    logoPanelEl.style.left      = rect.left + 'px';
    logoPanelEl.style.top       = '0';
    logoPanelEl.style.width     = rect.width + 'px';
    logoPanelEl.style.height    = '100vh';
    logoPanelEl.style.zIndex    = '150';

    // Slide logo to the right column
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        logoPanelEl.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
        logoPanelEl.style.transform  = 'translateX(' + targetX + 'px)';
      });
    });

    // Fade in about text once logo is on its way
    setTimeout(() => {
      aboutCol.style.transition = 'opacity 0.5s ease';
      aboutCol.style.opacity    = '1';
    }, 400);
  }

  function transitionFromAbout() {
    if (!inAbout) return;
    inAbout = false;

    // Fade out about text
    aboutCol.style.transition = 'opacity 0.3s ease';
    aboutCol.style.opacity    = '0';

    // Slide logo back to the left
    logoPanelEl.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
    logoPanelEl.style.transform  = '';

    // Once logo returns, reset everything
    setTimeout(() => {
      aboutView.style.transition    = 'none';
      aboutView.style.opacity       = '0';
      aboutView.style.pointerEvents = 'none';

      logoPanelEl.style.position  = '';
      logoPanelEl.style.left      = '';
      logoPanelEl.style.top       = '';
      logoPanelEl.style.width     = '';
      logoPanelEl.style.height    = '';
      logoPanelEl.style.zIndex    = '';
      logoPanelEl.style.transition = '';
      logoPanelEl.style.transform  = '';

      aboutCol.style.opacity    = '0';
      aboutCol.style.transition = '';
    }, 800);
  }

  // Track when user reaches the bottom of the page
  window.addEventListener('scroll', () => {
    if (inAbout) return;
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
    if (atBottom && atBottomSince === null) {
      atBottomSince = Date.now();
    } else if (!atBottom) {
      atBottomSince = null;
    }
  }, { passive: true });

  // Desktop: wheel down at bottom (after 300ms dwell) → about
  //          wheel up while in about → back to portfolio
  window.addEventListener('wheel', (e) => {
    if (!inAbout && e.deltaY > 0) {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince && Date.now() - atBottomSince > 300) {
        transitionToAbout();
      }
    }
    if (inAbout && e.deltaY < 0) {
      transitionFromAbout();
    }
  }, { passive: true });

  // Mobile: swipe up at bottom → about; swipe down in about → back
  window.addEventListener('touchstart', (e) => {
    aboutTouchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - aboutTouchY;
    if (!inAbout) {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince && Date.now() - atBottomSince > 300 && dy < -40) {
        transitionToAbout();
      }
    }
    if (inAbout && dy > 40) {
      transitionFromAbout();
    }
  }, { passive: true });

}());

// ─────────────────────────────────────────
// Smooth scroll for anchor links
// ─────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const id = this.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
