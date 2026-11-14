// Widget: Abstand / Trennlinie (Typ „platzhalter")
// Senkrechter Abstand mit einstellbarer Höhe — auf Wunsch mit einer Linie oben, in der Mitte
// oder unten. Startet als reiner Abstand (ohne Linie). Ersetzt die früheren Widgets „Platzhalter"
// (= Linie „Keine") und „Trennlinie" (alte Blätter: migrateWidgets in index.html).
//   height       Höhe in px
//   linie        none | dashed | dotted | thin | medium | thick   (fehlt = none: alte Platzhalter)
//   lage         oben | mitte | unten — wo die Linie im Abstand liegt (fehlt = mitte)
//   linienFarbe  Grauton der Linie
const ABST_LINIEN = {
  none:   { w: 0, s: 'solid',  label: 'Keine (nur Abstand)' },
  dashed: { w: 2, s: 'dashed', label: '- - - Gestrichelt' },
  dotted: { w: 2, s: 'dotted', label: '· · · Gepunktet' },
  thin:   { w: 1, s: 'solid',  label: '──── Leicht (1px)' },
  medium: { w: 2, s: 'solid',  label: '──── Mittel (2px)' },
  thick:  { w: 3, s: 'solid',  label: '──── Dick (3px)' },
};
const ABST_FARBEN = [
  ['#e0ddd6', 'Hellgrau (Standard)'], ['#bbbbbb', 'Grau'], ['#888888', 'Mittelgrau'],
  ['#555555', 'Dunkelgrau'], ['#222222', 'Schwarz'],
];
function abstLinie(d) { return ABST_LINIEN[d.linie] ? d.linie : 'none'; }

WIDGETS.push({
  meta: { type:"platzhalter", label:"Abstand / Trennlinie", desc:"Leerer Abstand, auf Wunsch mit Linie", icon:"↕", category:"allgemein" },

  createData: id => ({ id, type:"platzhalter", height: 48, linie:"none", lage:"mitte", linienFarbe:"#e0ddd6", flush: true }),

  render: d => {
    const st = ABST_LINIEN[abstLinie(d)];
    const h = Math.max(st.w, d.height ?? 48);
    const linie = st.w ? `<div role="separator" style="flex:1;height:0;border-top:${st.w}px ${st.s} ${d.linienFarbe || '#e0ddd6'};"></div>` : '';
    return `<div class="ph-spacer" ${st.w ? '' : 'aria-hidden="true"'} style="height:${h}px;min-height:${h}px;flex-shrink:0;display:flex;align-items:${d.lage === 'oben' ? 'flex-start' : d.lage === 'unten' ? 'flex-end' : 'center'};">${linie}</div>`;
  },

  renderProps: d => {
    const h = Math.max(0, d.height ?? 48), linie = abstLinie(d), col = d.linienFarbe || '#e0ddd6';
    const opts = Object.entries(ABST_LINIEN).map(([v, o]) => `<option value="${v}" ${linie === v ? 'selected' : ''}>${o.label}</option>`).join('');
    const sw = ABST_FARBEN.map(([c, t]) => {
      const on = col === c;
      return `<button onclick="event.stopPropagation();upd(${d.id},'linienFarbe','${c}')" title="${t}"
        style="width:24px;height:24px;border-radius:4px;flex-shrink:0;border:2px solid ${on ? '#89b4fa' : '#ddd'};
               background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;">
        <span style="display:block;width:14px;height:4px;border-radius:1px;background:${c};"></span></button>`;
    }).join('');
    return `<div class="prow"><label>Höhe</label>
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="range" min="0" max="400" step="1" value="${h}"
          onclick="event.stopPropagation()"
          oninput="document.getElementById('ph-h-${d.id}').textContent=this.value+' px';updq(${d.id},'height',+this.value)"
          onchange="upd(${d.id},'height',+this.value)"
          style="flex:1;accent-color:#7287fd;">
        <span id="ph-h-${d.id}" style="font-size:11px;color:#666;min-width:44px;text-align:right;font-variant-numeric:tabular-nums;">${h} px</span>
      </div></div>
      <div class="prow"><label>Linie</label>
        <select onchange="upd(${d.id},'linie',this.value)"
          style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px;">${opts}</select></div>`
      + (linie !== 'none' ? `<div class="prow"><label>Lage der Linie</label><div style="display:flex;gap:4px;">${[['oben', 'Oben'], ['mitte', 'Mitte'], ['unten', 'Unten']].map(([v, l]) => {
          const on = (['oben', 'unten'].includes(d.lage) ? d.lage : 'mitte') === v;
          return `<button onclick="event.stopPropagation();upd(${d.id},'lage','${v}')" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on ? '#89b4fa' : '#ddd'};background:${on ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on ? '#1e1e2e' : '#999'};">${l}</button>`;
        }).join('')}</div></div>
        <div class="prow"><label>Linienfarbe</label><div style="display:flex;gap:4px;">${sw}</div></div>` : '');
  },
});
