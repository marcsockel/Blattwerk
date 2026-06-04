// Widget: Uhr

function uhrSvg(h, m, size) {
  const cx = size/2, cy = size/2, r = size/2 - 3;

  // Tick marks
  const ticks = Array.from({length: 60}, (_, i) => {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const isHour = i % 5 === 0;
    const r1 = r, r2 = r - (isHour ? 8 : 4);
    const sw = isHour ? (i % 15 === 0 ? 2.5 : 1.5) : 0.8;
    return `<line x1="${(cx + r1*Math.cos(angle)).toFixed(2)}" y1="${(cy + r1*Math.sin(angle)).toFixed(2)}"
      x2="${(cx + r2*Math.cos(angle)).toFixed(2)}" y2="${(cy + r2*Math.sin(angle)).toFixed(2)}"
      stroke="#444" stroke-width="${sw}"/>`;
  }).join("");

  // Hour numbers (12, 3, 6, 9)
  const nums = [12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const nr = r - 12;
    const fs = size < 100 ? 9 : 11;
    return `<text x="${(cx + nr*Math.cos(angle)).toFixed(1)}" y="${(cy + nr*Math.sin(angle) + fs*0.35).toFixed(1)}"
      text-anchor="middle" font-family="'DidactGothic7',sans-serif" font-size="${fs}" fill="#222">${n}</text>`;
  }).join("");

  // Hour hand
  const hAngle = ((h % 12) + m/60) * 30 - 90;
  const hRad   = hAngle * Math.PI / 180;
  const hLen   = r * 0.52;
  const hx = (cx + hLen * Math.cos(hRad)).toFixed(2);
  const hy = (cy + hLen * Math.sin(hRad)).toFixed(2);
  // back stub
  const hbx = (cx - 8 * Math.cos(hRad)).toFixed(2);
  const hby = (cy - 8 * Math.sin(hRad)).toFixed(2);

  // Minute hand
  const mAngle = m * 6 - 90;
  const mRad   = mAngle * Math.PI / 180;
  const mLen   = r * 0.75;
  const mx2 = (cx + mLen * Math.cos(mRad)).toFixed(2);
  const my2 = (cy + mLen * Math.sin(mRad)).toFixed(2);
  const mbx = (cx - 10 * Math.cos(mRad)).toFixed(2);
  const mby = (cy - 10 * Math.sin(mRad)).toFixed(2);

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="2"/>
    ${ticks}${nums}
    <line x1="${hbx}" y1="${hby}" x2="${hx}" y2="${hy}" stroke="#222" stroke-width="${size<100?3:4}" stroke-linecap="round"/>
    <line x1="${mbx}" y1="${mby}" x2="${mx2}" y2="${my2}" stroke="#444" stroke-width="${size<100?2:2.5}" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="#222"/>
  </svg>`;
}

function uhrGen(count, stufe) {
  const minutenFuer = {
    ganz:    [0],
    halb:    [0, 30],
    viertel: [0, 15, 30, 45],
    fuenf:   [0,5,10,15,20,25,30,35,40,45,50,55],
  };
  const mins = minutenFuer[stufe] || minutenFuer.ganz;
  return Array.from({length: count}, () => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: mins[Math.floor(Math.random() * mins.length)],
  }));
}

function uhrZeitText(size) {
  return `<div style="width:${size}px;height:24px;border:1.5px solid #555;border-radius:3px;
                      display:flex;align-items:center;justify-content:flex-end;
                      padding:0 6px;box-sizing:border-box;">
    <span style="font-size:12px;font-family:'DidactGothic7',sans-serif;color:#444;">Uhr</span>
  </div>`;
}

WIDGETS.push({
  meta: { type:"uhr", label:"Uhr", desc:"Analoge Uhren lesen", icon:"🕐", category:"mathematik" },

  createData: id => {
    const cfg = { anzahl:4, stufe:"ganz", textfeld:false, size:80 };
    return { id, type:"uhr", ...cfg, uhren: uhrGen(cfg.anzahl, cfg.stufe) };
  },

  render: d => {
    const size   = d.size || 120;
    const uhren  = d.uhren || uhrGen(d.anzahl||4, d.stufe||"ganz");
    const tf     = d.textfeld || false;
    const fmt    = d.textfeldFormat || "colon";

    const items = uhren.map(u => {
      const svg = uhrSvg(u.h, u.m, size);
      const label = tf ? `<div style="margin-top:6px;">${uhrZeitText(size)}</div>` : "";
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;">${svg}${label}</div>`;
    });

    const spacers = Array(6).fill(`<div style="height:0;width:${size}px;flex-shrink:0;flex-grow:0;"></div>`).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:16px 20px;justify-content:space-between;">${items.join("")}${spacers}</div>`;
  },

  renderProps: d => {
    const anzahl = d.anzahl || 4;
    const stufe  = d.stufe  || "ganz";
    const tf     = d.textfeld || false;
    const size   = d.size || 80;
    const uhren  = d.uhren || [];

    const stufeOpts = [
      ["ganz",    "Ganze Stunden"],
      ["halb",    "Halbe Stunden"],
      ["viertel", "Viertelstunden"],
      ["fuenf",   "5-Minuten-Schritte"],
    ].map(([v,l]) => `<option value="${v}" ${stufe===v?"selected":""}>${l}</option>`).join("");

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    // Per-clock time editors
    const clockEditors = uhren.map((u, idx) => {
      const hOpts = Array.from({length:12},(_,i)=>i+1).map(n =>
        `<option value="${n}" ${u.h===n?"selected":""}>${n}</option>`).join("");
      const mOpts = [0,5,10,15,20,25,30,35,40,45,50,55].map(n =>
        `<option value="${n}" ${u.m===n?"selected":""}>${String(n).padStart(2,'0')}</option>`).join("");
      return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
        <span style="font-size:11px;color:#aaa;width:16px;">${idx+1}.</span>
        <select onchange="uhrUpdTime(${d.id},${idx},'h',+this.value)"
          style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:2px 4px;font-size:12px;font-family:inherit;">${hOpts}</select>
        <span style="font-size:12px;color:#888;">:</span>
        <select onchange="uhrUpdTime(${d.id},${idx},'m',+this.value)"
          style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:2px 4px;font-size:12px;font-family:inherit;">${mOpts}</select>
      </div>`;
    }).join("");

    return pr("Anzahl Uhren",
        `<input type="number" min="1" max="12" value="${anzahl}" onchange="uhrUpdAnzahl(${d.id},+this.value)">`) +
      pr("Größe (px)",
        `<input type="number" min="60" max="200" step="10" value="${size}" onchange="upd(${d.id},'size',+this.value)">`) +
      pr("Zufalls-Stufe", `<select onchange="upd(${d.id},'stufe',this.value)">${stufeOpts}</select>`) +
      `<button onclick="event.stopPropagation();uhrRoll(${d.id})"
        style="margin-top:2px;margin-bottom:10px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Uhrzeiten würfeln</button>` +
      `<div style="font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;">Zeiten manuell</div>` +
      clockEditors +
      `<div class="prow"><label>Textfeld</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Keins", !tf, `upd(${d.id},'textfeld',false)`)}
          ${toggleBtn("Anzeigen", tf, `upd(${d.id},'textfeld',true)`)}
        </div>
      </div>` +
      "";
  },
});

// ── Uhr helpers ───────────────────────────────────────────────────
function uhrRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.uhren = uhrGen(w.anzahl||4, w.stufe||"ganz");
  render(); renderProps(id);
}

function uhrUpdAnzahl(id, n) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.anzahl = n;
  w.uhren  = uhrGen(n, w.stufe||"ganz");
  render(); renderProps(id);
}

function uhrUpdTime(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.uhren[idx][key] = val;
  render(); renderProps(id);
}
