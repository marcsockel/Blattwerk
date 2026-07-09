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
  },

  createData: id => ({
    id,
    type: "wortchips",
    wordsText: "Hund\nKatze\nMaus\nVogel\nFisch\nPferd\nApfel\nBirne\nKirsche",
    font: "'DidactGothic7', sans-serif",
    fontSize: 16,
    gapX: 10,
    gapY: 8,
    chipPadX: 12,
    chipPadY: 5,
    align: "left",
    aufgabenNr: 0,
    aufgabenText: "",
  }),

  render: d => {
    const words = wcParseWords(d.wordsText);
    const font = d.font || "'DidactGothic7', sans-serif";
    const fs = d.fontSize || 16;
    const gapX = d.gapX ?? 10;
    const gapY = (d.gapY ?? 8) * 2; // gewünschter doppelter Zeilenabstand
    const padX = d.chipPadX ?? 12;
    const padY = d.chipPadY ?? 5;

    const chips = words.map(w =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;`
      + `padding:${padY}px ${padX}px;border:1.5px solid #bbb;border-radius:5px;`
      + `background:#fff;font-family:${font};font-size:${fs}px;line-height:1.2;`
      + `white-space:nowrap;color:#222;">${esc(w)}</span>`
    ).join("");

    const wrap = `<div style="display:flex;flex-wrap:wrap;gap:${gapY}px ${gapX}px;">`
      + `${chips || `<span style="color:#999;font-size:12px;">Keine Wörter.</span>`}</div>`;

    return atHtml(d) + (d.align === "center"
      ? `<div style="display:flex;justify-content:center;">${wrap}</div>`
      : d.align === "right"
        ? `<div style="display:flex;justify-content:flex-end;">${wrap}</div>`
        : wrap);
  },

  renderProps: d => {
    const font = d.font || "'DidactGothic7', sans-serif";
    const fs = d.fontSize || 16;
    const gapX = d.gapX ?? 10;
    const gapY = d.gapY ?? 8;
    const padX = d.chipPadX ?? 12;
    const padY = d.chipPadY ?? 5;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    return pr("Wörter (eine Zeile pro Wort oder mit , ; trennen)",
      `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;`
      + `border-radius:4px;padding:3px 6px;min-height:90px;resize:vertical;" `
      + `onchange="upd(${d.id},'wordsText',this.value)">${esc(d.wordsText || "")}</textarea>`) +
      `<div class="prow"><label>Schrift</label>
        <div style="display:flex;gap:4px;align-items:center;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="flex:1;font-size:11px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;">
            ${fontOptions}
          </select>
          <input type="number" min="8" max="40" value="${fs}" onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:52px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:11px;text-align:center;">
        </div>
      </div>` +
      pr("Abstand horizontal",
        `<input type="number" min="0" max="40" value="${gapX}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'gapX',+this.value)">`) +
      pr("Abstand vertikal",
        `<input type="number" min="0" max="40" value="${gapY}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'gapY',+this.value)">`) +
      pr("Chip-Innenabstand X",
        `<input type="number" min="2" max="30" value="${padX}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'chipPadX',+this.value)">`) +
      pr("Chip-Innenabstand Y",
        `<input type="number" min="1" max="20" value="${padY}" onclick="event.stopPropagation()"
          onchange="upd(${d.id},'chipPadY',+this.value)">`) +
      alignToggle(d.id, d.align);
  },
});

