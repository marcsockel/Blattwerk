// Widget: Schreiblinien
WIDGETS.push({
  meta: { type:"linebox", label:"Schreiblinien", desc:"Antwortzeilen", icon:"≡", category:"deutsch" },

  createData: id => ({ id, type:"linebox", lines:3, label:"", lineatur:0, html:"", fontSize:13, font:"inherit" }),

  render: d => {
    const lineatur  = d.lineatur  || 0;
    const html      = d.html      || "";
    const fontSize  = d.fontSize  || 13;
    const font      = d.font      || "inherit";

    const renderLine = () => {
      if (lineatur === 1) {
        return `<div style="margin-bottom:10px;border-left:1px solid #bbb;border-right:1px solid #bbb;">
          <div style="height:11px;border-top:1px solid #bbb;"></div>
          <div style="height:11px;border-top:1px solid #bbb;background:#dff0f8;"></div>
          <div style="height:11px;border-top:2px solid #777;"></div>
          <div style="height:3px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>
        </div>`;
      }
      if (lineatur === 2) {
        return `<div style="margin-bottom:10px;">
          <div style="height:16px;border-top:1px dashed #bbb;"></div>
          <div style="height:5px;border-top:2px solid #777;"></div>
          <div style="height:4px;border-top:1px solid #bbb;"></div>
        </div>`;
      }
      return `<div style="border-bottom:1.5px solid #999;height:26px;margin-bottom:6px;"></div>`;
    };

    const textEl = html
      ? `<div style="font-size:${fontSize}px;font-family:${font};line-height:1.6;color:#333;margin-bottom:8px;">${html}</div>`
      : "";

    const lines = Array.from({length: d.lines}, (_, i) => `
      ${(d.label && i === 0 && !html) ? `<div style="font-size:11px;color:#888;font-weight:700;margin-bottom:2px;">${esc(d.label)}</div>` : ""}
      ${renderLine()}
    `).join("");

    return textEl + lines;
  },

  renderProps: d => {
    const lin      = d.lineatur || 0;
    const html     = d.html     || "";
    const fontSize = d.fontSize || 13;
    const font     = d.font     || "inherit";

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");

    const textEditor = `
      <div class="prow"><label>Frage / Text (optional)</label></div>
      <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:8px;">
        ${makeRichToolbar(d.id, 'html', sizeInput)}
        <div id="txted-${d.id}" contenteditable="true" data-field="html"
          onclick="event.stopPropagation()"
          oninput="richSave(${d.id},this)"
          onblur="richBlur(${d.id},this)"
          onkeyup="richUpdateBtns(${d.id})"
          onmouseup="richUpdateBtns(${d.id})"
          style="outline:none;padding:8px 10px;font-family:${font};font-size:${fontSize}px;
                 line-height:1.7;min-height:40px;color:#333;white-space:pre-wrap;word-break:break-word;"
        >${html}</div>
        <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
            ${fontOptions}
          </select>
        </div>
      </div>
    `;

    return textEditor +
      pr("Anzahl Zeilen", `<input type="number" min="1" max="20" value="${d.lines}" onchange="upd(${d.id},'lines',+this.value)">`) +
      pr("Lineatur", `<select onchange="upd(${d.id},'lineatur',+this.value)">
        <option value="0" ${lin===0?"selected":""}>Einfach</option>
        <option value="1" ${lin===1?"selected":""}>Lineatur 1 (1. Klasse)</option>
        <option value="2" ${lin===2?"selected":""}>Lineatur 2 (2. Klasse)</option>
      </select>`) +
      pr("Beschriftung", `<input value="${esc(d.label)}" placeholder="z.B. Antwort:" onchange="upd(${d.id},'label',this.value)">`);
  },
});
