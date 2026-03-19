// ─────────────────────────────────────────
// project.js — shared behaviour for all project pages
// ─────────────────────────────────────────

// Scroll-down past the bottom → return to the project list.
// Mirrors the double-scroll-to-top feature on the index page.
(function () {
  let atBottomSince = null;
  let leaving       = false;
  let touchStartY   = 0;

  // Track when the user reaches the very bottom of the page
  window.addEventListener('scroll', () => {
    const atBottom =
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
    if (atBottom && atBottomSince === null) {
      atBottomSince = Date.now();
    } else if (!atBottom) {
      atBottomSince = null;
    }
  }, { passive: true });

  function returnToList() {
    if (leaving) return;
    leaving = true;

    // Block further interaction and fade the page out
    document.body.style.pointerEvents = 'none';
    document.body.style.transition    = 'opacity 0.4s ease';
    document.body.style.opacity       = '0';

    // Navigate once the fade has settled
    setTimeout(() => {
      window.location.href = 'index.html#projects';
    }, 420);
  }

  // Desktop: overscroll down while at the bottom (after 300 ms dwell)
  window.addEventListener('wheel', (e) => {
    if (leaving) return;
    if (e.deltaY > 0) {
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince !== null && Date.now() - atBottomSince > 300) {
        returnToList();
      }
    }
  }, { passive: true });

  // Mobile: swipe up (finger moves up = content scrolls down) at the bottom
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (leaving) return;
    const dy = e.touches[0].clientY - touchStartY;
    if (dy < -40) { // negative = finger moving up = scrolling down
      const atBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 5;
      if (atBottom && atBottomSince !== null && Date.now() - atBottomSince > 300) {
        returnToList();
      }
    }
  }, { passive: true });

}());
