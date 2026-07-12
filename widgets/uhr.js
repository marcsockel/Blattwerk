// Widget: Uhr

function uhrSvg(h, m, size, showHands=true, farbe=false, showNums=true) {
  const cx = size/2, cy = size/2, r = size/2 - 3;

  // Tick marks — nur 5-Minuten-Marken, einheitliche Dicke, kurz
  const ticks = Array.from({length: 12}, (_, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const r1 = r, r2 = r - 5;
    return `<line x1="${(cx + r1*Math.cos(angle)).toFixed(2)}" y1="${(cy + r1*Math.sin(angle)).toFixed(2)}"
      x2="${(cx + r2*Math.cos(angle)).toFixed(2)}" y2="${(cy + r2*Math.sin(angle)).toFixed(2)}"
      stroke="#444" stroke-width="1.5"/>`;
  }).join("");

  // Hour numbers (1–12) – optional
  const nums = !showNums ? "" : [12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    const fs = size < 100 ? 9 : 11;
    const nr = r * 0.82 - 2;
    return `<text x="${(cx + nr*Math.cos(angle)).toFixed(1)}" y="${(cy + nr*Math.sin(angle) + fs*0.35).toFixed(1)}"
      text-anchor="middle" font-family="'DidactGothic7',sans-serif" font-size="${fs}" fill="#222">${n}</text>`;
  }).join("");

  let hands = "";
  const hubColor = farbe ? "#111" : "#222";
  if (showHands) {
    // Hour hand
    const hAngle = ((h % 12) + m/60) * 30 - 90;
    const hRad   = hAngle * Math.PI / 180;
    const hLen   = r * 0.40;
    const hx = (cx + hLen * Math.cos(hRad)).toFixed(2);
    const hy = (cy + hLen * Math.sin(hRad)).toFixed(2);
    const hbx = cx.toFixed(2);
    const hby = cy.toFixed(2);
    // Minute hand
    const mAngle = m * 6 - 90;
    const mRad   = mAngle * Math.PI / 180;
    const mLen   = r * 0.625;
    const mx2 = (cx + mLen * Math.cos(mRad)).toFixed(2);
    const my2 = (cy + mLen * Math.sin(mRad)).toFixed(2);
    const mbx = cx.toFixed(2);
    const mby = cy.toFixed(2);
    const hColor = farbe ? "#dc2626" : "#222";
    const mColor = farbe ? "#2563eb" : "#444";
    hands = `<line x1="${hbx}" y1="${hby}" x2="${hx}" y2="${hy}" stroke="${hColor}" stroke-width="${size<100?3:4}" stroke-linecap="round"/>
    <line x1="${mbx}" y1="${mby}" x2="${mx2}" y2="${my2}" stroke="${mColor}" stroke-width="${size<100?2:2.5}" stroke-linecap="round"/>`;
  }
  const hub = `<circle cx="${cx}" cy="${cy}" r="3.5" fill="${hubColor}"/>`;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#333" stroke-width="2"/>
    ${ticks}${nums}${hands}${hub}
  </svg>`;
}

function uhrGen(count, stufe, stundenbereich) {
  const minutenFuer = {
    ganz:    [0],
    halb:    [0, 30],
    viertel: [0, 15, 30, 45],
    fuenf:   [0,5,10,15,20,25,30,35,40,45,50,55],
  };
  const mins = minutenFuer[stufe] || minutenFuer.ganz;
  const hRand = stundenbereich === "0-24"
    ? () => Math.floor(Math.random() * 24)       // 0–23
    : () => Math.floor(Math.random() * 12) + 1;  // 1–12
  return Array.from({length: count}, () => ({
    h: hRand(),
    m: mins[Math.floor(Math.random() * mins.length)],
  }));
}

function uhrZeitText(size, bh=24, fs=12) {
  return `<div style="width:${size}px;height:${bh}px;border:1.5px solid #555;border-radius:3px;
                      display:flex;align-items:center;justify-content:flex-end;
                      padding:0 6px;box-sizing:border-box;">
    <span style="font-size:${fs}px;font-family:'DidactGothic7',sans-serif;color:#444;">Uhr</span>
  </div>`;
}

WIDGETS.push({
  meta: { type:"uhr", group:"zeit", label:"Uhr", desc:"Analoge Uhren lesen", icon:"🕐", category:"mathematik" },

  createData: id => {
    const cfg = { anzahl:4, stufe:"ganz", stundenbereich:"1-12", textfeld:"none", gross:false, zeigerAus:false, zeigerFarbe:false, zahlenAus:false, size:120 , aufgabenNr:0, aufgabenText:''};
    return { id, type:"uhr", ...cfg, uhren: uhrGen(cfg.anzahl, cfg.stufe) };
  },

  render: d => {
    const gross  = !!d.gross;
    const size   = d.size || (gross ? 150 : 120);
    const bh     = gross ? 48 : 24;   // Boxhöhe
    const bfs    = gross ? 20 : 13;   // Box-Fontgröße
    const uhren  = d.uhren || uhrGen(d.anzahl||4, d.stufe||"ganz");
    const fmt    = d.textfeldFormat || "colon";

    const isActive   = d.id === selId || _solutionsMode;
    const zeigerAus  = !!d.zeigerAus;
    const zeigerFarbe = !!d.zeigerFarbe;
    const zahlenAus  = !!d.zahlenAus;
    // Rückwärtskompatibilität: alter boolean-Wert
    const tf = d.textfeld === true ? "eine" : (d.textfeld === false ? "none" : (d.textfeld || "none"));
    const pad2 = n => String(n).padStart(2,'0');
    const timeStr  = (h, m) => fmt === "colon" ? `${h}:${pad2(m)}` : `${h}.${pad2(m)}`;
    const blueBox  = (text) =>
      `<div style="margin-top:4px;width:${size}px;height:${bh}px;border:1.5px solid #2563eb;border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding:0 6px;box-sizing:border-box;">
        <span style="font-size:${bfs}px;font-family:'DidactGothic7',sans-serif;color:#2563eb;font-weight:700;">${text} Uhr</span></div>`;
    const blackBox = (text) =>
      `<div style="margin-top:4px;width:${size}px;height:${bh}px;border:1.5px solid #555;border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding:0 6px;box-sizing:border-box;">
        <span style="font-size:${bfs}px;font-family:'DidactGothic7',sans-serif;color:#222;font-weight:700;">${text} Uhr</span></div>`;
    const showHands = !zeigerAus || _solutionsMode;
    const items = uhren.map(u => {
      const svg = uhrSvg(u.h, u.m, size, showHands, zeigerFarbe, !zahlenAus);
      let label = "";
      if (zeigerAus) {
        // Zeiger aus → Zeit als Aufgabenstellung (immer sichtbar, schwarz)
        label = blackBox(timeStr(u.h, u.m));
        if (tf === "zwei") {
          const h2 = (u.h + 12) % 24;
          label += blackBox(timeStr(h2, u.m));
        }
      } else if (tf !== "none") {
        if (isActive) {
          label = blueBox(timeStr(u.h, u.m));
          if (tf === "zwei") {
            const h2 = (u.h + 12) % 24;
            label += blueBox(timeStr(h2, u.m));
          }
        } else {
          label = `<div style="margin-top:4px;">${uhrZeitText(size,bh,bfs)}</div>`;
          if (tf === "zwei") label += `<div style="margin-top:4px;">${uhrZeitText(size,bh,bfs)}</div>`;
        }
      }
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;">${svg}${label}</div>`;
    });

    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js).
    return atHtml(d) + flexDistribute(items, { gap: 20, marginBottom: 16, itemSize: `width:${size}px;`, itemW: size, d });
  },

  renderProps: d => {
    const anzahl = d.anzahl || 4;
    const stufe  = d.stufe  || "ganz";
    const tf = d.textfeld === true ? "eine" : (d.textfeld === false ? "none" : (d.textfeld || "none"));
    const size          = d.size || 80;
    const uhren         = d.uhren || [];
    const gross         = !!d.gross;
    const zeigerAus     = !!d.zeigerAus;
    const zeigerFarbe   = !!d.zeigerFarbe;
    const zahlenAus     = !!d.zahlenAus;
    const stundenbereich = d.stundenbereich || "1-12";

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
      const hRange = stundenbereich === "0-24"
        ? Array.from({length:24},(_,i)=>i)
        : Array.from({length:12},(_,i)=>i+1);
      const hOpts = hRange.map(n =>
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

    const genBlock =
      pr("Anzahl Uhren",
        `<input type="number" min="1" max="64" value="${anzahl}" onchange="uhrUpdAnzahl(${d.id},+this.value)">`) +
      pr("Zufalls-Stufe", `<select onchange="upd(${d.id},'stufe',this.value)">${stufeOpts}</select>`) +
      `<div class="prow"><label>Stunden</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("1–12",  stundenbereich==="1-12",  `uhrUpdStunden(${d.id},'1-12')`)}
          ${toggleBtn("0–23",  stundenbereich==="0-24",  `uhrUpdStunden(${d.id},'0-24')`)}
        </div>
      </div>` +
      `<button onclick="event.stopPropagation();uhrRoll(${d.id})"
        style="margin-top:2px;margin-bottom:10px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Uhrzeiten würfeln</button>`;

    return genBlock +
      propFold('uhr-manuell', 'Zeiten manuell', clockEditors, false) +
      propFold('uhr-darstellung', 'Darstellung',
      pr("Größe (px)",
        `<input type="number" min="60" max="200" step="10" value="${size}" onchange="upd(${d.id},'size',+this.value)">`) +
      `<div class="prow"><label>Textfeld</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Keins",    tf==="none", `upd(${d.id},'textfeld','none')`)}
          ${toggleBtn("1 Zeit",   tf==="eine", `upd(${d.id},'textfeld','eine')`)}
          ${toggleBtn("2 Zeiten", tf==="zwei", `upd(${d.id},'textfeld','zwei')`)}
        </div>
      </div>` +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", !gross, `uhrUpdGross(${d.id},false)`)}
          ${toggleBtn("Groß",   gross, `uhrUpdGross(${d.id},true)`)}
        </div>
      </div>` +
      `<div class="prow"><label>Zeiger</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Anzeigen",  !zeigerAus, `upd(${d.id},'zeigerAus',false)`)}
          ${toggleBtn("Ausblenden", zeigerAus, `upd(${d.id},'zeigerAus',true)`)}
        </div>
      </div>` +
      `<div class="prow"><label>Ziffern</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Anzeigen",  !zahlenAus, `upd(${d.id},'zahlenAus',false)`)}
          ${toggleBtn("Ausblenden", zahlenAus, `upd(${d.id},'zahlenAus',true)`)}
        </div>
      </div>` +
      `<div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("S/W",   !zeigerFarbe, `upd(${d.id},'zeigerFarbe',false)`)}
          ${toggleBtn("Farbe",  zeigerFarbe, `upd(${d.id},'zeigerFarbe',true)`)}
        </div>
      </div>`,
      false);
  },
});

// ── Uhr helpers ───────────────────────────────────────────────────
function uhrRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.uhren = uhrGen(w.anzahl||4, w.stufe||"ganz", w.stundenbereich||"1-12");
  render(); renderProps(id);
}

function uhrUpdAnzahl(id, n) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.anzahl = n;
  w.uhren  = uhrGen(n, w.stufe||"ganz", w.stundenbereich||"1-12");
  render(); renderProps(id);
}

function uhrUpdGross(id, gross) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.gross = gross;
  w.size  = gross ? 150 : 120;
  render(); renderProps(id);
}

function uhrUpdStunden(id, bereich) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.stundenbereich = bereich;
  w.uhren = uhrGen(w.anzahl||4, w.stufe||"ganz", bereich);
  render(); renderProps(id);
}

function uhrUpdTime(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.uhren[idx][key] = val;
  render(); renderProps(id);
}
