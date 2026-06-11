// Widget: Schriftliche Multiplikation

function smNoCarry(a, b) {
  return String(a).split("").every(d => +d * b < 10);
}

function smGenAufgabe(zahlenraum, modus, uebertrag) {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  let tries = 0;
  while (tries++ < 600) {
    let a, b;
    if (modus === 'zweistellig') {
      a = rand(Math.floor(zahlenraum / 10), zahlenraum - 1);
      b = rand(12, 99);
    } else {
      a = rand(Math.floor(zahlenraum / 10), zahlenraum - 1);
      b = rand(2, 9);
    }
    if (a * b > zahlenraum * 100) continue;
    if (modus === 'einstellig' && !uebertrag && !smNoCarry(a, b)) continue;
    return [a, b];
  }
  return modus === 'zweistellig' ? [123, 34] : [123, 4];
}

function smGen(count, zahlenraum, modus, uebertrag) {
  return Array.from({length: count}, () => smGenAufgabe(zahlenraum, modus, uebertrag));
}

// ── SVG helpers ───────────────────────────────────────────────────
function smPlace(digit, col, row, cs, color="#222", fs=14) {
  return `<text x="${col*cs+cs/2}" y="${row*cs+cs*0.67}" text-anchor="middle"
    font-family="'DidactGothic7',sans-serif" font-size="${fs}" font-weight="700" fill="${color}">${digit}</text>`;
}

function smGrid(cols, rows, thickLines, cs) {
  let g = "";
  for (let c = 0; c <= cols; c++)
    g += `<line x1="${c*cs}" y1="0" x2="${c*cs}" y2="${rows*cs}" stroke="#888" stroke-width="0.7"/>`;
  for (let r = 0; r <= rows; r++) {
    const thick = thickLines.includes(r);
    g += `<line x1="0" y1="${r*cs}" x2="${cols*cs}" y2="${r*cs}"
      stroke="${thick?'#333':'#888'}" stroke-width="${thick?2:0.7}"/>`;
  }
  return g;
}

// ── Einstellig ────────────────────────────────────────────────────
// Layout:
//  Row 0: [factor1 digits][×][factor2 digit]   ← Aufgabenzeile
//  ━━━ thick line ━━━
//  Row 1: Ergebnis
function smSvgEinstellig(a, b, showResult, cols, blueResult=false) {
  const cs = 20;
  const aCols = cols + 1;
  const aStr = String(a), bStr = String(b), pStr = String(a * b);
  const rows = 2;
  const W = aCols * cs, H = rows * cs;
  const grid = smGrid(aCols, rows, [1], cs);
  let texts = "";
  const xCol = aCols - 1 - bStr.length;
  aStr.split("").forEach((d, j) => texts += smPlace(d, xCol - aStr.length + j, 0, cs));
  texts += smPlace("×", xCol, 0, cs, "#555");
  bStr.split("").forEach((d, j) => texts += smPlace(d, xCol + 1 + j, 0, cs));
  if (showResult)
    pStr.split("").forEach((d, j) =>
      texts += smPlace(d, aCols - pStr.length + j, 1, cs, blueResult ? "#2563eb" : "#1a7f3c"));
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;">${grid}${texts}</svg>`;
}

// ── Zweistellig (Teilprodukte) ────────────────────────────────────
// Layout:
//  Row 0: [factor1][×][factor2]                ← Aufgabenzeile
//  ━━━ oberer Strich ━━━
//  Rows 1-4: leer (Schüler füllt Teilprodukte + Ergebnis selbst ein)
//            (kein unterer Strich – wird selbst gezeichnet)
function smSvgZweistellig(a, b, showResult, cols, blueResult=false) {
  const cs = 20;
  const aCols = cols + 1; // extra Spalte links
  const aStr = String(a), bStr = String(b), pStr = String(a * b);

  const emptyRows = 4; // feste 4 leere Reihen unter dem Strich
  const rows = 1 + emptyRows;
  const W = aCols * cs, H = rows * cs;

  // Nur oberer Strich, kein unterer
  const grid = smGrid(aCols, rows, [1], cs);
  let texts = "";

  // Row 0: factor1 × factor2
  const xCol = aCols - 1 - bStr.length;
  aStr.split("").forEach((d, j) =>
    texts += smPlace(d, xCol - aStr.length + j, 0, cs));
  texts += smPlace("×", xCol, 0, cs, "#555");
  bStr.split("").forEach((d, j) =>
    texts += smPlace(d, xCol + 1 + j, 0, cs));

  // Rows 1-4: leer – kein Inhalt (Schüler trägt ein)

  // Optional: Gesamtergebnis in letzter Zeile anzeigen
  if (showResult)
    pStr.split("").forEach((d, j) =>
      texts += smPlace(d, aCols - pStr.length + j, rows - 1, cs, blueResult ? "#2563eb" : "#1a7f3c"));

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;flex-shrink:0;">${grid}${texts}</svg>`;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"schriftlich_multiplikation", group:"rechnen", label:"Schriftl. Multiplikation", desc:"Schriftliche Multiplikation", icon:"⊠×", category:"mathematik" },

  createData: id => {
    const cfg = { zahlenraum:100, modus:"einstellig", uebertrag:false, loesung:false, anzahl:4 };
    return { id, type:"schriftlich_multiplikation", ...cfg,
      aufgaben: smGen(cfg.anzahl, cfg.zahlenraum, cfg.modus, cfg.uebertrag) };
  },

  render: d => {
    const modus   = d.modus || "einstellig";
    const aufgaben = d.aufgaben || smGen(d.anzahl||4, d.zahlenraum||100, modus, d.uebertrag||false);

    // Einheitliche Spaltenbreite: problem row AND result must fit
    const cols = Math.max(
      ...aufgaben.map(([a, b]) => String(a).length + 1 + String(b).length),
      ...aufgaben.map(([a, b]) => String(a * b).length)
    );

    const isActive = d.id === selId || _solutionsMode;
    const svgs = aufgaben.map(([a, b], i) => {
      const svg = modus === 'zweistellig'
        ? smSvgZweistellig(a, b, isActive, cols, isActive)
        : smSvgEinstellig(a, b, isActive, cols, isActive);
      return `<div style="display:inline-block;margin:0 4px 8px 0;">${svg}</div>`;
    });
    const itemW  = (cols + 1) * 20;
    const tasksHtml = `<div style="display:grid;grid-template-columns:repeat(auto-fill,${itemW}px);gap:4px 12px;justify-content:space-between;">${svgs.join("")}</div>`;
    if (!d.loesung) return tasksHtml;
    const answers = aufgaben.map(([a, b]) => String(a * b));
    const shuffled = answers.slice().sort(() => Math.random() - 0.5);
    return tasksHtml + `<div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;text-align:center;">
      <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-right:8px;">Lösungen:</span>
      ${shuffled.map(a => `<span style="font-family:'DidactGothic7',sans-serif;font-size:14px;color:#555;margin:0 6px;">${esc(a)}</span>`).join("")}
    </div>`;
  },

  renderProps: d => {
    const zr  = d.zahlenraum || 100;
    const mo  = d.modus      || "einstellig";
    const ue  = d.uebertrag  || false;
    const sl  = d.loesung    || false;
    const anz = d.anzahl     || 4;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Einstellig (Kl. 3)", mo==="einstellig", `smUpdProp(${d.id},'modus','einstellig')`)}
          ${toggleBtn("Zweistellig (Kl. 4)", mo==="zweistellig", `smUpdProp(${d.id},'modus','zweistellig')`)}
        </div></div>` +
      pr("Zahlenraum (erster Faktor)",
        `<select onchange="smUpdProp(${d.id},'zahlenraum',+this.value)">
          ${[100,1000,10000].map(n=>`<option value="${n}" ${zr===n?"selected":""}>${n}</option>`).join("")}
        </select>`) +
      (mo === 'einstellig' ? `<div class="prow"><label>Übertrag</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne", !ue, `smUpdProp(${d.id},'uebertrag',false)`)}
          ${toggleBtn("Mit",   ue, `smUpdProp(${d.id},'uebertrag',true)`)}
        </div></div>` : "") +
      pr("Anzahl Aufgaben",
        `<input type="number" min="1" max="12" value="${anz}" onchange="smUpdProp(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();smRoll(${d.id})"
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

// ── Helpers ───────────────────────────────────────────────────────
function smRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben = smGen(w.anzahl||4, w.zahlenraum||100, w.modus||"einstellig", w.uebertrag||false);
  render(); renderProps(id);
}

function smUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = smGen(w.anzahl||4, w.zahlenraum||100, w.modus||"einstellig", w.uebertrag||false);
  render(); renderProps(id);
}
