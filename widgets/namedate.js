// Widget: Name / Datum
WIDGETS.push({
  meta: { type:"namedate", label:"Name / Datum", desc:"Kopfzeile", icon:"✏️", category:"allgemein" },
  createData: id => ({ id, type:"namedate" }),
  render: d => `<div style="display:flex;gap:16px;font-size:13px;"><div style="display:flex;align-items:flex-end;gap:5px;flex:1;"><strong>Name:</strong><div style="flex:1;border-bottom:1.5px solid #999;height:20px;"></div></div><div style="display:flex;align-items:flex-end;gap:5px;flex:1;"><strong>Datum:</strong><div style="flex:1;border-bottom:1.5px solid #999;height:20px;"></div></div></div>`,
  renderProps: d => '<span style="color:#bbb;font-size:11px;">Keine Optionen</span>',
});
