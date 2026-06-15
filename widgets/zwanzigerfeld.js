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

function zfGridSvg(auf, bw=false, small=false) {
  const { a, b, op, result } = auf;
  const cw = small ? 14 : 22, ch = small ? 14 : 22, gx = small ? 2 : 3, gy = small ? 2 : 3;
  const W = 10 * (cw + gx) + gx;
  const H = 2 * (ch + gy) + gy;

  // Addition:    first a = color1, next b = color2
  // Subtraction: all a cells = same color, last b of them get an X (crossed out)
  const isPlus = op === '+';
  const c1 = isPlus ? a : result;   // solid colored cells
  const c2 = isPlus ? a + b : a;    // total colored (incl. crossed)

  let s = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;
  s += `<rect width="${W}" height="${H}" fill="#f0ede6" rx="5"/>`;

  for (let i = 0; i < 20; i++) {
    const row = Math.floor(i / 10), col = i % 10;
    const x = gx + col * (cw + gx), y = gy + row * (ch + gy);
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

  // 5er-Trennlinie (zwischen Spalte 4 und 5)
  const lx = gx + 5 * (cw + gx) - 1;
  s += `<line x1="${lx}" y1="${gy}" x2="${lx}" y2="${H - gy}" stroke="#aaa" stroke-width="1.5"/>`;

  s += '</svg>';
  return s;
}

WIDGETS.push({
  meta: { type:"zwanzigerfeld", label:"Zwanzigerfeld", desc:"Anschauung ZR 20", icon:"⬛", category:"mathematik" },

  createData: id => {
    const cfg = { modus:'rechnen', op:'both', anzahl:4, loesung:false, bw:true, small:true , aufgabenNr:0, aufgabenText:''};
    return { id, type:"zwanzigerfeld", ...cfg, aufgaben: zfGen(cfg.anzahl, cfg.op) };
  },

  render: d => {
    const modus   = d.modus  || 'rechnen';
    const aufgaben = d.aufgaben || (modus==='zahl'
      ? Array.from({length:d.anzahl||4}, ()=>({a:zfRand(1,20),b:0,op:'+',result:0})).map(x=>({...x,result:x.a}))
      : zfGen(d.anzahl||4, d.op||'both'));
    const isActive = d.id === selId || _solutionsMode;
    const showRes  = d.loesung || isActive;
    const blue     = isActive && !d.loesung;
    const bw       = d.bw    || false;
    const small    = d.small || false;
    const fs       = small ? 30 : 38;

    const items = aufgaben.map(auf => {
      const { a, b, op: o, result } = auf;
      const resEl = showRes
        ? `<span style="font-weight:700;color:${blue ? '#2563eb' : '#1a7f3c'};">${result}</span>`
        : `<span style="display:inline-block;border-bottom:2px solid #555;min-width:${small?44:56}px;height:${small?6:8}px;align-self:flex-end;margin-bottom:2px;"></span>`;
      const label = modus==='zahl'
        ? `<div style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;display:flex;align-items:center;gap:6px;">${resEl}</div>`
        : `<div style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;display:flex;align-items:center;gap:${small?4:7}px;">
            <span>${a}</span><span>${o}</span><span>${b}</span><span>=</span>${resEl}
           </div>`;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:${small?10:14}px;">
        ${zfGridSvg(auf, bw, small)}
        ${label}
      </div>`;
    });

    const fracMap = { 'full':1, '3/4':0.75, '1/2':0.5, '1/4':0.25 };
    const frac    = fracMap[d.widthFraction || (d.halfWidth ? '1/2' : 'full')] || 1;
    const avail   = Math.round(594 * frac);
    const svgW    = small ? (10*(14+2)+2) : (10*(22+3)+3);
    const colGap  = small ? 10 : 24;
    const rowGap  = small ? 36 : 48;
    const perRow  = Math.max(1, Math.floor((avail + colGap) / (svgW + colGap)));
    const gap     = perRow > 1 ? (avail - perRow * svgW) / (perRow - 1) : 0;

    const rows = [];
    for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));
    const filler = `<div style="width:${svgW}px;visibility:hidden;"></div>`;
    const rowHtml = rows.map((row, ri) => {
      const mb = ri < rows.length - 1 ? `margin-bottom:${rowGap}px;` : '';
      const filled = [...row.map(i => `<div style="display:flex;justify-content:center;width:${svgW}px;">${i}</div>`)];
      while (filled.length < perRow) filled.push(filler);
      return `<div style="display:flex;justify-content:space-between;${mb}">${filled.join('')}</div>`;
    }).join('');
    return atHtml(d) + rowHtml;
  },

  renderProps: d => {
    const modus = d.modus  || 'rechnen';
    const op    = d.op      || 'both';
    const anz   = d.anzahl  || 4;
    const sl    = d.loesung || false;
    const bw    = d.bw      || false;
    const small = d.small   || false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Rechnen",    modus==='rechnen', `zfSet(${d.id},'modus','rechnen')`)}
          ${toggleBtn("Zahl nennen",modus==='zahl',    `zfSet(${d.id},'modus','zahl')`)}
        </div></div>` +
      (modus==='rechnen' ? `<div class="prow"><label>Operationen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Nur +",   op==='+',    `zfSet(${d.id},'op','+')`)}
          ${toggleBtn("Nur −",   op==='-',    `zfSet(${d.id},'op','-')`)}
          ${toggleBtn("+ und −", op==='both', `zfSet(${d.id},'op','both')`)}
        </div></div>` : '') +
      pr("Anzahl", `<input type="number" min="1" max="18" value="${anz}" onchange="zfSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="zfRoll(${d.id})" style="margin-top:6px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Würfeln</button>` +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Groß",  !small, `upd(${d.id},'small',false)`)}
          ${toggleBtn("Klein",  small, `upd(${d.id},'small',true)`)}
        </div></div>` +
      `<div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Farbe",  !bw, `upd(${d.id},'bw',false)`)}
          ${toggleBtn("S/W",    bw,  `upd(${d.id},'bw',true)`)}
        </div></div>` +
      `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` +
    atProps(d.id, d);
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
  render(); renderProps(id);
}

function zfSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = zfGenForWidget(w);
  render(); renderProps(id);
}
