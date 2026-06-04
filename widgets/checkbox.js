// Widget: Checkliste
WIDGETS.push({
  meta: { type:"checkbox", label:"Checkliste", desc:"Ankreuzaufgabe", icon:"☑", category:"allgemein" },
  createData: id => ({ id, type:"checkbox", items:["Richtig","Falsch","Vielleicht"] }),
  render: d => d.items.map(it=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:14px;"><div style="width:15px;height:15px;border:2px solid #999;border-radius:2px;flex-shrink:0;"></div>${esc(it)}</div>`).join(""),
  renderProps: d => pr("Einträge (eine Zeile pro Eintrag)",`<textarea style="width:100%;font-family:inherit;font-size:12px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:70px;resize:vertical;" onchange="upd(${d.id},'items',this.value.split('\\n').filter(s=>s.trim()))">${d.items.join("\n")}</textarea>`),
});
