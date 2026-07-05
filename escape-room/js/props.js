/* props.js — procedural three.js mesh builders. Every prop is composed from
 * primitives + CanvasTextures; no external models or texture files.
 *
 * Counting puzzles rely on decor being rendered faithfully: a bookshelf with
 * decor.books [{color:'red', n:4}] renders exactly 4 red books (fillers use
 * browns/greys, never the puzzle colours), the clock draws its decor.time,
 * paintings draw exactly decor.shapes.n shapes. No text is ever drawn into a
 * texture, so nothing in 3D needs re-rendering when the language changes. */

import * as THREE from 'three';
import { makeRng, rInt, rPick } from './rng.js';
import { PROP_DEFS, COLOR_HEX, SYMBOLS } from './themes.js';

const FILLERS = ['#7a5c3e', '#5f4a33', '#6d6d7d', '#4a4a4a', '#8a8f98', '#9a8a6e'];

const mat = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });

function box(w, h, d, color, x = 0, y = 0, z = 0, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  return m;
}

function cyl(rt, rb, h, color, x = 0, y = 0, z = 0, seg = 14, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color, opts));
  m.position.set(x, y, z);
  return m;
}

function sph(r, color, x = 0, y = 0, z = 0, seg = 12) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat(color));
  m.position.set(x, y, z);
  return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function texPlane(w, h, tex, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshLambertMaterial({ map: tex })
  );
  m.position.set(x, y, z);
  return m;
}

const hex = (name) => COLOR_HEX[name] || name || '#8a8f98';

// ---------------------------------------------------------------- room shell

export function buildRoomShell(room) {
  const { w, d, h, wall, floor, ceil } = room.room;
  const g = new THREE.Group();
  const plane = (pw, ph, color, px, py, pz, rx, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat(color));
    m.position.set(px, py, pz);
    m.rotation.set(rx || 0, ry || 0, 0);
    g.add(m);
    return m;
  };
  plane(w, d, floor, 0, 0, 0, -Math.PI / 2, 0);
  plane(w, d, ceil, 0, h, 0, Math.PI / 2, 0);
  plane(w, h, wall, 0, h / 2, -d / 2, 0, 0);            // north
  plane(w, h, wall, 0, h / 2, d / 2, 0, Math.PI);       // south
  plane(d, h, wall, w / 2, h / 2, 0, 0, -Math.PI / 2);  // east
  plane(d, h, wall, -w / 2, h / 2, 0, 0, Math.PI / 2);  // west
  // skirting boards
  const skirt = new THREE.Color(wall).multiplyScalar(0.6).getStyle();
  g.add(box(w, 0.09, 0.03, skirt, 0, 0.045, -d / 2 + 0.015));
  g.add(box(w, 0.09, 0.03, skirt, 0, 0.045, d / 2 - 0.015));
  g.add(box(0.03, 0.09, d, skirt, w / 2 - 0.015, 0.045, 0));
  g.add(box(0.03, 0.09, d, skirt, -w / 2 + 0.015, 0.045, 0));
  // ceiling light fixture
  g.add(cyl(0.16, 0.16, 0.04, '#d9d4c8', 0, h - 0.02, 0));
  const bulb = cyl(0.11, 0.11, 0.03, '#fff6d8', 0, h - 0.05, 0);
  bulb.material.emissive = new THREE.Color('#fff2c0');
  bulb.material.emissiveIntensity = 0.9;
  g.add(bulb);
  return g;
}

// ---------------------------------------------------------------- lock badges

function lockBadge(lock) {
  const g = new THREE.Group();
  if (lock.type === 'key') {
    const body = box(0.09, 0.11, 0.035, '#c8a24a', 0, 0, 0);
    const shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.011, 8, 14, Math.PI),
      mat('#9a9a9a'));
    shackle.position.set(0, 0.055, 0);
    g.add(body, shackle);
  } else if (lock.type === 'code4') {
    const tex = canvasTex(64, 96, (ctx) => {
      ctx.fillStyle = '#3a424e'; ctx.fillRect(0, 0, 64, 96);
      ctx.fillStyle = '#9aa4b2';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) ctx.fillRect(8 + c * 18, 22 + r * 18, 12, 12);
      ctx.fillStyle = '#a8e6a8'; ctx.fillRect(8, 6, 48, 10);
    });
    g.add(texPlane(0.11, 0.16, tex, 0, 0, 0.014));
    g.add(box(0.13, 0.18, 0.02, '#242a33', 0, 0, -0.008));
  } else if (lock.type === 'colorSeq') {
    g.add(box(0.2, 0.07, 0.02, '#20242c', 0, 0, -0.005));
    ['#c0392b', '#2e6da4', '#3d8b4f', '#d4a017'].forEach((c, i) => {
      g.add(cyl(0.016, 0.016, 0.02, c, -0.066 + i * 0.044, 0, 0.006).rotateX(Math.PI / 2));
    });
  } else if (lock.type === 'riddle') {
    const tex = canvasTex(72, 72, (ctx) => {
      ctx.fillStyle = '#4a3d2a'; ctx.fillRect(0, 0, 72, 72);
      ctx.strokeStyle = '#c8b48a'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, 64, 64);
      ctx.fillStyle = '#e8d9b0';
      ctx.font = 'bold 44px serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', 36, 40);
    });
    g.add(texPlane(0.13, 0.13, tex, 0, 0, 0.014));
    g.add(box(0.15, 0.15, 0.02, '#33291c', 0, 0, -0.008));
  } else { // symbol3
    g.add(box(0.2, 0.09, 0.02, '#2a2620', 0, 0, -0.005));
    for (let i = 0; i < 3; i++) {
      g.add(cyl(0.026, 0.026, 0.022, '#c8b48a', -0.06 + i * 0.06, 0, 0.004).rotateX(Math.PI / 2));
    }
  }
  g.userData.lockId = lock.id;
  return g;
}

function symbolDecal(symbol, size = 0.16) {
  const tex = canvasTex(96, 96, (ctx) => {
    ctx.clearRect(0, 0, 96, 96);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath(); ctx.arc(48, 48, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#33261a';
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 48, 52);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshLambertMaterial({ map: tex, transparent: true })
  );
  return m;
}

// ---------------------------------------------------------------- builders

const B = {
  door(p) {
    const g = new THREE.Group();
    g.add(box(1.16, 2.2, 0.08, '#4a382a', 0, 1.1, 0));
    // panel pivots at its hinge so the scene can swing it open
    const pivot = new THREE.Group();
    pivot.position.set(-0.5, 0, 0.05);
    const panel = box(0.98, 2.06, 0.06, '#6e4f33', 0.49, 1.06, 0);
    panel.add(box(0.7, 0.8, 0.015, '#7d5c3c', 0, 0.5, 0.035));
    panel.add(box(0.7, 0.7, 0.015, '#7d5c3c', 0, -0.45, 0.035));
    const knob = sph(0.045, '#c8a24a', 0.4, 0, 0.05);
    panel.add(knob);
    pivot.add(panel);
    g.add(pivot);
    g.userData.doorPivot = pivot;
    // warm glow revealed when the panel opens
    const glow = box(0.94, 2.0, 0.01, '#fff2cc', 0, 1.06, -0.02);
    glow.material.emissive = new THREE.Color('#ffe9b0');
    glow.material.emissiveIntensity = 0.85;
    g.add(glow);
    return g;
  },

  painting(p) {
    const g = new THREE.Group();
    g.add(box(0.94, 0.74, 0.045, '#3d3225', 0, 0, 0));
    const shapes = p.decor.shapes;
    const rng = makeRng('paint:' + p.id);
    const tex = canvasTex(256, 200, (ctx, w, h) => {
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, '#cfd8de'); grd.addColorStop(1, '#8fa3ad');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#5d6f66';
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h - 30 - Math.sin(x / 40) * 18);
      ctx.lineTo(w, h); ctx.fill();
      if (shapes) {
        ctx.fillStyle = hex(shapes.color);
        for (let i = 0; i < shapes.n; i++) {
          const x = 24 + rng() * (w - 48), y = 24 + rng() * (h - 80), s = 11 + rng() * 5;
          drawShape(ctx, shapes.shape || 'star', x, y, s);
        }
      }
    });
    g.add(texPlane(0.84, 0.64, tex, 0, 0, 0.026));
    return g;
  },

  clock(p) {
    const g = new THREE.Group();
    const rim = cyl(0.2, 0.2, 0.05, '#4a382a');
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    const { h: hh, m: mm } = p.decor.time || { h: 7, m: 25 };
    const tex = canvasTex(160, 160, (ctx) => {
      ctx.fillStyle = '#f4efe4'; ctx.beginPath(); ctx.arc(80, 80, 76, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#33261a'; ctx.fillStyle = '#33261a';
      ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.fillText(String(i), 80 + Math.cos(a) * 60, 80 + Math.sin(a) * 60);
      }
      const hand = (angle, len, width) => {
        ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(80, 80);
        ctx.lineTo(80 + Math.cos(angle) * len, 80 + Math.sin(angle) * len); ctx.stroke();
      };
      hand(((hh % 12) / 12 + mm / 60 / 12) * Math.PI * 2 - Math.PI / 2, 34, 6);
      hand((mm / 60) * Math.PI * 2 - Math.PI / 2, 52, 3.5);
      ctx.beginPath(); ctx.arc(80, 80, 5, 0, Math.PI * 2); ctx.fill();
    });
    g.add(texPlane(0.36, 0.36, tex, 0, 0, 0.028));
    return g;
  },

  poster(p) {
    const g = new THREE.Group();
    const rng = makeRng('poster:' + p.id);
    const c1 = hex(p.accent);
    const tex = canvasTex(160, 224, (ctx, w, h) => {
      ctx.fillStyle = '#efe9dc'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(w / 2, h * 0.36, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3b3b3b';
      for (let i = 0; i < 3; i++) ctx.fillRect(24, h * 0.66 + i * 18, w - 48 - rng() * 40, 8);
    });
    g.add(texPlane(0.6, 0.86, tex, 0, 0, 0.012));
    return g;
  },

  mirror() {
    const g = new THREE.Group();
    g.add(box(0.58, 0.88, 0.04, '#7a6a4a'));
    const glass = box(0.48, 0.78, 0.012, '#bcd2dd', 0, 0, 0.024);
    glass.material.emissive = new THREE.Color('#31414a');
    glass.material.emissiveIntensity = 0.4;
    g.add(glass);
    return g;
  },

  wallshelf(p) {
    const g = new THREE.Group();
    g.add(box(1.0, 0.045, 0.24, '#5f4a33', 0, 0, 0));
    g.add(box(0.03, 0.16, 0.2, '#4a382a', -0.42, -0.1, 0));
    g.add(box(0.03, 0.16, 0.2, '#4a382a', 0.42, -0.1, 0));
    const jars = p.decor.jars;
    if (jars) {
      const rng = makeRng('jars:' + p.id);
      for (let i = 0; i < jars.n; i++) {
        const x = -0.42 + ((i + 0.5) / jars.n) * 0.84 + (rng() - 0.5) * 0.02;
        g.add(cyl(0.045, 0.05, 0.13, hex(jars.color), x, 0.09, 0));
      }
    }
    return g;
  },

  vent() {
    const g = new THREE.Group();
    g.add(box(0.46, 0.33, 0.03, '#9aa0a8'));
    for (let i = 0; i < 4; i++) g.add(box(0.38, 0.03, 0.012, '#6d737b', 0, -0.1 + i * 0.066, 0.018));
    return g;
  },

  desk(p) {
    const g = new THREE.Group();
    const c = '#5f4a33';
    g.add(box(1.3, 0.05, 0.65, '#6e5a41', 0, 0.735, 0));
    [[-0.6, -0.27], [0.6, -0.27], [-0.6, 0.27], [0.6, 0.27]].forEach(([x, z]) =>
      g.add(box(0.06, 0.71, 0.06, c, x, 0.355, z)));
    // drawer block (the lockable part)
    g.add(box(0.5, 0.24, 0.55, c, 0.35, 0.58, 0));
    g.add(box(0.44, 0.16, 0.02, '#7d5c3c', 0.35, 0.58, 0.29));
    g.add(sph(0.02, '#c8a24a', 0.35, 0.58, 0.31));
    return g;
  },

  bookshelf(p) {
    const g = new THREE.Group();
    const c = '#5a4632';
    g.add(box(0.05, 1.85, 0.35, c, -0.5, 0.925, 0));
    g.add(box(0.05, 1.85, 0.35, c, 0.5, 0.925, 0));
    g.add(box(1.05, 0.05, 0.35, c, 0, 1.85, 0));
    g.add(box(1.0, 1.8, 0.03, '#3d3225', 0, 0.925, -0.16));
    const shelfY = [0.06, 0.62, 1.18];
    shelfY.forEach((y) => g.add(box(0.95, 0.04, 0.33, c, 0, y, 0)));
    // books: exact counts for puzzle colours, fillers in non-puzzle tones
    const rng = makeRng('books:' + p.id);
    const books = [];
    (p.decor.books || []).forEach((grp) => {
      for (let i = 0; i < grp.n; i++) books.push(hex(grp.color));
    });
    const fillers = rInt(rng, 8, 14);
    for (let i = 0; i < fillers; i++) books.push(rPick(rng, FILLERS));
    // deterministic shuffle across shelves
    for (let i = books.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1)); [books[i], books[j]] = [books[j], books[i]];
    }
    const perShelf = Math.ceil(books.length / shelfY.length);
    books.forEach((color, i) => {
      const s = Math.floor(i / perShelf);
      const k = i % perShelf;
      const bw = 0.055, gap = 0.012;
      const x = -0.44 + k * (bw + gap);
      if (x > 0.44 || s >= shelfY.length) return;
      const bh = 0.3 + rng() * 0.12;
      g.add(box(bw, bh, 0.24, color, x, shelfY[s] + 0.02 + bh / 2, 0.02));
    });
    return g;
  },

  cabinet(p) {
    const g = new THREE.Group();
    g.add(box(0.85, 1.2, 0.48, '#6e5a41', 0, 0.6, 0));
    g.add(box(0.38, 1.08, 0.02, '#7d5c3c', -0.21, 0.6, 0.245));
    g.add(box(0.38, 1.08, 0.02, '#7d5c3c', 0.21, 0.6, 0.245));
    g.add(sph(0.02, '#c8a24a', -0.05, 0.6, 0.265));
    g.add(sph(0.02, '#c8a24a', 0.05, 0.6, 0.265));
    return g;
  },

  safe(p) {
    const g = new THREE.Group();
    g.add(box(0.62, 0.75, 0.6, '#3c424c', 0, 0.375, 0));
    g.add(box(0.5, 0.62, 0.02, '#4a515c', 0, 0.38, 0.305));
    const dial = cyl(0.07, 0.07, 0.05, '#c8ccd4', -0.12, 0.42, 0.33);
    dial.rotation.x = Math.PI / 2;
    g.add(dial);
    g.add(box(0.12, 0.03, 0.03, '#c8ccd4', 0.14, 0.42, 0.325));
    return g;
  },

  chest(p) {
    const g = new THREE.Group();
    g.add(box(0.95, 0.42, 0.55, '#6e4f33', 0, 0.21, 0));
    g.add(box(0.95, 0.16, 0.55, '#7d5c3c', 0, 0.5, 0));
    [-0.3, 0.3].forEach((x) => {
      g.add(box(0.05, 0.6, 0.57, '#3c424c', x, 0.29, 0));
    });
    return g;
  },

  bed(p) {
    const g = new THREE.Group();
    g.add(box(2.0, 0.28, 1.05, '#5f4a33', 0, 0.24, 0));
    g.add(box(1.94, 0.16, 0.99, '#d9d4c8', 0, 0.46, 0));
    g.add(box(1.94, 0.1, 0.6, hex(p.accent), 0, 0.5, 0.18));
    g.add(box(0.5, 0.09, 0.32, '#f4efe4', -0.6, 0.56, -0.28));
    g.add(box(2.0, 0.7, 0.07, '#4a382a', 0, 0.45, -0.52));
    [[-0.93, -0.47], [0.93, -0.47], [-0.93, 0.47], [0.93, 0.47]].forEach(([x, z]) =>
      g.add(box(0.08, 0.12, 0.08, '#3d3225', x, 0.06, z)));
    return g;
  },

  sofa(p) {
    const g = new THREE.Group();
    const c = hex(p.accent);
    g.add(box(1.8, 0.35, 0.85, c, 0, 0.3, 0));
    g.add(box(1.8, 0.5, 0.2, c, 0, 0.65, -0.32));
    g.add(box(0.2, 0.3, 0.85, c, -0.8, 0.55, 0));
    g.add(box(0.2, 0.3, 0.85, c, 0.8, 0.55, 0));
    g.add(box(0.75, 0.12, 0.7, '#d9d4c8', -0.4, 0.53, 0.04));
    g.add(box(0.75, 0.12, 0.7, '#d9d4c8', 0.4, 0.53, 0.04));
    return g;
  },

  plant(p) {
    const g = new THREE.Group();
    g.add(cyl(0.18, 0.14, 0.28, '#a3552f', 0, 0.14, 0));
    g.add(cyl(0.03, 0.04, 0.5, '#5f4a33', 0, 0.5, 0));
    const foliage = [[0.26, 0.75], [0.2, 0.98], [0.13, 1.16]];
    foliage.forEach(([r, y]) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 0.32, 10), mat('#3d8b4f'));
      cone.position.set(0, y, 0);
      g.add(cone);
    });
    const fl = p.decor.flowers;
    if (fl) {
      const rng = makeRng('flower:' + p.id);
      for (let i = 0; i < fl.n; i++) {
        const a = rng() * Math.PI * 2, r = 0.1 + rng() * 0.14, y = 0.72 + rng() * 0.45;
        g.add(sph(0.032, hex(fl.color), Math.cos(a) * r, y, Math.sin(a) * r, 8));
      }
    }
    return g;
  },

  coatrack(p) {
    const g = new THREE.Group();
    g.add(cyl(0.16, 0.2, 0.04, '#3d3225', 0, 0.02, 0));
    g.add(cyl(0.025, 0.025, 1.75, '#5f4a33', 0, 0.9, 0));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      g.add(box(0.22, 0.025, 0.025, '#5f4a33', Math.cos(a) * 0.12, 1.66, Math.sin(a) * 0.12));
    }
    g.add(box(0.3, 0.62, 0.1, hex(p.accent), 0.12, 1.3, 0.05));
    return g;
  },

  floorlamp(p) {
    const g = new THREE.Group();
    g.add(cyl(0.15, 0.18, 0.04, '#3d3225', 0, 0.02, 0));
    g.add(cyl(0.02, 0.02, 1.35, '#6d737b', 0, 0.72, 0));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.26, 12, 1, true),
      new THREE.MeshLambertMaterial({ color: hex(p.accent), side: THREE.DoubleSide }));
    shade.position.set(0, 1.5, 0);
    g.add(shade);
    const bulb = sph(0.05, '#fff6d8', 0, 1.42, 0, 8);
    bulb.material.emissive = new THREE.Color('#ffedb5');
    bulb.material.emissiveIntensity = 0.8;
    g.add(bulb);
    return g;
  },

  locker(p) {
    const g = new THREE.Group();
    g.add(box(0.62, 1.85, 0.5, '#5c6672', 0, 0.925, 0));
    g.add(box(0.54, 1.72, 0.02, '#6a7480', 0, 0.93, 0.255));
    for (let i = 0; i < 3; i++) g.add(box(0.3, 0.025, 0.012, '#454e58', 0, 1.5 - i * 0.07, 0.27));
    g.add(box(0.03, 0.12, 0.03, '#c8ccd4', 0.2, 0.95, 0.27));
    return g;
  },

  fridge(p) {
    const g = new THREE.Group();
    g.add(box(0.72, 1.6, 0.68, '#dfe3e8', 0, 0.8, 0));
    g.add(box(0.66, 0.5, 0.02, '#eef1f4', 0, 1.3, 0.345));
    g.add(box(0.66, 0.95, 0.02, '#eef1f4', 0, 0.53, 0.345));
    g.add(box(0.03, 0.3, 0.04, '#9aa0a8', 0.26, 1.3, 0.37));
    g.add(box(0.03, 0.4, 0.04, '#9aa0a8', 0.26, 0.7, 0.37));
    return g;
  },

  workbench(p) {
    const g = new THREE.Group();
    g.add(box(1.5, 0.07, 0.7, '#8a6f4d', 0, 0.865, 0));
    [[-0.68, -0.28], [0.68, -0.28], [-0.68, 0.28], [0.68, 0.28]].forEach(([x, z]) =>
      g.add(box(0.07, 0.83, 0.07, '#4a4a4a', x, 0.415, z)));
    g.add(box(1.36, 0.04, 0.6, '#6d6d7d', 0, 0.25, 0));
    g.add(box(0.3, 0.06, 0.2, '#6d737b', -0.4, 0.93, 0.1));
    return g;
  },

  barrel(p) {
    const g = new THREE.Group();
    g.add(cyl(0.27, 0.24, 0.9, '#6e4f33', 0, 0.45, 0, 16));
    [0.18, 0.72].forEach((y) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.272, 0.012, 6, 20), mat('#3c424c'));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      g.add(ring);
    });
    return g;
  },

  rug(p) {
    const g = new THREE.Group();
    const outer = cyl(0.85, 0.85, 0.015, hex(p.accent), 0, 0.008, 0, 28);
    outer.scale.z = 0.7;
    g.add(outer);
    const inner = cyl(0.6, 0.6, 0.017, '#d9d4c8', 0, 0.01, 0, 28);
    inner.scale.z = 0.7;
    g.add(inner);
    return g;
  },

  box(p) {
    const g = new THREE.Group();
    g.add(box(0.38, 0.2, 0.3, hex(p.accent), 0, 0.1, 0));
    g.add(box(0.4, 0.06, 0.32, '#4a382a', 0, 0.23, 0));
    return g;
  },

  bottlerack(p) {
    const g = new THREE.Group();
    g.add(box(0.45, 0.03, 0.2, '#5f4a33', 0, 0.015, 0));
    g.add(box(0.45, 0.03, 0.2, '#5f4a33', 0, 0.2, 0));
    g.add(box(0.03, 0.2, 0.2, '#5f4a33', -0.21, 0.1, 0));
    g.add(box(0.03, 0.2, 0.2, '#5f4a33', 0.21, 0.1, 0));
    const b = p.decor.bottles;
    if (b) {
      for (let i = 0; i < b.n; i++) {
        const x = -0.17 + ((i + 0.5) / b.n) * 0.34;
        g.add(cyl(0.026, 0.026, 0.14, hex(b.color), x, 0.28, 0));
        g.add(cyl(0.01, 0.01, 0.05, hex(b.color), x, 0.37, 0));
      }
    }
    return g;
  },

  globe(p) {
    const g = new THREE.Group();
    g.add(cyl(0.1, 0.12, 0.03, '#4a382a', 0, 0.015, 0));
    g.add(cyl(0.012, 0.012, 0.16, '#c8a24a', 0, 0.1, 0));
    const rng = makeRng('globe:' + p.id);
    const tex = canvasTex(128, 64, (ctx, w, h) => {
      ctx.fillStyle = '#2e6da4'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3d8b4f';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.ellipse(rng() * w, rng() * h, 10 + rng() * 16, 6 + rng() * 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12),
      new THREE.MeshLambertMaterial({ map: tex }));
    globe.position.y = 0.22;
    globe.rotation.z = 0.35;
    g.add(globe);
    return g;
  },

  teddy(p) {
    const g = new THREE.Group();
    const c = '#a3773f';
    g.add(sph(0.09, c, 0, 0.1, 0));
    g.add(sph(0.065, c, 0, 0.235, 0));
    g.add(sph(0.026, c, -0.05, 0.29, 0));
    g.add(sph(0.026, c, 0.05, 0.29, 0));
    g.add(sph(0.03, c, -0.09, 0.12, 0.02));
    g.add(sph(0.03, c, 0.09, 0.12, 0.02));
    g.add(sph(0.012, '#2b2b2b', -0.02, 0.245, 0.06));
    g.add(sph(0.012, '#2b2b2b', 0.02, 0.245, 0.06));
    return g;
  },

  radio(p) {
    const g = new THREE.Group();
    g.add(box(0.4, 0.22, 0.14, hex(p.accent), 0, 0.11, 0));
    const grille = cyl(0.07, 0.07, 0.02, '#2b2b2b', -0.1, 0.11, 0.072);
    grille.rotation.x = Math.PI / 2;
    g.add(grille);
    g.add(sph(0.018, '#d9d4c8', 0.1, 0.14, 0.072));
    g.add(sph(0.018, '#d9d4c8', 0.1, 0.07, 0.072));
    g.add(cyl(0.006, 0.006, 0.24, '#8a8f98', 0.16, 0.32, -0.04));
    return g;
  },

  typewriter(p) {
    const g = new THREE.Group();
    g.add(box(0.42, 0.1, 0.34, '#3c424c', 0, 0.05, 0));
    g.add(box(0.4, 0.08, 0.12, '#2b2f36', 0, 0.14, -0.09));
    const rng = makeRng('type:' + p.id);
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 8; k++) {
        g.add(cyl(0.012, 0.012, 0.02, '#d9d4c8', -0.14 + k * 0.04 + r * 0.01, 0.115 + r * 0.012, 0.1 - r * 0.05, 8));
      }
    }
    g.add(box(0.24, 0.18, 0.005, '#f4efe4', 0, 0.26, -0.1));
    return g;
  },

  jarbig(p) {
    const g = new THREE.Group();
    const jar = cyl(0.09, 0.1, 0.28, '#b8a888', 0, 0.14, 0);
    jar.material.transparent = true;
    jar.material.opacity = 0.85;
    g.add(jar);
    g.add(cyl(0.06, 0.06, 0.04, '#5f4a33', 0, 0.3, 0));
    return g;
  },

  window(p) {
    const g = new THREE.Group();
    g.add(box(0.94, 0.74, 0.05, '#e8e4da'));
    const rng = makeRng('window:' + p.id);
    const tex = canvasTex(220, 170, (ctx, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#8fc8e8'); sky.addColorStop(1, '#d8ecf5');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f5e9b0';
      ctx.beginPath(); ctx.arc(40 + rng() * 60, 34 + rng() * 20, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f9a6f';
      ctx.beginPath(); ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 14) ctx.lineTo(x, h - 36 - Math.sin(x / 30 + rng() * 4) * 14);
      ctx.lineTo(w, h); ctx.fill();
    });
    g.add(texPlane(0.82, 0.62, tex, 0, 0, 0.028));
    g.add(box(0.03, 0.62, 0.015, '#e8e4da', 0, 0, 0.032));
    g.add(box(0.82, 0.03, 0.015, '#e8e4da', 0, 0, 0.032));
    return g;
  },

  birdhouse(p) {
    const g = new THREE.Group();
    g.add(box(0.28, 0.3, 0.24, '#8a6f4d', 0, -0.02, 0));
    const roof = box(0.36, 0.05, 0.3, '#5f4a33', 0, 0.17, 0);
    roof.rotation.z = 0.16;
    g.add(roof);
    const hole = cyl(0.045, 0.045, 0.02, '#2b2117', 0, 0, 0.125);
    hole.rotation.x = Math.PI / 2;
    g.add(hole);
    g.add(cyl(0.01, 0.01, 0.1, '#c8a24a', 0, -0.09, 0.15).rotateX(Math.PI / 2));
    return g;
  },

  stove(p) {
    const g = new THREE.Group();
    g.add(box(0.72, 0.86, 0.65, '#dfe3e8', 0, 0.43, 0));
    g.add(box(0.72, 0.04, 0.65, '#3c424c', 0, 0.88, 0));
    [[-0.18, -0.16], [0.18, -0.16], [-0.18, 0.16], [0.18, 0.16]].forEach(([x, z]) =>
      g.add(cyl(0.09, 0.09, 0.02, '#2b2f36', x, 0.91, z)));
    g.add(box(0.56, 0.34, 0.02, '#9aa0a8', 0, 0.4, 0.33));
    g.add(box(0.4, 0.03, 0.04, '#c8ccd4', 0, 0.6, 0.34));
    return g;
  },

  sink(p) {
    const g = new THREE.Group();
    g.add(box(0.78, 0.82, 0.6, '#b8c4c9', 0, 0.41, 0));
    g.add(box(0.78, 0.06, 0.6, '#dfe3e8', 0, 0.85, 0));
    g.add(box(0.5, 0.05, 0.4, '#9aa0a8', 0, 0.87, 0));
    g.add(cyl(0.022, 0.022, 0.22, '#c8ccd4', -0.2, 0.98, -0.14));
    g.add(box(0.16, 0.022, 0.022, '#c8ccd4', -0.13, 1.08, -0.14));
    g.add(box(0.34, 0.5, 0.02, '#a3b0b5', -0.19, 0.4, 0.305));
    g.add(box(0.34, 0.5, 0.02, '#a3b0b5', 0.19, 0.4, 0.305));
    return g;
  },

  bench(p) {
    const g = new THREE.Group();
    const wood = hex(p.accent);
    for (let i = 0; i < 3; i++) g.add(box(1.6, 0.04, 0.14, wood, 0, 0.46, -0.16 + i * 0.16));
    for (let i = 0; i < 3; i++) g.add(box(1.6, 0.14, 0.04, wood, 0, 0.66 + i * 0.18, -0.26));
    [[-0.7], [0.7]].forEach(([x]) => {
      g.add(box(0.06, 0.46, 0.5, '#3c424c', x, 0.23, 0));
      g.add(box(0.06, 0.6, 0.06, '#3c424c', x, 0.75, -0.25));
    });
    return g;
  },

  car(p) {
    const g = new THREE.Group();
    const c = hex(p.accent);
    g.add(box(2.3, 0.5, 1.1, c, 0, 0.55, 0));
    g.add(box(1.2, 0.42, 1.0, c, -0.1, 1.0, 0));
    // windows
    g.add(box(1.1, 0.3, 1.02, '#bcd2dd', -0.1, 1.02, 0));
    // wheels
    [[-0.75, -0.56], [0.75, -0.56], [-0.75, 0.56], [0.75, 0.56]].forEach(([x, z]) => {
      const wheel = cyl(0.24, 0.24, 0.14, '#2b2b2b', x, 0.24, z, 16);
      wheel.rotation.x = Math.PI / 2;
      g.add(wheel);
      const hub = cyl(0.09, 0.09, 0.15, '#c8ccd4', x, 0.24, z, 10);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
    });
    // lights
    g.add(sph(0.06, '#f5e9b0', 1.15, 0.6, -0.35, 8));
    g.add(sph(0.06, '#f5e9b0', 1.15, 0.6, 0.35, 8));
    g.add(sph(0.05, '#c0392b', -1.15, 0.6, -0.35, 8));
    g.add(sph(0.05, '#c0392b', -1.15, 0.6, 0.35, 8));
    return g;
  },

  suitcase(p) {
    const g = new THREE.Group();
    g.add(box(0.5, 0.32, 0.16, hex(p.accent), 0, 0.16, 0));
    g.add(box(0.52, 0.03, 0.18, '#3d3225', 0, 0.16, 0));
    g.add(box(0.14, 0.05, 0.03, '#3d3225', 0, 0.35, 0));
    [-0.14, 0.14].forEach((x) => g.add(box(0.04, 0.34, 0.18, '#5f4a33', x, 0.16, 0)));
    return g;
  },

  photoframe(p) {
    const g = new THREE.Group();
    const frame = box(0.18, 0.24, 0.02, '#c8a24a', 0, 0.12, 0);
    frame.rotation.x = -0.12;
    g.add(frame);
    const tex = canvasTex(64, 88, (ctx, w, h) => {
      ctx.fillStyle = '#cfd8de'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d4a017'; ctx.beginPath(); ctx.arc(48, 16, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5d6f66'; ctx.fillRect(0, 56, w, 32);
      ctx.fillStyle = '#7a5c3e';
      ctx.beginPath(); ctx.arc(24, 52, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(18, 58, 12, 22);
    });
    const photo = texPlane(0.14, 0.2, tex, 0, 0.12, 0.012);
    photo.rotation.x = -0.12;
    g.add(photo);
    return g;
  },
};

function drawShape(ctx, shape, x, y, s) {
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, s * 0.7, 0, Math.PI * 2);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - s * 0.8); ctx.lineTo(x + s * 0.8, y + s * 0.6); ctx.lineTo(x - s * 0.8, y + s * 0.6); ctx.closePath();
  } else { // star
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  ctx.fill();
}

// ---------------------------------------------------------------- entry

/** Build the full THREE.Group for a prop, positioned and rotated,
 *  with lock badges + symbol decal attached. */
export function buildProp(prop, room) {
  const builder = B[prop.type];
  const g = builder ? builder(prop) : box(0.3, 0.3, 0.3, hex(prop.accent), 0, 0.15, 0);
  const group = g instanceof THREE.Group ? g : new THREE.Group().add(g);
  const def = PROP_DEFS[prop.type];

  // symbol decal (language-neutral glyph, part of symbol lock puzzles)
  if (prop.decor.symbol && SYMBOLS.includes(prop.decor.symbol)) {
    const decal = symbolDecal(prop.decor.symbol);
    if (prop.type === 'rug') {
      decal.rotation.x = -Math.PI / 2;
      decal.position.set(0.25, 0.03, 0.15);
    } else if (def && def.kind === 'wall') {
      decal.position.set(prop.type === 'painting' ? 0.3 : 0.18, prop.type === 'painting' ? 0.2 : 0.28, (def.size[2] / 2) + 0.02);
    } else {
      const h = def ? def.size[1] : 0.4;
      decal.position.set(0, Math.max(0.12, h * 0.6), (def ? def.size[2] / 2 : 0.15) + 0.02);
    }
    group.add(decal);
  }

  // lock badges on the front face
  const locks = room.locks.filter((l) => l.attachedTo === prop.id);
  locks.forEach((lock, i) => {
    const badge = lockBadge(lock);
    if (prop.type === 'door') {
      badge.position.set(0.32, 1.0 + i * 0.28, 0.13);
    } else {
      const h = def ? def.size[1] : 0.4;
      const dpt = def ? def.size[2] : 0.3;
      badge.position.set(0.08 - i * 0.16, Math.max(0.14, h * 0.55), dpt / 2 + 0.035);
    }
    group.add(badge);
  });

  group.position.set(prop.pos[0], prop.pos[1], prop.pos[2]);
  group.rotation.y = prop.rotY || 0;
  group.userData.propId = prop.id;
  return group;
}
