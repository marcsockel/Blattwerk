// Widget: Bild
WIDGETS.push({
  meta: { type:"image", label:"Bild", desc:"Bildplatzhalter / Drag & Drop", icon:"🖼", category:"allgemein" },

  createData: id => ({ id, type:"image", caption:"", height:120, src:"", align:"center", valign:"top", flush:false , aufgabenNr:0, aufgabenText:''}),

  render: d => {
    const align = d.align || "center";
    // Vertikale Achse: wirkt, wenn das Widget in einer Reihe (½/⅓ …) auf die
    // Zeilenhöhe gestreckt wird — Flex-Spalte verteilt den Überschuss.
    // WICHTIG: beide Achsen NUR über justify-content/align-items — margin:auto am
    // <img> würde in der Flex-Spalte den Freiraum beider Achsen schlucken
    // (vertikal immer „Mitte"), und align-items:stretch (Default) streckt das Bild
    // auf volle Breite (object-fit zentriert dann optisch → „Links" wirkungslos).
    const valign = d.valign || "top";
    const jc = valign === "middle" ? "center" : valign === "bottom" ? "flex-end" : "flex-start";
    const ai = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
    const boxStyle = `text-align:${align};height:100%;display:flex;flex-direction:column;justify-content:${jc};align-items:${ai};`;
    if (d.src) {
      // Bildeffekte via CSS (druckt in Chrome mit print-color-adjust:exact)
      // Klasse img-sw: der Druck-CSS-Reset (*{filter:none!important}) würde den
      // Inline-Filter töten — die Klasse setzt ihn im @media print gezielt wieder.
      const fil = d.grayscale ? 'filter:grayscale(100%);' : '';
      const filCls = d.grayscale ? ' class="img-sw"' : '';
      const tfa = [];
      if (d.rotate) tfa.push(`rotate(${d.rotate}deg)`);
      if (d.flipH)  tfa.push('scaleX(-1)');
      if (d.flipV)  tfa.push('scaleY(-1)');
      const tf = tfa.length ? `transform:${tfa.join(' ')};` : '';
      return `<div style="${boxStyle}">
        <img src="${d.src}"${filCls} style="max-width:100%;max-height:${d.height}px;width:auto;height:auto;object-fit:contain;border-radius:${d.rund ? 6 : 0}px;display:block;${fil}${tf}"
          ondragover="event.preventDefault()" ondrop="event.stopPropagation();imgDrop(${d.id},event)">
        ${d.caption ? `<div style="font-size:11px;color:#888;margin-top:4px;text-align:${align};">${esc(d.caption)}</div>` : ''}
      </div>`;
    }
    return atHtml(d) + `<div style="${boxStyle}"><div
        ondragover="event.preventDefault();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
        ondragleave="this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        ondrop="event.stopPropagation();imgDrop(${d.id},event);this.style.borderColor='#ccc';this.style.background='#fafaf8';"
        style="border:2.5px dashed #ccc;border-radius:8px;height:${d.height}px;width:100%;display:flex;flex-direction:column;
               align-items:center;justify-content:center;color:#aaa;font-size:13px;font-weight:600;
               background:#fafaf8;gap:6px;transition:border-color .15s,background .15s;cursor:default;">
      <span style="font-size:28px;">🖼</span>
      <span>${d.caption ? esc(d.caption) : 'Bild hierher ziehen'}</span>
    </div></div>`;
  },

  renderProps: d => {
    const align = d.align || "center";
    const efx = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;min-width:60px;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    const thumbSz = 40;
    const thumb = d.src
      ? `<div title="Bild auswählen / hierher ziehen"
           style="flex-shrink:0;cursor:pointer;width:${thumbSz}px;height:${thumbSz}px;"
           onclick="event.stopPropagation();imgOpenPicker(${d.id});"
           ondragover="event.preventDefault();event.stopPropagation();this.style.outline='2px solid #89b4fa';"
           ondragleave="this.style.outline='none';"
           ondrop="event.preventDefault();event.stopPropagation();this.style.outline='none';imgDrop(${d.id},event);">
           <img src="${d.src}" draggable="false"
             style="width:${thumbSz}px;height:${thumbSz}px;object-fit:contain;border-radius:3px;border:1px solid #eee;display:block;pointer-events:none;">
         </div>`
      : `<div title="Bild auswählen / hierher ziehen"
           onclick="event.stopPropagation();imgOpenPicker(${d.id});"
           ondragover="event.preventDefault();event.stopPropagation();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
           ondragleave="this.style.borderColor='#ccc';this.style.background='#f0f0f0';"
           ondrop="event.preventDefault();event.stopPropagation();this.style.borderColor='#ccc';this.style.background='#f0f0f0';imgDrop(${d.id},event);"
           style="flex-shrink:0;width:${thumbSz}px;height:${thumbSz}px;background:#f0f0f0;border:1.5px dashed #ccc;border-radius:3px;
           display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;transition:border-color .12s,background .12s;">🖼</div>`;

    const valign = d.valign || "top";
    return pr("Beschriftung", `<input value="${esc(d.caption)}" placeholder="optional" onchange="upd(${d.id},'caption',this.value)">`) +
      pr("Höhe (px)", `<input type="number" min="60" max="600" step="10" value="${d.height}" onchange="upd(${d.id},'height',+this.value)">`) +
      `<div class="prow"><label>Innenabstand</label>
        <div style="display:flex;gap:4px;">
          ${[['Mit Abstand',false],['Bündig',true]].map(([lbl,val])=>{const on=!!d.flush===val;return `<button onclick="event.stopPropagation();upd(${d.id},'flush',${val})" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on?'#89b4fa':'#ddd'};background:${on?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on?'#1e1e2e':'#999'};">${lbl}</button>`;}).join('')}
        </div></div>` +
      `<div class="prow"><label>Ausrichtung</label>
        <div style="display:flex;gap:4px;">
          ${efx('Links',  align==='left',   `upd(${d.id},'align','left')`)}
          ${efx('Mitte',  align==='center', `upd(${d.id},'align','center')`)}
          ${efx('Rechts', align==='right',  `upd(${d.id},'align','right')`)}
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          ${efx('Oben',  valign==='top',    `upd(${d.id},'valign','top')`)}
          ${efx('Mitte', valign==='middle', `upd(${d.id},'valign','middle')`)}
          ${efx('Unten', valign==='bottom', `upd(${d.id},'valign','bottom')`)}
        </div>
        <div style="font-size:10px;color:#aaa;margin-top:4px;">Vertikal wirkt, wenn das Bild in einer Reihe neben höheren Widgets steht.</div>
      </div>` +
      (d.src ? `<div class="prow"><label>Bildeffekte</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${efx('S/W',        d.grayscale, `upd(${d.id},'grayscale',${!d.grayscale})`)}
          ${efx('Spiegeln ↔', d.flipH,     `upd(${d.id},'flipH',${!d.flipH})`)}
          ${efx('Spiegeln ↕', d.flipV,     `upd(${d.id},'flipV',${!d.flipV})`)}
          ${efx('Drehen 90°', !!d.rotate,  `imgRotate(${d.id})`)}
          ${efx('Runde Ecken', !!d.rund,   `upd(${d.id},'rund',${!d.rund})`)}
        </div>
        ${d.rotate ? `<div style="font-size:10px;color:#aaa;margin-top:3px;">Drehung: ${d.rotate}° — bei 90°/270° ggf. Höhe anpassen.</div>` : ''}
      </div>` : '') +
      `<div class="prow"><label>Bild</label>
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
          ${thumb}
          ${d.src ? `<button onclick="event.stopPropagation();upd(${d.id},'src','')"
            style="padding:1px 5px;border:none;border-radius:3px;background:#fde8ec;color:#a0003c;
                   font-size:10px;cursor:pointer;">🗑</button>` : ""}
        </div>
      </div>` ;
  },
});

// ── Image helpers ─────────────────────────────────────────────────
function imgRotate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.rotate = ((w.rotate || 0) + 90) % 360;
  render(); renderProps(id);
}

function imgOpenPicker(id) {
  if (window._imgDropGuard) return;
  const w = widgets.find(x => x.id === id);
  openImgPicker({
    query: w && w.caption ? w.caption : "",
    onPick: (src, meta) => {
      const ww = widgets.find(x => x.id === id); if (!ww) return;
      saveHistory();
      ww.src = src;
      if (!ww.caption && meta && meta.title) ww.caption = meta.title;
      render(); renderProps(id);
    },
  });
}

function imgDrop(id, e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  window._imgDropGuard = true;
  setTimeout(() => { window._imgDropGuard = false; }, 200);
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w) return;
    saveHistory();
    w.src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}
