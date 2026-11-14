// Widget: Überschrift — drei Ebenen
//   ebene 1 = großer Titel des Blatts (Standard), 2 = Abschnitt, 3 = Zwischentitel
// Ersetzt auch das frühere Widget „Zwischentitel" (subheading → ebene 3, sieht aus wie vorher;
// alte Blätter: migrateWidgets in index.html).
const HEADING_EBENEN = {
  1: 'font-weight:800;font-size:22px;',
  2: 'font-weight:700;font-size:18px;color:#333;',
  3: 'font-weight:700;font-size:15px;color:#555;',
};
function headingEbene(d) { return HEADING_EBENEN[d.ebene] ? +d.ebene : 1; }

WIDGETS.push({
  meta: { type:"heading", label:"Überschrift", desc:"Titel in drei Ebenen", icon:"H", category:"allgemein", selSafe:true },
  createData: id => ({ id, type:"heading", text:"Überschrift", ebene:1, font:"inherit", align:"left" }),
  render: d => {
    const font = d.font || "inherit";
    const align = d.align || "left";
    return `<input value="${esc(d.text)}" style="border:none;outline:none;${HEADING_EBENEN[headingEbene(d)]}width:100%;background:transparent;font-family:${font};text-align:${align};" onclick="event.stopPropagation()" onchange="upd(${d.id},'text',this.value)">`;
  },
  renderProps: d => {
    const font = d.font || "inherit", e = headingEbene(d);
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    const btn = n => `<button onclick="event.stopPropagation();upd(${d.id},'ebene',${n})"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${e===n?'#89b4fa':'#ddd'};
               background:${e===n?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${e===n?'#1e1e2e':'#999'};">${n}. Ebene</button>`;
    return pr("Text", `<input value="${esc(d.text)}" onchange="upd(${d.id},'text',this.value)">`) +
      `<div class="prow"><label>Ebene</label><div style="display:flex;gap:4px;">${btn(1)}${btn(2)}${btn(3)}</div></div>` +
      pr("Schriftart", `<select onchange="upd(${d.id},'font',this.value)">${fontOptions}</select>`) +
      alignToggle(d.id, d.align);
  },
});
