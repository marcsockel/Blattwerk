// Widget: Größen-Stellenwerttafel
// Tabelle wie auf klassischen Arbeitsblättern: links die Größe (z.B. „37 km 91 m"),
// dann je Einheit ein H/Z/E-Block (großer Wert | kleiner Wert, roter Trennstrich)
// und eine Komma-Spalte für die Kommaschreibweise (37,091 km).
// Richtung „gemischt": mal ist die Größe vorgegeben (Raster ausfüllen),
// mal das Raster (Größe + Komma ausfüllen). Lösungen blau (selId / _solutionsMode).

const GT_PAIRS = {
  'km/m':   { key: 'km/m',   art: 'Länge',   bigU: 'km', smallU: 'm',  smallPlaces: 3 },
  'kg/g':   { key: 'kg/g',   art: 'Gewicht', bigU: 'kg', smallU: 'g',  smallPlaces: 3 },
  'l/ml':   { key: 'l/ml',   art: 'Hohlmaß', bigU: 'l',  smallU: 'ml', smallPlaces: 3 },
  't/kg':   { key: 't/kg',   art: 'Gewicht', bigU: 't',  smallU: 'kg', smallPlaces: 3 },
  '€/ct':   { key: '€/ct',   art: 'Geld',    bigU: '€',  smallU: 'ct', smallPlaces: 2 },
};
const GT_PAIR_ORDER = [
  ['km/m', 'km / m'], ['kg/g', 'kg / g'], ['l/ml', 'l / ml'], ['t/kg', 't / kg'],
  ['€/ct', '€ / ct'],
];
const GT_STUFEN = [
  ['leicht', 'bis 99'],
  ['mittel', 'bis 999'],
  ['schwer', 'bis 999, mit Nullen'],
];

function gtRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Ziffern des großen Werts mit unterdrückten führenden Nullen (37 km → ['',3,7]).
function gtBigDigits(v) {
  const h = Math.floor(v / 100) % 10, z = Math.floor(v / 10) % 10, e = v % 10;
  const out = [h, z, e];
  if (h === 0) { out[0] = ''; if (z === 0) out[1] = ''; }
  return out;
}
// Ziffern des kleinen Werts (3 Stellen: 91 m → [0,9,1]; 2 Stellen: 75 ct → [7,5]).
function gtSmallDigits(v, places) {
  places = places || 3;
  if (places === 2) return [Math.floor(v / 10) % 10, v % 10];
  return [Math.floor(v / 100) % 10, Math.floor(v / 10) % 10, v % 10];
}

function gtQtyText(bigVal, smallVal, pc) {
  const parts = [];
  if (bigVal > 0) parts.push(`${bigVal} ${pc.bigU}`);
  if (smallVal > 0) parts.push(`${smallVal} ${pc.smallU}`);
  if (!parts.length) parts.push(`0 ${pc.smallU}`);
  return parts.join(' ');
}
// Zwei Hälften (große / kleine Einheit). Die 2. Hälfte etwas schmaler —
// weniger Leerraum zwischen 1. Kürzel und 2. Zahl; Einheiten bleiben zeilenweise bündig.
function gtQtyHtml(bigVal, smallVal, pc, color) {
  const part = (val, u, flex) => {
    const txt = val > 0 ? `${val}&nbsp;${esc(u)}` : '&nbsp;';
    return `<span style="flex:${flex} 1 0;min-width:0;text-align:right;padding:0 2px;`
      + `box-sizing:border-box;color:${color};">${txt}</span>`;
  };
  return `<div style="display:flex;width:100%;align-items:center;">`
    + part(bigVal, pc.bigU, 1.15) + part(smallVal, pc.smallU, 0.85) + `</div>`;
}
// Kommaschreibweise im großen Maß: 37 km 91 m → "37,091"; 5 € 75 ct → "5,75"
function gtKommaText(bigVal, smallVal, places) {
  places = places || 3;
  return `${bigVal},${String(smallVal).padStart(places, '0')}`;
}

function gtGenRows(d) {
  const pc = GT_PAIRS[d.paar] || GT_PAIRS['km/m'];
  const maxSmall = (pc.smallPlaces === 2) ? 99 : 999;
  const n = Math.max(1, Math.min(20, d.anzahl || 6));
  const maxBig = d.stufe === 'leicht' ? 99 : 999;
  const rows = [];
  for (let i = 0; i < n; i++) {
    let bigVal, smallVal;
    do {
      bigVal = Math.random() < 0.18 ? 0 : gtRand(1, maxBig);
      smallVal = (d.stufe === 'schwer') ? gtRand(0, maxSmall)
               : (Math.random() < 0.12 ? 0 : gtRand(1, maxSmall));
    } while (bigVal === 0 && smallVal === 0);
    rows.push({ bigVal, smallVal, dir: 'tafel' });
  }
  return rows;
}

// ── Zell-Helfer ───────────────────────────────────────────────────
function gtCell(content, given, active, w, h, fs, extra) {
  const show = given ? content : (active ? content : '');
  const color = given ? '#222' : '#2563eb';
  return `<td style="border:1.2px solid #333;width:${w}px;height:${h}px;text-align:right;`
       + `vertical-align:middle;font-family:Arial,sans-serif;font-size:${fs}px;`
       + `font-weight:400;color:${color};padding:0 5px 0 2px;box-sizing:border-box;${extra || ''}">`
       + `${show === '' || show == null ? '&nbsp;' : show}</td>`;
}

// Basismaße = bisheriges „Groß" (jetzt „Klein").
// „Groß" → auf volle Widget-Breite skalieren (mit oder ohne Kommaspalte).
// Ohne Kommaspalte: gleiche Gesamtbreite, die Spalten teilen sich den Platz —
// keine zusätzliche Vergrößerung darüber hinaus.
// fs/hf = Kopfzeile; vfs = Werte (etwas kleiner, Tabelle bleibt gleich groß).
function gtDims(d) {
  const showKomma = d.komma !== false;
  const base = { cw: 34, ch: 30, qw: 118, kw: 148, fs: 17, hf: 14, vfs: 13 };
  if (d.groesse !== 'gross') return { ...base, showKomma, full: false, tableW: null };

  const pc = GT_PAIRS[d.paar] || GT_PAIRS['km/m'];
  const sp = pc.smallPlaces || 3;
  const digitCols = 3 + sp;
  // Skalierung immer relativ zur vollen Basis inkl. Kommaspalte → Ohne bleibt
  // gleich breit wie Mit (Komma-Anteil verteilt sich auf die übrigen Spalten).
  const baseFullW = base.qw + digitCols * base.cw + base.kw;
  const pad = d.flush ? 0 : 18;
  let avail = baseFullW;
  if (typeof geom === 'function' && typeof widthFrac === 'function') {
    avail = Math.max(baseFullW, Math.floor(geom().contentW * widthFrac(d) - pad));
  }
  const scale = avail / baseFullW;
  const hScale = Math.min(scale, 1.35);
  const fScale = Math.min(scale, 1.4);
  const dims = {
    cw: Math.round(base.cw * scale),
    ch: Math.round(base.ch * hScale),
    qw: Math.round(base.qw * scale),
    kw: Math.round(base.kw * scale),
    fs: Math.max(14, Math.round(base.fs * fScale)),
    hf: Math.max(12, Math.round(base.hf * fScale)),
    vfs: Math.max(11, Math.round(base.vfs * fScale)),
    showKomma, full: true, tableW: avail,
  };
  if (!showKomma) {
    // Freiwerdende Komma-Breite anteilig auf Größen- + Ziffernspalten verteilen
    const digitsW = digitCols * dims.cw;
    const rest = dims.qw + digitsW;
    if (rest > 0) {
      const boost = dims.kw / rest;
      dims.qw = Math.round(dims.qw * (1 + boost));
      dims.cw = Math.round(dims.cw * (1 + boost));
    }
  }
  return dims;
}

function gtRowHtml(row, pc, d, active, dims) {
  const { cw, ch, qw, kw, vfs, showKomma } = dims;
  const lenGiven = row.dir === 'tafel';      // Größe vorgegeben → Raster ausfüllen
  const gridGiven = row.dir === 'groesse';   // Raster vorgegeben → Größe ausfüllen
  const red = 'border-left:2.6px solid #e01b1b;';

  const sp = pc.smallPlaces || 3;
  const bigD = gtBigDigits(row.bigVal);
  const smallD = gtSmallDigits(row.smallVal, sp);
  const komma = `${gtKommaText(row.bigVal, row.smallVal, sp)} ${pc.bigU}`;

  // Größen-Spalte: zwei gleich breite Slots → Einheiten stehen zeilenweise untereinander.
  const qtyColor = lenGiven ? '#222' : '#2563eb';
  const qtyShow = lenGiven || active;
  const qtyInner = qtyShow
    ? gtQtyHtml(row.bigVal, row.smallVal, pc, qtyColor)
    : '&nbsp;';
  const qtyCell = `<td style="border:1.2px solid #333;width:${qw}px;height:${ch}px;`
    + `vertical-align:middle;font-family:Arial,sans-serif;font-size:${vfs}px;`
    + `font-weight:400;padding:0 2px;box-sizing:border-box;">${qtyInner}</td>`;

  let html = '<tr>';
  html += qtyCell;
  // großer Block H Z E
  bigD.forEach(dg => { html += gtCell(dg, gridGiven, active, cw, ch, vfs); });
  // kleiner Block H Z E (erste Zelle roter Trennstrich)
  smallD.forEach((dg, i) => { html += gtCell(dg, gridGiven, active, cw, ch, vfs, i === 0 ? red : ''); });
  // Komma-Spalte (immer auszufüllen)
  if (showKomma) html += gtCell(komma, false, active, kw, ch, vfs);
  html += '</tr>';
  return html;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type: 'groessentafel', group: 'groessen', label: 'Größen-Stellenwerttafel',
          desc: 'Größen in H/Z/E + Kommaschreibweise', icon: '▦', category: 'mathematik' },

  createData: id => {
    const w = {
      id, type: 'groessentafel',
      paar: 'km/m', stufe: 'mittel', komma: true,
      groesse: 'klein', anzahl: 6, align: 'center',
      aufgabenNr: 0, aufgabenText: '',
    };
    w.rows = gtGenRows(w);
    return w;
  },

  render: d => {
    const pc = GT_PAIRS[d.paar] || GT_PAIRS['km/m'];
    const active = d.id === selId || _solutionsMode;
    const dims = gtDims(d);
    const rows = d.rows || gtGenRows(d);
    const showKomma = dims.showKomma;
    const red = 'border-left:2.6px solid #e01b1b;';
    const sp = pc.smallPlaces || 3;
    const smallLabels = sp === 2 ? ['Z', 'E'] : ['H', 'Z', 'E'];

    // th mit optionaler Breite (w) UND/ODER colspan. Gruppen-Header nutzen colspan,
    // damit sie über alle drei H/Z/E-Spalten reichen statt eine Spalte zu verbreitern.
    const th = (txt, w, extra, fs, span) =>
      `<th${span ? ` colspan="${span}"` : ''} style="border:1.2px solid #333;`
      + `${w ? `width:${w}px;` : ''}height:${dims.ch}px;text-align:center;`
      + `font-family:Arial,sans-serif;font-size:${fs || dims.hf}px;font-weight:700;`
      + `color:#333;padding:0 2px;${extra || ''}">${txt}</th>`;

    // Kopf: zwei Zeilen
    let head = '<tr>';
    head += th('', dims.qw, '');                                          // über „Länge"
    head += th(pc.bigU, null, 'background:#e8eef9;', dims.fs, 3);         // großer Block (3 Spalten)
    head += th(pc.smallU, null, 'background:#fbe9e9;' + red, dims.fs, sp); // kleiner Block
    if (showKomma) head += th('', dims.kw, '');                           // über „Kommaschreibung"
    head += '</tr><tr>';
    head += th(pc.art, dims.qw, '');
    ['H', 'Z', 'E'].forEach(l => head += th(l, dims.cw, ''));
    smallLabels.forEach((l, i) => head += th(l, dims.cw, i === 0 ? red : ''));
    if (showKomma) head += th('Kommaschreibung', dims.kw, '');
    head += '</tr>';

    const body = rows.map(r => gtRowHtml(r, pc, d, active, dims)).join('');
    const align = d.align || 'center';
    const tw = dims.tableW ? `width:${dims.tableW}px;` : '';

    return atHtml(d) +
      `<div style="text-align:${align};">`
      + `<table style="border-collapse:collapse;display:inline-table;${tw}">${head}${body}</table>`
      + `</div>`;
  },

  renderProps: d => {
    const paar = d.paar || 'km/m';
    const stufe = d.stufe || 'mittel';
    const komma = d.komma !== false;
    const size = d.groesse === 'gross' ? 'gross' : 'klein';
    const anz = d.anzahl || 6;

    const btn = (active, label, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#89b4fa' : '#ddd'};
               background:${active ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;
    const row = (label, opts, cur, key) =>
      `<div class="prow"><label>${label}</label><div style="display:flex;gap:4px;flex-wrap:wrap;">`
      + opts.map(([v, l]) => btn(cur === v, l, `gtSet(${d.id},'${key}','${v}')`)).join('')
      + `</div></div>`;

    return row('Einheiten', GT_PAIR_ORDER, paar, 'paar') +
      row('Zahlen', GT_STUFEN, stufe, 'stufe') +
      `<div class="prow"><label>Kommaschreibung</label><div style="display:flex;gap:4px;">`
      + btn(komma, 'Mit', `upd(${d.id},'komma',true)`)
      + btn(!komma, 'Ohne', `upd(${d.id},'komma',false)`)
      + `</div></div>` +
      `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">`
      + btn(size === 'klein', 'Klein', `upd(${d.id},'groesse','klein')`)
      + btn(size === 'gross', 'Groß', `upd(${d.id},'groesse','gross')`)
      + `</div></div>` +
      alignToggle(d.id, d.align) +
      pr('Anzahl Zeilen',
        `<input type="number" min="1" max="20" value="${anz}" onclick="event.stopPropagation()"
          onchange="gtSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();gtWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function gtSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.rows = gtGenRows(w);
  render(); renderProps(id);
}
function gtWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.rows = gtGenRows(w);
  render(); renderProps(id);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GT_PAIRS, gtGenRows, gtBigDigits, gtSmallDigits, gtKommaText, gtQtyText };
}
