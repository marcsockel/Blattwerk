// Widget: Aufgabentext
WIDGETS.push({
  meta: { type:"instruction", label:"Aufgabentext", desc:"Aufgabenstellung", icon:"📋", category:"allgemein" },

  createData: id => ({ id, type:"instruction", html:"Lies den Text und beantworte die Fragen." }),

  // class instr-box: eingefügter/übernommener Text mit eigener Schrift (z.B. aus Word
  // kopiert → <span style="font-family:…">) folgt trotzdem der gewählten Schrift.
  render: d => `<div class="instr-box" style="background:#f8f6f2;border-left:4px solid #fab387;padding:7px 11px;
                             border-radius:0 5px 5px 0;font-family:${d.font || 'inherit'};font-size:${d.fontSize || 13}px;line-height:1.6;color:#555;"
                >${d.html || esc(d.text||'')}</div>`,

  renderProps: d => {
    const html = d.html || esc(d.text||'');
    // Wie beim Text-Widget: Größe oben rechts in der Textbox, Schriftauswahl unten
    const font = d.font || 'inherit';
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    const sizeInput = `<input type="number" min="8" max="36" value="${d.fontSize || 13}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;
    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', html, font, sizeInput, fontOptions);
  },
});
