// Widget: Nummerierung
WIDGETS.push({
  meta: { type:"numbering", label:"Nummerierung", desc:"Geordnete Liste", icon:"1.", category:"deutsch" },
  createData: id => ({ id, type:"numbering", items:["Erstens","Zweitens","Drittens"] }),
  render: d => d.items.map((it,i)=>`<div style="font-size:14px;padding:3px 0;"><strong>${i+1}.</strong> ${esc(it)}</div>`).join(""),
  renderProps: d => pr("Einträge (eine Zeile pro Eintrag)",`<textarea style="width:100%;font-family:inherit;font-size:12px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:70px;resize:vertical;" onchange="upd(${d.id},'items',this.value.split('\\n').filter(s=>s.trim()))">${d.items.join("\n")}</textarea>`),
});
