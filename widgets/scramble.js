// Widget: Buchstabensalat
WIDGETS.push({
  meta: { type:"scramble", label:"Buchstabensalat", desc:"Wörter entwirren", icon:"🔀", category:"deutsch" },
  createData: id => ({ id, type:"scramble", words:"SCHULE,KLASSE,LEHRER" , aufgabenNr:0, aufgabenText:''}),
  render: d => {
    const items=d.words.split(",").map((w,i)=>{
      const u=w.trim().toUpperCase();
      // deterministisch mischen; bei zufällig unveränderter Reihenfolge neuen Seed probieren
      let s=u;
      for(let t=0;t<8&&s===u;t++)s=seededShuffle(u.split(""),d.id*31+i*7+t*1009).join("");
      return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:13px;"><span style="font-family:monospace;font-size:14px;background:#f0eee8;padding:3px 8px;border-radius:4px;letter-spacing:2px;">${s}</span><span style="color:#bbb;">→</span><div style="border-bottom:1.5px solid #999;flex:1;height:20px;"></div></div>`;}).join("");
    return atHtml(d) + `<div>${items}</div>`;
  },
  renderProps: d => atProps(d.id, d) + pr("Wörter (kommagetrennt)",`<input value="${esc(d.words)}" onchange="upd(${d.id},'words',this.value)">`),
});
