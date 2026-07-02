// Widget: Platzhalter — leerer Abstand mit einstellbarer Höhe (px)
WIDGETS.push({
  meta: { type:"platzhalter", label:"Platzhalter", desc:"Leerer Abstand in Pixeln", icon:"▢", category:"allgemein" },

  createData: id => ({ id, type:"platzhalter", height: 48, flush: true }),

  render: d => {
    const h = Math.max(0, d.height ?? 48);
    return `<div class="ph-spacer" aria-hidden="true" style="height:${h}px;min-height:${h}px;flex-shrink:0;"></div>`;
  },

  renderProps: d => {
    const h = Math.max(0, d.height ?? 48);
    return `<div class="prow"><label>Höhe</label>
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="range" min="0" max="400" step="1" value="${h}"
          onclick="event.stopPropagation()"
          oninput="document.getElementById('ph-h-${d.id}').textContent=this.value+' px';updq(${d.id},'height',+this.value)"
          onchange="upd(${d.id},'height',+this.value)"
          style="flex:1;accent-color:#7287fd;">
        <span id="ph-h-${d.id}" style="font-size:11px;color:#666;min-width:44px;text-align:right;font-variant-numeric:tabular-nums;">${h} px</span>
      </div></div>`;
  },
});
