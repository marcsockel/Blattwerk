// Widget: Größen umrechnen
// Längen-, Gewichts-, Hohlmaß- und Zeitumrechnungen. Drei Aufgabenformate:
//  - einfach:   3 m  =  ___ cm
//  - gemischt:  250 cm = ___ m ___ cm   (bzw. 2 m 50 cm = ___ cm)
//  - vergleich: 3 m  ___  250 cm   (<, >, =)
// Lösungen erscheinen blau im Auswahl-/Lösungsmodus (selId / _solutionsMode).

// ── Einheiten je Bereich (immer GRÖSSTE zuerst; Faktor = in Basiseinheit) ──
// Faktoren sind so gewählt, dass jede größere Einheit ein ganzzahliges
// Vielfaches der kleineren ist → Umrechnungen bleiben ganzzahlig.
const GU_UNITS = {
  laenge:  [{u:'km', f:1000000}, {u:'m', f:1000}, {u:'dm', f:100}, {u:'cm', f:10}, {u:'mm', f:1}],
  gewicht: [{u:'t', f:1000000000}, {u:'kg', f:1000000}, {u:'g', f:1000}, {u:'mg', f:1}],
  volumen: [{u:'l', f:1000}, {u:'ml', f:1}],
  zeit:    [{u:'Tag', f:86400}, {u:'h', f:3600}, {u:'min', f:60}, {u:'s', f:1}],
};

const GU_BEREICHE = [
  ['laenge', 'Länge'], ['gewicht', 'Gewicht'], ['volumen', 'Hohlmaße'], ['zeit', 'Zeit'],
];
const GU_FORMATE = [
  ['einfach', 'Umrechnen'], ['gemischt', 'Gemischt'], ['vergleich', 'Vergleichen'],
];
const GU_STUFEN = [['leicht', 'Leicht'], ['mittel', 'Mittel'], ['schwer', 'Schwer']];

const GU_MAX = 99999; // Obergrenze für angezeigte Zahlen

function guRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Alle Einheiten je Bereich aktiv (Default).
function guDefaultUnits() {
  const m = {};
  for (const k in GU_UNITS) m[k] = GU_UNITS[k].map(u => u.u);
  return m;
}
// Aktive (eingeschalteten) Einheiten des aktuellen Bereichs, in Originalreihenfolge.
// Mindestens 2 — sonst Rückfall auf alle.
function guActiveUnits(d) {
  const all = GU_UNITS[d.bereich] || GU_UNITS.laenge;
  const en = d.aktiveEinheiten && d.aktiveEinheiten[d.bereich];
  if (!en || !en.length) return all;
  const f = all.filter(u => en.includes(u.u));
  return f.length >= 2 ? f : all;
}

// Maximaler „Sprung" zwischen Einheiten (Zeit/Hohlmaße gedeckelt, da sonst riesige Zahlen)
function guStep(bereich, stufe) {
  let m = stufe === 'leicht' ? 1 : stufe === 'mittel' ? 2 : 3;
  if (bereich === 'zeit') m = Math.min(m, 2);
  if (bereich === 'volumen') m = 1;
  return m;
}
function guValMax(stufe) { return stufe === 'leicht' ? 9 : stufe === 'mittel' ? 20 : 100; }

// Wählt ein Einheitenpaar { hiU (größere Einheit), loU (kleinere Einheit) }.
function guPickPair(units, maxStep) {
  const n = units.length;
  const i = guRand(0, n - 1);
  const step = guRand(1, maxStep);
  let j = (Math.random() < 0.5) ? i + step : i - step;
  j = Math.max(0, Math.min(n - 1, j));
  if (j === i) j = (i + 1 <= n - 1) ? i + 1 : i - 1;
  const hi = Math.min(i, j), lo = Math.max(i, j); // kleinerer Index = größere Einheit
  return { hiU: units[hi], loU: units[lo] };
}

// ── Generatoren je Format (geben Item-Objekt oder null bei Verwerfen) ──
function guEinfach(d) {
  const units = guActiveUnits(d);
  const { hiU, loU } = guPickPair(units, guStep(d.bereich, d.stufe));
  const R = hiU.f / loU.f;
  const vmax = guValMax(d.stufe);
  if (Math.random() < 0.6) {                       // groß → klein (immer ganzzahlig)
    const capRaw = Math.floor(GU_MAX / R);
    if (capRaw < 1) return null;                    // Paar zu weit auseinander → verwerfen
    const V = guRand(1, Math.min(vmax, capRaw));
    return { f: 'einfach', fromVal: V, fromU: hiU.u, toU: loU.u, ans: V * R };
  } else {                                         // klein → groß (Vielfaches → ganzzahlig)
    const k = guRand(1, vmax);
    const fromVal = k * R;
    if (fromVal > GU_MAX) return null;
    return { f: 'einfach', fromVal, fromU: loU.u, toU: hiU.u, ans: k };
  }
}

function guGemischt(d) {
  const units = guActiveUnits(d);
  const step = d.stufe === 'schwer' ? guStep(d.bereich, d.stufe) : 1;
  const { hiU, loU } = guPickPair(units, Math.min(2, step));
  const R = hiU.f / loU.f;
  if (R < 2 || R > 3600) return null;              // sinnvolle Aufteilung
  const aMax = d.stufe === 'leicht' ? 5 : d.stufe === 'mittel' ? 9 : 20;
  const a = guRand(1, aMax);
  const b = guRand(1, R - 1);
  const total = a * R + b;
  if (total > GU_MAX) return null;
  if (Math.random() < 0.5)
    return { f: 'gemischt', mode: 'split', total, loU: loU.u, hiU: hiU.u, a, b };
  return { f: 'gemischt', mode: 'join', a, hiU: hiU.u, b, loU: loU.u, total };
}

function guVergleich(d) {
  const units = guActiveUnits(d);
  const { hiU, loU } = guPickPair(units, guStep(d.bereich, d.stufe));
  const R = hiU.f / loU.f;
  const vmax = guValMax(d.stufe);
  const anchor = guRand(1, Math.max(1, Math.min(vmax, Math.floor(GU_MAX / R))));
  const baseLo = anchor * R;                       // hi-Größe ausgedrückt in lo-Einheit
  const want = ['<', '>', '='][guRand(0, 2)];
  let rightVal;
  if (want === '=') rightVal = baseLo;
  else if (want === '<') rightVal = baseLo + guRand(1, R);                     // links kleiner
  else rightVal = baseLo - guRand(1, Math.min(baseLo - 1, R));                 // links größer
  if (rightVal < 1 || rightVal > GU_MAX) return null;
  let left = { val: anchor, u: hiU.u }, right = { val: rightVal, u: loU.u };
  let rel = baseLo < rightVal ? '<' : baseLo > rightVal ? '>' : '=';
  if (Math.random() < 0.5) {                        // Seiten tauschen
    [left, right] = [right, left];
    rel = rel === '<' ? '>' : rel === '>' ? '<' : '=';
  }
  return { f: 'vergleich', leftVal: left.val, leftU: left.u, rightVal: right.val, rightU: right.u, rel };
}

function guGenOne(d) {
  for (let t = 0; t < 60; t++) {
    let it = null;
    if (d.format === 'einfach') it = guEinfach(d);
    else if (d.format === 'gemischt') it = guGemischt(d);
    else it = guVergleich(d);
    if (it) return it;
  }
  // Rückfall: aktives Nachbarpaar mit kleinstem Verhältnis (kleine Zahlen)
  const u = guActiveUnits(d);
  let hi = u[u.length - 2], lo = u[u.length - 1], best = hi.f / lo.f;
  for (let i = 0; i < u.length - 1; i++) {
    const r = u[i].f / u[i + 1].f;
    if (r < best) { best = r; hi = u[i]; lo = u[i + 1]; }
  }
  const fromVal = best > GU_MAX ? 1 : Math.min(2, Math.max(1, Math.floor(GU_MAX / best)));
  return { f: 'einfach', fromVal, fromU: hi.u, toU: lo.u, ans: fromVal * best };
}

function guTotal(d) {
  const app = Math.max(1, Math.min(20, d.aufgabenProPaeckchen || 5));
  const cols = Math.max(1, Math.min(36, d.cols || 2));
  return app * cols;
}

// Alle Aufgaben neu würfeln.
function guGenerate(d) {
  const n = guTotal(d);
  d.items = Array.from({ length: n }, () => guGenOne(d));
}

// Nur die Anzahl anpassen: vorhandene Aufgaben behalten, fehlende ergänzen bzw.
// überzählige abschneiden (z.B. beim Hinzufügen eines Päckchens).
function guResize(d) {
  const n = guTotal(d);
  const items = (d.items || []).slice(0, n);
  while (items.length < n) items.push(guGenOne(d));
  d.items = items;
}

// ── Darstellung ───────────────────────────────────────────────────
function guUnitLbl(u, val) { return u === 'Tag' ? (val === 1 ? 'Tag' : 'Tage') : u; }

// Größenfaktor wie Rechenaufgaben: klein = 1, mittel = 1.3, groß = 1.5.
function guScale(d) {
  const S = d.groesse === 'gross' ? 1.5 : d.groesse === 'mittel' ? 1.3 : 1;
  const px = v => Math.round(v * S);
  return { S, px, FS: px(16), LH: px(20) };
}

// Ziffern-Zellenbreite in ch. Etwas breiter als 1ch, sonst berühren sich benachbarte
// Ziffern (v.a. Nullen, deren Glyphe ≈ 1ch breit ist). Auch bei Rechenaufgaben so.
const GU_DW = 1.2;

// Ziffern-Zellen wie Rechenaufgaben: jede Ziffer in eigener Zelle (zentriert), die
// Schrift hat keine Tabellenziffern → so stehen Einer unter Einern, mit etwas Luft.
function guDigitCells(v) {
  return String(v).split('').map(c =>
    /[0-9]/.test(c)
      ? `<span style="display:inline-block;width:${GU_DW}ch;text-align:center;">${c}</span>`
      : esc(c)
  ).join('');
}
// Zahl rechtsbündig in FESTER Slot-Breite (digits × GU_DW ch) → rechte Kante und „="
// stehen widgetweit exakt untereinander (auch zwischen Päckchen).
function guNumSpan(v, digits, FS, LH) {
  const w = (digits * GU_DW).toFixed(2);
  return `<span style="display:inline-block;width:${w}ch;min-height:${LH}px;line-height:${LH}px;`
       + `text-align:right;font-family:'DidactGothic7',sans-serif;font-size:${FS}px;">${guDigitCells(v)}</span>`;
}
// Lösungsstrich fester Breite (digits Slots) → jeder Strich gleich lang, Ergebnis blau bei active.
function guBlankSpan(v, active, digits, FS, LH) {
  const w = (digits * GU_DW).toFixed(2);
  return `<span style="display:inline-block;width:${w}ch;min-height:${LH}px;line-height:${LH}px;`
       + `text-align:right;border-bottom:1.6px solid #333;color:#2563eb;font-weight:700;`
       + `font-family:'DidactGothic7',sans-serif;font-size:${FS}px;">${active ? guDigitCells(v) : '&nbsp;'}</span>`;
}
function guRelBox(rel, active, px, FS) {
  return `<span style="display:inline-flex;align-items:center;justify-content:center;`
       + `width:${px(26)}px;height:${px(23)}px;border:1.6px solid #333;border-radius:3px;`
       + `color:#2563eb;font-weight:700;font-size:${FS}px;vertical-align:middle;">${active ? rel : '&nbsp;'}</span>`;
}

// Vorgegebene (schwarze) Zahlen bzw. Lösungswerte einer Aufgabe — für Layout-Kennzahlen.
function guGivenNums(it) {
  if (it.f === 'einfach') return [it.fromVal];
  if (it.f === 'vergleich') return [it.leftVal, it.rightVal];
  if (it.mode === 'split') return [it.total];
  return [it.a, it.b]; // join
}
function guBlankNums(it) {
  if (it.f === 'einfach') return [it.ans];
  if (it.f === 'vergleich') return [];
  if (it.mode === 'split') return [it.a, it.b];
  return [it.total]; // join
}
// Alle in einer Aufgabe vorkommenden Einheiten (für die Kürzel-Breite).
function guUnits(it) {
  if (it.f === 'einfach') return [it.fromU, it.toU];
  if (it.f === 'vergleich') return [it.leftU, it.rightU];
  if (it.mode === 'split') return [it.loU, it.hiU];
  return [it.hiU, it.loU]; // join
}
// Einheitliche Slots fürs ganze Widget: Ziffern (vorgegeben / Ergebnis) und Kürzel-Breite.
// unitW = längstes Kürzel in Zeichen (Worst Case „Tage" statt „Tag") → alle Kürzel-Zellen
// gleich breit, damit „=" widgetweit exakt untereinander steht.
function guMetrics(items) {
  let numDigits = 1, blankDigits = 1, unitW = 1;
  for (const it of items) {
    if (!it) continue;
    for (const v of guGivenNums(it)) numDigits = Math.max(numDigits, String(v).length);
    for (const v of guBlankNums(it)) blankDigits = Math.max(blankDigits, String(v).length);
    for (const u of guUnits(it)) unitW = Math.max(unitW, guUnitLbl(u, 2).length);
  }
  return { numDigits, blankDigits, unitW };
}

// Eine Aufgabe als Tabellenzeile. Zahl und Einheitskürzel stehen in EIGENEN Zellen
// (wie die Komponenten bei Rechenaufgaben) → Ziffern-Ende und Einheit-Anfang stehen
// je Spalte exakt untereinander, „=" ebenfalls. Format ist je Widget fix; „gemischt"
// nutzt ein einheitliches 9-Spalten-Raster (split/join teilen sich die Spalten).
function guItemRow(it, d, active, m, sc) {
  const { px, FS, LH } = sc;
  const tdBase = `padding:${px(3)}px 0;font-family:'DidactGothic7',sans-serif;font-size:${FS}px;`
    + `line-height:${LH}px;vertical-align:middle;color:#222;`;
  // Feste Kürzel-Breite (in ch): längstes Kürzel + 1 als Puffer (Buchstaben > „0").
  const unitCh = (m.unitW + 1);
  const numCh = (m.numDigits * GU_DW).toFixed(2);
  const tdNum = `${tdBase}text-align:right;white-space:nowrap;`;
  const tdUnit = `${tdBase}text-align:left;white-space:nowrap;padding-left:${px(4)}px;padding-right:${px(9)}px;`;
  const tdMid = `${tdBase}text-align:center;white-space:nowrap;padding-left:${px(6)}px;padding-right:${px(6)}px;`;
  const cNum = v => `<td style="${tdNum}">${guNumSpan(v, m.numDigits, FS, LH)}</td>`;
  const cBlank = v => `<td style="${tdNum}">${guBlankSpan(v, active, m.blankDigits, FS, LH)}</td>`;
  const cUnit = (u, val) => `<td style="${tdUnit}"><span style="display:inline-block;`
    + `width:${unitCh}ch;text-align:left;">${esc(guUnitLbl(u, val))}</span></td>`;
  const cMid = html => `<td style="${tdMid}">${html}</td>`;
  // Leerslots mit fester Breite → Spalten (und „=") stehen auch bei split/join gleich.
  const cEmptyNum = `<td style="${tdNum}"><span style="display:inline-block;width:${numCh}ch;"></span></td>`;
  const cEmptyUnit = `<td style="${tdUnit}"><span style="display:inline-block;width:${unitCh}ch;"></span></td>`;

  if (it.f === 'einfach') {
    return `<tr>${cNum(it.fromVal)}${cUnit(it.fromU, it.fromVal)}${cMid('=')}`
         + `${cBlank(it.ans)}${cUnit(it.toU, it.ans)}</tr>`;
  }
  if (it.f === 'vergleich') {
    return `<tr>${cNum(it.leftVal)}${cUnit(it.leftU, it.leftVal)}${cMid(guRelBox(it.rel, active, px, FS))}`
         + `${cNum(it.rightVal)}${cUnit(it.rightU, it.rightVal)}</tr>`;
  }
  if (it.mode === 'split') {
    return `<tr>${cNum(it.total)}${cUnit(it.loU, it.total)}${cEmptyNum}${cEmptyUnit}${cMid('=')}`
         + `${cBlank(it.a)}${cUnit(it.hiU, it.a)}${cBlank(it.b)}${cUnit(it.loU, it.b)}</tr>`;
  }
  return `<tr>${cNum(it.a)}${cUnit(it.hiU, it.a)}${cNum(it.b)}${cUnit(it.loU, it.b)}${cMid('=')}`
       + `${cBlank(it.total)}${cUnit(it.loU, it.total)}${cEmptyNum}${cEmptyUnit}</tr>`;
}

// Ein Päckchen = eine Tabelle (Zeilen untereinander, „=" ausgerichtet).
function guGroupTable(group, d, active, m, sc) {
  const rows = group.map(it => guItemRow(it, d, active, m, sc)).join('');
  return `<table style="border-collapse:collapse;">${rows}</table>`;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type: 'groessen', group: 'groessen', label: 'Größen umrechnen',
          desc: 'Längen, Gewichte, Hohlmaße, Zeit', icon: '📏', category: 'mathematik' },

  createData: id => {
    const w = {
      id, type: 'groessen',
      bereich: 'laenge', format: 'einfach', stufe: 'leicht',
      aktiveEinheiten: guDefaultUnits(),
      groesse: 'klein', aufgabenProPaeckchen: 5, cols: 2,
      aufgabenNr: 0, aufgabenText: '',
    };
    guGenerate(w);
    return w;
  },

  render: d => {
    const items = d.items || [];
    const active = d.id === selId || _solutionsMode;
    const app = Math.max(1, Math.min(20, d.aufgabenProPaeckchen || 5));
    const cols = Math.max(1, Math.min(36, d.cols || 2));
    // In Päckchen aufteilen (je app Aufgaben), jedes Päckchen = eine Tabelle.
    const groups = Array.from({ length: cols },
      (_, i) => items.slice(i * app, (i + 1) * app)).filter(g => g.length);
    const fmt = d.format || 'einfach';
    const sc = guScale(d);
    // Einheitliche Slot-Anzahlen fürs ganze Widget → Ziffern-Enden stehen
    // zeilenübergreifend exakt untereinander; Lösungsstriche gleich lang.
    const m = guMetrics(items);
    // Verteilungs-Layout wie Rechenaufgaben (flexDistribute in helpers.js): itemW nur
    // GROB geschätzt für die Voll/Nicht-voll-Entscheidung, echte Spaltenzahl misst der Browser.
    const digitPx = 9, unitPx = 22;
    const est = fmt === 'gemischt'
      ? 3 * m.numDigits * digitPx + 4 * unitPx + 60
      : 2 * m.numDigits * digitPx + 2 * unitPx + 50;
    const itemW = Math.round(est * sc.S);
    return atHtml(d) + flexDistribute(
      groups.map(g => guGroupTable(g, d, active, m, sc)),
      { gap: 24, marginBottom: 16, sample: groups.length ? guGroupTable(groups[0], d, active, m, sc) : '',
        itemW, d, estimate: true }
    );
  },

  renderProps: d => {
    const bereich = d.bereich || 'laenge';
    const format = d.format || 'einfach';
    const stufe = d.stufe || 'leicht';
    const size = d.groesse || 'klein';
    const app = d.aufgabenProPaeckchen || 5;
    const cols = d.cols || 2;

    const btn = (active, label, onclick, fs) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#89b4fa' : '#ddd'};
               background:${active ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:${fs || 11}px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    const row = (label, opts, cur, key, fs) =>
      `<div class="prow"><label>${label}</label><div style="display:flex;gap:4px;flex-wrap:wrap;">`
      + opts.map(([v, l]) => btn(cur === v, l, `guSet(${d.id},'${key}','${v}')`, fs)).join('')
      + `</div></div>`;

    const allU = GU_UNITS[bereich] || GU_UNITS.laenge;
    const enU = (d.aktiveEinheiten && d.aktiveEinheiten[bereich]) || allU.map(u => u.u);
    const unitBtns = allU.map(u => {
      const on = enU.includes(u.u);
      return `<button onclick="event.stopPropagation();guToggleUnit(${d.id},'${u.u}')"
        style="flex:1;min-width:32px;padding:5px 4px;border-radius:4px;border:1.5px solid ${on ? '#89b4fa' : '#ddd'};
               background:${on ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:11px;font-weight:700;
               cursor:pointer;color:${on ? '#1e1e2e' : '#bbb'};">${u.u}</button>`;
    }).join('');
    const unitRow = `<div class="prow"><label>Einheiten aktiv</label>`
      + `<div style="display:flex;gap:4px;flex-wrap:wrap;">${unitBtns}</div></div>`;

    return row('Bereich', GU_BEREICHE, bereich, 'bereich') +
      unitRow +
      row('Aufgabenart', GU_FORMATE, format, 'format') +
      row('Schwierigkeit', GU_STUFEN, stufe, 'stufe') +
      `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">`
      + btn(size === 'klein', 'Klein', `upd(${d.id},'groesse','klein')`)
      + btn(size === 'mittel', 'Mittel', `upd(${d.id},'groesse','mittel')`)
      + btn(size === 'gross', 'Groß', `upd(${d.id},'groesse','gross')`)
      + `</div></div>` +
      pr('Aufgaben pro Päckchen',
        `<input type="number" min="1" max="20" value="${app}" onclick="event.stopPropagation()"
          onchange="guSet(${d.id},'aufgabenProPaeckchen',+this.value)">`) +
      pr('Anzahl Päckchen',
        `<input type="number" min="1" max="36" value="${cols}" onclick="event.stopPropagation()"
          onchange="guSet(${d.id},'cols',+this.value)">`) +
      `<button onclick="event.stopPropagation();guWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
// Strukturelle Änderung → neu generieren.
function guSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  // Bei reiner Mengenänderung (Päckchen/Aufgaben) vorhandene Aufgaben behalten.
  if (key === 'cols' || key === 'aufgabenProPaeckchen') guResize(w);
  else guGenerate(w);
  render(); renderProps(id);
}

function guWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  guGenerate(w);
  render(); renderProps(id);
}

// Einzelne Einheit im aktuellen Bereich an-/abschalten (min. 2 bleiben aktiv).
function guToggleUnit(id, unit) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!w.aktiveEinheiten) w.aktiveEinheiten = guDefaultUnits();
  const order = GU_UNITS[w.bereich].map(u => u.u);
  let en = (w.aktiveEinheiten[w.bereich] || order).slice();
  const i = en.indexOf(unit);
  if (i >= 0) { if (en.length <= 2) return; en.splice(i, 1); }   // letzte zwei nicht abschalten
  else { en.push(unit); en.sort((a, b) => order.indexOf(a) - order.indexOf(b)); }
  saveHistory();
  w.aktiveEinheiten[w.bereich] = en;
  guGenerate(w);
  render(); renderProps(id);
}

// Node-Export für Tests (ignoriert im Browser).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GU_UNITS, guGenOne, guEinfach, guGemischt, guVergleich,
                     guToggleUnit, guDefaultUnits, guActiveUnits };
}
