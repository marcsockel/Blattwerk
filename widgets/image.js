// Widget: Bild
WIDGETS.push({
  meta: { type:"image", label:"Bild", desc:"Bildplatzhalter / Drag & Drop", icon:"🖼", category:"allgemein" },

  createData: id => ({ id, type:"image", caption:"", height:120, src:"", align:"center" , aufgabenNr:0, aufgabenText:''}),

  render: d => {
    const align = d.align || "center";
    const marginH = align === "center" ? "auto" : align === "right" ? "0 0 0 auto" : "0";
    if (d.src) {
      return `<div style="text-align:${align};">
        <img src="${d.src}" style="max-width:100%;height:${d.height}px;object-fit:contain;border-radius:6px;display:block;margin:${marginH};"
          ondragover="event.preventDefault()" ondrop="event.stopPropagation();imgDrop(${d.id},event)">
        ${d.caption ? `<div style="font-size:11px;color:#888;margin-top:4px;text-align:${align};">${esc(d.caption)}</div>` : ''}
      </div>`;
    }
    return atHtml(d) + `<div style="text-align:${align};"><div
        ondragover="event.preventDefault();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
        ondragleave="this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        ondrop="event.stopPropagation();imgDrop(${d.id},event);this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        style="border:2.5px dashed #ccc;border-radius:8px;height:${d.height}px;display:flex;flex-direction:column;
               align-items:center;justify-content:center;color:#aaa;font-size:13px;font-weight:600;
               background:#fafaf8;gap:6px;transition:border-color .15s,background .15s;cursor:default;">
      <span style="font-size:28px;">🖼</span>
      <span>${d.caption ? esc(d.caption) : 'Bild hierher ziehen'}</span>
    </div></div>`;
  },

  renderProps: d => {
    const align = d.align || "center";
    const removeBtn = d.src
      ? `<button onclick="event.stopPropagation();upd(${d.id},'src','')"
           style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#fde8ec;
                  color:#a0003c;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">
           🗑 Bild entfernen</button>`
      : '';

    return pr("Beschriftung", `<input value="${esc(d.caption)}" placeholder="optional" onchange="upd(${d.id},'caption',this.value)">`) +
      pr("Höhe (px)", `<input type="number" min="60" max="600" step="10" value="${d.height}" onchange="upd(${d.id},'height',+this.value)">`) +
      pr("Ausrichtung", `<select onchange="upd(${d.id},'align',this.value)">
        <option value="left"   ${align==="left"  ?"selected":""}>Links</option>
        <option value="center" ${align==="center"?"selected":""}>Zentriert</option>
        <option value="right"  ${align==="right" ?"selected":""}>Rechts</option>
      </select>`) +
      `<div class="prow"><label>Bild</label>
        ${d.src
          ? `<div style="font-size:11px;color:#888;margin-bottom:4px;">✓ Bild geladen</div>`
          : `<div style="font-size:11px;color:#aaa;margin-bottom:4px;">Drag &amp; Drop auf den Platzhalter.</div>`}
        ${removeBtn}
      </div>
      <div class="prow">
        <label>Clipart suchen <span style="font-weight:400;color:#aaa;font-size:10px;">(Wikimedia Commons)</span></label>
        <div style="display:flex;gap:4px;margin-top:2px;">
          <input id="img-q-${d.id}" type="text" placeholder="z.B. Elefant, Hund…"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onkeydown="if(event.key==='Enter'){event.preventDefault();imgSearch(${d.id});}"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <button onclick="event.stopPropagation();imgSearch(${d.id})"
            style="padding:3px 9px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                   font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔍</button>
        </div>
        <div id="img-results-${d.id}" style="margin-top:6px;"></div>
      </div>` +
    atProps(d.id, d);
  },
});

// ── Image helpers ─────────────────────────────────────────────────
function imgDrop(id, e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w) return;
    saveHistory();
    w.src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}

async function imgSearch(id) {
  const input = document.getElementById(`img-q-${id}`);
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;

  const results = document.getElementById(`img-results-${id}`);
  results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Suche läuft…</div>`;

  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query`
      + `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=18`
      + `&prop=imageinfo&iiprop=url&iiurlwidth=100&format=json&origin=*`;

    const res  = await fetch(url);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});

    // Filter to image types, extract thumb + full url
    const imgs = pages
      .map(p => ({
        thumb: p.imageinfo?.[0]?.thumburl,
        url:   p.imageinfo?.[0]?.url,
        title: p.title?.replace(/^File:/i, '').replace(/\.\w+$/, ''),
      }))
      .filter(p => p.thumb && p.url && /\.(png|jpg|jpeg|svg|gif|webp)/i.test(p.url));

    if (!imgs.length) {
      results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Keine Ergebnisse gefunden.</div>`;
      return;
    }

    results.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;">
        ${imgs.map(img => `
          <div onclick="event.stopPropagation();imgPick(${id},'${img.url.replace(/'/g,"\\'")}','${img.title.replace(/'/g,"\\'").substring(0,40)}')"
            title="${img.title}"
            style="cursor:pointer;border:1.5px solid #eee;border-radius:5px;overflow:hidden;
                   aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
                   background:#f8f6f2;transition:border-color .12s;"
            onmouseover="this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
            onmouseout="this.style.borderColor='#eee';this.style.background='#f8f6f2';">
            <img src="${img.thumb}" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy">
          </div>`).join('')}
      </div>
      <div style="font-size:10px;color:#bbb;margin-top:5px;text-align:center;">
        Bilder: Wikimedia Commons · Lizenzen variieren
      </div>`;
  } catch(err) {
    results.innerHTML = `<div style="color:#f38ba8;font-size:11px;padding:4px 0;">
      Fehler beim Laden. Bitte Internetverbindung prüfen.</div>`;
  }
}

function imgPick(id, url, title) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.src = url;
  if (!w.caption) w.caption = title;
  render(); renderProps(id);
}
