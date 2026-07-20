// Widget: Nachbarzahlen-Tabelle
// Zeilen mit Nachbarhunderter / -zehner / Vorgänger / Zahl / Nachfolger

function nztRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function nztSlotDigits(zr) {
  if (zr >= 1000) return 3;
  if (zr >= 100) return 2;
  return 2;
}

function nztGenCap(zr) {
  if (zr === 100) return 99;
  if (zr === 1000) return 999;
  return zr;
}

function nztNeighbors(n, typ) {
  const t = typ || 'zahl';
  if (t === 'zahl') return { before: n - 1, after: n + 1 };
  const unit = t === 'hunderter' ? 100 : 10;
  if (n % unit === 0) return { before: n - unit, after: n + unit };
  const base = Math.floor(n / unit) * unit;
  return { before: base, after: base + unit };
}

function nztRowValues(n) {
  const nh = nztNeighbors(n, 'hunderter');
  const nz = nztNeighbors(n, 'zehner');
  return {
    nhL: nh.before, nzL: nz.before,
    vor: n - 1, zahl: n, nach: n + 1,
    nzR: nz.after, nhR: nh.after,
  };
}

const NZT_COLS = [
  { key: 'nhL', abbr: 'NH', title: 'Nachbarhunderter', pair: 'h' },
  { key: 'nzL', abbr: 'NZ', title: 'Nachbarzehner', pair: 'z' },
  { key: 'vor', abbr: 'V', title: 'Vorgänger', pair: 'vn' },
  { key: 'zahl', abbr: 'Z', title: 'Zahl', pair: null },
  { key: 'nach', abbr: 'N', title: 'Nachfolger', pair: 'vn' },
  { key: 'nzR', abbr: 'NZ', title: 'Nachbarzehner', pair: 'z' },
  { key: 'nhR', abbr: 'NH', title: 'Nachbarhunderter', pair: 'h' },
];

function nztVisibleCols(w) {
  const h = w.showHunderter !== false;
  const z = w.showZehner !== false;
  const vn = w.showVorgNach !== false;
  return NZT_COLS.filter(c => {
    if (!c.pair) return true;
    if (c.pair === 'h') return h;
    if (c.pair === 'z') return z;
    return vn;
  });
}

function nztPickVorgabe(w) {
  const v = w.vorgabe || 'zahl';
  if (v !== 'gemischt') return v;
  return ['zahl', 'vorgaenger', 'nachfolger'][nztRand(0, 2)];
}

function nztValidNs(zr, w) {
  const cap = nztGenCap(zr);
  const minN = 1;
  const checkVN = w.showVorgNach !== false;
  const valid = [];
  for (let n = minN; n <= cap; n++) {
    if (checkVN) {
      const v = nztRowValues(n);
      if (v.vor < minN || v.nach > cap) continue;
    }
    valid.push(n);
  }
  return valid;
}

function nztCellKind(key, vorgabe) {
  if (vorgabe === 'zahl' && key === 'zahl') return 'given';
  if (vorgabe === 'vorgaenger' && key === 'vor') return 'given';
  if (vorgabe === 'nachfolger' && key === 'nach') return 'given';
  return 'ans';
}

function nztRegen(w) {
  const zr = w.zahlenraum || 100;
  const cap = nztGenCap(zr);
  const perPack = Math.max(1, w.aufgabenProPaeckchen || w.zeilen || 10);
  const cols = Math.max(1, w.cols || 1);
  const total = perPack * cols;
  const valid = nztValidNs(zr, w);
  const tasks = [];
  for (let i = 0; i < total; i++) {
    const vorgabe = nztPickVorgabe(w);
    const n = valid.length
      ? valid[nztRand(0, valid.length - 1)]
      : nztRand(Math.min(2, cap), cap);
    tasks.push({ n, vorgabe, ...nztRowValues(n) });
  }
  w.tasks = tasks;
  w.manualText = nztTasksToText(w);
}

// ── Manuelle Bearbeitung ────────────────────────────────────────────
// Textformat je Zeile: die Zahl; Präfix v/n legt fest, welche Nachbarzahl vorgegeben ist.
//   45 → Zahl vorgegeben   |   v45 → Vorgänger vorgegeben   |   n45 → Nachfolger vorgegeben
function nztTaskToLine(t) {
  if (t.vorgabe === 'vorgaenger') return `v${t.n}`;
  if (t.vorgabe === 'nachfolger') return `n${t.n}`;
  return `${t.n}`;
}
function nztTasksToText(w) {
  return (w.tasks || []).map(nztTaskToLine).join('\n');
}
// Eine Zeile parsen → Aufgabenobjekt (oder null, wenn keine Zahl gefunden).
function nztParseLine(line, w) {
  const m = String(line).trim().match(/^([vn]?)\s*(\d+)$/i);
  if (!m) return null;
  const prefix = m[1].toLowerCase();
  const n = parseInt(m[2], 10);
  const global = w.vorgabe || 'zahl';
  const vorgabe = prefix === 'v' ? 'vorgaenger'
    : prefix === 'n' ? 'nachfolger'
    : (global === 'gemischt' ? 'zahl' : global);
  return { n, vorgabe, ...nztRowValues(n) };
}
// Rohtext übernehmen: manualText merken und in w.tasks parsen (ungültige Zeilen überspringen).
function nztApplyManual(w, text) {
  w.manualText = text;
  w.tasks = String(text).split('\n')
    .map(l => nztParseLine(l, w))
    .filter(Boolean);
}

WIDGETS.push({
  meta: {
    type: 'nachbarzahlen_tabelle',
    label: 'Nachbarzahlen-Tabelle',
    desc: 'Tabelle mit Nachbarzahlen',
    icon: '⊞',
    category: 'mathematik',
    itemsLayout: true,
  },

  createData: id => {
    const w = {
      id, type: 'nachbarzahlen_tabelle',
      zahlenraum: 100,
      aufgabenProPaeckchen: 10,
      cols: 2,
      showHunderter: true,
      showZehner: true,
      showVorgNach: true,
      vorgabe: 'zahl',
      groesse: 'klein',
      itemsPerRow: 'auto',
      align: 'auto',
      itemGapH: 'normal',
      itemGapV: 'normal',
      itemGap: 'normal',
      aufgabenNr: 0, aufgabenText: '',
    };
    nztRegen(w);
    return w;
  },

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const tasks = d.tasks || [];
    const zr = d.zahlenraum || 100;
    const vis = nztVisibleCols(d);
    const tableDigits = nztSlotDigits(zr);
    // Größe wie Nachbarzahlen — skaliert nur die Zahlendarstellung
    const S = d.groesse === 'gross' ? 1.5 : d.groesse === 'mittel' ? 1.3 : 1;
    const px = v => Math.round(v * S);
    const FS = px(16);
    const LH = px(25);
    const BW = px(36);
    const boxW = Math.max(BW, Math.round(tableDigits * 9 * S) + px(8));
    const colW = `width:${boxW}px;min-width:${boxW}px;max-width:${boxW}px;`;
    const font = `font-family:'DidactGothic7',sans-serif;font-size:${FS}px;`;

    const cellHtml = (v, kind) => {
      if (kind === 'given') return `<span style="color:#1e1e2e;">${esc(String(v))}</span>`;
      if (kind === 'ans' && isActive) {
        return `<span style="color:#2563eb;font-weight:700;">${esc(String(v))}</span>`;
      }
      return '';
    };

    const zahlB = `${px(2)}px solid #aaa`;
    const zahlCell = `border-left:${zahlB};border-right:${zahlB};`;
    const outB = '1.5px solid #999';
    const divB = '1px solid #999';

    const segment = (html, colI, nCols, rowI, nRows, skipSides) => {
      const isFC = colI === 0;
      const isLC = colI === nCols - 1;
      const isFR = rowI === 0;
      const isLR = rowI === nRows - 1;
      let st = `display:flex;align-items:center;justify-content:center;width:100%;height:${LH}px;`
        + `${font}background:#fff;box-sizing:border-box;`;
      st += isFR ? `border-top:${outB};` : 'border-top:none;';
      st += isLR ? `border-bottom:${outB};` : `border-bottom:${divB};`;
      if (!skipSides) {
        if (isFC) {
          st += `border-left:${outB};`;
          if (isFR) st += 'border-top-left-radius:2px;';
          if (isLR) st += 'border-bottom-left-radius:2px;';
        } else {
          st += `border-left:${divB};`;
        }
        if (isLC) {
          st += `border-right:${outB};`;
          if (isFR) st += 'border-top-right-radius:2px;';
          if (isLR) st += 'border-bottom-right-radius:2px;';
        }
      }
      return `<div style="${st}">${html}</div>`;
    };

    const n = vis.length;
    const tableW = boxW * n;
    const numCols = d.cols || 1;
    const perCol = Math.ceil(tasks.length / numCols) || 1;
    const groups = Array.from({ length: numCols }, (_, i) =>
      tasks.slice(i * perCol, (i + 1) * perCol)
    ).filter(g => g.length);

    const renderTable = groupTasks => {
      const nRows = groupTasks.length;
      const head = vis.map(c => {
        const side = c.key === 'zahl' ? zahlCell : 'border-left:1px solid #bbb;border-right:1px solid #bbb;';
        return `<th title="${esc(c.title)}" style="${colW}padding:${px(3)}px ${px(2)}px;${font}${side}`
          + `font-weight:700;text-align:center;vertical-align:middle;line-height:1.2;`
          + `background:#f0f0f0;border-top:1px solid #bbb;border-bottom:1px solid #bbb;`
          + `color:#333;">${esc(c.abbr)}</th>`;
      }).join('');

      const body = groupTasks.map((t, ri) => {
        const cells = vis.map((c, i) => {
          const html = cellHtml(t[c.key], nztCellKind(c.key, t.vorgabe));
          const zahl = c.key === 'zahl' ? zahlCell : '';
          return `<td style="${colW}padding:0;vertical-align:top;${zahl}">`
            + `${segment(html, i, n, ri, nRows, c.key === 'zahl')}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');

      return `<table style="border-collapse:collapse;table-layout:fixed;width:${tableW}px;">`
        + `<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    };

    const sample = groups.length ? renderTable(groups[0]) : '';
    const itemW = tableW + 8;

    return atHtml(d) + flexDistribute(
      groups.map(renderTable),
      { sample, itemW, d, estimate: true }
    );
  },

  renderProps: d => {
    const zr = d.zahlenraum || 100;
    const app = d.aufgabenProPaeckchen || d.zeilen || 10;
    const cols = d.cols || 1;
    const groesse = d.groesse || 'klein';
    const vorgabe = d.vorgabe || 'zahl';
    const sh = d.showHunderter !== false;
    const sz = d.showZehner !== false;
    const svn = d.showVorgNach !== false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    const pairToggle = (label, on, key) =>
      `<div class="prow"><label>${label}</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('An', on, `nztSet(${d.id},'${key}',true)`)}
          ${toggleBtn('Aus', !on, `nztSet(${d.id},'${key}',false)`)}
        </div></div>`;

    return pairToggle('Nachbarhunderter', sh, 'showHunderter')
      + pairToggle('Nachbarzehner', sz, 'showZehner')
      + pairToggle('Vorgänger / Nachfolger', svn, 'showVorgNach')
      + pr('Zahlenraum',
        `<select onchange="nztSet(${d.id},'zahlenraum',+this.value)"
          style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;font-family:inherit;font-size:12px;">
          ${[10, 20, 100, 1000].map(n => `<option value="${n}" ${zr === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>`)
      + pr('Zeilen pro Päckchen',
        `<input type="number" min="1" max="40" value="${app}"
          onclick="event.stopPropagation()" onchange="nztSet(${d.id},'aufgabenProPaeckchen',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`)
      + pr('Anzahl Päckchen',
        `<input type="number" min="1" max="16" value="${cols}"
          onclick="event.stopPropagation()" onchange="nztSet(${d.id},'cols',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`)
      + `<div class="prow"><label>Vorgabe</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn('Zahl', vorgabe === 'zahl', `nztSet(${d.id},'vorgabe','zahl')`)}
          ${toggleBtn('Vorgänger', vorgabe === 'vorgaenger', `nztSet(${d.id},'vorgabe','vorgaenger')`)}
          ${toggleBtn('Nachfolger', vorgabe === 'nachfolger', `nztSet(${d.id},'vorgabe','nachfolger')`)}
          ${toggleBtn('Gemischt', vorgabe === 'gemischt', `nztSet(${d.id},'vorgabe','gemischt')`)}
        </div></div>`
      + `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Klein', groesse === 'klein', `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn('Mittel', groesse === 'mittel', `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn('Groß', groesse === 'gross', `upd(${d.id},'groesse','gross')`)}
        </div></div>`
      + `<button onclick="event.stopPropagation();nztWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`
      + propFold('nzt-manuell', 'Manuelle Bearbeitung',
        pr('Manuell bearbeiten (Zahl; v = Vorgänger, n = Nachfolger vorgegeben)',
          `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
            onclick="event.stopPropagation()" onchange="nztManual(${d.id},this.value)">${esc(d.manualText != null ? d.manualText : nztTasksToText(d))}</textarea>`),
        false);
  },
});

function nztSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  nztRegen(w);
  render(); renderProps(id);
}
function nztWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  nztRegen(w);
  render(); renderProps(id);
}
function nztManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  nztApplyManual(w, text);
  render(); renderProps(id);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nztRegen, nztRowValues, nztVisibleCols, nztNeighbors, nztTasksToText, nztParseLine, nztApplyManual };
}
