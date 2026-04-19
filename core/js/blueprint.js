(function () {
  const cv = document.createElement('canvas');
  cv.id = 'blueprint-canvas';
  Object.assign(cv.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '-1',
  });
  document.body.prepend(cv);

  const ctx = cv.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const BG  = '#030508';

  let W, H, plan, strokes, curIdx, curT, gen = 0;

  /* ── colours ── */
  const WALL_A  = (a) => `rgba(180,220,245,${a})`;
  const PART_A  = (a) => `rgba(140,195,225,${a})`;
  const DIM_A   = (a) => `rgba(90,145,185,${a})`;
  const HATCH_A = (a) => `rgba(120,180,215,${a})`;

  /* ── seeded random ── */
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  }

  /* ─────────────────────────────────────────────
     PLAN DEFINITION
     Coords in "world units" (1 unit = ~10 cm).
     Overall apartment ~12×9 m → 120×90 units.
  ─────────────────────────────────────────────── */
  function buildPlan() {
    const r = rng(gen * 17 + 3);
    const W0 = 120, H0 = 90;

    const kx  = 0.40 + r() * 0.12;
    const ky  = 0.50 + r() * 0.12;
    const kx2 = 0.55 + r() * 0.10;

    const dx  = Math.round(W0 * kx);
    const dy  = Math.round(H0 * ky);
    const dx2 = dx + Math.round((W0 - dx) * kx2);

    const BW = 4, PW = 2;
    return { W0, H0, dx, dy, dx2, BW, PW, r };
  }

  /* ─────────────────────────────────────────────
     STROKE BUILDER
  ─────────────────────────────────────────────── */
  function flattenStrokes(p) {
    const { W0, H0, dx, dy, dx2, BW, PW, r } = p;
    const S = [];

    const seg = (x1,y1,x2,y2,lw,col,a)  => S.push({t:'seg',  x1,y1,x2,y2,lw:lw||1,col:col||'bear',a:a||1});
    const arc = (cx,cy,rad,a0,a1,lw,col) => S.push({t:'arc',  cx,cy,rad,a0,a1,lw:lw||1,col:col||'bear'});
    const hatch= (x,y,w,h)               => S.push({t:'hatch',x,y,w,h});
    const dim  = (x1,y1,x2,y2,label,vert)=> S.push({t:'dim',  x1,y1,x2,y2,label,vert});
    const txt  = (x,y,str,fs,a)          => S.push({t:'txt',  x,y,str,fs:fs||3.5,a:a||0.22});
    const dash = (x1,y1,x2,y2)           => S.push({t:'dash', x1,y1,x2,y2});
    const clr  = (x,y,w,h)               => S.push({t:'clear',x,y,w,h});

    const ow = BW; /* outer wall thickness */
    const ibw = BW;

    /* ── outer bearing walls ── */
    seg(0,  0,  W0, 0,  ow, 'bear');
    seg(W0, 0,  W0, H0, ow, 'bear');
    seg(W0, H0, 0,  H0, ow, 'bear');
    seg(0,  H0, 0,  0,  ow, 'bear');

    /* outer wall hatching */
    hatch(0,      0,  ow, H0);
    hatch(W0-ow,  0,  ow, H0);
    hatch(0,      0,  W0, ow);
    hatch(0,  H0-ow,  W0, ow);

    /* ── internal bearing wall (vertical) ── */
    seg(dx - ibw/2, 0,  dx - ibw/2, H0, 0.8, 'bear');
    seg(dx + ibw/2, 0,  dx + ibw/2, H0, 0.8, 'bear');
    hatch(dx - ibw/2, 0, ibw, H0);

    /* ── partition walls ── */
    const pw = PW;
    /* horizontal partition (upper-left room) */
    seg(0,  dy,      dx - ibw/2, dy,      0.5, 'part');
    seg(0,  dy + pw, dx - ibw/2, dy + pw, 0.5, 'part');

    /* vertical partition in right half */
    seg(dx2,      0,  dx2,      dy, 0.5, 'part');
    seg(dx2 + pw, 0,  dx2 + pw, dy, 0.5, 'part');

    /* short partition — bathroom/utility in bottom-right zone */
    const py2 = dy + Math.round((H0 - dy) * 0.45);
    seg(dx + ibw/2, py2,      dx2,      py2,      0.5, 'part');
    seg(dx + ibw/2, py2 + pw, dx2, py2 + pw, 0.5, 'part');

    /* ── DOORS ── */
    function door(wx, wy, horiz, ccw, wallThk) {
      const dsz = 8;
      clr(wx, wy, horiz ? dsz : wallThk, horiz ? wallThk : dsz);
      if (horiz) {
        seg(wx, wy + wallThk/2, wx + dsz, wy + wallThk/2, 0.7, 'door', 0.85);
        const ox = ccw ? wx + dsz : wx;
        arc(ox, wy + (ccw ? 0 : wallThk), dsz,
            ccw ? Math.PI : 0,
            ccw ? Math.PI * 1.5 : Math.PI * 0.5, 0.6, 'door');
      } else {
        seg(wx + wallThk/2, wy, wx + wallThk/2, wy + dsz, 0.7, 'door', 0.85);
        const oy = ccw ? wy + dsz : wy;
        arc(wx + (ccw ? 0 : wallThk), oy, dsz,
            ccw ? -Math.PI * 0.5 : Math.PI * 0.5,
            ccw ? 0 : Math.PI, 0.6, 'door');
      }
    }

    door(dx - ibw/2, Math.round(H0 * 0.22), false, false, ibw);
    door(dx - ibw/2, Math.round(H0 * 0.62), false, true,  ibw);
    door(Math.round(dx * 0.35), dy,           true,  false, pw);
    door(dx2,        Math.round(dy * 0.55),   false, true,  pw);
    door(Math.round(W0 * 0.55), H0 - ow,      true,  false, ow);  /* entrance */

    /* ── WINDOWS ── */
    function win(wx, wy, horiz, wallThk, size) {
      clr(wx, wy, horiz ? size : wallThk, horiz ? wallThk : size);
      const t1 = wallThk * 0.15, t2 = wallThk * 0.50, t3 = wallThk * 0.85;
      if (horiz) {
        for (const t of [t1, t2, t3]) seg(wx, wy + t, wx + size, wy + t, 0.45, 'win', 0.8);
        seg(wx,       wy, wx,       wy + wallThk, 0.35, 'win', 0.45);
        seg(wx + size, wy, wx + size, wy + wallThk, 0.35, 'win', 0.45);
      } else {
        for (const t of [t1, t2, t3]) seg(wx + t, wy, wx + t, wy + size, 0.45, 'win', 0.8);
        seg(wx, wy,       wx + wallThk, wy,       0.35, 'win', 0.45);
        seg(wx, wy + size, wx + wallThk, wy + size, 0.35, 'win', 0.45);
      }
    }

    win(10,              0,      true,  ow, 14);
    win(dx + ibw + 8,    0,      true,  ow, 16);
    win(dx2 + pw + 5,    0,      true,  ow, 12);
    win(W0 - ow,         8,      false, ow, 14);
    win(W0 - ow,         dy + 8, false, ow, 16);
    win(0,               dy - ow - 10, false, ow, 14);
    win(8,               H0 - ow, true, ow, 12);

    /* ── DIMENSION LINES ── */
    const off = 10;
    dim(-off, 0,    -off,  dy,   (dy  / 10).toFixed(1) + ' m', true);
    dim(-off, dy,   -off,  H0,   ((H0 - dy) / 10).toFixed(1) + ' m', true);
    dim(0,  -off,   dx - ibw/2, -off, (dx / 10).toFixed(1) + ' m', false);
    dim(dx + ibw/2, -off, W0,   -off, ((W0 - dx) / 10).toFixed(1) + ' m', false);
    dim(0,  H0 + off, W0, H0 + off, (W0 / 10).toFixed(0) + '.0 m total', false);

    /* ── CENTRELINE DASHES ── */
    dash(dx,   -6,      dx,   H0 + 6);
    dash(0,     dy + pw/2, dx - ibw/2, dy + pw/2);
    dash(dx2 + pw/2, 0, dx2 + pw/2, dy);

    /* ── ROOM LABELS ── */
    const lbls = ['living room', 'bedroom', 'kitchen', 'hallway', 'studio', 'bathroom'];
    txt(dx * 0.45,                       dy * 0.5,             lbls[0]);
    txt(dx * 0.45,                       dy + (H0-dy) * 0.5,   lbls[1]);
    txt(dx + ibw/2 + (dx2-dx-ibw) * 0.5, dy * 0.45,            lbls[2]);
    txt(dx + ibw/2 + (W0-dx-ibw)  * 0.5, dy * 0.5,             lbls[3]);
    txt(dx + ibw/2 + (dx2-dx-ibw) * 0.5, dy + (py2-dy) * 0.5,  lbls[4]);
    txt(dx + ibw/2 + (W0-dx-ibw)  * 0.5, dy + (H0-dy) * 0.5,   lbls[5]);

    /* ── STAMP ── */
    S.push({ t: 'stamp', W0, H0 });

    return S;
  }

  /* ── scaling ── */
  function getScale() {
    const { W0, H0 } = plan;
    const margin = 60;
    const sx = (W/DPR - margin * 2) / (W0 + 22);
    const sy = (H/DPR - margin * 2) / (H0 + 22);
    const sc = Math.min(sx, sy);
    const ox = (W/DPR - W0 * sc) / 2 + 9 * sc;
    const oy = (H/DPR - H0 * sc) / 2 + 9 * sc;
    return { sc, ox, oy };
  }

  /* ── draw stroke ── */
  function drawStroke(s, t, full) {
    const { sc, ox, oy } = getScale();
    const d  = DPR;
    const px = (x) => (ox + x * sc) * d;
    const py = (y) => (oy + y * sc) * d;
    const ps = (v) => v * sc * d;

    const colMap = { bear: WALL_A, part: PART_A, win: PART_A, door: PART_A };
    const getCol = (col, a) => (colMap[col] || WALL_A)(a);

    if (s.t === 'clear') {
      ctx.fillStyle = BG;
      ctx.fillRect(px(s.x) - 1, py(s.y) - 1, ps(s.w) + 2, ps(s.h) + 2);
      return;
    }
    if (s.t === 'seg') {
      const ddx = s.x2 - s.x1, ddy = s.y2 - s.y1;
      ctx.save();
      ctx.globalAlpha = s.a || 1;
      ctx.strokeStyle = getCol(s.col, 1);
      ctx.lineWidth   = Math.max(ps(s.lw), 0.7 * d);
      ctx.lineCap     = 'square';
      ctx.beginPath();
      ctx.moveTo(px(s.x1), py(s.y1));
      ctx.lineTo(px(s.x1) + ps(ddx) * t, py(s.y1) + ps(ddy) * t);
      ctx.stroke();
      ctx.restore(); return;
    }
    if (s.t === 'arc') {
      if (!full) return;
      const span = s.a1 - s.a0;
      ctx.save();
      ctx.strokeStyle = getCol(s.col, 0.75);
      ctx.lineWidth   = Math.max(ps(s.lw), 0.6 * d);
      ctx.beginPath();
      ctx.arc(px(s.cx), py(s.cy), ps(s.rad), s.a0, s.a0 + span * t);
      ctx.stroke();
      ctx.restore(); return;
    }
    if (s.t === 'hatch') {
      if (!full) return;
      const hx = px(s.x), hy = py(s.y), hw = ps(s.w), hh = ps(s.h);
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.strokeStyle = HATCH_A(1);
      ctx.lineWidth   = 0.65 * d;
      ctx.beginPath();
      const step = 4 * d;
      for (let i = -hh; i < hw + hh; i += step) {
        ctx.moveTo(hx + i, hy);
        ctx.lineTo(hx + i + hh, hy + hh);
      }
      ctx.stroke();
      ctx.restore(); return;
    }
    if (s.t === 'dim') {
      if (!full) return;
      const tk = 3 * sc * d;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = DIM_A(1);
      ctx.fillStyle   = DIM_A(1);
      ctx.lineWidth   = 0.6 * d;
      ctx.font        = `${Math.max(2.8 * sc * d, 9)}px monospace`;
      ctx.textAlign   = 'center';
      ctx.beginPath();
      ctx.moveTo(px(s.x1), py(s.y1));
      ctx.lineTo(px(s.x2), py(s.y2));
      ctx.stroke();
      if (s.vert) {
        ctx.beginPath(); ctx.moveTo(px(s.x1)-tk, py(s.y1)); ctx.lineTo(px(s.x1)+tk, py(s.y1)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(s.x2)-tk, py(s.y2)); ctx.lineTo(px(s.x2)+tk, py(s.y2)); ctx.stroke();
        ctx.save(); ctx.translate(px(s.x1), (py(s.y1)+py(s.y2))*0.5); ctx.rotate(-Math.PI/2);
        ctx.fillText(s.label, 0, -3.5*sc*d); ctx.restore();
      } else {
        ctx.beginPath(); ctx.moveTo(px(s.x1), py(s.y1)-tk); ctx.lineTo(px(s.x1), py(s.y1)+tk); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(s.x2), py(s.y2)-tk); ctx.lineTo(px(s.x2), py(s.y2)+tk); ctx.stroke();
        ctx.fillText(s.label, (px(s.x1)+px(s.x2))*0.5, py(s.y1)-4*sc*d);
      }
      ctx.restore(); return;
    }
    if (s.t === 'dash') {
      if (!full) return;
      ctx.save();
      ctx.globalAlpha = 0.17;
      ctx.strokeStyle = DIM_A(1);
      ctx.lineWidth   = 0.5 * d;
      ctx.setLineDash([3*sc*d, 4*sc*d]);
      ctx.beginPath();
      ctx.moveTo(px(s.x1), py(s.y1));
      ctx.lineTo(px(s.x2), py(s.y2));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore(); return;
    }
    if (s.t === 'txt') {
      if (!full) return;
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.fillStyle   = DIM_A(1);
      ctx.font        = `${Math.max(s.fs*sc*d, 8)}px monospace`;
      ctx.textAlign   = 'center';
      ctx.fillText(s.str, px(s.x), py(s.y));
      ctx.restore(); return;
    }
    if (s.t === 'stamp') {
      if (!full) return;
      const bw = 18*sc*d, bh = 12*sc*d;
      const bx = px(s.W0) - bw - 2*d, by = py(s.H0) - bh - 2*d;
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = DIM_A(1);
      ctx.fillStyle   = DIM_A(1);
      ctx.lineWidth   = 0.6 * d;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.font      = `${Math.max(2.5*sc*d, 7)}px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText('FLOOR PLAN  1:100', bx + 2*d, by + bh*0.65);
      ctx.restore(); return;
    }
  }

  /* ── cursor position ── */
  function strokePoint(s, t) {
    const { sc, ox, oy } = getScale();
    const px = (x) => (ox + x * sc) * DPR;
    const py = (y) => (oy + y * sc) * DPR;
    const ps = (v) => v * sc * DPR;
    if (s.t === 'seg') {
      return [px(s.x1) + (px(s.x2)-px(s.x1))*t, py(s.y1) + (py(s.y2)-py(s.y1))*t];
    }
    if (s.t === 'arc') {
      const a = s.a0 + (s.a1 - s.a0) * t;
      return [px(s.cx) + Math.cos(a)*ps(s.rad), py(s.cy) + Math.sin(a)*ps(s.rad)];
    }
    return null;
  }

  function drawCursor(x, y) {
    if (x == null) return;
    const r = 4.5 * DPR;
    ctx.save();
    ctx.strokeStyle = 'rgba(220,238,255,0.92)';
    ctx.fillStyle   = 'rgba(160,210,240,0.10)';
    ctx.lineWidth   = 1.1 * DPR;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 0.5;
    const arm = r*1.9, gap = r*0.7;
    ctx.beginPath(); ctx.moveTo(x-arm,y); ctx.lineTo(x-gap,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+gap,y); ctx.lineTo(x+arm,y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y-arm); ctx.lineTo(x,y-gap); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y+gap); ctx.lineTo(x,y+arm); ctx.stroke();
    ctx.restore();
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(90,145,185,0.03)';
    ctx.lineWidth   = DPR;
    const gs = 44 * DPR;
    for (let x=0; x<W; x+=gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<H; y+=gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    ctx.restore();
  }

  function init() {
    W = cv.width  = window.innerWidth  * DPR;
    H = cv.height = window.innerHeight * DPR;
    plan    = buildPlan();
    strokes = flattenStrokes(plan);
    curIdx  = 0; curT = 0;
  }

  /* ── speed: higher = faster ── */
  const SPEED = 0.018;

  function loop() {
    requestAnimationFrame(loop);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    drawGrid();

    curT += SPEED;
    while (curT >= 1) {
      curT -= 1; curIdx++;
      if (curIdx >= strokes.length) { gen++; init(); return; }
    }

    for (let i = 0; i < curIdx; i++) drawStroke(strokes[i], 1, true);
    if (curIdx < strokes.length) drawStroke(strokes[curIdx], curT, false);

    const cp = strokePoint(strokes[curIdx], curT);
    if (cp) drawCursor(cp[0], cp[1]);
  }

  window.addEventListener('resize', () => {
    W = cv.width  = window.innerWidth  * DPR;
    H = cv.height = window.innerHeight * DPR;
  });

  init();
  loop();
})();