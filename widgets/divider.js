// Widget: Trennlinie
WIDGETS.push({
  meta: { type:"divider", label:"Trennlinie", desc:"Abschnitt trennen", icon:"—", category:"allgemein" },
  createData: id => ({ id, type:"divider" }),
  render: d => `<div style="height:2px;background:#e0ddd6;margin:6px 0;" role="separator"></div>`,
  renderProps: d => '<span style="color:#bbb;font-size:11px;">Keine Optionen</span>',
});
