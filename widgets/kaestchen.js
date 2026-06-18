// Widget: Kästchenfeld
WIDGETS.push({
  meta: { type:"kaestchen", label:"Kästchenfeld", desc:"Kariertes Rechenfeld", icon:"⊞", category:"mathematik" },

  createData: id => ({ id, type:"kaestchen", groesse:"mittel", zeilen:8 , aufgabenNr:0, aufgabenText:''}),

  render: d => {
    const sizes = { klein: 15, mittel: 20, gross: 40 };
    const cs = sizes[d.groesse || "mittel"];
    const rows = d.zeilen || 8;
    const h = rows * cs;
    const pid = `kp${d.id}`;
    const fullCols = { klein: 37, mittel: 28, gross: 14 }[d.groesse || 'mittel'];
    const _frac=d.widthFraction||(d.halfWidth?'1/2':'full');
    const cols=Math.round(fullCols*({'1/4':0.25,'1/2':0.5,'3/4':0.75,'full':1}[_frac]||1));
    const w = cols * cs;
    let lines = '';
    for (let i = 1; i < cols; i++)
      lines += `<line x1="${i*cs}" y1="0" x2="${i*cs}" y2="${h}" stroke="#888" stroke-width="0.7"/>`;
    for (let j = 1; j < rows; j++)
      lines += `<line x1="0" y1="${j*cs}" x2="${w}" y2="${j*cs}" stroke="#888" stroke-width="0.7"/>`;
    const border = `<rect x="0.35" y="0.35" width="${w-0.7}" height="${h-0.7}" fill="none" stroke="#888" stroke-width="0.7"/>`;
    return atHtml(d) + `<svg class="kaestchen-svg" data-cs="${cs}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${lines}${border}</svg>`;
  },

  renderProps: d => {
    const g = d.groesse || "mittel";
    const btn = (val, label) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'groesse','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${g===val?'#89b4fa':'#ddd'};
               background:${g===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${g===val?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Kästchengröße</label>
      <div style="display:flex;gap:4px;">
        ${btn("klein","Klein (15px)")}
        ${btn("mittel","Mittel (20px)")}
        ${btn("gross","Groß (40px)")}
      </div></div>` +
      pr("Zeilen", `<input type="number" min="2" max="40" value="${d.zeilen||8}" onchange="upd(${d.id},'zeilen',+this.value)">`) ;
  },
});
