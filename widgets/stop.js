// Widget: Stopp!
WIDGETS.push({
  meta: { type:"stop", label:"Stopp!", desc:"Ende der Aufgabe", icon:"🛑", category:"allgemein" },
  createData: id => ({ id, type:"stop" }),
  render: () => `<div style="display:flex;justify-content:center;padding:4px 0;">
    <svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
      <polygon points="22,4 50,4 68,22 68,50 50,68 22,68 4,50 4,22"
        fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
      <text x="36" y="30" text-anchor="middle"
        font-family="'Nunito','DidactGothic7',sans-serif"
        font-size="11" font-weight="800" fill="white">STOPP!</text>
      <text x="36" y="48" text-anchor="middle"
        font-family="'Nunito','DidactGothic7',sans-serif"
        font-size="9" font-weight="700" fill="rgba(255,255,255,0.85)">Bleistift</text>
      <text x="36" y="59" text-anchor="middle"
        font-family="'Nunito','DidactGothic7',sans-serif"
        font-size="9" font-weight="700" fill="rgba(255,255,255,0.85)">weglegen</text>
    </svg>
  </div>`,
  renderProps: () => `<div style="color:#aaa;font-size:12px;padding:8px 0;">Keine Einstellungen.</div>`,
});
