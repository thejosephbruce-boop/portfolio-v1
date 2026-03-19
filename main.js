// ─────────────────────────────────────────
// Always start at the top — prevent browser scroll restoration
// ─────────────────────────────────────────
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ─────────────────────────────────────────
// Splash → Portfolio transition
// ─────────────────────────────────────────
(function () {
  const splash      = document.getElementById('splash');
  const splashLogo  = document.getElementById('splashLogo');
  const tagline     = document.getElementById('splashTagline');
  const logoReveal  = document.getElementById('logoReveal');
  const projectList = document.querySelector('.project-list');
  if (!splash) return;

  // Coming back from a project page — skip splash, go straight to the list
  if (window.location.hash === '#projects') {
    splash.remove();
    logoReveal.classList.add('is-visible');
    if (projectList) projectList.classList.add('is-visible');
    history.replaceState(null, '', window.location.pathname);
    window.__restoreFullBleed = true;
    return;
  }

  // Coming from a project page "About" link — skip splash and go straight to about view
  if (window.location.hash === '#about') {
    splash.remove();
    logoReveal.classList.add('is-visible');
    if (projectList) projectList.classList.add('is-visible');
    history.replaceState(null, '', window.location.pathname);
    window.__gotoAbout = true;
    return;
  }

  let triggered = false;

  function reveal() {
    if (triggered) return;
    triggered = true;

    // Capture scroll position immediately, then animate back to top.
    // We delay the animation ~500ms so it starts just as the splash background
    // begins turning transparent — the user sees the list glide up to project 01
    // as the splash fades, rather than a hidden snap.
    const scrollStart = window.scrollY;
    if (scrollStart > 0) {
      setTimeout(() => {
        const duration  = 750;
        const startTime = performance.now();
        function scrollStep(now) {
          const t    = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
          window.scrollTo(0, scrollStart * (1 - ease));
          if (t < 1) requestAnimationFrame(scrollStep);
        }
        requestAnimationFrame(scrollStep);
      }, 500);
    }

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

      // Remove splash from DOM once transition is complete
      setTimeout(() => {
        splash.remove();
      }, 1100);

    }, 300);
  }

  // Trigger only on first scroll
  window.addEventListener('scroll', reveal, { once: true, passive: true });

}());

// ─────────────────────────────────────────
// Logo thumbnail reveal — hover + scroll crossfade + full-bleed click
// ─────────────────────────────────────────
(function () {
  const thumbA      = document.getElementById('logoThumbA');
  const thumbB      = document.getElementById('logoThumbB');
  const projects    = Array.from(document.querySelectorAll('.project'));
  const logoPanel   = document.getElementById('logoPanel');
  const fullBleed   = document.getElementById('fullBleed');
  const viewBtn     = document.getElementById('viewProjectBtn');

  if (!thumbA || !thumbB || !projects.length) return;

  let activeLayer    = 'a';
  let currentProject = null;
  let expandedProject = null;

  function setThumb(url, position) {
    const next    = activeLayer === 'a' ? thumbB : thumbA;
    const current = activeLayer === 'a' ? thumbA : thumbB;
    next.style.backgroundImage    = "url('" + url + "')";
    next.style.backgroundPosition = position || 'center';
    next.style.opacity = '1';
    current.style.opacity = '0';
    activeLayer = activeLayer === 'a' ? 'b' : 'a';
  }

  function activateProject(project) {
    if (project === currentProject) return;
    currentProject = project;
    const url      = project.dataset.thumb;
    const position = project.dataset.thumbPosition;
    if (url) setThumb(url, position);
    projects.forEach(p => p.classList.toggle('is-active', p === project));
  }

  // Update the view-project button for a given project (handles coming-soon labels)
  function updateViewBtn(project) {
    if (!viewBtn) return;
    const label = project && project.dataset.label;
    if (label) {
      viewBtn.textContent = label;
      // Only disable the button for coming-soon projects (no real page)
      const link = project && project.querySelector('a');
      const href = link && link.getAttribute('href');
      if (href === '#') {
        viewBtn.style.pointerEvents = 'none';
        viewBtn.style.opacity       = '0.6';
      } else {
        viewBtn.style.pointerEvents = '';
        viewBtn.style.opacity       = '';
      }
    } else {
      viewBtn.textContent         = 'View project';
      viewBtn.style.pointerEvents = '';
      viewBtn.style.opacity       = '';
    }
  }

  // Set first project as initial state
  const firstWithThumb = projects.find(p => p.dataset.thumb);
  if (firstWithThumb) {
    thumbA.style.backgroundImage    = "url('" + firstWithThumb.dataset.thumb + "')";
    thumbA.style.backgroundPosition = firstWithThumb.dataset.thumbPosition || 'center';
  }
  activateProject(projects[0]);

  // Restore full-bleed state after back-navigation from a project page.
  // Only restore when genuinely returning via #projects — on a plain refresh, clear it.
  if (fullBleed && viewBtn && logoPanel) {
    if (!window.__restoreFullBleed) {
      sessionStorage.removeItem('jbFullBleedBg');
      sessionStorage.removeItem('jbFullBleedPos');
      sessionStorage.removeItem('jbFullBleedHref');
    }
    window.__restoreFullBleed = false;
    const savedBg   = sessionStorage.getItem('jbFullBleedBg');
    const savedPos  = sessionStorage.getItem('jbFullBleedPos');
    const savedHref = sessionStorage.getItem('jbFullBleedHref');
    if (savedBg) {
      fullBleed.style.backgroundImage    = savedBg;
      fullBleed.style.backgroundPosition = savedPos || 'center';
      if (savedHref) viewBtn.href = savedHref;
      logoPanel.classList.add('is-expanded');
      // Restore expandedProject ref and button state
      const restoredProject = projects.find(p => {
        const a = p.querySelector('a');
        return a && a.getAttribute('href') === savedHref;
      });
      if (restoredProject) {
        expandedProject = restoredProject;
        updateViewBtn(restoredProject);
      }
    }
  }

  // Hover: activate project + keep full-bleed in sync if already expanded
  projects.forEach(p => {
    p.addEventListener('mouseenter', () => {
      activateProject(p);
      if (logoPanel && logoPanel.classList.contains('is-expanded') && p.dataset.thumb) {
        const newBg  = "url('" + p.dataset.thumb + "')";
        const newPos = p.dataset.thumbPosition || 'center';
        if (fullBleed) {
          fullBleed.style.backgroundImage    = newBg;
          fullBleed.style.backgroundPosition = newPos;
          sessionStorage.setItem('jbFullBleedBg',  newBg);
          sessionStorage.setItem('jbFullBleedPos', newPos);
        }
        const link = p.querySelector('a');
        if (link && viewBtn) {
          const href = link.getAttribute('href');
          viewBtn.href = href;
          sessionStorage.setItem('jbFullBleedHref', href);
        }
        updateViewBtn(p);
      }
    });
  });

  // Scroll: activate topmost visible project
  const visibleSet = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) visibleSet.add(e.target);
      else visibleSet.delete(e.target);
    });
    const top = projects.find(p => visibleSet.has(p));
    if (top) activateProject(top);
  }, { threshold: 0.3 });
  projects.forEach(p => observer.observe(p));

  // Click project title → expand to full-bleed, save state for back-navigation
  if (logoPanel && fullBleed && viewBtn) {
    projects.forEach(p => {
      const link = p.querySelector('a');
      if (!link) return;
      link.addEventListener('click', (e) => {
        const url      = p.dataset.thumb;
        const position = p.dataset.thumbPosition || 'center';
        const href     = link.getAttribute('href');
        if (!url) return; // no thumb → let browser handle naturally

        // Second click on the already-expanded project → navigate (or stay for coming-soon)
        if (logoPanel.classList.contains('is-expanded') && expandedProject === p) {
          if (href === '#') { e.preventDefault(); return; } // coming-soon — stay on page
          sessionStorage.setItem('jbFullBleedBg',   "url('" + url + "')");
          sessionStorage.setItem('jbFullBleedPos',  position);
          sessionStorage.setItem('jbFullBleedHref', href);
          return; // let the browser navigate
        }

        // First click → expand full-bleed
        e.preventDefault();
        const bgValue = "url('" + url + "')";
        fullBleed.style.backgroundImage    = bgValue;
        fullBleed.style.backgroundPosition = position;
        viewBtn.href = href;
        logoPanel.classList.add('is-expanded');
        expandedProject = p;
        updateViewBtn(p);
        // Coming-soon projects don't need sessionStorage (no page to return from)
        if (href !== '#') {
          sessionStorage.setItem('jbFullBleedBg',   bgValue);
          sessionStorage.setItem('jbFullBleedPos',  position);
          sessionStorage.setItem('jbFullBleedHref', href);
        }
      });
    });

    // "View project" clicked — save final state then let browser navigate
    viewBtn.addEventListener('click', () => {
      sessionStorage.setItem('jbFullBleedBg',   fullBleed.style.backgroundImage);
      sessionStorage.setItem('jbFullBleedPos',  fullBleed.style.backgroundPosition);
      sessionStorage.setItem('jbFullBleedHref', viewBtn.href);
    });

    // Full-bleed only collapses when the about-view opens (see about IIFE below)
    // — NOT on mouseenter, so clicking a project keeps the full-bleed persistent
  }

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
  const fullBleedEl = document.getElementById('fullBleed');
  const viewBtnEl   = document.getElementById('viewProjectBtn');
  const thumbAEl    = document.getElementById('logoThumbA');
  const thumbBEl    = document.getElementById('logoThumbB');
  const fullFaceBtn = document.getElementById('fullFaceBtn');
  if (!logoPanelEl || !aboutView) return;

  const FULL_FACE = "Full face.jpg";

  let inAbout       = false;
  let faceExpanded  = false;
  let atBottomSince = null;
  let aboutTouchY   = 0;

  function transitionToAbout() {
    if (inAbout) return;
    inAbout = true;
    atBottomSince = null;
    faceExpanded = false;

    // Collapse any active project full-bleed and clear its persisted state
    logoPanelEl.classList.remove('is-expanded');
    sessionStorage.removeItem('jbFullBleedBg');
    sessionStorage.removeItem('jbFullBleedHref');

    // Show Full Face image through the logo letter mask
    if (thumbAEl && thumbBEl) {
      thumbAEl.style.backgroundImage    = "url('" + FULL_FACE + "')";
      thumbAEl.style.backgroundPosition = 'center top';
      thumbAEl.style.opacity            = '1';
      thumbBEl.style.opacity            = '0';
    }

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

    // Collapse full-face full-bleed if it was open
    if (faceExpanded) collapseFace();

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

  // Full Face / Less Face button toggle
  function expandFace() {
    fullBleedEl.style.backgroundImage    = "url('" + FULL_FACE + "')";
    fullBleedEl.style.backgroundPosition = 'center top';
    if (viewBtnEl) { viewBtnEl.style.opacity = '0'; viewBtnEl.style.pointerEvents = 'none'; }
    logoPanelEl.classList.add('is-expanded');
    if (fullFaceBtn) fullFaceBtn.querySelector('h2').textContent = 'Less Face';
    faceExpanded = true;
  }

  function collapseFace() {
    logoPanelEl.classList.remove('is-expanded');
    if (viewBtnEl) { viewBtnEl.style.opacity = ''; viewBtnEl.style.pointerEvents = ''; }
    if (fullFaceBtn) fullFaceBtn.querySelector('h2').textContent = 'Full Face';
    faceExpanded = false;
  }

  if (fullFaceBtn && fullBleedEl) {
    fullFaceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!inAbout) return;
      faceExpanded ? collapseFace() : expandFace();
    });

    // Clicking the photo also collapses it
    fullBleedEl.addEventListener('click', () => {
      if (!inAbout || !faceExpanded) return;
      collapseFace();
    });
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

  // If arriving via index.html#about (e.g. from a project page "About" link), trigger immediately
  if (window.__gotoAbout) {
    window.__gotoAbout = false;
    requestAnimationFrame(() => requestAnimationFrame(() => transitionToAbout()));
  }

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

// ─────────────────────────────────────────
// Double-scroll-to-top → return to splash
// ─────────────────────────────────────────
(function () {
  const logoReveal = document.getElementById('logoReveal');
  if (!logoReveal) return;

  let wasBelow        = false;
  let arrivedAtTopTime = null;
  let returning       = false;
  let topTouchY       = 0;

  // Track the moment the user arrives back at the very top after scrolling down
  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      wasBelow = true;
      arrivedAtTopTime = null;        // reset if they scroll away from top again
    } else if (wasBelow) {
      arrivedAtTopTime = Date.now(); // just bounced back to top
      wasBelow = false;
    }
  }, { passive: true });

  function returnToSplash() {
    if (returning) return;
    returning = true;

    // Where the logo currently lives in the portfolio layout
    const fromRect = logoReveal.getBoundingClientRect();

    // Target splash-logo width: clamp(280px, 42vw, 680px)
    const targetWidth  = Math.min(Math.max(280, window.innerWidth * 0.42), 680);

    // Centers
    const finalCX = window.innerWidth  / 2;
    const finalCY = window.innerHeight / 2;
    const fromCX  = fromRect.left + fromRect.width  / 2;
    const fromCY  = fromRect.top  + fromRect.height / 2;

    // Invert transform — start at the portfolio logo position, animate to centre
    const dx    = fromCX - finalCX;
    const dy    = fromCY - finalCY;
    const scale = fromRect.width / targetWidth;

    // Build a fresh splash overlay
    const splashEl = document.createElement('div');
    splashEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:500',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background-color:transparent', 'pointer-events:none',
      'transition:background-color 0.7s 0.15s ease',
    ].join(';');

    const imgEl = document.createElement('img');
    imgEl.src = 'download.png';
    imgEl.alt = 'Joe Bruce';
    imgEl.style.cssText = [
      'display:block',
      'width:' + targetWidth + 'px',
      'height:auto',
      'transform:translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')',
      'transition:transform 0.75s cubic-bezier(0.76,0,0.24,1)',
    ].join(';');

    const taglineEl = document.createElement('p');
    taglineEl.textContent = 'Executive Creative Director & Creative Partner';
    taglineEl.style.cssText = [
      'position:absolute', 'left:50%', 'bottom:clamp(24px,5vw,80px)',
      'transform:translateX(-50%)',
      'font-family:"Cormorant Garamond",Georgia,serif',
      'font-size:clamp(0.9rem,1.4vw,1.2rem)',
      'font-weight:300', 'letter-spacing:0.08em',
      'color:#888888', 'white-space:nowrap',
      'opacity:0', 'transition:opacity 0.4s ease 0.6s',
    ].join(';');

    splashEl.appendChild(imgEl);
    splashEl.appendChild(taglineEl);
    document.body.appendChild(splashEl);

    // FLIP: animate logo to centre + fade in background + fade in tagline
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        imgEl.style.transform            = 'translate(0,0) scale(1)';
        splashEl.style.backgroundColor   = '#f8f8f6';
        taglineEl.style.opacity          = '1';
      });
    });

    // Reload once the animation has settled
    setTimeout(() => { window.location.reload(); }, 1400);
  }

  // Desktop: wheel-up at the very top within 1500 ms of arriving there
  window.addEventListener('wheel', (e) => {
    if (returning) return;
    if (e.deltaY < 0 && window.scrollY === 0 && arrivedAtTopTime !== null && Date.now() - arrivedAtTopTime < 1500) {
      returnToSplash();
    }
  }, { passive: true });

  // Mobile: pull down (finger moves down = overscroll upward) within 1500 ms
  window.addEventListener('touchstart', (e) => {
    topTouchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (returning) return;
    const dy = e.touches[0].clientY - topTouchY;
    if (dy > 40 && window.scrollY === 0 && arrivedAtTopTime !== null && Date.now() - arrivedAtTopTime < 1500) {
      returnToSplash();
    }
  }, { passive: true });

}());
