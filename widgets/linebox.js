// Widget: Schreiblinien
WIDGETS.push({
  meta: { type:"linebox", label:"Schreiblinien", desc:"Antwortzeilen", icon:"≡", category:"allgemein" },

  createData: id => ({ id, type:"linebox", lines:3, label:"", lineatur:0, lineaturGross:false, html:"", fontSize:13, font:"inherit", solutionFromVorschrift:false, aufgabenNr:0, aufgabenText:''}),

  render: d => {
    const lineatur      = d.lineatur     || 0;
    const lineaturGross = d.lineaturGross || false;
    const lMul          = lineaturGross ? 1.5 : 1;
    const answerText    = d.html         || "";
    const fontSize      = d.fontSize     || 13;
    const font          = d.font         || "inherit";
    const solutionFromVorschrift = d.solutionFromVorschrift || false;
    const isActive      = d.id === selId || _solutionsMode;

    const h = v => Math.round(v * lMul);
    // Schriftgröße auf der Linie: "Einfach" an die Lineaturen angleichen
    // (vorher war sie deutlich kleiner, weil nur fontSize verwendet wurde).
    const answerFs = (lineatur === 1 ? 24 : 22) * lMul;
    // Grundschrift hat andere Baseline-Metriken, braucht keinen Korrekturoffset
    const baselineAdj = (font === 'inherit' || font.includes('Grundschrift') || font.includes('DM Mono') || font.includes('Caveat')) ? 0 : 2;

    // <br>-Segmente → je ein Segment pro Lineaturzeile
    const answerSegs = answerText
      ? answerText.split(/<br\s*\/?>/i)
      : [];

    const textOverlay = (seg, bottomPx, color) =>
      `<div style="position:absolute;top:0;left:4px;right:4px;bottom:${bottomPx}px;` +
      `display:flex;align-items:flex-end;pointer-events:none;">` +
      `<span style="font-size:${answerFs}px;font-family:${font};` +
      `line-height:1;white-space:nowrap;overflow:visible;color:${color};font-weight:400;">${seg}</span></div>`;

    const renderLine = (lineIdx) => {
      const seg = answerSegs[lineIdx] || '';
      const showText = !!seg && (!solutionFromVorschrift || isActive);
      const txtColor = solutionFromVorschrift ? '#2563eb' : '#222';
      if (lineatur === 1) {
        return `<div style="position:relative;margin-bottom:${h(10)}px;border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;">` +
          `<div style="height:${h(11)}px;border-top:1px solid #bbb;"></div>` +
          `<div style="height:${h(11)}px;border-top:1px solid #bbb;background:#dff0f8;"></div>` +
          `<div style="height:${h(11)}px;border-top:2px solid #777;"></div>` +
          `<div style="height:${h(3)}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
          (showText ? textOverlay(seg, 14*lMul - Math.round(answerFs * 0.2) + baselineAdj, txtColor) : '') +
          `</div>`;
      }
      if (lineatur === 2) {
        return `<div style="position:relative;margin-bottom:${h(10)}px;background:#fff;">` +
          `<div style="height:${h(16)}px;border-top:1px dashed #bbb;"></div>` +
          `<div style="height:${h(5)}px;border-top:2px solid #777;"></div>` +
          `<div style="height:${h(4)}px;border-top:1px solid #bbb;"></div>` +
          (showText ? textOverlay(seg, 9*lMul - Math.round(answerFs * 0.2) + baselineAdj, txtColor) : '') +
          `</div>`;
      }
      return `<div style="position:relative;border-bottom:1.5px solid #999;height:${h(26)}px;margin-bottom:${h(6)}px;">` +
        (showText ? textOverlay(seg, Math.round(answerFs * 0.1) - 3, txtColor) : '') +
        `</div>`;
    };

    const lines = Array.from({length: d.lines}, (_, i) => `
      ${(d.label && i === 0) ? `<div style="font-size:11px;color:#888;font-weight:700;margin-bottom:2px;">${esc(d.label)}</div>` : ""}
      ${renderLine(i)}
    `).join("");

    return atHtml(d) + lines;
  },

  renderProps: d => {
    const lin      = d.lineatur || 0;
    const html     = d.html     || "";
    const fontSize = d.fontSize || 13;
    const font     = d.font     || "inherit";
    const solFromV = d.solutionFromVorschrift || false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");

    const textEditor = `
      <div class="prow"><label>Vorschrift (erscheint auf 1. Linie)</label></div>
      ${makeRichEditorBox(d.id, 'html', html, font, '', fontOptions)}
    `;

    return textEditor +
      pr("Anzahl Zeilen", `<input type="number" min="1" max="30" value="${d.lines}" onchange="upd(${d.id},'lines',+this.value)">`) +
      pr("Lineatur", `<select onchange="upd(${d.id},'lineatur',+this.value)">
        <option value="0" ${lin===0?"selected":""}>Einfach</option>
        <option value="1" ${lin===1?"selected":""}>Lineatur 1 (1. Klasse)</option>
        <option value="2" ${lin===2?"selected":""}>Lineatur 2 (2. Klasse)</option>
      </select>`) +
      `<div class="prow"><label>Vorschrift als Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !solFromV, `upd(${d.id},'solutionFromVorschrift',false)`)}
          ${toggleBtn("An",   solFromV, `upd(${d.id},'solutionFromVorschrift',true)`)}
        </div></div>` +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", !d.lineaturGross, `upd(${d.id},'lineaturGross',false)`)}
          ${toggleBtn("Groß",  d.lineaturGross,  `upd(${d.id},'lineaturGross',true)`)}
        </div></div>` +
      pr("Beschriftung", `<input value="${esc(d.label)}" placeholder="z.B. Antwort:" onchange="upd(${d.id},'label',this.value)">`) ;
  },
});
