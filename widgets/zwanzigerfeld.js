// Widget: Zwanzigerfeld (Anschauungshilfe ZR 20)

function zfRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function zfGenAufgabe(op) {
  const plus = op === '+' || (op === 'both' && Math.random() < 0.5);
  if (plus) {
    const a = zfRand(1, 19), b = zfRand(1, 20 - a);
    return { a, b, op: '+', result: a + b };
  } else {
    const a = zfRand(2, 20), b = zfRand(1, a - 1);
    return { a, b, op: '-', result: a - b };
  }
}

function zfGen(n, op) {
  return Array.from({ length: n }, () => zfGenAufgabe(op));
}

function zfGenOne(w) {
  if ((w.modus || 'rechnen') === 'zahl') {
    const a = zfRand(1, 20);
    return { a, b: 0, op: '+', result: a };
  }
  return zfGenAufgabe(w.op || 'both');
}

// ── Manuelle Bearbeitung ────────────────────────────────────────────
function zfAufgabeToLine(auf, modus) {
  if (modus === 'zahl') return String(auf.a);
  return `${auf.a} ${auf.op} ${auf.b}`;
}

function zfTasksToText(w) {
  const modus = w.modus || 'rechnen';
  return (w.aufgaben || []).map(auf => zfAufgabeToLine(auf, modus)).join('\n');
}

function zfParseLine(line, modus) {
  const s = String(line).trim();
  if (!s) return null;
  if (modus === 'zahl') {
    const n = parseInt(s, 10);
    if (!Number.isFinite(n) || n < 1 || n > 20) return null;
    return { a: n, b: 0, op: '+', result: n };
  }
  const m = s.replace(/[–—]/g, '-').match(/^(\d+)\s*([+\-])\s*(\d+)$/);
  if (!m) return null;
  const a = +m[1], b = +m[3], op = m[2];
  if (a < 1 || b < 1 || a > 20) return null;
  if (op === '+' && a + b > 20) return null;
  if (op === '-' && b >= a) return null;
  const result = op === '+' ? a + b : a - b;
  return { a, b, op, result };
}

function zfApplyManual(w, text) {
  const modus = w.modus || 'rechnen';
  w.manualText = text;
  w.aufgaben = String(text).split('\n')
    .map(l => zfParseLine(l, modus))
    .filter(Boolean);
  w.anzahl = Math.max(1, Math.min(24, w.aufgaben.length || 1));
}

function zfResize(w) {
  const n = Math.max(1, Math.min(24, w.anzahl || 4));
  let aufgaben = (w.aufgaben || []).slice(0, n);
  while (aufgaben.length < n) aufgaben.push(zfGenOne(w));
  w.aufgaben = aufgaben;
  w.anzahl = n;
  w.manualText = zfTasksToText(w);
}

function zfGridMetrics(size) {
  const isSmall = size === 'klein';
  const isMedium = size === 'mittel';
  const cw = isSmall ? 14 : isMedium ? 16 : 22;
  const gx = isSmall ? 2 : isMedium ? 2 : 3;
  const fiverExtra = Math.round(96 / 25.4); // +1 mm gegenüber normaler Kästchenlücke
  const gy = gx;
  const ch = cw;
  const W = 10 * (cw + gx) + gx + fiverExtra;
  const H = 2 * (ch + gy) + gy;
  const colX = col => (col < 5
    ? gx + col * (cw + gx)
    : gx + 5 * (cw + gx) + fiverExtra + (col - 5) * (cw + gx));
  const fiverLineX = colX(4) + cw + (gx + fiverExtra) / 2;
  return { cw, ch, gx, gy, fiverExtra, W, H, colX, fiverLineX };
}

function zfGridSvg(auf, bw=false, size='klein') {
  const { a, b, op, result } = auf;
  const { cw, ch, gx, gy, W, H, colX, fiverLineX } = zfGridMetrics(size);

  // Addition:    first a = color1, next b = color2
  // Subtraction: all a cells = same color, last b of them get an X (crossed out)
  const isPlus = op === '+';
  const c1 = isPlus ? a : result;   // solid colored cells
  const c2 = isPlus ? a + b : a;    // total colored (incl. crossed)

  let s = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;
  s += `<rect width="${W}" height="${H}" fill="#f0ede6" rx="5"/>`;

  for (let i = 0; i < 20; i++) {
    const row = Math.floor(i / 10), col = i % 10;
    const x = colX(col), y = gy + row * (ch + gy);
    const num = i + 1;
    const crossed = !isPlus && num > c1 && num <= c2;
    let fill, stroke;
    const col1 = bw ? '#444' : '#d64f5e';
    const col2 = bw ? '#aaa' : '#4a8fd4';
    if      (num <= c1)           { fill = col1; stroke = 'none'; }
    else if (num <= c2 && isPlus) { fill = col2; stroke = 'none'; }
    else if (crossed)             { fill = col1; stroke = 'none'; }
    else                          { fill = '#fff'; stroke = '#ccc'; }
    s += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
    // Cross out subtracted cells
    if (crossed) {
      const p = 4;
      s += `<line x1="${x+p}" y1="${y+p}" x2="${x+cw-p}" y2="${y+ch-p}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
      s += `<line x1="${x+cw-p}" y1="${y+p}" x2="${x+p}" y2="${y+ch-p}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  }

  // 5er-Trennlinie (zwischen Spalte 4 und 5) — in der um 1 mm breiteren Fünferlücke
  s += `<line x1="${fiverLineX}" y1="${gy}" x2="${fiverLineX}" y2="${H - gy}" stroke="#aaa" stroke-width="1.5"/>`;

  s += '</svg>';
  return s;
}

function zfSize(d) {
  // Migration: früher nur gross:boolean (und ganz früher small:boolean).
  if (d && d.groesse) return d.groesse;
  if (d && d.gross !== undefined) return d.gross ? 'gross' : 'klein';
  if (d && d.small !== undefined) return d.small ? 'klein' : 'gross';
  return 'mittel';
}

WIDGETS.push({
  meta: { type:"zwanzigerfeld", label:"Zwanzigerfeld", desc:"Anschauung ZR 20", icon:"⬛", category:"mathematik" },

  createData: id => {
    const cfg = { modus:'rechnen', op:'both', anzahl:4, loesung:false, bw:true, groesse:'mittel', align:'left', aufgabenNr:0, aufgabenText:''};
    return { id, type:"zwanzigerfeld", ...cfg, aufgaben: zfGen(cfg.anzahl, cfg.op) };
  },

  render: d => {
    const modus   = d.modus  || 'rechnen';
    const aufgaben = d.aufgaben || (modus==='zahl'
      ? Array.from({length:d.anzahl||4}, ()=>({a:zfRand(1,20),b:0,op:'+',result:0})).map(x=>({...x,result:x.a}))
      : zfGen(d.anzahl||4, d.op||'both'));
    const isActive = widgetIsActive(d);
    const showRes  = d.loesung || isActive;
    const blue     = isActive && !d.loesung;
    const bw       = d.bw    || false;
    const size     = zfSize(d);
    const small    = size === 'klein';
    const medium   = size === 'mittel';
    // Aufgaben-Schrift minimal kleiner als vorher (30/38).
    const fs       = small ? 28 : medium ? 32 : 35;
    const ff       = (d.font || "'Arial', sans-serif");

    const items = aufgaben.map(auf => {
      const { a, b, op: o, result } = auf;
      let label = '';
      if (modus !== 'ansicht') {
        const resEl = showRes
          ? `<span style="font-weight:700;color:${blue ? '#2563eb' : '#1a7f3c'};">${result}</span>`
          : `<span style="display:inline-block;border-bottom:2px solid #555;min-width:${small?44:56}px;height:${small?6:8}px;align-self:flex-end;margin-bottom:2px;"></span>`;
        label = modus === 'zahl'
          ? `<div style="font-family:${ff};font-size:${fs}px;display:flex;align-items:center;gap:6px;">${resEl}</div>`
          : `<div style="font-family:${ff};font-size:${fs}px;display:flex;align-items:center;gap:${small?4:7}px;">
              <span>${a}</span><span>${o}</span><span>${b}</span><span>=</span>${resEl}
             </div>`;
      }
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:${modus==='ansicht'?0:(small?10:14)}px;">
        ${zfGridSvg(auf, bw, size)}
        ${label}
      </div>`;
    });

    const { W: svgW } = zfGridMetrics(size);
    // Mittel so gewählt, dass typischerweise 3 Spalten auf „Voll“ passen.
    const colGap  = small ? 20 : medium ? 22 : 48; // verdoppelt (Abstand im engen Modus war zu klein)
    const rowGap  = small ? 36 : medium ? 40 : 48;
    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Feste Feldbreite svgW,
    // Inhalt zentriert.
    return atHtml(d) + flexDistribute(items, {
      gap: colGap, marginBottom: rowGap,
      itemSize: `width:${svgW}px;display:flex;justify-content:center;`, itemW: svgW, d
    });
  },

  renderProps: d => {
    const modus = d.modus  || 'rechnen';
    const op    = d.op      || 'both';
    const anz   = d.anzahl  || 4;
    const sl    = d.loesung || false;
    const bw    = d.bw      || false;
    const size  = zfSize(d);

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn("Rechnen",    modus==='rechnen', `zfSet(${d.id},'modus','rechnen')`)}
          ${toggleBtn("Zahl nennen",modus==='zahl',    `zfSet(${d.id},'modus','zahl')`)}
          ${toggleBtn("Ansicht",    modus==='ansicht', `zfSet(${d.id},'modus','ansicht')`)}
        </div></div>` +
      (modus==='rechnen' || modus==='ansicht' ? `<div class="prow"><label>Operationen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Nur +",   op==='+',    `zfSet(${d.id},'op','+')`)}
          ${toggleBtn("Nur −",   op==='-',    `zfSet(${d.id},'op','-')`)}
          ${toggleBtn("+ und −", op==='both', `zfSet(${d.id},'op','both')`)}
        </div></div>` : '') +
      pr("Anzahl", `<input type="number" min="1" max="24" value="${anz}" onchange="zfSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="zfRoll(${d.id})" style="margin-top:6px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Würfeln</button>` +
      propFold('zf-manuell', 'Manuelle Bearbeitung',
        pr(`Manuell bearbeiten${modus === 'zahl' ? ' (eine Zahl pro Zeile, z.B. 15)' : ' (eine Zeile pro Feld, z.B. 5 + 3 oder 12 - 4)'}`,
          `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;box-sizing:border-box;"
            onclick="event.stopPropagation()" onchange="zfManual(${d.id},this.value)">${esc(d.manualText != null ? d.manualText : zfTasksToText(d))}</textarea>`),
        false) +
      alignToggle(d.id, d.align) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein",  size==='klein',  `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn("Mittel", size==='mittel', `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn("Groß",   size==='gross',  `upd(${d.id},'groesse','gross')`)}
        </div></div>` +
      `<div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Farbe",  !bw, `upd(${d.id},'bw',false)`)}
          ${toggleBtn("S/W",    bw,  `upd(${d.id},'bw',true)`)}
        </div></div>` +
      (modus !== 'ansicht' ? `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` : '');
  },
});

function zfGenForWidget(w) {
  if ((w.modus||'rechnen') === 'zahl') {
    const n = w.anzahl||4;
    return Array.from({length:n}, () => { const a=zfRand(1,20); return {a,b:0,op:'+',result:a}; });
  }
  return zfGen(w.anzahl||4, w.op||'both');
}

function zfRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben = zfGenForWidget(w);
  w.manualText = zfTasksToText(w);
  render(); renderProps(id);
}

function zfSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  if (key === 'anzahl') zfResize(w);
  else {
    w.aufgaben = zfGenForWidget(w);
    w.manualText = zfTasksToText(w);
  }
  render(); renderProps(id);
}

function zfManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  zfApplyManual(w, text);
  render(); renderProps(id);
}
