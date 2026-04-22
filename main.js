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
  const projectList = document.querySelector('.project-list');
  const logoPanel   = document.getElementById('logoPanel');
  if (!splash) return;

  // Pick a random full-bleed image for the splash background
  const SPLASH_IMAGES = [
    "site end headers/end image 4.png",
    "site end headers/end image 5.png",
    "site end headers/end image 6.png",
    "site end headers/end image 7.webp",
  ];
  const savedSplashImg = sessionStorage.getItem('jbReturnSplashImg');
  sessionStorage.removeItem('jbReturnSplashImg');
  const splashImg = savedSplashImg || SPLASH_IMAGES[Math.floor(Math.random() * SPLASH_IMAGES.length)];
  splash.style.backgroundImage = "url('" + splashImg + "')";
  window.__splashImage = splashImg;

  function showInstant(list) {
    if (!list) return;
    list.style.transition = 'none';
    list.classList.add('is-visible');
    requestAnimationFrame(() => requestAnimationFrame(() => { list.style.transition = ''; }));
  }

  // Coming back from a project page — skip splash, go straight to the list
  if (window.location.hash === '#projects') {
    splash.remove();
    showInstant(projectList);
    if (logoPanel) logoPanel.classList.add('project-mode');
    history.replaceState(null, '', window.location.pathname);
    window.__restoreFullBleed = true;
    window.__restoreLastProject = true;
    return;
  }

  // Coming from a project page "About" link — skip splash and go straight to about view
  if (window.location.hash === '#about') {
    splash.remove();
    showInstant(projectList);
    if (logoPanel) logoPanel.classList.add('project-mode');
    history.replaceState(null, '', window.location.pathname);
    window.__gotoAbout = true;
    return;
  }

  // Coming from a project page "Contact" link — skip splash and go straight to end/contact view
  if (window.location.hash === '#contact') {
    splash.remove();
    showInstant(projectList);
    if (logoPanel) logoPanel.classList.add('project-mode');
    history.replaceState(null, '', window.location.pathname);
    window.__gotoContact = true;
    return;
  }

  let triggered = false;

  function reveal() {
    if (triggered) return;
    triggered = true;

    // Fade out splash
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 650);

    // Slide project list in from the right
    if (projectList) projectList.classList.add('is-visible');

    // Enter project mode — shows full thumbnail, hides logo/nav overlay
    if (logoPanel) logoPanel.classList.add('project-mode');

    // Guard hover events during the slide so the cursor can't accidentally
    // activate a project mid-list before the user has seen the landing state
    window.__transitionGuard = true;
    setTimeout(() => { window.__transitionGuard = false; }, 800);
  }

  // Trigger on first scroll
  window.addEventListener('scroll', reveal, { once: true, passive: true });

  // Mobile: swipe up on the splash to reveal
  if (window.matchMedia('(pointer: coarse)').matches) {
    let splashTouchStartY = 0;
    splash.addEventListener('touchstart', (e) => {
      splashTouchStartY = e.touches[0].clientY;
    }, { passive: true });
    splash.addEventListener('touchmove', (e) => {
      if (splashTouchStartY - e.touches[0].clientY > 50) reveal();
    }, { passive: true });
  }

  // Desktop: clicking the logo triggers the reveal
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
  const thumbA         = document.getElementById('logoThumbA');
  const thumbB         = document.getElementById('logoThumbB');
  const projects       = Array.from(document.querySelectorAll('.project'));
  const logoPanel      = document.getElementById('logoPanel');
  const fullBleed      = document.getElementById('fullBleed');
  const logoReveal     = document.getElementById('logoReveal');
  const navAboutThumb    = document.querySelector('#navAboutBtn .nav-btn-thumb');
  const navContactThumb  = document.querySelector('#navContactBtn .nav-btn-thumb');
  const navCreativeThumb = document.querySelector('#navCreativeBtn .nav-btn-thumb');

  if (!thumbA || !thumbB || !projects.length) return;

  let activeLayer          = 'a';
  let currentProject       = null;
  let expandedProject      = null;
  let mobileLastTapped     = null;
  let lastExpandedAt       = 0;
  let mobilePendingProject = null;

  function isMobile() { return window.matchMedia('(pointer: coarse)').matches; }

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
    if (url) {
      setThumb(url, position);
      if (fullBleed) {
        fullBleed.style.backgroundImage    = "url('" + url + "')";
        fullBleed.style.backgroundPosition = position || 'center';
      }
      if (navAboutThumb)    { navAboutThumb.style.backgroundImage    = "url('" + url + "')"; navAboutThumb.style.backgroundPosition    = position || 'center'; }
      if (navContactThumb)  { navContactThumb.style.backgroundImage  = "url('" + url + "')"; navContactThumb.style.backgroundPosition  = position || 'center'; }
      if (navCreativeThumb) { navCreativeThumb.style.backgroundImage = "url('" + url + "')"; navCreativeThumb.style.backgroundPosition = position || 'center'; }
    }
    projects.forEach(p => p.classList.toggle('is-active', p === project));
  }

  function expandFullBleed(project) {
    const url      = project.dataset.thumb;
    const position = project.dataset.thumbPosition || 'center';
    const link     = project.querySelector('a');
    const href     = link ? link.getAttribute('href') : '#';
    if (!url) return;
    const bgValue = "url('" + url + "')";
    fullBleed.style.backgroundImage    = bgValue;
    fullBleed.style.backgroundPosition = position;
    logoPanel.classList.add('is-expanded');
    expandedProject = project;
    lastExpandedAt  = Date.now();
    if (href !== '#') {
      sessionStorage.setItem('jbFullBleedBg',   bgValue);
      sessionStorage.setItem('jbFullBleedPos',  position);
      sessionStorage.setItem('jbFullBleedHref', href);
    }
  }

  function collapseFullBleed() {
    logoPanel.classList.remove('is-expanded');
    expandedProject  = null;
    mobileLastTapped = null;
  }

  // Set first project as initial state
  const firstWithThumb = projects.find(p => p.dataset.thumb);
  if (firstWithThumb) {
    thumbA.style.backgroundImage    = "url('" + firstWithThumb.dataset.thumb + "')";
    thumbA.style.backgroundPosition = firstWithThumb.dataset.thumbPosition || 'center';
    if (fullBleed) {
      fullBleed.style.backgroundImage    = "url('" + firstWithThumb.dataset.thumb + "')";
      fullBleed.style.backgroundPosition = firstWithThumb.dataset.thumbPosition || 'center';
    }
    if (navAboutThumb)    { navAboutThumb.style.backgroundImage    = "url('" + firstWithThumb.dataset.thumb + "')"; navAboutThumb.style.backgroundPosition    = firstWithThumb.dataset.thumbPosition || 'center'; }
    if (navContactThumb)  { navContactThumb.style.backgroundImage  = "url('" + firstWithThumb.dataset.thumb + "')"; navContactThumb.style.backgroundPosition  = firstWithThumb.dataset.thumbPosition || 'center'; }
    if (navCreativeThumb) { navCreativeThumb.style.backgroundImage = "url('" + firstWithThumb.dataset.thumb + "')"; navCreativeThumb.style.backgroundPosition = firstWithThumb.dataset.thumbPosition || 'center'; }
  }
  activateProject(projects[0]);

  // Restore full-bleed state after back-navigation from a project page.
  // Only restore when genuinely returning via #projects — on a plain refresh, clear it.
  if (fullBleed) {
    if (!window.__restoreFullBleed) {
      sessionStorage.removeItem('jbFullBleedBg');
      sessionStorage.removeItem('jbFullBleedPos');
      sessionStorage.removeItem('jbFullBleedHref');
    }
    if (!window.__restoreLastProject) {
      sessionStorage.removeItem('jbLastProjectHref');
    }
    window.__restoreFullBleed = false;
    const savedBg  = sessionStorage.getItem('jbFullBleedBg');
    const savedPos = sessionStorage.getItem('jbFullBleedPos');
    if (savedBg) {
      fullBleed.style.backgroundImage    = savedBg;
      fullBleed.style.backgroundPosition = savedPos || 'center';
    }
  }

  // Hover: activate project (updates thumbnail + fullBleed)
  // Guard: ignore events during the slide-in transition so the cursor
  // can't accidentally skip past project 01 on landing
  projects.forEach(p => {
    p.addEventListener('mouseenter', () => {
      if (window.__transitionGuard) return;
      activateProject(p);
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
    if (top) {
      activateProject(top);
      if (mobilePendingProject && mobilePendingProject !== top) mobilePendingProject = null;
    }
  }, { threshold: 0.3 });
  projects.forEach(p => observer.observe(p));

  // Nav button hover: switch thumbnail mask to ABOUT or CONTACT letters
  // When hovering a nav button, hide the CREATIVE thumbs so only one word
  // carries the image at a time. mouseleave restores the active layer.
  [document.getElementById('navAboutBtn'), document.getElementById('navContactBtn'), document.getElementById('navCreativeBtn')].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('mouseenter', () => {
      thumbA.style.transition = 'none';
      thumbB.style.transition = 'none';
      thumbA.style.opacity = '0';
      thumbB.style.opacity = '0';
    });
    btn.addEventListener('mouseleave', () => {
      const active = activeLayer === 'a' ? thumbA : thumbB;
      active.style.opacity = '1';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        thumbA.style.transition = '';
        thumbB.style.transition = '';
      }));
    });
  });

  // Project navigation: desktop single-click; mobile double-tap
  projects.forEach(p => {
    const link = p.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href');

    // Desktop: single click navigates
    link.addEventListener('click', (e) => {
      if (p.id === 'aboutMobileLink') {
        e.preventDefault();
        if (typeof window.__triggerAbout === 'function') window.__triggerAbout();
        return;
      }
      if (p.id === 'contactListBtn') {
        e.preventDefault();
        if (typeof window.__triggerEnd === 'function') window.__triggerEnd();
        return;
      }
      if (p.dataset.thumb && href && href !== '#') {
        const position = p.dataset.thumbPosition || 'center';
        sessionStorage.setItem('jbLastProjectHref', href);
        sessionStorage.setItem('jbFullBleedBg',   "url('" + p.dataset.thumb + "')");
        sessionStorage.setItem('jbFullBleedPos',  position);
        sessionStorage.setItem('jbFullBleedHref', href);
      }
    });

    // Mobile: first tap shows thumbnail in top panel, second tap navigates
    link.addEventListener('touchend', (e) => {
      if (!isMobile()) return;

      if (p.id === 'aboutMobileLink') {
        e.preventDefault();
        if (typeof window.__triggerAbout === 'function') window.__triggerAbout();
        return;
      }
      if (p.id === 'contactListBtn') {
        e.preventDefault();
        if (typeof window.__triggerEnd === 'function') window.__triggerEnd();
        return;
      }

      if (!href || href === '#') return;
      e.preventDefault();

      if (mobilePendingProject === p) {
        // Second tap — navigate
        const position = p.dataset.thumbPosition || 'center';
        sessionStorage.setItem('jbLastProjectHref', href);
        if (p.dataset.thumb) {
          sessionStorage.setItem('jbFullBleedBg',   "url('" + p.dataset.thumb + "')");
          sessionStorage.setItem('jbFullBleedPos',  position);
          sessionStorage.setItem('jbFullBleedHref', href);
        }
        window.location.href = href;
      } else {
        // First tap — activate thumbnail in top panel
        mobilePendingProject = p;
        activateProject(p);
      }
    }, { passive: false });
  });


  // Restore the current project thumbnail after the about view exits
  window.__restoreCurrentThumb = function () {
    if (!currentProject || !currentProject.dataset.thumb) return;
    const url = currentProject.dataset.thumb;
    const pos = currentProject.dataset.thumbPosition;
    thumbB.style.backgroundImage    = "url('" + url + "')";
    thumbB.style.backgroundPosition = pos || 'center';
    thumbB.style.opacity            = '1';
    thumbA.style.opacity            = '0';
    activeLayer = 'b';
    if (fullBleed) {
      fullBleed.style.backgroundImage    = "url('" + url + "')";
      fullBleed.style.backgroundPosition = pos || 'center';
    }
  };

  // On return from a project page: scroll to the last-viewed project
  if (window.__restoreLastProject) {
    window.__restoreLastProject = false;
    const lastHref = sessionStorage.getItem('jbLastProjectHref');
    if (lastHref) {
      const lastProject = projects.find(p => {
        const a = p.querySelector('a');
        return a && a.getAttribute('href') === lastHref;
      });
      if (lastProject) {
        requestAnimationFrame(() => {
          const logoPanelEl = document.getElementById('logoPanel');
          const panelH      = logoPanelEl ? logoPanelEl.getBoundingClientRect().height : 0;
          const top         = lastProject.getBoundingClientRect().top + window.scrollY - panelH - 16;
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
          activateProject(lastProject);
        });
      }
    }
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
  const contactFromAboutBtn = document.getElementById('contactFromAboutBtn');
  const logoReveal          = document.getElementById('logoReveal');
  const timelineBtn         = document.getElementById('timelineBtn');
  const aboutTimeline       = document.getElementById('aboutTimeline');
  const fullBioBtn          = document.getElementById('fullBioBtn');
  const aboutBioDropdown    = document.getElementById('aboutBioDropdown');
  if (!logoPanelEl || !aboutView) return;

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
  let endEnteredFromAbout = false;
  let atBottomSince    = null;
  let aboutTouchY      = 0;
  let bottomExcess     = 0;   // accumulated wheel delta while at page bottom (hard-scroll gate)
  let upExcess         = 0;   // accumulated upward wheel delta while in about (prevents accidental dismiss)
  let endDismissedAt   = null; // guard: ignore scroll-up-from-about for a short time after leaving end

  function pickEndImage() {
    const pool = window.__splashImage
      ? END_IMAGES.filter(img => img !== window.__splashImage)
      : END_IMAGES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function transitionToEnd() {
    if (inEnd || !endView) return;
    inEnd = true;
    endEnteredFromAbout = inAbout;
    endView.style.backgroundImage = "url('" + pickEndImage() + "')";
    endView.classList.add('is-visible');
  }

  function transitionFromEnd() {
    if (!inEnd || !endView) return;
    inEnd = false;
    endView.classList.remove('is-visible');
    if (window.innerWidth <= 768 && aboutCol) aboutCol.scrollTop = 0;
  }

  // Expose so the thumbnail IIFE can trigger the about/end views from the project list
  window.__triggerAbout    = function () { transitionToAbout(); };
  window.__triggerEnd      = function () { transitionToEnd();   };
  window.__triggerFromAbout = function () { transitionFromAbout(); };

  const aboutMobileThumb = document.getElementById('aboutMobileThumb');

  const navAboutBtn   = document.getElementById('navAboutBtn');
  const navContactBtn = document.getElementById('navContactBtn');
  const navCreativeBtn = document.getElementById('navCreativeBtn');
  if (navAboutBtn)    navAboutBtn.addEventListener('click',   () => transitionToAbout());
  if (navContactBtn)  navContactBtn.addEventListener('click', () => transitionToEnd());
  if (navCreativeBtn) navCreativeBtn.addEventListener('click', () => transitionFromAbout());

  function transitionToAbout() {
    if (inAbout) return;
    inAbout = true;
    inAboutSince = Date.now();
    atBottomSince = null;

    sessionStorage.removeItem('jbFullBleedBg');
    sessionStorage.removeItem('jbFullBleedPos');
    sessionStorage.removeItem('jbFullBleedHref');

    // Mobile about thumbnail — same image as the desktop about column
    if (aboutMobileThumb) {
      aboutMobileThumb.style.backgroundImage    = "url('About head 1.jpg')";
      aboutMobileThumb.style.backgroundPosition = 'center';
    }

    // Show about-view instantly — covers the portfolio layout behind it
    aboutView.style.transition    = 'none';
    aboutView.style.opacity       = '1';
    aboutView.style.pointerEvents = 'auto';
    aboutCol.style.opacity        = '0';

    // Fade in the about text
    setTimeout(() => {
      aboutCol.style.transition = 'opacity 0.5s ease';
      aboutCol.style.opacity    = '1';
    }, 100);
  }

  function transitionFromAbout() {
    if (!inAbout) return;
    inAbout = false;

    // Reset about col scroll and collapse timeline so it's fresh on next visit
    if (aboutCol) aboutCol.scrollTop = 0;
    if (aboutTimeline) { aboutTimeline.classList.remove('is-open'); }
    if (timelineBtn) { timelineBtn.querySelector('h2').textContent = 'Timeline'; }
    if (aboutBioDropdown) { aboutBioDropdown.classList.remove('is-open'); }
    if (fullBioBtn) { fullBioBtn.querySelector('h2').textContent = 'Full Bio'; }
    upExcess = 0;

    if (inEnd) transitionFromEnd();

    // Fade out about text then hide the view
    aboutCol.style.transition = 'opacity 0.3s ease';
    aboutCol.style.opacity    = '0';

    setTimeout(() => {
      aboutView.style.transition    = 'none';
      aboutView.style.opacity       = '0';
      aboutView.style.pointerEvents = 'none';
      aboutCol.style.transition     = '';
      aboutCol.style.opacity        = '0';
      if (typeof window.__restoreCurrentThumb === 'function') {
        window.__restoreCurrentThumb();
      }
    }, 350);
  }

  // Contact button — go to end/contact view
  if (contactFromAboutBtn) {
    contactFromAboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!inAbout) return;
      transitionToEnd();
    });
  }

  // End-view corner nav buttons
  const endToCreativeBtn = document.getElementById('endToCreativeBtn');
  const endToAboutBtn    = document.getElementById('endToAboutBtn');
  if (endToCreativeBtn) {
    endToCreativeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      transitionFromEnd();
      if (inAbout) transitionFromAbout();
    });
  }
  if (endToAboutBtn) {
    endToAboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      transitionFromEnd();
      if (!inAbout) transitionToAbout();
    });
  }

  // Projects button — return to project list
  const projectsFromAboutBtn = document.getElementById('projectsFromAboutBtn');
  if (projectsFromAboutBtn) {
    projectsFromAboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!inAbout) return;
      transitionFromAbout();
    });
  }

  // Timeline toggle — expand/collapse the career date list
  if (timelineBtn && aboutTimeline) {
    timelineBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = aboutTimeline.classList.toggle('is-open');
      timelineBtn.querySelector('h2').textContent = open ? 'Close Timeline' : 'Timeline';
    });
  }

  // Full Bio toggle — expand/collapse the full bio text
  if (fullBioBtn && aboutBioDropdown) {
    fullBioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = aboutBioDropdown.classList.toggle('is-open');
      fullBioBtn.querySelector('h2').textContent = open ? 'Close Bio' : 'Full Bio';
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
    // End view: scroll up → back to about (if entered from about) or back to project list
    if (inEnd && e.deltaY < 0) {
      transitionFromEnd();
      if (endEnteredFromAbout && !inAbout) transitionToAbout();
      endDismissedAt = Date.now();
      return;
    }
    if (inEnd) return;

    // In about view, ignore wheel events over the right (logo/nav) panel
    if (inAbout && logoPanelEl && logoPanelEl.contains(e.target)) return;

    // About view: scroll down → blocked (only Contact button triggers end view)
    if (inAbout && e.deltaY > 0) return;

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

    // End view: swipe down → back to about (if entered from about) or back to project list
    if (inEnd && dy > 40) {
      transitionFromEnd();
      if (endEnteredFromAbout && !inAbout) transitionToAbout();
      endDismissedAt = Date.now();
      return;
    }
    if (inEnd) return;

    // About view: swipe up → blocked (only Contact button triggers end view)
    if (inAbout && dy < -40) return;

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

    const projectList = document.querySelector('.project-list');
    const logoPanelEl = document.getElementById('logoPanel');

    // Reverse of the intro: slide the project list back out to the right
    if (projectList) projectList.classList.remove('is-visible');
    if (logoPanelEl) logoPanelEl.classList.remove('project-mode');

    // Build a matching splash overlay and fade it in simultaneously
    const SPLASH_IMAGES = [
      "site end headers/end image 4.png",
      "site end headers/end image 5.png",
      "site end headers/end image 6.png",
      "site end headers/end image 7.webp",
    ];
    const bgImg = SPLASH_IMAGES[Math.floor(Math.random() * SPLASH_IMAGES.length)];
    sessionStorage.setItem('jbReturnSplashImg', bgImg);

    const splashEl = document.createElement('div');
    splashEl.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:500',
      'background-color:#111',
      'background-image:url("' + bgImg + '")',
      'background-size:cover', 'background-position:center',
      'display:flex', 'align-items:center', 'justify-content:center',
      'opacity:0', 'transition:opacity 0.6s ease',
    ].join(';');

    const overlayEl = document.createElement('div');
    overlayEl.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.45);z-index:0';

    const contentEl = document.createElement('div');
    contentEl.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:1.75rem';

    const imgEl = document.createElement('img');
    imgEl.src = 'NARROW CAC CENTRERD FILES/NARROW JOE BRUCE.png';
    imgEl.alt = 'Joe Bruce';
    imgEl.style.cssText = 'display:block;width:clamp(280px,42vw,680px);height:auto;filter:invert(1)';

    const taglineEl = document.createElement('p');
    taglineEl.textContent = 'Writer & Executive Creative Director.';
    taglineEl.style.cssText = [
      'font-family:"Cormorant Garamond",Georgia,serif',
      'font-size:clamp(0.9rem,1.4vw,1.2rem)',
      'font-weight:300', 'letter-spacing:0.08em',
      'color:rgba(255,255,255,0.8)', 'text-align:center',
    ].join(';');

    contentEl.appendChild(imgEl);
    contentEl.appendChild(taglineEl);
    splashEl.appendChild(overlayEl);
    splashEl.appendChild(contentEl);
    document.body.appendChild(splashEl);

    // Fade splash in
    requestAnimationFrame(() => requestAnimationFrame(() => {
      splashEl.style.opacity = '1';
    }));

    // Reload once both animations have settled
    setTimeout(() => { window.location.reload(); }, 1000);
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
