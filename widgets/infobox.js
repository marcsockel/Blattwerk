// Widget: Infobox
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
    border:"thick",
  }),

  render: d => {
    const font    = d.font    || "inherit";
    const icon    = d.icon    || "";
    const iconPos = d.iconPos || "left";
    const html    = d.html    || esc(d.text||'');
    const iconHtml = icon
      ? `<span style="font-size:22px;line-height:1;flex-shrink:0;${iconPos==='right'?'margin-left:10px;':'margin-right:10px;'}">${icon}</span>`
      : "";
    const content = `<div style="font-size:13px;line-height:1.6;font-family:${font};color:#333;flex:1;">${html}</div>`;
    const inner = iconPos === 'right' ? `${content}${iconHtml}` : `${iconHtml}${content}`;
    return `<div style="display:flex;align-items:flex-start;">${inner}</div>`;
  },

  renderProps: d => {
    const font    = d.font    || "inherit";
    const icon    = d.icon    || "";
    const iconPos = d.iconPos || "left";
    const html    = d.html    || esc(d.text||'');

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
      makeRichEditorBox(d.id, 'html', html, font, 13, '', fontOptions) +
      pr("Symbol", `<select onchange="upd(${d.id},'icon',this.value)">${iconOptions}</select>`) +
      (icon ? `<div class="prow"><label>Position</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Links",  iconPos==="left",  `upd(${d.id},'iconPos','left')`)}
          ${toggleBtn("Rechts", iconPos==="right", `upd(${d.id},'iconPos','right')`)}
        </div></div>` : "");
  },
});
