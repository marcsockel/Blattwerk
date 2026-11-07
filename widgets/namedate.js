// Widget: Name / Datum
WIDGETS.push({
  meta: { type:"namedate", label:"Name / Datum", desc:"Kopfzeile", icon:"✏️", category:"allgemein" },

  createData: id => ({ id, type:"namedate", showName:true, showDatum:true, showKlasse:false }),

  render: d => {
    const fields = [];
    if (d.showName  !== false) fields.push("Name");
    if (d.showKlasse)          fields.push("Klasse");
    if (d.showDatum !== false) fields.push("Datum");
    if (!fields.length) return '';
    const fs = d.fontSize || 13;                 // Schriftgröße (Standard wie bisher 13)
    const lineH = Math.round(fs * 1.55);         // Schreiblinie wächst mit der Schrift
    const items = fields.map(label =>
      `<div style="display:flex;align-items:flex-end;gap:${Math.round(fs * 0.4)}px;flex:1;">
        <strong>${label}:</strong>
        <div style="flex:1;border-bottom:1.5px solid #999;height:${lineH}px;"></div>
      </div>`
    ).join('');
    return `<div style="display:flex;gap:${Math.round(fs * 1.25)}px;font-size:${fs}px;">${items}</div>`;
  },

  renderProps: d => {
    const tog = (label, key) => {
      const on = d[key] === true || (key==='showName'&&d[key]!==false) || (key==='showDatum'&&d[key]!==false);
      return `<button onclick="event.stopPropagation();upd(${d.id},'${key}',${!on})"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on?'#a6e3a1':'#ddd'};
               background:${on?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${on?'#1e1e2e':'#999'};">${label}</button>`;
    };
    return `<div class="prow"><label>Felder anzeigen</label>
      <div style="display:flex;gap:4px;">
        ${tog('Name','showName')}
        ${tog('Klasse','showKlasse')}
        ${tog('Datum','showDatum')}
      </div></div>` +
      pr('Schriftgröße', `<input type="number" min="8" max="36" value="${d.fontSize || 13}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'fontSize',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`);
  },
});
