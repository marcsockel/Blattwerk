// Widget: Zeitspanne
// Nutzt uhrSvg() und uhrZeitText() aus uhr.js (alphabetisch früher geladen)

function zeitspanneGen(count, stufe, stundenbereich) {
  const minutenFuer = {
    ganz:    [0],
    halb:    [0, 30],
    viertel: [0, 15, 30, 45],
    fuenf:   [0,5,10,15,20,25,30,35,40,45,50,55],
  };
  // Spans kompatibel mit der jeweiligen Stufe (alle Vielfache der Stufen-Einheit)
  const spansFuer = {
    ganz:    [60, 120, 180, 240],
    halb:    [30, 60, 90, 120, 150, 180],
    viertel: [15, 30, 45, 60, 75, 90, 105, 120],
    fuenf:   [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
  };
  const mins  = minutenFuer[stufe]  || minutenFuer.ganz;
  const spans = spansFuer[stufe]    || spansFuer.ganz;
  const is24  = stundenbereich === "0-24";
  const hRand = is24
    ? () => Math.floor(Math.random() * 24)
    : () => Math.floor(Math.random() * 12) + 1;

  return Array.from({length: count}, () => {
    const h1   = hRand();
    const m1   = mins[Math.floor(Math.random() * mins.length)];
    const span = spans[Math.floor(Math.random() * spans.length)];
    const tot  = h1 * 60 + m1 + span;
    const h2   = is24
      ? Math.floor(tot / 60) % 24
      : (Math.floor(tot / 60) % 12) || 12;
    const m2   = tot % 60;
    return { h1, m1, h2, m2 };
  });
}

WIDGETS.push({
  meta: { type:"zeitspanne", group:"zeit", label:"Zeitspanne", desc:"Zeitspanne zwischen zwei Uhren", icon:"⏱", category:"mathematik", itemsLayout: true },

  createData: id => {
    const cfg = { anzahl:4, stufe:"ganz", stundenbereich:"1-12", textfeld:"none", zeigerFarbe:false, aufgabenNr:0, aufgabenText:'' };
    return { id, type:"zeitspanne", ...cfg, items: zeitspanneGen(cfg.anzahl, cfg.stufe, cfg.stundenbereich) };
  },

  render: d => {
    const SIZE      = 80;
    const items     = d.items || zeitspanneGen(d.anzahl||4, d.stufe||"ganz", d.stundenbereich||"1-12");
    const fmt       = d.textfeldFormat || "colon";
    const isActive  = d.id === selId || _solutionsMode;
    const farbe     = !!d.zeigerFarbe;
    const tf        = d.textfeld === true ? "eine" : (d.textfeld === false ? "none" : (d.textfeld || "none"));
    const pad2      = n => String(n).padStart(2,'0');
    const timeStr   = (h, m) => fmt === "colon" ? `${h}:${pad2(m)}` : `${h}.${pad2(m)}`;
    const is24      = d.stundenbereich === "0-24";

    const mkClockLabel = (h, m) => {
      if (tf === "none") return "";
      if (isActive) {
        const t1 = `<div style="margin-top:4px;width:${SIZE}px;height:24px;border:1.5px solid #2563eb;border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding:0 6px;box-sizing:border-box;"><span style="font-size:12px;font-family:'DidactGothic7',sans-serif;color:#2563eb;font-weight:700;">${timeStr(h,m)} Uhr</span></div>`;
        if (tf === "zwei") {
          const h2 = (h + 12) % 24;
          const t2 = `<div style="margin-top:4px;width:${SIZE}px;height:24px;border:1.5px solid #2563eb;border-radius:3px;display:flex;align-items:center;justify-content:flex-end;padding:0 6px;box-sizing:border-box;"><span style="font-size:12px;font-family:'DidactGothic7',sans-serif;color:#2563eb;font-weight:700;">${timeStr(h2,m)} Uhr</span></div>`;
          return t1 + t2;
        }
        return t1;
      } else {
        const box = `<div style="margin-top:4px;">${uhrZeitText(SIZE)}</div>`;
        return tf === "zwei" ? box + box : box;
      }
    };

    const mkSpanField = (u) => {
      let t1 = u.h1 * 60 + u.m1;
      let t2 = u.h2 * 60 + u.m2;
      if (t2 <= t1) t2 += (is24 ? 24 : 12) * 60;
      const diff  = t2 - t1;
      const spanH = Math.floor(diff / 60);
      const spanM = diff % 60;
      if (isActive) {
        return `<div style="width:100%;box-sizing:border-box;padding:3px 6px;border:1.5px solid #2563eb;border-radius:3px;font-size:13px;font-family:'DidactGothic7',sans-serif;color:#2563eb;font-weight:700;text-align:center;">${spanH}h ${spanM}min</div>`;
      }
      return `<div style="width:100%;box-sizing:border-box;padding:3px 6px;border:1.5px solid #555;border-radius:3px;font-size:13px;font-family:'DidactGothic7',sans-serif;color:#333;display:flex;"><span style="flex:1;text-align:right;">h</span><span style="flex:1;text-align:right;">min</span></div>`;
    };

    const arrow = `<div style="width:100%;height:18px;display:flex;align-items:center;">
      <div style="flex:1;height:2px;background:#666;"></div>
      <div style="width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:10px solid #666;"></div>
    </div>`;

    const rendered = items.map(u => `
      <div style="display:flex;align-items:center;gap:4px;">
        <div style="display:inline-flex;flex-direction:column;align-items:center;flex-shrink:0;">
          ${uhrSvg(u.h1, u.m1, SIZE, true, farbe)}
          ${mkClockLabel(u.h1, u.m1)}
        </div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:5px;">
          ${mkSpanField(u)}
          ${arrow}
        </div>
        <div style="display:inline-flex;flex-direction:column;align-items:center;flex-shrink:0;">
          ${uhrSvg(u.h2, u.m2, SIZE, true, farbe)}
          ${mkClockLabel(u.h2, u.m2)}
        </div>
      </div>`);

    // Zwei Uhren + Mitte ≈ 2*SIZE + ~80
    const itemW = SIZE * 2 + 100;
    return atHtml(d) + flexDistribute(rendered, { itemW, d });
  },

  renderProps: d => {
    const anzahl        = d.anzahl || 4;
    const stufe         = d.stufe  || "ganz";
    const stundenbereich = d.stundenbereich || "1-12";
    const tf            = d.textfeld === true ? "eine" : (d.textfeld === false ? "none" : (d.textfeld || "none"));
    const zeigerFarbe   = !!d.zeigerFarbe;
    const items         = d.items || [];

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

    const hRange = stundenbereich === "0-24"
      ? Array.from({length:24},(_,i)=>i)
      : Array.from({length:12},(_,i)=>i+1);
    const mOpts = (sel) => [0,5,10,15,20,25,30,35,40,45,50,55].map(n =>
      `<option value="${n}" ${sel===n?"selected":""}>${String(n).padStart(2,'0')}</option>`).join("");
    const hOpts = (sel) => hRange.map(n =>
      `<option value="${n}" ${sel===n?"selected":""}>${n}</option>`).join("");
    const selStyle = `style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:2px 4px;font-size:12px;font-family:inherit;"`;

    const itemEditors = items.map((u, idx) => `
      <div style="margin-bottom:8px;padding:6px;background:#f8f8f8;border-radius:5px;">
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">${idx+1}. START</div>
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
          <select onchange="zeitspanneUpdTime(${d.id},${idx},'h1',+this.value)" ${selStyle}>${hOpts(u.h1)}</select>
          <span style="font-size:12px;color:#888;">:</span>
          <select onchange="zeitspanneUpdTime(${d.id},${idx},'m1',+this.value)" ${selStyle}>${mOpts(u.m1)}</select>
        </div>
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">${idx+1}. ENDE</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <select onchange="zeitspanneUpdTime(${d.id},${idx},'h2',+this.value)" ${selStyle}>${hOpts(u.h2)}</select>
          <span style="font-size:12px;color:#888;">:</span>
          <select onchange="zeitspanneUpdTime(${d.id},${idx},'m2',+this.value)" ${selStyle}>${mOpts(u.m2)}</select>
        </div>
      </div>`).join("");

    const genBlock =
      pr("Anzahl Items",
        `<input type="number" min="1" max="18" value="${anzahl}" onchange="zeitspanneUpdAnzahl(${d.id},+this.value)">`) +
      pr("Zufalls-Stufe", `<select onchange="upd(${d.id},'stufe',this.value)">${stufeOpts}</select>`) +
      `<div class="prow"><label>Stunden</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("1–12", stundenbereich==="1-12", `zeitspanneUpdStunden(${d.id},'1-12')`)}
          ${toggleBtn("0–23", stundenbereich==="0-24", `zeitspanneUpdStunden(${d.id},'0-24')`)}
        </div>
      </div>` +
      `<button onclick="event.stopPropagation();zeitspanneRoll(${d.id})"
        style="margin-top:2px;margin-bottom:10px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Zeiten würfeln</button>`;

    return genBlock +
      propFold('zeitspanne-manuell', 'Zeiten manuell', itemEditors, false) +
      propFold('zeitspanne-darstellung', 'Darstellung',
      `<div class="prow"><label>Textfeld</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Keins",    tf==="none", `upd(${d.id},'textfeld','none')`)}
          ${toggleBtn("1 Zeit",   tf==="eine", `upd(${d.id},'textfeld','eine')`)}
          ${toggleBtn("2 Zeiten", tf==="zwei", `upd(${d.id},'textfeld','zwei')`)}
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

// ── Zeitspanne helpers ────────────────────────────────────────────
function zeitspanneRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = zeitspanneGen(w.anzahl||4, w.stufe||"ganz", w.stundenbereich||"1-12");
  render(); renderProps(id);
}

function zeitspanneUpdAnzahl(id, n) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.anzahl = n;
  w.items  = zeitspanneGen(n, w.stufe||"ganz", w.stundenbereich||"1-12");
  render(); renderProps(id);
}

function zeitspanneUpdStunden(id, bereich) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.stundenbereich = bereich;
  w.items = zeitspanneGen(w.anzahl||4, w.stufe||"ganz", bereich);
  render(); renderProps(id);
}

function zeitspanneUpdTime(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items[idx][key] = val;
  render(); renderProps(id);
}
