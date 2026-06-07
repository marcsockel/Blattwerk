// Widget: Rechendreiecke

function rdRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// All 16 valid "gemischt" combinations: uniquely solvable, no redundant value.
// Redundant triples (excluded): {A,B,AB}, {A,C,AC}, {B,C,BC} — two corners + their common side.
// corners = [A=top, B=bl, C=br], sides = [AB=left, AC=right, BC=bottom]
const RD_GEMISCHT = [
  [[0,0,0],[1,1,1]], // all sides shown
  [[1,1,0],[0,1,0]], [[1,1,0],[0,0,1]], // 2 corners + 1 non-adjacent side
  [[1,0,1],[1,0,0]], [[1,0,1],[0,0,1]],
  [[0,1,1],[1,0,0]], [[0,1,1],[0,1,0]],
  [[1,0,0],[1,1,0]], [[1,0,0],[1,0,1]], [[1,0,0],[0,1,1]], // 1 corner + 2 sides
  [[0,1,0],[1,1,0]], [[0,1,0],[1,0,1]], [[0,1,0],[0,1,1]],
  [[0,0,1],[1,1,0]], [[0,0,1],[1,0,1]], [[0,0,1],[0,1,1]],
];

function rdGenOne(zahlenraum, leerfeld) {
  const maxC = Math.max(2, Math.floor(zahlenraum / 2) - 1);
  const a = rdRand(2, maxC);
  const b = rdRand(2, maxC);
  const c = rdRand(2, maxC);
  const corners = [a, b, c]; // top, bl, br
  const sides   = [a + b, a + c, b + c]; // left (top+bl), right (top+br), bottom (bl+br)
  let shownC, shownS;
  if (leerfeld === "seiten") {
    shownC = [true, true, true];
    shownS = [false, false, false];
  } else {
    const [sc, ss] = RD_GEMISCHT[rdRand(0, RD_GEMISCHT.length - 1)];
    shownC = sc.map(Boolean);
    shownS = ss.map(Boolean);
  }
  return { corners, sides, shownC, shownS };
}

function rdGen(n, zahlenraum, leerfeld) {
  return Array.from({ length: n }, () => rdGenOne(zahlenraum, leerfeld));
}

function rdSvg(tri, active=false) {
  const { corners, sides, shownC, shownS } = tri;
  // Triangle vertices and centroid
  const TX=105, TY=15, BLX=20, BLY=158, BRX=190, BRY=158, CX=105, CY=110;
  // Corner text positions: midpoint between each vertex and the centroid
  const cp = [
    [(TX+CX)/2, (TY+CY)/2],   // top → (105, 63)
    [(BLX+CX)/2, (BLY+CY)/2], // bl  → (63, 134)
    [(BRX+CX)/2, (BRY+CY)/2], // br  → (148, 134)
  ];
  const bw=42, bh=26;
  // Side box centers (outside the triangle, ~half-box-width gap from triangle side)
  const sp = [[24,87],[186,87],[105,179]]; // left, right, bottom

  let s = `<svg viewBox="-5 0 222 202" style="display:block;width:100%;overflow:visible;" xmlns="http://www.w3.org/2000/svg">`;

  // Triangle outline
  s += `<polygon points="${TX},${TY} ${BLX},${BLY} ${BRX},${BRY}" fill="white" stroke="#333" stroke-width="1.8" stroke-linejoin="round"/>`;

  // Y-lines from centroid to each side midpoint
  const LM=[(TX+BLX)/2,(TY+BLY)/2|0], RM=[(TX+BRX)/2,(TY+BRY)/2|0], BM=[(BLX+BRX)/2,BLY];
  [[CX,CY,...LM],[CX,CY,...RM],[CX,CY,...BM]].forEach(([x1,y1,x2,y2])=>{
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="1.2"/>`;
  });

  // Inner corner values — no box when empty; blue when active
  corners.forEach((v, i) => {
    const [cx, cy] = cp[i];
    if (shownC[i]) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#1a1a1a">${v}</text>`;
    } else if (active) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#2563eb">${v}</text>`;
    }
  });

  // Outer side boxes — always white background; blue text for missing when active
  sides.forEach((v, i) => {
    const [cx, cy] = sp[i];
    s += `<rect x="${cx-bw/2}" y="${cy-bh/2}" width="${bw}" height="${bh}" rx="5" fill="white" stroke="#555" stroke-width="1.5"/>`;
    if (shownS[i]) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#1a1a1a">${v}</text>`;
    } else if (active) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#2563eb">${v}</text>`;
    }
  });

  s += '</svg>';
  return s;
}

WIDGETS.push({
  meta: { type:"rechendreiecke", label:"Rechendreiecke", desc:"Ecken & Seiten addieren", icon:"🔺", category:"mathematik" },

  createData: id => {
    const cfg = { anzahl:4, zahlenraum:100, leerfeld:"seiten" };
    return { id, type:"rechendreiecke", ...cfg, dreiecke: rdGen(cfg.anzahl, cfg.zahlenraum, cfg.leerfeld) };
  },

  render: d => {
    const dreiecke = d.dreiecke || rdGen(d.anzahl||4, d.zahlenraum||100, d.leerfeld||"seiten");
    const active = d.id === selId || _solutionsMode;
    const svgs = dreiecke.map(t => `<div>${rdSvg(t, active)}</div>`);
    return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px 10px;">${svgs.join("")}</div>`;
  },

  renderProps: d => {
    const { anzahl=4, zahlenraum=100, leerfeld="seiten" } = d;
    const leerOpts = [
      ["seiten",   "Alle Seiten leer"],
      ["gemischt", "Gemischt"],
    ].map(([v,l]) => `<option value="${v}"${leerfeld===v?" selected":""}>${l}</option>`).join("");

    return pr("Zahlenraum",
        `<select onchange="rdSet(${d.id},'zahlenraum',+this.value)">
          ${[10,20,50,100].map(n=>`<option value="${n}"${zahlenraum===n?" selected":""}>${n}</option>`).join("")}
        </select>`) +
      pr("Leerfelder",
        `<select onchange="rdSet(${d.id},'leerfeld',this.value)">${leerOpts}</select>`) +
      pr("Anzahl",
        `<input type="number" min="1" max="12" value="${anzahl}" onchange="rdSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="rdRoll(${d.id})" style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Würfeln</button>`;
  },
});

function rdRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.dreiecke = rdGen(w.anzahl||4, w.zahlenraum||100, w.leerfeld||"seiten");
  render(); renderProps(id);
}

function rdSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.dreiecke = rdGen(w.anzahl||4, w.zahlenraum||100, w.leerfeld||"seiten");
  render(); renderProps(id);
}
