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

function ssSvg(zahlen, showResult, uid, cols) {
  const cs = 20;
  const [a, b] = zahlen;
  const diff = a - b;
  const rows = 4; // minuend + subtrahend + carry row + result
  const resultRow = rows - 1;
  const W = cols * cs;
  const H = rows * cs;

  // Grid
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

  // Row 0: minuend
  String(a).split("").forEach((d, j) => {
    const col = cols - String(a).length + j;
    texts += place(d, col, 0);
  });

  // Row 1: subtrahend with − sign
  texts += place("−", 0, 1, "#555");
  String(b).split("").forEach((d, j) => {
    const col = cols - String(b).length + j;
    texts += place(d, col, 1);
  });

  // Row 2: carry/borrow row — empty

  // Row 3: result
  if (showResult) {
    String(diff).split("").forEach((d, j) => {
      const col = cols - String(diff).length + j;
      texts += place(d, col, resultRow, "#1a7f3c");
    });
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;">${grid}${texts}</svg>`;
}

WIDGETS.push({
  meta: { type:"schriftlich_subtraktion", label:"Schriftl. Subtraktion", desc:"Schriftliche Subtraktion", icon:"⊟−", category:"mathematik" },

  createData: id => {
    const cfg = { zahlenraum:100, uebertrag:false, loesung:false, anzahl:4 };
    return { id, type:"schriftlich_subtraktion", ...cfg,
      aufgaben: ssGen(cfg.anzahl, cfg.zahlenraum, cfg.uebertrag) };
  },

  render: d => {
    const aufgaben = d.aufgaben || ssGen(d.anzahl||4, d.zahlenraum||100, d.uebertrag||false);
    const allNums = aufgaben.flatMap(([a, b]) => [a, b, a - b]);
    const maxDigits = Math.max(...allNums.map(n => String(n).length));
    const cols = 1 + maxDigits;
    const svgs = aufgaben.map(([a, b], i) =>
      `<div style="display:inline-block;margin:0 4px 8px 0;">${ssSvg([a, b], d.loesung||false, `${d.id}_${i}`, cols)}</div>`
    );
    return `<div style="display:flex;flex-wrap:wrap;gap:4px 12px;align-items:flex-start;">${svgs.join("")}</div>`;
  },

  renderProps: d => {
    const zr  = d.zahlenraum || 100;
    const ue  = d.uebertrag  || false;
    const sl  = d.loesung    || false;
    const anz = d.anzahl     || 4;

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
      `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>`;
  },
});

// ── Schriftliche Subtraktion helpers ──────────────────────────────
function ssRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben = ssGen(w.anzahl||4, w.zahlenraum||100, w.uebertrag||false);
  render(); renderProps(id);
}

function ssUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w[key] = val;
  w.aufgaben = ssGen(w.anzahl||4, w.zahlenraum||100, w.uebertrag||false);
  render(); renderProps(id);
}
