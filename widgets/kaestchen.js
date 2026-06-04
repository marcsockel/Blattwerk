// Widget: Kästchenfeld
WIDGETS.push({
  meta: { type:"kaestchen", label:"Kästchenfeld", desc:"Kariertes Rechenfeld", icon:"⊞", category:"mathematik" },

  createData: id => ({ id, type:"kaestchen", groesse:"mittel", zeilen:8 }),

  render: d => {
    const sizes = { klein: 10, mittel: 20, gross: 40 };
    const cs = sizes[d.groesse || "mittel"];
    const rows = d.zeilen || 8;
    const h = rows * cs;
    const pid = `kp${d.id}`;
    return `<svg class="kaestchen-svg" data-cs="${cs}" width="100%" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:hidden;">
      <defs>
        <pattern id="${pid}" width="${cs}" height="${cs}" patternUnits="userSpaceOnUse">
          <path d="M ${cs} 0 L 0 0 0 ${cs}" fill="none" stroke="#888" stroke-width="0.7"/>
        </pattern>
      </defs>
      <rect width="100%" height="${h}" fill="url(#${pid})"/>
      <rect width="100%" height="${h}" fill="none" stroke="#888" stroke-width="0.7"/>
    </svg>`;
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
        ${btn("klein","Klein (10px)")}
        ${btn("mittel","Mittel (20px)")}
        ${btn("gross","Groß (40px)")}
      </div></div>` +
      pr("Zeilen", `<input type="number" min="2" max="40" value="${d.zeilen||8}" onchange="upd(${d.id},'zeilen',+this.value)">`);
  },
});
