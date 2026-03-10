const MIN = 0.25, MAX = 16;

let currentSpeed = 1;
let currentStep  = 0.25;

// ── DOM refs ──────────────────────────────────────────────────────────────
const speedDisplay  = document.getElementById('speedDisplay');
const btnIncrease   = document.getElementById('btnIncrease');
const btnDecrease   = document.getElementById('btnDecrease');
const btnReset      = document.getElementById('btnReset');
const presetBtns    = document.querySelectorAll('.preset-btn');
const stepOpts      = document.querySelectorAll('.step-opt');
const saveIndicator = document.getElementById('saveIndicator');
const tabs          = document.querySelectorAll('.tab');
const panels        = document.querySelectorAll('.panel');

// ── Tab switching ─────────────────────────────────────────────────────────
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const id = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle('active', t === tab));
    panels.forEach(p => p.classList.toggle('active', p.id === `tab-${id}`));
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function round2(n) { return Math.round(n * 100) / 100; }
function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
function snap(speed, step) { return round2(Math.round(speed / step) * step); }

function fmt(speed) {
  const s = round2(speed);
  return (Number.isInteger(s) ? s.toFixed(0) : s.toFixed(2).replace(/0+$/, '')) + 'x';
}

function updateSpeedUI(speed) {
  currentSpeed = speed;
  speedDisplay.textContent = fmt(speed);
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === round2(speed));
  });
}

function updateStepUI(step) {
  currentStep = step;
  stepOpts.forEach(opt => {
    opt.classList.toggle('active', parseFloat(opt.dataset.step) === step);
  });
}

// ── Send speed to content script ──────────────────────────────────────────
function sendSpeed(speed) {
  speed = clamp(snap(speed, currentStep), MIN, MAX);
  updateSpeedUI(speed);
  chrome.storage.sync.set({ speed });
  sendToTab({ type: 'VSC_SPEED', speed });
}

function sendToTab(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, msg).catch(() => {});
    }
  });
}

// ── Speed tab events ──────────────────────────────────────────────────────
btnIncrease.addEventListener('click', () => sendSpeed(round2(currentSpeed + currentStep)));
btnDecrease.addEventListener('click', () => sendSpeed(round2(currentSpeed - currentStep)));
btnReset.addEventListener('click',    () => sendSpeed(1));

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => sendSpeed(parseFloat(btn.dataset.speed)));
});

// ── Settings tab events ───────────────────────────────────────────────────
let saveTimer = null;

function showSaved() {
  saveIndicator.classList.add('show');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveIndicator.classList.remove('show'), 1800);
}

stepOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    const step = parseFloat(opt.dataset.step);
    updateStepUI(step);
    chrome.storage.sync.set({ step });
    sendToTab({ type: 'VSC_STEP', step });
    showSaved();
  });
});

// ── Init — load from storage ──────────────────────────────────────────────
chrome.storage.sync.get({ speed: 1, step: 0.25 }, data => {
  updateSpeedUI(parseFloat(data.speed) || 1);
  updateStepUI(parseFloat(data.step)   || 0.25);
});
