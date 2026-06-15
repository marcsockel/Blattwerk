// Widget: Zwanzigerrahmen

function zrRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function zrGen(anzahl, zr) {
  return Array.from({ length: anzahl }, () => zrRand(1, zr));
}

function zrSvg(n, bw=false, small=false) {
  const R = small ? 5 : 9;
  const sp = 2*R+1;
  const capW = small ? 10 : 20;
  const W = small ? 174 : 258;
  const H = small ? 36 : 60;
  const r1y = small ? 12 : 21;
  const r2y = small ? 26 : 43;
  const innerL = capW, innerR = W - capW;

  const c1 = bw ? '#555' : '#d94040'; // Reihe 1: erste 5
  const c2 = bw ? '#aaa' : '#3a7bd5'; // Reihe 1: zweite 5
  // Reihe 2 ist umgekehrt: erste 5 = c2, zweite 5 = c1
  const woodFill   = bw ? '#888' : '#c8883a';
  const woodStroke = bw ? '#555' : '#9a6220';
  const wireColor  = bw ? '#999' : '#6a9aaa';

  let s = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">`;

  // Holz-Seitenblöcke
  s += `<rect x="0" y="0" width="${capW}" height="${H}" rx="4" fill="${woodFill}" stroke="${woodStroke}" stroke-width="1"/>`;
  s += `<rect x="${W-capW}" y="0" width="${capW}" height="${H}" rx="4" fill="${woodFill}" stroke="${woodStroke}" stroke-width="1"/>`;

  // Drähte
  s += `<line x1="${innerL}" y1="${r1y}" x2="${innerR}" y2="${r1y}" stroke="${wireColor}" stroke-width="1.5"/>`;
  s += `<line x1="${innerL}" y1="${r2y}" x2="${innerR}" y2="${r2y}" stroke="${wireColor}" stroke-width="1.5"/>`;

  const n1 = Math.min(n, 10), n2 = Math.max(0, n - 10);

  // row=1: erst c1 dann c2; row=2: erst c2 dann c1
  const drawRow = (count, ry, row) => {
    const [first, second] = row === 1 ? [c1, c2] : [c2, c1];
    for (let i = 0; i < count; i++) {
      const cx = innerL + R + 1 + i * sp;
      const col = i < 5 ? first : second;
      s += `<circle cx="${cx}" cy="${ry}" r="${R}" fill="${col}"/>`;
    }
    for (let j = 0; j < 10 - count; j++) {
      const cx = innerR - R - 1 - j * sp;
      const pos = 10 - j;
      const col = pos <= 5 ? first : second;
      s += `<circle cx="${cx}" cy="${ry}" r="${R}" fill="${col}"/>`;
    }
  };

  drawRow(n1, r1y, 1);
  drawRow(n2, r2y, 2);

  s += '</svg>';
  if (small) s = s.replace(
    `width="${W}" height="${H}"`,
    `width="${Math.round(W*0.9)}" height="${Math.round(H*0.9)}" viewBox="0 0 ${W} ${H}"`
  );
  return s;
}

WIDGETS.push({
  meta: { type:"zwanzigerrahmen", label:"Zwanzigerrahmen", desc:"Zahl ablesen ZR 20", icon:"⬭", category:"mathematik" },

  createData: id => ({
    id, type:"zwanzigerrahmen", anzahl:6, zahlenraum:20, loesung:false, bw:false, small:false,
    zahlen: zrGen(6, 20), aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const zahlen = d.zahlen || zrGen(d.anzahl||6, d.zahlenraum||20);
    const isActive = d.id === selId || _solutionsMode;
    const showRes  = d.loesung || isActive;
    const blue     = isActive && !d.loesung;
    const bw    = d.bw    || false;
    const small = d.small || false;
    const fs    = small ? 15 : 20;

    const items = zahlen.map(n => {
      const resEl = showRes
        ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;font-weight:700;color:${blue?'#2563eb':'#1a7f3c'};">${n}</span>`
        : `<span style="display:inline-block;border-bottom:2px solid #555;min-width:${small?48:64}px;height:${small?17:22}px;"></span>`;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:${small?10:14}px;">
        ${zrSvg(n, bw, small)}
        <div style="display:flex;align-items:center;justify-content:center;min-height:${small?22:28}px;">${resEl}</div>
      </div>`;
    });

    const fracMap = { 'full':1, '3/4':0.75, '1/2':0.5, '1/4':0.25 };
    const frac    = fracMap[d.widthFraction || (d.halfWidth ? '1/2' : 'full')] || 1;
    const avail   = Math.round(594 * frac);
    const svgW    = small ? Math.round(174 * 0.9) : 258;
    const colGap  = 10;
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
    const anz   = d.anzahl      || 6;
    const zr    = d.zahlenraum  || 20;
    const sl    = d.loesung     || false;
    const bw    = d.bw          || false;
    const small = d.small       || false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return pr("Zahlenraum",
        `<select onchange="zrSet(${d.id},'zahlenraum',+this.value)">
          <option value="10"  ${zr===10 ?"selected":""}>1–10</option>
          <option value="20"  ${zr===20 ?"selected":""}>1–20</option>
        </select>`) +
      pr("Anzahl", `<input type="number" min="1" max="18" value="${anz}" onchange="zrSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="zrRoll(${d.id})" style="margin-top:6px;margin-bottom:8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Würfeln</button>` +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Groß",  !small, `upd(${d.id},'small',false)`)}
          ${toggleBtn("Klein",  small, `upd(${d.id},'small',true)`)}
        </div></div>` +
      `<div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Farbe", !bw, `upd(${d.id},'bw',false)`)}
          ${toggleBtn("S/W",    bw, `upd(${d.id},'bw',true)`)}
        </div></div>` +
      `<div class="prow"><label>Lösung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'loesung',false)`)}
          ${toggleBtn("Einblenden",  sl, `upd(${d.id},'loesung',true)`)}
        </div></div>` +
    atProps(d.id, d);
  },
});

function zrRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.zahlen = zrGen(w.anzahl||6, w.zahlenraum||20);
  render(); renderProps(id);
}

function zrSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.zahlen = zrGen(w.anzahl||6, w.zahlenraum||20);
  render(); renderProps(id);
}
