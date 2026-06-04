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

function saSvg(zahlen, showResult, uid, cols) {
  const cs = 20;
  const sum = zahlen.reduce((a, b) => a + b, 0);
  // rows: addends + 1 carry row + 1 result row
  const rows = zahlen.length + 2;
  const resultRow = rows - 1;
  const carryRow  = rows - 2;
  const W = cols * cs;
  const H = rows * cs;

  // Grid lines
  let grid = "";
  for (let c = 0; c <= cols; c++)
    grid += `<line x1="${c*cs}" y1="0" x2="${c*cs}" y2="${H}" stroke="#888" stroke-width="0.7"/>`;
  for (let r = 0; r <= rows; r++) {
    const isResultLine = r === resultRow;
    grid += `<line x1="0" y1="${r*cs}" x2="${W}" y2="${r*cs}"
      stroke="${isResultLine ? '#333' : '#888'}"
      stroke-width="${isResultLine ? 2 : 0.7}"/>`;
  }

  // Numbers and operator
  let texts = "";
  const place = (digit, col, row, color="#222") =>
    `<text x="${col*cs + cs/2}" y="${row*cs + cs*0.67}"
      text-anchor="middle" font-family="'DidactGothic7',sans-serif"
      font-size="14" font-weight="700" fill="${color}">${digit}</text>`;

  zahlen.forEach((n, rowIdx) => {
    // + sign on last addend row
    if (rowIdx === zahlen.length - 1)
      texts += place("+", 0, rowIdx, "#555");

    String(n).split("").forEach((d, j) => {
      const col = cols - String(n).length + j;
      texts += place(d, col, rowIdx);
    });
  });

  // Result
  if (showResult) {
    String(sum).split("").forEach((d, j) => {
      const col = cols - String(sum).length + j;
      texts += place(d, col, resultRow, "#1a7f3c");
    });
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;">${grid}${texts}</svg>`;
}

WIDGETS.push({
  meta: { type:"schriftlich_addition", label:"Schriftl. Addition", desc:"Schriftliche Addition", icon:"⊞+", category:"mathematik" },

  createData: id => {
    const cfg = { summanden:2, zahlenraum:100, uebertrag:false, loesung:false, anzahl:4 };
    return { id, type:"schriftlich_addition", ...cfg,
      aufgaben: saGen(cfg.anzahl, cfg.summanden, cfg.zahlenraum, cfg.uebertrag) };
  },

  render: d => {
    const aufgaben = d.aufgaben || saGen(d.anzahl||4, d.summanden||2, d.zahlenraum||100, d.uebertrag||false);
    // Einheitliche Spaltenbreite für alle Aufgaben
    const allNums = aufgaben.flatMap(z => [...z, z.reduce((a,b)=>a+b,0)]);
    const maxDigits = Math.max(...allNums.map(n => String(n).length));
    const cols = 1 + maxDigits; // col 0: operator
    const svgs = aufgaben.map((zahlen, i) =>
      `<div style="display:inline-block;margin:0 4px 8px 0;">${saSvg(zahlen, d.loesung||false, `${d.id}_${i}`, cols)}</div>`
    );
    return `<div style="display:flex;flex-wrap:wrap;gap:4px 12px;align-items:flex-start;">${svgs.join("")}</div>`;
  },

  renderProps: d => {
    const sm  = d.summanden  || 2;
    const zr  = d.zahlenraum || 100;
    const ue  = d.uebertrag  || false;
    const sl  = d.loesung    || false;
    const anz = d.anzahl     || 4;

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
      `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne", !ue, `saUpdProp(${d.id},'uebertrag',false)`)}
          ${toggleBtn("Mit",   ue, `saUpdProp(${d.id},'uebertrag',true)`)}
        </div></div>` +
      pr("Anzahl Aufgaben",
        `<input type="number" min="1" max="12" value="${anz}" onchange="saUpdProp(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();saRoll(${d.id})"
        style="margin-top:2px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>` +
      `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>`;
  },
});

// ── Schriftliche Addition helpers ─────────────────────────────────
function saRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben = saGen(w.anzahl||4, w.summanden||2, w.zahlenraum||100, w.uebertrag||false);
  render(); renderProps(id);
}

function saUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w[key] = val;
  w.aufgaben = saGen(w.anzahl||4, w.summanden||2, w.zahlenraum||100, w.uebertrag||false);
  render(); renderProps(id);
}
