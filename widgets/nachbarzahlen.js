// Widget: Nachbarzahlen
// Klassische Aufgaben: Zahl davor/danach bzw. ___, 45, ___

function nzRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Stellenzahl für die Zahlenspalte.
function nzSlotDigits(zr) {
  if (zr >= 1000) return 3;
  if (zr >= 100) return 2;
  return 2;
}

// Obergrenze für Würfeln: 100 bzw. 1000 nicht als vorgegebene Zahl (keine Extra-Stelle nötig).
function nzGenCap(zr, mode) {
  if (zr === 100) return 99;
  if (zr === 1000) return 999;
  return zr;
}

function nzCellDigits(zr, mode, n) {
  return nzSlotDigits(zr);
}

function nzTableDigits(zr, widgetModus) {
  return nzSlotDigits(zr);
}

function nzNeighbors(n, typ) {
  const t = typ || 'zahl';
  if (t === 'zahl') return { before: n - 1, after: n + 1 };
  const unit = t === 'hunderter' ? 100 : 10;
  if (n % unit === 0) return { before: n - unit, after: n + unit };
  const base = Math.floor(n / unit) * unit;
  return { before: base, after: base + unit };
}

function nzValidNs(zr, mode, typ) {
  const cap = nzGenCap(zr, mode);
  const minN = 1;
  const valid = [];
  for (let n = minN; n <= cap; n++) {
    const { before, after } = nzNeighbors(n, typ);
    if (mode === 'beide') {
      if (before >= minN && after <= cap) valid.push(n);
    } else if (mode === 'davor') {
      if (before >= minN) valid.push(n);
    } else if (after <= cap) {
      valid.push(n);
    }
  }
  return valid;
}

function nzAufgabenmodus(w) {
  return w.aufgabenmodus || w.modus || 'beide';
}

function nzPickMode(w) {
  const m = nzAufgabenmodus(w);
  if (m !== 'gemischt') return m;
  return Math.random() < 0.5 ? 'davor' : 'danach';
}

function nzTotal(w) {
  return Math.max(1, (w.aufgabenProPaeckchen || 6) * (w.cols || 2));
}

// Eine einzelne Aufgabe würfeln.
function nzGenTask(w) {
  const zr = w.zahlenraum || 20;
  const typ = w.nachbarTyp || 'zahl';
  const minN = 1;
  const mode = nzPickMode(w);
  const valid = nzValidNs(zr, mode, typ);
  let n, before, after;
  if (valid.length) {
    n = valid[nzRand(0, valid.length - 1)];
    ({ before, after } = nzNeighbors(n, typ));
  } else {
    n = Math.min(minN + 1, nzGenCap(zr, mode));
    ({ before, after } = nzNeighbors(n, typ));
  }
  return { mode, n, before, after };
}

// Alle Aufgaben neu würfeln.
function nzRegen(w) {
  const total = nzTotal(w);
  const tasks = [];
  for (let i = 0; i < total; i++) tasks.push(nzGenTask(w));
  w.tasks = tasks;
  w.manualText = nzTasksToText(w);
}

// Nur die Anzahl anpassen: vorhandene Aufgaben behalten, fehlende ergänzen bzw.
// überzählige abschneiden (z.B. beim Hinzufügen eines Päckchens).
function nzResize(w) {
  const total = nzTotal(w);
  const tasks = (w.tasks || []).slice(0, total);
  while (tasks.length < total) tasks.push(nzGenTask(w));
  w.tasks = tasks;
  w.manualText = nzTasksToText(w);
}

// ── Manuelle Bearbeitung ────────────────────────────────────────────
// Textformat je Aufgabe (eine Zeile), "_" markiert die zu ergänzende Nachbarzahl:
//   _, 45, _   → beide    |   _, 45 → Vorgänger   |   45, _ → Nachfolger   |   45 → Standardmodus
function nzTaskToLine(t) {
  if (t.mode === 'davor') return `_, ${t.n}`;
  if (t.mode === 'danach') return `${t.n}, _`;
  return `_, ${t.n}, _`;
}
function nzTasksToText(w) {
  return (w.tasks || []).map(nzTaskToLine).join('\n');
}
// Eine Zeile parsen → Aufgabenobjekt (oder null, wenn keine Zahl gefunden).
function nzParseLine(line, typ, defaultMode) {
  const tokens = String(line).trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) return null;
  const numIdx = tokens.findIndex(tk => /^\d+$/.test(tk));
  if (numIdx < 0) return null;
  const n = parseInt(tokens[numIdx], 10);
  const underscores = tokens.filter(tk => tk === '_').length;
  let mode;
  if (underscores >= 2) mode = 'beide';
  else if (underscores === 1) mode = numIdx === 0 ? 'danach' : 'davor';
  else mode = defaultMode === 'gemischt' ? 'beide' : defaultMode;
  const { before, after } = nzNeighbors(n, typ);
  return { mode, n, before, after };
}
// Rohtext übernehmen: manualText merken und in w.tasks parsen (ungültige Zeilen überspringen).
function nzApplyManual(w, text) {
  w.manualText = text;
  const typ = w.nachbarTyp || 'zahl';
  const defaultMode = nzAufgabenmodus(w);
  w.tasks = String(text).split('\n')
    .map(l => nzParseLine(l, typ, defaultMode))
    .filter(Boolean);
}

WIDGETS.push({
  meta: { type: 'nachbarzahlen', label: 'Nachbarzahlen', desc: 'Zahl davor und danach', icon: '«»', category: 'mathematik' },

  createData: id => {
    const w = {
      id, type: 'nachbarzahlen',
      zahlenraum: 20,
      nachbarTyp: 'zahl',
      aufgabenmodus: 'beide',
      cols: 2,
      aufgabenProPaeckchen: 4,
      groesse: 'klein',
      align: 'center',
      aufgabenNr: 0, aufgabenText: '',
    };
    nzRegen(w);
    return w;
  },

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const tasks = d.tasks || [];
    const zr = d.zahlenraum || 20;
    const widgetModus = nzAufgabenmodus(d);
    const isBeide = widgetModus === 'beide';
    const tableDigits = nzTableDigits(zr, widgetModus);
    const S = d.groesse === 'gross' ? 1.5 : d.groesse === 'mittel' ? 1.3 : 1;
    const px = v => Math.round(v * S);
    const FS = px(16);   // wie Rechenaufgaben
    const LH = px(25);   // Kästchenhöhe (+¼ gegenüber Rechenaufgaben)
    const numCols = d.cols || 2;
    const perCol = Math.ceil(tasks.length / numCols) || 1;
    const groups = Array.from({ length: numCols }, (_, i) =>
      tasks.slice(i * perCol, (i + 1) * perCol)
    ).filter(g => g.length);

    const BW = px(36);
    const boxW = Math.max(BW, Math.round(tableDigits * 9 * S) + px(8));
    const tdBase = `padding:${px(3)}px 0;font-size:${FS}px;font-family:'DidactGothic7',sans-serif;vertical-align:middle;line-height:${LH}px;`;
    const cellBase = `display:inline-flex;align-items:center;justify-content:center;width:${boxW}px;height:100%;`
      + `font-family:'DidactGothic7',sans-serif;font-size:${FS}px;background:#fff;`;

    const cellHtml = (v, kind) => {
      if (kind === 'given') return `<span style="color:#1e1e2e;">${esc(String(v))}</span>`;
      if (kind === 'ans' && isActive) {
        return `<span style="color:#2563eb;font-weight:700;">${esc(String(v))}</span>`;
      }
      return '';
    };

    const taskRow = cells => {
      const last = cells.length - 1;
      const inner = cells.map((html, i) => {
        let outerR = '';
        if (i === 0) outerR = 'border-top-left-radius:2px;border-bottom-left-radius:2px;';
        if (i === last) outerR = 'border-top-right-radius:2px;border-bottom-right-radius:2px;';
        return `<span style="${cellBase}${i ? 'border-left:1px solid #999;' : ''}${outerR}">${html}</span>`;
      }).join('');
      return `<span style="display:inline-flex;height:${LH}px;border:1.5px solid #999;border-radius:2px;`
        + `vertical-align:middle;background:#fff;overflow:hidden;">${inner}</span>`;
    };

    const renderTaskTable = t => {
      let row;
      if (isBeide) {
        row = taskRow([
          cellHtml(t.before, 'ans'),
          cellHtml(t.n, 'given'),
          cellHtml(t.after, 'ans'),
        ]);
      } else if (t.mode === 'davor') {
        row = taskRow([cellHtml(t.before, 'ans'), cellHtml(t.n, 'given')]);
      } else {
        row = taskRow([cellHtml(t.n, 'given'), cellHtml(t.after, 'ans')]);
      }
      return `<div style="${tdBase}">${row}</div>`;
    };

    const renderGroup = group => group.map(renderTaskTable).join('');

    const sample = tasks.length ? renderGroup([tasks[0]]) : '';
    const itemW = (isBeide ? boxW * 3 : boxW * 2) + 8;

    return atHtml(d) + flexDistribute(
      groups.map(renderGroup),
      { gap: 40, marginBottom: 16, sample, itemW, d, estimate: true }
    );
  },

  renderProps: d => {
    const zr = d.zahlenraum || 20;
    const nachbarTyp = d.nachbarTyp || 'zahl';
    const aufgabenmodus = nzAufgabenmodus(d);
    const app = d.aufgabenProPaeckchen || 4;
    const cols = d.cols || 2;
    const groesse = d.groesse || 'klein';

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    const lblDavor = nachbarTyp === 'zahl' ? 'Vorgänger' : 'Davor';
    const lblDanach = nachbarTyp === 'zahl' ? 'Nachfolger' : 'Danach';

    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn('Nachbarzahl', nachbarTyp === 'zahl', `nzSet(${d.id},'nachbarTyp','zahl')`)}
          ${toggleBtn('Nachbarzehner', nachbarTyp === 'zehner', `nzSet(${d.id},'nachbarTyp','zehner')`)}
          ${toggleBtn('Nachbarhunderter', nachbarTyp === 'hunderter', `nzSet(${d.id},'nachbarTyp','hunderter')`)}
        </div></div>` +
      pr('Zahlenraum',
        `<select onchange="nzSet(${d.id},'zahlenraum',+this.value)"
          style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;font-family:inherit;font-size:12px;">
          ${[10, 20, 100, 1000].map(n => `<option value="${n}" ${zr === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>`) +
      `<div class="prow"><label>Aufgabenmodus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn('Beide', aufgabenmodus === 'beide', `nzSet(${d.id},'aufgabenmodus','beide')`)}
          ${toggleBtn(lblDavor, aufgabenmodus === 'davor', `nzSet(${d.id},'aufgabenmodus','davor')`)}
          ${toggleBtn(lblDanach, aufgabenmodus === 'danach', `nzSet(${d.id},'aufgabenmodus','danach')`)}
          ${toggleBtn('Gemischt', aufgabenmodus === 'gemischt', `nzSet(${d.id},'aufgabenmodus','gemischt')`)}
        </div></div>` +
      pr('Aufgaben pro Päckchen',
        `<input type="number" min="1" max="20" value="${app}"
          onclick="event.stopPropagation()" onchange="nzSet(${d.id},'aufgabenProPaeckchen',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      pr('Anzahl Päckchen',
        `<input type="number" min="1" max="16" value="${cols}"
          onclick="event.stopPropagation()" onchange="nzSet(${d.id},'cols',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Klein', groesse === 'klein', `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn('Mittel', groesse === 'mittel', `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn('Groß', groesse === 'gross', `upd(${d.id},'groesse','gross')`)}
        </div></div>` +
      alignToggle(d.id, d.align) +
      `<button onclick="event.stopPropagation();nzWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
      propFold('nz-manuell', 'Manuelle Bearbeitung',
        pr('Manuell bearbeiten (_ = Nachbarzahl, z.B. _, 45, _)',
          `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
            onclick="event.stopPropagation()" onchange="nzManual(${d.id},this.value)">${esc(d.manualText != null ? d.manualText : nzTasksToText(d))}</textarea>`),
        false);
  },
});

function nzSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  // Bei reiner Mengenänderung (Päckchen/Aufgaben) vorhandene Aufgaben behalten.
  if (key === 'cols' || key === 'aufgabenProPaeckchen') nzResize(w);
  else nzRegen(w);
  render(); renderProps(id);
}
function nzWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  nzRegen(w);
  render(); renderProps(id);
}
function nzManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  nzApplyManual(w, text);
  render(); renderProps(id);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { nzRegen, nzPickMode, nzNeighbors, nzValidNs, nzAufgabenmodus, nzSlotDigits, nzGenCap, nzCellDigits, nzTableDigits, nzTasksToText, nzParseLine, nzApplyManual };
}
