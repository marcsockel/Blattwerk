// Widget: Zahlentafel (Hundertertafel 1–100)
// Modi (Schritt 1): „Lücken ausfüllen" und „Einkreisen".
//   Lücken:    volle Tafel, einige Felder leer → Kind trägt ein (Lösung blau).
//   Einkreisen: Zahlen aus einem Textfeld sollen auf der Tafel eingekreist werden;
//               im Auswahl-/Lösungsmodus werden sie blau umkreist.
// (Stücke-Modus folgt als zweiter Schritt: L-/H-/Plus-/Diagonale-Ausschnitte.)

function ztRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// count verschiedene Zahlen aus 1..100 (aufsteigend).
function ztRandNums(count) {
  const pool = [];
  for (let i = 1; i <= 100; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.max(0, Math.min(100, count))).sort((a, b) => a - b);
}

// "12, 34 56" → [12,34,56] (1..100, eindeutig)
function ztParseNums(str) {
  const seen = new Set(), out = [];
  (str || '').split(/[^0-9]+/).forEach(s => {
    if (!s) return;
    const n = parseInt(s, 10);
    if (n >= 1 && n <= 100 && !seen.has(n)) { seen.add(n); out.push(n); }
  });
  return out;
}

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
  const big = (d.groesse || 'gross') !== 'klein';
  const o = d.schatten ? (big ? 3 : 2) : 0;     // gezeichneter Schatten, Versatz nach Größe
  const W = (p.maxdc + 1) * cs + 2 * m + o, H = (p.maxdr + 1) * cs + 2 * m + o;
  let shadow = '', rects = '', texts = '';
  p.cells.forEach(([dr, dc], i) => {
    const x = m + dc * cs, y = m + dr * cs;
    const num = (p.R + dr) * 10 + (p.C + dc) + 1;
    const given = i === p.givenIdx;
    if (o) shadow += `<rect x="${x + o}" y="${y + o}" width="${cs}" height="${cs}" fill="#000" fill-opacity="0.18"/>`;
    rects += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${given ? '#eef4ff' : '#fff'}" stroke="#555" stroke-width="1.4"/>`;
    if (given || isActive) {
      texts += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${fs}" font-weight="${given ? 700 : 400}" fill="${given ? '#222' : '#2563eb'}">${num}</text>`;
    }
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${shadow}${rects}${texts}</svg>`;
}

function ztPiecesHtml(d) {
  const big = (d.groesse || 'gross') !== 'klein';
  const cs = big ? 36 : 26;          // etwas kleiner → Gruppen-/Rahmen-Padding kippt nicht mehr ein Stück raus
  // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Feste Slot-Größe.
  const slot = 4 * cs;
  return flexDistribute(
    (d.pieces || []).map(p => ztPieceSvg(p, d, cs)),
    { itemSize: `width:${slot}px;height:${slot}px;display:flex;align-items:center;justify-content:center;`, itemW: slot, d }
  );
}

function ztGenerate(w) {
  const modus = w.modus || 'luecken';
  if (modus === 'luecken') w.blanks = ztRandNums(w.anzahl || 15);
  else if (modus === 'einkreisen') w.circle = ztRandNums(w.anzahl || 8).join(', ');
  else if (modus === 'stuecke') ztGenPieces(w);
  // 'voll': nichts zu erzeugen
}

function ztChartSvg(d) {
  const big = (d.groesse || 'gross') !== 'klein';
  const cs = big ? 34 : 25, fs = big ? 15 : 12, m = 1.5;
  const W = 10 * cs + 2 * m;
  const isActive = d.id === selId || _solutionsMode;
  const modus = d.modus || 'luecken';
  const blanks = new Set(modus === 'luecken' ? (d.blanks || []) : []);
  const circles = new Set(modus === 'einkreisen' ? ztParseNums(d.circle) : []);
  const ff = "'DidactGothic7',sans-serif";

  let g = '';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const num = r * 10 + c + 1;
      const x = m + c * cs, y = m + r * cs;
      g += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="#fff" stroke="#999" stroke-width="1"/>`;
      const blank = blanks.has(num);
      const show = !blank || isActive;
      if (show) {
        const col = blank ? '#2563eb' : '#222';
        g += `<text x="${x + cs / 2}" y="${y + cs / 2}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${fs}" fill="${col}">${num}</text>`;
      }
      if (circles.has(num) && isActive) {
        g += `<ellipse cx="${x + cs / 2}" cy="${y + cs / 2}" rx="${cs * 0.42}" ry="${cs * 0.40}" fill="none" stroke="#2563eb" stroke-width="2"/>`;
      }
    }
  }
  // 5er-Hilfslinien (etwas kräftiger) + Außenrahmen
  const L = m + 5 * cs;
  g += `<line x1="${L}" y1="${m}" x2="${L}" y2="${m + 10 * cs}" stroke="#555" stroke-width="1.4"/>`;
  g += `<line x1="${m}" y1="${L}" x2="${m + 10 * cs}" y2="${L}" stroke="#555" stroke-width="1.4"/>`;
  g += `<rect x="${m}" y="${m}" width="${10 * cs}" height="${10 * cs}" fill="none" stroke="#333" stroke-width="1.8"/>`;
  return `<svg viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

WIDGETS.push({
  meta: { type:'zahlentafel', label:'Zahlentafel', desc:'Hundertertafel 1–100', icon:'🔢', category:'mathematik', itemsLayout: true },

  createData: id => {
    const w = {
      id, type:'zahlentafel',
      modus:'luecken', anzahl:15, circle:'', groesse:'gross', align:'auto', itemGap:'normal',
      itemsPerRow:'auto', schatten:false,
      aufgabenNr:0, aufgabenText:'',
    };
    ztGenerate(w);
    return w;
  },

  render: d => {
    const modus = d.modus || 'luecken';
    const L = typeof itemsLayoutProps === 'function' ? itemsLayoutProps(d) : { align: 'left' };
    const chartAlign = ['left', 'center', 'right'].includes(L.align) ? L.align : 'left';
    if (modus === 'stuecke') {
      if (!Array.isArray(d.pieces)) ztGenerate(d);
      return atHtml(d) + ztPiecesHtml(d);
    }
    if (modus === 'luecken' && !Array.isArray(d.blanks)) ztGenerate(d);
    let head = '';
    if (modus === 'einkreisen') {
      const nums = ztParseNums(d.circle);
      head = `<div style="font-size:13px;margin-bottom:7px;font-family:'DidactGothic7',sans-serif;">
        Kreise ein:&nbsp; <b>${nums.length ? nums.join(',&nbsp; ') : '—'}</b></div>`;
    }
    return atHtml(d) +
      `<div style="text-align:${chartAlign};">${head}<div style="display:inline-block;text-align:left;">${ztChartSvg(d)}</div></div>`;
  },

  renderProps: d => {
    const modus = d.modus || 'luecken';
    const size = d.groesse || 'gross';
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

    let out = `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${tgl(modus,'luecken','Lücken','modus')}
          ${tgl(modus,'einkreisen','Einkreisen','modus')}
          ${tgl(modus,'stuecke','Stücke','modus')}
          ${tgl(modus,'voll','Vollständig','modus')}
        </div></div>`;

    if (modus === 'stuecke') {
      out += pr('Anzahl Stücke', `<input type="number" min="1" max="24" value="${d.anzahl||6}" onchange="ztSet(${d.id},'anzahl',+this.value)">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Stücke neu würfeln</button>
        <div style="font-size:11px;color:#aaa;margin-bottom:4px;">Formen: Plus/Kreuz, L, H, T, U, O, Diagonale, Treppe, X, Z … (zufällig). Ein Feld ist vorgegeben, der Rest wird über die Tafel-Logik ergänzt.</div>
        <div class="prow"><label>Schatten</label>
          <div style="display:flex;gap:4px;">
            <button onclick="event.stopPropagation();upd(${d.id},'schatten',false)" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${!d.schatten?'#89b4fa':'#ddd'};background:${!d.schatten?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${!d.schatten?'#1e1e2e':'#999'};">Aus</button>
            <button onclick="event.stopPropagation();upd(${d.id},'schatten',true)" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${d.schatten?'#89b4fa':'#ddd'};background:${d.schatten?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${d.schatten?'#1e1e2e':'#999'};">An</button>
          </div></div>`;
    } else if (modus === 'luecken') {
      out += pr('Anzahl Lücken', `<input type="number" min="1" max="90" value="${d.anzahl||15}" onchange="ztSet(${d.id},'anzahl',+this.value)">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Lücken neu würfeln</button>`;
    } else if (modus === 'einkreisen') {
      out += pr('Einzukreisende Zahlen (kommagetrennt)',
        `<input value="${esc(d.circle||'')}" placeholder="z.B. 12, 34, 56" onchange="upd(${d.id},'circle',this.value)">`) +
        pr('Anzahl (für Würfeln)', `<input type="number" min="1" max="40" value="${d.anzahl||8}" onchange="upd(${d.id},'anzahl',+this.value)">`) +
        `<button onclick="event.stopPropagation();ztRoll(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Zufällige Zahlen</button>`;
    }

    out += `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${vtgl(size,'klein','Klein','groesse')}${vtgl(size,'gross','Groß','groesse')}</div>
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
  if (key === 'modus') w.anzahl = val === 'luecken' ? 15 : val === 'einkreisen' ? 8 : 6;
  ztGenerate(w);   // Modus/Anzahl → passend neu erzeugen
  render(); renderProps(id);
}
