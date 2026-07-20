// Widget: Schriftliche Addition
function saNoCarry(zahlen) {
  const maxLen = Math.max(...zahlen.map(n => String(n).length));
  for (let pos = 0; pos < maxLen; pos++) {
    const colSum = zahlen.reduce((s, n) => {
      const str = String(n);
      return s + (str.length > pos ? +str[str.length - 1 - pos] : 0);
    }, 0);
    if (colSum >= 10) return false;
  }
  return true;
}

function saGenAufgabe(summanden, zahlenraum, uebertrag) {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  let tries = 0;
  while (tries++ < 600) {
    const zahlen = Array.from({length: summanden}, () => rand(1, zahlenraum - 1));
    if (zahlen.reduce((a, b) => a + b, 0) > zahlenraum) continue;
    if (!uebertrag && !saNoCarry(zahlen)) continue;
    return zahlen;
  }
  return summanden === 2 ? [10, 20] : [10, 20, 30];
}

function saGen(count, summanden, zahlenraum, uebertrag) {
  return Array.from({length: count}, () => saGenAufgabe(summanden, zahlenraum, uebertrag));
}

// Generate gaps for one aufgabe: at most one per column → always uniquely solvable
function saGenGaps(zahlen, cols, anzahlGaps) {
  const sum = zahlen.reduce((a, b) => a + b, 0);
  const allRows = [...zahlen.map(String), String(sum)];
  // Collect all (rowIdx, actualCol) positions, shuffle, pick with ≤1 per col
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

function saCalcCols(aufgaben) {
  const allNums = aufgaben.flatMap(z => [...z, z.reduce((a, b) => a + b, 0)]);
  return 1 + Math.max(...allNums.map(n => String(n).length));
}

function saSvg(zahlen, showResult, uid, cols, blueResult=false, gaps=[], cs=20, fs=14) {
  const sum = zahlen.reduce((a, b) => a + b, 0);
  const resultRowIdx = zahlen.length; // row index in allRows for result
  const rows = zahlen.length + 2;    // addends + carry row + result row
  const resultRow = rows - 1;
  const carryRow  = rows - 2;
  const W = cols * cs, H = rows * cs;

  // Gap lookup: "rowIdx,actualCol"
  const gapSet = new Set(gaps.map(([r, c]) => `${r},${c}`));
  const isGap = (rowIdx, actualCol) => gapSet.has(`${rowIdx},${actualCol}`);

  // Grid
  let grid = "";
  for (let c = 0; c <= cols; c++)
    grid += `<line x1="${c*cs}" y1="0" x2="${c*cs}" y2="${H}" stroke="#888" stroke-width="0.7"/>`;
  for (let r = 0; r <= rows; r++) {
    const thick = r === resultRow;
    grid += `<line x1="0" y1="${r*cs}" x2="${W}" y2="${r*cs}"
      stroke="${thick?'#333':'#888'}" stroke-width="${thick?2:0.7}"/>`;
  }

  const place = (digit, col, row, color="#222") =>
    `<text x="${col*cs+cs/2}" y="${row*cs+cs*0.67}" text-anchor="middle"
      font-family="'DidactGothic7',sans-serif" font-size="${fs}" font-weight="700" fill="${color}">${digit}</text>`;

  let texts = "";
  const gapRect = (col, row) =>
    `<rect x="${col*cs+0.5}" y="${row*cs+0.5}" width="${cs-1}" height="${cs-1}" fill="#e8e8e8"/>`;

  // Addend rows
  zahlen.forEach((n, rowIdx) => {
    if (rowIdx === zahlen.length - 1) texts += place("+", 0, rowIdx, "#555");
    String(n).split("").forEach((d, j) => {
      const col = cols - String(n).length + j;
      if (isGap(rowIdx, col)) {
        if (blueResult) texts += place(d, col, rowIdx, "#2563eb");
        else texts += gapRect(col, rowIdx);
      } else {
        texts += place(d, col, rowIdx);
      }
    });
  });

  // Carries + Result
  if (showResult) {
    const color = blueResult ? "#2563eb" : "#1a7f3c";
    // Carries
    const digitArrays = zahlen.map(n => String(n).split("").reverse().map(Number));
    const maxLen = Math.max(...digitArrays.map(a => a.length));
    let c = 0;
    for (let p = 0; p < maxLen; p++) {
      const colSum = digitArrays.reduce((s, a) => s + (a[p] || 0), 0) + c;
      c = Math.floor(colSum / 10);
      if (c > 0 && blueResult) { // only show carries in solution/active mode
        const carryCol = cols - 2 - p;
        if (carryCol > 0) texts += place(c, carryCol, carryRow, color);
      }
    }
    // Result
    String(sum).split("").forEach((d, j) => {
      const col = cols - String(sum).length + j;
      if (isGap(resultRowIdx, col)) {
        if (blueResult) texts += place(d, col, resultRow, "#2563eb");
        else texts += gapRect(col, resultRow);
      } else {
        texts += place(d, col, resultRow, gaps.length > 0 ? "#222" : color);
      }
    });
  }

  // Weiße Fläche hinter dem Gitter → Kästchen bleiben weiß, auch wenn der
  // Widget-Hintergrund gefärbt ist.
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;"><rect width="${W}" height="${H}" fill="#fff"/>${grid}${texts}</svg>`;
}

WIDGETS.push({
  meta: { type:"schriftlich_addition", group:"rechnen", label:"Schriftl. Addition", desc:"Schriftliche Addition", icon:"⊞+", category:"mathematik", itemsLayout: true },

  createData: id => {
    const cfg = { summanden:2, zahlenraum:100, uebertrag:false, loesung:false, anzahl:4, luecken:false,
      groesse:'klein', itemsPerRow:'auto', align:'auto', itemGap:'normal', aufgabenNr:0, aufgabenText:'' };
    return { id, type:"schriftlich_addition", ...cfg,
      aufgaben: saGen(cfg.anzahl, cfg.summanden, cfg.zahlenraum, cfg.uebertrag),
      aufgabenGaps: [] };
  },

  render: d => {
    const aufgaben = d.aufgaben || saGen(d.anzahl||4, d.summanden||2, d.zahlenraum||100, d.uebertrag||false);
    const cols = saCalcCols(aufgaben);
    const { cs, fs } = schriftlichSize(d);
    const isActive = d.id === selId || _solutionsMode;
    const luecken = d.luecken || false;
    const gaps = luecken ? (d.aufgabenGaps || []) : [];
    const svgs = aufgaben.map((zahlen, i) => {
      const g       = luecken ? (gaps[i] || []) : [];
      const showRes = luecken ? true : isActive;
      const blue    = isActive;
      return saSvg(zahlen, showRes, `${d.id}_${i}`, cols, blue, g, cs, fs);
    });
    const itemW    = cols * cs;
    const tasksHtml = atHtml(d) + flexDistribute(svgs, { itemW, d });
    if (!d.loesung || luecken) return tasksHtml;
    const answers = aufgaben.map(z => String(z.reduce((a, b) => a + b, 0)));
    const shuffled = mcShuffled(answers, d.id);
    return tasksHtml + `<div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;text-align:center;">
      <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-right:8px;">Lösungen:</span>
      ${shuffled.map(a => `<span style="font-family:'DidactGothic7',sans-serif;font-size:14px;color:#555;margin:0 6px;">${esc(a)}</span>`).join("")}
    </div>`;
  },

  renderProps: d => {
    const sm  = d.summanden  || 2;
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

    return pr("Summanden",
        `<select onchange="saUpdProp(${d.id},'summanden',+this.value)">
          <option value="2" ${sm===2?"selected":""}>2 Summanden</option>
          <option value="3" ${sm===3?"selected":""}>3 Summanden</option>
        </select>`) +
      pr("Zahlenraum",
        `<select onchange="saUpdProp(${d.id},'zahlenraum',+this.value)">
          ${[100,1000,10000].map(n=>`<option value="${n}" ${zr===n?"selected":""}>${n}</option>`).join("")}
        </select>`) +
      schriftlichGroesseBlock(d.id, d) +
      `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne", !ue, `saUpdProp(${d.id},'uebertrag',false)`)}
          ${toggleBtn("Mit",   ue, `saUpdProp(${d.id},'uebertrag',true)`)}
        </div></div>` +
      pr("Anzahl Aufgaben",
        `<input type="number" min="1" max="70" value="${anz}" onchange="saUpdProp(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();saRoll(${d.id})"
        style="margin-top:2px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>` +
      `<div class="prow"><label>Aufgabentyp</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Normal",        !lk, `saSetLuecken(${d.id},false)`)}
          ${toggleBtn("Lückenaufgaben", lk, `saSetLuecken(${d.id},true)`)}
        </div></div>` +
      (!lk ? `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` : '') ;
  },
});

// ── Schriftliche Addition helpers ─────────────────────────────────
function saRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben = saGen(w.anzahl||4, w.summanden||2, w.zahlenraum||100, w.uebertrag||false);
  if (w.luecken) {
    const cols = saCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => saGenGaps(z, cols, 3));
  }
  render(); renderProps(id);
}

function saUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = saGen(w.anzahl||4, w.summanden||2, w.zahlenraum||100, w.uebertrag||false);
  if (w.luecken) {
    const cols = saCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => saGenGaps(z, cols, 3));
  }
  render(); renderProps(id);
}

function saSetLuecken(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.luecken = val;
  if (val) {
    const cols = saCalcCols(w.aufgaben);
    w.aufgabenGaps = w.aufgaben.map(z => saGenGaps(z, cols, 3));
  } else {
    w.aufgabenGaps = [];
  }
  render(); renderProps(id);
}
