// Widget: Wortchips (einfache Wortdarstellung in mehreren Reihen)

function wcParseWords(text) {
  return String(text || "")
    .split(/\r?\n|[,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

WIDGETS.push({
  meta: {
    type: "wortchips",
    label: "Wortchips",
    desc: "Wörter als Chips mit Zeilenumbruch",
    icon: "🏷️",
    category: "deutsch",
    itemsLayout: true,
  },

  createData: id => ({
    id,
    type: "wortchips",
    wordsText: "Hund\nKatze\nMaus\nVogel\nFisch\nPferd\nApfel\nBirne\nKirsche",
    font: "'DidactGothic7', sans-serif",
    fontSize: 16,
    chipPadX: 12,
    chipPadY: 5,
    align: "auto",
    itemGap: "normal",
    aufgabenNr: 0,
    aufgabenText: "",
  }),

  render: d => {
    const words = wcParseWords(d.wordsText);
    const font = d.font || "'DidactGothic7', sans-serif";
    const fs = d.fontSize || 16;
    const padX = d.chipPadX ?? 12;
    const padY = d.chipPadY ?? 5;

    const chips = words.map(w =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;`
      + `padding:${padY}px ${padX}px;border:1.5px solid #bbb;border-radius:5px;`
      + `background:#fff;font-family:${font};font-size:${fs}px;line-height:1.2;`
      + `white-space:nowrap;color:#222;">${esc(w)}</span>`
    );

    // Chipbreite grob schätzen (für Auto-Umbruch)
    const avgLen = chips.length
      ? words.reduce((s, w) => s + w.length, 0) / words.length
      : 6;
    const itemW = Math.ceil(avgLen * fs * 0.55 + padX * 2 + 8);

    return atHtml(d) + (chips.length
      ? flexDistribute(chips, { itemW, d })
      : `<span style="color:#999;font-size:12px;">Keine Wörter.</span>`);
  },

  renderProps: d => {
    const font = d.font || "'DidactGothic7', sans-serif";
    const fs = d.fontSize || 16;
    const padX = d.chipPadX ?? 12;
    const padY = d.chipPadY ?? 5;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    const sizeInput = `<input type="number" min="8" max="40" value="${fs}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:11px;text-align:center;background:#fff;">`;

    const editorBox = `<div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:flex-end;padding:5px 6px;
                  border-bottom:1px solid #eee;background:#fafafa;">
        ${sizeInput}
      </div>
      <textarea onclick="event.stopPropagation()"
        onchange="upd(${d.id},'wordsText',this.value)"
        style="display:block;width:100%;margin:0;font-family:${font};font-size:${fs}px;border:none;border-radius:0;
               padding:8px 10px;min-height:90px;resize:vertical;box-sizing:border-box;line-height:1.6;
               outline:none;color:#333;vertical-align:top;"
      >${esc(d.wordsText || "")}</textarea>
      <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
        <select onchange="upd(${d.id},'font',this.value)"
          style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
          ${fontOptions}
        </select>
      </div>
    </div>`;

    return `<div class="prow"><label>Wörter</label></div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;line-height:1.5;">
        Eine Zeile pro Wort oder mit <code>,</code> / <code>;</code> trennen
      </div>
      ${editorBox}` +
      pr("Chip-Innenabstand X",
        `<input type="number" min="2" max="30" value="${padX}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'chipPadX',+this.value)">`) +
      pr("Chip-Innenabstand Y",
        `<input type="number" min="1" max="20" value="${padY}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'chipPadY',+this.value)">`);
  },
});
