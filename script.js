// Nav border appears once the page has scrolled past the work grid.
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const toggle = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}());

// "Joe Bruce" nav button reveals the name + tagline as an overlay — hidden
// by default so the work grid is the only thing visible on load.
(function () {
  const introToggle = document.getElementById('introToggle');
  const introOverlay = document.getElementById('introOverlay');
  if (!introToggle || !introOverlay) return;

  const close = () => introOverlay.classList.remove('visible');

  introToggle.addEventListener('click', () => introOverlay.classList.toggle('visible'));
  introOverlay.addEventListener('click', (e) => { if (e.target === introOverlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}());

// Work grid fills the viewport exactly at any window size: pick the column/row
// split (from divisors of the card count) whose cells are closest to square,
// so there's never empty space or a scrollbar.
(function () {
  const nav = document.getElementById('nav');
  const viewport = document.getElementById('work');
  const grid = document.getElementById('workGrid');
  if (!nav || !viewport || !grid) return;
  const cards = grid.children.length;
  if (!cards) return;

  function layout() {
    const navHeight = nav.offsetHeight;
    viewport.style.marginTop = `${navHeight}px`;
    viewport.style.height = `${window.innerHeight - navHeight}px`;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    let best = null;
    for (let cols = 1; cols <= cards; cols++) {
      const rows = Math.ceil(cards / cols);
      const empty = cols * rows - cards;
      const cellAspect = (vw / cols) / (vh / rows);
      const squareness = Math.abs(Math.log(cellAspect));
      const score = empty * 1000 + squareness;
      if (!best || score < best.score) best = { cols, rows, score };
    }

    grid.style.gridTemplateColumns = `repeat(${best.cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${best.rows}, 1fr)`;
  }

  layout();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 100);
  });
}());

// Project-page video: poster + click-to-play. Nothing is fetched until the
// viewer actually clicks, so a case study with a dozen films stays light.
// Sources are either a local mp4 (data-mp4) or a Squarespace HLS stream
// (data-hls) — HLS plays natively in Safari, and hls.js is pulled in on
// demand for browsers that need it.
(function () {
  const wraps = document.querySelectorAll('.video-wrap');
  if (!wraps.length) return;

  const nativeHls = !!document
    .createElement('video')
    .canPlayType('application/vnd.apple.mpegurl');

  let hlsLoader = null;
  function loadHlsLib() {
    if (hlsLoader) return hlsLoader;
    hlsLoader = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
      s.onload = () => resolve(window.Hls);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
    return hlsLoader;
  }

  wraps.forEach((wrap) => {
    const video = wrap.querySelector('video');
    const overlay = wrap.querySelector('.video-overlay');
    const mp4 = wrap.dataset.mp4;
    const hls = wrap.dataset.hls;
    if (!video || (!mp4 && !hls)) return;

    let attached = false;

    function attach() {
      if (attached) return Promise.resolve();
      attached = true;
      video.controls = true;

      if (mp4) {
        video.src = mp4;
        return Promise.resolve();
      }
      if (nativeHls) {
        video.src = hls;
        return Promise.resolve();
      }
      return loadHlsLib().then((Hls) => {
        if (Hls && Hls.isSupported()) {
          const inst = new Hls({ startLevel: -1 });
          inst.loadSource(hls);
          inst.attachMedia(video);
        } else {
          video.src = hls; // last resort
        }
      });
    }

    wrap.addEventListener('click', () => {
      attach().then(() => {
        if (video.paused) video.play(); else video.pause();
      });
    });

    video.addEventListener('play', () => overlay && overlay.classList.add('hidden'));
    video.addEventListener('pause', () => overlay && overlay.classList.remove('hidden'));
    video.addEventListener('ended', () => overlay && overlay.classList.remove('hidden'));
  });
}());
