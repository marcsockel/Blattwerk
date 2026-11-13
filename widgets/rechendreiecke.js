// Widget: Rechendreiecke

function rdRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// „Gemischt": 15 Kombinationen, die OHNE Probieren lösbar sind — es gibt immer einen
// Rechenschritt mit nur einer Unbekannten (mind. 1 Innenzahl ist vorgegeben).
// Nicht dabei: nur die drei Außenzahlen (dafür muss man Innenzahlen vermuten) — das ist
// der eigene Modus „Nur Außenzahlen". Redundant und ebenfalls ausgeschlossen:
// {A,B,AB}, {A,C,AC}, {B,C,BC} — zwei Ecken + ihre gemeinsame Seite.
// corners = [A=top, B=bl, C=br], sides = [AB=left, AC=right, BC=bottom]
const RD_GEMISCHT = [
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
  } else if (leerfeld === "aussen") {
    // Nur Außenzahlen: eindeutig lösbar (Innen = halbe Summe der Außenzahlen minus Gegenseite)
    shownC = [false, false, false];
    shownS = [true, true, true];
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

function rdSvg(tri, active=false, edit=null) {
  const { corners, sides, shownC, shownS } = tri;
  // Triangle vertices and centroid
  const TX=105, TY=15, BLX=20, BLY=158, BRX=190, BRY=158, CX=105, CY=110;
  // Corner text positions: midpoint between each vertex and the centroid
  const cp = [
    [(TX+CX)/2, (TY+CY)/2],   // top → (105, 63)
    [(BLX+CX)/2, (BLY+CY)/2], // bl  → (63, 134)
    [(BRX+CX)/2, (BRY+CY)/2], // br  → (148, 134)
  ];
  const bw=48, bh=30;
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
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="20" font-weight="700" fill="#1a1a1a">${v}</text>`;
    } else if (active) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="20" font-weight="700" fill="#2563eb">${v}</text>`;
    }
  });

  // Outer side boxes — always white background; blue text for missing when active
  sides.forEach((v, i) => {
    const [cx, cy] = sp[i];
    s += `<rect x="${cx-bw/2}" y="${cy-bh/2}" width="${bw}" height="${bh}" rx="5" fill="white" stroke="#555" stroke-width="1.5"/>`;
    if (shownS[i]) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="20" font-weight="700" fill="#1a1a1a">${v}</text>`;
    } else if (active) {
      s += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-family="'DidactGothic7',sans-serif" font-size="20" font-weight="700" fill="#2563eb">${v}</text>`;
    }
  });

  // Ausgewählt: Innen- und Außenzahlen anklicken → direkt ändern
  if (edit) {
    const hit = (x, y, w, h, art, i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"
      onclick="rdEdit(event,${edit.id},${edit.ti},'${art}',${i})"><title>Zahl ändern</title></rect>`;
    cp.forEach(([cx, cy], i) => { s += hit(cx - 20, cy - 14, 40, 28, 'c', i); });
    sp.forEach(([cx, cy], i) => { s += hit(cx - bw/2, cy - bh/2, bw, bh, 's', i); });
  }
  s += '</svg>';
  return s;
}

WIDGETS.push({
  meta: { type:"rechendreiecke", group:"rechenformate", label:"Rechendreiecke", desc:"Ecken & Seiten addieren", icon:"🔺", category:"mathematik", itemsLayout: true },

  createData: id => {
    const cfg = { anzahl:3, zahlenraum:100, leerfeld:"seiten", gross:false , aufgabenNr:0, aufgabenText:''};
    return { id, type:"rechendreiecke", ...cfg, dreiecke: rdGen(cfg.anzahl, cfg.zahlenraum, cfg.leerfeld) };
  },

  render: d => {
    const dreiecke = d.dreiecke || rdGen(d.anzahl||4, d.zahlenraum||100, d.leerfeld||"seiten");
    const active = d.id === selId || _solutionsMode;
    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Feste Breite basis.
    const basis = d.gross ? 250 : 188;
    return atHtml(d) + flexDistribute(
      dreiecke.map((t, ti) => rdSvg(t, active, d.id === selId && !_solutionsMode ? { id: d.id, ti } : null)),
      { itemSize: `width:${basis}px;`, itemW: basis, d }
    );
  },

  renderProps: d => {
    const { anzahl=4, zahlenraum=100, leerfeld="seiten", gross=false } = d;
    const leerOpts = [
      ["seiten",   "Alle Seiten leer"],
      ["gemischt", "Gemischt (ohne Probieren lösbar)"],
      ["aussen",   "Nur Außenzahlen (Innen leer)"],
    ].map(([v,l]) => `<option value="${v}"${leerfeld===v?" selected":""}>${l}</option>`).join("");

    return pr("Zahlenraum",
        `<select onchange="rdSet(${d.id},'zahlenraum',+this.value)">
          ${[10,20,50,100].map(n=>`<option value="${n}"${zahlenraum===n?" selected":""}>${n}</option>`).join("")}
        </select>`) +
      pr("Leerfelder",
        `<select onchange="rdSet(${d.id},'leerfeld',this.value)">${leerOpts}</select>`) +
      pr("Anzahl",
        `<input type="number" min="1" max="15" value="${anzahl}" onchange="rdSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="rdRoll(${d.id})" style="margin-top:6px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Würfeln</button>` +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          <button onclick="event.stopPropagation();upd(${d.id},'gross',false)"
            style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${!gross?'#a6e3a1':'#ddd'};background:${!gross?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${!gross?'#1e1e2e':'#999'};">Klein</button>
          <button onclick="event.stopPropagation();upd(${d.id},'gross',true)"
            style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${gross?'#a6e3a1':'#ddd'};background:${gross?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${gross?'#1e1e2e':'#999'};">Groß</button>
        </div></div>` ;
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

// ── Zahl direkt im Dreieck ändern ─────────────────────────────────
// Innenzahl (Ecke) → die beiden angrenzenden Außenzahlen rechnen sich neu.
// Außenzahl (Seite = Summe zweier Ecken) → eine der beiden Ecken gleicht aus
// (links: unten links, rechts/unten: unten rechts), die übrigen Seiten rechnen sich neu.
function rdEdit(e, id, ti, art, i) {
  const w = widgets.find(x => x.id === id); if (!w || !w.dreiecke || !w.dreiecke[ti]) return;
  const t = w.dreiecke[ti];
  const alt = art === 'c' ? t.corners[i] : t.sides[i];
  bwZahlEingabe(e, alt, v => {
    if (v < 0) return false;
    const c = t.corners.slice();
    if (art === 'c') c[i] = v;
    else {
      const paare = [[0, 1], [0, 2], [1, 2]];             // Seite → Ecken
      const [p, q] = paare[i];
      const aendern = i === 0 ? q : 2;                     // bl bei links, sonst br
      const fest = aendern === q ? p : q;
      c[aendern] = v - c[fest];
      if (c[aendern] < 0) return false;
    }
    saveHistory();
    t.corners = c;
    t.sides = [c[0] + c[1], c[0] + c[2], c[1] + c[2]];
    render(); renderProps(id);
    return true;
  }, 'Das geht nicht – die Innenzahl würde negativ.');
}
