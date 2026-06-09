// Widget: Eingabekästchen (ein Zeichen pro Zelle)

WIDGETS.push({
  meta: { type:'eingabekaestchen', label:'Eingabekästchen', desc:'Ein Zeichen pro Kästchen', icon:'⊡', category:'mathematik' },

  createData: id => ({ id, type:'eingabekaestchen', groesse:'mittel', zeilen:4, values:{}, lines:[], mode:'schreiben', font:'inherit' }),

  render: d => {
    const sizes  = { klein: 15, mittel: 20, gross: 40 };
    const cs     = sizes[d.groesse || 'mittel'];
    const fullCols = { klein: 37, mittel: 28, gross: 14 }[d.groesse || 'mittel'];
    const cols   = d.halfWidth ? Math.floor(fullCols / 2) : fullCols;
    const rows   = d.zeilen || 4;
    const w      = cols * cs;
    const h      = rows * cs;
    const fs     = Math.round(cs * 0.58);
    const pfx    = `ekz${d.id}`;
    const vals   = d.values || {};
    const linien = d.lines  || [];
    const isLinien = d.mode === 'linien';

    // Eingabe-Zellen
    let inputs = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const val = esc(vals[idx] || '');
        inputs += `<input id="${pfx}_${idx}" maxlength="1" value="${val}"
          ${isLinien ? 'tabindex="-1"' : `oninput="ekzInput(${d.id},'${pfx}',${idx},${cols},${rows})" onkeydown="ekzKey(event,${d.id},'${pfx}',${idx},${cols},${rows})"`}
          style="width:${cs}px;height:${cs}px;border:none;border-right:0.7px solid #888;
                 border-bottom:0.7px solid #888;outline:none;text-align:center;
                 font-family:${d.font||'inherit'};font-size:${fs}px;font-weight:700;
                 background:transparent;padding:0;margin:0;box-sizing:border-box;
                 cursor:${isLinien?'crosshair':'text'};">`;
      }
    }

    // Gespeicherte Linien als SVG-Pfade
    let svgContent = linien.map(l =>
      `<line x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>`
    ).join('');

    // Im Linien-Modus: SVG fängt Mausereignisse ab
    const svgAttrs = isLinien
      ? `id="ekzsvg${d.id}" cursor="crosshair"
           onmousedown="ekzLDown(event,${d.id},${cs})"
           onmousemove="ekzLMove(event,${d.id},${cs})"
           onmouseup="ekzLUp(event,${d.id},${cs})"
           onmouseleave="ekzLCancel(${d.id})"
           style="position:absolute;inset:0;"`
      : `id="ekzsvg${d.id}" style="position:absolute;inset:0;pointer-events:none;"`;

    const svg = `<svg ${svgAttrs} width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${w}" height="${h}" fill="${isLinien?'rgba(137,180,250,0.06)':'none'}"/>
      ${svgContent}
      <line id="ekzprev${d.id}" stroke="#89b4fa" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4,3" x1="0" y1="0" x2="0" y2="0"/>
    </svg>`;

    return `<div onclick="event.stopPropagation()" style="position:relative;display:inline-block;line-height:0;">
      <div style="display:grid;grid-template-columns:repeat(${cols},${cs}px);
                  width:${w}px;gap:0;
                  border-left:0.7px solid #888;border-top:0.7px solid #888;
                  line-height:0;font-size:0;">${inputs}</div>
      ${svg}
    </div>`;
  },

  renderProps: d => {
    const g      = d.groesse || 'mittel';
    const rows   = d.zeilen  || 4;
    const isLinien = d.mode === 'linien';
    const lineCount = (d.lines || []).length;

    const sizeBtn = (val, label) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'groesse','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${g===val?'#89b4fa':'#ddd'};
               background:${g===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${g===val?'#1e1e2e':'#999'};">${label}</button>`;

    const modeBtn = (val, label, icon) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'mode','${val}')"
        style="flex:1;padding:6px 4px;border-radius:4px;border:1.5px solid ${d.mode===val?'#a6e3a1':'#ddd'};
               background:${d.mode===val?'#e8fdf0':'#fff'};font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;color:${d.mode===val?'#1e1e2e':'#999'};">${icon} ${label}</button>`;

    return `<div class="prow"><label>Modus</label>
      <div style="display:flex;gap:4px;">
        ${modeBtn('schreiben','Schreiben','✏️')}
        ${modeBtn('linien','Linien','—')}
      </div></div>` +

      `<div class="prow"><label>Kästchengröße</label>
      <div style="display:flex;gap:4px;">
        ${sizeBtn('klein','Klein')}
        ${sizeBtn('mittel','Mittel')}
        ${sizeBtn('gross','Groß')}
      </div></div>` +

      pr('Zeilen', `<input type="number" min="1" max="20" value="${rows}" onchange="upd(${d.id},'zeilen',+this.value)">`) +
      pr('Schrift', `<select onchange="upd(${d.id},'font',this.value)">
        ${GAP_FONTS.map(f => `<option value="${f.value}" ${(d.font||'inherit')===f.value?'selected':''}>${f.label}</option>`).join('')}
      </select>`) +

      (isLinien ? `<div style="padding:6px 0;color:#888;font-size:11px;line-height:1.5;">
        Klicken &amp; ziehen um eine Linie zu zeichnen.<br>Rastet auf Gitterpunkte ein.
      </div>` : '') +

      (lineCount > 0 ? `<div style="display:flex;gap:4px;margin-top:4px;">
        <button onclick="event.stopPropagation();ekzUndoLine(${d.id})"
          style="flex:1;padding:5px;border:1.5px solid #ddd;border-radius:4px;background:#fff;
                 font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:#666;">
          ↩ Letzte Linie (${lineCount})</button>
        <button onclick="event.stopPropagation();ekzClearLines(${d.id})"
          style="flex:1;padding:5px;border:none;border-radius:4px;background:#f38ba8;
                 font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:#1e1e2e;">
          ✕ Alle Linien</button>
      </div>` : '') +

      `<button onclick="event.stopPropagation();ekzClear(${d.id})"
        style="margin-top:4px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#f38ba8;color:#1e1e2e;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">✕ Alle Felder leeren</button>`;
  },
});

// ── Schreiben-Modus Helpers ────────────────────────────────────────
function ekzInput(id, pfx, idx, cols, rows) {
  const el = document.getElementById(`${pfx}_${idx}`);
  if (!el) return;
  const w = widgets.find(x => x.id === id);
  const val = el.value;

  // ")" in leerer Zelle → zur vorherigen Zelle anhängen
  if (val === ')' && idx > 0) {
    const prevEl = document.getElementById(`${pfx}_${idx - 1}`);
    if (prevEl && prevEl.value.length > 0 && !prevEl.value.includes(')')) {
      el.value = '';
      prevEl.value += ')';
      if (w) { if (!w.values) w.values = {}; w.values[idx - 1] = prevEl.value; delete w.values[idx]; }
      const next = idx + 1;
      if (next < cols * rows) { const n = document.getElementById(`${pfx}_${next}`); if (n) { n.focus(); n.select(); } }
      return;
    }
  }

  if (w) { if (!w.values) w.values = {}; w.values[idx] = val; }
  if (val.length > 0) {
    const next = idx + 1;
    if (next < cols * rows) { const n = document.getElementById(`${pfx}_${next}`); if (n) { n.focus(); n.select(); } }
  }
}

function ekzKey(e, id, pfx, idx, cols, rows) {
  const total = cols * rows;
  let next = -1;
  if      (e.key === 'ArrowRight') { e.preventDefault(); next = idx + 1; }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); next = idx - 1; }
  else if (e.key === 'ArrowDown')  { e.preventDefault(); next = idx + cols; }
  else if (e.key === 'ArrowUp')    { e.preventDefault(); next = idx - cols; }
  else if (e.key === 'Backspace') {
    const el = document.getElementById(`${pfx}_${idx}`);
    if (el && el.value === '') {
      e.preventDefault(); next = idx - 1;
      const w = widgets.find(x => x.id === id);
      if (w && w.values) delete w.values[idx];
    }
  }
  if (next >= 0 && next < total) {
    const el = document.getElementById(`${pfx}_${next}`);
    if (el) { el.focus(); el.select(); }
  }
}

// ── Linien-Modus Helpers ───────────────────────────────────────────
window._ekzDraw = {};

function _ekzSnap(e, svgEl, cs) {
  const snap = cs / 2;
  const r = svgEl.getBoundingClientRect();
  return {
    x: Math.round((e.clientX - r.left) / snap) * snap,
    y: Math.round((e.clientY - r.top)  / snap) * snap,
  };
}

function ekzLDown(e, id, cs) {
  const svg = document.getElementById(`ekzsvg${id}`); if (!svg) return;
  const p = _ekzSnap(e, svg, cs);
  window._ekzDraw[id] = { active:true, x1:p.x, y1:p.y, x2:p.x, y2:p.y };
  e.preventDefault();
}

function ekzLMove(e, id, cs) {
  const ds = window._ekzDraw[id]; if (!ds?.active) return;
  const svg = document.getElementById(`ekzsvg${id}`); if (!svg) return;
  const p = _ekzSnap(e, svg, cs);
  const dx = Math.abs(p.x - ds.x1), dy = Math.abs(p.y - ds.y1);
  // Achse einrasten: horizontal oder vertikal
  const x2 = dx >= dy ? p.x : ds.x1;
  const y2 = dx >= dy ? ds.y1 : p.y;
  const prev = document.getElementById(`ekzprev${id}`);
  if (prev) { prev.setAttribute('x1',ds.x1); prev.setAttribute('y1',ds.y1); prev.setAttribute('x2',x2); prev.setAttribute('y2',y2); }
  ds.x2 = x2; ds.y2 = y2;
}

function ekzLUp(e, id, cs) {
  const ds = window._ekzDraw[id]; if (!ds?.active) return;
  ds.active = false;
  if (ds.x1 !== ds.x2 || ds.y1 !== ds.y2) {
    const w = widgets.find(x => x.id === id); if (!w) return;
    saveHistory();
    if (!w.lines) w.lines = [];
    w.lines.push({ x1:ds.x1, y1:ds.y1, x2:ds.x2, y2:ds.y2 });
    render(); renderProps(id);
  } else {
    // Nur Klick ohne Zug → Preview zurücksetzen
    const prev = document.getElementById(`ekzprev${id}`);
    if (prev) { prev.setAttribute('x1',0); prev.setAttribute('y1',0); prev.setAttribute('x2',0); prev.setAttribute('y2',0); }
  }
}

function ekzLCancel(id) {
  const ds = window._ekzDraw[id]; if (!ds) return;
  ds.active = false;
  const prev = document.getElementById(`ekzprev${id}`);
  if (prev) { prev.setAttribute('x1',0); prev.setAttribute('y1',0); prev.setAttribute('x2',0); prev.setAttribute('y2',0); }
}

function ekzUndoLine(id) {
  const w = widgets.find(x => x.id === id); if (!w || !w.lines?.length) return;
  saveHistory();
  w.lines = w.lines.slice(0, -1);
  render(); renderProps(id);
}

function ekzClearLines(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.lines = [];
  render(); renderProps(id);
}

function ekzClear(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.values = {};
  render(); renderProps(id);
}
