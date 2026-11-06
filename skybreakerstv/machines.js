/* Sky Breakers machine builder, shared by the Inventor's Workbench and Trail Run. Needs three.js r128 loaded first. */
window.SBMachines = (function () {
'use strict';
// ================= catalog =================
const COLORS = { cream: '#f3e6c8', brass: '#d4a24a', teal: '#3e93ad', red: '#b4513a', plum: '#7a5296', moss: '#6f8a3e', wood: '#9a6a3c', sky: '#8fc3dc' };
const BODIES = {
  glider:  { label: 'Glider',       s: { lift: 3, speed: 2, weight: 2 } },
  kart:    { label: 'Pedal Kart',   s: { lift: 0, speed: 3, weight: 4 } },
  board:   { label: 'Kiteboard',    s: { lift: 0, speed: 3, weight: 2 } },
  rotor:   { label: 'Rotor Basket', s: { lift: 1, speed: 1, weight: 3 } },
  balloon: { label: 'Balloon',      s: { lift: 6, speed: 0, weight: 3 } },
  bird:    { label: 'Brass Bird',   s: { lift: 2, speed: 2, weight: 3 } }
};
const PILOTS = {
  finn:   { label: 'Finn',   shirt: '#a8402c', hair: '#4a2c1a', style: 'messy', scarf: '#3e6fa8', skin: '#f0c49c' },
  mara:   { label: 'Mara',   shirt: '#d9a63a', hair: '#2e1d14', style: 'braid', scarf: '#5b3d8a', skin: '#d29a68' },
  toby:   { label: 'Toby',   shirt: '#5d6b3a', hair: '#c8562a', style: 'messy', apron: '#8a6a45', skin: '#f2c7a2' },
  yvonne: { label: 'Yvonne', shirt: '#3b4f7e', hair: '#e2c06a', style: 'braids', fur: true, skin: '#f3cba8' },
  lilly:  { label: 'Lilly',  shirt: '#e0b84a', hair: '#3a2618', style: 'pigtails', scarf: '#46619a', skin: '#efc39b' },
  pip:    { label: 'Pip',    shirt: '#6b7a4a', hair: '#1d140e', style: 'curly', skin: '#8a5a3c', fox: true }
};
const PARTS = {
  wings:  { label: 'Wings',     opts: { none: ['None', {}], bat: ['Bat wings', { lift: 3, weight: 1 }], bird: ['Bird wings', { lift: 3, speed: 1, weight: 1 }], canvas: ['Canvas wings', { lift: 4, weight: 2 }] } },
  prop:   { label: 'Propeller', opts: { none: ['None', {}], front: ['Front prop', { lift: 1, speed: 3, weight: 1 }], rotor: ['Spiral rotor', { lift: 4, weight: 2 }], twin: ['Twin props', { lift: 1, speed: 4, weight: 2 }] } },
  wheels: { label: 'Wheels',    opts: { none: ['None', {}], small: ['Small', { speed: 1, weight: 1 }], fat: ['Fat tires', { speed: 2, weight: 2, fun: 1 }] } },
  tail:   { label: 'Tail',      opts: { none: ['None', {}], fin: ['Fin', { lift: 1, speed: 1 }], rudder: ['Rudder', { lift: 1, weight: 1 }], streamers: ['Streamers', { fun: 2 }] } },
  top:    { label: 'On top',    opts: { none: ['None', {}], kite: ['Kite', { lift: 3, weight: 1, fun: 1 }], mini: ['Mini balloon', { lift: 2, fun: 1 }], flag: ['Flag', { fun: 1 }], lantern: ['Lantern', { weight: 1, fun: 2 }] } },
  extra:  { label: 'Extra',     opts: { none: ['None', {}], spring: ['Spring booster', { speed: 2, weight: 1, fun: 1 }], gears: ['Brass gears', { weight: 1, fun: 1 }], bell: ['Bell', { fun: 2 }] } }
};
const DEFAULT = { body: 'glider', pilot: 'yvonne', wings: 'bat', prop: 'none', wheels: 'none', tail: 'fin', top: 'none', extra: 'none', main: 'cream', accent: 'teal', name: '' };

function statsOf(st) {
  const t = { lift: 0, speed: 0, weight: 1, fun: 1 };
  const add = o => Object.entries(o).forEach(([k, v]) => t[k] += v);
  add(BODIES[st.body].s); Object.keys(PARTS).forEach(k => add(PARTS[k].opts[st[k]][1]));
  const fly = t.lift + t.speed * 0.5 - t.weight * 0.7;
  let out = fly >= 8 ? 'soar' : fly >= 3.5 ? 'glide' : fly >= 1.5 ? 'hop' : 'flop';
  if (out === 'flop' && st.wheels !== 'none') out = 'roll';
  if (st.body === 'balloon' && out !== 'flop') out = fly >= 5 ? 'float' : out;
  return { ...t, fly, out };
}

// ================= paper materials =================
const texCache = {}, matCache = {};
function paperTex(hex, o = {}) { const key = hex + JSON.stringify(o); if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = hex; g.fillRect(0, 0, 128, 128);
  const img = g.getImageData(0, 0, 128, 128), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * (o.noise || 22); d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9; } g.putImageData(img, 0, 0);
  if (o.grain) { g.globalAlpha = 0.28; g.strokeStyle = '#3a2210'; for (let y = 0; y < 128; y += 5 + Math.random() * 5) { g.lineWidth = Math.random() + 0.3; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(40, y + 3, 90, y - 3, 128, y + 1); g.stroke(); } }
  if (o.stripes) { g.globalAlpha = 0.9; g.fillStyle = o.stripes; for (let x = 0; x < 128; x += 32) g.fillRect(x, 0, 16, 128); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return texCache[key] = t; }
function pm(hex, o) { const key = hex + JSON.stringify(o || {}); return matCache[key] || (matCache[key] = new THREE.MeshStandardMaterial({ map: paperTex(hex, o), roughness: 0.9, flatShading: true, side: THREE.DoubleSide })); }
const M = { wood: pm('#9a6a3c', { grain: true, noise: 16 }), woodDark: pm('#6b4423', { grain: true }), leather: pm('#7a3b1e'), tire: pm('#3b302a', { noise: 12 }), tire2: pm('#2c231e'),
  brass: new THREE.MeshStandardMaterial({ color: 0xd2a04a, metalness: 0.55, roughness: 0.38, flatShading: true }), brassDark: new THREE.MeshStandardMaterial({ color: 0x9a6c22, metalness: 0.5, roughness: 0.45, flatShading: true }),
  eye: new THREE.MeshBasicMaterial({ color: 0x2a1a10 }), rope: new THREE.LineBasicMaterial({ color: 0x4a3320 }), glow: new THREE.MeshBasicMaterial({ color: 0xffd27a }),
  grass: pm('#7a9e4c', { noise: 20 }), stone: pm('#a8957a', { noise: 30 }), stoneDark: pm('#8a7860', { noise: 30 }), snow: pm('#fbf6ea'), pine: pm('#4f7a43') };
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const Cy = (rt, rb, h, n = 12) => new THREE.CylinderGeometry(rt, rb, h, n);
function solid(g, m) { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; return o; }
function at(g, m, x, y, z) { const o = solid(g, m); o.position.set(x, y, z); return o; }
function line(pts) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), M.rope); }
function tri(pts, m) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); g.computeVertexNormals(); return solid(g, m); }

// ================= pilot =================
function pilot(key) {
  const o = PILOTS[key], f = new THREE.Group(), shirt = pm(o.shirt), hair = pm(o.hair, { noise: 26 }), skin = pm(o.skin, { noise: 6 });
  f.add(at(B(0.44, 0.5, 0.3), shirt, 0, 0.3, 0));
  f.add(at(B(0.16, 0.16, 0.5), pm('#5a4a3a'), -0.12, 0.06, -0.22)); f.add(at(B(0.16, 0.16, 0.5), pm('#5a4a3a'), 0.12, 0.06, -0.22));
  f.add(at(new THREE.SphereGeometry(0.25, 12, 10), skin, 0, 0.8, 0));
  [-0.09, 0.09].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), M.eye); e.position.set(x, 0.83, -0.226); f.add(e); });
  const cap = solid(new THREE.SphereGeometry(0.275, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), hair); cap.position.y = 0.82; cap.rotation.x = 0.38; f.add(cap);
  if (o.style === 'messy') { const t = new THREE.ConeGeometry(0.08, 0.22, 5); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, m = solid(t, hair); m.position.set(Math.cos(a) * 0.2, 0.98, Math.sin(a) * 0.17 + 0.05); m.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); f.add(m); } }
  if (o.style === 'curly') { const b = new THREE.SphereGeometry(0.09, 7, 6); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 0.22 + (i % 2) * 0.04; f.add(at(b, hair, Math.cos(a) * r, 0.92 + Math.sin(i * 2.3) * 0.08, Math.sin(a) * r + 0.04)); } }
  if (o.style === 'braids' || o.style === 'braid') { const bead = new THREE.SphereGeometry(0.075, 8, 6); (o.style === 'braid' ? [1] : [-1, 1]).forEach(sd => { for (let i = 0; i < 5; i++) f.add(at(bead, hair, sd * 0.2, 0.74 - i * 0.11, 0.08 + i * 0.012)); }); f.add(at(B(0.4, 0.34, 0.12), hair, 0, 0.7, 0.17)); }
  if (o.style === 'pigtails') { const p = new THREE.SphereGeometry(0.11, 8, 6); [-1, 1].forEach(sd => f.add(at(p, hair, sd * 0.29, 0.86, 0.05))); }
  if (o.scarf) { const r = new THREE.TorusGeometry(0.17, 0.06, 6, 14); r.rotateX(Math.PI / 2); f.add(at(r, pm(o.scarf), 0, 0.57, 0)); }
  if (o.fur) { const r = new THREE.TorusGeometry(0.21, 0.09, 6, 14); r.rotateX(Math.PI / 2); f.add(at(r, pm('#b7aa98', { noise: 40 }), 0, 0.57, 0)); }
  if (o.apron) f.add(at(B(0.46, 0.46, 0.03), pm(o.apron), 0, 0.27, -0.17));
  [-1, 1].forEach(sd => { const pv = new THREE.Group(); pv.position.set(sd * 0.28, 0.5, 0); pv.add(at(B(0.12, 0.12, 0.5), shirt, 0, 0, -0.22)); pv.add(at(new THREE.SphereGeometry(0.07, 6, 6), skin, 0, 0, -0.48)); pv.rotation.x = 0.5; f.add(pv); });
  if (o.fox) { const fox = new THREE.Group(), fm = pm('#c8622a'); fox.add(at(new THREE.SphereGeometry(0.12, 8, 6), fm, 0, 0, 0)); fox.add(at(new THREE.SphereGeometry(0.09, 8, 6), fm, 0, 0.13, -0.04));
    [-1, 1].forEach(sd => fox.add(at(new THREE.ConeGeometry(0.035, 0.08, 4), fm, sd * 0.05, 0.23, -0.04))); fox.position.set(0.12, 0.35, -0.22); f.add(fox); }
  f.rotation.y = -Math.PI / 2;   // face +x (the machine's forward)
  f.scale.setScalar(0.85); return f;
}

// ================= parts =================
function wheel(r, w, fat) { const outer = new THREE.Group(), spin = new THREE.Group(); outer.add(spin);
  const tg = Cy(r * 0.92, r * 0.92, w, 16); tg.rotateX(Math.PI / 2); spin.add(solid(tg, M.tire));
  if (fat) { const k = B(0.18, 0.15, w * 0.55); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, m = solid(k, M.tire2); m.position.set(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, i % 2 ? w * 0.2 : -w * 0.2); m.rotation.z = a; spin.add(m); } }
  const hub = Cy(r * 0.5, r * 0.5, w + 0.05, 12); hub.rotateX(Math.PI / 2); spin.add(solid(hub, M.brass));
  for (let i = 0; i < 6; i++) { const s = solid(B(r * 0.9, 0.06, w + 0.08), M.woodDark); s.rotation.z = i / 6 * Math.PI; spin.add(s); }
  outer.userData.spin = spin; outer.userData.r = r; return outer; }
function gear(r, th, m = M.brass) { const g = new THREE.Group(); const disc = Cy(r, r, th, 14); disc.rotateX(Math.PI / 2); g.add(solid(disc, m));
  const n = Math.max(8, Math.round(r * 30)); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, t = solid(B(r * 0.28, r * 0.28, th), m); t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); t.rotation.z = a; g.add(t); } return g; }
function wingPair(kind, main, acc, span) {
  const L = new THREE.Group(), R = new THREE.Group();
  const one = () => { const w = new THREE.Group();
    if (kind === 'canvas') { w.add(at(B(0.9, 0.04, span), main, 0, 0, span / 2)); w.add(at(Cy(0.04, 0.04, span, 6).rotateX(Math.PI / 2), M.wood, 0.42, 0.03, span / 2));
      for (let i = 0; i <= 4; i++) w.add(at(B(0.92, 0.06, 0.05), acc, 0, 0.03, i / 4 * span)); }
    if (kind === 'bat') { const tip = [[0, 0, 0]]; for (let i = 0; i <= 5; i++) { const z = i / 5 * span; tip.push([0.25 * Math.sin(i / 5 * Math.PI) + 0.1, 0.15 * Math.sin(i / 5 * Math.PI), z]); }
      w.add(line(tip.slice(1))); for (let i = 1; i <= 5; i++) { const p = tip[i + 1] || tip[i], back = [p[0] - 0.9 + Math.abs(i - 3) * 0.12, p[1] - 0.04, p[2]];
        w.add(line([p, back])); const q = tip[i]; w.add(tri([q, p, back], i % 2 ? main : acc)); w.add(tri([q, back, [q[0] - 0.85 + Math.abs(i - 3) * 0.12, q[1] - 0.04, q[2]]], i % 2 ? main : acc)); }
      w.add(at(Cy(0.04, 0.04, span, 6).rotateX(Math.PI / 2), M.woodDark, 0.1, 0.05, span / 2)); }
    if (kind === 'bird') { for (let i = 0; i < 6; i++) { const len = 0.9 - Math.abs(i - 2) * 0.08, f = at(B(len, 0.04, span / 6 * 1.15), i % 2 ? main : acc, -len / 2 + 0.35 + i * 0.02, 0, (i + 0.5) / 6 * span); f.rotation.y = -0.08 * i; w.add(f); }
      w.add(at(Cy(0.05, 0.05, span, 6).rotateX(Math.PI / 2), M.brass, 0.35, 0.03, span / 2)); }
    return w; };
  L.add(one()); const r = one(); r.scale.z = -1; R.add(r); return { L, R };
}
function prop(blades, r, acc) { const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  spin.add(solid(Cy(0.09, 0.09, 0.2, 10).rotateZ(Math.PI / 2), M.brass));
  for (let i = 0; i < blades; i++) { const b = solid(B(0.04, r, 0.16), i % 2 ? acc : M.wood); b.position.y = r / 2; const p = new THREE.Group(); p.add(b); p.rotation.x = i / blades * Math.PI * 2; b.rotation.y = 0.35; spin.add(p); }
  g.userData.spin = spin; g.userData.axis = 'x'; return g; }
function spiralRotor(main, acc) { const g = new THREE.Group(), spin = new THREE.Group(); g.add(spin);
  spin.add(at(Cy(0.05, 0.05, 1.5, 8), M.woodDark, 0, 0.75, 0));
  const pos = [], N = 60; for (let i = 0; i <= N; i++) { const s = i / N, a = s * Math.PI * 2.4, r = 1.1 * (1 - 0.55 * s), y = 0.35 + 1.0 * s;
    pos.push([0.06 * Math.cos(a), y, 0.06 * Math.sin(a)], [r * Math.cos(a), y, r * Math.sin(a)]); }
  const verts = []; for (let i = 0; i < N; i++) { const a = pos[i * 2], b = pos[i * 2 + 1], c = pos[i * 2 + 2], d = pos[i * 2 + 3]; verts.push(a, b, c, b, d, c); }
  spin.add(tri(verts, main)); const rim = []; for (let i = 0; i <= N; i++) rim.push(pos[i * 2 + 1]); spin.add(line(rim));
  g.userData.spin = spin; g.userData.axis = 'y'; return g; }
function kite(main, acc) { const k = new THREE.Group(), R = 1.4, a0 = -1.1, a1 = 1.1, N = 7;
  for (let i = 0; i < N; i++) { const a = a0 + (i + 0.5) / N * (a1 - a0), w = (a1 - a0) / N * R * 1.03, c = new THREE.Group(); c.add(solid(B(0.6, 0.06, w), i % 2 ? acc : main));
    c.position.set(0, R * Math.cos(a) - R, R * Math.sin(a)); c.rotation.x = a; k.add(c); }
  return k; }

// ================= bodies =================
// every body returns mounts in its own space; forward is +x, up is +y, wings go out along z
function buildBody(kind, main, acc, st) {
  const g = new THREE.Group(); let m;
  if (kind === 'kart') {
    [-0.65, 0.65].forEach(z => g.add(at(B(2.5, 0.16, 0.14), M.woodDark, 0, 0.72, z)));
    [-1.0, -0.3, 0.4, 1.05].forEach(x => g.add(at(B(0.18, 0.1, 1.5), M.wood, x, 0.72, 0)));
    g.add(at(B(1.7, 0.06, 1.2), main, -0.05, 0.8, 0)); g.add(at(B(0.5, 0.35, 1.1), acc, 1.0, 0.95, 0));
    g.add(at(B(0.6, 0.14, 0.62), M.leather, -0.35, 0.95, 0)); const back = at(B(0.14, 0.75, 0.62), M.leather, -0.68, 1.3, 0); back.rotation.z = -0.2; g.add(back);
    m = { seat: [-0.3, 1.02, 0], wing: [0, 0.95, 0.6], top: [-1.15, 0.8, 0], front: [1.3, 0.9, 0], tail: [-1.3, 0.85, 0], wheels: [[0.85, 0.5, 0.82], [0.85, 0.5, -0.82], [-0.85, 0.5, 0.82], [-0.85, 0.5, -0.82]], ground: 0.5, span: 2.2 };
  }
  if (kind === 'board') {
    const deck = Cy(1, 1, 0.1, 28); deck.scale(1.3, 1, 0.42); g.add(at(deck, main, 0, 0.55, 0)); const rim = Cy(1, 1, 0.06, 28); rim.scale(1.33, 1, 0.45); g.add(at(rim, acc, 0, 0.5, 0));
    [-0.4, 0.4].forEach(x => { const s = new THREE.TorusGeometry(0.15, 0.04, 6, 12, Math.PI); s.rotateY(Math.PI / 2); g.add(at(s, M.leather, x, 0.6, 0)); });
    [-0.8, 0.8].forEach(x => g.add(at(B(0.18, 0.08, 0.95), M.brass, x, 0.4, 0)));
    m = { seat: [0, 0.6, 0], stand: true, wing: [0, 1.2, 0.3], top: [0, 1.7, 0], front: [1.35, 0.6, 0], tail: [-1.35, 0.6, 0], wheels: [[0.8, 0.3, 0.5], [0.8, 0.3, -0.5], [-0.8, 0.3, 0.5], [-0.8, 0.3, -0.5]], ground: 0.3, span: 2.0 };
  }
  if (kind === 'glider') {
    const hull = Cy(0.42, 0.25, 2.6, 12); hull.rotateZ(Math.PI / 2); hull.scale(1, 0.8, 1); g.add(at(hull, main, 0, 0.9, 0));
    const nose = new THREE.ConeGeometry(0.42, 0.6, 12); nose.rotateZ(-Math.PI / 2); nose.scale(1, 0.8, 1); g.add(at(nose, acc, 1.6, 0.9, 0));
    g.add(at(B(0.9, 0.12, 0.62), M.leather, -0.05, 1.15, 0)); for (let i = 0; i < 4; i++) g.add(at(Cy(0.44, 0.44, 0.06, 12).rotateZ(Math.PI / 2), M.wood, -0.9 + i * 0.6, 0.9, 0));
    m = { seat: [-0.05, 1.18, 0], wing: [0.1, 1.15, 0.35], top: [-0.6, 1.3, 0], front: [1.9, 0.9, 0], tail: [-1.3, 0.95, 0], wheels: [[0.6, 0.3, 0.45], [0.6, 0.3, -0.45], [-0.8, 0.3, 0.4], [-0.8, 0.3, -0.4]], ground: 0.3, span: 2.4 };
  }
  if (kind === 'rotor') {
    const b = Cy(0.85, 0.7, 0.65, 14, 1); g.add(at(Cy(0.85, 0.7, 0.65, 14), main, 0, 0.75, 0)); g.add(at(new THREE.TorusGeometry(0.85, 0.06, 6, 20).rotateX(Math.PI / 2), acc, 0, 1.08, 0));
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(at(B(0.08, 0.7, 0.08), M.woodDark, Math.cos(a) * 0.8, 0.75, Math.sin(a) * 0.8)); }
    m = { seat: [0, 0.8, 0], wing: [0, 1.0, 0.75], top: [0, 1.1, 0], front: [0.95, 0.85, 0], tail: [-0.95, 0.85, 0], wheels: [[0.5, 0.3, 0.5], [0.5, 0.3, -0.5], [-0.5, 0.3, 0.5], [-0.5, 0.3, -0.5]], ground: 0.3, span: 2.0, topIsMast: true };
  }
  if (kind === 'balloon') {
    g.add(at(B(1.0, 0.6, 1.0), M.wood, 0, 0.6, 0)); g.add(at(B(1.05, 0.08, 1.05), acc, 0, 0.92, 0));
    const env = new THREE.SphereGeometry(1.35, 14, 12); env.scale(1, 1.15, 1); g.add(at(env, pm(COLORS[st.main], { stripes: COLORS[st.accent] }), 0, 3.4, 0));
    [[0.45, 0.45], [0.45, -0.45], [-0.45, 0.45], [-0.45, -0.45]].forEach(([x, z]) => g.add(line([[x, 0.92, z], [x * 2.2, 2.4, z * 2.2]])));
    m = { seat: [0, 0.6, 0], wing: [0, 1.0, 0.5], top: [0, 4.95, 0], front: [0.55, 0.7, 0], tail: [-0.55, 0.75, 0], wheels: [[0.42, 0.25, 0.42], [0.42, 0.25, -0.42], [-0.42, 0.25, 0.42], [-0.42, 0.25, -0.42]], ground: 0.25, span: 1.8 };
  }
  if (kind === 'bird') {
    const body = new THREE.SphereGeometry(0.75, 14, 10); body.scale(1.5, 0.85, 0.8); g.add(at(body, M.brass, 0, 1.0, 0));
    g.add(at(new THREE.SphereGeometry(0.42, 12, 10), M.brass, 1.15, 1.45, 0)); const beak = new THREE.ConeGeometry(0.12, 0.45, 8); beak.rotateZ(-Math.PI / 2); g.add(at(beak, acc, 1.65, 1.42, 0));
    [-1, 1].forEach(sd => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), pm('#2f6fb0')); e.position.set(1.42, 1.55, sd * 0.25); g.add(e); });
    g.add(at(B(0.7, 0.1, 0.6), main, -0.1, 1.62, 0)); const key = gear(0.25, 0.06); key.position.set(-0.6, 1.65, 0); g.add(key);
    [-0.25, 0.25].forEach(z => g.add(at(Cy(0.05, 0.05, 0.6, 6), M.brassDark, 0.1, 0.35, z)));
    m = { seat: [-0.1, 1.67, 0], wing: [0, 1.15, 0.5], top: [-0.45, 1.8, 0], front: [1.9, 1.4, 0], tail: [-1.15, 1.05, 0], wheels: [[0.5, 0.25, 0.4], [0.5, 0.25, -0.4], [-0.5, 0.25, 0.4], [-0.5, 0.25, -0.4]], ground: 0.25, span: 2.2, legs: true };
  }
  return { g, m };
}

// ================= assemble a machine =================
function buildMachine(st) {
  const main = pm(COLORS[st.main]), acc = pm(COLORS[st.accent]);
  const root = new THREE.Group(), { g, m } = buildBody(st.body, main, acc, st); root.add(g);
  const anim = { spins: [], wings: null, wheels: [], streamers: [] };
  const p = pilot(st.pilot); p.position.set(...m.seat); if (m.stand) { p.scale.setScalar(1.0); p.position.y += 0.35; } root.add(p);
  if (st.wings !== 'none') { const w = wingPair(st.wings, main, acc, m.span); w.L.position.set(m.wing[0], m.wing[1], m.wing[2]); w.R.position.set(m.wing[0], m.wing[1], -m.wing[2]); root.add(w.L, w.R); anim.wings = w; }
  if (st.prop === 'front') { const pr = prop(3, 0.75, acc); pr.position.set(...m.front); root.add(pr); anim.spins.push(pr); }
  if (st.prop === 'twin') { [-1, 1].forEach(sd => { const pr = prop(2, 0.55, acc); pr.position.set(m.wing[0] + 0.5, m.wing[1], sd * (m.wing[2] + m.span * 0.55)); root.add(pr); anim.spins.push(pr); root.add(at(B(0.6, 0.06, 0.06), M.brass, m.wing[0] + 0.2, m.wing[1], sd * (m.wing[2] + m.span * 0.55))); }); }
  if (st.prop === 'rotor') { const r = spiralRotor(main, acc); const base = m.topIsMast ? m.top : [m.seat[0] - 0.5, m.seat[1] + 0.3, 0];
    if (!m.topIsMast) root.add(at(Cy(0.05, 0.05, 1.2, 6), M.woodDark, base[0], base[1] + 0.6, 0));
    r.position.set(base[0], base[1] + (m.topIsMast ? 0 : 1.0), 0); root.add(r); anim.spins.push(r); }
  if (st.wheels !== 'none') { const fat = st.wheels === 'fat', r = fat ? 0.42 : 0.28; m.wheels.forEach(([x, y, z]) => { const w = wheel(r, fat ? 0.34 : 0.14, fat); w.position.set(x, Math.max(r, y), z); root.add(w); anim.wheels.push(w); }); }
  else if (st.body === 'kart' || st.body === 'board') { m.wheels.forEach(([x, y, z]) => root.add(at(B(0.3, 0.3, 0.12), M.woodDark, x, y - 0.15, z))); }   // skids
  if (st.tail === 'fin') { root.add(tri([[m.tail[0], m.tail[1], 0], [m.tail[0] - 0.8, m.tail[1], 0], [m.tail[0] - 0.75, m.tail[1] + 0.8, 0]], acc)); root.add(at(B(0.6, 0.04, 1.1), acc, m.tail[0] - 0.45, m.tail[1], 0)); }
  if (st.tail === 'rudder') { root.add(at(B(0.7, 0.9, 0.05), main, m.tail[0] - 0.4, m.tail[1] + 0.35, 0)); root.add(at(B(0.06, 1.0, 0.07), M.woodDark, m.tail[0] - 0.05, m.tail[1] + 0.35, 0)); }
  if (st.tail === 'streamers') { [-0.25, 0, 0.25].forEach((z, i) => { const s = new THREE.Group(); s.position.set(m.tail[0], m.tail[1] + 0.1, z); const rib = at(B(1.3, 0.03, 0.12), [acc, main, M.leather][i], -0.65, 0, 0); s.add(rib); root.add(s); anim.streamers.push(s); }); }
  const topBase = st.prop === 'rotor' && !m.topIsMast ? [m.top[0] - 0.3, m.top[1], 0] : m.top;
  if (st.top !== 'none') {
    const t = new THREE.Group(); t.position.set(...topBase); root.add(t);
    if (st.top === 'flag') { t.add(at(Cy(0.03, 0.03, 1.4, 6), M.woodDark, 0, 0.7, 0)); t.add(tri([[0, 1.4, 0], [0, 1.05, 0], [-0.6, 1.22, 0]], acc)); }
    if (st.top === 'lantern') { t.add(at(Cy(0.03, 0.03, 0.8, 6), M.woodDark, 0, 0.4, 0)); t.add(at(B(0.3, 0.38, 0.3), M.brass, 0, 0.95, 0)); t.add(at(B(0.22, 0.28, 0.32), M.glow, 0, 0.95, 0)); }
    if (st.top === 'mini') { t.add(at(new THREE.SphereGeometry(0.55, 12, 10), pm(COLORS[st.accent], { stripes: COLORS[st.main] }), 0, 1.6, 0)); t.add(line([[0, 0, 0], [0, 1.05, 0]])); }
    if (st.top === 'kite') { const k = kite(main, acc); k.position.set(-1.6, 3.2, 0); k.rotation.z = 0.5; t.add(k); [-1.2, 1.2].forEach(z => t.add(line([[0, 0, 0], [-1.6, 3.2 - 0.25, z]]))); anim.kite = k; }
  }
  if (st.extra === 'spring') { for (let i = 0; i < 5; i++) { const c = new THREE.TorusGeometry(0.16, 0.035, 5, 12); c.rotateY(Math.PI / 2); root.add(at(c, M.brass, m.tail[0] - 0.05 - i * 0.1, m.tail[1] - 0.15, 0)); } }
  if (st.extra === 'gears') { [-1, 1].forEach(sd => { const gr = gear(0.28, 0.06); gr.position.set(m.seat[0] + 0.25, m.seat[1] - 0.15, sd * (st.body === 'balloon' ? 0.53 : st.body === 'rotor' ? 0.88 : st.body === 'glider' ? 0.38 : 0.7)); root.add(gr); anim.spins.push(Object.assign(gr, { userData: { spin: gr, axis: 'z' } })); }); }
  if (st.extra === 'bell') { const b = new THREE.ConeGeometry(0.16, 0.24, 10, 1, true); root.add(at(b, M.brass, m.front[0] - 0.2, m.front[1] + 0.35, 0.2)); }
  // sit the machine on the ground (y = 0 at its lowest point)
  const box = new THREE.Box3().setFromObject(root); root.position.y = -box.min.y; const wrap = new THREE.Group(); wrap.add(root);
  wrap.userData = { anim, size: box.getSize(new THREE.Vector3()), height: box.max.y - box.min.y };
  return wrap;
}

return { COLORS, BODIES, PILOTS, PARTS, DEFAULT, statsOf, buildMachine, pm, M, B, Cy, solid, at, line, gear, wheel };
})();
