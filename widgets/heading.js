// Widget: Überschrift
WIDGETS.push({
  meta: { type:"heading", label:"Überschrift", desc:"Großer Titel", icon:"H1", category:"allgemein" },
  createData: id => ({ id, type:"heading", text:"Überschrift", font:"inherit" }),
  render: d => {
    const font = d.font || "inherit";
    return `<input value="${esc(d.text)}" style="border:none;outline:none;font-weight:800;font-size:22px;width:100%;background:transparent;font-family:${font};" onclick="event.stopPropagation()" onchange="upd(${d.id},'text',this.value)">`;
  },
  renderProps: d => {
    const font = d.font || "inherit";
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");
    return pr("Text", `<input value="${esc(d.text)}" onchange="upd(${d.id},'text',this.value)">`) +
      pr("Schriftart", `<select onchange="upd(${d.id},'font',this.value)">${fontOptions}</select>`);
  },
});
