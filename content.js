(() => {
  'use strict';

  if (window.__vscLoaded) return;
  window.__vscLoaded = true;

  const MIN_SPEED = 0.25;
  const MAX_SPEED = 16;
  const HIDE_DELAY = 1600;
  const BADGE_INSET = 10; // px from top-left corner of video

  let settings = { step: 0.25, speed: 1 };
  const entries = []; // { video, host, shadow, badge }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function round2(n)         { return Math.round(n * 100) / 100; }
  function clamp(v, mn, mx)  { return Math.min(mx, Math.max(mn, v)); }
  function snap(speed, step) { return round2(Math.round(speed / step) * step); }
  function fmt(speed) {
    const s = round2(speed);
    return (Number.isInteger(s) ? s.toFixed(0) : s.toFixed(2).replace(/0+$/, '')) + 'x';
  }

  // ── Storage ───────────────────────────────────────────────────────────────
  function loadSettings(cb) {
    try {
      chrome.storage.sync.get({ step: 0.25, speed: 1 }, data => {
        settings.step  = parseFloat(data.step)  || 0.25;
        settings.speed = parseFloat(data.speed) || 1;
        cb && cb();
      });
    } catch (_) { cb && cb(); }
  }

  function saveSpeed(speed) {
    settings.speed = speed;
    try { chrome.storage.sync.set({ speed }); } catch (_) {}
  }

  // ── Badge CSS ─────────────────────────────────────────────────────────────
  function badgeCSS() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&display=swap');

      :host {
        all: initial;
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: visible;
        pointer-events: none;
        z-index: 2147483647;
      }

      .badge {
        font-family: 'Roboto Mono', 'Consolas', monospace;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        background: rgba(0, 0, 0, 0.70);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 9px;
        padding: 5px 11px;
        letter-spacing: 0.04em;
        box-shadow: 0 2px 14px rgba(0,0,0,0.45);
        pointer-events: none;
        white-space: nowrap;
        position: absolute;
        top: ${BADGE_INSET}px;
        left: ${BADGE_INSET}px;

        opacity: 0;
        transform: scale(0.85) translateY(-4px);
        transition: opacity 0.15s ease, transform 0.15s ease;
      }

      .badge.on {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    `;
  }

  // ── Get the right container for the badge ────────────────────────────────
  // In fullscreen, document.fullscreenElement is the container we must use.
  // The badge host must live INSIDE that element to be visible.
  // For normal play we attach to the video's own parent so position:absolute
  // top/left always means "top-left of the video area".
  function getContainer(video) {
    const fs = document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement;
    if (fs) return fs;
    return video.parentElement || document.documentElement;
  }

  // ── Inject / re-home badge ────────────────────────────────────────────────
  function alreadyInjected(video) {
    return entries.some(e => e.video === video);
  }

  function createBadgeHost() {
    const host = document.createElement('div');
    // Will be repositioned relative to its container
    host.style.cssText = [
      'all:initial',
      'position:absolute',
      'top:0', 'left:0',
      'width:0', 'height:0',
      'overflow:visible',
      'pointer-events:none',
      'z-index:2147483647',
    ].join(';');
    return host;
  }

  function injectBadge(video) {
    if (alreadyInjected(video)) return;
    if (video.offsetWidth < 80 || video.offsetHeight < 40) return;

    const host = createBadgeHost();
    const shadow = host.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = badgeCSS();

    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = fmt(settings.speed);

    shadow.appendChild(styleEl);
    shadow.appendChild(badge);

    const entry = { video, host, shadow, badge, currentContainer: null };
    entries.push(entry);

    // Place host and position badge
    placeHost(entry);

    // Apply current speed
    try { video.playbackRate = settings.speed; } catch(_) {}

    // Fight back if player resets speed
    video.addEventListener('ratechange', () => {
      if (Math.abs(video.playbackRate - settings.speed) > 0.02) {
        try { video.playbackRate = settings.speed; } catch(_) {}
      }
    });
  }

  // ── Place host inside the right container and position badge ─────────────
  function placeHost(entry) {
    const { video, host } = entry;
    const container = getContainer(video);

    // Re-parent if container changed (e.g. entered/exited fullscreen)
    if (entry.currentContainer !== container) {
      if (host.parentElement) host.parentElement.removeChild(host);
      container.appendChild(host);
      entry.currentContainer = container;
    }

    positionHost(entry);
  }

  function positionHost(entry) {
    const { video, host } = entry;

    // Get video rect relative to its current container
    const videoRect     = video.getBoundingClientRect();
    const containerRect = entry.currentContainer.getBoundingClientRect();

    if (!videoRect.width || !videoRect.height) return;

    // Position the host at the top-left of the video, relative to container
    const top  = videoRect.top  - containerRect.top;
    const left = videoRect.left - containerRect.left;

    host.style.top  = top  + 'px';
    host.style.left = left + 'px';
  }

  // ── rAF loop — reposition every frame ────────────────────────────────────
  function tick() {
    const fs = document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement;

    entries.forEach(entry => {
      // If fullscreen state changed, re-home the host
      const newContainer = fs || entry.video.parentElement || document.documentElement;
      if (entry.currentContainer !== newContainer) {
        placeHost(entry);
      } else {
        positionHost(entry);
      }
    });

    requestAnimationFrame(tick);
  }

  // ── Fullscreen change — immediately re-home all badges ───────────────────
  function onFullscreenChange() {
    // Small delay so the browser finishes its fullscreen transition
    setTimeout(() => {
      entries.forEach(placeHost);
      // Also scan for new videos that may have appeared in fullscreen
      scanVideos();
    }, 150);
  }

  document.addEventListener('fullscreenchange',       onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('mozfullscreenchange',    onFullscreenChange);
  document.addEventListener('MSFullscreenChange',     onFullscreenChange);

  // ── Show badge ────────────────────────────────────────────────────────────
  let badgeTimer = null;

  function showBadge(speed) {
    entries.forEach(({ badge }) => {
      badge.textContent = fmt(speed);
      badge.classList.add('on');
    });
    clearTimeout(badgeTimer);
    badgeTimer = setTimeout(() => {
      entries.forEach(({ badge }) => badge.classList.remove('on'));
    }, HIDE_DELAY);
  }

  // ── Apply speed ───────────────────────────────────────────────────────────
  function applySpeedToAll(speed, showBadgeFlag) {
    speed = clamp(snap(speed, settings.step), MIN_SPEED, MAX_SPEED);
    settings.speed = speed;
    saveSpeed(speed);
    document.querySelectorAll('video').forEach(v => {
      try { v.playbackRate = speed; } catch(_) {}
    });
    if (showBadgeFlag) showBadge(speed);
  }

  function changeSpeed(delta) {
    applySpeedToAll(clamp(snap(settings.speed + delta, settings.step), MIN_SPEED, MAX_SPEED), true);
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (document.activeElement?.isContentEditable) return;
    if (e.shiftKey && e.code === 'KeyZ') { e.preventDefault(); changeSpeed(-settings.step); }
    if (e.shiftKey && e.code === 'KeyX') { e.preventDefault(); changeSpeed(+settings.step);  }
    if (e.shiftKey && e.code === 'KeyR') { e.preventDefault(); applySpeedToAll(1, true);      }
  }, true);

  // ── Messages from popup ───────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'VSC_STEP')  settings.step = parseFloat(msg.step) || 0.25;
    if (msg.type === 'VSC_SPEED') applySpeedToAll(parseFloat(msg.speed) || 1, true);
  });

  // ── DOM scan ──────────────────────────────────────────────────────────────
  function scanVideos() {
    document.querySelectorAll('video').forEach(v => {
      if (!alreadyInjected(v)) injectBadge(v);
    });
  }

  new MutationObserver(muts => {
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeName === 'VIDEO') injectBadge(n);
        if (n.querySelectorAll) n.querySelectorAll('video').forEach(injectBadge);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // ── Init ──────────────────────────────────────────────────────────────────
  loadSettings(() => {
    scanVideos();
    setTimeout(scanVideos, 800);
    setTimeout(scanVideos, 2500);
    requestAnimationFrame(tick);
  });

})();
