// Widget: Größen-Stellenwerttafel
// Tabelle wie auf klassischen Arbeitsblättern: links die Größe (z.B. „37 km 91 m"),
// dann je Einheit ein H/Z/E-Block (großer Wert | kleiner Wert, roter Trennstrich)
// und eine Komma-Spalte für die Kommaschreibweise (37,091 km).
// Richtung „gemischt": mal ist die Größe vorgegeben (Raster ausfüllen),
// mal das Raster (Größe + Komma ausfüllen). Lösungen blau (selId / _solutionsMode).

const GT_PAIRS = {
  'km/m': { key: 'km/m', art: 'Länge',   bigU: 'km', smallU: 'm'  },
  'kg/g': { key: 'kg/g', art: 'Gewicht', bigU: 'kg', smallU: 'g'  },
  'l/ml': { key: 'l/ml', art: 'Hohlmaß', bigU: 'l',  smallU: 'ml' },
  't/kg': { key: 't/kg', art: 'Gewicht', bigU: 't',  smallU: 'kg' },
};
const GT_PAIR_ORDER = [
  ['km/m', 'km / m'], ['kg/g', 'kg / g'], ['l/ml', 'l / ml'], ['t/kg', 't / kg'],
];
const GT_STUFEN = [['leicht', 'bis 99'], ['mittel', 'bis 999'], ['schwer', 'bis 999 +']];

function gtRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Ziffern des großen Werts mit unterdrückten führenden Nullen (37 km → ['',3,7]).
function gtBigDigits(v) {
  const h = Math.floor(v / 100) % 10, z = Math.floor(v / 10) % 10, e = v % 10;
  const out = [h, z, e];
  if (h === 0) { out[0] = ''; if (z === 0) out[1] = ''; }
  return out;
}
// Ziffern des kleinen Werts: IMMER drei Stellen inkl. führender Nullen (91 m → [0,9,1]).
function gtSmallDigits(v) {
  return [Math.floor(v / 100) % 10, Math.floor(v / 10) % 10, v % 10];
}

function gtQtyText(bigVal, smallVal, pc) {
  const parts = [];
  if (bigVal > 0) parts.push(`${bigVal} ${pc.bigU}`);
  if (smallVal > 0) parts.push(`${smallVal} ${pc.smallU}`);
  if (!parts.length) parts.push(`0 ${pc.smallU}`);
  return parts.join(' ');
}
// Kommaschreibweise im großen Maß: 37 km 91 m → "37,091"
function gtKommaText(bigVal, smallVal) {
  return `${bigVal},${String(smallVal).padStart(3, '0')}`;
}

function gtGenRows(d) {
  const n = Math.max(1, Math.min(20, d.anzahl || 6));
  const maxBig = d.stufe === 'leicht' ? 99 : 999;
  const rows = [];
  for (let i = 0; i < n; i++) {
    let bigVal, smallVal;
    do {
      bigVal = Math.random() < 0.18 ? 0 : gtRand(1, maxBig);
      smallVal = (d.stufe === 'schwer') ? gtRand(0, 999)
               : (Math.random() < 0.12 ? 0 : gtRand(1, 999));
    } while (bigVal === 0 && smallVal === 0);
    rows.push({ bigVal, smallVal, dir: 'tafel' });
  }
  return rows;
}

// ── Zell-Helfer ───────────────────────────────────────────────────
function gtCell(content, given, active, w, h, fs, extra) {
  const show = given ? content : (active ? content : '');
  const color = given ? '#222' : '#2563eb';
  return `<td style="border:1.2px solid #333;width:${w}px;height:${h}px;text-align:center;`
       + `vertical-align:middle;font-family:'DidactGothic7',sans-serif;font-size:${fs}px;`
       + `font-weight:700;color:${color};padding:0;${extra || ''}">`
       + `${show === '' || show == null ? '&nbsp;' : show}</td>`;
}

function gtRowHtml(row, pc, d, active, dims) {
  const { cw, ch, qw, kw, fs } = dims;
  const showKomma = d.komma !== false;
  const lenGiven = row.dir === 'tafel';      // Größe vorgegeben → Raster ausfüllen
  const gridGiven = row.dir === 'groesse';   // Raster vorgegeben → Größe ausfüllen
  const red = 'border-left:2.6px solid #e01b1b;';

  const bigD = gtBigDigits(row.bigVal);
  const smallD = gtSmallDigits(row.smallVal);
  const qty = gtQtyText(row.bigVal, row.smallVal, pc);
  const komma = `${gtKommaText(row.bigVal, row.smallVal)} ${pc.bigU}`;

  let html = '<tr>';
  // Größen-Spalte (links)
  html += gtCell(qty, lenGiven, active, qw, ch, fs, 'text-align:center;');
  // großer Block H Z E
  bigD.forEach(dg => { html += gtCell(dg, gridGiven, active, cw, ch, fs); });
  // kleiner Block H Z E (erste Zelle roter Trennstrich)
  smallD.forEach((dg, i) => { html += gtCell(dg, gridGiven, active, cw, ch, fs, i === 0 ? red : ''); });
  // Komma-Spalte (immer auszufüllen)
  if (showKomma) html += gtCell(komma, false, active, kw, ch, fs);
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
      groesse: 'gross', anzahl: 6, align: 'center',
      aufgabenNr: 0, aufgabenText: '',
    };
    w.rows = gtGenRows(w);
    return w;
  },

  render: d => {
    const pc = GT_PAIRS[d.paar] || GT_PAIRS['km/m'];
    const active = d.id === selId || _solutionsMode;
    const big = (d.groesse || 'gross') !== 'klein';
    const dims = big
      ? { cw: 34, ch: 30, qw: 112, kw: 132, fs: 17, hf: 14 }
      : { cw: 26, ch: 24, qw: 90,  kw: 108, fs: 14, hf: 12 };
    const rows = d.rows || gtGenRows(d);
    const showKomma = d.komma !== false;
    const red = 'border-left:2.6px solid #e01b1b;';

    // th mit optionaler Breite (w) UND/ODER colspan. Gruppen-Header nutzen colspan,
    // damit sie über alle drei H/Z/E-Spalten reichen statt eine Spalte zu verbreitern.
    const th = (txt, w, extra, fs, span) =>
      `<th${span ? ` colspan="${span}"` : ''} style="border:1.2px solid #333;`
      + `${w ? `width:${w}px;` : ''}height:${dims.ch}px;text-align:center;`
      + `font-family:'DidactGothic7',sans-serif;font-size:${fs || dims.hf}px;font-weight:700;`
      + `color:#333;padding:0 2px;${extra || ''}">${txt}</th>`;

    // Kopf: zwei Zeilen
    let head = '<tr>';
    head += th('', dims.qw, '');                                          // über „Länge"
    head += th(pc.bigU, null, 'background:#e8eef9;', dims.fs, 3);         // großer Block (3 Spalten)
    head += th(pc.smallU, null, 'background:#fbe9e9;' + red, dims.fs, 3); // kleiner Block (3 Spalten)
    if (showKomma) head += th('', dims.kw, '');                           // über „Komma"
    head += '</tr><tr>';
    head += th(pc.art, dims.qw, '');
    ['H', 'Z', 'E'].forEach(l => head += th(l, dims.cw, ''));
    ['H', 'Z', 'E'].forEach((l, i) => head += th(l, dims.cw, i === 0 ? red : ''));
    if (showKomma) head += th('Komma', dims.kw, '');
    head += '</tr>';

    const body = rows.map(r => gtRowHtml(r, pc, d, active, dims)).join('');
    const align = d.align || 'center';

    return atHtml(d) +
      `<div style="text-align:${align};">`
      + `<table style="border-collapse:collapse;display:inline-table;">${head}${body}</table>`
      + `</div>`;
  },

  renderProps: d => {
    const paar = d.paar || 'km/m';
    const stufe = d.stufe || 'mittel';
    const komma = d.komma !== false;
    const size = d.groesse || 'gross';
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
      `<div class="prow"><label>Komma-Spalte</label><div style="display:flex;gap:4px;">`
      + btn(komma, 'Mit', `upd(${d.id},'komma',true)`)
      + btn(!komma, 'Ohne', `upd(${d.id},'komma',false)`)
      + `</div></div>` +
      `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">`
      + btn(size === 'klein', 'Klein', `upd(${d.id},'groesse','klein')`)
      + btn(size !== 'klein', 'Groß', `upd(${d.id},'groesse','gross')`)
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
