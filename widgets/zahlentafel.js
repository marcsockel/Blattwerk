// Widget: Zahlentafel (Hundertertafel 1–100)
// Modi: „Lücken" (Symbole), „Eintragen" (intern 'einkreisen'), „Stücke", „Eigene" (intern 'voll').
//   Lücken:    volle Tafel, einige Felder leer → Kind trägt ein (Lösung blau).
//   Eintragen: vorgegebene Zahlen werden an der richtigen Stelle in die Tafel geschrieben.
//              Gleiche Hilfe-Stufen wie bei Lücken; die Zielfelder sind immer leer.
//              Im Auswahl-/Lösungsmodus stehen sie blau in der Tafel.
// (Stücke-Modus folgt als zweiter Schritt: L-/H-/Plus-/Diagonale-Ausschnitte.)

function ztRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// count verschiedene Zahlen aus 1..100 (aufsteigend).
function ztRandNums(count) {
  const pool = [];
  for (let i = 1; i <= 100; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.max(0, Math.min(100, count))).sort((a, b) => a - b);
}

// Hunderter (1–10): die Tafel zeigt (h−1)·100+1 … h·100. Intern arbeiten alle Modi mit
// Feldnummern 1–100; angezeigt wird Feldnummer + Versatz.
function ztOff(d) { const h = Math.round(+d.hunderter || 1); return (Math.max(1, Math.min(10, h)) - 1) * 100; }

// "112, 134 156" → Feldnummern [12,34,56] (nur Zahlen des eingestellten Hunderters, eindeutig)
function ztParseNums(str, off = 0) {
  const seen = new Set(), out = [];
  (str || '').split(/[^0-9]+/).forEach(s => {
    if (!s) return;
    const n = parseInt(s, 10) - off;
    if (n >= 1 && n <= 100 && !seen.has(n)) { seen.add(n); out.push(n); }
  });
  return out;
}
// Schriftgröße, damit auch 3-/4-stellige Zahlen in die Zelle passen
function ztFs(fs, cs, zahl) { const L = String(zahl).length; return Math.min(fs, Math.floor(cs * 0.86 / (L * 0.56))); }

// ── Stücke (Teilausschnitte der Tafel) ────────────────────────────
// Jede Form: Liste von [dr,dc]-Offsets (≥0). Nummer eines Feldes = (R+dr)*10+(C+dc)+1.
// Tafel-Logik ergibt sich automatisch (waagerecht ±1, senkrecht ±10, diagonal ±9/±11).
const ZT_SHAPES = [
  [[0,1],[1,0],[1,1],[1,2],[2,1]],            // Plus / Kreuz
  [[0,0],[1,0],[2,0],[2,1],[2,2]],            // L
  [[0,2],[1,2],[2,2],[2,1],[2,0]],            // L gespiegelt
  [[0,0],[0,1],[0,2],[1,0],[2,0]],            // Γ (oben + links)
  [[0,0],[1,0],[2,0],[1,1],[0,2],[1,2],[2,2]],// H
  [[0,0],[0,1],[0,2],[1,1],[2,1]],            // T
  [[2,0],[2,1],[2,2],[1,1],[0,1]],            // T umgedreht
  [[0,0],[1,1],[2,2],[3,3]],                  // Diagonale ↘ (+11)
  [[0,3],[1,2],[2,1],[3,0]],                  // Diagonale ↙ (+9)
  [[0,0],[0,1],[1,0],[1,1]],                  // Quadrat 2×2
  [[0,0],[1,0],[2,0],[2,1],[2,2],[1,2],[0,2]],// U
  [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]], // O (Ring, 8)
  [[0,0],[1,0],[1,1],[2,1],[2,2]],            // Treppe
  [[0,0],[0,2],[1,1],[2,0],[2,2]],            // X
  [[0,0],[0,1],[1,1],[2,1],[2,2]],            // Z
];

function ztMakePiece() {
  const cells = ZT_SHAPES[ztRand(0, ZT_SHAPES.length - 1)];
  const maxdr = Math.max(...cells.map(c => c[0]));
  const maxdc = Math.max(...cells.map(c => c[1]));
  const R = ztRand(0, 9 - maxdr);
  const C = ztRand(0, 9 - maxdc);
  const givenIdx = ztRand(0, cells.length - 1);
  return { cells, maxdr, maxdc, R, C, givenIdx };
}

function ztGenPieces(w) {
  const n = Math.max(1, Math.min(24, w.anzahl || 6));
  w.pieces = Array.from({ length: n }, () => ztMakePiece());
}

function ztPieceSvg(p, d, cs) {
  const m = 1.5, fs = Math.round(cs * 0.42);
  const isActive = d.id === selId || _solutionsMode;
  const ff = "'DidactGothic7',sans-serif";
  const o = d.stueckSchatten ? (cs >= 40 ? 3 : 2) : 0;     // gezeichneter Schatten, Versatz nach Größe
  const W = (p.maxdc + 1) * cs + 2 * m + o, H = (p.maxdr + 1) * cs + 2 * m + o;
  let shadow = '', rects = '', texts = '';
  p.cells.forEach(([dr, dc], i) => {
    const x = m + dc * cs, y = m + dr * cs;
    const num = (p.R + dr) * 10 + (p.C + dc) + 1 + ztOff(d);
    const given = i === p.givenIdx;
    if (o) shadow += `<rect x="${x + o}" y="${y + o}" width="${cs}" height="${cs}" fill="#000" fill-opacity="0.18"/>`;
    rects += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${given ? '#eef4ff' : '#fff'}" stroke="#555" stroke-width="1.4"/>`;
    if (given || isActive) {
      texts += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${ztFs(fs, cs, num)}" font-weight="${given ? 700 : 400}" fill="${given ? '#222' : '#2563eb'}">${num}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${shadow}${rects}${texts}</svg>`;
}

function ztPiecesHtml(d) {
  // Stücke pro Reihe: Klein 4 · Mittel 3 · Groß 2. Slot so groß, dass genau so viele
  // (mit „Mittel"-Abstand) in die volle Breite passen; größtes Stück ist 4 Felder breit.
  const g = ztGroesse(d);
  const n = g === 'klein' ? 4 : g === 'gross' ? 2 : 3;
  const gap = typeof ITEM_GAP_MAP !== 'undefined' ? ITEM_GAP_MAP.normal.h : 43;
  const full = typeof geom === 'function' ? geom().contentW - 18 + 2 : 624;
  const slot = Math.floor((full - (n - 1) * gap) / n);
  const cs = Math.floor((slot - 3 - 3) / 4);
  return flexDistribute(
    (d.pieces || []).map(p => ztPieceSvg(p, d, cs)),
    { itemSize: `width:${slot}px;height:${slot}px;display:flex;align-items:center;justify-content:center;`, itemW: slot, d }
  );
}

// ── Lücken mit Symbolen ───────────────────────────────────────────
// Ein Teil der Tafel ist ausgefüllt (Vorgabe viel/mittel/wenig), der Rest leer.
// An einigen leeren Stellen steht ein Symbol (Kreis mit Buchstabe). Rechts daneben
// steht jedes Symbol noch einmal mit einem Schreibfeld → Zahl an dieser Stelle eintragen.
const ZT_SYM_MAX = 8;
// Hilfe-Stufen (Slider 0–10): welche Zahlen in der Tafel vorgegeben sind.
const ZT_HILFE = [
  { t: 'Keine Hilfe' },
  { t: 'Nur 1 und 100', fix: [1, 100] },
  { t: 'Ca. 5 Felder zufällig', rnd: 5 },
  { t: 'Linke Spalte', links: true },
  { t: 'Linke + rechte Spalte', links: true, rechts: true },
  { t: 'Eine Diagonale', diag: true },
  { t: 'Ca. 10 Felder zufällig', rnd: 10 },
  { t: 'Linke Spalte + 10 Felder', links: true, rnd: 10 },
  { t: 'Ca. 20 Felder zufällig', rnd: 20 },
  { t: 'Links + rechts + 20 Felder', links: true, rechts: true, rnd: 20 },
  { t: 'Ca. 40 Felder zufällig', rnd: 40 },
];
function ztHilfeStufe(w) {
  const h = w.hilfe;
  return Number.isFinite(h) ? Math.max(0, Math.min(10, Math.round(h))) : 8;
}
function ztGenLuecken(w) {
  const n = Math.max(1, Math.min(ZT_SYM_MAX, w.anzahl || 8));
  const syms = ztRandNums(n);                                  // Symbol-Stellen
  for (let i = syms.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [syms[i], syms[j]] = [syms[j], syms[i]]; }
  w.blanks = syms;                                             // Reihenfolge = Buchstaben A, B, C …
  ztGenZeigen(w);
}
// Felder, die immer leer bleiben müssen (Symbole bzw. einzutragende Zahlen)
function ztFreiFelder(w) {
  return new Set((w.modus || 'luecken') === 'einkreisen' ? ztParseNums(w.circle, ztOff(w)) : (w.blanks || []));
}
// Vorgegebene Zahlen nach Hilfe-Stufe (Zielfelder bleiben immer frei)
function ztGenZeigen(w) {
  const istSym = ztFreiFelder(w);
  const H = ZT_HILFE[ztHilfeStufe(w)];
  const zeigen = new Set();
  const add = k => { if (!istSym.has(k)) zeigen.add(k); };
  (H.fix || []).forEach(add);
  for (let r = 0; r < 10; r++) {
    if (H.links) add(r * 10 + 1);
    if (H.rechts) add(r * 10 + 10);
    if (H.diag) add(r * 11 + 1);
  }
  if (H.rnd) {
    const frei = [];
    for (let k = 1; k <= 100; k++) if (!istSym.has(k) && !zeigen.has(k)) frei.push(k);
    for (let i = frei.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [frei[i], frei[j]] = [frei[j], frei[i]]; }
    frei.slice(0, H.rnd).forEach(k => zeigen.add(k));
  }
  w.zeigen = [...zeigen].sort((a, b) => a - b);
}

function ztSymbolSvg(x, y, cs, buchstabe) {
  const ff = "'DidactGothic7',sans-serif";
  return `<circle cx="${x + cs / 2}" cy="${y + cs / 2}" r="${cs * 0.36}" fill="#fff" stroke="#222" stroke-width="1.6"/>`
    + `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.round(cs * 0.42)}" font-weight="700" fill="#222">${buchstabe}</text>`;
}

// Rechte Spalte: Symbol = [Schreibfeld]
function ztAntwortSvg(d, cs, hoehe) {
  const syms = d.blanks || [];
  const isActive = d.id === selId || _solutionsMode;
  const ff = "'DidactGothic7',sans-serif";
  const bw = Math.round(cs * 1.7), eqW = Math.round(cs * 0.8), m = 1.5;
  const W = cs + eqW + bw + 2 * m;
  const n = syms.length;
  const gap = n > 1 ? Math.min(cs * 0.6, Math.max(0, (hoehe - 2 * m - n * cs) / (n - 1))) : 0;
  let g = '';
  syms.forEach((num, i) => {
    const y = m + i * (cs + gap);
    g += ztSymbolSvg(m, y, cs, String.fromCharCode(65 + i));
    g += `<text x="${m + cs + eqW / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.round(cs * 0.5)}" fill="#222">=</text>`;
    const bx = m + cs + eqW;
    g += `<rect x="${bx}" y="${y}" width="${bw}" height="${cs}" fill="#fff" stroke="#999" stroke-width="1.4" rx="2"/>`;
    if (isActive) g += `<text x="${bx + bw / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.round(cs * 0.5)}" font-weight="700" fill="#2563eb">${num + ztOff(d)}</text>`;
  });
  const H = n ? m * 2 + n * cs + (n - 1) * gap : 0;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

function ztGenerate(w) {
  const modus = w.modus || 'luecken';
  if (modus === 'luecken') ztGenLuecken(w);
  else if (modus === 'einkreisen') { w.circle = ztRandNums(w.anzahl || 8).map(n => n + ztOff(w)).join(', '); ztGenZeigen(w); }
  else if (modus === 'stuecke') ztGenPieces(w);
  // 'voll': nichts zu erzeugen
}

// Größen der Tafel (alle Modi außer Stücke):
//   Klein  = feste 34 px-Zellen (früheres „Groß")
//   Mittel = Tafel + Eintrag-Spalte (Lücken) füllen zusammen die Breite
//   Groß   = Tafel über die ganze Widget-Breite (Lücken: Eintragfelder darunter)
const ZT_LUECKE_GAP = 28;
function ztGroesse(d) {
  // Stücke hatten nur Klein/Groß → früheres Groß ist jetzt Mittel
  if (d.zgS !== 1) { if (d.modus === 'stuecke' && d.groesse !== 'klein') d.groesse = 'mittel'; d.zgS = 1; }
  // Ältere Blätter: früheres Groß (34 px) bzw. Groß bei Lücken/Eintragen (breitenfüllend) übernehmen
  if (d.zgV !== 2) {
    const alt = d.groesse || 'gross';
    if (d.modus !== 'stuecke') d.groesse = alt === 'gross' && ['luecken', 'einkreisen'].includes(d.modus || 'luecken') ? 'mittel' : 'klein';
    d.zgV = 2;
  }
  return ['klein', 'mittel', 'gross'].includes(d.groesse) ? d.groesse : 'mittel';
}
function ztAvail(d) {
  if (typeof geom !== 'function' || typeof widthFrac !== 'function') return 0;
  return geom().contentW * widthFrac(d) - (d.flush ? 0 : 18) + 2;
}
function ztCs(d) {
  const g = ztGroesse(d), avail = ztAvail(d);
  if (g === 'klein' || !avail) return 34;
  // Mittel: Breite = Tafel (10·cs + 3) + Abstand + Spalte (3,5·cs + 3)
  const cs = g === 'gross'
    ? Math.floor((avail - 6) / 10 * 10) / 10
    : Math.floor((avail - ZT_LUECKE_GAP - 6) / 13.5 * 10) / 10;
  return cs >= 34 ? cs : 34;           // zu schmal (z.B. halbe Breite) → Klein
}

// Lücken + Groß: Eintragfelder unter der Tafel, nebeneinander
function ztAntwortReiheHtml(d) {
  const syms = d.blanks || [];
  const isActive = d.id === selId || _solutionsMode;
  const ff = "'DidactGothic7',sans-serif";
  const cs = 40, bw = Math.round(cs * 1.7), eqW = Math.round(cs * 0.8), m = 1.5;
  const W = cs + eqW + bw + 2 * m, H = cs + 2 * m;
  const items = syms.map((num, i) => {
    const bx = m + cs + eqW;
    let g = ztSymbolSvg(m, m, cs, String.fromCharCode(65 + i))
      + `<text x="${m + cs + eqW / 2}" y="${m + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.round(cs * 0.5)}" fill="#222">=</text>`
      + `<rect x="${bx}" y="${m}" width="${bw}" height="${cs}" fill="#fff" stroke="#999" stroke-width="1.4" rx="2"/>`;
    if (isActive) g += `<text x="${bx + bw / 2}" y="${m + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.round(cs * 0.5)}" font-weight="700" fill="#2563eb">${num + ztOff(d)}</text>`;
    return `<div style="display:flex;justify-content:center;"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg></div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${W + 8}px,1fr));row-gap:14px;margin-top:18px;">${items}</div>`;
}

function ztChartSvg(d) {
  const cs = ztCs(d), fs = Math.round(cs * 0.44), m = 1.5;
  const W = 10 * cs + 2 * m;
  const isActive = d.id === selId || _solutionsMode;
  const modus = d.modus || 'luecken';
  const syms = modus === 'luecken' ? (d.blanks || []) : [];
  const symIdx = new Map(syms.map((n, i) => [n, i]));
  const mitHilfe = modus === 'luecken' || modus === 'einkreisen';
  const zeigen = mitHilfe ? new Set(d.zeigen || []) : null;
  const ziele = new Set(modus === 'einkreisen' ? ztParseNums(d.circle, ztOff(d)) : []);
  const off = ztOff(d);
  const ff = "'DidactGothic7',sans-serif";
  // Eigene: einzelne Zahlen per Klick aus-/einblenden (nur im Bearbeiten, nicht in der Lösung)
  const versteckt = new Set(modus === 'voll' ? (d.versteckt || []) : []);
  const klickbar = modus === 'voll' && d.id === selId && !_solutionsMode;

  let g = '', klick = '';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const num = r * 10 + c + 1;
      const x = m + c * cs, y = m + r * cs;
      g += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="#fff" stroke="#999" stroke-width="1"/>`;
      if (symIdx.has(num)) {
        g += ztSymbolSvg(x, y, cs, String.fromCharCode(65 + symIdx.get(num)));
      } else if (ziele.has(num)) {
        // Zielfeld: immer leer, Lösung blau
        if (isActive) g += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${ztFs(fs, cs, num + off)}" font-weight="700" fill="#2563eb">${num + off}</text>`;
      } else if (versteckt.has(num)) {
        // ausgeblendet: beim Bearbeiten blass, in der Lösung blau, sonst leer
        if (isActive) g += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${ztFs(fs, cs, num + off)}" ${klickbar ? 'fill="#c4c4c4"' : 'font-weight="700" fill="#2563eb"'}>${num + off}</text>`;
      } else if (!zeigen || zeigen.has(num)) {
        g += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${ztFs(fs, cs, num + off)}" fill="#222">${num + off}</text>`;
      }
      if (klickbar) klick += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="transparent" style="cursor:pointer;" onclick="event.stopPropagation();ztToggle(${d.id},${num})"><title>${versteckt.has(num) ? 'Einblenden' : 'Ausblenden'}</title></rect>`;
    }
  }
  // 5er-Hilfslinien (etwas kräftiger) + Außenrahmen
  const L = m + 5 * cs;
  g += `<line x1="${L}" y1="${m}" x2="${L}" y2="${m + 10 * cs}" stroke="#555" stroke-width="1.4"/>`;
  g += `<line x1="${m}" y1="${L}" x2="${m + 10 * cs}" y2="${L}" stroke="#555" stroke-width="1.4"/>`;
  g += `<rect x="${m}" y="${m}" width="${10 * cs}" height="${10 * cs}" fill="none" stroke="#333" stroke-width="1.8"/>`;
  g += klick;
  return `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

WIDGETS.push({
  meta: { type:'zahlentafel', label:'Zahlentafel', desc:'Hundertertafel bis 1000', icon:'🔢', category:'mathematik', itemsLayout: true },

  createData: id => {
    const w = {
      id, type:'zahlentafel',
      modus:'luecken', anzahl:8, hilfe:8, circle:'', groesse:'mittel', zgV:2, zgS:1, align:'auto', itemGap:'normal',
      itemsPerRow:'auto', stueckSchatten:false,
      aufgabenNr:0, aufgabenText:'',
    };
    ztGenerate(w);
    return w;
  },

  render: d => {
    const modus = d.modus || 'luecken';
    const L = typeof itemsLayoutProps === 'function' ? itemsLayoutProps(d) : { align: 'left' };
    let chartAlign = ['left', 'center', 'right'].includes(L.align) ? L.align : 'left';
    // Blocksatz + Inhalt füllt die Breite (Mittel/Groß bzw. Eintragen) → mittig,
    // damit links und rechts derselbe Abstand zum Widgetrahmen bleibt
    if (L.align === 'justify' && modus !== 'stuecke' && (modus === 'einkreisen' || ztGroesse(d) !== 'klein')) chartAlign = 'center';
    // Früher nutzte der Stücke-Schatten das Feld 'schatten' – das ist aber der Rahmen-Schatten
    // des Widgets (galt dann in allen Modi). Einmalig umziehen.
    if (d.stueckSchatten == null) { d.stueckSchatten = !!(d.schatten && modus === 'stuecke'); if (d.stueckSchatten) d.schatten = false; }
    if (modus === 'stuecke') {
      if (!Array.isArray(d.pieces)) ztGenerate(d);
      return atHtml(d) + ztPiecesHtml(d);
    }
    if (modus === 'luecken' && !Array.isArray(d.zeigen)) ztGenerate(d);   // auch ältere Blätter (ohne Symbole)
    if (modus === 'luecken') {
      const cs = ztCs(d), H = 10 * cs + 3;
      if (ztGroesse(d) === 'gross')
        return atHtml(d) + `<div style="text-align:${chartAlign};"><div style="display:inline-block;text-align:left;">${ztChartSvg(d)}</div>${ztAntwortReiheHtml(d)}</div>`;
      return atHtml(d) + `<div style="text-align:${chartAlign};"><div style="display:inline-flex;align-items:flex-start;gap:${ZT_LUECKE_GAP}px;flex-wrap:wrap;text-align:left;">`
        + `${ztChartSvg(d)}${ztAntwortSvg(d, cs, H)}</div></div>`;
    }
    if (modus === 'einkreisen' && !Array.isArray(d.zeigen)) ztGenZeigen(d);   // ältere Blätter
    let head = '';
    if (modus === 'einkreisen') {
      const nums = ztParseNums(d.circle, ztOff(d)).map(n => n + ztOff(d));
      // Zahlen so groß wie in der Tafel, jede zentriert in einem Kästchen, mit Umbruch.
      // Klein/Mittel: rechts neben der Tafel („Trage ein:" darüber); Groß: über der Tafel.
      const cs = ztCs(d), hfs = Math.round(cs * 0.44), chartW = 10 * cs + 3;
      const maxL = Math.max(2, ...nums.map(n => String(n).length));
      const kw = Math.round(hfs * Math.max(2.2, 0.62 * maxL + 0.5)), kh = Math.round(hfs * 1.6), gap = 10;   // gap = Mindestabstand
      const kaestchen = nums.map(n => `<span style="display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;`
        + `width:${kw}px;height:${kh}px;border:1.5px solid #555;border-radius:3px;font-size:${hfs}px;">${n}</span>`).join('') || '—';
      const label = `<div style="font-size:${hfs}px;margin-bottom:8px;">Trage ein:</div>`;
      const rechtsW = (ztAvail(d) || 0) - chartW - ZT_LUECKE_GAP;
      // Raster: so viele Spalten wie passen. Reicht die Anzahl für eine volle Reihe → Blocksatz
      // (erste/letzte Spalte bündig mit dem Rand), sonst linksbündig mit Mindestabstand.
      const raster = breite => {
        const n = Math.max(1, Math.floor((breite + gap) / (kw + gap)));
        const block = nums.length >= n;
        return `<div style="display:grid;grid-template-columns:repeat(${n},${kw}px);row-gap:${gap}px;`
          + (block ? `justify-content:space-between;` : `column-gap:${gap}px;`) + `">${kaestchen}</div>`;
      };
      if (ztGroesse(d) !== 'gross' && rechtsW >= 2 * kw + gap) {
        return atHtml(d) + `<div style="text-align:${chartAlign};"><div style="display:inline-flex;align-items:flex-start;gap:${ZT_LUECKE_GAP}px;text-align:left;">`
          + `${ztChartSvg(d)}<div style="width:${Math.floor(rechtsW)}px;font-family:'DidactGothic7',sans-serif;">${label}`
          + `${raster(Math.floor(rechtsW))}</div></div></div>`;
      }
      head = `<div style="width:${chartW}px;max-width:100%;margin-bottom:12px;font-family:'DidactGothic7',sans-serif;">${label}`
        + `${raster(chartW)}</div>`;
    }
    return atHtml(d) +
      `<div style="text-align:${chartAlign};"><div style="display:inline-block;text-align:left;max-width:100%;">${head}${ztChartSvg(d)}</div></div>`;
  },

  renderProps: d => {
    const modus = d.modus || 'luecken';
    const size = ztGroesse(d);
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();ztSet(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    const vtgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;

    const hu = ztOff(d) / 100 + 1;
    let out = `<div class="prow"><label>Zahlenraum (Hunderter)</label>
        <select onchange="ztHunderter(${d.id},+this.value)">
          ${Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}"${hu === i + 1 ? ' selected' : ''}>${i * 100 + 1} – ${(i + 1) * 100}</option>`).join('')}
        </select></div>` + `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${tgl(modus,'luecken','Lücken','modus')}
          ${tgl(modus,'einkreisen','Eintragen','modus')}
          ${tgl(modus,'stuecke','Ausschnitte','modus')}
          ${tgl(modus,'voll','Eigene','modus')}
        </div></div>`;

    if (modus === 'stuecke') {
      out += pr('Anzahl Ausschnitte', `<input type="number" min="1" max="24" value="${d.anzahl||6}" onchange="ztSet(${d.id},'anzahl',+this.value)">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Ausschnitte neu würfeln</button>
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;">Formen: Plus/Kreuz, L, H, T, U, O, Diagonale, Treppe, X, Z … (zufällig). Ein Feld ist vorgegeben, der Rest wird über die Tafel-Logik ergänzt.</div>
        <div class="prow"><label>Schatten</label>
          <div style="display:flex;gap:4px;">
            <button onclick="event.stopPropagation();upd(${d.id},'stueckSchatten',false)" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${!d.stueckSchatten?'#89b4fa':'#ddd'};background:${!d.stueckSchatten?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${!d.stueckSchatten?'#1e1e2e':'#999'};">Aus</button>
            <button onclick="event.stopPropagation();upd(${d.id},'stueckSchatten',true)" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${d.stueckSchatten?'#89b4fa':'#ddd'};background:${d.stueckSchatten?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${d.stueckSchatten?'#1e1e2e':'#999'};">An</button>
          </div></div>`;
    } else if (modus === 'luecken') {
      const hs = ztHilfeStufe(d);
      out += pr(`Anzahl Symbole (1–${ZT_SYM_MAX})`, `<input type="number" min="1" max="${ZT_SYM_MAX}" value="${Math.min(ZT_SYM_MAX, d.anzahl||8)}" onchange="ztSet(${d.id},'anzahl',Math.max(1,Math.min(${ZT_SYM_MAX},+this.value||1)))">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
        ztHilfeSlider(d) +
        `<div style="font-size:11px;color:#aaa;margin-bottom:4px;">Die Symbole stehen rechts noch einmal mit Schreibfeld – dort wird die Zahl an der Stelle des Symbols eingetragen.</div>`;
    } else if (modus === 'einkreisen') {
      out += pr('Einzutragende Zahlen (kommagetrennt)',
        `<input value="${esc(d.circle||'')}" placeholder="z.B. 12, 34, 56" onchange="ztZiele(${d.id},this.value)">`) +
        pr('Anzahl (für Würfeln)', `<input type="number" min="1" max="40" value="${d.anzahl||8}" onchange="upd(${d.id},'anzahl',+this.value)">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Zufällige Zahlen</button>` +
        ztHilfeSlider(d);
    } else if (modus === 'voll') {
      const anzV = (d.versteckt || []).length;
      out += `<div style="font-size:11px;color:#888;margin:2px 0 6px;line-height:1.45;">Klicke in der Tafel auf eine Zahl, um sie aus- oder wieder einzublenden. Ausgeblendete Zahlen erscheinen beim Bearbeiten blass, in der Lösung blau.</div>`
        + (anzV ? `<button onclick="event.stopPropagation();ztAlleZeigen(${d.id})"
          style="margin:0 0 8px;width:100%;padding:6px;border:1.5px solid #ddd;border-radius:5px;background:#fff;
                 color:#555;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">Alle wieder einblenden (${anzV} ausgeblendet)</button>` : '');
    }

    out += `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${vtgl(size,'klein','Klein','groesse')}${vtgl(size,'mittel','Mittel','groesse')}${vtgl(size,'gross','Groß','groesse')}</div>
      </div>`;
    return out;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function ztRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  ztGenerate(w);
  render(); renderProps(id);
}

function ztSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  // Beim Moduswechsel sinnvolle Standard-Anzahl setzen.
  if (key === 'modus') w.anzahl = val === 'luecken' ? 8 : val === 'einkreisen' ? 8 : 6;
  ztGenerate(w);   // Modus/Anzahl → passend neu erzeugen
  render(); renderProps(id);
}

// Hilfe-Stufe ändern: Symbole bleiben, nur die vorgegebenen Zahlen neu
function ztHilfe(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.hilfe = val;
  if ((w.modus || 'luecken') === 'luecken' && !Array.isArray(w.blanks)) ztGenerate(w); else ztGenZeigen(w);
  render(); renderProps(id);
}

function ztHilfeSlider(d) {
  const hs = ztHilfeStufe(d);
  return `<div class="prow"><label>Ausgefüllte Zahlen (Hilfe)</label>
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="range" min="0" max="10" step="1" value="${hs}" style="flex:1;"
          oninput="this.parentElement.nextElementSibling.textContent=this.value+' – '+ZT_HILFE[this.value].t"
          onchange="ztHilfe(${d.id},+this.value)">
      </div>
      <div style="font-size:11px;color:#666;margin-top:2px;">${hs} – ${ZT_HILFE[hs].t}</div></div>`;
}
// Einzutragende Zahlen von Hand ändern → Zielfelder frei halten
function ztZiele(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.circle = val;
  ztGenZeigen(w);
  render(); renderProps(id);
}

// Hunderter wechseln: Aufgaben bleiben an ihrer Stelle, nur die Zahlen verschieben sich
function ztHunderter(id, h) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const alt = ztOff(w);
  const idx = ztParseNums(w.circle, alt);
  w.hunderter = h;
  if (w.circle != null && idx.length) w.circle = idx.map(n => n + ztOff(w)).join(', ');
  render(); renderProps(id);
}

// Eigene: einzelne Zahl aus-/einblenden
function ztToggle(id, num) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const v = new Set(w.versteckt || []);
  if (v.has(num)) v.delete(num); else v.add(num);
  w.versteckt = [...v].sort((a, b) => a - b);
  _dirty = true;
  render(); renderProps(id);
}
function ztAlleZeigen(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.versteckt = [];
  render(); renderProps(id);
}
