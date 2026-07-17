// Widget: Buchstabensalat
WIDGETS.push({
  meta: { type:"scramble", label:"Buchstabensalat", desc:"Wörter entwirren", icon:"🔀", category:"deutsch" },

  createData: id => ({
    id, type:"scramble",
    words: "SCHULE,KLASSE,LEHRER",
    cols: 1,
    groesse: "klein",
    aufgabenNr: 0, aufgabenText: "",
  }),

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const cols = Math.max(1, Math.min(4, d.cols || 1));
    const S = d.groesse === "gross" ? 1.5 : d.groesse === "mittel" ? 1.3 : 1;
    const px = v => Math.round(v * S);
    const scrambleFs = px(14);
    const arrowFs = px(13);
    const ansFs = px(16);
    const ansH = px(20);
    const gap = px(10);
    const mb = px(7);

    const words = d.words.split(",").map(w => w.trim()).filter(Boolean);
    const items = words.map((w, i) => {
      const u = w.toUpperCase();
      // deterministisch mischen; bei zufällig unveränderter Reihenfolge neuen Seed probieren
      let s = u;
      for (let t = 0; t < 8 && s === u; t++)
        s = seededShuffle(u.split(""), d.id * 31 + i * 7 + t * 1009).join("");
      const answerLine = isActive
        ? `<div style="border-bottom:1.5px solid #999;flex:1;min-width:40px;height:${ansH}px;display:flex;align-items:center;padding-left:6px;color:#2563eb;font-weight:700;font-size:${ansFs}px;">${esc(u)}</div>`
        : `<div style="border-bottom:1.5px solid #999;flex:1;min-width:40px;height:${ansH}px;"></div>`;
      return `<div style="display:flex;align-items:center;gap:${gap}px;margin-bottom:${mb}px;font-size:${arrowFs}px;">`
        + `<span style="font-family:monospace;font-size:${scrambleFs}px;background:#f0eee8;padding:3px 8px;border-radius:4px;letter-spacing:2px;white-space:nowrap;">${s}</span>`
        + `<span style="color:#bbb;">→</span>${answerLine}</div>`;
    });

    const perCol = Math.ceil(items.length / cols) || 1;
    const colDivs = Array.from({ length: cols }, (_, i) =>
      `<div style="flex:1;min-width:0;">${items.slice(i * perCol, (i + 1) * perCol).join("")}</div>`
    ).join("");

    return atHtml(d) + `<div style="display:flex;gap:${px(24)}px;align-items:flex-start;">${colDivs}</div>`;
  },

  renderProps: d => {
    const cols = d.cols || 1;
    const g = d.groesse || "klein";
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? "#a6e3a1" : "#ddd"};
               background:${active ? "#e8fdf0" : "#fff"};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? "#1e1e2e" : "#999"};">${label}</button>`;

    return pr("Wörter (kommagetrennt)",
        `<input value="${esc(d.words)}" onchange="upd(${d.id},'words',this.value)">`) +
      pr("Spalten", `<input type="number" min="1" max="4" value="${cols}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'cols',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", g === "klein", `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn("Mittel", g === "mittel", `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn("Groß", g === "gross", `upd(${d.id},'groesse','gross')`)}
        </div>
      </div>`;
  },
});
