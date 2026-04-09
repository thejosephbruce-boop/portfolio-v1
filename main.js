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

  // Coming from a project page "Contact" link — skip splash and go straight to end/contact view
  if (window.location.hash === '#contact') {
    splash.remove();
    logoReveal.classList.add('is-visible');
    if (projectList) projectList.classList.add('is-visible');
    history.replaceState(null, '', window.location.pathname);
    window.__gotoContact = true;
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

      // Store the splash logo's exact position so returnToSplash() can land
      // the logo at precisely the right spot (it is above-centre due to the tagline)
      window.__splashLogoRect = {
        left: from.left, top: from.top,
        width: from.width, height: from.height,
        bottom: from.bottom,
      };

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

  // Mobile: tapping the logo lockup also triggers the reveal
  if (splashLogo && window.matchMedia('(pointer: coarse)').matches) {
    splashLogo.addEventListener('touchend', (e) => {
      e.preventDefault(); // prevent the ghost click that follows touchend
      reveal();
    }, { once: true, passive: false });
  }

  // Desktop: clicking the logo lockup also triggers the reveal
  if (splashLogo && window.matchMedia('(pointer: fine)').matches) {
    splashLogo.style.cursor = 'pointer';
    splashLogo.addEventListener('click', reveal, { once: true });
  }

}());

// ─────────────────────────────────────────
// Mobile: fixed logo panel — push project list below it
// ─────────────────────────────────────────
(function () {
  const logoPanel   = document.getElementById('logoPanel');
  const projectList = document.getElementById('work');
  if (!logoPanel || !projectList) return;

  function applyMobilePadding() {
    if (window.innerWidth <= 768) {
      projectList.style.paddingTop = logoPanel.getBoundingClientRect().height + 'px';
    } else {
      projectList.style.paddingTop = '';
    }
  }

  applyMobilePadding();
  window.addEventListener('resize', applyMobilePadding, { passive: true });
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

  let activeLayer     = 'a';
  let currentProject  = null;
  let expandedProject = null;
  let mobileLastTapped = null;

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
        viewBtn.style.opacity       = '1';
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
      // About / Contact entries: show thumbnail through mask only — never update the full-bleed
      if (p.id === 'aboutMobileLink' || p.id === 'contactListBtn') return;
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

        // About entry — trigger about view, never expand to full-bleed
        if (p.id === 'aboutMobileLink') {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.__triggerAbout === 'function') window.__triggerAbout();
          return;
        }

        // Contact entry — jump straight to the end/contact view
        if (p.id === 'contactListBtn') {
          e.preventDefault();
          e.stopPropagation();
          if (typeof window.__triggerEnd === 'function') window.__triggerEnd();
          return;
        }

        // ── Mobile: double-tap to navigate ──────────────────────────
        if (window.innerWidth <= 768) {
          if (href === '#') { e.preventDefault(); return; } // coming-soon or about
          if (mobileLastTapped !== p) {
            // First tap: fill logo panel with full thumb
            e.preventDefault();
            activateProject(p);
            mobileLastTapped = p;
            fullBleed.style.backgroundImage    = "url('" + url + "')";
            fullBleed.style.backgroundPosition = position || 'center';
            viewBtn.href = href;
            logoPanel.classList.add('is-expanded');
            expandedProject = p;
            updateViewBtn(p);
            return;
          }
          // Second tap of same project: navigate
          mobileLastTapped = null;
          logoPanel.classList.remove('is-expanded');
          sessionStorage.setItem('jbFullBleedBg',   "url('" + url + "')");
          sessionStorage.setItem('jbFullBleedPos',  position);
          sessionStorage.setItem('jbFullBleedHref', href);
          return; // let browser navigate
        }

        // ── Desktop: full-bleed expand then navigate ─────────────────
        // Full-bleed already open → single click navigates directly
        if (logoPanel.classList.contains('is-expanded')) {
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

  // Mobile: collapse full-thumb in logo panel when user scrolls
  window.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;
    if (mobileLastTapped && logoPanel) {
      logoPanel.classList.remove('is-expanded');
      mobileLastTapped = null;
    }
  }, { passive: true });

  // Allow other IIFEs to restore the current thumbnail after they've
  // temporarily overridden it (e.g. the Full Face / about view).
  // transitionToAbout() always leaves thumbA showing Full Face at opacity 1,
  // thumbB at opacity 0 — so we crossfade by loading the project image into
  // thumbB and fading it in while thumbA (Full Face) fades out.
  window.__restoreCurrentThumb = function () {
    if (!currentProject || !currentProject.dataset.thumb) return;
    const url = currentProject.dataset.thumb;
    const pos = currentProject.dataset.thumbPosition;
    thumbB.style.backgroundImage    = "url('" + url + "')";
    thumbB.style.backgroundPosition = pos || 'center';
    thumbB.style.opacity            = '1';
    thumbA.style.opacity            = '0';
    activeLayer = 'b';
  };

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
  const fullFaceBtn       = document.getElementById('fullFaceBtn');
  const backToProjectsBtn = document.getElementById('backToProjectsBtn');
  const contactBtn        = document.getElementById('contactBtn');
  if (!logoPanelEl || !aboutView) return;

  const FULL_FACE = "Full face.jpg";

  const END_IMAGES = [
    "site end headers/end image 4.png",
    "site end headers/end image 5.png",
    "site end headers/end image 6.png",
    "site end headers/end image 7.webp",
  ];

  const endView = document.getElementById('endView');

  let inAbout          = false;
  let inAboutSince     = null;
  let inEnd            = false;
  let faceExpanded     = false;
  let atBottomSince    = null;
  let aboutTouchY      = 0;
  let aboutColAtBottom = false;
  let endAtBottomSince = null;
  let bottomExcess     = 0;   // accumulated wheel delta while at page bottom (hard-scroll gate)
  let upExcess         = 0;   // accumulated upward wheel delta while in about (prevents accidental dismiss)
  let endDismissedAt   = null; // guard: ignore scroll-up-from-about for a short time after leaving end

  function pickEndImage() {
    return END_IMAGES[Math.floor(Math.random() * END_IMAGES.length)];
  }

  function transitionToEnd() {
    if (inEnd || !endView) return;
    inEnd = true;
    endView.style.backgroundImage = "url('" + pickEndImage() + "')";

    // ── FLIP: slide the end logo from the about-logo's screen position ──
    // into its natural centred position, so it feels like the same lockup
    // travelling into the full-bleed frame rather than a new one appearing.
    const aboutLogoEl = document.getElementById('logoReveal');
    const endLogoEl   = endView.querySelector('.end-logo');
    const endIconsEl  = endView.querySelector('.end-icons');

    if (aboutLogoEl && endLogoEl) {
      const from   = aboutLogoEl.getBoundingClientRect();
      const logoW  = endLogoEl.offsetWidth || from.width;
      const dx     = (from.left + from.width  / 2) - (window.innerWidth  / 2);
      const dy     = (from.top  + from.height / 2) - (window.innerHeight / 2);
      const sc     = from.width / logoW;

      // Place end logo at the about logo's current screen position (no transition yet)
      endLogoEl.style.transition = 'none';
      endLogoEl.style.transform  = 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')';

      // Keep icons hidden until the logo has settled
      if (endIconsEl) { endIconsEl.style.transition = 'none'; endIconsEl.style.opacity = '0'; }
    }

    // Fade in the full-bleed background
    endView.classList.add('is-visible');

    // One rAF later: animate the logo to its centred resting position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (endLogoEl) {
          endLogoEl.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
          endLogoEl.style.transform  = '';
        }
      });
    });

    // Icons fade in once the logo has arrived
    setTimeout(() => {
      if (endIconsEl) {
        endIconsEl.style.transition = 'opacity 0.4s ease';
        endIconsEl.style.opacity    = '1';
      }
    }, 700);
  }

  function transitionFromEnd() {
    if (!inEnd || !endView) return;
    inEnd = false;
    endView.classList.remove('is-visible');

    // Reset logo/icons so the FLIP is clean on the next visit
    const endLogoEl  = endView.querySelector('.end-logo');
    const endIconsEl = endView.querySelector('.end-icons');
    setTimeout(() => {
      if (endLogoEl)  { endLogoEl.style.transition  = ''; endLogoEl.style.transform  = ''; }
      if (endIconsEl) { endIconsEl.style.transition = ''; endIconsEl.style.opacity   = ''; }
    }, 700);

    // On mobile: reset about column scroll so the user can swipe down to exit
    if (window.innerWidth <= 768 && aboutCol) {
      aboutCol.scrollTop = 0;
      aboutColAtBottom = false;
      endAtBottomSince = null;
    }
  }

  // Expose so the thumbnail IIFE can trigger the about/end views from the project list
  window.__triggerAbout = function () { transitionToAbout(); };
  window.__triggerEnd   = function () { transitionToEnd();   };

  function transitionToAbout() {
    if (inAbout) return;
    inAbout = true;
    inAboutSince = Date.now();
    atBottomSince = null;
    faceExpanded = false;

    // Collapse any active project full-bleed and clear its persisted state
    logoPanelEl.classList.remove('is-expanded');
    sessionStorage.removeItem('jbFullBleedBg');
    sessionStorage.removeItem('jbFullBleedPos');
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

    const isMobile = window.innerWidth <= 768;

    // Pull logo panel out of the grid and fix it at its current position
    logoPanelEl.style.position  = 'fixed';
    logoPanelEl.style.left      = rect.left + 'px';
    logoPanelEl.style.top       = '0';
    logoPanelEl.style.width     = rect.width + 'px';
    logoPanelEl.style.height    = isMobile ? 'auto' : '100vh';
    logoPanelEl.style.zIndex    = '150';

    // On mobile: pin about text to the space below the logo panel
    if (isMobile) {
      requestAnimationFrame(() => {
        const panelH = logoPanelEl.getBoundingClientRect().height;
        aboutCol.style.position  = 'absolute';
        aboutCol.style.top       = panelH + 'px';
        aboutCol.style.bottom    = '0';
        aboutCol.style.left      = '0';
        aboutCol.style.right     = '0';
        aboutCol.style.overflowY = 'auto';
      });
    }

    // Slide logo to the right column (desktop only — on mobile targetX is 0)
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
      // Reset end-view tracking and check if content fits without scrolling
      endAtBottomSince = null;
      aboutColAtBottom = false;
      if (aboutCol.scrollHeight <= aboutCol.clientHeight + 5) {
        aboutColAtBottom = true;
        endAtBottomSince = Date.now();
      }
    }, 400);
  }

  function transitionFromAbout() {
    if (!inAbout) return;
    inAbout = false;

    // Reset about col scroll so swipe-down-to-dismiss works on next visit
    if (aboutCol) aboutCol.scrollTop = 0;
    aboutColAtBottom = false;
    endAtBottomSince = null;
    upExcess = 0;

    // Close end view if it was open
    if (inEnd) transitionFromEnd();

    // Collapse full-face full-bleed if it was open
    if (faceExpanded) collapseFace();

    // Fade out about text
    aboutCol.style.transition = 'opacity 0.3s ease';
    aboutCol.style.opacity    = '0';

    // Slide logo back to the left
    logoPanelEl.style.transition = 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)';
    logoPanelEl.style.transform  = '';

    // Once logo returns, reset everything and restore the project thumbnail
    setTimeout(() => {
      aboutView.style.transition    = 'none';
      aboutView.style.opacity       = '0';
      aboutView.style.pointerEvents = 'none';

      logoPanelEl.style.position   = '';
      logoPanelEl.style.left       = '';
      logoPanelEl.style.top        = '';
      logoPanelEl.style.width      = '';
      logoPanelEl.style.height     = '';
      logoPanelEl.style.zIndex     = '';
      logoPanelEl.style.transition = '';
      logoPanelEl.style.transform  = '';

      aboutCol.style.transition  = '';
      aboutCol.style.opacity     = '0';
      aboutCol.style.position    = '';
      aboutCol.style.top         = '';
      aboutCol.style.bottom      = '';
      aboutCol.style.left        = '';
      aboutCol.style.right       = '';
      aboutCol.style.overflowY   = '';

      // Restore the current project's thumbnail — about view replaced it with Full Face
      if (typeof window.__restoreCurrentThumb === 'function') {
        window.__restoreCurrentThumb();
      }
    }, 800);
  }

  // If aboutCol content fits without scrolling, treat as already at bottom
  function checkAboutColOverflow() {
    if (!aboutCol) return;
    if (aboutCol.scrollHeight <= aboutCol.clientHeight + 5) {
      aboutColAtBottom = true;
      if (endAtBottomSince === null) endAtBottomSince = Date.now();
    }
  }

  // Track when aboutCol is scrolled to its bottom (triggers end view)
  if (aboutCol) {
    aboutCol.addEventListener('scroll', () => {
      const atBottom = aboutCol.scrollTop + aboutCol.clientHeight >= aboutCol.scrollHeight - 5;
      if (atBottom && endAtBottomSince === null) {
        endAtBottomSince = Date.now();
      } else if (!atBottom) {
        endAtBottomSince = null;
      }
      aboutColAtBottom = atBottom;
    }, { passive: true });
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

  // Back To Projects button — return to the project list
  if (backToProjectsBtn) {
    backToProjectsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!inAbout) return;
      transitionFromAbout();
    });
  }

  // Contact button — jump straight to the end view
  if (contactBtn) {
    contactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!inAbout) return;
      transitionToEnd();
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

  // Desktop: wheel down at bottom → about → end view
  //          wheel up: end view → about → portfolio
  window.addEventListener('wheel', (e) => {
    // End view: scroll up → back to about
    if (inEnd && e.deltaY < 0) {
      transitionFromEnd();
      if (!inAbout) transitionToAbout();
      endDismissedAt = Date.now();
      return;
    }
    if (inEnd) return;

    // About view: scroll down → end view
    // Require 600ms dwell in about before allowing forward navigation
    // (prevents scroll momentum from skipping the about view entirely)
    if (inAbout && e.deltaY > 0) {
      if (!inAboutSince || Date.now() - inAboutSince < 600) return;
      checkAboutColOverflow();
      if (aboutColAtBottom && endAtBottomSince && Date.now() - endAtBottomSince > 500) {
        transitionToEnd();
      }
      return;
    }

    // About view: scroll up → back to portfolio
    // Mirrors the project-list behaviour: aboutCol content must reach its very
    // top first, then continued upward scrolling triggers the dismiss — the
    // same "hit the boundary then keep going" resistance the project list uses.
    if (inAbout && e.deltaY < 0) {
      if (endDismissedAt && Date.now() - endDismissedAt < 600) return;
      if (aboutCol && aboutCol.scrollTop > 5) {
        upExcess = 0; // still content above — let the column scroll naturally
        return;
      }
      upExcess += Math.abs(e.deltaY);
      if (upExcess > 150) {
        upExcess = 0;
        bottomExcess = 0;
        transitionFromAbout();
      }
      return;
    }

    // Reset upward accumulator whenever the user isn't scrolling up in about
    if (inAbout && e.deltaY > 0) upExcess = 0;

    // Portfolio: hard scroll down at bottom → about view
    // Accumulate excess wheel delta while already at the bottom — only advance
    // once the user has deliberately scrolled past the end (>150 px total).
    // This gives a clear soft landing before the page transitions.
    if (!inAbout && e.deltaY > 0) {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince) {
        bottomExcess += e.deltaY;
        if (bottomExcess > 150 && Date.now() - atBottomSince > 300) {
          transitionToAbout();
          bottomExcess = 0;
        }
      } else {
        bottomExcess = 0;
      }
    }

    // Reset excess if the user scrolls back up through the list
    if (!inAbout && e.deltaY < 0) bottomExcess = 0;
  }, { passive: true });

  // Mobile: swipe up at bottom → about; swipe down in about → back
  let aboutTouchX = 0;
  window.addEventListener('touchstart', (e) => {
    aboutTouchY = e.touches[0].clientY;
    aboutTouchX = e.touches[0].clientX;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const dy = e.touches[0].clientY - aboutTouchY;

    // End view: swipe down → back to about
    if (inEnd && dy > 40) {
      transitionFromEnd();
      if (!inAbout) transitionToAbout();
      endDismissedAt = Date.now();
      return;
    }
    if (inEnd) return;

    // About view: swipe up → end view
    // Mobile uses shorter dwell guards — native scroll reaches the bottom in one
    // gesture and users expect the next swipe to advance, not a separate action.
    if (inAbout && dy < -40) {
      const timeGuard = window.innerWidth <= 768 ? 300 : 600;
      if (!inAboutSince || Date.now() - inAboutSince < timeGuard) return;
      checkAboutColOverflow();
      const bottomDwell = window.innerWidth <= 768 ? 0 : 300;
      if (aboutColAtBottom && endAtBottomSince !== null && Date.now() - endAtBottomSince >= bottomDwell) {
        transitionToEnd();
      }
      return;
    }

    // About view: swipe down → back to portfolio
    // On mobile: only dismiss if the about content is scrolled back to the very top,
    // so the user can freely scroll up through the about text without accidentally exiting
    if (inAbout && dy > 40) {
      if (window.innerWidth <= 768 && aboutCol && aboutCol.scrollTop > 5) return;
      if (endDismissedAt && Date.now() - endDismissedAt < 600) return;
      transitionFromAbout();
      return;
    }

    // Portfolio: hard swipe up at bottom
    // Mobile → skip about view and go straight to end view
    // Desktop → go to about view first
    // Require a deliberate swipe (-80 px) after dwelling at the bottom (600 ms)
    // so a fast scroll reaching the bottom doesn't immediately advance.
    if (!inAbout) {
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince && Date.now() - atBottomSince > 600 && dy < -80) {
        if (window.innerWidth <= 768) {
          transitionToEnd();
        } else {
          transitionToAbout();
        }
      }
    }
  }, { passive: true });

  // If arriving via index.html#about (e.g. from a project page "About" link), trigger immediately
  if (window.__gotoAbout) {
    window.__gotoAbout = false;
    requestAnimationFrame(() => requestAnimationFrame(() => transitionToAbout()));
  }

  // If arriving via index.html#contact (e.g. from a project page "Contact" link), go straight to end view
  if (window.__gotoContact) {
    window.__gotoContact = false;
    requestAnimationFrame(() => requestAnimationFrame(() => transitionToEnd()));
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

    // ── Measure first, before any DOM changes ────────────────────────
    const fromRect    = logoReveal.getBoundingClientRect();
    const logoPanelEl = document.getElementById('logoPanel');
    const thumbA      = document.getElementById('logoThumbA');
    const thumbB      = document.getElementById('logoThumbB');

    // ── Work out the landing position ────────────────────────────────
    // Use the exact rect captured when the original splash played —
    // the logo is above-centre (flex-column with tagline below), so
    // window.innerHeight/2 would be wrong and cause a jump on reload.
    const r           = window.__splashLogoRect;
    const targetWidth = r ? r.width : Math.min(Math.max(280, window.innerWidth * 0.42), 680);
    const finalLeft   = r ? r.left  : (window.innerWidth - targetWidth) / 2;
    const finalTop    = r ? r.top   : (window.innerHeight - targetWidth * 0.28) / 2;
    const finalCX     = finalLeft + targetWidth / 2;
    const finalCY     = finalTop  + (r ? r.height / 2 : targetWidth * 0.14);

    const fromCX = fromRect.left + fromRect.width  / 2;
    const fromCY = fromRect.top  + fromRect.height / 2;
    const dx     = fromCX - finalCX;
    const dy     = fromCY - finalCY;
    const scale  = fromRect.width / targetWidth;

    // Hide the portfolio logo so it doesn't show through the overlay
    logoReveal.style.opacity = '0';

    // ── Build the splash overlay ──────────────────────────────────────
    // Elements are absolutely positioned to land at pixel-perfect splash coords
    const splashEl = document.createElement('div');
    splashEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:500',
      'background-color:#f8f8f6', 'pointer-events:none',
    ].join(';');

    const imgEl = document.createElement('img');
    imgEl.src = 'download.png';
    imgEl.alt = 'Joe Bruce';
    // No transition yet — prevents the browser firing an unwanted animation
    // from the element's default (identity) state to the initial inverted position
    imgEl.style.cssText = [
      'position:absolute',
      'left:' + finalLeft + 'px',
      'top:'  + finalTop  + 'px',
      'width:' + targetWidth + 'px',
      'height:auto',
      'transform:translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')',
    ].join(';');

    // Tagline sits below the logo, matching the real .splash-content gap (1.75 rem ≈ 28 px).
    // Top is set after DOM insertion so we can read the image's actual rendered height —
    // using r.bottom directly caused occasional overlap when download.png's aspect ratio
    // differed slightly from the original #splashLogo element's rendered height.
    const taglineEl  = document.createElement('p');
    taglineEl.textContent = 'Executive Creative Director.';
    taglineEl.style.cssText = [
      'position:absolute', 'left:50%',
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

    // Position the tagline from the image's actual rendered bottom (not a precalculated estimate)
    function placeTagline() {
      const h = imgEl.offsetHeight;
      taglineEl.style.top = (finalTop + (h > 0 ? h : targetWidth * 0.28) + 28) + 'px';
    }
    if (imgEl.complete && imgEl.naturalHeight > 0) {
      placeTagline(); // already cached — offsetHeight is available synchronously
    } else {
      imgEl.addEventListener('load', placeTagline, { once: true });
    }

    // ── FLIP: force a reflow to commit the initial transform to the compositor,
    // then animate on the very next frame — avoids the 2-frame "stuck" flash
    // that the old double-rAF produced before the animation could begin.
    splashEl.getBoundingClientRect(); // triggers reflow, commits initial state
    requestAnimationFrame(() => {
      imgEl.style.transition  = 'transform 0.85s cubic-bezier(0.76,0,0.24,1)';
      imgEl.style.transform   = 'translate(0,0) scale(1)';
      taglineEl.style.opacity = '1';
    });

    // Collapse full-bleed / thumbnails only once the splash background has
    // faded in enough to cover the panel — avoids a jarring pop when
    // the full-bleed image disappears underneath
    setTimeout(() => {
      if (thumbA) { thumbA.style.transition = 'opacity 0.15s'; thumbA.style.opacity = '0'; }
      if (thumbB) { thumbB.style.transition = 'opacity 0.15s'; thumbB.style.opacity = '0'; }
      if (logoPanelEl) logoPanelEl.classList.remove('is-expanded');
    }, 350);

    // Reload once the animation has fully settled — delay is generous so the
    // logo and tagline are completely visible before the real splash takes over
    setTimeout(() => { window.location.reload(); }, 1600);
  }

  // End-view logo: click → return to splash
  const endLogoClickEl = document.querySelector('.end-logo');
  if (endLogoClickEl) {
    endLogoClickEl.style.cursor = 'pointer';
    endLogoClickEl.addEventListener('click', returnToSplash);
  }

  // Desktop: wheel-up at the very top, but only after momentum from the first
  // scroll has died down (>300 ms) and within a 2 s window
  window.addEventListener('wheel', (e) => {
    if (returning) return;
    if (e.deltaY < 0 && window.scrollY <= 1 && arrivedAtTopTime !== null) {
      const elapsed = Date.now() - arrivedAtTopTime;
      if (elapsed > 300 && elapsed < 2000) returnToSplash();
    }
  }, { passive: true });

  // Mobile: pull down (finger moves down = overscroll upward) within 2 s
  window.addEventListener('touchstart', (e) => {
    topTouchY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (returning) return;
    const dy = e.touches[0].clientY - topTouchY;
    if (dy > 40 && window.scrollY <= 1 && arrivedAtTopTime !== null) {
      const elapsed = Date.now() - arrivedAtTopTime;
      if (elapsed > 300 && elapsed < 2000) returnToSplash();
    }
  }, { passive: true });

}());
