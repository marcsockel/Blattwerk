// Widget: Zwischentitel
WIDGETS.push({
  meta: { type:"subheading", label:"Zwischentitel", desc:"Abschnittstitel", icon:"H2", category:"allgemein", selSafe:true },
  createData: id => ({ id, type:"subheading", text:"Aufgabe 1", font:"inherit", align:"left" }),
  render: d => {
    const font = d.font || "inherit";
    const align = d.align || "left";
    return `<input value="${esc(d.text)}" style="border:none;outline:none;font-weight:700;font-size:15px;width:100%;color:#555;background:transparent;font-family:${font};text-align:${align};" onclick="event.stopPropagation()" onchange="upd(${d.id},'text',this.value)">`;
  },
  renderProps: d => {
    const font = d.font || "inherit";
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    return pr("Text", `<input value="${esc(d.text)}" onchange="upd(${d.id},'text',this.value)">`) +
      pr("Schriftart", `<select onchange="upd(${d.id},'font',this.value)">${fontOptions}</select>`) +
      alignToggle(d.id, d.align);
  },
});
