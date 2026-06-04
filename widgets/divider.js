// Widget: Trennlinie
WIDGETS.push({
  meta: { type:"divider", label:"Trennlinie", desc:"Abschnitt trennen", icon:"—", category:"allgemein" },
  createData: id => ({ id, type:"divider" }),
  render: d => `<hr style="border:none;border-top:2px solid #e0ddd6;margin:6px 0;">`,
  renderProps: d => '<span style="color:#bbb;font-size:11px;">Keine Optionen</span>',
});
