// Widget: Tabelle

function tblResize(data, rows, cols) {
  // Preserve existing content when resizing
  const cur = data || [];
  return Array.from({length: rows}, (_, r) =>
    Array.from({length: cols}, (_, c) => (cur[r] && cur[r][c] !== undefined) ? cur[r][c] : "")
  );
}

WIDGETS.push({
  meta: { type:"table", label:"Tabelle", desc:"Zeilen & Spalten", icon:"⊞", category:"allgemein" },

  createData: id => ({
    id, type:"table", rows:3, cols:3, hasHeader:true, fullWidth:true,
    data: tblResize([], 3, 3)
  }),

  render: d => {
    const data = d.data || tblResize([], d.rows, d.cols);
    const fw = d.fullWidth !== false;
    let html = `<table style="border-collapse:collapse;${fw?'width:100%;table-layout:fixed;':'table-layout:auto;'}">`;
    for (let r = 0; r < d.rows; r++) {
      html += "<tr>";
      for (let c = 0; c < d.cols; c++) {
        const hdr = d.hasHeader && r === 0;
        const val = esc((data[r] && data[r][c]) || "");
        html += `<td style="border:1px solid #ddd;padding:0;min-width:60px;${fw?'':'white-space:nowrap;'}">
          <div contenteditable="true"
            onclick="event.stopPropagation()"
            style="padding:7px 10px;font-size:13px;min-height:22px;outline:none;word-break:break-word;
                   ${hdr ? 'font-weight:700;background:#f5f3ef;' : ''}"
            oninput="tblUpdCell(${d.id},${r},${c},this.innerText)"
          >${val}</div>
        </td>`;
      }
      html += "</tr>";
    }
    return html + "</table>";
  },

  renderProps: d => {
    const fw = d.fullWidth !== false;
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    return pr("Zeilen", `<input type="number" min="1" max="20" value="${d.rows}" onchange="tblResize2(${d.id},'rows',+this.value)">`) +
      pr("Spalten", `<input type="number" min="1" max="10" value="${d.cols}" onchange="tblResize2(${d.id},'cols',+this.value)">`) +
      pr("Kopfzeile", `<select onchange="upd(${d.id},'hasHeader',this.value==='true')">
        <option value="true"  ${d.hasHeader?"selected":""}>Ja</option>
        <option value="false" ${!d.hasHeader?"selected":""}>Nein</option>
      </select>`) +
      `<div class="prow"><label>Breite</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Volle Breite", fw, `upd(${d.id},'fullWidth',true)`)}
          ${toggleBtn("Automatisch", !fw, `upd(${d.id},'fullWidth',false)`)}
        </div></div>`;
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

function tblResize2(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.data = tblResize(w.data, w.rows, w.cols);
  render(); renderProps(id);
}
