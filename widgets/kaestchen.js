// Widget: Kästchenfeld
WIDGETS.push({
  meta: { type:"kaestchen", label:"Kästchenfeld", desc:"Kariertes Rechenfeld", icon:"⊞", category:"mathematik", selSafe:true },

  createData: id => ({ id, type:"kaestchen", groesse:"mittel", zeilen:8 , aufgabenNr:0, aufgabenText:''}),

  render: d => {
    const sizes = { klein: 16, mittel: 20, gross: 40 };
    const cs = sizes[d.groesse || "mittel"];
    const rows = d.zeilen || 8;
    const h = rows * cs;
    // SVG startet mit width:100% → erzwingt NIE eine größere Widgetbreite.
    // Das Gitter wird nach dem Layout per fitKaestchenSvg() an die echte
    // verfügbare Breite angepasst (siehe requestAnimationFrame-Hook in index.html).
    return atHtml(d) + `<svg class="kaestchen-svg" data-cs="${cs}" data-rows="${rows}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:${h}px;"></svg>`;
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
        ${btn("klein","Klein (16px)")}
        ${btn("mittel","Mittel (20px)")}
        ${btn("gross","Groß (40px)")}
      </div></div>` +
      pr("Zeilen", `<input type="number" min="2" max="50" value="${d.zeilen||8}" onchange="upd(${d.id},'zeilen',+this.value)">`) ;
  },
});

// Zeichnet das Karo-Gitter passend zur ECHTEN aktuellen Breite des SVG.
// Wird nach jedem Render im requestAnimationFrame-Hook aufgerufen.
// cols = floor(verfügbareBreite / Kästchengröße) → nie eine Spalte zu viel,
// das Widget wird dadurch nie über seinen Layoutrahmen hinaus vergrößert.
function fitKaestchenSvg(svg) {
  const cs   = +svg.dataset.cs;
  const rows = +svg.dataset.rows;
  const avail = svg.clientWidth;            // = Inhaltsbreite des Containers (svg ist width:100%)
  if (!avail) return;
  const cols = Math.max(1, Math.floor(avail / cs));
  const w = cols * cs, h = rows * cs;
  let g = '';
  for (let i = 1; i < cols; i++)
    g += `<line x1="${i*cs}" y1="0" x2="${i*cs}" y2="${h}" stroke="#888" stroke-width="0.7"/>`;
  for (let j = 1; j < rows; j++)
    g += `<line x1="0" y1="${j*cs}" x2="${w}" y2="${j*cs}" stroke="#888" stroke-width="0.7"/>`;
  g += `<rect x="0.35" y="0.35" width="${w-0.7}" height="${h-0.7}" fill="none" stroke="#888" stroke-width="0.7"/>`;
  svg.innerHTML = g;
}
