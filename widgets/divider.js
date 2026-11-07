// Widget: Trennlinie
// Linienart (wie „Rahmen" in den Box-Eigenschaften) und Linienfarbe (wie „Hintergrund").
// Ohne Angaben (ältere Blätter): mittel, hellgrau — sieht aus wie bisher.
const DIVIDER_STYLES = {
  dashed: { w: 2, s: 'dashed', label: '- - - Gestrichelt' },
  dotted: { w: 2, s: 'dotted', label: '· · · Gepunktet' },
  thin:   { w: 1, s: 'solid',  label: '──── Leicht (1px)' },
  medium: { w: 2, s: 'solid',  label: '──── Mittel (2px)' },
  thick:  { w: 3, s: 'solid',  label: '──── Dick (3px)' },
};
const DIVIDER_COLORS = [
  ['#e0ddd6', 'Hellgrau (Standard)'], ['#bbbbbb', 'Grau'], ['#888888', 'Mittelgrau'],
  ['#555555', 'Dunkelgrau'], ['#222222', 'Schwarz'],
];

WIDGETS.push({
  meta: { type:"divider", label:"Trennlinie", desc:"Abschnitt trennen", icon:"—", category:"allgemein" },
  createData: id => ({ id, type:"divider", linie:"medium", linienFarbe:"#e0ddd6" }),
  render: d => {
    const st  = DIVIDER_STYLES[d.linie] || DIVIDER_STYLES.medium;
    const col = d.linienFarbe || '#e0ddd6';
    // Höhe fest 2px-Bereich wie bisher; die Linie selbst als border-top
    return `<div style="height:0;border-top:${st.w}px ${st.s} ${col};margin:6px 0;" role="separator"></div>`;
  },
  renderProps: d => {
    const linie = DIVIDER_STYLES[d.linie] ? d.linie : 'medium';
    const col   = d.linienFarbe || '#e0ddd6';
    const opts  = Object.entries(DIVIDER_STYLES).map(([v, o]) =>
      `<option value="${v}" ${linie === v ? 'selected' : ''}>${o.label}</option>`).join('');
    const sw = DIVIDER_COLORS.map(([c, t]) => {
      const on = col === c;
      return `<button onclick="event.stopPropagation();upd(${d.id},'linienFarbe','${c}')" title="${t}"
        style="width:24px;height:24px;border-radius:4px;flex-shrink:0;border:2px solid ${on ? '#89b4fa' : '#ddd'};
               background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;">
        <span style="display:block;width:14px;height:4px;border-radius:1px;background:${c};"></span></button>`;
    }).join('');
    return `<div class="sf-h">Linie</div>
      <select onchange="upd(${d.id},'linie',this.value)"
        style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px;margin-bottom:9px;">
        ${opts}
      </select>
      <div class="sf-h">Linienfarbe</div>
      <div style="display:flex;gap:4px;">${sw}</div>`;
  },
});
