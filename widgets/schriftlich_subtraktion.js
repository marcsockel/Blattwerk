// Widget: Schriftliche Subtraktion

function ssNoBorrow(a, b) {
  const sa = String(a), sb = String(b).padStart(sa.length, '0');
  for (let i = 0; i < sa.length; i++)
    if (+sa[i] < +sb[i]) return false;
  return true;
}

function ssGenAufgabe(zahlenraum, uebertrag) {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  let tries = 0;
  while (tries++ < 600) {
    const a = rand(Math.floor(zahlenraum / 10), zahlenraum - 1);
    const b = rand(1, a - 1);
    if (!uebertrag && !ssNoBorrow(a, b)) continue;
    return [a, b];
  }
  return [zahlenraum - 1, Math.floor(zahlenraum / 10)];
}

function ssGen(count, zahlenraum, uebertrag) {
  return Array.from({length: count}, () => ssGenAufgabe(zahlenraum, uebertrag));
}

function ssCalcCols(aufgaben) {
  const allNums = aufgaben.flatMap(([a, b]) => [a, b, a - b]);
  return 1 + Math.max(...allNums.map(n => String(n).length));
}

// rowIdx: 0=minuend, 1=subtrahend, 2=result
function ssGenGaps(zahlen, cols, anzahlGaps) {
  const [a, b] = zahlen;
  const diff = a - b;
  const allRows = [String(a), String(b), String(diff)];
  const positions = [];
  allRows.forEach((numStr, rowIdx) => {
    numStr.split("").forEach((_, j) => {
      const actualCol = cols - numStr.length + j;
      positions.push([rowIdx, actualCol]);
    });
  });
  positions.sort(() => Math.random() - 0.5);
  const usedCols = new Set();
  const gaps = [];
  for (const pos of positions) {
    if (gaps.length >= anzahlGaps) break;
    const [, col] = pos;
    if (!usedCols.has(col)) { usedCols.add(col); gaps.push(pos); }
  }
  return gaps;
}

function ssSvg(zahlen, showResult, uid, cols, blueResult=false, gaps=[]) {
  const cs = 20;
  const [a, b] = zahlen;
  const diff = a - b;
  // rowIdx mapping: 0=minuend, 1=subtrahend, 2=result (SVG row 3)
  const SVG_RESULT_ROW = 3;
  const rows = 4; // minuend + subtrahend + borrow row + result
  const W = cols * cs, H = rows * cs;

  const gapSet = new Set(gaps.map(([r, c]) => `${r},${c}`));
  const isGap = (rowIdx, col) => gapSet.has(`${rowIdx},${col}`);

  // Grid
  let grid = "";
  for (let c = 0; c <= cols; c++)
    grid += `<line x1="${c*cs}" y1="0" x2="${c*cs}" y2="${H}" stroke="#888" stroke-width="0.7"/>`;
  for (let r = 0; r <= rows; r++) {
    const thick = r === SVG_RESULT_ROW;
    grid += `<line x1="0" y1="${r*cs}" x2="${W}" y2="${r*cs}"
      stroke="${thick?'#333':'#888'}" stroke-width="${thick?2:0.7}"/>`;
  }

  const place = (digit, col, row, color="#222") =>
    `<text x="${col*cs+cs/2}" y="${row*cs+cs*0.67}" text-anchor="middle"
      font-family="'DidactGothic7',sans-serif" font-size="14" font-weight="700" fill="${color}">${digit}</text>`;
  const gapRect = (col, row) =>
    `<rect x="${col*cs+0.5}" y="${row*cs+0.5}" width="${cs-1}" height="${cs-1}" fill="#e8e8e8"/>`;

  let texts = "";

  // Row 0: minuend
  String(a).split("").forEach((d, j) => {
    const col = cols - String(a).length + j;
    if (isGap(0, col)) {
      if (blueResult) texts += place(d, col, 0, "#2563eb");
      else texts += gapRect(col, 0);
    } else {
      texts += place(d, col, 0);
    }
  });

  // Row 1: subtrahend with − sign
  texts += place("−", 0, 1, "#555");
  String(b).split("").forEach((d, j) => {
    const col = cols - String(b).length + j;
    if (isGap(1, col)) {
      if (blueResult) texts += place(d, col, 1, "#2563eb");
      else texts += gapRect(col, 1);
    } else {
      texts += place(d, col, 1);
    }
  });

  // Row 2: borrows + Row 3: result
  if (showResult) {
    const color = blueResult ? "#2563eb" : "#1a7f3c";
    // Borrows (only in active/solution mode)
    if (blueResult) {
      const aDigits = String(a).split("").reverse().map(Number);
      const bDigits = String(b).split("").reverse().map(Number);
      let borrow = 0;
      for (let p = 0; p < aDigits.length; p++) {
        if (aDigits[p] - borrow < (bDigits[p] || 0)) {
          const borrowCol = cols - 2 - p;
          if (borrowCol > 0) texts += place(1, borrowCol, 2, color);
          borrow = 1;
        } else { borrow = 0; }
      }
    }
    // Result
    String(diff).split("").forEach((d, j) => {
      const col = cols - String(diff).length + j;
      if (isGap(2, col)) {
        if (blueResult) texts += place(d, col, SVG_RESULT_ROW, "#2563eb");
        else texts += gapRect(col, SVG_RESULT_ROW);
      } else {
        texts += place(d, col, SVG_RESULT_ROW, gaps.length > 0 ? "#222" : color);
      }
    });
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;">${grid}${texts}</svg>`;
}

WIDGETS.push({
  meta: { type:"schriftlich_subtraktion", group:"rechnen", label:"Schriftl. Subtraktion", desc:"Schriftliche Subtraktion", icon:"⊟−", category:"mathematik" },

  createData: id => {
    const cfg = { zahlenraum:100, uebertrag:false, loesung:false, anzahl:4, luecken:false };
    return { id, type:"schriftlich_subtraktion", ...cfg,
      aufgaben: ssGen(cfg.anzahl, cfg.zahlenraum, cfg.uebertrag), aufgabenGaps: [] };
  },

  render: d => {
    const aufgaben = d.aufgaben || ssGen(d.anzahl||4, d.zahlenraum||100, d.uebertrag||false);
    const cols = ssCalcCols(aufgaben);
    const isActive = d.id === selId || _solutionsMode;
    const luecken = d.luecken || false;
    const gaps = luecken ? (d.aufgabenGaps || []) : [];
    const svgs = aufgaben.map(([a, b], i) => {
      const g       = luecken ? (gaps[i] || []) : [];
      const showRes = luecken ? true : isActive;
      const blue    = isActive;
      return `<div style="display:inline-block;margin:0 4px 8px 0;">${ssSvg([a, b], showRes, `${d.id}_${i}`, cols, blue, g)}</div>`;
    });
    const itemW  = cols * 20;
    const tasksHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fill,${itemW}px);gap:4px 12px;justify-content:space-between;">${svgs.join("")}</div>`;
    if (!d.loesung || luecken) return tasksHtml;
    const answers = aufgaben.map(([a, b]) => String(a - b));
    const shuffled = answers.slice().sort(() => Math.random() - 0.5);
    return tasksHtml + `<div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;text-align:center;">
      <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-right:8px;">Lösungen:</span>
      ${shuffled.map(a => `<span style="font-family:'DidactGothic7',sans-serif;font-size:14px;color:#555;margin:0 6px;">${esc(a)}</span>`).join("")}
    </div>`;
  },

  renderProps: d => {
    const zr  = d.zahlenraum || 100;
    const ue  = d.uebertrag  || false;
    const sl  = d.loesung    || false;
    const anz = d.anzahl     || 4;
    const lk  = d.luecken    || false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return pr("Zahlenraum",
        `<select onchange="ssUpdProp(${d.id},'zahlenraum',+this.value)">
          ${[100,1000,10000].map(n=>`<option value="${n}" ${zr===n?"selected":""}>${n}</option>`).join("")}
        </select>`) +
      `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne", !ue, `ssUpdProp(${d.id},'uebertrag',false)`)}
          ${toggleBtn("Mit",   ue, `ssUpdProp(${d.id},'uebertrag',true)`)}
        </div></div>` +
      pr("Anzahl Aufgaben",
        `<input type="number" min="1" max="12" value="${anz}" onchange="ssUpdProp(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();ssRoll(${d.id})"
        style="margin-top:2px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>` +
      `<div class="prow"><label>Aufgabentyp</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Normal",         !lk, `ssSetLuecken(${d.id},false)`)}
          ${toggleBtn("Lückenaufgaben",  lk, `ssSetLuecken(${d.id},true)`)}
        </div></div>` +
      (!lk ? `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` : '');
  },
});

// ── Schriftliche Subtraktion helpers ──────────────────────────────
function ssRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben = ssGen(w.anzahl||4, w.zahlenraum||100, w.uebertrag||false);
  if (w.luecken) {
    const cols = ssCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => ssGenGaps(z, cols, 3));
  }
  render(); renderProps(id);
}

function ssUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = ssGen(w.anzahl||4, w.zahlenraum||100, w.uebertrag||false);
  if (w.luecken) {
    const cols = ssCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => ssGenGaps(z, cols, 3));
  }
  render(); renderProps(id);
}

function ssSetLuecken(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.luecken = val;
  if (val) {
    const cols = ssCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => ssGenGaps(z, cols, 3));
  } else {
    w.aufgabenGaps = [];
  }
  render(); renderProps(id);
}
