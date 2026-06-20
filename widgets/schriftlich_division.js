// Widget: Schriftliche Division

// ── Berechnung ────────────────────────────────────────────────────
function sdCalcSteps(a, b) {
  const aStr = String(a);
  const steps = [];
  let current = 0;
  for (let i = 0; i < aStr.length; i++) {
    current = current * 10 + parseInt(aStr[i]);
    if (current < b && i < aStr.length - 1) continue;
    const qDigit = Math.floor(current / b);
    steps.push({ rightCol: i, current, qDigit, prod: qDigit * b, rem: current % b });
    current = current % b;
  }
  return steps;
}

// teiler: 0 = zufällig einstellig (2–9), -1 = zufällig zweistellig (10–99), >0 = fest
function sdGenAufgabe(zahlenraum, teiler, mitRest) {
  const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const minA  = Math.floor(zahlenraum / 10);
  const maxA  = zahlenraum - 1;
  let tries = 0;
  while (tries++ < 600) {
    const b = teiler === 0  ? rand(2, 9)
            : teiler === -1 ? rand(10, 99)
            : teiler;
    const minQ = Math.ceil(minA / b);
    const maxQ = Math.floor(maxA / b);
    if (minQ > maxQ) continue;
    const q = rand(minQ, maxQ);
    const r = mitRest ? rand(1, b - 1) : 0;
    const a = q * b + r;
    if (a < minA || a > maxA) continue;
    if (sdCalcSteps(a, b).length > 0) return [a, b];
  }
  const fb = teiler > 1 ? teiler : (teiler === -1 ? 12 : 4);
  return [Math.floor(maxA / fb) * fb, fb];
}

function sdGen(count, zahlenraum, teiler, mitRest) {
  return Array.from({ length: count }, () => sdGenAufgabe(zahlenraum, teiler, mitRest));
}

// ── SVG ───────────────────────────────────────────────────────────
function sdPlace(ch, col, row, cs, color = '#222') {
  return `<text x="${col * cs + cs / 2}" y="${row * cs + cs * 0.67}" text-anchor="middle"
    font-family="'DidactGothic7',sans-serif" font-size="14" font-weight="700" fill="${color}">${ch}</text>`;
}

/**
 * SVG für eine Divisionsaufgabe.
 * forceSteps: Mindestanzahl Schritte (für einheitliche Höhe aller Aufgaben im Widget).
 * forceCols:  Mindestanzahl Spalten (für einheitliche Breite).
 */
function sdSvg(a, b, showResult, blueResult, forceCols, forceSteps, showLinien) {
  const cs     = 20;
  const aStr   = String(a);
  const bStr   = String(b);
  const q      = Math.floor(a / b);
  const qStr   = String(q);
  const rFinal = a % b;
  const rStr   = String(rFinal);
  const aLen   = aStr.length;
  const bLen   = bStr.length;
  const qLen   = qStr.length;
  const steps  = sdCalcSteps(a, b);
  const n      = steps.length;
  const dispN  = forceSteps ? Math.max(n, forceSteps) : n; // angezeigte Schritte (ggf. gepaddet)
  const hasMitRest = rFinal > 0;

  // Spalten: [dividend][':'][divisor]['='][quotient]( R [rest])
  const natCols   = aLen + 1 + bLen + 1 + qLen + (hasMitRest ? 2 + rStr.length : 0);
  const totalCols = forceCols ? Math.max(natCols, forceCols) : natCols;
  const totalRows = 1 + 2 * dispN;

  const W = totalCols * cs;
  const H = totalRows * cs;

  // ── Vollflächiges Gitter ──────────────────────────────────────
  let grid = '';
  for (let c = 0; c <= totalCols; c++)
    grid += `<line x1="${c*cs}" y1="0" x2="${c*cs}" y2="${H}" stroke="#bbb" stroke-width="0.7"/>`;
  for (let r = 0; r <= totalRows; r++)
    grid += `<line x1="0" y1="${r*cs}" x2="${W}" y2="${r*cs}" stroke="#bbb" stroke-width="0.7"/>`;

  let texts = '';
  let thickLines = '';

  // ── Kopfzeile ─────────────────────────────────────────────────
  aStr.split('').forEach((d, i) => { texts += sdPlace(d, i, 0, cs); });
  texts += sdPlace(':', aLen, 0, cs, '#555');
  bStr.split('').forEach((d, i) => { texts += sdPlace(d, aLen + 1 + i, 0, cs); });
  texts += sdPlace('=', aLen + 1 + bLen, 0, cs, '#555');

  const qStartCol = aLen + bLen + 2;
  if (showResult) {
    const qColor = blueResult ? '#2563eb' : '#1a7f3c';
    qStr.split('').forEach((d, i) => { texts += sdPlace(d, qStartCol + i, 0, cs, qColor); });
    if (hasMitRest) {
      const rColor = blueResult ? '#2563eb' : '#d97706';
      texts += sdPlace('R', qStartCol + qLen + 1, 0, cs, rColor);
      rStr.split('').forEach((d, i) => { texts += sdPlace(d, qStartCol + qLen + 2 + i, 0, cs, rColor); });
    }
  }

  // ── Schritte ──────────────────────────────────────────────────
  steps.forEach((step, si) => {
    const rowProd = 1 + si * 2;
    const rowNext = 2 + si * 2;
    const lineY   = rowNext * cs;
    const leftC   = Math.max(0, step.rightCol - String(step.current).length + 1);

    if (showLinien)
      thickLines += `<line x1="${leftC * cs}" y1="${lineY}" x2="${(step.rightCol + 1) * cs}" y2="${lineY}"
        stroke="#333" stroke-width="2"/>`;

    if (!showResult) return;

    const showColor = blueResult ? '#2563eb' : '#888';

    const prodStr = String(step.prod);
    prodStr.split('').forEach((d, j) => {
      texts += sdPlace(d, step.rightCol - prodStr.length + 1 + j, rowProd, cs, showColor);
    });

    if (si < n - 1) {
      const nextStep = steps[si + 1];
      const currStr  = String(nextStep.current);
      currStr.split('').forEach((d, j) => {
        texts += sdPlace(d, nextStep.rightCol - currStr.length + 1 + j, rowNext, cs);
      });
    } else {
      const remColor = rFinal > 0 ? '#d97706' : '#888';
      rStr.split('').forEach((d, j) => {
        texts += sdPlace(d, step.rightCol - rStr.length + 1 + j, rowNext, cs, remColor);
      });
    }
  });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
    <rect width="${W}" height="${H}" fill="#fff"/>${grid}${thickLines}${texts}
  </svg>`;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: {
    type: 'schriftlich_division',
    group: 'rechnen',
    label: 'Schriftl. Division',
    desc: 'Schriftliche Division',
    icon: '⊟÷',
    category: 'mathematik',
  },

  createData: id => {
    const cfg = { zahlenraum: 1000, teiler: 0, mitRest: false, loesung: false, anzahl: 4, linien: true , aufgabenNr:0, aufgabenText:''};
    return {
      id, type: 'schriftlich_division', ...cfg,
      aufgaben: sdGen(cfg.anzahl, cfg.zahlenraum, cfg.teiler, cfg.mitRest),
    };
  },

  render: d => {
    const zahlenraum = d.zahlenraum || 1000;
    const teiler     = d.teiler  ?? 0;
    const mitRest    = d.mitRest || false;
    const showLinien = d.linien !== false;
    const aufgaben   = d.aufgaben || sdGen(d.anzahl || 4, zahlenraum, teiler, mitRest);
    const isActive   = d.id === selId || _solutionsMode;
    const showResult = isActive;
    const blueResult = isActive;

    // Einheitliche Größe: max Spalten + max Schritte über alle Aufgaben
    const maxCols = Math.max(...aufgaben.map(([a, b]) => {
      const q = Math.floor(a / b);
      const r = a % b;
      return String(a).length + 1 + String(b).length + 1 + String(q).length
           + (r > 0 ? 2 + String(r).length : 0);
    }));
    const maxSteps = Math.max(...aufgaben.map(([a, b]) => sdCalcSteps(a, b).length));

    const svgs = aufgaben.map(([a, b]) =>
      `<div style="display:inline-block;margin:0 8px 16px 0;">
        ${sdSvg(a, b, showResult, blueResult, maxCols, maxSteps, showLinien)}
      </div>`
    );

    const itemW     = maxCols * 20;
    const tasksHtml = atHtml(d) + `<div style="display:grid;grid-template-columns:repeat(auto-fill,${itemW}px);gap:4px 12px;justify-content:space-between;">${svgs.join('')}</div>`;
    if (!d.loesung) return tasksHtml;
    const answers = aufgaben.map(([a, b]) => {
      const q = Math.floor(a / b), r = a % b;
      return r > 0 ? `${q} R ${r}` : String(q);
    });
    const shuffled = mcShuffled(answers, d.id);
    return tasksHtml + `<div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;text-align:center;">
      <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-right:8px;">Lösungen:</span>
      ${shuffled.map(a => `<span style="font-family:'DidactGothic7',sans-serif;font-size:14px;color:#555;margin:0 6px;">${esc(a)}</span>`).join('')}
    </div>`;
  },

  renderProps: d => {
    const zr  = d.zahlenraum || 1000;
    const te  = d.teiler  ?? 0;
    const mr  = d.mitRest || false;
    const sl  = d.loesung || false;
    const anz = d.anzahl  || 4;
    const li  = d.linien  !== false;

    const toggle = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    // Einstellige Teiler-Buttons
    const einBtns = [0, 2, 3, 4, 5, 6, 7, 8, 9].map(t =>
      toggle(t === 0 ? 'Zuf.' : String(t), te === t, `sdUpdProp(${d.id},'teiler',${t})`)
    ).join('');

    return pr('Zahlenraum (Dividend)',
        `<select onchange="sdUpdProp(${d.id},'zahlenraum',+this.value)">
          ${[100, 1000, 10000, 100000].map(n =>
            `<option value="${n}" ${zr === n ? 'selected' : ''}>${n}</option>`
          ).join('')}
        </select>`) +
      `<div class="prow"><label>Teiler – einstellig</label>
        <div style="display:flex;flex-wrap:wrap;gap:3px;">${einBtns}</div></div>` +
      `<div class="prow"><label>Teiler – zweistellig</label>
        <div style="display:flex;gap:4px;">
          ${toggle('Zufällig (10–99)', te === -1, `sdUpdProp(${d.id},'teiler',-1)`)}
        </div></div>` +
      `<div class="prow"><label>Subtraktionsstriche</label>
        <div style="display:flex;gap:4px;">
          ${toggle('Einblenden',  li, `upd(${d.id},'linien',true)`)}
          ${toggle('Ausblenden', !li, `upd(${d.id},'linien',false)`)}
        </div></div>` +
      `<div class="prow"><label>Rest</label>
        <div style="display:flex;gap:4px;">
          ${toggle('Ohne Rest', !mr, `sdUpdProp(${d.id},'mitRest',false)`)}
          ${toggle('Mit Rest',   mr, `sdUpdProp(${d.id},'mitRest',true)`)}
        </div></div>` +
      pr('Anzahl Aufgaben',
        `<input type="number" min="1" max="16" value="${anz}"
          onclick="event.stopPropagation()"
          onchange="sdUpdProp(${d.id},'anzahl',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;text-align:center;">`) +
      `<button onclick="event.stopPropagation();sdRoll(${d.id})"
        style="margin-top:2px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>` +
      `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggle('Ausblenden', !sl, `upd(${d.id},'loesung',false)`)}
          ${toggle('Einblenden',  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` ;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function sdRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben = sdGen(w.anzahl || 4, w.zahlenraum || 1000, w.teiler ?? 0, w.mitRest || false);
  render(); renderProps(id);
}

function sdUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = sdGen(w.anzahl || 4, w.zahlenraum || 1000, w.teiler ?? 0, w.mitRest || false);
  render(); renderProps(id);
}
