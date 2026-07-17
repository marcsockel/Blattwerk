// Widget: Tabelle

function tblResize(data, rows, cols) {
  // Preserve existing content when resizing
  const cur = data || [];
  return Array.from({length: rows}, (_, r) =>
    Array.from({length: cols}, (_, c) => (cur[r] && cur[r][c] !== undefined) ? cur[r][c] : "")
  );
}

// Ausgewählte Zelle (Klick/Fokus in eine Zelle). Analog zu _mtSel im Multitool.
let _tblSel = null;

WIDGETS.push({
  meta: { type:"table", label:"Tabelle", desc:"Zeilen & Spalten", icon:"⊞", category:"allgemein", selSafe:true },

  createData: id => ({
    id, type:"table", rows:3, cols:3, hasHeader:true, hasHeaderCol:false, fullWidth:true,
    font: 'inherit',
    cellStyles: {},   // sparse: {"r,c": {align, valign, fontSize}}
    colWidths: {},    // sparse: {c: px} — Breite gilt für die ganze Spalte
    data: tblResize([], 3, 3), aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const data = d.data || tblResize([], d.rows, d.cols);
    const fw = d.fullWidth !== false;
    const font = d.font || 'inherit';
    const cs = d.cellStyles || {};
    const cw = d.colWidths || {};
    const selHere = _tblSel && _tblSel.id === d.id ? _tblSel : null;
    let html = `<table style="border-collapse:collapse;${fw?'width:100%;table-layout:fixed;':'table-layout:auto;'}">`;
    html += '<colgroup>';
    for (let c = 0; c < d.cols; c++) html += `<col${cw[c] ? ` style="width:${cw[c]}px;"` : ''}>`;
    html += '</colgroup>';
    for (let r = 0; r < d.rows; r++) {
      html += "<tr>";
      for (let c = 0; c < d.cols; c++) {
        const hdr = (d.hasHeader && r === 0) || (d.hasHeaderCol && c === 0);
        const val = esc((data[r] && data[r][c]) || "");
        const st = cs[`${r},${c}`] || {};
        // Markierung nur solange das Widget selbst ausgewählt ist — und als Klasse
        // (Bildschirm-CSS), damit sie NIE mitgedruckt wird.
        const isSel = selHere && selHere.r === r && selHere.c === c && d.id === selId;
        html += `<td${isSel ? ' class="tbl-selcell" data-tblsel="1"' : ''} style="border:1px solid #888;padding:0;${fw?'':'min-width:60px;white-space:nowrap;'}
            ${st.valign ? `vertical-align:${st.valign};` : ''}">
          <div contenteditable="true"
            onclick="event.stopPropagation()"
            onfocus="tblSelCell(${d.id},${r},${c})"
            style="padding:7px 10px;font-family:${font};font-size:${st.fontSize || 13}px;min-height:22px;outline:none;word-break:break-word;
                   ${st.align ? `text-align:${st.align};` : ''}
                   ${st.bold ? 'font-weight:700;' : ''}${st.italic ? 'font-style:italic;' : ''}
                   ${hdr ? 'font-weight:700;background:#d9d9d9;' : ''}"
            oninput="tblUpdCell(${d.id},${r},${c},this.innerText)"
          >${val}</div>
        </td>`;
      }
      html += "</tr>";
    }
    return atHtml(d) + html + "</table>";
  },

  renderProps: d => {
    const fw = d.fullWidth !== false;
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${(d.font || 'inherit') === f.value ? 'selected' : ''}>${f.label}</option>`
    ).join('');
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    let html = pr("Zeilen", `<input type="number" min="1" max="20" value="${d.rows}" onchange="tblResize2(${d.id},'rows',+this.value)">`) +
      pr("Spalten", `<input type="number" min="1" max="10" value="${d.cols}" onchange="tblResize2(${d.id},'cols',+this.value)">`) +
      pr("Kopfzeile", `<select onchange="upd(${d.id},'hasHeader',this.value==='true')">
        <option value="true"  ${d.hasHeader?"selected":""}>Ja</option>
        <option value="false" ${!d.hasHeader?"selected":""}>Nein</option>
      </select>`) +
      pr("Kopfspalte", `<select onchange="upd(${d.id},'hasHeaderCol',this.value==='true')">
        <option value="true"  ${d.hasHeaderCol?"selected":""}>Ja</option>
        <option value="false" ${!d.hasHeaderCol?"selected":""}>Nein</option>
      </select>`) +
      `<div class="prow"><label>Breite</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Volle Breite", fw, `upd(${d.id},'fullWidth',true)`)}
          ${toggleBtn("Automatisch", !fw, `upd(${d.id},'fullWidth',false)`)}
        </div></div>` +
      pr("Schrift", `<select onchange="upd(${d.id},'font',this.value)">${fontOptions}</select>`);

    // ── Zellen-Parameter (sichtbar sobald eine Zelle angeklickt/fokussiert wurde) ──
    if (_tblSel && _tblSel.id === d.id && _tblSel.r < d.rows && _tblSel.c < d.cols) {
      const { r, c } = _tblSel;
      const st = (d.cellStyles || {})[`${r},${c}`] || {};
      const colW = (d.colWidths || {})[c] || '';
      html += `<div style="border-top:1px solid #e5e5e5;margin-top:12px;padding-top:10px;">
        <div style="font-weight:800;font-size:12px;color:#333;margin-bottom:8px;">Zelle — Zeile ${r+1}, Spalte ${c+1}</div>
        <div class="prow"><label>Ausrichtung</label>
          <div style="display:flex;gap:4px;">
            ${toggleBtn("Links",  (st.align||'left')==='left',  `tblSetCellProp(${d.id},'align','left')`)}
            ${toggleBtn("Mitte",  st.align==='center',          `tblSetCellProp(${d.id},'align','center')`)}
            ${toggleBtn("Rechts", st.align==='right',           `tblSetCellProp(${d.id},'align','right')`)}
          </div></div>
        <div class="prow"><label>Vertikal</label>
          <div style="display:flex;gap:4px;">
            ${toggleBtn("Oben",  st.valign==='top',                `tblSetCellProp(${d.id},'valign','top')`)}
            ${toggleBtn("Mitte", (st.valign||'middle')==='middle', `tblSetCellProp(${d.id},'valign','middle')`)}
            ${toggleBtn("Unten", st.valign==='bottom',             `tblSetCellProp(${d.id},'valign','bottom')`)}
          </div></div>
        <div class="prow"><label>Schriftstil</label>
          <div style="display:flex;gap:4px;">
            ${toggleBtn("<b>Fett</b>",   !!st.bold,   `tblSetCellProp(${d.id},'bold',${!st.bold})`)}
            ${toggleBtn("<i>Kursiv</i>", !!st.italic, `tblSetCellProp(${d.id},'italic',${!st.italic})`)}
          </div></div>
        ${pr("Fontgröße", `<input type="number" min="6" max="60" value="${st.fontSize || 13}" onchange="tblSetCellProp(${d.id},'fontSize',+this.value)"> px`)}
        ${pr("Spaltenbreite", `<input type="number" min="0" max="700" value="${colW}" placeholder="auto" onchange="tblSetColWidth(${d.id},+this.value)"> px`)}
        <div style="font-size:10px;color:#aaa;margin-top:4px;">Breite gilt für die ganze Spalte, 0 = automatisch.</div>
      </div>`;
    } else {
      html += `<div style="font-size:10px;color:#aaa;margin-top:10px;">Tipp: In eine Zelle klicken, um Ausrichtung, Fontgröße und Spaltenbreite der Zelle einzustellen.</div>`;
    }
    return html;
  },
});

// ── Table helpers ─────────────────────────────────────────────────
function tblUpdCell(id, row, col, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!w.data) w.data = tblResize([], w.rows, w.cols);
  if (!w.data[row]) w.data[row] = [];
  w.data[row][col] = value;
  // Don't re-render — cell is being edited live
}

// Zellen-Auswahl per Fokus. KEIN render() hier — die Tabelle ist selSafe, ein
// Re-Render würde der gerade fokussierten Zelle den Cursor stehlen. Die Markierung
// wird direkt am DOM gesetzt; render() zeichnet sie über das isSel-Inline-Style nach.
function tblSelCell(id, r, c) {
  if (_tblSel && _tblSel.id === id && _tblSel.r === r && _tblSel.c === c) return;
  _tblSel = { id, r, c };
  // vorherige Markierung entfernen, neue setzen (td = Elternelement der Zelle)
  document.querySelectorAll('#canvas-area td[data-tblsel]').forEach(td => {
    td.classList.remove('tbl-selcell'); td.removeAttribute('data-tblsel');
  });
  const winner = document.querySelector(`.wwrap[data-id="${id}"] .winner`);
  const td = winner && winner.querySelectorAll('table tr')[r]?.children[c];
  if (td) { td.classList.add('tbl-selcell'); td.setAttribute('data-tblsel','1'); }
  if (selId !== id) sel(id); else renderProps(id);
}

/** Zellen-Markierung aufheben (Widget abgewählt / anderes gewählt / Druck). */
function tblClearCellSel() {
  _tblSel = null;
  document.querySelectorAll('#canvas-area td[data-tblsel]').forEach(td => {
    td.classList.remove('tbl-selcell'); td.removeAttribute('data-tblsel');
  });
}

function tblSetCellProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!_tblSel || _tblSel.id !== id) return;
  saveHistory();
  if (!w.cellStyles) w.cellStyles = {};
  const k = `${_tblSel.r},${_tblSel.c}`;
  w.cellStyles[k] = w.cellStyles[k] || {};
  w.cellStyles[k][key] = val;
  _dirty = true; scheduleDraftSave();
  if (!patchWidget(id)) render();
  renderProps(id);
}

function tblSetColWidth(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!_tblSel || _tblSel.id !== id) return;
  saveHistory();
  if (!w.colWidths) w.colWidths = {};
  if (val > 0) w.colWidths[_tblSel.c] = val; else delete w.colWidths[_tblSel.c];
  _dirty = true; scheduleDraftSave();
  if (!patchWidget(id)) render();
  renderProps(id);
}

function tblResize2(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.data = tblResize(w.data, w.rows, w.cols);
  if (_tblSel && _tblSel.id === id && (_tblSel.r >= w.rows || _tblSel.c >= w.cols)) _tblSel = null;
  render(); renderProps(id);
}
