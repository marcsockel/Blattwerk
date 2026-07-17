// Widget: Multitool (Beta)
// Ein Raster (X×Y), bei dem jedes Feld einen eigenen Inhaltstyp bekommt:
// Leer · Schreibfeld · Text · Checkliste · Bild · Kästchengrid.
// Feldauswahl + Typ/Inhalt laufen über das Props-Panel (Mini-Map).
// Text/Schreibfeld-Label sind zusätzlich direkt im Feld editierbar (selSafe).

// View-State (NICHT persistent / nicht in History): welches Feld gerade
// im Props-Panel bearbeitet wird. { id, idx }
let _mtSel = null;

const MT_TYPES = [
  ['empty',     'Leer'],
  ['write',     'Schreibfeld'],
  ['text',      'Text'],
  ['checklist', 'Checkliste'],
  ['image',     'Bild'],
  ['grid',      'Kästchen'],
  ['zwanzigerfeld',     'Zwanzigerfeld'],
  ['erste_paketchen',   'Erste Päckchen'],
  ['ep_zehner_stop',    '10er Stop'],
  ['ep_analogie',       'Analogie'],
  ['ep_zerlegung',      'Zahlenzerlegung'],
  ['ep_umkehr',         'Umkehraufgabe'],
];
const MT_ICON = { empty:'·', write:'✍', text:'T', checklist:'☑', image:'🖼', grid:'⊞',
  zwanzigerfeld:'⬛', erste_paketchen:'📦', ep_zehner_stop:'🔟', ep_analogie:'↔️',
  ep_zerlegung:'✂️', ep_umkehr:'🔄' };
const MT_EMBED_TYPES = new Set([
  'zwanzigerfeld', 'erste_paketchen', 'ep_zehner_stop', 'ep_analogie', 'ep_zerlegung', 'ep_umkehr',
]);

function mtEnsureCells(w) {
  const n = (w.gx || 2) * (w.gy || 2);
  if (!w.cells) w.cells = [];
  while (w.cells.length < n) w.cells.push({ type:'empty' });
  if (w.cells.length > n) w.cells = w.cells.slice(0, n);
}

function mtAlignWrap(cell, inner) {
  const align = cell.align || 'left';
  // Volle Zellbreite beibehalten — flex+align-items würde Schreibfeld/Kästchen auf ~0px Breite stauchen.
  return `<div style="width:100%;text-align:${align};box-sizing:border-box;">${inner}</div>`;
}

function mtFontSelect(id, idx, font) {
  const cur = font || 'inherit';
  const opts = GAP_FONTS.map(f =>
    `<option value="${f.value}" ${cur === f.value ? 'selected' : ''}>${f.label}</option>`
  ).join('');
  return pr('Schrift', `<select onchange="mtSetCellProp(${id},${idx},'font',this.value)">${opts}</select>`);
}

function mtAlignToggle(id, idx, align) {
  const cur = align || 'left';
  const btn = (val, label) =>
    `<button onclick="event.stopPropagation();mtSetCellProp(${id},${idx},'align','${val}')"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur === val ? '#89b4fa' : '#ddd'};
             background:${cur === val ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${cur === val ? '#1e1e2e' : '#999'};">${label}</button>`;
  return `<div class="prow"><label>Ausrichtung</label>
    <div style="display:flex;gap:4px;">${btn('left', 'Links')}${btn('center', 'Mitte')}${btn('right', 'Rechts')}</div></div>`;
}

function mtRenderWrite(cell) {
  const lineatur      = cell.lineatur     || 0;
  const lineaturGross = cell.lineaturGross || false;
  const lMul          = lineaturGross ? 1.5 : 1;
  const answerText    = cell.html         || '';
  const fontSize      = cell.fontSize     || 13;
  const font          = cell.font         || 'inherit';
  const h = v => Math.round(v * lMul);
  const answerFs = lineatur === 0 ? fontSize : (lineatur === 1 ? 24 : 22) * lMul;
  const baselineAdj = (font === 'inherit' || font.includes('Grundschrift') || font.includes('DM Mono') || font.includes('Caveat')) ? 0 : 2;
  const answerSegs = answerText ? answerText.split(/<br\s*\/?>/i) : [];

  const textOverlay = (seg, bottomPx) =>
    `<div style="position:absolute;top:0;left:4px;right:4px;bottom:${bottomPx}px;display:flex;align-items:flex-end;pointer-events:none;">` +
    `<span style="font-size:${answerFs}px;font-family:${font};line-height:1;white-space:nowrap;overflow:visible;color:#222;">${seg}</span></div>`;

  const renderLine = (lineIdx) => {
    const seg = answerSegs[lineIdx] || '';
    const withText = !!seg;
    if (lineatur === 1) {
      return `<div style="position:relative;margin-bottom:${h(10)}px;border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;">` +
        `<div style="height:${h(11)}px;border-top:1px solid #bbb;"></div>` +
        `<div style="height:${h(11)}px;border-top:1px solid #bbb;background:#dff0f8;"></div>` +
        `<div style="height:${h(11)}px;border-top:2px solid #777;"></div>` +
        `<div style="height:${h(3)}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
        (withText ? textOverlay(seg, 14 * lMul - Math.round(answerFs * 0.2) + baselineAdj) : '') +
        `</div>`;
    }
    if (lineatur === 2) {
      return `<div style="position:relative;margin-bottom:${h(10)}px;background:#fff;">` +
        `<div style="height:${h(16)}px;border-top:1px dashed #bbb;"></div>` +
        `<div style="height:${h(5)}px;border-top:2px solid #777;"></div>` +
        `<div style="height:${h(4)}px;border-top:1px solid #bbb;"></div>` +
        (withText ? textOverlay(seg, 9 * lMul - Math.round(answerFs * 0.2) + baselineAdj) : '') +
        `</div>`;
    }
    return `<div style="position:relative;border-bottom:1.5px solid #999;height:${h(26)}px;margin-bottom:${h(6)}px;">` +
      (withText ? textOverlay(seg, Math.round(answerFs * 0.1) - 3) : '') +
      `</div>`;
  };

  return `<div style="width:100%;">${Array.from({ length: cell.lines || 3 }, (_, i) => `
    ${(cell.label && i === 0) ? `<div style="font-size:11px;color:#888;font-weight:700;margin-bottom:2px;">${esc(cell.label)}</div>` : ''}
    ${renderLine(i)}
  `).join('')}</div>`;
}

function mtRenderCell(d, cell, i) {
  const t = cell.type || 'empty';

  if (t === 'text') {
    const font  = cell.font || 'inherit';
    const fs    = cell.fontSize || 13;
    const align = cell.align || 'left';
    const inner = `<div contenteditable="true"
        onclick="event.stopPropagation()"
        onfocus="edFocus()" onblur="edBlur()"
        oninput="mtCellLive(${d.id},${i},'html',this.innerHTML)"
        style="outline:none;font-family:${font};font-size:${fs}px;line-height:1.6;
               min-height:38px;color:#333;white-space:pre-wrap;word-break:break-word;text-align:${align};width:100%;"
      >${cell.html || ''}</div>`;
    return mtAlignWrap(cell, inner);
  }

  if (t === 'write') {
    return mtAlignWrap(cell, mtRenderWrite(cell));
  }

  if (t === 'checklist') {
    const items = cell.items || [];
    const font  = cell.font || 'inherit';
    const fs    = cell.fontSize || 13;
    if (!items.length) {
      return mtAlignWrap(cell, `<div class="mt-empty-hint" style="color:#ccc;font-size:11px;">(leere Checkliste)</div>`);
    }
    const inner = items.map(it =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-family:${font};font-size:${fs}px;color:#333;">
         <div style="width:14px;height:14px;border:2px solid #999;border-radius:2px;flex-shrink:0;"></div>${esc(it)}
       </div>`).join('');
    return mtAlignWrap(cell, `<div style="display:inline-block;text-align:left;max-width:100%;">${inner}</div>`);
  }

  if (t === 'image') {
    const align   = cell.align || 'center';
    const marginH = align === 'center' ? 'auto' : align === 'right' ? '0 0 0 auto' : '0';
    const height  = cell.height || 120;
    if (cell.src) {
      const fil = cell.grayscale ? 'filter:grayscale(100%);' : '';
      const tfa = [];
      if (cell.rotate) tfa.push(`rotate(${cell.rotate}deg)`);
      if (cell.flipH)  tfa.push('scaleX(-1)');
      if (cell.flipV)  tfa.push('scaleY(-1)');
      const tf = tfa.length ? `transform:${tfa.join(' ')};` : '';
      const inner = `<div style="text-align:${align};width:100%;">
        <img src="${cell.src}"
          ondragover="event.preventDefault()"
          ondrop="event.stopPropagation();mtImgDrop(${d.id},${i},event)"
          style="max-width:100%;height:${height}px;object-fit:contain;border-radius:4px;display:block;margin:${marginH};${fil}${tf}">
        ${cell.caption ? `<div style="font-size:11px;color:#888;margin-top:4px;text-align:${align};">${esc(cell.caption)}</div>` : ''}
      </div>`;
      return mtAlignWrap(cell, inner);
    }
    const inner = `<div class="mt-img-drop"
        ondragover="event.preventDefault();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
        ondragleave="this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        ondrop="event.stopPropagation();mtImgDrop(${d.id},${i},event);this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        style="border:2px dashed #ccc;border-radius:6px;min-height:60px;display:flex;
               align-items:center;justify-content:center;gap:6px;color:#aaa;font-size:12px;
               font-weight:600;background:#fafaf8;transition:border-color .15s,background .15s;width:100%;box-sizing:border-box;">
      🖼 ${cell.caption ? esc(cell.caption) : 'Bild hierher ziehen'}</div>`;
    return mtAlignWrap(cell, inner);
  }

  if (t === 'grid') {
    const sizes = { klein: 16, mittel: 20, gross: 28 };
    const cs   = sizes[cell.groesse || 'mittel'];
    const rows = cell.zeilen || 4;
    const h    = rows * cs;
    const inner = `<div style="width:100%;height:${h}px;border:1px solid #999;box-sizing:border-box;
        background-image:linear-gradient(#aaa 1px,transparent 1px),linear-gradient(90deg,#aaa 1px,transparent 1px);
        background-size:${cs}px ${cs}px;"></div>`;
    return mtAlignWrap(cell, inner);
  }

  if (MT_EMBED_TYPES.has(t)) {
    const def = WIDGET_MAP[t];
    if (!def) return '';
    if (!cell.embed) cell.embed = mtCreateEmbed(t);
    const nested = { ...cell.embed, type: t, id: d.id, _mtParent: d.id, _mtCell: i };
    const inner = def.render(nested);
    return mtAlignWrap(cell, `<div style="max-width:100%;overflow-x:auto;">${inner}</div>`);
  }

  return `<div class="mt-empty-hint" style="min-height:40px;display:flex;align-items:center;justify-content:center;
            color:#ccc;font-size:11px;">leer</div>`;
}

WIDGETS.push({
  meta: { type:'multitool', label:'Multitool (Beta)', desc:'Raster mit frei wählbaren Feldern',
          icon:'🧩', category:'allgemein', section:'Profi-Tools', selSafe:true },

  createData: id => ({
    id, type:'multitool', gx:2, gy:2,
    cells: [{type:'empty'},{type:'empty'},{type:'empty'},{type:'empty'}],
    aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const gx = d.gx || 2, gy = d.gy || 2;
    const cells = d.cells || [];
    const isActive = d.id === selId;
    const selIdx = (_mtSel && _mtSel.id === d.id) ? _mtSel.idx : -1;

    let html = `<div style="display:grid;grid-template-columns:repeat(${gx},1fr);gap:8px;width:100%;">`;
    for (let i = 0; i < gx * gy; i++) {
      const cell = cells[i] || { type:'empty' };
      const selCls = isActive && i === selIdx ? ' mt-cell-sel' : '';
      html += `<div class="mt-cell${selCls}">${mtRenderCell(d, cell, i)}</div>`;
    }
    html += `</div>`;
    return atHtml(d) + html;
  },

  renderProps: d => {
    const gx = d.gx || 2, gy = d.gy || 2;
    const cells = d.cells || [];
    const sel = (_mtSel && _mtSel.id === d.id) ? _mtSel.idx : -1;

    let out =
      pr('Spalten (X)', `<input type="number" min="1" max="6" value="${gx}" onchange="mtSetGrid(${d.id},'gx',+this.value)">`) +
      pr('Zeilen (Y)',  `<input type="number" min="1" max="8" value="${gy}" onchange="mtSetGrid(${d.id},'gy',+this.value)">`);

    out += `<div class="prow"><label>Feld auswählen</label></div>
      <div style="display:grid;grid-template-columns:repeat(${gx},1fr);gap:3px;margin-bottom:8px;">`;
    for (let i = 0; i < gx * gy; i++) {
      const c = cells[i] || { type:'empty' };
      const on = i === sel;
      out += `<button onclick="event.stopPropagation();mtSelCell(${d.id},${i})"
        style="aspect-ratio:1;border:1.5px solid ${on?'#89b4fa':'#ddd'};
               background:${on?'#e8f0ff':'#fff'};border-radius:4px;font-size:15px;
               cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;"
        title="Feld ${i+1}">${MT_ICON[c.type || 'empty']}</button>`;
    }
    out += `</div>`;

    if (sel >= 0 && sel < gx * gy) {
      const c = cells[sel] || { type:'empty' };
      const tb = (val, label) =>
        `<button onclick="event.stopPropagation();mtSetCellType(${d.id},${sel},'${val}')"
          style="padding:5px 7px;border-radius:4px;border:1.5px solid ${c.type===val?'#a6e3a1':'#ddd'};
                 background:${c.type===val?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
                 font-weight:700;cursor:pointer;color:${c.type===val?'#1e1e2e':'#999'};">${label}</button>`;
      out += `<div class="prow"><label>Typ für Feld ${sel+1}</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${MT_TYPES.map(([v,l]) => tb(v,l)).join('')}
        </div></div>`;
      out += mtCellEditor(d, sel, c);
    } else {
      out += `<div style="font-size:11px;color:#aaa;padding:2px 0 6px;">
        Wähle oben ein Feld, um Typ und Inhalt festzulegen.</div>`;
    }
    return out;
  },
});

// ── Zell-Editor je nach Typ ───────────────────────────────────────
function mtCellEditor(d, idx, c) {
  const t = c.type || 'empty';
  const toggleBtn = (label, active, onclick) =>
    `<button onclick="event.stopPropagation();${onclick}"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
             background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

  if (t === 'empty') {
    return `<div style="font-size:11px;color:#aaa;padding:2px 0;">Leeres Feld – wähle oben einen Typ.</div>`;
  }

  let out = mtAlignToggle(d.id, idx, c.align);

  if (t === 'write') {
    const lin = c.lineatur || 0;
    out += pr('Anzahl Zeilen', `<input type="number" min="1" max="30" value="${c.lines||3}"
        onchange="mtSetCellProp(${d.id},${idx},'lines',+this.value)">`) +
      pr('Lineatur', `<select onchange="mtSetCellProp(${d.id},${idx},'lineatur',+this.value)">
        <option value="0" ${lin===0?'selected':''}>Einfach</option>
        <option value="1" ${lin===1?'selected':''}>Lineatur 1 (1. Klasse)</option>
        <option value="2" ${lin===2?'selected':''}>Lineatur 2 (2. Klasse)</option>
      </select>`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Klein', !c.lineaturGross, `mtSetCellProp(${d.id},${idx},'lineaturGross',false)`)}
          ${toggleBtn('Groß',  c.lineaturGross,  `mtSetCellProp(${d.id},${idx},'lineaturGross',true)`)}
        </div></div>` +
      pr('Beschriftung', `<input value="${esc(c.label||'')}" placeholder="z.B. Antwort:"
        onchange="mtSetCellProp(${d.id},${idx},'label',this.value)">`) +
      `<div class="prow"><label>Vorschrift <span style="font-weight:400;color:#aaa;font-size:10px;">(1. Zeile, HTML)</span></label></div>
      <textarea onclick="event.stopPropagation()"
        onchange="mtSetCellProp(${d.id},${idx},'html',this.value)"
        placeholder="Optional: Text auf der ersten Zeile"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;
               resize:vertical;padding:8px 10px;min-height:50px;font-family:inherit;font-size:13px;
               line-height:1.6;color:#333;margin-bottom:6px;">${esc(c.html||'')}</textarea>` +
      pr('Schriftgröße', `<input type="number" min="8" max="36" value="${c.fontSize||13}"
        onchange="mtSetCellProp(${d.id},${idx},'fontSize',+this.value)">`) +
      mtFontSelect(d.id, idx, c.font);
    return out;
  }

  if (t === 'text') {
    out += pr('Schriftgröße', `<input type="number" min="8" max="36" value="${c.fontSize||13}"
        onchange="mtSetCellProp(${d.id},${idx},'fontSize',+this.value)">`) +
      mtFontSelect(d.id, idx, c.font) +
      `<div style="font-size:11px;color:#aaa;padding:2px 0;">Text direkt im Feld eintippen.</div>`;
    return out;
  }

  if (t === 'checklist') {
    const items = (c.items || []).join('\n');
    out += `<div class="prow"><label>Einträge <span style="font-weight:400;color:#aaa;font-size:10px;">(eine Zeile pro Eintrag)</span></label></div>
      <textarea onclick="event.stopPropagation()"
        onchange="mtSetCellProp(${d.id},${idx},'items',this.value.split('\\n').map(s=>s.trim()).filter(Boolean))"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;
               resize:vertical;padding:8px 10px;min-height:70px;font-family:inherit;font-size:13px;
               line-height:1.6;color:#333;margin-bottom:6px;">${esc(items)}</textarea>` +
      pr('Schriftgröße', `<input type="number" min="8" max="36" value="${c.fontSize||13}"
        onchange="mtSetCellProp(${d.id},${idx},'fontSize',+this.value)">`) +
      mtFontSelect(d.id, idx, c.font);
    return out;
  }

  if (t === 'image') {
    const efx = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;min-width:60px;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    const removeBtn = c.src
      ? `<button onclick="event.stopPropagation();mtSetCellProp(${d.id},${idx},'src','')"
           style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#fde8ec;
                  color:#a0003c;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">
           🗑 Bild entfernen</button>`
      : '';
    out += pr('Beschriftung', `<input value="${esc(c.caption||'')}" placeholder="optional"
        onchange="mtSetCellProp(${d.id},${idx},'caption',this.value)">`) +
      pr('Höhe (px)', `<input type="number" min="60" max="400" step="10" value="${c.height||120}"
        onchange="mtSetCellProp(${d.id},${idx},'height',+this.value)">`) +
      `<div class="prow"><label>Innenabstand</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Mit Abstand', !c.flush, `mtSetCellProp(${d.id},${idx},'flush',false)`)}
          ${toggleBtn('Bündig', c.flush, `mtSetCellProp(${d.id},${idx},'flush',true)`)}
        </div></div>` +
      (c.src ? `<div class="prow"><label>Bildeffekte</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${efx('S/W', c.grayscale, `mtSetCellProp(${d.id},${idx},'grayscale',${!c.grayscale})`)}
          ${efx('Spiegeln ↔', c.flipH, `mtSetCellProp(${d.id},${idx},'flipH',${!c.flipH})`)}
          ${efx('Spiegeln ↕', c.flipV, `mtSetCellProp(${d.id},${idx},'flipV',${!c.flipV})`)}
          ${efx('Drehen 90°', !!c.rotate, `mtImgRotate(${d.id},${idx})`)}
        </div>
        ${c.rotate ? `<div style="font-size:10px;color:#aaa;margin-top:3px;">Drehung: ${c.rotate}°</div>` : ''}
      </div>` : '') +
      `<div class="prow"><label>Bild</label>
        ${c.src
          ? `<div style="font-size:11px;color:#888;margin-bottom:4px;">✓ Bild geladen</div>`
          : `<div style="font-size:11px;color:#aaa;margin-bottom:4px;">Drag &amp; Drop auf das Feld oder auswählen.</div>`}
        <button type="button" onclick="event.stopPropagation();mtOpenImgPicker(${d.id},${idx})"
          style="width:100%;padding:6px;border:1.5px solid #ddd;border-radius:4px;background:#f8f8f8;
                 font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;color:#555;">
          🖼 Bild auswählen…
        </button>
        ${removeBtn}
      </div>`;
    return out;
  }

  if (t === 'grid') {
    const g = c.groesse || 'mittel';
    const gb = (val, label) =>
      `<button onclick="event.stopPropagation();mtSetCellProp(${d.id},${idx},'groesse','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${g===val?'#89b4fa':'#ddd'};
               background:${g===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${g===val?'#1e1e2e':'#999'};">${label}</button>`;
    out += `<div class="prow"><label>Kästchengröße</label>
        <div style="display:flex;gap:4px;">${gb('klein','Klein')}${gb('mittel','Mittel')}${gb('gross','Groß')}</div></div>` +
      pr('Zeilen', `<input type="number" min="1" max="30" value="${c.zeilen||4}"
        onchange="mtSetCellProp(${d.id},${idx},'zeilen',+this.value)">`);
    return out;
  }

  if (MT_EMBED_TYPES.has(t)) {
    return out + mtEmbedProps(d.id, idx, c);
  }

  return out;
}

// ── Helpers ───────────────────────────────────────────────────────
function mtSetGrid(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  mtEnsureCells(w);
  if (_mtSel && _mtSel.id === id && _mtSel.idx >= (w.gx*w.gy)) _mtSel = null;
  render(); renderProps(id);
}

function mtSelCell(id, idx) {
  _mtSel = { id, idx };
  render(); renderProps(id);
}

function mtCreateEmbed(type) {
  const def = WIDGET_MAP[type];
  if (!def) return {};
  const data = def.createData(0);
  delete data.id;
  delete data.aufgabenNr;
  delete data.aufgabenText;
  if (MT_EMBED_TYPES.has(type) && typeof epDoGenerate === 'function') epDoGenerate(data);
  return data;
}

function mtEmbedProps(parentId, idx, cell) {
  const type = cell.type;
  if (!cell.embed) cell.embed = mtCreateEmbed(type);
  const nested = { ...cell.embed, type, id: parentId, _mtParent: parentId, _mtCell: idx };
  let html = WIDGET_MAP[type].renderProps(nested);
  const p = parentId;
  const fns = ['epSetErgaenzung', 'epSetLuecke', 'epSetImmerZehn', 'epToggleOp', 'epSetLayout', 'epGenerate', 'zfSet', 'zfRoll', 'zfManual'];
  for (const fn of fns) {
    html = html.split(`${fn}(${p},`).join(`mtEmbedFn('${fn}',${p},${idx},`);
    html = html.split(`${fn}(${p})`).join(`mtEmbedFn('${fn}',${p},${idx})`);
  }
  html = html.split(`upd(${p},`).join(`mtEmbedFn('upd',${p},${idx},`);
  return html;
}

function mtEmbedFn(name, parentId, idx, a, b) {
  const w = widgets.find(x => x.id === parentId); if (!w) return;
  mtEnsureCells(w);
  const cell = w.cells[idx];
  if (!cell.embed) cell.embed = mtCreateEmbed(cell.type);
  const emb = cell.embed;
  saveHistory();
  switch (name) {
    case 'upd':
      emb[a] = b;
      break;
    case 'zfSet':
      emb[a] = b;
      if (a === 'anzahl') zfResize(emb);
      else {
        emb.aufgaben = zfGenForWidget(emb);
        emb.manualText = zfTasksToText(emb);
      }
      break;
    case 'zfRoll':
      emb.aufgaben = zfGenForWidget(emb);
      emb.manualText = zfTasksToText(emb);
      break;
    case 'zfManual':
      zfApplyManual(emb, a);
      break;
    case 'epGenerate':
      epDoGenerate(emb);
      break;
    case 'epSetErgaenzung': {
      const prev = !!emb.ergaenzung;
      emb.ergaenzung = a === true || a === 'true';
      if (emb.ergaenzung) emb.luecke = emb.luecke || 'erste';
      const hasTasks = !!(emb.tasks || '').trim();
      if (hasTasks && !prev && emb.ergaenzung) {
        emb.tasks = arithConvertNormalToErgaenzung(emb.tasks, emb.luecke || 'erste');
        break;
      }
      if (hasTasks && prev && !emb.ergaenzung) {
        emb.tasks = arithConvertErgaenzungToNormal(emb.tasks);
        break;
      }
      epDoGenerate(emb);
      break;
    }
    case 'epSetLuecke':
      emb.luecke = a;
      epDoGenerate(emb);
      break;
    case 'epSetImmerZehn':
      emb.immerZehn = a === true || a === 'true';
      epDoGenerate(emb);
      break;
    case 'epToggleOp': {
      const ops = (emb.ops || ['+', '-']).slice();
      const opIdx = ops.indexOf(a);
      if (opIdx >= 0) { if (ops.length > 1) ops.splice(opIdx, 1); }
      else ops.push(a);
      emb.ops = ops;
      epDoGenerate(emb);
      break;
    }
    case 'epSetLayout':
      emb[a] = b;
      if (a === 'cols' || a === 'aufgabenProPaeckchen') epResize(emb);
      else epDoGenerate(emb);
      break;
  }
  _dirty = true;
  if (typeof scheduleDraftSave === 'function') scheduleDraftSave();
  render();
  renderProps(parentId);
}

function mtDefaultCell(type) {
  if (type === 'write')     return { type:'write', lines:3, label:'', lineatur:0, lineaturGross:false, html:'', font:'inherit', fontSize:13, align:'left' };
  if (type === 'text')      return { type:'text', html:'', font:'inherit', fontSize:13, align:'left' };
  if (type === 'checklist') return { type:'checklist', items:['Punkt 1', 'Punkt 2'], font:'inherit', fontSize:13, align:'left' };
  if (type === 'image')     return { type:'image', src:'', caption:'', height:120, align:'center', flush:false, grayscale:false, flipH:false, flipV:false, rotate:0 };
  if (type === 'grid')      return { type:'grid', groesse:'mittel', zeilen:4, align:'left' };
  if (MT_EMBED_TYPES.has(type)) return { type, embed: mtCreateEmbed(type), align:'center' };
  return { type:'empty' };
}

function mtSetCellType(id, idx, type) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  mtEnsureCells(w);
  w.cells[idx] = mtDefaultCell(type);
  render(); renderProps(id);
}

function mtSetCellProp(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  saveHistory();
  w.cells[idx][key] = val;
  render(); renderProps(id);
}

function mtCellLive(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  w.cells[idx][key] = val;
}

function mtImgRotate(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  saveHistory();
  const c = w.cells[idx];
  c.rotate = ((c.rotate || 0) + 90) % 360;
  render(); renderProps(id);
}

function mtImgDrop(id, idx, e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  window._imgDropGuard = true;
  setTimeout(() => { window._imgDropGuard = false; }, 200);
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
    saveHistory();
    w.cells[idx].src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}

function mtOpenImgPicker(id, idx) {
  const w = widgets.find(x => x.id === id);
  const cell = w && w.cells && w.cells[idx];
  openImgPicker({
    query: cell && cell.caption ? cell.caption : "",
    onPick: (src, meta) => {
      const ww = widgets.find(x => x.id === id); if (!ww || !ww.cells || !ww.cells[idx]) return;
      saveHistory();
      ww.cells[idx].src = src;
      if (!ww.cells[idx].caption && meta && meta.title) ww.cells[idx].caption = meta.title;
      render(); renderProps(id);
    },
  });
}
