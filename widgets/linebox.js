// Widget: Schreiblinien
WIDGETS.push({
  meta: { type:"linebox", label:"Schreiblinien", desc:"Antwortzeilen", icon:"≡", category:"deutsch" },

  createData: id => ({ id, type:"linebox", lines:3, label:"", lineatur:0 }),

  render: d => {
    const lineatur = d.lineatur || 0;

    const renderLine = () => {
      if (lineatur === 1) {
        // Lineatur 1 (1. Klasse): 4 Linien, Mittelzone hellblau, links/rechts geschlossen
        return `<div style="margin-bottom:10px;border-left:1px solid #bbb;border-right:1px solid #bbb;">
          <div style="height:11px;border-top:1px solid #bbb;"></div>
          <div style="height:11px;border-top:1px solid #bbb;background:#dff0f8;"></div>
          <div style="height:11px;border-top:2px solid #777;"></div>
          <div style="height:3px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>
        </div>`;
      }
      if (lineatur === 2) {
        // Lineatur 2 (2. Klasse): Grundlinie + gestrichelte Hilfslinie
        return `<div style="margin-bottom:10px;">
          <div style="height:16px;border-top:1px dashed #bbb;"></div>
          <div style="height:5px;border-top:2px solid #777;"></div>
          <div style="height:4px;border-top:1px solid #bbb;"></div>
        </div>`;
      }
      // Lineatur 0: einfache Linie
      return `<div style="border-bottom:1.5px solid #999;height:26px;margin-bottom:6px;"></div>`;
    };

    return Array.from({length: d.lines}, (_, i) => `
      ${(d.label && i === 0) ? `<div style="font-size:11px;color:#888;font-weight:700;margin-bottom:2px;">${esc(d.label)}</div>` : ""}
      ${renderLine()}
    `).join("");
  },

  renderProps: d => {
    const lin = d.lineatur || 0;
    return pr("Anzahl Zeilen", `<input type="number" min="1" max="20" value="${d.lines}" onchange="upd(${d.id},'lines',+this.value)">`) +
      pr("Lineatur", `<select onchange="upd(${d.id},'lineatur',+this.value)">
        <option value="0" ${lin===0?"selected":""}>Einfach</option>
        <option value="1" ${lin===1?"selected":""}>Lineatur 1 (1. Klasse)</option>
        <option value="2" ${lin===2?"selected":""}>Lineatur 2 (2. Klasse)</option>
      </select>`) +
      pr("Beschriftung", `<input value="${esc(d.label)}" placeholder="z.B. Antwort:" onchange="upd(${d.id},'label',this.value)">`);
  },
});
