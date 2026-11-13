// Widget: Checkliste
WIDGETS.push({
  meta: { type:"checkbox", label:"Checkliste", desc:"Ankreuzaufgabe", icon:"☑", category:"allgemein" },
  createData: id => ({ id, type:"checkbox", items:["Richtig","Falsch","Vielleicht"], cols:1, font:"inherit", fontSize:18, aufgabenNr:0, aufgabenText:''}),
  render: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 14;
    const rows = d.items.map(it=>`<div data-aufg="1" style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-family:${font};font-size:${fontSize}px;"><div style="width:15px;height:15px;border:2px solid #999;border-radius:2px;flex-shrink:0;"></div>${esc(it)}</div>`);
    // Spalten wie beim Multiple-Choice-Quiz: Einträge spaltenweise verteilt (1. Spalte zuerst)
    const cols = Math.max(1, d.cols || 1);
    const colDivs = mcColumnChunks(rows, cols).map(ch => `<div style="flex:1;min-width:0;">${ch.join('')}</div>`).join('');
    return atHtml(d) + (cols > 1 ? `<div style="display:flex;gap:24px;align-items:flex-start;">${colDivs}</div>` : rows.join(''));
  },
  renderProps: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 14;
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;
    // Einträge-Feld im Stil des Lückentext-Editors: Größe oben rechts, Fontauswahl unten.
    return `<div class="prow"><label>Einträge <span style="font-weight:400;color:#aaa;font-size:10px;">(eine Zeile pro Eintrag)</span></label></div>` +
      `<div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:4px 6px;border-bottom:1px solid #eee;background:#fafafa;">
          <span style="font-size:11px;color:#888;">Größe</span>${sizeInput}
        </div>
        <textarea
          onclick="event.stopPropagation()"
          onchange="upd(${d.id},'items',this.value.split('\\n').filter(s=>s.trim()))"
          style="width:100%;box-sizing:border-box;border:none;outline:none;resize:vertical;
                 padding:8px 10px;min-height:70px;font-family:${font};font-size:${RICH_EDITOR_FONT_SIZE}px;
                 line-height:1.7;color:#333;">${d.items.join("\n")}</textarea>
        <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
            ${fontOptions}
          </select>
        </div>
      </div>` +
      pr('Spalten', `<input type="number" min="1" max="4" value="${d.cols || 1}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'cols',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`);
  },
});

// Eintrag direkt im Blatt ändern (main/helpers.js → BW_AUFGABE)
BW_AUFGABE.checkbox = {
  ziel: '[data-aufg]',
  text: (w, i) => (w.items || [])[i] ?? null,
  setzen: (w, i, txt) => { w.items[i] = txt.trim(); return true; },
};
