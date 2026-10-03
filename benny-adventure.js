/* Lakherance Arcade — Benny: The Brave Beaver (2.5D adventure) v447
   Self-contained: painted parallax worlds + Benny's painted sprites, 5 missions.
   Public API: window.BennyAdventure = { openSelect, start, stop } */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const EN = () => (typeof state !== 'undefined' && state.lang === 'en');
const T = (de, en) => EN() ? en : de;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const H = 540, GROUND = 470;
const SAVE_KEY = 'lakherance_benny_adventure';

/* ---------------- storage ---------------- */
let HERO = 'benny';
function saveKey(h) { return HEROES[h || HERO].save; }
function loadSave(h) { try { return Object.assign({ unlocked: 1, stars: {}, coins: 0 }, JSON.parse(localStorage.getItem(saveKey(h)) || '{}')); } catch (e) { return { unlocked: 1, stars: {}, coins: 0 }; } }
function writeSave(s) { try { localStorage.setItem(saveKey(), JSON.stringify(s)); } catch (e) {} }

/* ---------------- images ---------------- */
const IMG = {};
['benny-side', 'benny-front', 'log', 'rocks', 'sticks', 'benny-torso', 'benny-head', 'benny-arm', 'benny-foot', 'benny-tail'].forEach(n => { const i = new Image(); i.src = 'adventure/' + n + '.png'; IMG[n] = i; });
// darker copies for the far-side limbs (painted depth)
const DARK = {};
function darkOf(n) {
  if (DARK[n]) return DARK[n]; const im = IMG[n]; if (!ok(im)) return null;
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d');
  g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(25,12,4,.45)'; g.fillRect(0, 0, c.width, c.height);
  return (DARK[n] = c);
}
const ok = i => i && i.complete && i.naturalWidth > 0;

/* ---------------- sound (uses app's playTone + sound setting) ---------------- */
function tone(a, b, d, v, t) { try { if (typeof playTone === 'function') playTone(a, b, d, v, t); } catch (e) {} }
const SFX = {
  jump: () => tone(380, 720, .13, .05, 'square'),
  coin: () => tone(980, 1500, .07, .045, 'sine'),
  item: () => { tone(520, 880, .1, .06, 'triangle'); setTimeout(() => tone(880, 1320, .12, .05, 'triangle'), 80); },
  hurt: () => tone(260, 70, .28, .08, 'sawtooth'),
  build: () => { tone(160, 120, .09, .09, 'square'); setTimeout(() => tone(170, 110, .09, .09, 'square'), 140); },
  splash: () => tone(600, 90, .3, .05, 'triangle'),
  quack: () => tone(700, 520, .09, .05, 'square'),
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, f * 1.01, .18, .06, 'triangle'), i * 120))
};

/* ---------------- seeded random ---------------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ================================================================
   LEVELS
   ================================================================ */
const LEVELS = [
  { id: 1, theme: 'day', type: 'dam', thumb: 'benny-l1.jpg',
    name: ['Der verlorene Damm', 'The Lost Dam'],
    story: ['Der alte Damm ist gebrochen! Sammle 5 Stämme und repariere ihn, bevor der Fluss das Dorf flutet.', 'The old dam is broken! Collect 5 logs and repair it before the river floods the village.'] },
  { id: 2, theme: 'water', type: 'swim', thumb: 'benny-l2.jpg',
    name: ['Flussforscher', 'River Explorer'],
    story: ['Tauche in den Fluss und finde 6 glänzende Flussperlen. Achte auf deine Luft und auf die hungrigen Hechte!', 'Dive into the river and find 6 shiny river pearls. Watch your air and the hungry pikes!'] },
  { id: 3, theme: 'bay', type: 'carry', thumb: 'benny-l3.jpg',
    name: ['Baumeister-Bucht', 'Builder Bay'],
    story: ['Trage 6 Stämme einzeln zum großen Damm. Vorsicht — im Wind fallen Äste von den Bäumen!', 'Carry 6 logs one by one to the big dam. Careful — branches fall from the trees in the wind!'] },
  { id: 4, theme: 'meadow', type: 'ducks', thumb: 'benny-l4.jpg',
    name: ['Entenfamilie', 'Duck Family'],
    story: ['5 Entenküken haben ihre Mama verloren. Finde sie und führe alle sicher zum Teich — am Fuchs vorbei!', '5 ducklings lost their mum. Find them and lead them all safely to the pond — past the fox!'] },
  { id: 5, theme: 'night', type: 'moon', thumb: 'benny-l5.jpg',
    name: ['Mondpfad', 'Moon Trail'],
    story: ['Nachts leuchten die Mondsteine. Sammle alle 8 und bring sie zum Mondfelsen. Die Glühwürmchen zeigen den Weg.', 'At night the moonstones glow. Collect all 8 and bring them to the Moon Rock. The fireflies light the way.'] }
];

function coinRow(arr, x0, n, y, gap = 46) { for (let i = 0; i < n; i++) arr.push({ k: 'coin', x: x0 + i * gap, y }); }
function coinArc(arr, x0, n, y, hgt = 70, gap = 44) { for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : .5; arr.push({ k: 'coin', x: x0 + i * gap, y: y - Math.sin(t * Math.PI) * hgt }); } }

function buildLevel(idx) {
  if (HERO === 'owl') return buildOwl(idx);
  if (HERO === 'ren') return buildRen(idx);
  const L = { idx, def: LEVELS[idx], ground: [], plats: [], solids: [], items: [], enemies: [], hazards: [], checkpoints: [], deco: [] };
  const I = L.items;
  if (idx === 0) { // The Lost Dam
    L.len = 3900;
    L.ground = [[0, 1150], [1310, 2350], [2570, 3900]];
    L.plats = [{ x: 1172, y: 452, w: 118, bob: 1 }, { x: 2372, y: 448, w: 92, bob: 1 }, { x: 2474, y: 432, w: 92, bob: 1 },
      { x: 840, y: 360, w: 160 }, { x: 1830, y: 345, w: 160 }, { x: 3020, y: 350, w: 160 }];
    L.solids = [{ x: 560, w: 96, h: 50 }, { x: 1650, w: 96, h: 50 }, { x: 2860, w: 96, h: 50 }];
    [[920, 322], [1480, 432], [1910, 307], [2700, 432], [3100, 312]].forEach(([x, y]) => I.push({ k: 'log', x, y }));
    coinArc(I, 540, 4, 400); coinRow(I, 250, 5, 432); coinArc(I, 1170, 4, 400, 90); coinArc(I, 1630, 4, 400);
    coinRow(I, 2050, 5, 432); coinArc(I, 2380, 4, 390, 70, 50); coinArc(I, 2840, 4, 400); coinRow(I, 3250, 4, 432);
    L.enemies = [{ k: 'wasp', x0: 1600, r: 150, y0: 360 }, { k: 'wasp', x0: 2760, r: 170, y0: 370 }];
    L.checkpoints = [1420, 2620];
    L.goal = { k: 'dam', x: 3560 };
    L.need = 5;
  } else if (idx === 1) { // River Explorer (underwater)
    L.len = 3700; L.swim = true; L.surface = 110; L.bed = 478;
    L.solids = [{ x: 700, w: 120, h: 70 }, { x: 1500, w: 150, h: 110 }, { x: 2350, w: 120, h: 80 }, { x: 3000, w: 140, h: 95 }];
    [[520, 450], [1080, 250], [1575, 340], [2050, 452], [2600, 200], [3200, 450]].forEach(([x, y]) => I.push({ k: 'pearl', x, y }));
    coinRow(I, 300, 5, 300); coinArc(I, 820, 5, 420, 120); coinRow(I, 1250, 4, 180); coinRow(I, 1800, 5, 330);
    coinArc(I, 2150, 5, 400, 140); coinRow(I, 2700, 5, 300); coinRow(I, 3300, 4, 250);
    L.enemies = [{ k: 'pike', x0: 1150, r: 260, y0: 360, sp: 120 }, { k: 'pike', x0: 1950, r: 300, y0: 240, sp: 150 }, { k: 'pike', x0: 2800, r: 280, y0: 400, sp: 165 }];
    L.checkpoints = [1300, 2450];
    L.goal = { k: 'exit', x: 3560 };
    L.need = 6;
  } else if (idx === 2) { // Builder Bay (carry)
    L.len = 3500;
    L.ground = [[0, 1500], [1650, 3500]];
    L.plats = [{ x: 1522, y: 450, w: 112, bob: 1 }, { x: 1380, y: 350, w: 170 }, { x: 2380, y: 350, w: 170 }];
    L.solids = [{ x: 700, w: 96, h: 50 }, { x: 2050, w: 96, h: 50 }];
    [[1150, 432], [1450, 312], [1850, 432], [2250, 432], [2460, 312], [2780, 432]].forEach(([x, y]) => I.push({ k: 'log', x, y, carry: 1 }));
    coinRow(I, 200, 6, 432); coinArc(I, 680, 4, 400); coinRow(I, 950, 4, 432); coinArc(I, 1520, 4, 400, 80); coinArc(I, 2030, 4, 400); coinRow(I, 2600, 3, 432);
    L.branches = true;
    L.checkpoints = [1720];
    L.goal = { k: 'bigdam', x: 3230 };
    L.need = 6;
  } else if (idx === 3) { // Duck Family
    L.len = 4100;
    L.ground = [[0, 1700], [1860, 4100]];
    L.plats = [{ x: 1722, y: 450, w: 116, bob: 1 }, { x: 1020, y: 350, w: 170 }, { x: 2900, y: 350, w: 170 }];
    L.solids = [{ x: 780, w: 96, h: 50 }, { x: 2600, w: 96, h: 50 }];
    [[520, 452], [1100, 332], [1520, 452], [2350, 452], [2980, 332]].forEach(([x, y]) => I.push({ k: 'duck', x, y }));
    coinRow(I, 250, 4, 432); coinArc(I, 760, 4, 400); coinArc(I, 1700, 4, 400, 80); coinRow(I, 2000, 5, 432); coinArc(I, 2580, 4, 400); coinRow(I, 3300, 5, 432);
    L.enemies = [{ k: 'fox', z0: 1950, z1: 2750 }, { k: 'fox', z0: 3100, z1: 3650 }];
    L.checkpoints = [1900, 3050];
    L.goal = { k: 'pond', x: 3850 };
    L.need = 5;
  } else { // Moon Trail
    L.len = 3900;
    L.ground = [[0, 900], [1050, 1900], [2140, 2900], [3050, 3900]];
    L.plats = [{ x: 918, y: 450, w: 112, bob: 1 }, { x: 1925, y: 450, w: 95, bob: 1 }, { x: 2035, y: 436, w: 95, bob: 1 }, { x: 2922, y: 450, w: 110, bob: 1 },
      { x: 1280, y: 380, w: 130 }, { x: 1460, y: 300, w: 130 }, { x: 1640, y: 225, w: 150 }, { x: 2380, y: 360, w: 140 }, { x: 2560, y: 280, w: 140 }];
    [[420, 432], [975, 412], [1340, 342], [1715, 187], [2080, 398], [2440, 322], [2630, 242], [3260, 432]].forEach(([x, y]) => I.push({ k: 'moon', x, y }));
    coinRow(I, 200, 4, 432); coinArc(I, 1100, 4, 420); coinRow(I, 1470, 3, 262, 40); coinRow(I, 2200, 4, 432); coinArc(I, 3080, 5, 420); coinRow(I, 3450, 3, 432);
    L.hazards = [{ x: 650, w: 70 }, { x: 1790, w: 70 }, { x: 2760, w: 70 }, { x: 3380, w: 70 }];
    L.enemies = [{ k: 'bat', x0: 1200, r: 160, y0: 300 }, { k: 'bat', x0: 2300, r: 180, y0: 280 }, { k: 'bat', x0: 3150, r: 160, y0: 330 }];
    L.checkpoints = [1100, 2200, 3100];
    L.goal = { k: 'moonrock', x: 3680 };
    L.need = 8;
  }
  L.solids.forEach(s => { s.y = (L.swim ? L.bed : GROUND) - s.h; });
  I.forEach(it => { it.got = false; it.hx = it.x; it.hy = it.y; });
  L.enemies.forEach((e, i) => { e.id = i; e.x = e.x0 != null ? e.x0 : e.z0; e.y = e.y0 || GROUND; e.dir = 1; e.t = i * 1.7; e.retreat = 0; });
  L.coinsTotal = I.filter(i => i.k === 'coin').length;
  return L;
}

/* ================================================================
   PAINTED BACKGROUNDS (prerendered, tileable)
   ================================================================ */
const THEMES = {
  day:    { sky: ['#6fb6f0', '#bfe3f7', '#f6e8c4'], sun: '#fff6cf', far: '#7d9fbf', far2: '#9fb9d2', snow: '#f4f8fb', mid: '#2f6b3d', mid2: '#3f8a4a', near: '#3d8b3a', near2: '#6fb34a', ground: '#5ea83f', dirt: '#6b4a2b', water: '#3fa7d6' },
  bay:    { sky: ['#f2a65a', '#f7d38c', '#fbeac2'], sun: '#fff1c1', far: '#a7849a', far2: '#c7a3a3', snow: '#fff4ea', mid: '#3d6440', mid2: '#557d45', near: '#4d8a36', near2: '#8abf4c', ground: '#6aab3c', dirt: '#6d4a2a', water: '#48a9c9' },
  meadow: { sky: ['#8ccaf2', '#cdeefa', '#fdf6d8'], sun: '#fffbe0', far: '#8eb0c9', far2: '#b2c9d9', snow: '#f7fbff', mid: '#3a7a44', mid2: '#56a052', near: '#4f9a3c', near2: '#9fd05a', ground: '#72b84a', dirt: '#74512f', water: '#4cb4e0' },
  night:  { sky: ['#0b1136', '#1d2a66', '#3a3f7a'], sun: '#f4f1d6', far: '#2a2f5c', far2: '#383f73', snow: '#c9d3f2', mid: '#152a2e', mid2: '#1d3a3a', near: '#16302a', near2: '#24493a', ground: '#2f5a3a', dirt: '#2e2218', water: '#1f4f8a' },
  water:  { sky: ['#0f6f9e', '#0c5a86', '#07334f'], sun: '#bff4ff', far: '#0d4e6e', far2: '#0f5d80', snow: '#fff', mid: '#0b4560', mid2: '#11607a', near: '#1b6f5a', near2: '#2e8f63', ground: '#c9b27c', dirt: '#8e7650', water: '#1a8fc4' }
};
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const TILE = 1600;

function paintMountains(g, R, th, baseY, amp, col, snowCol, peaks, haze) {
  g.save();
  const pts = []; const n = peaks * 2;
  for (let i = 0; i <= n; i++) { const x = i / n * TILE; const up = i % 2 === 1; pts.push([x, baseY - (up ? amp * (0.6 + R() * 0.4) : amp * (0.15 + R() * 0.25))]); }
  pts[n][1] = pts[0][1];
  g.beginPath(); g.moveTo(0, H);
  pts.forEach(([x, y], i) => { if (i === 0) g.lineTo(x, y); else { const [px, py] = pts[i - 1]; g.quadraticCurveTo(px + (x - px) * .5 + (R() - .5) * 30, (py + y) / 2 - 10, x, y); } });
  g.lineTo(TILE, H); g.closePath();
  const gr = g.createLinearGradient(0, baseY - amp, 0, baseY + 80); gr.addColorStop(0, col); gr.addColorStop(1, haze); g.fillStyle = gr; g.fill();
  // snow caps
  if (snowCol) {
    for (let i = 1; i < n; i += 2) {
      const [x, y] = pts[i]; if (baseY - y < amp * .62) continue;
      const w = 60 + R() * 50, d = 40 + R() * 35;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - w * .6, y + d);
      for (let k = 0; k < 5; k++) g.lineTo(x - w * .6 + (k + 1) * w * .24, y + d - (k % 2 ? 14 : 0) - R() * 8);
      g.closePath(); g.fillStyle = snowCol; g.globalAlpha = .9; g.fill(); g.globalAlpha = 1;
    }
  }
  // light side strokes
  g.globalAlpha = .12; g.strokeStyle = '#fff'; g.lineWidth = 2;
  for (let i = 1; i < n; i += 2) { const [x, y] = pts[i]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + R() * 30, y + 70 + R() * 40); g.stroke(); }
  g.restore();
}
function pine(g, x, base, h, dark, light, R) {
  g.fillStyle = '#3b2616'; g.fillRect(x - h * .03, base - h * .2, h * .06, h * .2);
  const tiers = 4;
  for (let t = 0; t < tiers; t++) {
    const ty = base - h * .12 - t * h * .2, w = h * (.36 - t * .07);
    g.beginPath(); g.moveTo(x - w, ty); g.lineTo(x, ty - h * .34); g.lineTo(x + w, ty);
    for (let k = 0; k < 6; k++) g.lineTo(x + w - (k + 1) * w * 2 / 6, ty + (k % 2 ? 6 : -2));
    g.closePath(); g.fillStyle = dark; g.fill();
    g.beginPath(); g.moveTo(x - w * .1, ty - 4); g.lineTo(x, ty - h * .32); g.lineTo(x - w * .85, ty - 3); g.closePath(); g.fillStyle = light; g.globalAlpha = .55; g.fill(); g.globalAlpha = 1;
  }
}
function leafy(g, x, base, s, dark, light, R, trunk = '#4a2f1a') {
  g.fillStyle = trunk; g.beginPath(); g.moveTo(x - 7 * s, base); g.lineTo(x - 4 * s, base - 70 * s); g.lineTo(x + 4 * s, base - 70 * s); g.lineTo(x + 8 * s, base); g.fill();
  const blobs = 14;
  for (let i = 0; i < blobs; i++) {
    const a = R() * Math.PI * 2, r = R() * 38 * s, bx = x + Math.cos(a) * r * 1.2, by = base - 100 * s + Math.sin(a) * r * .8;
    g.beginPath(); g.arc(bx, by, (22 + R() * 16) * s, 0, Math.PI * 2); g.fillStyle = i < blobs * .55 ? dark : light; g.globalAlpha = i < blobs * .55 ? 1 : .85; g.fill();
  }
  g.globalAlpha = .35; g.fillStyle = '#fff8c8';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x - 20 * s + R() * 20 * s, base - 125 * s + R() * 20 * s, (5 + R() * 6) * s, 0, 7); g.fill(); }
  g.globalAlpha = 1;
}
function cabin(g, x, base, s) {
  g.fillStyle = '#7a4d2a'; g.fillRect(x, base - 55 * s, 90 * s, 55 * s);
  g.strokeStyle = 'rgba(40,20,10,.5)'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x, base - i * 9 * s); g.lineTo(x + 90 * s, base - i * 9 * s); g.stroke(); }
  g.fillStyle = '#4b2c19'; g.beginPath(); g.moveTo(x - 10 * s, base - 52 * s); g.lineTo(x + 45 * s, base - 92 * s); g.lineTo(x + 100 * s, base - 52 * s); g.fill();
  g.fillStyle = '#ffd97a'; g.fillRect(x + 20 * s, base - 38 * s, 16 * s, 14 * s); g.fillRect(x + 56 * s, base - 38 * s, 16 * s, 14 * s);
}

function wrapDraw(x, margin, fn) { fn(x); if (x < margin) fn(x + TILE); if (x > TILE - margin) fn(x - TILE); }
function paintLayers(theme) {
  const th = THEMES[theme], R = rng(theme.length * 977 + 13);
  if (th.style) return paintStyled(theme);
  const far = mk(TILE, H), mid = mk(TILE, H), near = mk(TILE, H);
  let g = far.getContext('2d');
  if (theme === 'water') {
    // underwater: distant rock silhouettes + light rays
    g.globalAlpha = .5; paintMountains(g, R, th, 360, 170, th.far2, null, 5, 'rgba(10,60,90,0)'); g.globalAlpha = 1;
    paintMountains(g, R, th, 430, 140, th.far, null, 7, th.mid);
    g = mid.getContext('2d');
    for (let i = 0; i < 26; i++) { const x = R() * TILE, h = 90 + R() * 150; wrapDraw(x, 40, xx => kelp(g, xx, 490, h, i % 2 ? '#1f7d55' : '#2b9a62', 0)); }
    g = near.getContext('2d');
    for (let i = 0; i < 18; i++) { const x = R() * TILE, rw = 30 + R() * 50, rh = 18 + R() * 16; g.fillStyle = i % 2 ? '#8a7a55' : '#6f6246'; wrapDraw(x, 90, xx => { g.beginPath(); g.ellipse(xx, 488, rw, rh, 0, Math.PI, 0); g.fill(); }); }
    for (let i = 0; i < 24; i++) { const x = R() * TILE, sd = Math.floor(R() * 1e9); wrapDraw(x, 50, xx => coral(g, xx, 486, rng(sd))); }
    return { far, mid, near };
  }
  // far mountains (two ranges)
  paintMountains(g, R, th, 330, 210, th.far2, th.snow, 4, th.sky[2]);
  paintMountains(g, R, th, 380, 150, th.far, theme === 'night' ? null : th.snow, 6, th.mid);
  // mid: pine forest + (day/bay) cabins + river/waterfall
  g = mid.getContext('2d');
  if (theme === 'day' || theme === 'bay') {
    // cliff with waterfall
    const wx = TILE * .62;
    g.fillStyle = '#5f6b6a'; g.beginPath(); g.moveTo(wx - 140, 430); g.lineTo(wx - 110, 250); g.lineTo(wx + 120, 240); g.lineTo(wx + 150, 430); g.fill();
    const wg = g.createLinearGradient(0, 245, 0, 430); wg.addColorStop(0, '#e8f7ff'); wg.addColorStop(1, '#8fd3f2'); g.fillStyle = wg; g.fillRect(wx - 55, 245, 110, 185);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let i = 0; i < 16; i++) { const x = wx - 50 + R() * 100; g.beginPath(); g.moveTo(x, 250 + R() * 30); g.lineTo(x + (R() - .5) * 6, 400 + R() * 30); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(wx - 70 + R() * 140, 425 + R() * 10, 10 + R() * 14, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 34; i++) { const x = (i / 34) * TILE + R() * 40, h = 150 + R() * 110, by = 440 + R() * 12; if ((theme === 'day' || theme === 'bay') && Math.abs(x - TILE * .62) < 170) continue; wrapDraw(x, 110, xx => pine(g, xx, by, h, th.mid, th.mid2, R)); }
  if (theme !== 'night') { cabin(g, TILE * .18, 440, 1); cabin(g, TILE * .86, 442, .8); }
  // river band behind the path
  const rg = g.createLinearGradient(0, 420, 0, 470); rg.addColorStop(0, th.water); rg.addColorStop(1, shade(th.water, -30)); g.fillStyle = rg; g.fillRect(0, 432, TILE, 40);
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = R() * TILE, y = 440 + R() * 26; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + R() * 30, y); g.stroke(); }
  // near: leafy trees + bushes + flowers
  g = near.getContext('2d');
  for (let i = 0; i < 9; i++) { const x = (i / 9) * TILE + R() * 90, s = .9 + R() * .6, sd = Math.floor(R() * 1e9); wrapDraw(x, 130, xx => leafy(g, xx, 470, s, th.near, th.near2, rng(sd))); }
  for (let i = 0; i < 30; i++) { const x = R() * TILE, rr = 18 + R() * 20; g.fillStyle = i % 2 ? th.near : th.near2; wrapDraw(x, 45, xx => { g.beginPath(); g.arc(xx, 468, rr, Math.PI, 0); g.fill(); }); }
  if (theme !== 'night') for (let i = 0; i < 40; i++) { const x = R() * TILE; g.fillStyle = ['#ff6fa3', '#ffd34d', '#ffffff', '#b58cff'][i % 4]; g.beginPath(); g.arc(x, 458 + R() * 10, 3, 0, 7); g.fill(); }
  return { far, mid, near };
}
function kelp(g, x, base, h, col, sway) {
  g.strokeStyle = col; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, base);
  for (let k = 1; k <= 6; k++) g.lineTo(x + Math.sin(k * .9 + sway) * 10, base - h * k / 6); g.stroke();
  g.fillStyle = col; for (let k = 1; k <= 5; k++) { g.beginPath(); g.ellipse(x + Math.sin(k * .9 + sway) * 10 + 8, base - h * k / 6 + 6, 10, 4, .5, 0, 7); g.fill(); }
}
function coral(g, x, base, R) {
  const c = ['#ff7a6b', '#ffb05c', '#e86bd1', '#ffd86b'][Math.floor(R() * 4)]; g.strokeStyle = c; g.lineWidth = 5; g.lineCap = 'round';
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, base); const a = -Math.PI / 2 + (R() - .5) * 1.4, l = 18 + R() * 26; g.lineTo(x + Math.cos(a) * l, base + Math.sin(a) * l); g.stroke(); }
}
function shade(hex, amt) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, gg = (n >> 8 & 255) + amt, b = (n & 255) + amt; return '#' + [r, gg, b].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join(''); }

function paintGroundTile(theme) {
  const th = THEMES[theme], R = rng(99 + theme.length), c = mk(512, 100), g = c.getContext('2d');
  const dg = g.createLinearGradient(0, 0, 0, 100); dg.addColorStop(0, th.dirt); dg.addColorStop(1, shade(th.dirt, -45)); g.fillStyle = dg; g.fillRect(0, 0, 512, 100);
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},${.06 + R() * .08})`; g.beginPath(); g.ellipse(R() * 512, 25 + R() * 70, 6 + R() * 12, 4 + R() * 6, 0, 0, 7); g.fill(); }
  g.fillStyle = th.ground; g.fillRect(0, 0, 512, 16);
  for (let x = 0; x < 512; x += 5) { g.fillStyle = R() < .5 ? th.ground : shade(th.ground, 25); g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 2 + R() * 3, -4 - R() * 8); g.lineTo(x + 5, 16); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 16, 512, 5);
  return c;
}

/* ================================================================
   GAME STATE
   ================================================================ */
let G = null;
function LV() { return HEROES[HERO].levels; }

function start(idx, hero) {
  if (hero) HERO = hero;
  stop();
  const L = buildLevel(idx);
  const canvas = $('ba-canvas'), ctx = canvas.getContext('2d');
  const layers = paintLayers(L.def.theme), groundTile = paintGroundTile(L.def.theme);
  G = {
    L, canvas, ctx, layers, groundPat: ctx.createPattern(groundTile, 'repeat'), W: 900, cam: 0, t: 0, last: 0, raf: 0,
    hero: HERO, kills: 0, rings: 0,
    p: { x: 120, y: L.fly ? 250 : L.swim ? 300 : GROUND, vx: 0, vy: 0, onGround: !L.swim, face: 1, coyote: 0, buffer: 0, inv: 0, carry: false, air: 100, walkT: 0 },
    keys: {}, hp: 5, hits: 0, coins: 0, got: 0, delivered: 0, building: 0, dam: 0, following: [], trail: [],
    phase: 'intro', paused: false, checkpoint: 120, toastT: 0, particles: [], shake: 0, fireflies: [], branches: [], branchT: 2.5, flags: {},
    hudCache: {}
  };
  if (L.def.theme === 'night') { const R = rng(7); for (let i = 0; i < 60; i++) G.fireflies.push({ x: R() * L.len, y: 180 + R() * 280, p: R() * 6, s: .5 + R() }); }
  showScreen('screen-benny-adv');
  $('ba-result').classList.remove('show'); $('ba-pause-ov').classList.remove('show');
  if (L.film) { G.phase = 'film'; playFilm('intro', () => { if (!G) return; G.phase = 'intro'; showIntro(); }); } else showIntro();
  setupHud();
  resize();
  G.raf = requestAnimationFrame(loop);
}
function immersive(on) { try { document.body.classList.toggle('ba-immersive', !!on); } catch (e) {} }
function stop() { immersive(false); try { const fb = $('ba-film'); if (fb && fb.classList.contains('show')) { filmDone = null; endFilm(); } } catch (e) {} if (!G) return; cancelAnimationFrame(G.raf); G = null; }

function showIntro() {
  const d = G.L.def, box = $('ba-intro');
  $('ba-intro-lvl').textContent = T('Level ', 'Level ') + d.id;
  $('ba-intro-title').textContent = T(d.name[0], d.name[1]);
  $('ba-intro-text').textContent = T(d.story[0], d.story[1]);
  $('ba-intro-ctrl').textContent = G.hero === 'owl' ? T('◀ ▶ fliegen · ⤒ Flügelschlag (hoch) · ⬇ Sturzflug · auf Stämmen darfst du landen', '◀ ▶ fly · ⤒ flap (up) · ⬇ dive · you may land on top of trunks')
    : G.hero === 'ren' ? T('◀ ▶ laufen · ⤒ springen · ⚔️ Schwert (1. Schlag aus der Scheide = doppelt) · 🛡️ blocken · 💨 ausweichen · ⚡ Geistesschlag, wenn der gelbe Balken voll ist', '◀ ▶ run · ⤒ jump · ⚔️ sword (first strike from the sheath = double) · 🛡️ block · 💨 dodge · ⚡ Spirit Strike when the yellow bar is full')
    : G.L.swim
    ? T('◀ ▶ schwimmen · ⬆ auftauchen · ⬇ tauchen', '◀ ▶ swim · ⬆ swim up · ⬇ dive')
    : T('◀ ▶ laufen · ⤒ springen · Aktions-Knopf: aufheben / bauen', '◀ ▶ walk · ⤒ jump · action button: pick up / build');
  $('ba-intro-go').textContent = T('Los geht\'s!', 'Let\'s go!');
  box.classList.add('show');
}
function beginPlay() { if (!G) return; $('ba-intro').classList.remove('show'); G.phase = 'play'; }

/* ---------------- quests ---------------- */
function quests() {
  if (G.hero === 'owl') return owlQuests();
  if (G.hero === 'ren') return renQuests();
  const L = G.L, t = L.def.type, need = L.need;
  const Q = (de, en, cur, max) => ({ txt: T(de, en), cur, max, done: cur >= max });
  if (t === 'dam') return [Q('Stämme sammeln', 'Collect logs', G.got, need), Q('Damm reparieren', 'Fix the dam', G.flags.built ? 1 : 0, 1), Q('Den Fluss retten', 'Save the river', G.flags.built ? 1 : 0, 1)];
  if (t === 'swim') return [Q('Flussperlen finden', 'Find river pearls', G.got, need), Q('Den Hechten ausweichen', 'Avoid the pikes', G.hits === 0 ? 1 : 0, 1), Q('Zum Ausgang schwimmen', 'Swim to the exit', G.flags.exit ? 1 : 0, 1)];
  if (t === 'carry') return [Q('Stämme zum Damm tragen', 'Carry logs to the dam', G.delivered, need), Q('Großen Damm bauen', 'Build the big dam', G.delivered >= need ? 1 : 0, 1), Q('Fallenden Ästen ausweichen', 'Dodge falling branches', G.hits === 0 ? 1 : 0, 1)];
  if (t === 'ducks') return [Q('Entenküken finden', 'Find the ducklings', G.following.length, need), Q('Am Fuchs vorbei', 'Get past the fox', G.p.x > 3650 ? 1 : 0, 1), Q('Zum Teich führen', 'Lead them to the pond', G.flags.pond ? 1 : 0, 1)];
  return [Q('Mondsteine sammeln', 'Collect moonstones', G.got, need), Q('Dornen & Fledermäuse meiden', 'Avoid thorns & bats', G.hits === 0 ? 1 : 0, 1), Q('Zum Mondfelsen', 'Reach the Moon Rock', G.flags.moonrock ? 1 : 0, 1)];
}
function mainProgress() { const qs = quests(); if (G.hero === 'ren') return qs.filter(q => q.done).length / qs.length; const q = qs[0]; return clamp(q.cur / q.max, 0, 1); }

/* ---------------- HUD ---------------- */
function setupHud() {
  const d = G.L.def;
  $('ba-quest-title').textContent = T(d.name[0], d.name[1]);
  const sw = G.L.swim;
  $('ba-jump').innerHTML = sw ? '⬆' : '⤒';
  const ex = $('ba-extra'); if (ex) ex.style.display = G.hero === 'ren' ? '' : 'none';
  ['ba-dash', 'ba-special'].forEach(id => { const b = $(id); if (b) b.style.display = G.hero === 'ren' ? '' : 'none'; });
  const stg = document.querySelector('.ba-stage'); if (stg) stg.classList.toggle('ren-mode', G.hero === 'ren');
  const H0 = HEROES[G.hero]; if (G.hero === 'ren' && !H0.portrait) H0.portrait = renPortrait();
  const pd = $('ba-portrait')?.firstElementChild; if (pd) { pd.style.backgroundImage = `url(${H0.portrait})`; pd.style.backgroundSize = G.hero === 'owl' ? '92%' : G.hero === 'ren' ? 'cover' : ''; pd.style.backgroundPosition = G.hero === 'benny' ? '' : 'center'; }
  $('ba-air').style.display = sw ? '' : 'none';
  G.hudCache = {};
  updateHud(true);
}
function setText(id, v) { if (G.hudCache[id] !== v) { G.hudCache[id] = v; const el = $(id); if (el) el.innerHTML = v; } }
function updateHud() {
  setText('ba-hearts', '<i>♥</i>'.repeat(G.hp) + '<i class="off">♥</i>'.repeat(Math.max(0, 5 - G.hp)));
  setText('ba-coins', String(loadSave().coins + G.coins));
  const q = quests();
  setText('ba-quest-list', q.map(x => `<li class="${x.done ? 'done' : ''}"><span class="ck">${x.done ? '✓' : '○'}</span><span class="tx">${x.txt}</span>${x.max > 1 ? `<b>${Math.min(x.cur, x.max)}/${x.max}</b>` : ''}</li>`).join(''));
  const pr = Math.round(mainProgress() * 100);
  setText('ba-ring', String(pr)); $('ba-portrait').style.setProperty('--p', pr + '%');
  if (G.L.swim) setText('ba-air-fill', `<i style="width:${Math.round(G.p.air)}%"></i>`);
  // action button icon depends on context
  let a = '✋';
  const t = G.L.def.type;
  if (G.L.swim || G.hero === 'owl') a = '⬇';
  else if (G.hero === 'ren') a = '⚔️';
  else if (t === 'dam' && near(G.L.goal.x, 170)) a = '🔨';
  else if (t === 'carry') a = G.p.carry ? (near(G.L.goal.x, 200) ? '🔨' : '🪵') : '🪵';
  else if (t === 'moon' || t === 'ducks') a = '✋';
  setText('ba-action', a);
  if (G.hero === 'ren') renHud();
}
function near(x, r) { return Math.abs(G.p.x - x) < r; }
function toast(msg) { const el = $('ba-toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 1700); }

/* ---------------- resize ---------------- */
function resize() {
  if (!G) return;
  immersive(window.innerHeight < 500 && $('screen-benny-adv')?.classList.contains('active'));
  const c = G.canvas, r = c.getBoundingClientRect();
  if (r.width < 10 || r.height < 10) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.W = Math.round(H * r.width / r.height);
  c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
  G.scale = c.height / H;
}

/* ================================================================
   UPDATE
   ================================================================ */
const GRAV = 2300, JUMP_V = 900, RUN = 300;
function groundAt(x) { if (G.L.swim) return G.L.bed; for (const [a, b] of G.L.ground) if (x >= a - 16 && x <= b + 16) return GROUND; return null; }

function hurt(fromX) {
  const p = G.p; if (p.inv > 0 || (p.dashInv || 0) > 0 || G.phase !== 'play') return;
  G.hp--; G.hits++; p.inv = 1.4; G.shake = .3; SFX.hurt();
  p.vx = (p.x < fromX ? -1 : 1) * 380; if (!G.L.swim) { p.vy = -520; p.onGround = false; }
  burst(p.x, p.y - 50, '#ff5a5a', 10);
  if (G.hp <= 0) fail();
}
function respawn() {
  const p = G.p; G.hp--; G.hits++; SFX.splash(); burst(p.x, 470, '#bfe9ff', 16);
  if (G.hp <= 0) return fail();
  p.x = G.checkpoint; p.y = GROUND - 200; p.vx = 0; p.vy = 0; p.inv = 1.2;
  G.trail = []; toast(T('Platsch! Zurück zum Kontrollpunkt', 'Splash! Back to the checkpoint'));
}
function burst(x, y, col, n) { for (let i = 0; i < n; i++) G.particles.push({ x, y, vx: (Math.random() - .5) * 320, vy: -Math.random() * 320, life: .6 + Math.random() * .4, col, r: 3 + Math.random() * 3 }); }

function update(dt) {
  const L = G.L, p = G.p, k = G.keys;
  G.t += dt;
  if (p.inv > 0) p.inv -= dt;
  if (G.hero === 'owl') { updateOwl(dt); tailUpdate(dt); return; }
  const mx = (k.r ? 1 : 0) - (k.l ? 1 : 0);
  if (mx) p.face = mx;
  const prevY = p.y;

  if (L.swim) {
    // ---------- swimming ----------
    const my = (k.u || k.j ? -1 : 0) + (k.d || k.a ? 1 : 0);
    p.vx += (mx * 290 - p.vx) * Math.min(1, dt * 5);
    p.vy += ((my ? my * 270 : 55) - p.vy) * Math.min(1, dt * 4);
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.y = clamp(p.y, L.surface + 70, L.bed); p.x = clamp(p.x, 40, L.len - 40);
    for (const s of L.solids) if (p.x + 24 > s.x && p.x - 24 < s.x + s.w && p.y > s.y) { if (prevY <= s.y + 2) p.y = s.y; else p.x = p.x < s.x + s.w / 2 ? s.x - 24 : s.x + s.w + 24; }
    const atSurface = p.y - 70 < L.surface + 30;
    p.air = clamp(p.air + (atSurface ? 45 : -6.5) * dt, 0, 100);
    if (p.air <= 0) { p.air = 55; hurt(p.x + p.face); toast(T('Luft holen! Schwimm nach oben!', 'Get air! Swim to the top!')); }
    if (p.air < 25 && !G.flags.airWarn) { G.flags.airWarn = 1; toast(T('Luft wird knapp — auftauchen!', 'Air is low — go up!')); }
    if (p.air > 60) G.flags.airWarn = 0;
    p.walkT += dt * (1 + Math.abs(p.vx) / 120);
    p.swimT = (p.swimT || 0) + dt * (3.2 + (Math.abs(p.vx) + Math.abs(p.vy)) / 70);
    if (Math.random() < dt * 3) G.particles.push({ x: p.x + p.face * 30, y: p.y - 60, vx: (Math.random() - .5) * 20, vy: -80, life: 1.4, col: 'bubble', r: 2 + Math.random() * 3 });
  } else {
    // ---------- platformer ----------
    const speed = RUN * (p.carry ? .72 : 1);
    const accel = p.onGround ? 14 : 7;
    p.vx += (mx * speed - p.vx) * Math.min(1, dt * accel);
    p.vy += GRAV * dt; if (p.vy > 1400) p.vy = 1400;
    p.coyote = p.onGround ? .1 : p.coyote - dt; p.buffer -= dt;
    if (p.buffer > 0 && p.coyote > 0) { p.vy = -JUMP_V * (p.carry ? .86 : 1); p.onGround = false; p.coyote = 0; p.buffer = 0; SFX.jump(); }
    if (!k.j && p.vy < -300) p.vy += GRAV * dt * 1.2; // variable jump height
    // horizontal
    p.x += p.vx * dt; p.x = clamp(p.x, 30, L.len - 30);
    for (const s of L.solids) if (p.x + 24 > s.x && p.x - 24 < s.x + s.w && p.y > s.y + 4 && p.y - 80 < s.y + s.h) {
      if (s.kind === 'step' && p.y - s.y <= 32 && p.vy >= 0) { p.y = s.y; continue; } p.x = p.x < s.x + s.w / 2 ? s.x - 24 : s.x + s.w + 24; p.vx = 0; }
    // vertical
    p.y += p.vy * dt; p.onGround = false;
    if (p.vy >= 0) {
      const gy = groundAt(p.x);
      if (gy != null && p.y >= gy && prevY <= gy + 12) { p.y = gy; p.vy = 0; p.onGround = true; }
      for (const s of L.solids) if (p.x + 20 > s.x && p.x - 20 < s.x + s.w && p.y >= s.y && prevY <= s.y + 12) { p.y = s.y; p.vy = 0; p.onGround = true; }
      for (const pl of L.plats) { const py = pl.y + (pl.bob ? Math.sin(G.t * 2 + pl.x) * 4 : 0); if (p.x + 18 > pl.x && p.x - 18 < pl.x + pl.w && p.y >= py && prevY <= py + 14) { p.y = py; p.vy = 0; p.onGround = true; } }
    }
    if (p.y > H + 80) respawn();
    if (p.onGround && Math.abs(p.vx) > 20) p.walkT += dt * Math.abs(p.vx) / 38;
  }
  // checkpoints
  for (const c of L.checkpoints) if (p.x > c && G.checkpoint < c) { G.checkpoint = c; toast(T('🚩 Kontrollpunkt!', '🚩 Checkpoint!')); SFX.item(); }

  // ---------- items ----------
  for (const it of L.items) {
    if (it.got) continue;
    if (it.k === 'log' && it.carry) continue; // carry logs are picked with action
    const dx = p.x - it.x, dy = (p.y - 45) - it.y;
    const r = it.k === 'coin' ? 40 : 52;
    if (dx * dx + dy * dy < r * r) {
      if (it.k === 'coin') { it.got = true; G.coins++; SFX.coin(); burst(it.x, it.y, '#ffd84d', 5); }
      else if (it.k === 'clue') { it.got = true; G.flags.clue = 1; SFX.item(); toast(T('Frische Spuren und eine kalte Feuerstelle … Sie führen zum Bergschrein!', 'Fresh tracks and a cold campfire … they lead to the mountain shrine!')); }
      else if (it.k === 'heart') { it.got = true; G.hp = Math.min(5, G.hp + 1); SFX.item(); burst(it.x, it.y, '#ff5a6a', 12); toast('+1 ❤️'); }
      else if (it.k === 'scroll') { it.got = true; G.flags.scroll = 1; SFX.win(); toast(T('📜 Schriftrolle! Jetzt das Tor öffnen ➜', '📜 Scroll! Now open the gate ➜')); }
      else if (it.k === 'duck') { it.got = true; G.following.push(it); SFX.quack(); burst(it.x, it.y, '#ffe36b', 8); toast(T(`Küken gefunden! ${G.following.length}/5`, `Duckling found! ${G.following.length}/5`)); }
      else { it.got = true; G.got++; SFX.item(); burst(it.x, it.y, it.k === 'moon' ? '#b9e6ff' : it.k === 'pearl' ? '#fff' : '#c98a4a', 14);
        const left = L.need - G.got;
        toast(left > 0 ? T(`Noch ${left}!`, `${left} to go!`) : (L.def.type === 'dam' ? T('Alle Stämme! Ab zum Damm 🔨', 'All logs! Head to the dam 🔨') : L.def.type === 'swim' ? T('Alle Perlen! Schwimm zum Ausgang ➜', 'All pearls! Swim to the exit ➜') : T('Alle Mondsteine! Zum Mondfelsen ➜', 'All moonstones! To the Moon Rock ➜'))); }
    }
  }
  // ducklings follow Benny using a trail
  if (L.def.type === 'ducks') {
    const lt = G.trail[0]; if (!lt || Math.hypot(lt.x - p.x, lt.y - p.y) > 5) G.trail.unshift({ x: p.x, y: p.y }); if (G.trail.length > 200) G.trail.length = 200;
    G.following.forEach((d, i) => { const tp = G.trail[Math.min(G.trail.length - 1, 12 + i * 10)]; if (tp) { d.x = tp.x; d.y = tp.y - 13; } });
  }

  // ---------- hazards ----------
  for (const h of L.hazards) if (!L.swim && p.x + 18 > h.x && p.x - 18 < h.x + h.w && p.y > GROUND - 34) hurt(h.x + h.w / 2);
  // ---------- enemies ----------
  for (const e of L.enemies) {
    e.t += dt;
    if (e.k === 'wasp' || e.k === 'bat') {
      e.x = e.x0 + Math.sin(e.t * (e.k === 'bat' ? 1.1 : .9)) * e.r; e.dir = Math.cos(e.t) >= 0 ? 1 : -1;
      e.y = e.y0 + Math.sin(e.t * (e.k === 'bat' ? 2.6 : 3.2)) * (e.k === 'bat' ? 70 : 34);
      if (Math.hypot(p.x - e.x, p.y - 45 - e.y) < 46) hurt(e.x);
    } else if (e.k === 'pike') {
      e.x += e.dir * e.sp * dt; if (e.x > e.x0 + e.r) e.dir = -1; if (e.x < e.x0 - e.r) e.dir = 1;
      e.y = e.y0 + Math.sin(e.t * 1.3) * 25;
      if (Math.abs(p.x - e.x) < 62 && Math.abs(p.y - 40 - e.y) < 34) hurt(e.x);
    } else if (e.k === 'fox') {
      const inZone = p.x > e.z0 - 150 && p.x < e.z1 + 150;
      if (e.retreat > 0) { e.retreat -= dt; e.dir = p.x < e.x ? 1 : -1; e.x += e.dir * 210 * dt; }
      else if (inZone && Math.abs(p.x - e.x) < 360) { e.dir = p.x < e.x ? -1 : 1; e.x += e.dir * 175 * dt; }
      else { e.x += e.dir * 85 * dt; if (e.x > e.z1) e.dir = -1; if (e.x < e.z0) e.dir = 1; }
      e.x = clamp(e.x, e.z0 - 60, e.z1 + 60); // wall clamp so the fox never gets stuck outside its meadow
      if (e.retreat <= 0 && Math.abs(p.x - e.x) < 50 && p.y > GROUND - 46) { hurt(e.x); e.retreat = 1.8; }
    }
  }
  // ---------- falling branches (Builder Bay) ----------
  if (L.branches && p.x > 500 && G.phase === 'play') {
    G.branchT -= dt;
    if (G.branchT <= 0) { G.branchT = 2.2 + Math.random() * 1.2; G.branches.push({ x: clamp(p.x + p.vx * .9 + (Math.random() - .5) * 160, 200, L.len - 200), t: 0, y: -60, fall: false }); }
    for (const b of G.branches) {
      b.t += dt;
      if (b.t > 1) { b.fall = true; b.y += 900 * dt; }
      if (b.fall && !b.hit && b.y > GROUND - 110 && b.y < GROUND && Math.abs(p.x - b.x) < 60) { b.hit = 1; hurt(b.x); }
      if (b.y >= GROUND - 10 && !b.landed) { b.landed = 1; burst(b.x, GROUND - 10, '#8b5a2b', 8); }
    }
    G.branches = G.branches.filter(b => b.t < 2.2);
  }
  // ---------- goals ----------
  const t = L.def.type, gx = L.goal.x;
  if (t === 'swim' && Math.abs(p.x - gx) < 90) { if (G.got >= L.need) { G.flags.exit = 1; win(); } else if (!G.flags.exitMsg) { G.flags.exitMsg = 1; toast(T(`Erst alle Perlen finden (${G.got}/${L.need})`, `Find all pearls first (${G.got}/${L.need})`)); } }
  if (t === 'swim' && Math.abs(p.x - gx) > 200) G.flags.exitMsg = 0;
  if (t === 'moon' && Math.abs(p.x - gx) < 90) { if (G.got >= L.need) { G.flags.moonrock = 1; win(); } else if (!G.flags.mrMsg) { G.flags.mrMsg = 1; toast(T(`Der Mondfelsen braucht alle Steine (${G.got}/${L.need})`, `The Moon Rock needs all stones (${G.got}/${L.need})`)); } }
  if (t === 'moon' && Math.abs(p.x - gx) > 200) G.flags.mrMsg = 0;
  if (t === 'ducks' && p.x > gx - 60) { if (G.following.length >= L.need) { G.flags.pond = 1; win(); } else if (!G.flags.pondMsg) { G.flags.pondMsg = 1; toast(T(`Mama Ente wartet auf alle 5 Küken (${G.following.length}/5)`, `Mother duck is waiting for all 5 (${G.following.length}/5)`)); } }
  if (t === 'ducks' && p.x < gx - 250) G.flags.pondMsg = 0;
  if (G.building > 0) { G.building -= dt; if (G.building <= 0 && t === 'dam') { G.flags.built = 1; win(); } }

  if (G.hero === 'ren') updateRen(dt);
  tailUpdate(dt);
}
function tailUpdate(dt) {
  const p = G.p, L = G.L;
  // ---------- particles ----------
  for (const q of G.particles) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.col !== 'bubble') q.vy += 900 * dt; }
  G.particles = G.particles.filter(q => q.life > 0);
  if (G.shake > 0) G.shake -= dt;
  // camera with look-ahead
  const target = clamp(p.x - G.W * .4 + p.face * 60, 0, Math.max(0, L.len - G.W));
  G.cam += (target - G.cam) * Math.min(1, dt * 5);
}

function doJump(down) {
  if (!G) return; G.keys.j = down;
  if (G.hero === 'owl') { if (down && G.phase === 'play') { const p = G.p; p.vy = Math.max(-420, Math.min(p.vy, 40) - 290); p.flapT = .32; tone(320, 170, .09, .035, 'triangle'); } return; }
  if (down && !G.L.swim) G.p.buffer = .14;
}
function doExtra(down) { if (G) G.keys.x = down; }
function doAction(down) {
  if (!G) return; G.keys.a = down;
  if (G.hero === 'owl') { if (down && G.phase === 'play') { G.p.diving = true; G.p.diveT = .55; } return; }
  if (G.hero === 'ren') { if (down && G.phase === 'play' && !(G.p.atkT > .08)) { G.p.iaiHit = !G.p.drawn; G.p.drawn = true; G.p.calmT = 0; G.p.atkT = .32; G.atkId = (G.atkId || 0) + 1; tone(1300, 280, .12, .035, 'sawtooth'); } return; }
  if (!down || G.phase !== 'play' || G.L.swim) return;
  const L = G.L, p = G.p, t = L.def.type;
  if (t === 'dam') {
    if (near(L.goal.x, 170)) {
      if (G.got >= L.need && !G.building && !G.flags.built) { G.building = 1.4; SFX.build(); setTimeout(SFX.build, 450); setTimeout(SFX.build, 900); }
      else if (G.got < L.need) toast(T(`Du brauchst ${L.need - G.got} Stämme mehr`, `You need ${L.need - G.got} more logs`));
    } else toast(T('Sammle Stämme und geh zum Damm ➜', 'Collect logs and go to the dam ➜'));
  } else if (t === 'carry') {
    if (!p.carry) {
      const it = L.items.find(i => i.k === 'log' && i.carry && !i.got && Math.abs(i.x - p.x) < 70 && Math.abs(i.y - (p.y - 38)) < 90);
      if (it) { it.got = true; p.carry = true; SFX.item(); toast(T('Stamm aufgehoben — trag ihn zum Damm ➜', 'Log picked up — carry it to the dam ➜')); }
      else toast(T('Kein Stamm in der Nähe', 'No log nearby'));
    } else if (near(L.goal.x, 200)) {
      p.carry = false; G.delivered++; SFX.build(); burst(L.goal.x, GROUND - 40, '#c98a4a', 14);
      if (G.delivered >= L.need) win(); else toast(T(`Damm: ${G.delivered}/${L.need}`, `Dam: ${G.delivered}/${L.need}`));
    } else toast(T('Trag den Stamm zum Damm ➜', 'Carry the log to the dam ➜'));
  } else if (t === 'ducks') {
    SFX.quack(); toast(T('Quak! 🦆', 'Quack! 🦆'));
  } else if (t === 'moon') {
    toast(T('Folge den Glühwürmchen ✨', 'Follow the fireflies ✨'));
  }
}

/* ---------------- win / fail ---------------- */
function starsFor(h) { return h === 0 ? 3 : h <= 2 ? 2 : 1; }
function win() {
  if (G.phase !== 'play') return;
  G.phase = 'won'; SFX.win();
  const s = loadSave(), idx = G.L.idx, st = starsFor(G.hits), prev = s.stars[idx] || 0;
  s.stars[idx] = Math.max(prev, st); s.unlocked = Math.max(s.unlocked, Math.min(LV().length, idx + 2)); s.coins += G.coins; writeSave(s);
  let lak = 0; try { if (typeof awardLakCoins === 'function') lak = awardLakCoins(G.coins + 10 + st * 5) || 0; } catch (e) {}
  const G0 = G;
  setTimeout(() => {
    if (!G || G !== G0) return;
    $('ba-res-title').textContent = T('Mission geschafft!', 'Mission complete!');
    $('ba-res-stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < st ? 'on' : ''}">★</span>`).join('');
    $('ba-res-sub').innerHTML = T(`${G.coins}/${G.L.coinsTotal} Münzen · ${G.hits} Treffer`, `${G.coins}/${G.L.coinsTotal} coins · ${G.hits} hits`) +
      (st < 3 ? `<br><small>${T('Ohne Treffer gibt es 3 Sterne!', 'No hits = 3 stars!')}</small>` : `<br><small>${T('Perfekt gemeistert!', 'Perfect run!')}</small>`) +
      (st > prev && prev ? `<br><small>⭐ ${T('Neue Bestleistung', 'New best')}</small>` : '') +
      (lak && typeof lakCoinsRewardLine === 'function' ? `<div class="lak">${lakCoinsRewardLine(lak)}</div>` : '');
    const last = idx >= LV().length - 1;
    $('ba-res-next').style.display = ''; $('ba-res-next').textContent = last ? T('Fortsetzung folgt ➜', 'To be continued ➜') : T('Nächste Mission ➜', 'Next mission ➜');
    $('ba-res-retry').textContent = T('Nochmal', 'Replay');
    $('ba-res-menu').textContent = T('Levelauswahl', 'Level select');
    $('ba-result').classList.add('show');
  }, G.L.def.type === 'dam' ? 600 : 250);
}
function fail() {
  if (G.phase !== 'play') return; G.phase = 'lost';
  const G0 = G;
  setTimeout(() => {
    if (!G || G !== G0) return;
    $('ba-res-title').textContent = T('Oh nein, Benny!', 'Oh no, Benny!');
    $('ba-res-stars').innerHTML = '';
    $('ba-res-sub').innerHTML = T('Keine Herzen mehr. Versuch es gleich nochmal — du schaffst das!', 'No hearts left. Try again — you can do it!');
    $('ba-res-next').style.display = 'none';
    $('ba-res-retry').textContent = T('Nochmal versuchen', 'Try again');
    $('ba-res-menu').textContent = T('Levelauswahl', 'Level select');
    $('ba-result').classList.add('show');
  }, 400);
}

/* ================================================================
   RENDER
   ================================================================ */
function drawTiled(g, img, par) {
  const off = -((G.cam * par) % TILE);
  for (let x = off; x < G.W; x += TILE) g.drawImage(img, x, 0);
}
function render() {
  const g = G.ctx, L = G.L, th = THEMES[L.def.theme], W = G.W, cam = G.cam, t = G.t;
  G.zoom = (G.zoom || 1) + ((G.zoomT || 1) - (G.zoom || 1)) * .06;
  { const z = G.zoom, fx = G.p.x - G.cam, fy = G.hero === 'owl' ? G.p.y : G.p.y - 60; g.setTransform(G.scale * z, 0, 0, G.scale * z, -fx * (z - 1) * G.scale, -fy * (z - 1) * G.scale); }
  if (G.shake > 0) g.translate((Math.random() - .5) * 8, (Math.random() - .5) * 6);
  // sky
  const sg = g.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, th.sky[0]); sg.addColorStop(.6, th.sky[1]); sg.addColorStop(1, th.sky[2]); g.fillStyle = sg; g.fillRect(-10, -10, W + 20, H + 20);
  if (L.def.theme === 'night' || th.moon) { const R = rng(3); g.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { g.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * (.5 + R()) + i)); g.fillRect((R() * 1.3 * W - cam * .02) % W, R() * 260, 2, 2); } g.globalAlpha = 1; }
  if (!L.swim && th.nosun) { if (th.stormClouds) drawStormClouds(g, t); }
  else if (!L.swim) { // sun / moon
    const moon = L.def.theme === 'night' || th.moon;
    const sx = W * .78 - cam * .02, sy = moon ? 90 : 80;
    const sr = g.createRadialGradient(sx, sy, 10, sx, sy, 140); sr.addColorStop(0, th.sun); sr.addColorStop(.25, th.sun + 'aa'); sr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sr; g.beginPath(); g.arc(sx, sy, 140, 0, 7); g.fill(); g.fillStyle = th.sun; g.beginPath(); g.arc(sx, sy, moon ? 36 : 30, 0, 7); g.fill();
    if (!moon && !th.noclouds) { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 5; i++) { const cx = ((i * 420 - cam * .06 + t * 6) % (W + 300)) - 150; cloud(g, cx, 60 + (i * 37) % 90, .8 + (i % 3) * .3); } }
  } else { // light rays underwater
    g.save(); g.globalAlpha = .12; g.fillStyle = '#dff8ff';
    for (let i = 0; i < 6; i++) { const x = ((i * 260 - cam * .3) % (W + 400)) - 100; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 70, 0); g.lineTo(x + 220 + Math.sin(t + i) * 30, H); g.lineTo(x + 120 + Math.sin(t + i) * 30, H); g.fill(); }
    g.restore();
  }
  if (th.photo && ok(th.photo)) drawPhotoFar(g, th.photo); else drawTiled(g, G.layers.far, .12);
  drawTiled(g, G.layers.mid, .32);
  if (L.swim) { g.save(); g.globalAlpha = .9; drawTiled(g, G.layers.near, .7); g.restore(); }
  else drawTiled(g, G.layers.near, .6);

  g.save(); g.translate(-Math.round(cam), 0);
  if (L.swim) drawUnderwaterWorld(g); else drawGround(g);
  drawGoal(g);
  if (G.hero === 'owl') drawOwlWorldBack(g, t);
  if (G.hero === 'ren') drawRenDeco(g, t);
  // checkpoints (flags)
  for (const c of L.checkpoints) { const y = L.swim ? L.bed : GROUND; g.fillStyle = '#6b4a2b'; g.fillRect(c - 3, y - 90, 6, 90); g.fillStyle = G.checkpoint >= c ? '#46d36b' : '#e45555'; g.beginPath(); g.moveTo(c + 3, y - 88); g.lineTo(c + 48 + Math.sin(t * 5) * 4, y - 74); g.lineTo(c + 3, y - 58); g.fill(); }
  // hazards
  for (const h of L.hazards) thorns(g, h.x, h.w);
  // solids (rocks)
  for (const s of L.solids) { if (s.kind) { drawSolidKind(g, s, t); continue; } if (ok(IMG.rocks)) g.drawImage(IMG.rocks, s.x - 14, s.y - 16, s.w + 28, s.h + 22); else { g.fillStyle = '#777'; g.fillRect(s.x, s.y, s.w, s.h); } }
  // platforms (floating logs)
  for (const pl of L.plats) { const py = pl.y + (pl.bob ? Math.sin(t * 2 + pl.x) * 4 : 0); if (pl.kind === 'bridge') { drawBridge(g, pl); continue; } if (ok(IMG.log)) g.drawImage(IMG.log, pl.x - 8, py - 6, pl.w + 16, 36); else { g.fillStyle = '#8b5a2b'; g.fillRect(pl.x, py, pl.w, 26); } }
  // items
  for (const it of L.items) if (!it.got || (it.k === 'duck')) drawItem(g, it, t);
  // branches (shadow + falling)
  for (const b of G.branches) {
    g.fillStyle = `rgba(0,0,0,${Math.min(.45, b.t * .45)})`; g.beginPath(); g.ellipse(b.x, GROUND + 4, 30 + b.t * 30, 8, 0, 0, 7); g.fill();
    if (!b.fall) { g.fillStyle = '#ff5a3a'; g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillText('!', b.x, GROUND - 140 + Math.sin(t * 20) * 3); }
    if (b.fall && ok(IMG.sticks)) { g.save(); g.translate(b.x, Math.min(b.y, GROUND - 30)); g.rotate(b.landed ? .3 : b.t * 4); g.drawImage(IMG.sticks, -45, -35, 90, 70); g.restore(); }
  }
  // enemies
  if (G.hero === 'owl') { for (const e of L.enemies) drawOwlEnemy(g, e, t); }
  else if (G.hero === 'ren') drawRenWorld(g, t);
  else for (const e of L.enemies) drawEnemy(g, e, t);
  // hero
  if (G.hero === 'owl') { drawOwlHero(g, t); drawOwlWorldFront(g, t); }
  else if (G.hero === 'ren') { drawRenHero(g, t); drawRenFront(g, t); }
  else drawBenny(g, t);
  // particles
  for (const q of G.particles) {
    if (q.col === 'bubble') { g.strokeStyle = 'rgba(220,250,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.stroke(); }
    else { g.globalAlpha = Math.max(0, q.life); g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); g.globalAlpha = 1; }
  }
  // fireflies
  for (const f of G.fireflies) { const fx = f.x + Math.sin(t * f.s + f.p) * 30, fy = f.y + Math.cos(t * f.s * 1.3 + f.p) * 20; if (fx < cam - 40 || fx > cam + W + 40) continue; glow(g, fx, fy, 14, 'rgba(230,255,120,', .5 + .5 * Math.sin(t * 4 + f.p)); }
  g.restore();

  // night darkness with light around Benny + glowing things
  if (L.def.theme === 'night' || th.dark) {
    if (!G.dark || G.dark.width !== Math.ceil(W)) G.dark = mk(Math.ceil(W), H);
    const d = G.dark.getContext('2d');
    d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, W, H); d.fillStyle = th.dark || 'rgba(4,6,26,.66)'; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r) => { const rg = d.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = rg; d.beginPath(); d.arc(x, y, r, 0, 7); d.fill(); };
    hole(G.p.x - cam, G.p.y - (G.hero === 'owl' ? 0 : 50), 250);
    for (const it of L.items) if ((it.k === 'moon' || it.k === 'gfeather') && !it.got) hole(it.x - cam, it.y, 90);
    for (const o of (L.pillars || [])) if (o.kind === 'stal') { const hx = o.x + o.w / 2 - cam; if (hx > -60 && hx < W + 60) hole(hx, o.h, 70); }
    for (const f of G.fireflies) { const fx = f.x - cam; if (fx > -50 && fx < W + 50) hole(fx, f.y, 45); }
    hole(L.goal.x - cam, GROUND - 80, 160);
    g.drawImage(G.dark, 0, 0);
  }
  drawWeather(g, t);
  if (G.hero === 'ren') drawBossBar(g);
  if (L.swim) { // water tint + surface
    g.fillStyle = 'rgba(20,120,170,.12)'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(210,245,255,.55)'; g.beginPath(); g.moveTo(0, L.surface);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, L.surface + Math.sin((x + cam) * .03 + t * 3) * 5); g.lineTo(W, 0); g.lineTo(0, 0); g.fill();
  }
}
function cloud(g, x, y, s) { g.beginPath(); g.arc(x, y, 26 * s, 0, 7); g.arc(x + 30 * s, y - 12 * s, 32 * s, 0, 7); g.arc(x + 64 * s, y, 24 * s, 0, 7); g.arc(x + 30 * s, y + 8 * s, 26 * s, 0, 7); g.fill(); }
function glow(g, x, y, r, rgbPrefix, a) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgbPrefix + (a) + ')'); rg.addColorStop(1, rgbPrefix + '0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }

function drawGround(g) {
  const L = G.L, th = THEMES[L.def.theme], t = G.t;
  // water in gaps (and whole width low)
  const wg = g.createLinearGradient(0, GROUND + 10, 0, H); wg.addColorStop(0, th.water); wg.addColorStop(1, shade(th.water, -50));
  g.fillStyle = wg; g.fillRect(G.cam - 20, GROUND + 14, G.W + 40, H);
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2;
  for (let x = Math.floor(G.cam / 60) * 60; x < G.cam + G.W + 60; x += 60) { const y = GROUND + 26 + ((x / 60) % 3) * 12; g.beginPath(); g.moveTo(x + Math.sin(t * 2 + x) * 8, y); g.lineTo(x + 26 + Math.sin(t * 2 + x) * 8, y); g.stroke(); }
  for (const [a, b] of L.ground) {
    if (b < G.cam - 50 || a > G.cam + G.W + 50) continue;
    g.save(); g.translate(0, GROUND - 4); g.fillStyle = G.groundPat;
    g.beginPath(); g.moveTo(a + 10, 0); g.lineTo(b - 10, 0); g.quadraticCurveTo(b + 6, 30, b - 4, H - GROUND + 10); g.lineTo(a + 4, H - GROUND + 10); g.quadraticCurveTo(a - 6, 30, a + 10, 0); g.fill();
    g.restore();
  }
}
function drawUnderwaterWorld(g) {
  const L = G.L, t = G.t;
  const sg = g.createLinearGradient(0, L.bed - 10, 0, H); sg.addColorStop(0, '#d9c28a'); sg.addColorStop(1, '#9c8455');
  g.fillStyle = sg; g.fillRect(G.cam - 20, L.bed, G.W + 40, H - L.bed);
  g.fillStyle = 'rgba(255,255,255,.18)'; for (let x = Math.floor(G.cam / 40) * 40; x < G.cam + G.W + 40; x += 40) { g.beginPath(); g.ellipse(x + 10, L.bed + 18 + (x / 40 % 3) * 10, 12, 3, 0, 0, 7); g.fill(); }
  for (let x = Math.floor(G.cam / 150) * 150; x < G.cam + G.W + 150; x += 150) kelp(g, x + 40, L.bed + 6, 80 + (x / 150 % 4) * 30, '#2aa36a', t * 1.4 + x);
}
function thorns(g, x, w) {
  g.fillStyle = '#1f3b25'; g.beginPath(); g.ellipse(x + w / 2, GROUND - 10, w / 2 + 8, 26, 0, Math.PI, 0); g.fill();
  g.strokeStyle = '#b44'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const a = Math.PI + i / 8 * Math.PI, cx = x + w / 2 + Math.cos(a) * (w / 2 + 4), cy = GROUND - 10 + Math.sin(a) * 24; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); g.stroke(); }
  g.fillStyle = '#d33'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 12 + i * (w - 20) / 3, GROUND - 26 - (i % 2) * 8, 4, 0, 7); g.fill(); }
}
function drawItem(g, it, t) {
  if (it.k === 'clue') return drawClue(g, it, t);
  if (it.k === 'feather' || it.k === 'gfeather') return drawFeather(g, it.x, it.y + Math.sin(t * 3 + it.x) * 5, it.k === 'gfeather', t);
  if (it.k === 'heart') { const y = it.y + Math.sin(t * 3 + it.x) * 5, s = 1 + Math.sin(t * 6) * .06; glow(g, it.x, y, 40, 'rgba(255,90,110,', .6); g.save(); g.translate(it.x, y); g.scale(s, s); g.fillStyle = '#ff3b4e'; g.beginPath(); g.moveTo(0, 14); g.bezierCurveTo(-26, -4, -12, -22, 0, -10); g.bezierCurveTo(12, -22, 26, -4, 0, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-7, -8, 4, 3, -.5, 0, 7); g.fill(); g.restore(); return; }
  if (it.k === 'scroll') { glow(g, it.x, it.y, 50, 'rgba(255,230,150,', .7); g.save(); g.translate(it.x, it.y + Math.sin(t * 3) * 5); g.fillStyle = '#f2e6c8'; g.fillRect(-20, -9, 40, 18); g.fillStyle = '#8a1a1a'; g.fillRect(-24, -11, 6, 22); g.fillRect(18, -11, 6, 22); g.fillStyle = '#c9a227'; g.fillRect(-2, -9, 4, 18); g.restore(); return; }
  const bob = Math.sin(t * 3 + it.x) * 5, x = it.x, y = it.y + bob;
  if (it.k === 'coin') {
    const sq = Math.abs(Math.cos(t * 3 + it.x * .01));
    g.fillStyle = '#b8860b'; g.beginPath(); g.ellipse(x, y, 13 * sq + 2, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#ffd84d'; g.beginPath(); g.ellipse(x, y, 11 * sq + 1, 12, 0, 0, 7); g.fill();
    if (sq > .5) { g.fillStyle = '#8a5a00'; g.font = 'bold 13px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('L', x, y + 1); }
  } else if (it.k === 'log') {
    glow(g, x, y, 46, 'rgba(255,220,120,', .35);
    if (ok(IMG.log)) g.drawImage(IMG.log, x - 42, y - 22, 84, 46);
    if (!it.carry || !G.p.carry) { g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; if (it.carry && Math.abs(G.p.x - x) < 80) g.fillText(T('✋ Aufheben', '✋ Pick up'), x, y - 40); }
  } else if (it.k === 'pearl') {
    g.fillStyle = '#e59a8a'; g.beginPath(); g.ellipse(x, y + 10, 26, 12, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f5c0b0'; g.beginPath(); g.ellipse(x, y + 4, 26, 16, 0, Math.PI, 0); g.fill();
    glow(g, x, y + 2, 30, 'rgba(255,255,255,', .7); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y + 4, 8, 0, 7); g.fill();
  } else if (it.k === 'moon') {
    glow(g, x, y, 48, 'rgba(150,220,255,', .8);
    g.fillStyle = '#bfe9ff'; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x + 13, y); g.lineTo(x, y + 20); g.lineTo(x - 13, y); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, y - 20); g.lineTo(x + 5, y); g.lineTo(x, y + 8); g.lineTo(x - 5, y); g.fill();
  } else if (it.k === 'duck') duckling(g, it.x, it.got ? it.y : y, it.got ? (G.p.face) : -1, t + it.hx);
}
function duckling(g, x, y, face, t) {
  g.save(); g.translate(x, y); g.scale(face < 0 ? -1 : 1, 1);
  const hop = Math.abs(Math.sin(t * 8)) * 3;
  g.fillStyle = '#ffd43b'; g.beginPath(); g.ellipse(0, -hop, 17, 13, 0, 0, 7); g.fill();
  g.beginPath(); g.arc(12, -16 - hop, 10, 0, 7); g.fill();
  g.fillStyle = '#ff9f1c'; g.beginPath(); g.moveTo(20, -17 - hop); g.lineTo(29, -14 - hop); g.lineTo(20, -11 - hop); g.fill();
  g.fillStyle = '#222'; g.beginPath(); g.arc(15, -19 - hop, 2.2, 0, 7); g.fill();
  g.fillStyle = '#f7c21a'; g.beginPath(); g.ellipse(-4, -4 - hop, 9, 6, -.3, 0, 7); g.fill();
  g.restore();
}
function drawEnemy(g, e, t) {
  g.save(); g.translate(e.x, e.y);
  if (e.k === 'wasp') {
    g.scale(e.dir, 1);
    g.fillStyle = 'rgba(255,255,255,.7)'; const f = Math.sin(t * 40) * 6; g.beginPath(); g.ellipse(-2, -14 - f, 12, 6, -.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(6, -14 + f, 12, 6, .4, 0, 7); g.fill();
    g.fillStyle = '#ffbf1f'; g.beginPath(); g.ellipse(0, 0, 20, 12, 0, 0, 7); g.fill();
    g.fillStyle = '#222'; g.fillRect(-8, -11, 5, 22); g.fillRect(2, -11, 5, 22);
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-28, 3); g.lineTo(-19, 5); g.fill(); g.beginPath(); g.arc(15, -3, 3, 0, 7); g.fill();
  } else if (e.k === 'bat') {
    const f = Math.sin(t * 14) * .7; g.fillStyle = '#2b2440';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-30, -30 * f - 10, -50, 5 - 20 * f); g.quadraticCurveTo(-30, 0, 0, 8); g.fill();
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(30, -30 * f - 10, 50, 5 - 20 * f); g.quadraticCurveTo(30, 0, 0, 8); g.fill();
    g.beginPath(); g.ellipse(0, 4, 11, 14, 0, 0, 7); g.fill(); g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(-4, 0, 2.5, 0, 7); g.arc(4, 0, 2.5, 0, 7); g.fill();
  } else if (e.k === 'pike') {
    g.scale(e.dir, 1);
    g.fillStyle = '#4f7a3a'; g.beginPath(); g.moveTo(-60, 0); g.lineTo(-80, -16 + Math.sin(t * 8) * 4); g.lineTo(-80, 16 + Math.sin(t * 8) * 4); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(0, 0, 62, 17, 0, 0, 7); g.fill();
    g.fillStyle = '#c9d9a0'; g.beginPath(); g.ellipse(4, 6, 50, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#35522a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-35 + i * 15, -5, 5, 3, 0, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.arc(44, -5, 5, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(46, -5, 2.5, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(50 + i * 3, 4); g.lineTo(52 + i * 3, 9); } g.stroke();
  } else if (e.k === 'fox') {
    g.scale(e.retreat > 0 ? e.dir : e.dir, 1);
    const st = Math.sin(t * 14) * 5;
    g.fillStyle = '#b8521d'; g.fillRect(-26, -24 + Math.max(0, st) * .3, 7, 24); g.fillRect(14, -24, 7, 24);
    g.fillStyle = '#e0752a'; g.beginPath(); g.ellipse(0, -34, 38, 18, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-36, -38); g.quadraticCurveTo(-70, -60, -72, -30); g.quadraticCurveTo(-60, -26, -36, -30); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-68, -32, 7, 5, 0, 0, 7); g.fill();
    g.fillStyle = '#e0752a'; g.beginPath(); g.moveTo(26, -46); g.lineTo(58, -36); g.lineTo(28, -24); g.fill(); g.beginPath(); g.arc(30, -40, 14, 0, 7); g.fill();
    g.beginPath(); g.moveTo(22, -50); g.lineTo(26, -68); g.lineTo(34, -52); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(40, -32); g.lineTo(58, -36); g.lineTo(40, -26); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(58, -36, 3, 0, 7); g.arc(36, -43, 2.5, 0, 7); g.fill();
  }
  g.restore();
}
function drawGoal(g) {
  if (G.hero === 'owl') return drawOwlGoal(g);
  if (G.hero === 'ren') return drawRenGoal(g, G.L.goal.k, G.L.goal.x, G.t);
  const L = G.L, gx = L.goal.x, t = G.t;
  if (L.goal.k === 'dam' || L.goal.k === 'bigdam') {
    // river gap with dam; broken until built
    const built = L.goal.k === 'dam' ? (G.flags.built ? 5 : Math.floor((1.4 - Math.max(0, G.building)) / 1.4 * 5 * (G.building > 0 ? 1 : 0))) : G.delivered;
    const max = L.goal.k === 'dam' ? 5 : L.need;
    g.fillStyle = '#6b4a2b';
    for (let i = 0; i < max; i++) { const y = GROUND - 18 - i * 22; g.globalAlpha = i < built ? 1 : .22; if (ok(IMG.log)) g.drawImage(IMG.log, gx - 80 + (i % 2) * 10, y - 20, 160, 40); g.globalAlpha = 1; }
    // posts
    g.fillStyle = '#5a3a1f'; g.fillRect(gx - 92, GROUND - max * 22 - 20, 12, max * 22 + 20); g.fillRect(gx + 80, GROUND - max * 22 - 20, 12, max * 22 + 20);
    // water behind: rising when complete
    const full = built >= max;
    if (!full) { // leaking waterfall
      g.fillStyle = 'rgba(160,220,255,.8)'; for (let i = 0; i < 3; i++) g.fillRect(gx - 30 + i * 22 + Math.sin(t * 9 + i) * 3, GROUND - (max - built) * 22 + 8, 8, (max - built) * 22);
    } else { g.fillStyle = 'rgba(80,170,230,.55)'; g.fillRect(gx + 92, GROUND - max * 22 + 6, 260, max * 22 - 6); }
    g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center';
    if (Math.abs(G.p.x - gx) < 220 && !full) g.fillText(L.goal.k === 'dam' ? T('🔨 Damm reparieren', '🔨 Repair the dam') : T('🔨 Stamm abladen', '🔨 Drop the log'), gx, GROUND - max * 22 - 34);
  } else if (L.goal.k === 'exit') {
    glow(g, gx, 300, 120, 'rgba(180,255,240,', .45 + .2 * Math.sin(t * 3));
    g.fillStyle = '#10384a'; g.beginPath(); g.ellipse(gx, 320, 70, 110, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 38px system-ui'; g.textAlign = 'center'; g.fillText('➜', gx, 334);
  } else if (L.goal.k === 'pond') {
    g.fillStyle = '#3c9fd6'; g.beginPath(); g.ellipse(gx + 110, GROUND + 6, 170, 26, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(gx + 80, GROUND + 2, 60, 6, 0, 0, 7); g.fill();
    // mother duck
    g.save(); g.translate(gx + 130, GROUND - 6 + Math.sin(t * 2) * 2); g.scale(-1.9, 1.9);
    g.fillStyle = '#f5f0e6'; g.beginPath(); g.ellipse(0, -6, 20, 12, 0, 0, 7); g.fill(); g.fillStyle = '#2f7d4f'; g.beginPath(); g.arc(14, -22, 9, 0, 7); g.fill();
    g.fillStyle = '#f5f0e6'; g.fillRect(9, -18, 8, 10); g.fillStyle = '#ff9f1c'; g.beginPath(); g.moveTo(21, -23); g.lineTo(30, -20); g.lineTo(21, -17); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(17, -24, 1.8, 0, 7); g.fill();
    g.restore();
    if (G.following.length && Math.abs(G.p.x - gx) < 320) { g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; g.fillText(T('Mama Ente 🦆', 'Mother Duck 🦆'), gx + 120, GROUND - 70); }
  } else if (L.goal.k === 'moonrock') {
    glow(g, gx, GROUND - 90, 150, 'rgba(170,220,255,', G.got >= L.need ? .8 : .35);
    g.fillStyle = '#5b6a8f'; g.beginPath(); g.moveTo(gx - 70, GROUND); g.lineTo(gx - 50, GROUND - 120); g.lineTo(gx, GROUND - 170); g.lineTo(gx + 55, GROUND - 110); g.lineTo(gx + 75, GROUND); g.fill();
    g.fillStyle = '#e8f4ff'; g.beginPath(); g.arc(gx + 5, GROUND - 100, 22, 0, 7); g.fill(); g.fillStyle = '#5b6a8f'; g.beginPath(); g.arc(gx + 15, GROUND - 106, 20, 0, 7); g.fill();
  }
}
function drawBenny(g, t) {
  const p = G.p, L = G.L;
  if (p.inv > 0 && Math.floor(t * 16) % 2 === 0) return;
  g.save(); g.translate(p.x, p.y);
  if (L.swim) {
    const bodyA = 1.32 + Math.sin((p.swimT || 0) * .5) * .05, tiltV = clamp(p.vy / 700, -.45, .45);
    g.rotate(p.face * bodyA + tiltV);
    g.scale(p.face < 0 ? -1 : 1, 1);
    if (ok(IMG['benny-torso']) && ok(IMG['benny-head']) && ok(IMG['benny-arm']) && ok(IMG['benny-foot']) && ok(IMG['benny-tail'])) {
      // dog-paddle: paws stroke, feet kick, tail sways — built from Benny's painted sprite parts
      const ph = p.swimT;
      g.translate(-34, -104); g.scale(.5, .5);
      const limb = (img, ox, oy, px, py, ang) => { if (!img) return; g.save(); g.translate(px, py); g.rotate(ang); g.drawImage(img, ox - px, oy - py); g.restore(); };
      const armA = k => -.35 + .85 * Math.sin(ph + k), footA = k => .5 * Math.sin(ph * 1.3 + k);
      limb(darkOf('benny-arm'), 38, 104, 60, 112, armA(Math.PI));     // far paw
      limb(darkOf('benny-foot'), 31, 193, 68, 194, footA(Math.PI));   // far foot
      limb(IMG['benny-tail'], 0, 126, 32, 172, .28 * Math.sin(ph * .9));
      g.drawImage(IMG['benny-torso'], 20, 0);
      limb(IMG['benny-foot'], 35, 195, 72, 196, footA(0));             // near foot
      // head stays upright and looks where Benny swims
      limb(IMG['benny-head'], 20, 0, 84, 104, -(bodyA + p.face * tiltV) * .78 + Math.sin(ph) * .04);
      limb(IMG['benny-arm'], 42, 106, 64, 114, armA(0));               // near paw
    } else if (ok(IMG['benny-side'])) g.drawImage(IMG['benny-side'], -34, -104, 68, 110);
  } else {
    // shadow
    const gy = groundAt(p.x); if (gy != null) { g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, gy - p.y + 2, 30, 7, 0, 0, 7); g.fill(); }
    const moving = p.onGround && Math.abs(p.vx) > 20;
    const bob = moving ? Math.abs(Math.sin(p.walkT)) * 5 : Math.sin(t * 2.4) * 1.2;
    const tilt = !p.onGround ? -.12 * p.face : moving ? Math.sin(p.walkT) * .06 : 0;
    const sx = !p.onGround ? .94 : 1 + (moving ? 0 : Math.sin(t * 2.4) * .01), sy = !p.onGround ? 1.06 : 1;
    g.translate(0, -bob); g.rotate(tilt); g.scale((p.face < 0 ? -1 : 1) * sx, sy);
    if (p.carry && ok(IMG.log)) { g.save(); g.rotate(-.35); g.drawImage(IMG.log, -70, -96, 88, 40); g.restore(); }
    // Ground walk: use Benny's separate painted body parts so paws and feet really move.
    // This keeps the original painted look but gives Level 1 (and the later land levels) a proper walk cycle.
    if (ok(IMG['benny-torso']) && ok(IMG['benny-head']) && ok(IMG['benny-arm']) && ok(IMG['benny-foot']) && ok(IMG['benny-tail'])) {
      const ph = p.walkT || 0, amp = moving ? 1 : 0;
      g.save(); g.translate(-40, -128); g.scale(.6, .6);
      const limb = (img, ox, oy, px, py, ang) => { if (!img) return; g.save(); g.translate(px, py); g.rotate(ang); g.drawImage(img, ox - px, oy - py); g.restore(); };
      const armA = k => amp * (.48 * Math.sin(ph + k));
      const footA = k => amp * (.42 * Math.sin(ph + k));
      // Far limbs first, then body, then near limbs for natural depth.
      limb(darkOf('benny-arm'), 38, 104, 60, 112, armA(Math.PI));
      limb(darkOf('benny-foot'), 31, 193, 68, 194, footA(Math.PI));
      limb(IMG['benny-tail'], 0, 126, 32, 172, (moving ? .16 * Math.sin(ph * .7) : .06 * Math.sin(t * 2.1)));
      g.drawImage(IMG['benny-torso'], 20, 0);
      limb(IMG['benny-foot'], 35, 195, 72, 196, footA(0));
      g.drawImage(IMG['benny-head'], 20, 0);
      limb(IMG['benny-arm'], 42, 106, 64, 114, armA(0));
      g.restore();
    } else if (ok(IMG['benny-side'])) g.drawImage(IMG['benny-side'], -40, -128, 80, 132);
    else { g.fillStyle = '#8b5a2b'; g.fillRect(-25, -90, 50, 90); }
  }
  g.restore();
}

/* ---------------- loop ---------------- */
function loop(now) {
  if (!G) return;
  const scr = $('screen-benny-adv');
  if (!scr || !scr.classList.contains('active')) { stop(); return; }
  const dt = Math.min(.033, ((now - (G.last || now)) / 1000)); G.last = now;
  const r = G.canvas.getBoundingClientRect();
  if (Math.abs(G.W - H * r.width / Math.max(1, r.height)) > 1 || !G.scale) resize();
  let sdt = dt; if (G.hitstop > 0) { G.hitstop -= dt; sdt = dt * .08; } else if (G.slowmo > 0) { G.slowmo -= dt; sdt = dt * .35; }
  if (G.phase === 'play' && !G.paused) update(sdt); else { G.t += dt * (G.phase === 'intro' ? 1 : 0); }
  render();
  updateHud();
  G.raf = requestAnimationFrame(loop);
}

/* ================================================================
   HEROES: OWL (flight) + REN (samurai combat)  — v448
   ================================================================ */
const OWL_LEVELS = [
  { id: 1, theme: 'dawn', type: 'owl', thumb: 'owl-l1.jpg', name: ['Federpfad', 'Feather Trail'],
    story: ['Lerne fliegen! Flieg durch 5 goldene Windringe und sammle 6 Federn auf dem Weg zum Großen Baum.', 'Learn to fly! Glide through 5 golden wind rings and collect 6 feathers on the way to the Great Tree.'] },
  { id: 2, theme: 'falls', type: 'owl', thumb: 'owl-l2.jpg', name: ['Waldforscher', 'Forest Explorer'],
    story: ['Der Wald ist dicht: Weiche Baumstämmen und Ranken aus und nimm dich vor den frechen Krähen in Acht.', 'The forest is dense: dodge the trunks and vines and watch out for the cheeky crows.'] },
  { id: 3, theme: 'peaks', type: 'owl', thumb: 'owl-l3.jpg', name: ['Bergflug', 'Mountain Flight'],
    story: ['Hohe Felsen versperren den Weg. Nutze die warmen Aufwinde zum Aufsteigen — und pass auf den Adler auf!', 'Tall cliffs block the way. Ride the warm updrafts to climb — and beware of the eagle!'] },
  { id: 4, theme: 'storm', type: 'owl', thumb: 'owl-l4.jpg', name: ['Sturm-Prüfung', 'Storm Challenge'],
    story: ['Ein Gewitter tobt! Flieg durch die 6 sicheren Ringe, halte dich gegen Windböen und weiche den Blitzen aus.', 'A thunderstorm rages! Fly through the 6 safe rings, fight the gusts and dodge the lightning.'] },
  { id: 5, theme: 'goldcave', type: 'owl', thumb: 'owl-l5.jpg', name: ['Das goldene Nest', 'The Golden Nest'],
    story: ['Tief in der Höhle liegt das goldene Nest. Sammle 8 goldene Federn und bring sie heim — Fledermäuse wachen dort.', 'Deep in the cave lies the Golden Nest. Collect 8 golden feathers and bring them home — bats guard the way.'] }
];
const REN_LEVELS = [
  { id: 1, theme: 'dojo', type: 'ren', thumb: 'ren-l1.jpg', name: ['Trainingsplatz', 'Training Grounds'],
    story: ['Meister Hideo schaut zu. Zerschlage 6 Strohpuppen und gewinne den Übungskampf gegen 2 Schüler. Tipp: Mit 🛡️ blockst du Angriffe!', 'Master Hideo is watching. Cut down 6 straw dummies and win the sparring against 2 students. Tip: 🛡️ blocks attacks!'] },
  { id: 2, theme: 'bamboo', type: 'ren', thumb: 'ren-l2b.jpg', name: ['Bambuswald', 'Bamboo Forest'],
    story: ['Späher lauern zwischen den Bambusstangen. Besiege sie und erreiche den alten Schrein.', 'Scouts hide among the bamboo. Defeat them and reach the old shrine.'] },
  { id: 3, theme: 'village', type: 'ren', thumb: 'ren-l3.jpg', name: ['Dorfrettung', 'Village Rescue'],
    story: ['Räuber überfallen das Dorf! Besiege sie und befreie 3 eingesperrte Dorfbewohner aus den Käfigen.', 'Raiders attack the village! Defeat them and free 3 villagers from their cages.'] },
  { id: 4, theme: 'snowpeak', type: 'ren', thumb: 'ren-l4.jpg', name: ['Bergpfad', 'Mountain Path'],
    story: ['Der Pass ist verschneit und bewacht. Achte auf Bogenschützen — Pfeile kannst du blocken oder zerschlagen!', 'The pass is snowy and guarded. Watch the archers — you can block or cut their arrows!'] },
  { id: 5, theme: 'fortress', type: 'ren', thumb: 'ren-l5.jpg', name: ['Feindesfestung', 'Enemy Fortress'],
    story: ['Die Festung brennt. Besiege die Wachen und den Kommandanten, nimm die Schriftrolle und öffne das Tor.', 'The fortress is burning. Defeat the guards and the commander, take the scroll and open the gate.'] }
];
const HEROES = {
  benny: { levels: LEVELS, save: 'lakherance_benny_adventure', title: ['Benny – Der mutige Biber', 'Benny – The Brave Beaver'], banner: 'adv-benny.jpg', portrait: 'adventure/benny-front.png', more: 'benny-more.jpg', moreTxt: ['Wald, Sturm, Winter, Stadt, Schloss, Weltraum …', 'Forest, storm, winter, city, castle, space …'] },
  owl: { levels: OWL_LEVELS, save: 'lakherance_owl_adventure', title: ['Owl – Himmelsabenteuer', 'Owl – Sky Adventure'], banner: 'adv-owl.jpg', portrait: 'adventure/owl-fly1.png', more: 'owl-more.jpg', moreTxt: ['Höhlen, Nachthimmel, Polarlichter, schwebende Inseln …', 'Caves, night sky, auroras, floating islands …'] },
  ren: { levels: REN_LEVELS, save: 'lakherance_ren_adventure', title: ['Ren – Der Samurai', 'Ren – The Samurai'], banner: 'adv-ren.jpg', portrait: null, more: 'ren-more.jpg', moreTxt: ['Burgen, Schnee, Nachtmissionen, Schlachtfelder …', 'Castles, snow, night missions, war zones …'] }
};
['owl-fly1', 'owl-fly2', 'owl-fly3', 'owl-fly4'].forEach(n => { const i = new Image(); i.src = 'adventure/' + n + '.png'; IMG[n] = i; });

Object.assign(THEMES, {
  dawn:    { style: 1, sky: ['#7fb4ea', '#f7c7a6', '#ffe9c6'], sun: '#fff3d6', far: '#8aa3c4', far2: '#b7c3dc', snow: '#fbfdff', mid: '#4f7d5a', mid2: '#6f9e63', near: '#3f7f3d', near2: '#79b54c', ground: '#6aae44', dirt: '#6d4d2e', water: '#5ab8e0', midKind: 'spires', nearKind: 'leafy', river: 1, fx: 'motes' },
  falls:   { style: 1, sky: ['#5fb1e8', '#bfe6f7', '#eaf8ee'], sun: '#fffbe6', far: '#7897b6', far2: '#a4bdd3', snow: '#f6fbff', mid: '#2f6a3d', mid2: '#4c8f4e', near: '#2f7a37', near2: '#6db648', ground: '#5ca63e', dirt: '#5d4128', water: '#44aee0', midKind: 'falls', nearKind: 'leafy', river: 1, fx: 'motes' },
  peaks:   { style: 1, sky: ['#3f86d6', '#9fcff4', '#f4f1e6'], sun: '#fff8dc', far: '#8ea4c2', far2: '#c3d0e3', snow: '#ffffff', mid: '#56708c', mid2: '#7a93ad', near: '#355f45', near2: '#5f8f5a', ground: '#e9f0f7', dirt: '#9aa9ba', water: '#6ab7e0', midKind: 'spires', nearKind: 'snowpine', fx: 'snow' },
  storm:   { style: 1, sky: ['#141b33', '#2b3656', '#48506b'], sun: '#cfd8ff', far: '#2a3350', far2: '#3a4466', snow: '#9aa7c7', mid: '#17262a', mid2: '#223a3a', near: '#152a24', near2: '#23463a', ground: '#2e4f38', dirt: '#2a2019', water: '#2a4f7a', midKind: 'pines', nearKind: 'leafy', nosun: 1, noclouds: 1, stormClouds: 1, fx: 'rain' },
  goldcave:{ style: 'cave', sky: ['#1a0f06', '#2d1a0a', '#4a2d10'], sun: '#ffd36b', far: '#3a2410', far2: '#4b3016', mid: '#5a3a18', mid2: '#7a5222', near: '#2e5a2a', near2: '#4f8a3a', ground: '#7a5a2a', dirt: '#3a2610', water: '#c89a2a', nosun: 1, noclouds: 1, dark: 'rgba(24,12,2,.70)', fx: 'gold' },
  dojo:    { style: 1, sky: ['#e9784f', '#f7b778', '#fde3b0'], sun: '#fff0c2', far: '#8a6a8c', far2: '#b48f9f', snow: '#fff5ee', mid: '#5d3b3a', mid2: '#8a4b44', near: '#b04a6a', near2: '#f29ab8', ground: '#c9a36b', dirt: '#7a5634', water: '#5aa7c9', midKind: 'pagoda', nearKind: 'cherry', fx: 'petals' },
  bamboo:  { style: 1, sky: ['#9fd3a8', '#d7efd0', '#f3f9e6'], sun: '#fffbe0', far: '#7fa98a', far2: '#a9c9ad', snow: '#f4fbf2', mid: '#2f6b35', mid2: '#4f9a45', near: '#2c6a2e', near2: '#6fb54a', ground: '#4f8a3a', dirt: '#3f2e1c', water: '#4aa7a0', midKind: 'bamboo', nearKind: 'bamboo', fx: 'leaves' },
  village: { style: 1, sky: ['#2b1e4d', '#8a3f6a', '#f08a5d'], sun: '#ffe2b0', far: '#4a3a6a', far2: '#6d4f80', snow: '#f3e8ff', mid: '#2a1e2a', mid2: '#46303e', near: '#8a3050', near2: '#e27aa0', ground: '#6a5a3a', dirt: '#3e2e1e', water: '#3f6f9a', midKind: 'village', nearKind: 'cherry', moon: 1, noclouds: 1, river: 1, fx: 'petals' },
  snowpeak:{ style: 1, sky: ['#5f86c4', '#b8cde8', '#eef3fa'], sun: '#ffffff', far: '#7f95b8', far2: '#b3c2da', snow: '#ffffff', mid: '#3d5a6e', mid2: '#5f7d90', near: '#2f5446', near2: '#4f7d62', ground: '#edf3fa', dirt: '#95a5b8', water: '#7fb8dc', midKind: 'torii', nearKind: 'snowpine', fx: 'snow' },
  fortress:{ style: 1, sky: ['#1a0a12', '#5a1420', '#d2552a'], sun: '#ff9a5a', far: '#3a1820', far2: '#5a2430', snow: '#ffb38a', mid: '#1e1014', mid2: '#3a1c20', near: '#2a1414', near2: '#5a2020', ground: '#6b6f78', dirt: '#34363e', water: '#8a3a2a', midKind: 'castle', nearKind: 'lantern', moon: 1, noclouds: 1, fx: 'embers' }
});

/* ---------------- painters for the new worlds ---------------- */
function pagoda(g, x, base, s, wall, roof, glow) {
  for (let t = 0; t < 3; t++) {
    const w = (60 - t * 12) * s, y = base - t * 44 * s, hgt = 30 * s;
    g.fillStyle = wall; g.fillRect(x - w / 2, y - hgt, w, hgt);
    if (glow) { g.fillStyle = glow; for (let k = 0; k < 3; k++) g.fillRect(x - w / 2 + 6 * s + k * (w - 12 * s) / 3, y - hgt + 8 * s, 7 * s, 12 * s); }
    g.fillStyle = roof; g.beginPath(); const rw = w / 2 + 22 * s;
    g.moveTo(x - rw - 6 * s, y - hgt - 2 * s); g.quadraticCurveTo(x - rw * .5, y - hgt + 4 * s, x - w / 2 + 4 * s, y - hgt - 14 * s);
    g.lineTo(x + w / 2 - 4 * s, y - hgt - 14 * s); g.quadraticCurveTo(x + rw * .5, y - hgt + 4 * s, x + rw + 6 * s, y - hgt - 2 * s);
    g.lineTo(x + rw - 4 * s, y - hgt + 4 * s); g.lineTo(x - rw + 4 * s, y - hgt + 4 * s); g.closePath(); g.fill();
  }
  g.fillStyle = roof; g.fillRect(x - 2 * s, base - 3 * 44 * s - 34 * s, 4 * s, 26 * s);
}
function torii(g, x, base, s, col) {
  g.fillStyle = col; g.fillRect(x - 40 * s, base - 110 * s, 9 * s, 110 * s); g.fillRect(x + 31 * s, base - 110 * s, 9 * s, 110 * s);
  g.fillRect(x - 46 * s, base - 92 * s, 92 * s, 8 * s);
  g.beginPath(); g.moveTo(x - 62 * s, base - 108 * s); g.quadraticCurveTo(x, base - 118 * s, x + 62 * s, base - 108 * s); g.lineTo(x + 58 * s, base - 120 * s); g.quadraticCurveTo(x, base - 132 * s, x - 58 * s, base - 120 * s); g.closePath(); g.fill();
  g.fillStyle = '#1b1b1b'; g.fillRect(x - 60 * s, base - 128 * s, 120 * s, 5 * s);
}
function jhouse(g, x, base, s, wall, roof, lit) {
  g.fillStyle = wall; g.fillRect(x, base - 50 * s, 100 * s, 50 * s);
  g.fillStyle = 'rgba(40,20,10,.8)'; for (let i = 0; i <= 4; i++) g.fillRect(x + i * 24 * s, base - 50 * s, 4 * s, 50 * s); g.fillRect(x, base - 28 * s, 100 * s, 3 * s);
  if (lit) { g.fillStyle = lit; g.fillRect(x + 8 * s, base - 44 * s, 14 * s, 14 * s); g.fillRect(x + 56 * s, base - 44 * s, 14 * s, 14 * s); }
  g.fillStyle = roof; g.beginPath(); g.moveTo(x - 16 * s, base - 46 * s); g.quadraticCurveTo(x + 10 * s, base - 50 * s, x + 20 * s, base - 76 * s); g.lineTo(x + 80 * s, base - 76 * s); g.quadraticCurveTo(x + 90 * s, base - 50 * s, x + 116 * s, base - 46 * s); g.closePath(); g.fill();
}
function paperLantern(g, x, y, s, t) {
  const rg = g.createRadialGradient(x, y, 2, x, y, 40 * s); rg.addColorStop(0, 'rgba(255,190,90,.55)'); rg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, 40 * s, 0, 7); g.fill();
  g.fillStyle = '#d8322a'; g.beginPath(); g.ellipse(x, y, 9 * s, 12 * s, 0, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(x - 5 * s, y - 14 * s, 10 * s, 3 * s); g.fillRect(x - 5 * s, y + 11 * s, 10 * s, 3 * s);
}
function bambooStalk(g, x, base, h, col, dark, R) {
  const w = 9 + R() * 5; g.fillStyle = col; g.fillRect(x - w / 2, base - h, w, h);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - w / 2 + 2, base - h, 2, h);
  g.fillStyle = dark; for (let y = base - 30 - R() * 20; y > base - h; y -= 38 + R() * 14) g.fillRect(x - w / 2 - 1, y, w + 2, 3);
  g.fillStyle = col; for (let k = 0; k < 5; k++) { const ly = base - h * (.3 + R() * .7), d = R() < .5 ? -1 : 1; g.beginPath(); g.ellipse(x + d * 16, ly, 18, 4, d * .5, 0, 7); g.fill(); }
}
function castleWall(g, x, base, s, stone, roof, lit) {
  g.fillStyle = stone; g.beginPath(); g.moveTo(x - 10 * s, base); g.lineTo(x, base - 70 * s); g.lineTo(x + 180 * s, base - 70 * s); g.lineTo(x + 190 * s, base); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; for (let r = 0; r < 5; r++) { g.beginPath(); g.moveTo(x, base - r * 14 * s); g.lineTo(x + 180 * s, base - r * 14 * s); g.stroke(); }
  pagoda(g, x + 90 * s, base - 70 * s, s * .9, '#d8cfc0', roof, lit);
}
function snowPine(g, x, base, h, dark, light) {
  pine(g, x, base, h, dark, light);
  g.fillStyle = 'rgba(255,255,255,.92)';
  for (let t = 0; t < 4; t++) { const ty = base - h * .12 - t * h * .2, w = h * (.36 - t * .07); g.beginPath(); g.moveTo(x - w * .7, ty - h * .1); g.lineTo(x, ty - h * .34); g.lineTo(x + w * .6, ty - h * .12); g.quadraticCurveTo(x, ty - h * .2, x - w * .7, ty - h * .1); g.fill(); }
}
function rockSpire(g, x, base, w, h, col, top, R) {
  const gr = g.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, shade(col, 25)); gr.addColorStop(1, shade(col, -30)); g.fillStyle = gr;
  g.beginPath(); g.moveTo(x - w, base); g.lineTo(x - w * .7, base - h * .6); g.lineTo(x - w * .5, base - h); g.lineTo(x + w * .45, base - h * .98); g.lineTo(x + w * .7, base - h * .5); g.lineTo(x + w, base); g.fill();
  g.fillStyle = top; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x - w * .45 + i * w * .18, base - h - 4 + (R() - .5) * 6, 10 + R() * 8, 0, 7); g.fill(); }
}
function paintStyled(theme) {
  const th = THEMES[theme], R = rng(theme.length * 131 + 7);
  const far = mk(TILE, H), mid = mk(TILE, H), near = mk(TILE, H);
  let g = far.getContext('2d');
  if (th.style === 'cave') {
    // cave: layered rock walls with glowing gold veins
    for (const [cv, depth, col] of [[far, 0, th.far], [mid, 1, th.mid], [near, 2, th.dirt]]) {
      const c = cv.getContext('2d');
      c.fillStyle = col; c.beginPath(); c.moveTo(0, 0);
      for (let x = 0; x <= TILE; x += 40) c.lineTo(x, 40 + depth * 25 + Math.sin(x * .013 + depth) * 30 + R() * 30);
      c.lineTo(TILE, 0); c.fill();
      for (let i = 0; i < 10 + depth * 4; i++) { const x = R() * TILE, l = 40 + R() * 90; c.beginPath(); c.moveTo(x - 14, 60 + depth * 20); c.lineTo(x, 60 + depth * 20 + l); c.lineTo(x + 14, 60 + depth * 20); c.fill(); }
      if (depth < 2) { c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= TILE; x += 50) c.lineTo(x, 330 + depth * 50 - R() * 90); c.lineTo(TILE, H); c.fill(); }
      c.strokeStyle = depth === 1 ? 'rgba(255,200,80,.55)' : 'rgba(255,200,80,.25)'; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) { let x = R() * TILE, y = 100 + R() * 280; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += 10 + R() * 25; y += (R() - .5) * 30; c.lineTo(x, y); } c.stroke(); }
      if (depth === 2) for (let i = 0; i < 16; i++) { const x = R() * TILE; c.fillStyle = i % 2 ? th.near : th.near2; c.beginPath(); c.ellipse(x, 470, 16 + R() * 20, 30 + R() * 30, (R() - .5) * .6, Math.PI, 0); c.fill(); }
    }
    return { far, mid, near };
  }
  paintMountains(g, R, th, 330, 220, th.far2, th.snow, 4, th.sky[2]);
  paintMountains(g, R, th, 385, 150, th.far, th.snow, 6, th.mid);
  g = mid.getContext('2d');
  const mk2 = th.midKind;
  if (mk2 === 'pagoda') {
    for (let i = 0; i < 26; i++) { const x = R() * TILE, h = 130 + R() * 90; wrapDraw(x, 110, xx => pine(g, xx, 440, h, th.mid, th.mid2)); }
    for (let i = 0; i < 3; i++) { const x = 250 + i * 520 + R() * 80, s = .9 + R() * .4; wrapDraw(x, 120, xx => pagoda(g, xx, 440, s, '#e8dcc6', '#3a2626', 'rgba(255,200,120,.8)')); }
  } else if (mk2 === 'bamboo') {
    for (let i = 0; i < 70; i++) { const x = R() * TILE, h = 300 + R() * 180; const sd = Math.floor(R() * 1e9); wrapDraw(x, 30, xx => bambooStalk(g, xx, 450, h, i % 3 ? th.mid : th.mid2, shade(th.mid, -30), rng(sd))); }
    g.fillStyle = 'rgba(230,255,230,.25)'; g.fillRect(0, 0, TILE, H);
  } else if (mk2 === 'village') {
    for (let i = 0; i < 9; i++) { const x = i * 180 + R() * 40, s = .9 + R() * .3; wrapDraw(x, 130, xx => jhouse(g, xx, 440, s, '#3a2a30', '#1a1216', 'rgba(255,190,100,.85)')); }
    wrapDraw(TILE * .55, 120, xx => pagoda(g, xx, 440, 1.1, '#3a2a30', '#140c10', 'rgba(255,190,100,.9)'));
    for (let i = 0; i < 14; i++) { const x = R() * TILE, y = 330 + R() * 60; wrapDraw(x, 40, xx => paperLantern(g, xx, y, .8)); }
  } else if (mk2 === 'torii') {
    for (let i = 0; i < 26; i++) { const x = R() * TILE, h = 150 + R() * 110; wrapDraw(x, 110, xx => snowPine(g, xx, 445, h, th.mid, th.mid2)); }
    wrapDraw(TILE * .35, 90, xx => torii(g, xx, 445, 1.1, '#c8262a'));
    g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(R() * TILE, 400 + R() * 30, 90 + R() * 80, 18, 0, 0, 7); g.fill(); }
  } else if (mk2 === 'autumn') { paintAutumnMid(g, R, th);
  } else if (mk2 === 'castle') {
    for (let i = 0; i < 4; i++) { const x = i * 400 + R() * 80; wrapDraw(x, 210, xx => castleWall(g, xx, 445, 1 + R() * .2, '#2a1c1c', '#140a0a', 'rgba(255,140,60,.9)')); }
    const fg = g.createLinearGradient(0, 250, 0, 450); fg.addColorStop(0, 'rgba(255,90,30,0)'); fg.addColorStop(1, 'rgba(255,90,30,.35)'); g.fillStyle = fg; g.fillRect(0, 250, TILE, 200);
  } else if (mk2 === 'spires' || mk2 === 'falls') {
    for (let i = 0; i < 7; i++) { const x = i * 230 + R() * 60, w = 50 + R() * 40, h = 180 + R() * 150; wrapDraw(x, 110, xx => rockSpire(g, xx, 450, w, h, '#7d8a8f', th.mid2, rng(i * 7 + 1))); }
    if (mk2 === 'falls') for (let i = 0; i < 4; i++) { const x = 120 + i * 400 + R() * 60, top = 200 + R() * 60; const wg = g.createLinearGradient(0, top, 0, 450); wg.addColorStop(0, '#f2fbff'); wg.addColorStop(1, '#8fd3f2'); g.fillStyle = wg; g.fillRect(x - 18, top, 36, 450 - top); g.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x - 24 + R() * 48, 440 + R() * 10, 8 + R() * 10, 0, 7); g.fill(); } }
    for (let i = 0; i < 26; i++) { const x = R() * TILE, h = 120 + R() * 100; wrapDraw(x, 110, xx => pine(g, xx, 446, h, th.mid, th.mid2)); }
    if (theme === 'dawn') { g.fillStyle = '#d9cfbf'; for (let i = 0; i < 2; i++) { const x = 400 + i * 700; g.fillRect(x, 250, 40, 190); g.fillRect(x + 110, 250, 40, 190); g.beginPath(); g.arc(x + 75, 250, 75, Math.PI, 0); g.lineTo(x + 110, 250); g.arc(x + 75, 250, 35, 0, Math.PI, true); g.fill(); } }
  } else {
    for (let i = 0; i < 34; i++) { const x = (i / 34) * TILE + R() * 40, h = 150 + R() * 110; wrapDraw(x, 110, xx => pine(g, xx, 442, h, th.mid, th.mid2)); }
  }
  if (th.river) { const rg = g.createLinearGradient(0, 432, 0, 472); rg.addColorStop(0, th.water); rg.addColorStop(1, shade(th.water, -30)); g.fillStyle = rg; g.fillRect(0, 434, TILE, 38); }
  // near layer
  g = near.getContext('2d');
  const nk = th.nearKind;
  if (nk === 'bamboo') { for (let i = 0; i < 16; i++) { const x = R() * TILE, sd = Math.floor(R() * 1e9); wrapDraw(x, 30, xx => bambooStalk(g, xx, 475, 380 + R() * 120, th.near2, shade(th.near, -20), rng(sd))); } }
  else if (nk === 'snowpine') { for (let i = 0; i < 10; i++) { const x = R() * TILE, h = 180 + R() * 90; wrapDraw(x, 110, xx => snowPine(g, xx, 474, h, th.near, th.near2)); } }
  else if (nk === 'maple') { paintMapleNear(g, R, th); }
  else if (nk === 'lantern') {
    for (let i = 0; i < 8; i++) { const x = i * 200 + R() * 50; g.fillStyle = '#1a0e0e'; g.fillRect(x, 300, 5, 170); g.fillStyle = i % 2 ? '#8a1a1a' : '#c9a227'; g.fillRect(x + 5, 305, 28, 80); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 5, 355, 28, 4); }
    for (let i = 0; i < 10; i++) { const x = R() * TILE; wrapDraw(x, 45, xx => paperLantern(g, xx, 380 + R() * 40, 1)); }
  } else {
    const pinkish = nk === 'cherry';
    for (let i = 0; i < 9; i++) { const x = (i / 9) * TILE + R() * 90, s = .9 + R() * .6, sd = Math.floor(R() * 1e9); wrapDraw(x, 130, xx => leafy(g, xx, 470, s, th.near, th.near2, rng(sd), pinkish ? '#3a2226' : '#4a2f1a')); }
  }
  for (let i = 0; i < 26; i++) { const x = R() * TILE, rr = 16 + R() * 18; g.fillStyle = i % 2 ? th.near : th.near2; wrapDraw(x, 45, xx => { g.beginPath(); g.arc(xx, 468, rr, Math.PI, 0); g.fill(); }); }
  return { far, mid, near };
}

/* ---------------- OWL: levels ---------------- */
function buildOwl(idx) {
  const L = { idx, def: OWL_LEVELS[idx], hero: 'owl', fly: true, ground: [], plats: [], solids: [], items: [], enemies: [], hazards: [], checkpoints: [], pillars: [], rings: [], updrafts: [] };
  const I = L.items, F = (x, y, gold) => I.push({ k: gold ? 'gfeather' : 'feather', x, y });
  const ring = (x, y) => L.rings.push({ x, y, r: 64, done: false });
  if (idx === 0) {
    L.len = 4300;
    [[700, 260], [1300, 180], [1900, 320], [2600, 220], [3300, 280]].forEach(([x, y]) => ring(x, y));
    [[450, 330], [1000, 220], [1600, 150], [2250, 380], [2950, 200], [3650, 300]].forEach(([x, y]) => F(x, y));
    coinArc(I, 820, 5, 300, 90); coinRow(I, 1450, 5, 250); coinArc(I, 2050, 5, 360, 100); coinRow(I, 2750, 5, 200); coinArc(I, 3450, 5, 330, 80);
    L.goal = { k: 'bigtree', x: 4020 }; L.needRings = 5; L.need = 6;
  } else if (idx === 1) {
    L.len = 4700;
    L.pillars = [{ x: 900, w: 62, y: 250, kind: 'trunk' }, { x: 1520, w: 70, y: 210, kind: 'trunk' }, { x: 2320, w: 62, y: 280, kind: 'trunk' }, { x: 3020, w: 70, y: 230, kind: 'trunk' }, { x: 3740, w: 62, y: 265, kind: 'trunk' },
      { x: 1210, w: 34, y: 0, h: 190, kind: 'vine' }, { x: 1910, w: 34, y: 0, h: 225, kind: 'vine' }, { x: 2670, w: 34, y: 0, h: 200, kind: 'vine' }, { x: 3380, w: 34, y: 0, h: 185, kind: 'vine' }];
    [[1210, 300], [1910, 340], [2670, 320], [3380, 300]].forEach(([x, y]) => ring(x, y));
    [[600, 300], [931, 190], [1551, 150], [2100, 380], [2351, 220], [3051, 170], [4100, 260]].forEach(([x, y]) => F(x, y));
    coinRow(I, 300, 5, 280); coinArc(I, 1650, 5, 330, 80); coinRow(I, 2450, 4, 380); coinArc(I, 3150, 5, 350, 90); coinRow(I, 3900, 5, 300);
    L.enemies = [{ k: 'crow', x0: 1400, r: 200, y0: 300 }, { k: 'crow', x0: 2500, r: 220, y0: 200 }, { k: 'crow', x0: 3550, r: 200, y0: 320 }];
    L.goal = { k: 'bigtree', x: 4420 }; L.needRings = 4; L.need = 7;
  } else if (idx === 2) {
    L.len = 4900;
    L.pillars = [{ x: 1000, w: 120, y: 150, kind: 'rock' }, { x: 2000, w: 140, y: 120, kind: 'rock' }, { x: 3100, w: 130, y: 140, kind: 'rock' }, { x: 4000, w: 120, y: 165, kind: 'rock' }];
    L.updrafts = [{ x: 760, w: 200 }, { x: 1760, w: 210 }, { x: 2860, w: 210 }, { x: 3770, w: 200 }];
    [[1500, 260], [2550, 200], [3550, 300], [4450, 240]].forEach(([x, y]) => ring(x, y));
    [[600, 380], [1060, 105], [1440, 420], [2070, 80], [2700, 380], [3165, 95], [4060, 120]].forEach(([x, y]) => F(x, y));
    coinArc(I, 1200, 5, 300, 90); coinRow(I, 2250, 5, 330); coinArc(I, 3300, 5, 360, 90); coinRow(I, 4200, 4, 300);
    L.enemies = [{ k: 'eagle', x0: 1500, y0: 90 }, { k: 'eagle', x0: 3500, y0: 90 }];
    L.goal = { k: 'bigtree', x: 4700 }; L.needRings = 4; L.need = 7;
  } else if (idx === 3) {
    L.len = 4900; L.gusts = true; L.lightning = true;
    [[700, 300], [1300, 200], [1900, 330], [2600, 180], [3300, 300], [4000, 220]].forEach(([x, y]) => ring(x, y));
    [[1000, 380], [1650, 140], [2300, 390], [2950, 150], [3650, 400]].forEach(([x, y]) => F(x, y));
    coinArc(I, 850, 5, 330, 80); coinRow(I, 1500, 4, 260); coinArc(I, 2750, 5, 330, 90); coinRow(I, 3450, 5, 260);
    L.enemies = [{ k: 'crow', x0: 1600, r: 220, y0: 260 }, { k: 'crow', x0: 3000, r: 240, y0: 280 }];
    I.push({ k: 'heart', x: 2450, y: 260 });
    L.goal = { k: 'bigtree', x: 4650 }; L.needRings = 6; L.need = 5;
  } else {
    L.len = 4700;
    L.pillars = [{ x: 800, w: 70, y: 0, h: 200, kind: 'stal' }, { x: 1300, w: 90, y: 300, kind: 'rock' }, { x: 1850, w: 70, y: 0, h: 230, kind: 'stal' }, { x: 2400, w: 90, y: 280, kind: 'rock' },
      { x: 2950, w: 70, y: 0, h: 210, kind: 'stal' }, { x: 3500, w: 90, y: 290, kind: 'rock' }];
    [[1100, 260], [2150, 250], [3250, 250]].forEach(([x, y]) => ring(x, y));
    [[500, 300], [1035, 240], [1345, 250], [1885, 290], [2445, 230], [2985, 280], [3545, 240], [4000, 330]].forEach(([x, y]) => F(x, y, true));
    coinRow(I, 300, 4, 380); coinArc(I, 1550, 5, 360, 80); coinRow(I, 2600, 5, 380); coinArc(I, 3700, 5, 360, 80);
    L.enemies = [{ k: 'bat', x0: 1100, r: 180, y0: 330 }, { k: 'bat', x0: 2150, r: 200, y0: 320 }, { k: 'bat', x0: 3250, r: 200, y0: 330 }, { k: 'bat', x0: 4000, r: 160, y0: 260 }];
    I.push({ k: 'heart', x: 2700, y: 360 });
    L.goal = { k: 'goldnest', x: 4430 }; L.needRings = 3; L.need = 8;
  }
  L.ground = [[0, L.len]];
  L.pillars.forEach(o => { if (o.h == null) o.h = GROUND - o.y; });
  I.forEach(it => { it.got = false; it.hx = it.x; it.hy = it.y; });
  L.enemies.forEach((e, i) => { e.id = i; e.x = e.x0; e.y = e.y0; e.dir = 1; e.t = i * 1.7; e.state = 'patrol'; e.cd = 1 + i; });
  L.coinsTotal = I.filter(i => i.k === 'coin').length;
  return L;
}

/* ---------------- OWL: update ---------------- */
function updateOwl(dt) {
  const L = G.L, p = G.p, k = G.keys;
  const mx = (k.r ? 1 : 0) - (k.l ? 1 : 0); if (mx) p.face = mx;
  let wind = 0;
  if (L.gusts) {
    G.gustT = (G.gustT == null ? 4 : G.gustT) - dt;
    if (G.gustT <= 0) { if (G.gust > 0) { G.gust = 0; G.gustT = 3 + Math.random() * 2.5; } else { G.gust = 2.2; G.gustT = 2.2; toast(T('💨 Windböe! Dagegen fliegen!', '💨 Gust of wind! Fly against it!')); } }
    if (G.gust > 0) { G.gust -= dt; wind = -180; }
  }
  const px0 = p.x;
  p.vx += (mx * 330 + wind - p.vx) * Math.min(1, dt * 3);
  if (k.u || k.j) p.vy -= 760 * dt; // holding flap / up = steady climb
  if (k.d) p.vy += 900 * dt;
  p.vy += (p.diving ? 1600 : 640) * dt;
  let inUp = false;
  for (const u of L.updrafts) if (p.x > u.x && p.x < u.x + u.w) { p.vy -= 1500 * dt; inUp = true; }
  p.vy = clamp(p.vy, -420, p.diving ? 780 : 280);
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (p.diving) { p.diveT -= dt; if (p.diveT <= 0) p.diving = false; if (Math.random() < dt * 40) G.particles.push({ x: p.x - p.face * 30, y: p.y, vx: -p.face * 60, vy: -20, life: .4, col: 'rgba(255,255,255,.7)', r: 2 }); }
  p.x = clamp(p.x, 40, L.len - 40);
  if (p.y < 44) { p.y = 44; if (p.vy < 0) p.vy = 0; }
  const floor = GROUND - 28; p.perched = p.y >= floor; if (p.y > floor) { p.y = floor; p.vy = 0; }
  p.flapT = Math.max(0, (p.flapT || 0) - dt);
  p.wingPh = (p.wingPh || 0) + dt * (p.flapT > 0 ? 18 : inUp ? 5 : p.perched ? 0 : p.vy < 0 ? 10 : 4);
  // pillars (trunks, vines, cliffs, stalactites)
  for (const o of L.pillars) {
    if (p.x + 26 > o.x && p.x - 26 < o.x + o.w && p.y + 22 > o.y && p.y - 22 < o.y + o.h) {
      const fromTop = p.y < o.y + 10 && o.y > 0;
      if (fromTop) { p.y = o.y - 23; p.vy = Math.min(0, p.vy); p.perched = true; continue; } // land on top of a trunk/cliff — safe
      hurt(o.x + o.w / 2); p.x = p.x < o.x + o.w / 2 ? o.x - 27 : o.x + o.w + 27;
    }
  }
  // rings
  for (const rg of L.rings) {
    if (rg.done) continue;
    if ((px0 < rg.x) !== (p.x < rg.x) && Math.abs(p.y - rg.y) < rg.r - 10) {
      rg.done = true; G.rings = (G.rings || 0) + 1; SFX.item(); burst(rg.x, rg.y, '#ffe27a', 18);
      toast(T(`Ring ${G.rings}/${L.needRings} ✨`, `Ring ${G.rings}/${L.needRings} ✨`));
    }
  }
  // items
  for (const it of L.items) {
    if (it.got) continue;
    const dx = p.x - it.x, dy = p.y - it.y, r = it.k === 'coin' ? 42 : 50;
    if (dx * dx + dy * dy < r * r) {
      it.got = true;
      if (it.k === 'coin') { G.coins++; SFX.coin(); burst(it.x, it.y, '#ffd84d', 5); }
      else if (it.k === 'heart') { G.hp = Math.min(5, G.hp + 1); SFX.item(); burst(it.x, it.y, '#ff5a6a', 12); toast('+1 ❤️'); }
      else { G.got++; SFX.item(); burst(it.x, it.y, it.k === 'gfeather' ? '#ffd24a' : '#fff4d6', 14); const left = L.need - G.got; toast(left > 0 ? T(`Feder! Noch ${left}`, `Feather! ${left} to go`) : T('Alle Federn! ➜', 'All feathers! ➜')); }
    }
  }
  // enemies
  for (const e of L.enemies) {
    e.t += dt;
    if (e.k === 'crow' || e.k === 'bat') {
      e.x = e.x0 + Math.sin(e.t * (e.k === 'bat' ? 1.1 : .8)) * e.r; e.dir = Math.cos(e.t * (e.k === 'bat' ? 1.1 : .8)) >= 0 ? 1 : -1;
      e.y = e.y0 + Math.sin(e.t * (e.k === 'bat' ? 2.6 : 2.2)) * (e.k === 'bat' ? 70 : 45);
      if (Math.hypot(p.x - e.x, p.y - e.y) < 44) hurt(e.x);
    } else if (e.k === 'eagle') {
      e.cd -= dt;
      if (e.state === 'patrol') { e.x += (e.x0 + Math.sin(e.t * .6) * 180 - e.x) * Math.min(1, dt * 2); e.y += (e.y0 - e.y) * Math.min(1, dt * 2); e.dir = Math.cos(e.t * .6) >= 0 ? 1 : -1;
        if (e.cd <= 0 && Math.abs(p.x - e.x) < 420) { e.state = 'screech'; e.st = .8; e.tx = p.x; e.ty = p.y; tone(1400, 900, .35, .05, 'sawtooth'); } }
      else if (e.state === 'screech') { e.st -= dt; e.tx += (p.x - e.tx) * dt * 2; e.ty += (p.y - e.ty) * dt * 2; e.dir = e.tx > e.x ? 1 : -1; if (e.st <= 0) { e.state = 'dive'; e.st = 1.1; const d = Math.hypot(e.tx - e.x, e.ty - e.y) || 1; e.vx = (e.tx - e.x) / d * 560; e.vy = (e.ty - e.y) / d * 560; } }
      else if (e.state === 'dive') { e.st -= dt; e.x += e.vx * dt; e.y += e.vy * dt; if (e.st <= 0 || e.y > GROUND - 40) { e.state = 'climb'; } }
      else { e.y -= 240 * dt; e.x += (e.x0 - e.x) * dt; if (e.y <= e.y0) { e.state = 'patrol'; e.cd = 2.5; } }
      if (Math.hypot(p.x - e.x, p.y - e.y) < 50) hurt(e.x);
    }
  }
  // lightning
  if (L.lightning) {
    G.boltT = (G.boltT == null ? 3 : G.boltT) - dt;
    if (G.boltT <= 0 && !G.bolt) { G.bolt = { x: clamp(p.x + p.vx * .8 + (Math.random() - .5) * 260, 100, L.len - 100), t: 0 }; G.boltT = 2.2 + Math.random() * 1.4; }
    if (G.bolt) { const b = G.bolt; b.t += dt;
      if (b.t > .95 && !b.struck) { b.struck = 1; G.flash = .25; tone(120, 40, .5, .09, 'sawtooth'); if (Math.abs(p.x - b.x) < 48) hurt(b.x); }
      if (b.t > 1.25) G.bolt = null; }
  }
  if (G.flash > 0) G.flash -= dt;
  // goal
  const gx = L.goal.x;
  if (Math.abs(p.x - gx) < 130) {
    if (G.got >= L.need && (G.rings || 0) >= L.needRings) { G.flags.goal = 1; win(); }
    else if (!G.flags.goalMsg) { G.flags.goalMsg = 1; toast(T(`Noch nicht fertig: Ringe ${G.rings || 0}/${L.needRings}, Federn ${G.got}/${L.need}`, `Not yet: rings ${G.rings || 0}/${L.needRings}, feathers ${G.got}/${L.need}`)); }
  } else if (Math.abs(p.x - gx) > 260) G.flags.goalMsg = 0;
}

/* ---------------- OWL: drawing ---------------- */
function drawRingHalf(g, rg, front, t) {
  const col = rg.done ? 'rgba(140,255,170,.7)' : '#ffd24a';
  g.save(); g.lineWidth = 9; g.strokeStyle = col; g.shadowColor = rg.done ? '#8fffb0' : '#ffe27a'; g.shadowBlur = 14;
  g.beginPath(); g.ellipse(rg.x, rg.y, 20, rg.r, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); g.stroke();
  g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.8)'; g.shadowBlur = 0; g.beginPath(); g.ellipse(rg.x, rg.y, 17, rg.r - 3, 0, front ? -Math.PI / 2 : Math.PI / 2, front ? Math.PI / 2 : Math.PI * 1.5); g.stroke();
  if (!rg.done && !front) { g.fillStyle = 'rgba(255,240,180,.12)'; g.beginPath(); g.ellipse(rg.x, rg.y, 18, rg.r - 6, 0, 0, 7); g.fill(); }
  g.restore();
}
function drawPillar(g, o, t) {
  if (o.kind === 'trunk') {
    const gr = g.createLinearGradient(o.x, 0, o.x + o.w, 0); gr.addColorStop(0, '#6b4424'); gr.addColorStop(.5, '#8a5a30'); gr.addColorStop(1, '#4a2e18');
    g.fillStyle = gr; g.fillRect(o.x, o.y, o.w, o.h);
    g.strokeStyle = 'rgba(30,15,5,.45)'; g.lineWidth = 2; for (let y = o.y + 12; y < o.y + o.h; y += 26) { g.beginPath(); g.moveTo(o.x + 6, y); g.quadraticCurveTo(o.x + o.w / 2, y + 8, o.x + o.w - 6, y); g.stroke(); }
    g.fillStyle = '#2f6a2f'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(o.x + o.w / 2 + Math.cos(i) * o.w * .8, o.y - 6 + Math.sin(i * 2) * 10, 22, 0, 7); g.fill(); }
    g.fillStyle = '#4f9a3f'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(o.x + o.w / 2 - 20 + i * 14, o.y - 16, 12, 0, 7); g.fill(); }
  } else if (o.kind === 'vine') {
    g.strokeStyle = '#2f6a2f'; g.lineWidth = 7; for (let k = 0; k < 2; k++) { g.beginPath(); g.moveTo(o.x + 10 + k * 14, 0); for (let y = 0; y <= o.h; y += 20) g.lineTo(o.x + 10 + k * 14 + Math.sin(y * .05 + t * 1.5 + k) * 6, y); g.stroke(); }
    g.fillStyle = '#4f9a3f'; for (let y = 10; y < o.h; y += 22) { g.beginPath(); g.ellipse(o.x + 17 + Math.sin(y) * 10, y, 10, 5, .6, 0, 7); g.fill(); }
    g.fillStyle = '#c94a8a'; g.beginPath(); g.arc(o.x + 17, o.h, 7, 0, 7); g.fill();
  } else if (o.kind === 'rock' || o.kind === 'stal') {
    const top = o.kind === 'stal';
    const gr = g.createLinearGradient(o.x, 0, o.x + o.w, 0); gr.addColorStop(0, top ? '#6a4a22' : '#8a929a'); gr.addColorStop(1, top ? '#3a2410' : '#555e66');
    g.fillStyle = gr; g.beginPath();
    if (top) { g.moveTo(o.x - 8, 0); g.lineTo(o.x + o.w + 8, 0); g.lineTo(o.x + o.w, o.h * .6); g.lineTo(o.x + o.w * .5, o.h); g.lineTo(o.x, o.h * .6); }
    else { g.moveTo(o.x - 10, GROUND); g.lineTo(o.x, o.y + 20); g.lineTo(o.x + o.w * .3, o.y); g.lineTo(o.x + o.w * .8, o.y + 6); g.lineTo(o.x + o.w, o.y + 30); g.lineTo(o.x + o.w + 10, GROUND); }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = (top ? 20 : o.y + 40) + k * 45; g.beginPath(); g.moveTo(o.x + 8, yy); g.lineTo(o.x + o.w * .5, yy + 14); g.stroke(); }
    if (!top) { g.fillStyle = G.L.def.theme === 'goldcave' ? '#4f8a3a' : '#e9f2fa'; g.beginPath(); g.ellipse(o.x + o.w * .5, o.y + 4, o.w * .55, 10, 0, Math.PI, 0); g.fill(); }
    if (top && G.L.def.theme === 'goldcave') { glow(g, o.x + o.w * .5, o.h - 6, 26, 'rgba(255,210,90,', .6); }
  }
}
function drawOwlWorldBack(g, t) {
  const L = G.L;
  for (const u of L.updrafts) {
    const ug = g.createLinearGradient(0, GROUND, 0, 60); ug.addColorStop(0, 'rgba(255,240,200,.28)'); ug.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = ug; g.fillRect(u.x, 60, u.w, GROUND - 60);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const x = u.x + 14 + i * (u.w - 28) / 6, y = GROUND - ((t * 160 + i * 70) % (GROUND - 80)); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 20, x, y - 40); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.9)'; g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillText('⇧', u.x + u.w / 2, GROUND - 20);
  }
  for (const o of L.pillars) drawPillar(g, o, t);
  for (const rg of L.rings) drawRingHalf(g, rg, false, t);
  if (G.bolt) { const b = G.bolt;
    if (b.t < .95) { g.fillStyle = `rgba(255,255,160,${.12 + .12 * Math.sin(b.t * 40)})`; g.fillRect(b.x - 48, 0, 96, GROUND); g.fillStyle = '#fff36b'; g.font = 'bold 30px system-ui'; g.textAlign = 'center'; g.fillText('⚡', b.x, 60); }
    else { g.strokeStyle = '#fffbe0'; g.lineWidth = 6; g.shadowColor = '#bfe0ff'; g.shadowBlur = 20; g.beginPath(); let x = b.x, y = 0; g.moveTo(x, y); while (y < GROUND) { y += 40; x += (Math.random() - .5) * 50; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0; }
  }
}
function drawOwlWorldFront(g, t) { for (const rg of G.L.rings) drawRingHalf(g, rg, true, t); }
function drawOwlEnemy(g, e, t) {
  g.save(); g.translate(e.x, e.y);
  if (e.k === 'crow') {
    g.scale(e.dir, 1); const f = Math.sin(t * 16) * .8;
    g.fillStyle = '#16161c'; g.beginPath(); g.ellipse(0, 0, 24, 11, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-4, -2); g.quadraticCurveTo(-14, -26 * f - 8, -34, -14 * f - 4); g.quadraticCurveTo(-16, 2, -4, 4); g.fill();
    g.beginPath(); g.arc(20, -5, 8, 0, 7); g.fill(); g.fillStyle = '#e0a020'; g.beginPath(); g.moveTo(26, -6); g.lineTo(36, -3); g.lineTo(26, -1); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(22, -7, 2, 0, 7); g.fill(); g.fillStyle = '#16161c'; g.beginPath(); g.moveTo(-22, 0); g.lineTo(-36, -6); g.lineTo(-34, 6); g.fill();
  } else if (e.k === 'bat') { drawEnemy(g, { k: 'bat', x: 0, y: 0, dir: e.dir }, t); }
  else if (e.k === 'eagle') {
    g.scale(e.dir, 1); const diving = e.state === 'dive'; if (diving) g.rotate(Math.atan2(e.vy, Math.abs(e.vx)) * .8);
    const f = diving ? .2 : Math.sin(t * 7) * .8;
    g.fillStyle = '#5a3a1e'; g.beginPath(); g.ellipse(0, 0, 36, 14, 0, 0, 7); g.fill();
    g.fillStyle = '#6b4526'; g.beginPath(); g.moveTo(-8, -4); g.quadraticCurveTo(-24, -44 * f - 10, -62, -20 * f - 6); g.quadraticCurveTo(-30, 4, -8, 6); g.fill();
    g.fillStyle = '#f4efe6'; g.beginPath(); g.arc(30, -8, 11, 0, 7); g.fill();
    g.fillStyle = '#f2b01e'; g.beginPath(); g.moveTo(38, -10); g.quadraticCurveTo(50, -8, 44, 0); g.lineTo(38, -4); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.arc(33, -11, 2.2, 0, 7); g.fill();
    g.fillStyle = '#f4efe6'; g.beginPath(); g.moveTo(-34, -2); g.lineTo(-54, -8); g.lineTo(-52, 8); g.fill();
    if (e.state === 'screech') { g.scale(e.dir, 1); g.fillStyle = '#ff4a3a'; g.font = 'bold 28px system-ui'; g.textAlign = 'center'; g.fillText('!', 0, -30); }
  }
  g.restore();
}
function drawOwlHero(g, t) {
  const p = G.p; if (p.inv > 0 && Math.floor(t * 16) % 2 === 0) return;
  const fr = p.perched ? 0 : Math.floor(p.wingPh || 0) % 4, img = IMG['owl-fly' + (fr + 1)];
  g.save(); g.translate(p.x, p.y);
  g.rotate(clamp(p.vy / 1400, -.25, .45) * p.face + (p.diving ? .35 * p.face : 0));
  g.scale(p.face > 0 ? -1 : 1, 1);
  if (ok(img)) { const w = img.naturalWidth * .88, h = img.naturalHeight * .88; g.drawImage(img, -w / 2, -h / 2, w, h); }
  else { g.fillStyle = '#b07a44'; g.beginPath(); g.ellipse(0, 0, 40, 26, 0, 0, 7); g.fill(); }
  g.restore();
  if (p.perched) { g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(p.x, GROUND + 2, 30, 6, 0, 0, 7); g.fill(); }
}
function drawFeather(g, x, y, gold, t) {
  glow(g, x, y, 46, gold ? 'rgba(255,210,80,' : 'rgba(255,248,220,', .8);
  g.save(); g.translate(x, y); g.rotate(-.5 + Math.sin(t * 2 + x) * .18);
  const gr = g.createLinearGradient(-14, 0, 14, 0); gr.addColorStop(0, gold ? '#ffe070' : '#f4e2c4'); gr.addColorStop(.5, gold ? '#fff6c8' : '#fffaf0'); gr.addColorStop(1, gold ? '#d99a18' : '#c49a6c');
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, -30); g.bezierCurveTo(18, -22, 17, 8, 3, 26); g.lineTo(-3, 26); g.bezierCurveTo(-17, 8, -18, -22, 0, -30); g.fill();
  g.strokeStyle = gold ? 'rgba(160,100,0,.55)' : 'rgba(120,90,60,.45)'; g.lineWidth = 1;
  for (let i = -22; i < 20; i += 5) { g.beginPath(); g.moveTo(0, i); g.lineTo(-12 + Math.abs(i) * .15, i + 6); g.moveTo(0, i); g.lineTo(12 - Math.abs(i) * .15, i + 6); g.stroke(); }
  g.strokeStyle = gold ? '#a86b00' : '#7a5a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -28); g.lineTo(0, 34); g.stroke();
  g.restore();
}

/* ---------------- REN: levels ---------------- */
const EK = {
  dummy: { hp: 1 },
  student: { hp: 3, speed: 110, reach: 72, windup: .85, aggro: 380, pal: 'student', weapon: 'bokken', armor: .7 },
  ninja: { hp: 2, speed: 190, reach: 64, windup: .5, aggro: 430, pal: 'ninja', weapon: 'dagger', armor: .55 },
  raider: { hp: 2, speed: 150, reach: 74, windup: .6, aggro: 400, pal: 'raider', weapon: 'katana', armor: .6 },
  guard: { hp: 3, speed: 120, reach: 96, windup: .65, aggro: 400, pal: 'guard', weapon: 'spear', blockChance: .25, armor: .8 },
  archer: { hp: 2, speed: 110, reach: 0, aggro: 680, pal: 'archer', weapon: 'bow', ranged: true },
  boss: { hp: 12, speed: 150, reach: 104, windup: .55, aggro: 520, pal: 'boss', weapon: 'odachi', scale: 1.3, blockChance: .3, armor: .9 }
};
function buildRen(idx) {
  const L = { idx, def: REN_LEVELS[idx], hero: 'ren', ground: [], plats: [], solids: [], items: [], enemies: [], hazards: [], checkpoints: [], cages: [], arrows: [] };
  const I = L.items;
  const E = (k, x, z0, z1, y) => L.enemies.push({ k, x, z0: z0 == null ? x - 200 : z0, z1: z1 == null ? x + 200 : z1, y: y || GROUND });
  if (idx === 0) {
    L.len = 3300; L.ground = [[0, 3300]];
    L.plats = [{ x: 900, y: 360, w: 170 }, { x: 1500, y: 350, w: 170 }];
    [350, 620, 985, 1250, 1585, 1880].forEach(x => E('dummy', x, x, x, (x === 985 ? 360 : x === 1585 ? 350 : GROUND)));
    E('student', 2350, 2150, 2550); E('student', 2800, 2620, 3000);
    coinRow(I, 450, 4, 432); coinArc(I, 900, 4, 300, 40); coinArc(I, 1500, 4, 290, 40); coinRow(I, 2000, 5, 432);
    L.goal = { k: 'dojogate', x: 3150 }; L.need = 2; L.needDummies = 6; L.checkpoints = [2100];
  } else if (idx === 1) { // THE BAMBOO PATH — film edition (location from Ren's video)
    L.film = true; L.len = 5300; L.ground = [[0, 1950], [2300, 5300]];
    L.plats = [{ x: 1940, y: GROUND - 2, w: 370, kind: 'bridge' }];
    L.solids = [{ x: 1050, w: 250, h: 64, kind: 'biglog' }];
    for (let i = 0; i < 6; i++) L.solids.push({ x: 3920 + i * 66, w: 66, h: 25 * (i + 1), kind: 'step' });
    L.solids.push({ x: 4316, w: 984, h: 150, kind: 'plaza' });
    L.solids.forEach(s => { s.y = GROUND - s.h; });
    L.stream = [1420, 1900];
    L.deco = [{ k: 'house', x: 2560, s: 1.5, broken: 1 }, { k: 'lantern', x: 2780 }, { k: 'house', x: 2950, s: 1.35 }, { k: 'fence', x: 3170 }, { k: 'lantern', x: 3320 }, { k: 'house', x: 3470, s: 1.5, broken: 1 }, { k: 'torii', x: 3770, s: 1.25 },
      { k: 'lantern', x: 4400, y: GROUND - 150 }, { k: 'torii', x: 4500, s: 1.1, y: GROUND - 150 }, { k: 'shrine', x: 5000, y: GROUND - 150 }, { k: 'lantern', x: 5150, y: GROUND - 150 }];
    I.push({ k: 'clue', x: 3080, y: 440 });
    E('scout', 4760, 4340, 5280, GROUND - 150); E('scout', 4920, 4340, 5280, GROUND - 150); E('archer', 5170, 5000, 5285, GROUND - 150);
    L.enemies.forEach(en => { en.dormant = true; });
    coinRow(I, 300, 5, 432); coinArc(I, 1050, 5, 360, 60); coinRow(I, 1500, 5, 432); coinArc(I, 2020, 5, 400, 60); coinRow(I, 2600, 4, 432); coinArc(I, 3930, 6, 380, 90);
    I.push({ k: 'heart', x: 3300, y: 420 }, { k: 'heart', x: 4620, y: 280 });
    L.shrineX = 4420; L.goal = { k: 'cliff', x: 5230 }; L.need = 3; L.checkpoints = [1350, 2450, 3850];
  } else if (idx === 2) {
    L.len = 4300; L.ground = [[0, 4300]];
    L.plats = [{ x: 2900, y: 340, w: 200 }];
    L.cages = [{ x: 1150, hp: 2 }, { x: 2350, hp: 2 }, { x: 3550, hp: 2 }];
    E('raider', 700, 450, 1050); E('raider', 1500, 1250, 1800); E('raider', 1800, 1300, 2200); E('raider', 2650, 2450, 2850); E('archer', 3000, 2910, 3090, 340); E('raider', 3300, 3100, 3450); E('raider', 3800, 3650, 4050);
    coinRow(I, 300, 5, 432); coinArc(I, 1300, 5, 400); coinRow(I, 2000, 4, 432); coinArc(I, 2900, 4, 290, 40); coinRow(I, 3900, 4, 432);
    I.push({ k: 'heart', x: 2050, y: 420 }, { k: 'heart', x: 3200, y: 300 });
    L.cages.forEach(c => { c.freed = false; c.t = 0; });
    L.goal = { k: 'villagegate', x: 4150 }; L.need = 7; L.checkpoints = [1500, 2750];
  } else if (idx === 3) {
    L.len = 4500; L.ground = [[0, 1200], [1380, 2500], [2700, 4500]];
    L.plats = [{ x: 1212, y: 448, w: 156 }, { x: 2512, y: 448, w: 176 }, { x: 1800, y: 330, w: 210 }, { x: 3300, y: 320, w: 210 }];
    E('guard', 800, 500, 1150); E('archer', 1900, 1810, 2000, 330); E('guard', 2150, 1450, 2480); E('guard', 3000, 2750, 3250); E('archer', 3400, 3310, 3500, 320); E('guard', 3800, 3550, 4150);
    coinRow(I, 300, 4, 432); coinArc(I, 1200, 4, 400, 80); coinArc(I, 1800, 5, 290, 40); coinArc(I, 2500, 4, 400, 80); coinRow(I, 3900, 4, 432);
    I.push({ k: 'heart', x: 1905, y: 290 }, { k: 'heart', x: 3700, y: 420 });
    L.goal = { k: 'pass', x: 4330 }; L.need = 6; L.checkpoints = [1450, 2800];
  } else {
    L.len = 4700; L.ground = [[0, 4700]];
    L.plats = [{ x: 1250, y: 340, w: 200 }, { x: 2600, y: 340, w: 200 }];
    E('guard', 700, 450, 1100); E('archer', 1350, 1260, 1440, 340); E('guard', 1750, 1500, 2050); E('guard', 2250, 2100, 2550); E('archer', 2700, 2610, 2790, 340); E('guard', 3150, 2900, 3450); E('boss', 4150, 3780, 4420);
    coinRow(I, 300, 4, 432); coinArc(I, 1250, 5, 290, 40); coinRow(I, 1900, 4, 432); coinArc(I, 2600, 5, 290, 40); coinRow(I, 3400, 4, 432);
    I.push({ k: 'heart', x: 2400, y: 420 }, { k: 'heart', x: 3650, y: 420 });
    L.goal = { k: 'fortgate', x: 4580 }; L.need = 7; L.checkpoints = [1550, 3000, 3650];
  }
  I.forEach(it => { it.got = false; it.hx = it.x; it.hy = it.y; });
  L.enemies.forEach((e, i) => { const d = EK[e.k]; Object.assign(e, { id: i, hp: d.hp, max: d.hp, face: -1, state: 'idle', t: i * .9, vx: 0, stun: 0, cd: .5 + i * .2, dead: false, deadT: 0, hitBy: -1, wob: 0, shootT: 1 + i * .5 }); });
  L.coinsTotal = I.filter(i => i.k === 'coin').length;
  return L;
}

/* ---------------- REN: combat update ---------------- */
function renHitbox() { const p = G.p; return { x: p.x + p.face * 58, y: p.y - 62, hw: 60, hh: 64 }; }
function hitEnemy(e, dmg, force) {
  if (e.dead || (!force && e.hitBy === G.atkId)) return; e.hitBy = G.atkId; if (e.dormant) return;
  const d = EK[e.k]; dmg = dmg || (G.p.iaiHit ? 2 : 1);
  if (!force && e.k !== 'dummy' && (e.hyper || ((e.armorT || 0) > 0 && e.state !== 'windup' && e.state !== 'strike'))) { e.blockAnim = .3; clang(e.x - e.face * 20, e.y - 70); return; }
  if (!force && e.k !== 'dummy' && d.blockChance && e.state !== 'windup' && e.state !== 'strike' && e.stun <= 0 && (e.guardCd || 0) <= 0 && Math.random() < d.blockChance) {
    e.guardCd = 1.4; e.blockAnim = .35; clang(e.x - e.face * 20, e.y - 70); return;
  }
  e.hp -= dmg; G.hitstop = .06; if (!force) addSpirit(e.k === 'dummy' ? 6 : 14); if (G.p.iaiHit && !G.flags.iaiMsg) { G.flags.iaiMsg = 1; toast(T('Iai! Blitzschneller Zug aus der Scheide — doppelter Schaden', 'Iai! Lightning quick-draw — double damage')); }
  e.stun = .3; e.vx = G.p.face * 260; e.state = 'stun'; e.flashT = .15; e.wob = 1; e.armorT = d.armor || 0; e.counter = e.k !== 'dummy' && !d.ranged;
  tone(230, 90, .12, .08, 'square'); burst(e.x, e.y - 60, '#ffd0a0', 8);
  if (e.hp <= 0) {
    e.dead = true; e.deadT = 0; if (e.k !== 'dummy') G.slowmo = Math.max(G.slowmo || 0, .4);
    if (e.k === 'dummy') { G.dummies = (G.dummies || 0) + 1; toast(T(`Strohpuppe ${G.dummies}/${G.L.needDummies}`, `Straw dummy ${G.dummies}/${G.L.needDummies}`)); burst(e.x, e.y - 60, '#e8c77a', 20); }
    else {
      G.kills = (G.kills || 0) + 1; G.coins += 2; burst(e.x, e.y - 60, '#ffd84d', 10);
      if (e.k === 'boss') { G.flags.boss = 1; G.L.items.push({ k: 'scroll', x: e.x, y: GROUND - 40, hx: e.x, hy: GROUND - 40, got: false }); toast(T('Der Kommandant ist besiegt! Nimm die Schriftrolle 📜', 'The commander is defeated! Take the scroll 📜')); }
      else { const left = G.L.need - G.kills; if (left > 0) toast(T(`Besiegt! Noch ${left}`, `Defeated! ${left} to go`)); }
    }
  }
}
function clang(x, y) { tone(1900, 1500, .08, .05, 'triangle'); setTimeout(() => tone(2500, 2000, .06, .04, 'triangle'), 40); burst(x, y, '#fff6b0', 10); }
function updateRen(dt) {
  const L = G.L, p = G.p, k = G.keys;
  if (p.atkT > 0) p.atkT -= dt;
  if (renPreUpdate(dt)) return;
  p.blocking = !!(k.d || k.x) && !(p.atkT > .05) && p.inv < 1.1;
  if (p.blocking && p.onGround) p.vx *= .6;
  p.runPh = (p.runPh || 0) + dt * Math.abs(p.vx) / 32;
  const attacking = p.atkT > 0, at = .32 - p.atkT, active = attacking && at > .06 && at < .2;
  const hb = renHitbox();
  if (active) {
    for (const e of L.enemies) if (!e.dead && Math.abs(e.x - hb.x) < hb.hw + (e.k === 'boss' ? 20 : 0) && Math.abs((e.y - 60) - hb.y) < hb.hh) hitEnemy(e);
    for (const c of L.cages) if (!c.freed && c.hitBy !== G.atkId && Math.abs(c.x - hb.x) < hb.hw + 10 && Math.abs(GROUND - 50 - hb.y) < hb.hh) {
      c.hitBy = G.atkId; c.hp--; c.wob = 1; tone(300, 150, .1, .07, 'square'); burst(c.x, GROUND - 60, '#c9a86a', 8);
      if (c.hp <= 0) { c.freed = true; c.t = 0; G.freed = (G.freed || 0) + 1; SFX.win(); toast(T(`Dorfbewohner befreit! ${G.freed}/3 🙌`, `Villager freed! ${G.freed}/3 🙌`)); }
    }
    for (const a of L.arrows) if (!a.dead && Math.abs(a.x - hb.x) < hb.hw && Math.abs(a.y - hb.y) < hb.hh) { a.dead = true; clang(a.x, a.y); }
  }
  for (const c of L.cages) { if (c.wob > 0) c.wob -= dt * 3; if (c.freed) c.t += dt; }
  // enemies
  for (const e of L.enemies) {
    e.t += dt; if (e.flashT > 0) e.flashT -= dt; if (e.wob > 0) e.wob -= dt * 2.5; if (e.blockAnim > 0) e.blockAnim -= dt; if (e.guardCd > 0) e.guardCd -= dt; if (e.armorT > 0 && e.stun <= 0) e.armorT -= dt;
    if (e.dead) { e.deadT += dt; continue; }
    if (e.k === 'dummy' || e.dormant) continue;
    const d = EK[e.k], dx = p.x - e.x, adx = Math.abs(dx), sameLevel = Math.abs(p.y - e.y) < 100;
    if (e.stun > 0) { e.stun -= dt; e.x += e.vx * dt; e.vx *= .86; if (e.stun <= 0) { if (e.counter && adx < d.reach + 40) { e.state = 'windup'; e.st = d.windup * .9; e.hyper = true; e.face = dx > 0 ? 1 : -1; } else e.state = 'chase'; e.counter = false; } }
    else if (d.ranged) {
      e.face = dx > 0 ? 1 : -1;
      if (adx < 240 && sameLevel) e.x -= e.face * d.speed * dt;
      e.shootT -= dt;
      if (e.state === 'aim') { e.st -= dt; if (e.st <= 0) { e.state = 'idle'; L.arrows.push({ x: e.x + e.face * 30, y: e.y - 74, vx: e.face * 440, dead: false, life: 3 }); tone(900, 500, .12, .04, 'triangle'); } }
      else if (e.shootT <= 0 && adx < d.aggro) { e.state = 'aim'; e.st = .6; e.shootT = 2.4 + Math.random() * .6; }
    } else {
      if (e.state === 'windup') { e.st -= dt; if (e.st <= 0) { e.state = 'strike'; e.st = .16; e.struck = false; } }
      else if (e.state === 'strike') {
        e.st -= dt;
        if (!e.struck) { e.struck = true;
          if (adx < d.reach + 22 && sameLevel) {
            if (p.blocking && p.face === -e.face) { clang(p.x + p.face * 24, p.y - 70); e.state = 'stun'; e.stun = .7; e.armorT = 0; e.hyper = false; e.counter = false; e.vx = -e.face * 160; G.blocks = (G.blocks || 0) + 1; addSpirit(22); if (!G.flags.parried) { G.flags.parried = 1; toast(T('Pariert! 🛡️', 'Parried! 🛡️')); } continue; }
            hurt(e.x);
          } }
        if (e.st <= 0) { e.state = 'recover'; e.hyper = false; e.st = e.k === 'boss' ? .4 : .6; }
      } else if (e.state === 'recover') { e.st -= dt; if (e.st <= 0) e.state = 'chase'; }
      else {
        e.face = dx > 0 ? 1 : -1;
        if (adx < d.aggro && sameLevel) {
          e.state = 'chase';
          if (adx > d.reach) e.x += e.face * d.speed * dt;
          else { e.cd -= dt; if (e.cd <= 0) { e.state = 'windup'; e.st = d.windup; e.cd = e.k === 'boss' ? .2 : .5; } }
        } else { e.state = 'idle'; e.x += Math.sin(e.t * .7) * 30 * dt; }
      }
    }
    e.x = clamp(e.x, e.z0, e.z1); // stay in their area (no walking into gaps)
  }
  L.enemies = L.enemies.filter(e => !(e.dead && e.deadT > 1.6));
  // arrows
  for (const a of L.arrows) {
    if (a.dead) continue; a.x += a.vx * dt; a.life -= dt; if (a.life <= 0) { a.dead = true; continue; }
    if (Math.abs(a.x - p.x) < 22 && a.y > p.y - 115 && a.y < p.y - 6) {
      a.dead = true;
      if (p.blocking && p.face === -Math.sign(a.vx)) { clang(a.x, a.y); G.blocks = (G.blocks || 0) + 1; addSpirit(8); }
      else hurt(a.x - a.vx);
    }
  }
  L.arrows = L.arrows.filter(a => !a.dead);
  // goal
  const t = L.def.id, gx = L.goal.x, nearGoal = Math.abs(p.x - gx) < 110;
  let ready = false, missing = '';
  if (t === 1) { ready = (G.dummies || 0) >= L.needDummies && (G.kills || 0) >= L.need; missing = T(`Puppen ${G.dummies || 0}/${L.needDummies}, Übungskampf ${G.kills || 0}/${L.need}`, `Dummies ${G.dummies || 0}/${L.needDummies}, sparring ${G.kills || 0}/${L.need}`); }
  else if (t === 3) { ready = (G.kills || 0) >= L.need && (G.freed || 0) >= 3; missing = T(`Räuber ${G.kills || 0}/${L.need}, befreit ${G.freed || 0}/3`, `Raiders ${G.kills || 0}/${L.need}, freed ${G.freed || 0}/3`); }
  else if (t === 5) { ready = !!G.flags.scroll && (G.kills || 0) >= L.need; missing = G.flags.boss ? T('Nimm zuerst die Schriftrolle 📜', 'Take the scroll first 📜') : T(`Besiege Wachen & Kommandanten (${G.kills || 0}/${L.need})`, `Defeat the guards & commander (${G.kills || 0}/${L.need})`); }
  else { ready = (G.kills || 0) >= L.need; missing = T(`Noch Feinde übrig: ${G.kills || 0}/${L.need}`, `Enemies left: ${G.kills || 0}/${L.need}`); }
  if (nearGoal) { if (ready) { G.flags.goal = 1; if (L.film && !G.flags.outro) { G.flags.outro = 1; playFilm('outro', () => win()); } else if (!L.film) win(); } else if (!G.flags.goalMsg) { G.flags.goalMsg = 1; toast(missing); } }
  else if (Math.abs(p.x - gx) > 250) G.flags.goalMsg = 0;
}

/* ---------------- REN: the painted samurai ---------------- */
const PALS = {
  ren:     { armor: '#1d1b22', armor2: '#3d3846', lace: '#c0262d', pants: '#2a2228', pants2: '#18131a', skin: '#e2a87c', hair: '#141014', band: '#c8262d', cape: '#b81f28', sleeve: '#26202a', gold: '#d8a93a' },
  student: { armor: '#ece6d8', armor2: '#cfc7b4', lace: '#8a8070', pants: '#2f3c5a', pants2: '#1f2a44', skin: '#e0a97e', hair: '#1a1410', band: '#f4f0e6', cape: null, sleeve: '#e4ddcc', gold: '#8a6a3a' },
  ninja:   { armor: '#1c2236', armor2: '#2c3552', lace: '#3a4668', pants: '#1a2032', pants2: '#10141f', skin: '#d8a07a', hair: '#1c2236', band: '#1c2236', cape: '#2a3456', sleeve: '#1c2236', gold: '#7a8aa8', mask: 1 },
  raider:  { armor: '#6b4a2e', armor2: '#8a6440', lace: '#3d6b3d', pants: '#4a3a2a', pants2: '#2f2418', skin: '#c98e62', hair: '#241a12', band: '#3d6b3d', cape: null, sleeve: '#5a3e26', gold: '#8a7a50' },
  guard:   { armor: '#474e5a', armor2: '#6b7482', lace: '#2a4e8a', pants: '#2f3640', pants2: '#1e232a', skin: '#d9a47a', hair: '#141414', band: '#2a4e8a', cape: null, sleeve: '#39404a', gold: '#b8a060', helmet: 1 },
  archer:  { armor: '#3f5a3a', armor2: '#5a7a52', lace: '#8a6a2a', pants: '#2e3a2a', pants2: '#1e281c', skin: '#d6a07a', hair: '#1a1a12', band: '#8a6a2a', cape: null, sleeve: '#344a30', gold: '#9a8a50' },
  boss:    { armor: '#5a1212', armor2: '#8a2020', lace: '#e0b040', pants: '#2a0e0e', pants2: '#1a0808', skin: '#d49a70', hair: '#0e0a0a', band: '#e0b040', cape: '#3a1450', sleeve: '#4a1010', gold: '#e8c050', helmet: 1, crest: 1 }
};
const easeOut = x => 1 - Math.pow(1 - x, 3);
function samuraiPose(S) {
  // returns blade angle th and hand position (relative to shoulder)
  let th, hx, hy;
  if (S.sheathed) { const sw = S.mode === 'run' ? Math.sin(S.ph) * 12 : Math.sin(S.t * 2) * 1.5; return { th: 2.6, hx: 4 + sw, hy: 30, sheathed: true }; }
  switch (S.mode) {
    case 'run': th = 2.75 + Math.sin(S.ph) * .08; hx = -8; hy = 22; break;
    case 'air': th = -1.05; hx = 14; hy = 4; break;
    case 'attack': { const a = easeOut(clamp(S.a, 0, 1)); th = -2.55 + 3.5 * a; hx = 22 * Math.cos(th + .35); hy = 22 * Math.sin(th + .35); break; }
    case 'block': th = -1.5; hx = 18; hy = 2; break;
    case 'windup': th = -2.35; hx = -6; hy = -18; break;
    case 'hurt': th = 2.3; hx = -2; hy = 18; break;
    case 'aim': th = -1.57; hx = 24; hy = 2; break;
    default: th = -.55 + Math.sin(S.t * 2) * .03; hx = 16; hy = 20;
  }
  return { th, hx, hy };
}
function drawWeapon(g, P, weapon, th) {
  g.save(); g.rotate(th);
  if (weapon === 'bow') {
    g.strokeStyle = '#5a3a1a'; g.lineWidth = 4; g.beginPath(); g.arc(-10, 0, 46, -1.05, 1.05); g.stroke();
    g.strokeStyle = 'rgba(240,240,220,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-10 + 46 * Math.cos(-1.05), 46 * Math.sin(-1.05)); g.lineTo(-10 + 46 * Math.cos(1.05), 46 * Math.sin(1.05)); g.stroke();
    g.restore(); return;
  }
  if (weapon === 'spear') {
    g.fillStyle = '#5a3a1a'; g.fillRect(-40, -2.5, 118, 5);
    g.fillStyle = '#dfe6ee'; g.beginPath(); g.moveTo(78, -5); g.quadraticCurveTo(96, 0, 78, 5); g.fill(); g.fillStyle = P.lace; g.fillRect(74, -4, 4, 8);
    g.restore(); return;
  }
  const len = weapon === 'odachi' ? 88 : weapon === 'dagger' ? 32 : weapon === 'bokken' ? 58 : 66;
  // handle
  g.fillStyle = '#1a1414'; g.fillRect(-16, -3, 16, 6); g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = -14; i < 0; i += 4) g.fillRect(i, -2, 2, 4);
  if (weapon !== 'bokken') { g.fillStyle = P.gold; g.beginPath(); g.ellipse(1, 0, 3, 7, 0, 0, 7); g.fill(); }
  // blade (slight curve)
  if (weapon === 'bokken') { g.fillStyle = '#b9874a'; g.beginPath(); g.moveTo(2, -3); g.quadraticCurveTo(len * .6, -6, len, -2); g.lineTo(len, 2); g.quadraticCurveTo(len * .6, -1, 2, 3); g.fill(); }
  else {
    const bg = g.createLinearGradient(0, -4, 0, 4); bg.addColorStop(0, '#ffffff'); bg.addColorStop(.5, '#c9d3de'); bg.addColorStop(1, '#8a96a4');
    g.fillStyle = bg; g.beginPath(); g.moveTo(3, -2.5); g.quadraticCurveTo(len * .6, -6, len + 4, -5); g.lineTo(len - 4, 1); g.quadraticCurveTo(len * .6, 0, 3, 2.5); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(6, -2); g.quadraticCurveTo(len * .6, -5.2, len + 2, -4.6); g.stroke();
  }
  g.restore();
}
function limbSeg(g, x1, y1, x2, y2, w, col) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function drawSamurai(g, x, y, face, S, P, weapon, t, sc) {
  sc = sc || 1;
  g.save(); g.translate(x, y); g.scale(face * sc, sc);
  if (S.dead) { g.globalAlpha = Math.max(0, 1 - Math.max(0, S.deadT - .7) * 1.6); g.rotate(-Math.min(1.45, S.deadT * 3.2)); }
  const run = S.mode === 'run', air = S.mode === 'air';
  const bob = run ? Math.abs(Math.sin(S.ph)) * 3 : Math.sin(t * 2.2) * .8;
  const lean = run ? .13 : S.mode === 'attack' ? .08 + .1 * S.a : S.mode === 'hurt' ? -.28 : S.mode === 'windup' ? -.1 : 0;
  const hipY = -50 - bob;
  // legs (hakama)
  const aF = run ? Math.sin(S.ph) * .72 : air ? .6 : (S.mode === 'attack' || S.mode === 'block' || S.mode === 'windup') ? .38 : .12;
  const aB = run ? -Math.sin(S.ph) * .72 : air ? -.35 : (S.mode === 'attack' || S.mode === 'block' || S.mode === 'windup') ? -.34 : -.12;
  const legL = air ? 38 : 47;
  const leg = (hx, a, col) => {
    const ax = hx + Math.sin(a) * legL, ay = hipY + Math.cos(a) * legL;
    g.fillStyle = col; g.beginPath(); g.moveTo(hx - 9, hipY); g.lineTo(hx + 9, hipY); g.lineTo(ax + 12, ay); g.lineTo(ax - 11, ay); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hx, hipY + 4); g.lineTo(ax, ay - 2); g.stroke();
    g.fillStyle = '#1a1212'; g.beginPath(); g.ellipse(ax + 6, ay + 1, 10, 4, 0, 0, 7); g.fill();
  };
  leg(-4, aB, P.pants2);
  // cape / scarf flowing behind
  if (P.cape) {
    const sp = S.speed || 0; g.fillStyle = P.cape;
    g.beginPath(); const nx = -6, ny = hipY - 34; g.moveTo(nx, ny - 2);
    const pts = []; for (let i = 1; i <= 7; i++) pts.push([nx - i * (8 + sp * 5), ny + i * (4.5 - sp * 2.8) + Math.sin(t * 9 - i * .9) * (2 + i * .8 + sp * 3)]);
    pts.forEach(([px, py]) => g.lineTo(px, py - 5));
    for (let i = pts.length - 1; i >= 0; i--) g.lineTo(pts[i][0] + 2, pts[i][1] + 5 + i * .8);
    g.lineTo(nx + 4, ny + 10); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(nx, ny + 4); pts.forEach(([px, py], i) => g.lineTo(px, py + 2 + i * .5)); g.lineTo(nx + 4, ny + 10); g.fill();
  }
  // upper body (leans around hip)
  g.save(); g.translate(0, hipY); g.rotate(lean);
  const pose = samuraiPose(S), sx = 4, sy = -36, hx = sx + pose.hx, hy = sy + pose.hy;
  // back arm
  limbSeg(g, -5, sy + 2, (hx - 5 + -5) / 2 - 2, (hy + sy) / 2 + 6, 7, shade(P.sleeve, -25)); limbSeg(g, (hx - 5 + -5) / 2 - 2, (hy + sy) / 2 + 6, hx - 5, hy + 1, 6, shade(P.sleeve, -25));
  // torso armour
  const tg = g.createLinearGradient(-14, 0, 16, 0); tg.addColorStop(0, P.armor2); tg.addColorStop(1, P.armor);
  g.fillStyle = tg; g.beginPath(); g.moveTo(-13, 0); g.lineTo(13, 0); g.lineTo(16, -36); g.quadraticCurveTo(0, -42, -15, -36); g.closePath(); g.fill();
  g.strokeStyle = P.lace; g.lineWidth = 1.5; for (let r = 1; r <= 4; r++) { const yy = -r * 8; g.beginPath(); for (let xx = -11; xx < 13; xx += 5) { g.moveTo(xx, yy); g.lineTo(xx + 2.5, yy + 2); } g.stroke(); }
  g.fillStyle = P.lace; g.fillRect(-13, -3, 26, 4);
  if (P.maple) mapleLeaf(g, 1, -21, 7.5, P.gold);
  // skirt plates (kusazuri)
  for (let i = 0; i < 3; i++) { g.fillStyle = i === 1 ? P.armor2 : P.armor; g.save(); g.translate(-9 + i * 9, 1); g.rotate((i - 1) * .12 + (run ? Math.sin(S.ph + i) * .08 : 0)); g.fillRect(-4.5, 0, 9, 14); g.strokeStyle = P.lace; g.lineWidth = 1; g.beginPath(); g.moveTo(-4, 5); g.lineTo(4, 5); g.moveTo(-4, 10); g.lineTo(4, 10); g.stroke(); g.restore(); }
  if (P.tare) for (const [ox, ph] of [[-7, 1.3], [8, 0]]) { const sw = Math.sin(t * 6 + ph) * 2 + (run ? Math.sin(S.ph + ph) * 4 : 0) - (S.speed || 0) * 7; g.fillStyle = ox > 0 ? P.tare : shade(P.tare, -30); g.beginPath(); g.moveTo(ox - 6, 1); g.lineTo(ox + 6, 1); g.lineTo(ox + 5 + sw, 32); g.lineTo(ox - 5 + sw, 32); g.closePath(); g.fill(); g.fillStyle = P.gold; if (ox > 0) mapleLeaf(g, ox + sw * .6, 20, 3.2, 'rgba(216,169,58,.8)'); }
  if (P.saya) { g.save(); g.translate(-2, 3); g.rotate(2.72); g.fillStyle = '#17110f'; g.fillRect(0, -3, 64, 6); g.fillStyle = P.gold; g.fillRect(9, -3.5, 3, 7); g.fillRect(60, -3.5, 4, 7); if (pose.sheathed) { g.fillStyle = '#1a1414'; g.fillRect(-17, -3, 17, 6); g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = -15; i < 0; i += 4) g.fillRect(i, -2, 2, 4); g.fillStyle = P.gold; g.beginPath(); g.ellipse(0, 0, 3, 7, 0, 0, 7); g.fill(); } g.restore(); }
  // head
  const hy0 = -50;
  g.fillStyle = P.skin; g.beginPath(); g.arc(5, hy0, 11, 0, 7); g.fill();
  if (P.mask) { g.fillStyle = P.armor; g.beginPath(); g.arc(5, hy0, 11.5, 0, 7); g.fill(); g.fillStyle = P.skin; g.fillRect(4, hy0 - 4, 13, 5); g.fillStyle = '#111'; g.fillRect(11, hy0 - 3, 3, 2.5); }
  else {
    g.fillStyle = P.hair; g.beginPath(); g.arc(4, hy0 - 1, 11.5, Math.PI * .9, Math.PI * 1.95); g.lineTo(-6, hy0 + 6); g.fill();
    g.fillStyle = '#111'; g.fillRect(11, hy0 - 3, 3, 3); g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(9, hy0 - 7, 6, 1.6);
    g.fillStyle = 'rgba(160,70,50,.45)'; g.fillRect(10, hy0 + 5, 5, 1.4);
  }
  if (P.helmet) {
    g.fillStyle = P.armor2; g.beginPath(); g.arc(4, hy0 - 3, 13.5, Math.PI, 0); g.fill();
    g.fillStyle = P.armor; g.beginPath(); g.moveTo(-10, hy0 - 2); g.lineTo(-16, hy0 + 10); g.lineTo(-2, hy0 + 8); g.fill();
    g.fillStyle = P.gold; g.fillRect(-9, hy0 - 5, 26, 3);
    if (P.crest) { g.strokeStyle = P.gold; g.lineWidth = 3; g.beginPath(); g.moveTo(6, hy0 - 14); g.quadraticCurveTo(-8, hy0 - 32, -2, hy0 - 40); g.moveTo(6, hy0 - 14); g.quadraticCurveTo(20, hy0 - 32, 16, hy0 - 40); g.stroke(); }
  } else if (!P.mask) {
    g.fillStyle = P.hair; g.beginPath(); g.ellipse(-2, hy0 - 13, 5, 4, -.4, 0, 7); g.fill();
    if (P.band) { g.fillStyle = P.band; g.fillRect(-7, hy0 - 7, 20, 3.5);
    g.strokeStyle = P.band; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-6, hy0 - 5); g.quadraticCurveTo(-14, hy0 - 4 + Math.sin(t * 10) * 2, -20, hy0 - 1 + Math.sin(t * 10 + 1) * 3); g.stroke(); }
    if (P.tail) { g.strokeStyle = P.hair; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, hy0 - 14); g.quadraticCurveTo(-13, hy0 - 13 + Math.sin(t * 7) * 2, -17 - (S.speed || 0) * 7, hy0 - 1 + Math.sin(t * 7 + 1) * 3); g.stroke(); g.fillStyle = '#7a1a1e'; g.fillRect(-5, hy0 - 16, 4, 4); }
  }
  // shoulder guard
  g.save(); g.translate(sx - 2, sy + 3); g.rotate(.18); g.fillStyle = P.armor2; g.fillRect(-7, 0, 13, 16); g.strokeStyle = P.lace; g.lineWidth = 1; for (let r = 4; r < 16; r += 5) { g.beginPath(); g.moveTo(-6, r); g.lineTo(5, r); g.stroke(); } g.restore();
  // slash trail
  if (S.mode === 'attack' && S.a > .08 && S.a < .95) {
    const r0 = 26, r1 = weapon === 'odachi' ? 108 : 90, a0 = -2.55, a1 = pose.th;
    const sg = g.createRadialGradient(sx, sy, r0, sx, sy, r1); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.7, 'rgba(255,255,255,.55)'); sg.addColorStop(1, 'rgba(255,120,120,.25)');
    g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, r1, a0, a1); g.arc(sx, sy, r0 + 30, a1, a0, true); g.closePath(); g.fill();
  }
  // weapon + near arm
  if (!pose.sheathed) { g.save(); g.translate(hx, hy); drawWeapon(g, P, weapon, pose.th); g.restore(); }
  const ex = (sx + hx) / 2 + (S.mode === 'block' ? 6 : -3), ey = (sy + hy) / 2 + 7;
  limbSeg(g, sx, sy, ex, ey, 8.5, P.sleeve); limbSeg(g, ex, ey, hx, hy, 7.5, P.sleeve);
  g.fillStyle = P.skin; g.beginPath(); g.arc(hx, hy, 4.2, 0, 7); g.fill();
  if (S.mode === 'block') { g.strokeStyle = 'rgba(160,220,255,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(12, -30, 34, -1.3, 1.1); g.stroke(); }
  g.restore();
  leg(5, aF, P.pants);
  g.restore();
}
function drawDummy(g, e, t) {
  g.save(); g.translate(e.x, e.y); g.rotate(Math.sin(e.t * 20) * .15 * Math.max(0, e.wob));
  if (e.dead) { g.globalAlpha = Math.max(0, 1 - e.deadT); g.rotate(Math.min(1.3, e.deadT * 3)); }
  g.fillStyle = '#6b4a2a'; g.fillRect(-4, -100, 8, 100); g.fillRect(-28, -78, 56, 6);
  g.fillStyle = '#d9b86a'; g.beginPath(); g.ellipse(0, -62, 20, 28, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -100, 13, 0, 7); g.fill();
  g.strokeStyle = 'rgba(120,80,30,.6)'; g.lineWidth = 1.5; for (let i = -14; i <= 14; i += 5) { g.beginPath(); g.moveTo(i, -84); g.lineTo(i * .8, -40); g.stroke(); }
  g.strokeStyle = '#8a1a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-20, -60); g.lineTo(20, -60); g.stroke();
  g.fillStyle = '#c8262d'; g.beginPath(); g.arc(0, -62, 6, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -62, 2.5, 0, 7); g.fill();
  g.restore();
}
function drawCage(g, c, t) {
  const x = c.x, y = GROUND;
  if (!c.freed || c.t < .2) {
    g.save(); g.translate(x, y); g.rotate(Math.sin(t * 30) * .05 * Math.max(0, c.wob));
    villager(g, 0, 0, t, false);
    g.strokeStyle = '#8a6a3a'; g.lineWidth = 5; for (let i = -30; i <= 30; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, -86); g.stroke(); }
    g.fillStyle = '#5a3a1a'; g.fillRect(-38, -92, 76, 8); g.fillRect(-38, -4, 76, 6);
    g.restore();
  } else {
    const k = Math.min(1, c.t / 1.5);
    villager(g, x + k * 60, y - Math.abs(Math.sin(c.t * 8)) * 14 * (1 - k * .5), t, true, Math.max(0, 1 - (c.t - 2.5)));
    g.fillStyle = '#5a3a1a'; g.save(); g.translate(x - 20, y - 4); g.rotate(.4); g.fillRect(-20, -3, 40, 6); g.restore();
  }
}
function villager(g, x, y, t, happy, alpha) {
  if (alpha != null && alpha <= 0) return;
  g.save(); g.globalAlpha = alpha == null ? 1 : alpha; g.translate(x, y);
  g.fillStyle = '#4a7ab8'; g.beginPath(); g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(9, -42); g.lineTo(-9, -42); g.fill();
  g.fillStyle = '#e8b890'; g.beginPath(); g.arc(0, -52, 10, 0, 7); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(0, -55, 10, Math.PI, 0); g.fill();
  g.fillStyle = '#111'; g.fillRect(-4, -53, 2, 2); g.fillRect(3, -53, 2, 2);
  g.strokeStyle = '#e8b890'; g.lineWidth = 4; g.lineCap = 'round';
  if (happy) { const w = Math.sin(t * 12) * .4; g.beginPath(); g.moveTo(8, -36); g.lineTo(18, -58 + w * 10); g.moveTo(-8, -36); g.lineTo(-18, -58 - w * 10); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.arc(0, -47, 3, 0, Math.PI); g.fill(); }
  else { g.beginPath(); g.moveTo(8, -34); g.lineTo(12, -20); g.moveTo(-8, -34); g.lineTo(-12, -20); g.stroke(); }
  g.restore();
}
function enemyState(e) {
  if (e.dead) return { mode: 'hurt', dead: true, deadT: e.deadT, t: e.t };
  if (e.k === 'archer') return { mode: e.state === 'aim' ? 'aim' : 'idle', t: e.t };
  if (e.blockAnim > 0) return { mode: 'block', t: e.t };
  if (e.state === 'stun') return { mode: 'hurt', t: e.t };
  if (e.state === 'windup') return { mode: 'windup', t: e.t };
  if (e.state === 'strike') return { mode: 'attack', a: 1 - e.st / .16, t: e.t };
  if (e.state === 'chase' && Math.abs(G.p.x - e.x) > EK[e.k].reach) return { mode: 'run', ph: e.t * 9, speed: .6, t: e.t };
  return { mode: 'idle', t: e.t };
}
function drawRenWorld(g, t) {
  const L = G.L;
  for (const c of L.cages) drawCage(g, c, t);
  for (const e of L.enemies) {
    if (e.k === 'dummy') { drawDummy(g, e, t); continue; }
    const d = EK[e.k], S = enemyState(e);
    if (e.flashT > 0) { g.save(); g.globalAlpha = .6; }
    drawSamurai(g, e.x, e.y, e.face, S, PALS[d.pal], d.weapon, t, d.scale || 1);
    if (e.flashT > 0) g.restore();
    if (!e.dead && e.state === 'windup') { if (e.hyper) glow(g, e.x, e.y - 70, 70, 'rgba(255,60,40,', .35); g.fillStyle = e.hyper ? '#ffd23a' : '#ff3b30'; g.font = 'bold 30px system-ui'; g.textAlign = 'center'; g.fillText('!', e.x, e.y - 130 * (d.scale || 1)); }
    if (!e.dead && e.k === 'archer' && e.state === 'aim') { g.fillStyle = '#ffcc33'; g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillText('🏹', e.x, e.y - 128); }
    if (!e.dead && e.hp < e.max && e.k !== 'boss') { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(e.x - 22, e.y - 142, 44, 6); g.fillStyle = '#ff5a4a'; g.fillRect(e.x - 22, e.y - 142, 44 * e.hp / e.max, 6); }
  }
  for (const a of L.arrows) { g.save(); g.translate(a.x, a.y); g.scale(Math.sign(a.vx), 1); g.strokeStyle = '#6b4a2a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-26, 0); g.lineTo(16, 0); g.stroke(); g.fillStyle = '#ccc'; g.beginPath(); g.moveTo(16, -4); g.lineTo(26, 0); g.lineTo(16, 4); g.fill(); g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(-26, 0); g.lineTo(-34, -5); g.lineTo(-28, 0); g.lineTo(-34, 5); g.fill(); g.restore(); }
}
function drawRenHero(g, t) {
  const p = G.p;
  if (G.ghosts) for (const q of G.ghosts) { g.save(); g.globalAlpha = Math.min(.5, q.life * (q.gold ? 1.8 : 1.4)); drawSamurai(g, q.x, q.y, q.face, { mode: 'run', ph: 1, speed: 1, t, sheathed: false }, q.gold ? PALS.ghostGold : PALS.ghost, 'katana', t, 1.08); g.restore(); }
  if (p.inv > 0 && Math.floor(t * 16) % 2 === 0) return;
  let mode = 'idle', a = 0;
  if (p.atkT > 0) { mode = 'attack'; a = (.32 - p.atkT) / .26; }
  else if (p.blocking) mode = 'block';
  else if (!p.onGround) mode = 'air';
  else if (Math.abs(p.vx) > 30) mode = 'run';
  if (p.inv > 1.1) mode = 'hurt';
  const gy = p.onGround ? p.y : groundAt(p.x); if (gy != null) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(p.x, gy + 2, 30, 7, 0, 0, 7); g.fill(); }
  const sheathed = !p.drawn && mode !== 'attack' && mode !== 'block';
  drawSamurai(g, p.x, p.y, p.face, { mode, a, ph: p.runPh || 0, speed: clamp(Math.abs(p.vx) / 300, 0, 1), t, sheathed }, PALS.ren, 'katana', t, 1.08);
  if (p.specialT > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const gg = g.createLinearGradient(p.x - p.face * 300, 0, p.x, 0); gg.addColorStop(0, 'rgba(255,210,90,0)'); gg.addColorStop(1, 'rgba(255,220,120,.6)'); g.fillStyle = gg; g.fillRect(Math.min(p.x, p.x - p.face * 300), p.y - 90, 300, 60); g.restore(); }
}
function drawRenGoal(g, k, gx, t) {
  if (k === 'cliff') return drawCliffGoal(g, gx, t);
  if (k === 'dojogate') { g.fillStyle = '#5a3a24'; g.fillRect(gx - 70, GROUND - 130, 14, 130); g.fillRect(gx + 56, GROUND - 130, 14, 130); g.fillStyle = '#2a1a14'; g.beginPath(); g.moveTo(gx - 100, GROUND - 124); g.quadraticCurveTo(gx, GROUND - 150, gx + 100, GROUND - 124); g.lineTo(gx + 90, GROUND - 140); g.quadraticCurveTo(gx, GROUND - 170, gx - 90, GROUND - 140); g.fill(); g.fillStyle = '#e8dcc6'; g.fillRect(gx - 24, GROUND - 126, 48, 22); g.fillStyle = '#111'; g.font = 'bold 16px serif'; g.textAlign = 'center'; g.fillText('道場', gx, GROUND - 109); }
  else if (k === 'shrine') { torii(g, gx - 60, GROUND, 1.1, '#c8262a'); pagoda(g, gx + 60, GROUND, .8, '#e8dcc6', '#2a1a14', 'rgba(255,200,120,.8)'); }
  else if (k === 'villagegate') { g.fillStyle = '#6b4a2a'; for (let i = -60; i <= 60; i += 14) g.fillRect(gx + i, GROUND - 100 - (i % 28 ? 0 : 10), 10, 110); g.fillStyle = '#3a2418'; g.fillRect(gx - 70, GROUND - 90, 140, 8); paperLantern(g, gx - 80, GROUND - 110, 1); paperLantern(g, gx + 80, GROUND - 110, 1); }
  else if (k === 'pass') { torii(g, gx, GROUND, 1.3, '#c8262a'); }
  else if (k === 'fortgate') {
    const open = G.flags.goal ? 1 : 0;
    g.fillStyle = '#2a1a1a'; g.fillRect(gx - 90, GROUND - 170, 180, 170); g.fillStyle = '#140a0a'; g.beginPath(); g.moveTo(gx - 120, GROUND - 160); g.quadraticCurveTo(gx, GROUND - 190, gx + 120, GROUND - 160); g.lineTo(gx + 100, GROUND - 190); g.lineTo(gx - 100, GROUND - 190); g.fill();
    g.fillStyle = '#5a2a1a'; g.fillRect(gx - 70 - open * 50, GROUND - 140, 70, 140); g.fillRect(gx + open * 50, GROUND - 140, 70, 140);
    g.fillStyle = '#c9a227'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { g.beginPath(); g.arc(gx - 55 + c * 20 - open * 50, GROUND - 120 + r * 32, 3, 0, 7); g.arc(gx + 15 + c * 20 + open * 50, GROUND - 120 + r * 32, 3, 0, 7); g.fill(); }
    if (G.flags.scroll) { g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; g.fillText('📜 ➜ 🚪', gx, GROUND - 200); }
  }
}
function renPortrait() {
  try {
    const c = mk(140, 140), g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 140); bg.addColorStop(0, '#f39c5a'); bg.addColorStop(1, '#6b2a3a'); g.fillStyle = bg; g.fillRect(0, 0, 140, 140);
    drawSamurai(g, 62, 205, 1, { mode: 'idle', t: 0 }, PALS.ren, 'katana', 0, 2.3);
    return c.toDataURL('image/png');
  } catch (e) { return ''; }
}
function drawWeather(g, t) {
  const th = THEMES[G.L.def.theme], W = G.W, fx = th.fx; if (!fx) return;
  if (!G.wx) { G.wx = []; for (let i = 0; i < 70; i++) G.wx.push({ x: Math.random() * 1400, y: Math.random() * H, s: .5 + Math.random(), p: Math.random() * 6 }); }
  for (const q of G.wx) {
    const x = ((q.x - G.cam * (fx === 'rain' ? .9 : .5) + (fx === 'rain' ? -t * 260 : Math.sin(t * .7 + q.p) * 30)) % (W + 40) + W + 40) % (W + 40) - 20;
    const y = (q.y + t * (fx === 'rain' ? 900 : fx === 'embers' ? -50 : fx === 'motes' || fx === 'gold' ? -12 : 45) * q.s) % H; const yy = y < 0 ? y + H : y;
    if (fx === 'rain') { g.strokeStyle = 'rgba(190,210,255,.45)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, yy); g.lineTo(x - 6, yy + 18); g.stroke(); }
    else if (fx === 'snow') { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x, yy, 1.5 + q.s * 1.5, 0, 7); g.fill(); }
    else if (fx === 'petals') { g.fillStyle = 'rgba(255,170,200,.85)'; g.beginPath(); g.ellipse(x, yy, 4, 2.2, t * 2 + q.p, 0, 7); g.fill(); }
    else if (fx === 'leaves') { g.fillStyle = 'rgba(120,180,80,.8)'; g.beginPath(); g.ellipse(x, yy, 5, 2, t * 2 + q.p, 0, 7); g.fill(); }
    else if (fx === 'embers') { g.fillStyle = `rgba(255,${120 + (q.p * 20 | 0)},40,${.5 + .5 * Math.sin(t * 5 + q.p)})`; g.beginPath(); g.arc(x, yy, 1.5 + q.s, 0, 7); g.fill(); }
    else if (fx === 'gold') { glow(g, x, yy, 6, 'rgba(255,215,100,', .6 + .4 * Math.sin(t * 3 + q.p)); }
    else if (fx === 'maple') { mapleLeaf(g, x, yy, 3.5 + q.s * 2, ['#b02a18', '#d9542a', '#e8a23a'][Math.floor(q.p) % 3]); }
    else if (fx === 'motes') { g.fillStyle = 'rgba(255,255,240,.5)'; g.beginPath(); g.arc(x, yy, 1.3, 0, 7); g.fill(); }
  }
  if (th.rays) drawRays(g, t);
  if (th.mist) drawMist(g, t);
  if (fx === 'rain') { g.fillStyle = 'rgba(10,15,40,.18)'; g.fillRect(0, 0, W, H); }
  if (G.flash > 0) { g.fillStyle = `rgba(235,240,255,${G.flash * 2.4})`; g.fillRect(0, 0, W, H); }
}
function drawStormClouds(g, t) {
  g.fillStyle = 'rgba(30,36,60,.9)';
  for (let i = 0; i < 7; i++) { const cx = ((i * 330 - G.cam * .08 + t * 10) % (G.W + 400)) - 200; cloud(g, cx, 50 + (i * 29) % 70, 1.4 + (i % 3) * .4); }
}
function owlQuests() {
  const L = G.L, Q = (de, en, cur, max) => ({ txt: T(de, en), cur, max, done: cur >= max }), gold = L.def.theme === 'goldcave';
  return [Q(gold ? 'Goldene Federn' : 'Federn sammeln', gold ? 'Golden feathers' : 'Collect feathers', G.got, L.need),
    Q('Durch die Windringe', 'Fly through the rings', G.rings || 0, L.needRings),
    Q(gold ? 'Zum goldenen Nest' : 'Zum Großen Baum', gold ? 'Reach the Golden Nest' : 'Reach the Great Tree', G.flags.goal ? 1 : 0, 1)];
}
function renQuests() {
  const L = G.L, id = L.def.id, k = G.kills || 0, Q = (de, en, cur, max) => ({ txt: T(de, en), cur, max, done: cur >= max }), goal = G.flags.goal ? 1 : 0;
  if (id === 1) return [Q('Strohpuppen zerschlagen', 'Cut the straw dummies', G.dummies || 0, L.needDummies), Q('Übungskampf gewinnen', 'Win the sparring', k, L.need), Q('Zum Dojo-Tor', 'Reach the dojo gate', goal, 1)];
  if (id === 2 && L.film) return [Q('Folge dem Pfad', 'Follow the path', G.flags.path ? 1 : 0, 1), Q('Erkunde das verlassene Dorf', 'Explore the abandoned village', G.flags.clue ? 1 : 0, 1), Q('Erreiche den Bergschrein', 'Reach the mountain shrine', G.flags.shrine ? 1 : 0, 1), Q('Besiege die Späher', 'Defeat the scouts', k, L.need)];
  if (id === 2) return [Q('Späher besiegen', 'Defeat the scouts', k, L.need), Q('Pfeile blocken oder zerschlagen', 'Block or cut arrows', Math.min(1, G.blocks || 0), 1), Q('Zum alten Schrein', 'Reach the old shrine', goal, 1)];
  if (id === 3) return [Q('Räuber besiegen', 'Defeat the raiders', k, L.need), Q('Dorfbewohner befreien', 'Free the villagers', G.freed || 0, 3), Q('Zum Dorftor', 'Reach the village gate', goal, 1)];
  if (id === 4) return [Q('Wachen besiegen', 'Defeat the guards', k, L.need), Q('3 Angriffe blocken', 'Block 3 attacks', G.blocks || 0, 3), Q('Den Pass erreichen', 'Reach the pass', goal, 1)];
  return [Q('Wachen besiegen', 'Defeat the guards', Math.min(k, L.need - 1), L.need - 1), Q('Kommandant & Schriftrolle', 'Commander & scroll', G.flags.scroll ? 1 : 0, 1), Q('Das Tor öffnen', 'Open the gate', goal, 1)];
}
function drawOwlGoal(g) {
  const gx = G.L.goal.x, t = G.t, k = G.L.goal.k;
  if (k === 'bigtree') {
    const gr = g.createLinearGradient(gx - 50, 0, gx + 50, 0); gr.addColorStop(0, '#5a3a1e'); gr.addColorStop(.5, '#8a5a30'); gr.addColorStop(1, '#3e2612');
    g.fillStyle = gr; g.beginPath(); g.moveTo(gx - 70, GROUND); g.quadraticCurveTo(gx - 40, GROUND - 120, gx - 40, GROUND - 260); g.lineTo(gx + 40, GROUND - 260); g.quadraticCurveTo(gx + 40, GROUND - 120, gx + 75, GROUND); g.fill();
    g.fillStyle = '#1a0e06'; g.beginPath(); g.ellipse(gx, GROUND - 170, 20, 28, 0, 0, 7); g.fill(); glow(g, gx, GROUND - 170, 50, 'rgba(255,220,120,', .5 + .2 * Math.sin(t * 2));
    const leaves = THEMES[G.L.def.theme].near, leaves2 = THEMES[G.L.def.theme].near2;
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 3 ? leaves : leaves2; g.beginPath(); g.arc(gx + Math.cos(i * 1.7) * 120, GROUND - 300 + Math.sin(i * 2.3) * 60, 45 + (i % 4) * 8, 0, 7); g.fill(); }
    g.fillStyle = '#6b4424'; g.fillRect(gx + 40, GROUND - 210, 90, 10);
    g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; if (Math.abs(G.p.x - gx) < 400) g.fillText(T('Der Große Baum 🌳', 'The Great Tree 🌳'), gx, GROUND - 390);
  } else {
    glow(g, gx, GROUND - 120, 190, 'rgba(255,210,90,', .6 + .2 * Math.sin(t * 2));
    g.fillStyle = '#5a3a18'; g.beginPath(); g.moveTo(gx - 110, GROUND); g.lineTo(gx - 80, GROUND - 90); g.lineTo(gx + 90, GROUND - 95); g.lineTo(gx + 120, GROUND); g.fill();
    g.strokeStyle = '#c99a3a'; g.lineWidth = 5; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(gx, GROUND - 105, 70 - i * 2, 22, (i - 4) * .05, 0, Math.PI); g.stroke(); }
    g.fillStyle = '#ffe9a0'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(gx - 22 + i * 22, GROUND - 112, 11, 14, 0, 0, 7); g.fill(); }
    g.fillStyle = '#fff'; g.font = 'bold 18px system-ui'; g.textAlign = 'center'; if (Math.abs(G.p.x - gx) < 400) g.fillText(T('Das goldene Nest ✨', 'The Golden Nest ✨'), gx, GROUND - 170);
  }
}
function drawBossBar(g) {
  const b = G.L.enemies.find(e => e.k === 'boss' && !e.dead); if (!b || Math.abs(G.p.x - b.x) > 700) return;
  const W = G.W, w = Math.min(420, W * .6), x = (W - w) / 2;
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - 4, 104, w + 8, 22); g.fillStyle = '#5a0e0e'; g.fillRect(x, 108, w, 14); g.fillStyle = '#e0b040'; g.fillRect(x, 108, w * b.hp / b.max, 14);
  g.fillStyle = '#fff'; g.font = 'bold 14px system-ui'; g.textAlign = 'center'; g.fillText(T('Festungskommandant', 'Fortress Commander'), W / 2, 100);
}

/* ================================================================
   REN FILM EDITION (v450): film scenes from the Ren video, sheath & quick-draw,
   dash, spirit strike, vitality/spirit HUD, minimap, autumn world FX
   ================================================================ */
HEROES.ren.portrait = 'adventure/ren-portrait.jpg';
Object.assign(PALS.ren, { band: null, maple: 1, tare: '#8e1820', saya: 1, tail: 1, cape: '#7e1a20', armor: '#1c1a1e', armor2: '#3a3438' });
PALS.scout = { armor: '#2b2a30', armor2: '#45434c', lace: '#7a1a1e', pants: '#221e22', pants2: '#161316', skin: '#d8a07a', hair: '#141014', band: '#5a1a1a', cape: null, sleeve: '#26232a', gold: '#9a8a60', tail: 1 };
PALS.ghost = { armor: '#3a5a8a', armor2: '#4a6aa0', lace: '#6a8ac0', pants: '#2a4a7a', pants2: '#223a66', skin: '#6a8ac0', hair: '#2a4a7a', band: null, cape: '#3a5a8a', sleeve: '#3a5a8a', gold: '#8ab0e0' };
PALS.ghostGold = { armor: '#c9962a', armor2: '#ffd24a', lace: '#fff0a0', pants: '#a87a1a', pants2: '#8a6010', skin: '#ffe08a', hair: '#a87a1a', band: null, cape: '#ffd24a', sleeve: '#c9962a', gold: '#fff6c8' };
EK.scout = { hp: 3, speed: 175, reach: 74, windup: .55, aggro: 560, pal: 'scout', weapon: 'katana', armor: .6 };
THEMES.autumn = { style: 1, sky: ['#d98a5a', '#f2c58e', '#fbe6c4'], sun: '#fff0c8', far: '#8a7f8f', far2: '#b3a4a8', snow: '#f7efe6', mid: '#4c5e36', mid2: '#6d7f3f', near: '#a8321e', near2: '#e0672a', ground: '#7d8a3c', dirt: '#6e4f32', water: '#5f9fb0', midKind: 'autumn', nearKind: 'maple', fx: 'maple', rays: 1, mist: 1 };
['dojo', 'bamboo', 'village', 'snowpeak', 'fortress'].forEach(k => { if (THEMES[k]) THEMES[k].rays = k === 'dojo' || k === 'bamboo' ? 1 : 0; });
REN_LEVELS[1] = { id: 2, theme: 'autumn', type: 'ren', thumb: 'ren-l2b.jpg', film: 1, name: ['Der Bambuspfad', 'The Bamboo Path'],
  story: ['Folge dem Bambuspfad durch den Herbstwald, über Bach und Brücke, durch das verlassene Dorf bis hinauf zum Bergschrein. Dort warten 3 Späher.', 'Follow the Bamboo Path through the autumn forest, across stream and bridge, through the abandoned village up to the mountain shrine. 3 scouts are waiting there.'] };

/* ---------- film scenes ---------- */
const FILMS = {
  intro: [[0, 'In den Bergen ist es Herbst geworden.', 'Autumn has come to the mountains.'], [2.6, 'Späher wurden am alten Bergschrein gesehen …', 'Scouts were seen at the old mountain shrine …'], [5, 'Ren folgt dem Bambuspfad.', 'Ren follows the Bamboo Path.']],
  shrine: [[0, 'Der Bergschrein. Viel zu still …', 'The mountain shrine. Far too quiet …'], [3.6, 'Ren zieht sein Schwert.', 'Ren draws his sword.']],
  ambush: [[0, 'Die Späher greifen an!', 'The scouts attack!']],
  outro: [[0, 'Die Späher sind besiegt.', 'The scouts are defeated.'], [2.4, 'Unten im Tal wartet die Burg … Rens Reise geht weiter.', 'The castle waits in the valley … Ren\'s journey continues.']]
};
let filmDone = null, filmSubTimer = 0, filmFb = 0;
function soundOn() { try { return typeof lsGet !== 'function' || lsGet('lakherance_sound_enabled', true) !== false; } catch (e) { return true; } }
function playFilm(name, done) {
  // v457: Film-Zwischensequenzen entfernt — direkt weiterspielen
  if (done) done(); return;
  const box = $('ba-film'), v = $('ba-film-v'), kb = $('ba-film-kb'), sub = $('ba-film-sub'), subs = FILMS[name] || [];
  if (!box || !v) { if (done) done(); return; }
  if (G) { G.phase = 'film'; G.keys = {}; }
  filmDone = done; box.classList.add('show'); requestAnimationFrame(() => box.classList.add('bars'));
  const sk = $('ba-film-skip'); if (sk) sk.textContent = T('Überspringen ›', 'Skip ›');
  sub.textContent = ''; kb.style.display = 'none'; kb.classList.remove('run');
  const base = 'adventure/ren-film/ren-' + name;
  let usingFb = false;
  const fallback = () => { // offline or blocked: the poster image with a slow camera move
    if (usingFb) return; usingFb = true; v.style.display = 'none';
    kb.style.backgroundImage = `url(${base}.jpg)`; kb.style.display = 'block'; void kb.offsetWidth; kb.classList.add('run');
    clearTimeout(filmFb); filmFb = setTimeout(endFilm, 5600);
  };
  v.style.display = ''; v.onerror = fallback; v.onended = endFilm;
  v.poster = base + '.jpg'; v.src = base + '.mp4'; v.muted = !soundOn(); v.volume = .8;
  try { const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; v.play().catch(fallback); }); } catch (e) { fallback(); }
  clearTimeout(filmFb); filmFb = setTimeout(() => { if (v.readyState < 2) fallback(); }, 4000); // stuck loading → fallback
  const t0 = performance.now();
  clearInterval(filmSubTimer);
  filmSubTimer = setInterval(() => {
    const tt = usingFb ? (performance.now() - t0) / 1000 : v.currentTime; let s = '';
    for (const [at, de, en] of subs) if (tt >= at) s = T(de, en);
    if (sub.textContent !== s) sub.textContent = s;
    if (!usingFb && v.readyState >= 2) { clearTimeout(filmFb); }
  }, 150);
}
function endFilm() {
  const box = $('ba-film'), v = $('ba-film-v'); clearInterval(filmSubTimer); clearTimeout(filmFb);
  if (!box || !box.classList.contains('show')) return;
  try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
  box.classList.remove('bars', 'show');
  const d = filmDone; filmDone = null; if (G && G.phase === 'film') G.phase = 'play'; if (d) d();
}

/* ---------- Ren moves ---------- */
function addSpirit(n) {
  if (!G) return; const was = G.spirit || 0; G.spirit = clamp(was + n, 0, 100);
  if (was < 100 && G.spirit >= 100) { toast(T('⚡ Geistesschlag bereit!', '⚡ Spirit Strike ready!')); tone(700, 1400, .3, .05, 'triangle'); }
}
function doDash(down) {
  if (!G || !down || G.hero !== 'ren' || G.phase !== 'play') return; const p = G.p;
  if ((p.dashCd || 0) > 0) return;
  p.dashT = .2; p.dashCd = .75; p.dashInv = .32; tone(520, 150, .14, .04, 'sawtooth');
}
function doSpecial(down) {
  if (!G || !down || G.hero !== 'ren' || G.phase !== 'play') return; const p = G.p;
  if ((G.spirit || 0) < 100) { toast(T(`Geist ${Math.round(G.spirit || 0)}% — treffen oder parieren füllt ihn`, `Spirit ${Math.round(G.spirit || 0)}% — hits and parries fill it`)); return; }
  G.spirit = 0; p.drawn = true; p.specialT = .4; p.dashInv = .6; G.slowmo = .6; G.flash = .16; G.shake = .25;
  G.atkId = (G.atkId || 0) + 1; p.atkT = .32; p.iaiHit = false;
  const x0 = p.x, x1 = p.x + p.face * 340;
  for (const e of G.L.enemies) if (!e.dead && !e.dormant && (e.x - x0) * p.face > -40 && (e.x - x1) * p.face < 40 && Math.abs(e.y - p.y) < 110) hitEnemy(e, 3, true);
  for (const c of G.L.cages) if (!c.freed && (c.x - x0) * p.face > -40 && (c.x - x1) * p.face < 40) { c.hp = 0; c.freed = true; c.t = 0; G.freed = (G.freed || 0) + 1; }
  for (const a of G.L.arrows) a.dead = true;
  tone(200, 1200, .35, .07, 'sawtooth'); setTimeout(() => tone(1600, 300, .3, .05, 'triangle'), 120);
  toast(T('⚡ Geistesschlag!', '⚡ Spirit Strike!'));
}
function renPreUpdate(dt) {
  // runs at the start of updateRen; returns true when a film took over this frame
  const L = G.L, p = G.p, k = G.keys;
  if (p.atkT <= 0) p.iaiHit = false;
  if (p.dashCd > 0) p.dashCd -= dt; if (p.dashInv > 0) p.dashInv -= dt; if (G.flash > 0) G.flash -= dt;
  if (!G.ghosts) G.ghosts = [];
  if (p.dashT > 0) { p.dashT -= dt; p.vx = p.face * 900; G.ghosts.push({ x: p.x, y: p.y, face: p.face, life: .22 }); }
  if (p.specialT > 0) { p.specialT -= dt; p.vx = p.face * 1000; G.ghosts.push({ x: p.x, y: p.y, face: p.face, life: .3, gold: 1 }); }
  for (const q of G.ghosts) q.life -= dt; G.ghosts = G.ghosts.filter(q => q.life > 0).slice(-8);
  if ((k.d || k.x) && !p.drawn) { p.drawn = true; tone(1500, 900, .12, .04, 'triangle'); }
  const foeNear = L.enemies.some(e => !e.dead && !e.dormant && e.k !== 'dummy' && Math.abs(e.x - p.x) < 520);
  if (p.drawn && !foeNear && !(p.atkT > 0) && !(k.d || k.x)) { p.calmT = (p.calmT || 0) + dt; if (p.calmT > 4.5) { p.drawn = false; p.calmT = 0; tone(900, 1300, .1, .03, 'triangle'); } } else p.calmT = 0;
  if (L.stream && p.x > L.stream[0] && p.x < L.stream[1] && p.onGround) {
    p.vx *= .9;
    if (Math.abs(p.vx) > 40 && Math.random() < dt * 16) G.particles.push({ x: p.x - p.face * 10 + (Math.random() - .5) * 30, y: GROUND - 6, vx: (Math.random() - .5) * 160, vy: -160 - Math.random() * 170, life: .5, col: 'rgba(215,242,255,.9)', r: 2 + Math.random() * 2.5 });
  } else if (p.onGround && Math.abs(p.vx) > 200 && Math.random() < dt * 8) G.particles.push({ x: p.x - p.face * 14, y: p.y - 4, vx: -p.face * 40, vy: -70, life: .45, col: 'rgba(190,160,120,.45)', r: 3 + Math.random() * 3 });
  G.zoomT = L.enemies.some(e => !e.dead && !e.dormant && e.k !== 'dummy' && Math.abs(e.x - p.x) < 460) ? 1.1 : 1;
  if (L.film) {
    if (!G.flags.path && p.x > 1500) { G.flags.path = 1; }
    if (!G.flags.shrine && p.x > L.shrineX && p.onGround && p.y < GROUND - 100) {
      G.flags.shrine = 1; p.vx = 0;
      playFilm('shrine', () => playFilm('ambush', () => { if (!G) return; for (const e of G.L.enemies) e.dormant = false; G.p.drawn = true; toast(T('Besiege die Späher! (0/3)', 'Defeat the scouts! (0/3)')); }));
      return true;
    }
  }
  return false;
}

/* ---------- HUD: vitality / spirit / minimap ---------- */
function renHud() {
  const vi = $('ba-vit'), sp = $('ba-spi'); if (vi) vi.style.width = (G.hp * 20) + '%'; if (sp) sp.style.width = (G.spirit || 0) + '%';
  const sb = $('ba-special'); if (sb) sb.classList.toggle('ready', (G.spirit || 0) >= 100);
  const c = $('ba-mini'); if (!c) return; G.miniT = (G.miniT || 0) + 1; if (G.miniT % 4) return;
  const g = c.getContext('2d'), R = c.width / 2, p = G.p, sc = R / 900;
  g.clearRect(0, 0, c.width, c.height);
  g.save(); g.beginPath(); g.arc(R, R, R - 2, 0, 7); g.clip();
  const bg = g.createRadialGradient(R, R, 5, R, R, R); bg.addColorStop(0, 'rgba(46,40,32,.88)'); bg.addColorStop(1, 'rgba(8,8,10,.92)'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; for (let r = R * .33; r < R; r += R * .33) { g.beginPath(); g.arc(R, R, r, 0, 7); g.stroke(); }
  for (const e of G.L.enemies) { if (e.dead || e.k === 'dummy') continue; const dx = (e.x - p.x) * sc, dy = (e.y - p.y) * sc * .6; if (Math.hypot(dx, dy) > R - 6) continue; g.fillStyle = e.dormant ? 'rgba(255,90,80,.45)' : '#ff4a3a'; g.beginPath(); g.arc(R + dx, R + dy, 3.4, 0, 7); g.fill(); }
  for (const cg of G.L.cages) if (!cg.freed) { const dx = (cg.x - p.x) * sc; if (Math.abs(dx) < R - 6) { g.fillStyle = '#6ad1ff'; g.fillRect(R + dx - 2.5, R - 2.5, 5, 5); } }
  const gx = (G.L.goal.x - p.x) * sc;
  g.fillStyle = '#ffd24a'; g.beginPath();
  if (Math.abs(gx) < R - 8) g.arc(R + gx, R, 4, 0, 7); else { const d = gx >= 0 ? 1 : -1, ex = R + d * (R - 9); g.moveTo(ex + d * 6, R); g.lineTo(ex - d * 4, R - 5); g.lineTo(ex - d * 4, R + 5); }
  g.fill(); g.restore();
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(R + p.face * 7, R); g.lineTo(R - p.face * 5, R - 5); g.lineTo(R - p.face * 5, R + 5); g.fill();
  g.strokeStyle = '#c9a24a'; g.lineWidth = 2.5; g.beginPath(); g.arc(R, R, R - 2, 0, 7); g.stroke();
}

/* ---------- painted pieces for the Bamboo Path ---------- */
function mapleLeaf(g, x, y, s, col) {
  g.save(); g.translate(x, y); g.fillStyle = col; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .45 : s * (i === 0 ? 1.1 : 1); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fill(); g.fillRect(-.6, 0, 1.2, s * .9); g.restore();
}
function stoneLantern(g, x, y, s) {
  g.fillStyle = '#6f746f'; g.fillRect(x - 5 * s, y - 34 * s, 10 * s, 34 * s); g.fillRect(x - 14 * s, y - 6 * s, 28 * s, 6 * s);
  g.fillStyle = '#7d837d'; g.fillRect(x - 12 * s, y - 52 * s, 24 * s, 18 * s);
  g.fillStyle = 'rgba(255,200,110,.95)'; g.fillRect(x - 6 * s, y - 48 * s, 12 * s, 10 * s); glow(g, x, y - 43 * s, 34 * s, 'rgba(255,190,90,', .45);
  g.fillStyle = '#5d625d'; g.beginPath(); g.moveTo(x - 20 * s, y - 52 * s); g.lineTo(x + 20 * s, y - 52 * s); g.lineTo(x, y - 66 * s); g.fill();
  g.fillStyle = 'rgba(70,110,50,.6)'; g.beginPath(); g.ellipse(x - 8 * s, y - 53 * s, 8 * s, 3 * s, 0, 0, 7); g.fill();
}
function drawSolidKind(g, s, t) {
  if (s.kind === 'biglog') {
    const gr = g.createLinearGradient(0, s.y, 0, s.y + s.h); gr.addColorStop(0, '#7a5a38'); gr.addColorStop(1, '#3e2a18');
    g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(s.x, s.y + 4, s.w, s.h - 4, 28) : g.rect(s.x, s.y + 4, s.w, s.h - 4); g.fill();
    g.strokeStyle = 'rgba(30,18,8,.45)'; g.lineWidth = 2; for (let x = s.x + 20; x < s.x + s.w - 10; x += 22) { g.beginPath(); g.moveTo(x, s.y + 10); g.quadraticCurveTo(x + 6, s.y + s.h / 2, x - 2, s.y + s.h - 6); g.stroke(); }
    g.fillStyle = '#b08858'; g.beginPath(); g.ellipse(s.x + s.w - 4, s.y + s.h / 2 + 2, 14, s.h / 2 - 2, 0, 0, 7); g.fill();
    g.strokeStyle = '#6b4a2a'; g.lineWidth = 1.5; for (let r = 4; r < s.h / 2 - 2; r += 5) { g.beginPath(); g.ellipse(s.x + s.w - 4, s.y + s.h / 2 + 2, Math.min(12, r * .45), r, 0, 0, 7); g.stroke(); }
    g.fillStyle = '#4f7a2e'; for (let x = s.x + 8; x < s.x + s.w - 20; x += 16) { g.beginPath(); g.ellipse(x, s.y + 6, 12, 5, 0, Math.PI, 0); g.fill(); }
    g.fillStyle = '#c0391f'; for (let i = 0; i < 6; i++) mapleLeaf(g, s.x + 20 + i * 38, s.y + 4 + (i % 2) * 3, 4, i % 2 ? '#d9542a' : '#b02a18');
    g.fillStyle = '#5a3a20'; g.save(); g.translate(s.x + 70, s.y + 8); g.rotate(-.7); g.fillRect(0, -3, 34, 6); g.restore();
  } else if (s.kind === 'step' || s.kind === 'plaza') {
    const gr = g.createLinearGradient(0, s.y, 0, GROUND); gr.addColorStop(0, '#8c8f88'); gr.addColorStop(1, '#5a5d58');
    g.fillStyle = gr; g.fillRect(s.x, s.y, s.w, GROUND - s.y + 2);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5;
    for (let y = s.y + 24; y < GROUND; y += 24) { g.beginPath(); g.moveTo(s.x, y); g.lineTo(s.x + s.w, y); g.stroke(); for (let x = s.x + ((y / 24) % 2) * 30; x < s.x + s.w; x += 60) { g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x, y); g.stroke(); } }
    g.fillStyle = '#a9aca4'; g.fillRect(s.x, s.y, s.w, 5);
    g.fillStyle = 'rgba(80,120,50,.7)'; for (let x = s.x + 6; x < s.x + s.w; x += 26) { g.beginPath(); g.ellipse(x, s.y + 2, 9, 3.5, 0, 0, 7); g.fill(); }
    if (s.kind === 'plaza') { g.fillStyle = 'rgba(0,0,0,.12)'; for (let x = s.x + 10; x < s.x + s.w; x += 44) g.fillRect(x, s.y + 1, 1.5, 4); for (let i = 0; i < 14; i++) mapleLeaf(g, s.x + 30 + i * 68, s.y + 2, 3.5, i % 2 ? '#d9542a' : '#a82818'); }
  }
}
function drawBridge(g, pl) {
  g.fillStyle = '#4a3220'; for (let x = pl.x + 20; x < pl.x + pl.w; x += 80) g.fillRect(x, pl.y, 8, GROUND + 60 - pl.y);
  for (let x = pl.x; x < pl.x + pl.w; x += 17) { g.fillStyle = (x / 17) % 2 ? '#8a6440' : '#7a5634'; g.fillRect(x, pl.y, 15, 10); }
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(pl.x, pl.y + 10, pl.w, 3);
  g.fillStyle = '#5a3a24'; g.fillRect(pl.x, pl.y - 42, 7, 42); g.fillRect(pl.x + pl.w - 7, pl.y - 42, 7, 42);
  g.strokeStyle = '#c9b08a'; g.lineWidth = 2; g.beginPath(); g.moveTo(pl.x + 3, pl.y - 38); g.quadraticCurveTo(pl.x + pl.w / 2, pl.y - 18, pl.x + pl.w - 3, pl.y - 38); g.stroke();
}
function drawRenDeco(g, t) {
  const L = G.L; if (!L.deco) return;
  for (const d of L.deco) {
    if (d.x < G.cam - 300 || d.x > G.cam + G.W + 300) continue;
    const y = d.y || GROUND, s = d.s || 1;
    if (d.k === 'house') {
      jhouse(g, d.x - 50 * s, y, s, '#6b5a44', '#2a221e', null);
      if (d.broken) { g.fillStyle = 'rgba(20,14,10,.9)'; g.beginPath(); g.moveTo(d.x + 5 * s, y - 76 * s); g.lineTo(d.x + 30 * s, y - 76 * s); g.lineTo(d.x + 18 * s, y - 56 * s); g.fill(); g.fillStyle = '#4a3624'; g.save(); g.translate(d.x - 40 * s, y - 20 * s); g.rotate(-.5); g.fillRect(0, 0, 50 * s, 5 * s); g.restore(); }
      g.fillStyle = 'rgba(80,110,50,.55)'; g.beginPath(); g.ellipse(d.x, y - 1, 70 * s, 8, 0, Math.PI, 0); g.fill();
    } else if (d.k === 'lantern') stoneLantern(g, d.x, y, 1.1);
    else if (d.k === 'torii') torii(g, d.x, y, s, '#a8302a');
    else if (d.k === 'fence') { g.fillStyle = '#5a4230'; for (let i = 0; i < 6; i++) { g.save(); g.translate(d.x + i * 22, y); g.rotate((i % 3 - 1) * .12); g.fillRect(-3, -48 + (i % 2) * 10, 6, 48 - (i % 2) * 10); g.restore(); } g.fillRect(d.x - 4, y - 36, 110, 4); }
    else if (d.k === 'shrine') { pagoda(g, d.x, y, .95, '#e3d6bf', '#2a1a14', 'rgba(255,200,120,.85)'); g.fillStyle = '#b8322a'; g.fillRect(d.x - 36, y - 18, 72, 5); }
  }
}
function drawRenFront(g, t) {
  const L = G.L; if (!L.stream) return;
  const [a, b] = L.stream; if (b < G.cam - 40 || a > G.cam + G.W + 40) return;
  const wg = g.createLinearGradient(0, GROUND - 16, 0, GROUND + 18); wg.addColorStop(0, 'rgba(120,190,220,.55)'); wg.addColorStop(1, 'rgba(60,120,150,.75)');
  g.fillStyle = wg; g.beginPath(); g.moveTo(a, GROUND + 18); for (let x = a; x <= b; x += 16) g.lineTo(x, GROUND - 12 + Math.sin(x * .05 + t * 3) * 2.5); g.lineTo(b, GROUND + 18); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5; for (let x = a + 20; x < b; x += 46) { g.beginPath(); g.moveTo(x + Math.sin(t * 2 + x) * 6, GROUND - 6); g.lineTo(x + 18 + Math.sin(t * 2 + x) * 6, GROUND - 6); g.stroke(); }
  const p = G.p; if (p.x > a && p.x < b && p.onGround) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, GROUND - 10, 26 + Math.sin(t * 8) * 4, 5, 0, 0, 7); g.stroke(); }
}
function drawClue(g, it, t) {
  g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(it.x, GROUND - 2, 26, 6, 0, 0, 7); g.fill();
  g.strokeStyle = '#4a3a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(it.x - 18, GROUND - 4); g.lineTo(it.x + 14, GROUND - 12); g.moveTo(it.x - 12, GROUND - 12); g.lineTo(it.x + 18, GROUND - 3); g.stroke();
  g.fillStyle = 'rgba(40,30,20,.55)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(it.x + 40 + i * 30, GROUND - 1 - (i % 2) * 3, 6, 2.5, 0, 0, 7); g.fill(); }
  glow(g, it.x, it.y - 30, 34, 'rgba(255,220,120,', .5 + .2 * Math.sin(t * 4));
  g.fillStyle = '#ffe9a0'; g.font = 'bold 26px Georgia'; g.textAlign = 'center'; g.fillText('?', it.x, it.y - 20 + Math.sin(t * 3) * 3);
}
function drawCliffGoal(g, gx, t) {
  const y = GROUND - 150;
  g.fillStyle = '#6b6f68'; g.beginPath(); g.moveTo(gx - 40, y); g.lineTo(gx + 60, y); g.lineTo(gx + 70, y + 40); g.lineTo(gx - 30, y + 30); g.fill();
  g.fillStyle = '#5a3a24'; g.fillRect(gx - 4, y - 70, 6, 70); g.fillStyle = '#e8dcc6'; g.fillRect(gx - 34, y - 72, 60, 22);
  g.fillStyle = '#2a1a14'; g.font = 'bold 13px Georgia'; g.textAlign = 'center'; g.fillText(T('Aussicht', 'Lookout'), gx - 4, y - 56);
  glow(g, gx, y - 30, 90, 'rgba(255,220,150,', .25 + .1 * Math.sin(t * 2));
}
function drawRays(g, t) {
  const W = G.W; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = ((i * 300 + 120 - G.cam * .05) % (W + 500)) - 150, a = .05 + .03 * Math.sin(t * .6 + i);
    const rg = g.createLinearGradient(x, 0, x + 260, H); rg.addColorStop(0, `rgba(255,225,170,${a})`); rg.addColorStop(1, 'rgba(255,225,170,0)');
    g.fillStyle = rg; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x + 320, H); g.lineTo(x + 170, H); g.fill();
  }
  g.restore();
}
function drawMist(g, t) {
  const W = G.W;
  for (let i = 0; i < 4; i++) { const x = ((i * 420 - G.cam * .35 + t * 12) % (W + 600)) - 300; const mg = g.createRadialGradient(x, 430, 10, x, 430, 260); mg.addColorStop(0, 'rgba(255,248,236,.28)'); mg.addColorStop(1, 'rgba(255,248,236,0)'); g.fillStyle = mg; g.fillRect(x - 260, 300, 520, 240); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * .45, W / 2, H / 2, W * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,.32)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
}
function paintAutumnMid(g, R, th) {
  for (let i = 0; i < 40; i++) { const x = R() * TILE, h = 280 + R() * 160, sd = Math.floor(R() * 1e9); wrapDraw(x, 30, xx => bambooStalk(g, xx, 450, h, i % 3 ? th.mid : th.mid2, shade(th.mid, -30), rng(sd))); }
  for (let i = 0; i < 8; i++) { const x = (i / 8) * TILE + R() * 120, s = .9 + R() * .5, sd = Math.floor(R() * 1e9); wrapDraw(x, 130, xx => leafy(g, xx, 452, s, '#9c2a1a', '#d9542a', rng(sd), '#3a2418')); }
}
function paintMapleNear(g, R, th) {
  for (let i = 0; i < 10; i++) { const x = R() * TILE, sd = Math.floor(R() * 1e9), h = 380 + R() * 120; wrapDraw(x, 30, xx => bambooStalk(g, xx, 475, h, '#6d8a3a', '#4a5e26', rng(sd))); }
  for (let i = 0; i < 6; i++) { const x = (i / 6) * TILE + R() * 150, s = 1 + R() * .5, sd = Math.floor(R() * 1e9); wrapDraw(x, 140, xx => leafy(g, xx, 470, s, th.near, th.near2, rng(sd), '#3a2418')); }
  for (let i = 0; i < 40; i++) { const x = R() * TILE; mapleLeaf(g, x, 466 + R() * 6, 3 + R() * 2, ['#b02a18', '#d9542a', '#e8a23a'][i % 3]); }
}


/* v457: Ren-2D entfernt (Ren gibt es nur noch als Ren 3D) */
let photoFade = null;
function drawPhotoFar(g, img) {
  // soft-edged copy so repeated tiles cross-fade instead of showing a seam
  if (!photoFade) { const c = mk(img.naturalWidth, img.naturalHeight), cg = c.getContext('2d'), fw = 140; cg.drawImage(img, 0, 0); cg.globalCompositeOperation = 'destination-in'; const m = cg.createLinearGradient(0, 0, c.width, 0); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(fw / c.width, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,1)'); cg.fillStyle = m; cg.fillRect(0, 0, c.width, c.height); photoFade = { c, fw }; }
  const s = (H - 30) / img.naturalHeight, w = img.naturalWidth * s, step = w - photoFade.fw * s, off = -((G.cam * .08) % step) - step;
  for (let x = off; x < G.W; x += step) g.drawImage(photoFade.c, x, -10, w, H - 30);
  const hz = g.createLinearGradient(0, 250, 0, 470); hz.addColorStop(0, 'rgba(255,236,210,0)'); hz.addColorStop(1, 'rgba(255,236,210,.35)'); g.fillStyle = hz; g.fillRect(0, 250, G.W, 230);
}

/* ================================================================
   LEVEL SELECT + ADVENTURES HUB
   ================================================================ */
function openSelect(hero) {
  if (typeof hero === 'string' && HEROES[hero]) HERO = hero;
  const s = loadSave(), H0 = HEROES[HERO], lv = LV();
  $('ba-sel-title').textContent = T(H0.title[0], H0.title[1]);
  const bi = $('ba-banner-img'); if (bi) bi.src = 'adventure/' + H0.banner;
  const starsSum = Object.values(s.stars).reduce((a, b) => a + b, 0);
  $('ba-sel-sub').textContent = T(`Missionen · ⭐ ${starsSum}/${lv.length * 3} · 🪙 ${s.coins}`, `Missions · ⭐ ${starsSum}/${lv.length * 3} · 🪙 ${s.coins}`);
  $('ba-levels').innerHTML = lv.map((l, i) => {
    const locked = i + 1 > s.unlocked, st = s.stars[i] || 0;
    return `<button class="ba-lvl ${locked ? 'locked' : ''}" ${locked ? 'disabled' : ''} onclick="BennyAdventure.start(${i},'${HERO}')">
      <img src="adventure/${l.thumb}" alt="" loading="lazy"><div class="ba-lvl-cap"><b>Level ${l.id} – ${T(l.name[0], l.name[1])}</b>
      <span class="ba-lvl-stars">${locked ? '🔒' : [0, 1, 2].map(k => k < st ? '★' : '☆').join('')}</span></div></button>`;
  }).join('') + `<div class="ba-lvl more"><img src="adventure/${H0.more}" alt="" loading="lazy"><div class="ba-lvl-cap"><b>Level 6–18 · ${T(H0.moreTxt[0], H0.moreTxt[1])}</b><span class="ba-soon">${T('Bald', 'Soon')}</span></div></div>`;
  showScreen('screen-benny-adv-select');
}
function openAdventures() {
  $('adv-title').textContent = T('Abenteuer', 'Adventures');
  $('adv-sub').textContent = T('Zwei Helden · große Missionen · gemalte Welten', 'Two heroes · big missions · painted worlds');
  ['benny', 'owl'].forEach(h => {
    const b = $('adv-' + h + '-btn'); if (b) b.textContent = T('Spielen', 'Play');
    const m = $('adv-' + h + '-meta'), s = loadSave(h); if (m) m.textContent = T(`${Object.keys(s.stars).length}/${HEROES[h].levels.length} Missionen`, `${Object.keys(s.stars).length}/${HEROES[h].levels.length} missions`);
  });
  document.querySelectorAll('.adv-3d').forEach(el => el.title = T('Alte 3D-Vorschau', 'Old 3D preview'));
  showScreen('screen-adventures');
}

/* ---------------- input ---------------- */
function bindHold(id, key) {
  const b = $(id); if (!b) return;
  b.addEventListener('pointerdown', e => { e.preventDefault(); if (G) G.keys[key] = true; try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add('down'); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { if (G) G.keys[key] = false; b.classList.remove('down'); }));
}
function init() {
  // screens must live inside #app like all other screens (otherwise they slide under the app header)
  const app = $('app'); if (app) ['screen-adventures', 'screen-benny-adv-select', 'screen-benny-adv', 'screen-flagship-select', 'screen-flagship3d'].forEach(id => { const s = $(id); if (s && s.parentElement !== app) app.appendChild(s); });
  bindHold('ba-left', 'l'); bindHold('ba-right', 'r');
  const jb = $('ba-jump'), ab = $('ba-action');
  jb?.addEventListener('pointerdown', e => { e.preventDefault(); jb.classList.add('down'); doJump(true); try { jb.setPointerCapture(e.pointerId); } catch (_) {} });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => jb?.addEventListener(ev, () => { jb.classList.remove('down'); doJump(false); }));
  ab?.addEventListener('pointerdown', e => { e.preventDefault(); ab.classList.add('down'); doAction(true); try { ab.setPointerCapture(e.pointerId); } catch (_) {} });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => ab?.addEventListener(ev, () => { ab.classList.remove('down'); doAction(false); }));
  const xb = $('ba-extra');
  xb?.addEventListener('pointerdown', e => { e.preventDefault(); xb.classList.add('down'); doExtra(true); try { xb.setPointerCapture(e.pointerId); } catch (_) {} });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => xb?.addEventListener(ev, () => { xb.classList.remove('down'); doExtra(false); }));
  const db = $('ba-dash'), sb2 = $('ba-special');
  db?.addEventListener('pointerdown', e => { e.preventDefault(); db.classList.add('down'); doDash(true); });
  sb2?.addEventListener('pointerdown', e => { e.preventDefault(); sb2.classList.add('down'); doSpecial(true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => { db?.addEventListener(ev, () => db.classList.remove('down')); sb2?.addEventListener(ev, () => sb2.classList.remove('down')); });
  $('ba-film-skip')?.addEventListener('click', e => { e.preventDefault(); endFilm(); });
  $('ba-intro-go')?.addEventListener('click', beginPlay);
  $('ba-pause')?.addEventListener('click', () => { if (!G || G.phase !== 'play') return; G.paused = true; $('ba-pause-title').textContent = T('Pause', 'Paused'); $('ba-resume').textContent = T('Weiter', 'Resume'); $('ba-quit').textContent = T('Levelauswahl', 'Level select'); $('ba-pause-ov').classList.add('show'); });
  $('ba-resume')?.addEventListener('click', () => { if (G) { G.paused = false; G.last = 0; } $('ba-pause-ov').classList.remove('show'); });
  $('ba-quit')?.addEventListener('click', () => { stop(); openSelect(); });
  $('ba-res-retry')?.addEventListener('click', () => { if (G) start(G.L.idx); });
  $('ba-res-menu')?.addEventListener('click', () => { stop(); openSelect(); });
  $('ba-res-next')?.addEventListener('click', () => { if (!G) return; const i = G.L.idx; if (i < LV().length - 1) start(i + 1); else { stop(); openSelect(); } });
  $('ba-full')?.addEventListener('click', () => { if (typeof toggleFullscreen === 'function') toggleFullscreen(); });
  const KEYMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
  window.addEventListener('keydown', e => {
    if (!G || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') || e.target?.isContentEditable) return;
    if (!$('screen-benny-adv')?.classList.contains('active')) return;
    if (G.phase === 'film') { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { endFilm(); e.preventDefault(); } return; }
    if (G.phase === 'intro' && (e.key === ' ' || e.key === 'Enter')) { beginPlay(); e.preventDefault(); return; }
    if ((e.key === 'c' || e.key === 'C') && !e.repeat) doDash(true);
    if ((e.key === 'f' || e.key === 'F' || e.key === 'r' || e.key === 'R') && !e.repeat) doSpecial(true);
    const m = KEYMAP[e.key]; if (m) { G.keys[m] = true; e.preventDefault(); }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (!e.repeat) doJump(true); e.preventDefault(); }
    if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'x' || e.key === 'X') && !e.repeat) { doAction(true); e.preventDefault(); }
    if (e.key === 'Shift' || e.key === 'q' || e.key === 'Q' || e.key === 'b' || e.key === 'B') { doExtra(true); e.preventDefault(); }
    if (e.key === 'Escape') $('ba-pause')?.click();
  });
  window.addEventListener('keyup', e => {
    if (!G) return; const m = KEYMAP[e.key]; if (m) G.keys[m] = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') doJump(false);
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'x' || e.key === 'X') doAction(false);
    if (e.key === 'Shift' || e.key === 'q' || e.key === 'Q' || e.key === 'b' || e.key === 'B') doExtra(false);
  });
  window.addEventListener('resize', () => resize());
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.phase === 'film') { try { $('ba-film-v').pause(); } catch (e) {} } if (document.hidden && G && G.phase === 'play' && !G.paused) $('ba-pause')?.click(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

window.BennyAdventure = { openSelect, start, stop, _state: () => G, _levels: LEVELS, _hero: () => HERO };
window.openAdventures = openAdventures;
})();
