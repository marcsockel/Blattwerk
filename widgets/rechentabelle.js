// Widget: Rechentabelle (Funktionstabelle)
// Ecke oben links = Rechenart. Obere Zeile = Spalten-Randzahlen, linke Spalte =
// Zeilen-Randzahlen (beide grau, vorgegeben). Innenzelle = Zeilenrandzahl ⊙
// Spaltenrandzahl  („beginne immer mit der linken Randzahl").
// Innenzellen bleiben leer; im Auswahl-/Lösungsmodus erscheinen sie blau.

function rtRand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rtGcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
function rtLcm(a, b) { return a / rtGcd(a, b) * b; }
function rtLcmArr(arr) { return arr.reduce((x, y) => rtLcm(x, y), 1); }

function rtPickDistinct(count, min, max) {
  const pool = [];
  for (let v = min; v <= max; v++) pool.push(v);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Math.min(count, pool.length));
}

// Kein Zehnerübergang (analog arithmetic.js noCarry); a = (Minuend/Summand1)
function rtNoCarry(a, b, op) {
  let aa = a, bb = b;
  if (op === '+') { while (aa > 0 || bb > 0) { if ((aa % 10) + (bb % 10) >= 10) return false; aa = Math.floor(aa / 10); bb = Math.floor(bb / 10); } return true; }
  if (op === '-') { while (aa > 0 || bb > 0) { if ((aa % 10) < (bb % 10)) return false; aa = Math.floor(aa / 10); bb = Math.floor(bb / 10); } return true; }
  return true;
}

// Prüft, ob jede Innenzelle row ⊙ col gültig ist.
function rtValid(op, zr, ue, cols, rows) {
  if (!cols.length || !rows.length) return false;
  for (const r of rows) for (const c of cols) {
    let v;
    if (op === '+') v = r + c; else if (op === '-') v = r - c; else if (op === '*') v = r * c; else v = r / c;
    if (op === '-' && v < 0) return false;
    if ((op === '+' || op === '*') && v > zr) return false;
    if (op === '/' && (c === 0 || !Number.isInteger(v))) return false;
    if (!ue && (op === '+' || op === '-') && !rtNoCarry(r, c, op)) return false;
  }
  return true;
}

// Zahlen, deren Ziffern alle in [lo,hi] liegen.
function rtDigitsIn(n, lo, hi) {
  if (n === 0) return lo <= 0;
  while (n > 0) { const dg = n % 10; if (dg < lo || dg > hi) return false; n = Math.floor(n / 10); }
  return true;
}
function rtPoolDigits(min, max, lo, hi) {
  const p = []; for (let v = min; v <= max; v++) if (rtDigitsIn(v, lo, hi)) p.push(v); return p;
}
function rtTake(pool, count) {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, Math.min(count, a.length));
}

// Konstruktiv übergangsfrei (für großen Zahlenraum ohne Zehnerübergang):
//  +: Spalten-Ziffern ≤4, Zeilen-Ziffern ≤5 → Ziffernsumme ≤9 (kein Übertrag).
//  −: Subtrahend-Ziffern ≤4, Minuend-Ziffern ≥5 → keine Entleihung, r≥c.
function rtConstructNoCarry(op, zr, ncol, nrow) {
  if (op === '+') {
    const cols = rtTake(rtPoolDigits(1, Math.floor(zr * 0.45), 0, 4), ncol);
    const rows = rtTake(rtPoolDigits(1, Math.floor(zr * 0.5), 0, 5), nrow);
    return { cols, rows };
  }
  // '-'
  const cols = rtTake(rtPoolDigits(1, Math.floor(zr * 0.45), 0, 4), ncol);
  const rows = rtTake(rtPoolDigits(Math.floor(zr * 0.5), zr, 5, 9), nrow);
  return { cols, rows };
}

// Garantiert gültige, einfache Tabelle (letzter Rückfall, jeder Zahlenraum ≥10).
function rtSingleDigit(op, zr, ncol, nrow) {
  if (op === '+') return { cols: rtTake([0, 1, 2, 3, 4], ncol), rows: rtTake([1, 2, 3, 4, 5], nrow) };
  if (op === '-') return { cols: rtTake([0, 1, 2, 3, 4], ncol), rows: rtTake([5, 6, 7, 8, 9], nrow) };
  if (op === '*') return { cols: rtTake([1, 2, 3, 4, 5], ncol), rows: rtTake([1, 2, 3, 4, 5], nrow) };
  const cols = rtTake([1, 2, 3], ncol); const L = rtLcmArr(cols.length ? cols : [1]);
  return { cols: cols.length ? cols : [1], rows: rtTake([1, 2, 3, 4, 5, 6].map(m => L * m), nrow) };
}

// Erzeugt eine Tabelle: { cols:[obere Randzahlen], rows:[linke Randzahlen] }
// sodass jede Innenzelle row ⊙ col gültig ist. Gibt IMMER eine gültige Tabelle zurück.
function rtMakeTable(op, zr, ncol, nrow, ue) {
  let best = null;
  for (let t = 0; t < 600; t++) {
    let cols, rows;
    if (op === '+') {
      cols = rtPickDistinct(ncol, 1, Math.max(1, Math.floor(zr * 0.7)));
      const mc = Math.max(...cols);
      rows = rtPickDistinct(nrow, 1, Math.max(1, zr - mc));
    } else if (op === '-') {
      cols = rtPickDistinct(ncol, 1, Math.max(1, Math.floor(zr / 2)));
      const mc = Math.max(...cols);
      rows = rtPickDistinct(nrow, mc, zr);
    } else if (op === '*') {
      const cmax = Math.max(2, Math.min(10, Math.floor(Math.sqrt(zr)) + 3));
      cols = rtPickDistinct(ncol, 1, cmax);
      const mc = Math.max(...cols);
      rows = rtPickDistinct(nrow, 1, Math.max(1, Math.floor(zr / mc)));
    } else { // '/'
      cols = rtPickDistinct(ncol, 2, Math.max(2, Math.min(9, Math.floor(zr / 2))));
      const L = rtLcmArr(cols);
      const maxM = Math.floor(zr / L);
      if (maxM < 1) continue;
      rows = rtPickDistinct(nrow, 1, maxM).map(m => L * m);
    }
    if (rtValid(op, zr, ue, cols, rows)) {
      if (cols.length === ncol && rows.length === nrow) return { cols, rows };
      if (!best || cols.length * rows.length > best.cols.length * best.rows.length) best = { cols, rows };
    }
  }
  if (best) return best;
  // Konstruktiver Rückfall (v.a. großer Zahlenraum ohne Zehnerübergang)
  if (!ue && (op === '+' || op === '-')) {
    const cons = rtConstructNoCarry(op, zr, ncol, nrow);
    if (rtValid(op, zr, ue, cons.cols, cons.rows)) return cons;
  }
  return rtSingleDigit(op, zr, ncol, nrow);
}

function rtDoGenerate(w) {
  const op  = w.op || '+';
  const zr  = w.zahlenraum || 20;
  const nc  = Math.max(1, Math.min(5, w.spalten || 2));
  const nr  = Math.max(1, Math.min(6, w.zeilen  || 3));
  const ue  = w.ueberschreitung || false;
  const anz = Math.max(1, w.anzahl || 2);
  w.tables = Array.from({ length: anz }, () => rtMakeTable(op, zr, nc, nr, ue));
}

const RT_SYM = { '+': '+', '-': '−', '*': '·', '/': '÷' };

function rtTableHtml(tbl, d) {
  const op = d.op || '+';
  const sym = RT_SYM[op] || '+';
  const big = (d.groesse || 'gross') !== 'klein';
  const cw = big ? 42 : 30, fs = big ? 17 : 13;
  const cwW = Math.round(cw * 1.25); // Felder 1/4 breiter als hoch
  const isActive = d.id === selId || _solutionsMode;
  const hbg = '#e3e3e3';
  const base = `border:1.5px solid #333;width:${cwW}px;height:${cw}px;text-align:center;vertical-align:middle;`
             + `font-family:'DidactGothic7',sans-serif;font-size:${fs}px;padding:0;`;
  const calc = (r, c) => op === '+' ? r + c : op === '-' ? r - c : op === '*' ? r * c : r / c;

  let html = `<table style="border-collapse:collapse;">`;
  html += `<tr><td style="${base}background:${hbg};font-weight:700;">${sym}</td>`;
  tbl.cols.forEach(c => { html += `<td style="${base}background:${hbg};font-weight:700;">${c}</td>`; });
  html += `</tr>`;
  tbl.rows.forEach(r => {
    html += `<tr><td style="${base}background:${hbg};font-weight:700;">${r}</td>`;
    tbl.cols.forEach(c => {
      const val = isActive ? `<span style="color:#2563eb;font-weight:700;">${calc(r, c)}</span>` : '';
      html += `<td style="${base}background:#fff;">${val}</td>`;
    });
    html += `</tr>`;
  });
  html += `</table>`;
  return html;
}

WIDGETS.push({
  meta: { type:'rechentabelle', label:'Rechentabelle', desc:'Funktionstabelle (Plus, Minus, Mal, Geteilt)', icon:'▦', category:'mathematik' },

  createData: id => {
    const w = {
      id, type:'rechentabelle',
      op:'+', zahlenraum:20, ueberschreitung:false,
      groesse:'gross', spalten:2, zeilen:3, anzahl:2,
      aufgabenNr:0, aufgabenText:'',
    };
    rtDoGenerate(w);
    return w;
  },

  render: d => {
    const tables = d.tables || [];
    const big = (d.groesse || 'gross') !== 'klein';
    const cw = big ? 42 : 30;
    const cwW = Math.round(cw * 1.25); // Felder 1/4 breiter als hoch
    const ncol = Math.max(1, Math.min(5, d.spalten || 2));
    const itemW = (ncol + 1) * cwW + 4;
    const cells = tables.map(t =>
      `<div style="width:${itemW}px;margin-bottom:14px;flex-shrink:0;">${rtTableHtml(t, d)}</div>`
    ).join('');
    const spacers = Array(6).fill(`<div style="height:0;width:${itemW}px;flex-shrink:0;flex-grow:0;"></div>`).join('');
    return atHtml(d) +
      `<div style="display:flex;column-gap:28px;row-gap:0;flex-wrap:wrap;justify-content:space-between;">${cells}${spacers}</div>`;
  },

  renderProps: d => {
    const op   = d.op || '+';
    const zr   = d.zahlenraum || 20;
    const ue   = d.ueberschreitung || false;
    const size = d.groesse || 'gross';
    const nc   = d.spalten || 2;
    const nr   = d.zeilen || 3;
    const anz  = d.anzahl || 2;

    const opBtn = (val, label) => {
      const active = op === val;
      return `<button onclick="event.stopPropagation();rtSet(${d.id},'op','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:14px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    };
    const tgl = (cur, val, label, key) => {
      const active = cur === val;
      return `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    };

    return `
      <div class="prow"><label>Rechenart</label>
        <div style="display:flex;gap:4px;">
          ${opBtn('+','+')}${opBtn('-','−')}${opBtn('*','·')}${opBtn('/','÷')}
        </div>
      </div>` +
      pr('Zahlenraum (Ergebnis)',
        `<select onchange="rtSet(${d.id},'zahlenraum',+this.value)">
          ${[10,20,100,1000].map(n=>`<option value="${n}" ${zr===n?'selected':''}>${n}</option>`).join('')}
        </select>`) +
      ((op === '+' || op === '-')
        ? `<div class="prow"><label>Zehnerübergang</label>
        <label style="display:flex;align-items:center;gap:5px;font-weight:400;cursor:pointer;">
          <input type="checkbox" ${ue?'checked':''} onchange="rtSet(${d.id},'ueberschreitung',this.checked)">
          erlaubt
        </label>
      </div>`
        : '') +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${tgl(size,'klein','Klein','groesse')}
          ${tgl(size,'gross','Groß','groesse')}
        </div>
      </div>` +
      pr('Spalten (obere Randzahlen)',
        `<input type="number" min="1" max="5" value="${nc}" onchange="rtSet(${d.id},'spalten',+this.value)">`) +
      pr('Zeilen (linke Randzahlen)',
        `<input type="number" min="1" max="6" value="${nr}" onchange="rtSet(${d.id},'zeilen',+this.value)">`) +
      pr('Anzahl Tabellen',
        `<input type="number" min="1" max="24" value="${anz}" onchange="rtSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();rtGenerate(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
// Strukturelle Änderung → neu generieren.
function rtSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  rtDoGenerate(w);
  render(); renderProps(id);
}

function rtGenerate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  rtDoGenerate(w);
  render(); renderProps(id);
}
