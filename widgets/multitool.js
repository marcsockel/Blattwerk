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
];
const MT_ICON = { empty:'·', write:'✍', text:'T', checklist:'☑', image:'🖼', grid:'⊞' };

function mtEnsureCells(w) {
  const n = (w.gx || 2) * (w.gy || 2);
  if (!w.cells) w.cells = [];
  while (w.cells.length < n) w.cells.push({ type:'empty' });
  if (w.cells.length > n) w.cells = w.cells.slice(0, n);
}

function mtRenderCell(d, cell, i) {
  const t = cell.type || 'empty';

  if (t === 'text') {
    const font = cell.font || 'inherit';
    const fs   = cell.fontSize || 13;
    return `<div contenteditable="true"
        onclick="event.stopPropagation()"
        onfocus="edFocus()" onblur="edBlur()"
        oninput="mtCellLive(${d.id},${i},'html',this.innerHTML)"
        style="outline:none;font-family:${font};font-size:${fs}px;line-height:1.6;
               min-height:38px;color:#333;white-space:pre-wrap;word-break:break-word;"
      >${cell.html || ''}</div>`;
  }

  if (t === 'write') {
    const lines = cell.lines || 3;
    const lh    = cell.lineHeight || 28;
    const label = (cell.label || cell.label === '')
      ? `<div contenteditable="true" onclick="event.stopPropagation()"
           onfocus="edFocus()" onblur="edBlur()"
           oninput="mtCellLive(${d.id},${i},'label',this.innerText)"
           style="outline:none;font-size:12px;color:#666;margin-bottom:6px;min-height:1em;"
         >${esc(cell.label || '')}</div>`
      : '';
    let rows = '';
    for (let k = 0; k < lines; k++)
      rows += `<div style="border-bottom:1.6px solid #555;height:${lh}px;"></div>`;
    return label + rows;
  }

  if (t === 'checklist') {
    const items = cell.items || [];
    const fs = cell.fontSize || 13;
    if (!items.length) return `<div style="color:#ccc;font-size:11px;">(leere Checkliste)</div>`;
    return items.map(it =>
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:${fs}px;color:#333;">
         <div style="width:14px;height:14px;border:2px solid #999;border-radius:2px;flex-shrink:0;"></div>${esc(it)}
       </div>`).join('');
  }

  if (t === 'image') {
    if (cell.src)
      return `<img src="${cell.src}"
          ondragover="event.preventDefault()"
          ondrop="event.stopPropagation();mtImgDrop(${d.id},${i},event)"
          style="max-width:100%;max-height:240px;object-fit:contain;display:block;margin:0 auto;border-radius:4px;">`;
    return `<div
        ondragover="event.preventDefault();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
        ondragleave="this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        ondrop="event.stopPropagation();mtImgDrop(${d.id},${i},event);this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        style="border:2px dashed #ccc;border-radius:6px;min-height:60px;display:flex;
               align-items:center;justify-content:center;gap:6px;color:#aaa;font-size:12px;
               font-weight:600;background:#fafaf8;transition:border-color .15s,background .15s;">
      🖼 Bild hierher ziehen</div>`;
  }

  if (t === 'grid') {
    const sizes = { klein:16, mittel:20, gross:28 };
    const cs   = sizes[cell.groesse || 'mittel'];
    const rows = cell.zeilen || 4;
    const h    = rows * cs;
    return `<div style="height:${h}px;border:1px solid #999;
        background-image:linear-gradient(#aaa 1px,transparent 1px),linear-gradient(90deg,#aaa 1px,transparent 1px);
        background-size:${cs}px ${cs}px;"></div>`;
  }

  // empty
  return `<div style="min-height:40px;display:flex;align-items:center;justify-content:center;
            color:#ccc;font-size:11px;">leer</div>`;
}

WIDGETS.push({
  meta: { type:'multitool', label:'Multitool (Beta)', desc:'Raster mit frei wählbaren Feldern',
          icon:'🧩', category:'allgemein', selSafe:true },

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
      const hi = isActive && i === selIdx ? 'outline:2px solid #89b4fa;outline-offset:1px;' : '';
      html += `<div style="border:1px solid #e0ddd6;border-radius:6px;padding:8px;
                   box-sizing:border-box;${hi}">${mtRenderCell(d, cell, i)}</div>`;
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

    // Mini-Map: Feldauswahl
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

  if (t === 'write') {
    return pr('Schreiblinien', `<input type="number" min="1" max="20" value="${c.lines||3}"
        onchange="mtSetCellProp(${d.id},${idx},'lines',+this.value)">`) +
      pr('Zeilenhöhe (px)', `<input type="number" min="16" max="60" value="${c.lineHeight||28}"
        onchange="mtSetCellProp(${d.id},${idx},'lineHeight',+this.value)">`) +
      `<div style="font-size:11px;color:#aaa;padding:2px 0;">Überschrift direkt im Feld eintippen.</div>`;
  }

  if (t === 'text') {
    return pr('Schriftgröße', `<input type="number" min="8" max="36" value="${c.fontSize||13}"
        onchange="mtSetCellProp(${d.id},${idx},'fontSize',+this.value)">`) +
      `<div style="font-size:11px;color:#aaa;padding:2px 0;">Text direkt im Feld eintippen.</div>`;
  }

  if (t === 'checklist') {
    const items = (c.items || []).join('\n');
    return `<div class="prow"><label>Einträge <span style="font-weight:400;color:#aaa;font-size:10px;">(eine Zeile pro Eintrag)</span></label></div>
      <textarea onclick="event.stopPropagation()"
        onchange="mtSetCellProp(${d.id},${idx},'items',this.value.split('\\n').map(s=>s.trim()).filter(Boolean))"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;
               resize:vertical;padding:8px 10px;min-height:70px;font-family:inherit;font-size:13px;
               line-height:1.6;color:#333;margin-bottom:6px;">${esc(items)}</textarea>` +
      pr('Schriftgröße', `<input type="number" min="8" max="36" value="${c.fontSize||13}"
        onchange="mtSetCellProp(${d.id},${idx},'fontSize',+this.value)">`);
  }

  if (t === 'image') {
    const removeBtn = c.src
      ? `<button onclick="event.stopPropagation();mtSetCellProp(${d.id},${idx},'src','')"
           style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#fde8ec;
                  color:#a0003c;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">
           🗑 Bild entfernen</button>`
      : '';
    return `<div class="prow"><label>Bild</label>
        ${c.src
          ? `<div style="font-size:11px;color:#888;margin-bottom:4px;">✓ Bild geladen</div>`
          : `<div style="font-size:11px;color:#aaa;margin-bottom:4px;">Drag &amp; Drop auf das Feld.</div>`}
        ${removeBtn}
      </div>
      <div class="prow"><label>Clipart suchen <span style="font-weight:400;color:#aaa;font-size:10px;">(Wikimedia Commons)</span></label>
        <div style="display:flex;gap:4px;margin-top:2px;">
          <input id="mt-img-q-${d.id}-${idx}" type="text" placeholder="z.B. Elefant, Hund…"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onkeydown="if(event.key==='Enter'){event.preventDefault();mtImgSearch(${d.id},${idx});}"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <button onclick="event.stopPropagation();mtImgSearch(${d.id},${idx})"
            style="padding:3px 9px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                   font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔍</button>
        </div>
        <div id="mt-img-results-${d.id}-${idx}" style="margin-top:6px;"></div>
      </div>`;
  }

  if (t === 'grid') {
    const g = c.groesse || 'mittel';
    const gb = (val, label) =>
      `<button onclick="event.stopPropagation();mtSetCellProp(${d.id},${idx},'groesse','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${g===val?'#89b4fa':'#ddd'};
               background:${g===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${g===val?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Kästchengröße</label>
        <div style="display:flex;gap:4px;">${gb('klein','Klein')}${gb('mittel','Mittel')}${gb('gross','Groß')}</div></div>` +
      pr('Zeilen', `<input type="number" min="1" max="30" value="${c.zeilen||4}"
        onchange="mtSetCellProp(${d.id},${idx},'zeilen',+this.value)">`);
  }

  return `<div style="font-size:11px;color:#aaa;padding:2px 0;">Leeres Feld – wähle oben einen Typ.</div>`;
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

function mtSetCellType(id, idx, type) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  mtEnsureCells(w);
  const base = { type };
  if (type === 'write')          { base.lines = 3; base.lineHeight = 28; base.label = ''; }
  else if (type === 'text')      { base.html = ''; base.font = 'inherit'; base.fontSize = 13; }
  else if (type === 'checklist') { base.items = ['Punkt 1', 'Punkt 2']; base.fontSize = 13; }
  else if (type === 'image')     { base.src = ''; }
  else if (type === 'grid')      { base.groesse = 'mittel'; base.zeilen = 4; }
  w.cells[idx] = base;
  render(); renderProps(id);
}

function mtSetCellProp(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  saveHistory();
  w.cells[idx][key] = val;
  render(); renderProps(id);
}

// Live-Edit aus contenteditable (Text/Label): nur Daten schreiben, kein Re-Render
// (selSafe hält das Feld im DOM, der Cursor bleibt). History via edFocus/edBlur.
function mtCellLive(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  w.cells[idx][key] = val;
}

function mtImgDrop(id, idx, e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
    saveHistory();
    w.cells[idx].src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}

async function mtImgSearch(id, idx) {
  const input = document.getElementById(`mt-img-q-${id}-${idx}`);
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;
  const results = document.getElementById(`mt-img-results-${id}-${idx}`);
  results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Suche läuft…</div>`;
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query`
      + `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=18`
      + `&prop=imageinfo&iiprop=url&iiurlwidth=100&format=json&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const imgs = pages.map(p => ({
        thumb: p.imageinfo?.[0]?.thumburl,
        url:   p.imageinfo?.[0]?.url,
        title: p.title?.replace(/^File:/i, '').replace(/\.\w+$/, ''),
      })).filter(p => p.thumb && p.url && /\.(png|jpg|jpeg|svg|gif|webp)/i.test(p.url));
    if (!imgs.length) {
      results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Keine Ergebnisse gefunden.</div>`;
      return;
    }
    results.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
        ${imgs.map(img => `
          <div onclick="event.stopPropagation();mtImgPick(${id},${idx},'${img.url.replace(/'/g,"\\'")}')"
            title="${img.title}"
            style="cursor:pointer;border:1.5px solid #eee;border-radius:5px;overflow:hidden;
                   aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;background:#f8f6f2;"
            onmouseover="this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
            onmouseout="this.style.borderColor='#eee';this.style.background='#f8f6f2';">
            <img src="${img.thumb}" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy">
          </div>`).join('')}
      </div>
      <div style="font-size:10px;color:#bbb;margin-top:5px;text-align:center;">
        Bilder: Wikimedia Commons · Lizenzen variieren</div>`;
  } catch (err) {
    results.innerHTML = `<div style="color:#f38ba8;font-size:11px;padding:4px 0;">
      Fehler beim Laden. Bitte Internetverbindung prüfen.</div>`;
  }
}

function mtImgPick(id, idx, url) {
  const w = widgets.find(x => x.id === id); if (!w || !w.cells || !w.cells[idx]) return;
  saveHistory();
  w.cells[idx].src = url;
  render(); renderProps(id);
}
