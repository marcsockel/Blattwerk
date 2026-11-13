// Widget: Infobox
// Symbol: eines der Zeichenebenen-Symbole (LW_SYMBOLE, leinwand.js) – ragt links oder rechts
// leicht über den oberen Rand; der Text weicht ihm aus. Ältere Blätter: Emoji (d.icon) bleibt.
const IB_SYM_GROESSE = { klein: 32, mittel: 44, gross: 58 };
const INFOBOX_ICONS = [
  { value: "",   label: "Keins" },
  { value: "❓", label: "❓ Fragezeichen" },
  { value: "❗", label: "❗ Ausrufezeichen" },
  { value: "🔍", label: "🔍 Lupe" },
  { value: "💡", label: "💡 Glühbirne" },
  { value: "⭐", label: "⭐ Stern" },
];

WIDGETS.push({
  meta: { type:"infobox", label:"Infobox", desc:"Textfeld mit Rahmen", icon:"▭", category:"allgemein" },

  createData: id => ({
    id, type:"infobox",
    html:"Hier steht ein wichtiger Hinweis.",
    icon:"",
    iconPos:"left",
    font:"inherit",
    fontSize:13,
    align:"left",
    border:"thick",
    bgColor:"",
    textColor:"#333",
  }),

  render: d => {
    const font     = d.font    || "inherit";
    const icon     = d.icon    || "";
    const iconPos  = d.iconPos || "left";
    const txtCol   = d.textColor || "#333";
    const fontSize = d.fontSize || 13;
    const align    = d.align || "left";
    const html    = d.html    || esc(d.text||'');
    const iconHtml = icon
      ? `<span style="font-size:22px;line-height:1;flex-shrink:0;${iconPos==='right'?'margin-left:10px;':'margin-right:10px;'}">${icon}</span>`
      : "";
    // Symbol aus der Zeichenebene (assets/symbole): ragt links/rechts leicht über den oberen Rand
    if (d.symbol && typeof lwSymbolSrc === 'function') {
      const sz  = IB_SYM_GROESSE[d.symbolGroesse] || IB_SYM_GROESSE.mittel;
      const pad = d.flush ? 0 : 7;
      const bw  = { dashed: 1.5, thin: 1, medium: 2, thick: 3 }[typeof frameBorder === 'function' ? frameBorder(d) : ''] || 0;
      const top = -(pad + bw) - Math.round(sz * 0.45);
      const seite = iconPos === 'right' ? 'right:4px;' : 'left:4px;';
      const sym = `<span style="position:absolute;top:${top}px;${seite}width:${sz}px;height:${sz}px;padding:2px;box-sizing:content-box;`
        + `background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;pointer-events:none;">`
        + `<img src="${d.symbolGrau && typeof lwSymbolSrcSw === 'function' ? lwSymbolSrcSw(d.symbol) : lwSymbolSrc(d.symbol)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;"></span>`;
      const platz = sz + 10;   // Text weicht dem Symbol aus
      const text = `<div class="infobox-text" style="font-size:${fontSize}px;line-height:1.6;font-family:${font};color:${txtCol};text-align:${align};`
        + `${iconPos === 'right' ? `padding-right:${platz}px;` : `padding-left:${platz}px;`}min-height:${Math.round(sz * 0.6)}px;">${html}</div>`;
      // ib-sym-<größe>: CSS (index.html) gibt dem Widget oben so viel Abstand, dass das Symbol nicht ins Widget darüber ragt
      return `<div class="ib-sym-${IB_SYM_GROESSE[d.symbolGroesse] ? d.symbolGroesse : 'mittel'}" style="position:relative;">${sym}${text}</div>`;
    }
    const content = `<div class="infobox-text" style="font-size:${fontSize}px;line-height:1.6;font-family:${font};color:${txtCol};flex:1;text-align:${align};">${html}</div>`;
    const inner = iconPos === 'right' ? `${content}${iconHtml}` : `${iconHtml}${content}`;
    return `<div style="display:flex;align-items:flex-start;">${inner}</div>`;
  },

  renderProps: d => {
    const font     = d.font    || "inherit";
    const icon     = d.icon    || "";
    const iconPos  = d.iconPos || "left";
    const txtCol   = d.textColor || "#333";
    const fontSize = d.fontSize || 13;
    const html    = d.html    || esc(d.text||'');

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    const iconOptions = INFOBOX_ICONS.map(i =>
      `<option value="${i.value}" ${icon===i.value?"selected":""}>${i.label}</option>`
    ).join("");
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', html, font, sizeInput, fontOptions) +
      alignToggle(d.id, d.align) +
      ibSymbolBlock(d) +
      ((icon || d.symbol) ? `<div class="prow"><label>Position</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Links",  iconPos==="left",  `upd(${d.id},'iconPos','left')`)}
          ${toggleBtn("Rechts", iconPos==="right", `upd(${d.id},'iconPos','right')`)}
        </div></div>` : "") +
      `<div class="prow"><label>Schriftfarbe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Schwarz", txtCol!=="#ffffff", `upd(${d.id},'textColor','#333')`)}
          ${toggleBtn("Weiß",    txtCol==="#ffffff", `upd(${d.id},'textColor','#ffffff')`)}
        </div></div>`;
  },
});

// Symbol-Auswahl in den Eigenschaften (gleiche Symbole wie in der Zeichenebene)
function ibSymbolBlock(d) {
  if (typeof LW_SYMBOLE === 'undefined') return pr("Symbol", `<select onchange="upd(${d.id},'icon',this.value)">${INFOBOX_ICONS.map(i => `<option value="${i.value}" ${d.icon === i.value ? 'selected' : ''}>${i.label}</option>`).join('')}</select>`);
  const g = d.symbolGroesse || 'mittel';
  const knopf = (label, on, js) => `<button onclick="event.stopPropagation();${js}"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on ? '#89b4fa' : '#ddd'};background:${on ? '#e8f0ff' : '#fff'};
             font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on ? '#1e1e2e' : '#999'};">${label}</button>`;
  const aktuell = d.symbol
    ? `<img src="${d.symbolGrau && typeof lwSymbolSrcSw === 'function' ? lwSymbolSrcSw(d.symbol) : lwSymbolSrc(d.symbol)}" style="width:34px;height:34px;object-fit:contain;">`
    : d.icon ? `<span style="font-size:24px;">${d.icon}</span>` : `<span style="color:#aaa;font-size:12px;">Kein Symbol</span>`;
  const grid = `<div style="display:flex;gap:4px;">
      <input type="search" placeholder="Symbol suchen …" onclick="event.stopPropagation()" oninput="lwSymbolFilter(this.value)"
        style="flex:1;min-width:0;box-sizing:border-box;padding:5px 8px;border:1.5px solid #ddd;border-radius:5px;font-family:inherit;font-size:12px;">
    </div>
    <div style="margin-top:4px;max-height:300px;overflow-y:auto;border:1.5px solid #e5e5e5;border-radius:6px;padding:5px 6px;background:#fafafa;">
    ${LW_SYMBOL_GRUPPEN.map((gr, gi) => `<div class="lw-symgrp">
      <div style="font-size:10px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:.4px;margin:6px 0 4px;">${gr}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:4px;">
      ${LW_SYMBOLE.filter(x => x[3] === gi).map(([n, t]) => `<button title="${t}" onclick="event.stopPropagation();ibSymbolSetzen(${d.id},'${n}')"
        style="aspect-ratio:1;border:1.5px solid ${d.symbol === n ? '#3b6fd4' : '#e5e5e5'};border-radius:5px;background:#fff;cursor:pointer;padding:3px;">
        <img src="${d.symbolGrau && typeof lwSymbolSrcSw === 'function' ? lwSymbolSrcSw(n) : lwSymbolSrc(n)}" alt="${t}" loading="lazy" style="width:100%;height:100%;object-fit:contain;pointer-events:none;"></button>`).join('')}
      </div></div>`).join('')}
    </div>`;
  return `<div class="prow"><label>Symbol</label>
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1.5px solid #e5e5e5;border-radius:6px;background:#fff;">${aktuell}</div>
        ${(d.symbol || d.icon) ? knopf('✕ Entfernen', false, `ibSymbolSetzen(${d.id},'')`) : ''}
        ${d.symbol ? knopf('◐ S/W', !!d.symbolGrau, `upd(${d.id},'symbolGrau',${!d.symbolGrau})`) : ''}
      </div></div>`
    + (d.symbol ? `<div class="prow"><label>Symbolgröße</label><div style="display:flex;gap:4px;">
        ${knopf('Klein', g === 'klein', `upd(${d.id},'symbolGroesse','klein')`)}${knopf('Mittel', g === 'mittel', `upd(${d.id},'symbolGroesse','mittel')`)}${knopf('Groß', g === 'gross', `upd(${d.id},'symbolGroesse','gross')`)}
      </div></div>` : '')
    + propFold('ib-symbole', 'Symbol auswählen', grid, !d.symbol);
}
function ibSymbolSetzen(id, name) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.symbol = name || '';
  w.icon = '';                 // altes Emoji-Symbol wird ersetzt
  render(); renderProps(id);
}
