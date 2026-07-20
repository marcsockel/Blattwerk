// Widget: Stellenwerttafel

function svwCols(zahlenraum) {
  const cols = [];
  if (zahlenraum > 1000000) cols.push({label:'M',  place:1000000});
  if (zahlenraum > 100000)  cols.push({label:'HT', place:100000});
  if (zahlenraum > 10000)   cols.push({label:'ZT', place:10000});
  if (zahlenraum > 1000)    cols.push({label:'T',  place:1000});
  if (zahlenraum > 100)     cols.push({label:'H',  place:100});
  if (zahlenraum > 10)      cols.push({label:'Z',  place:10});
  cols.push({label:'E', place:1});
  return cols;
}

// modus: "zahl" = Plättchen gegeben, Zahl eintragen
//        "plaettchen" = Zahl gegeben, Plättchen eintragen
// isActive: Lösung blau anzeigen
// Deterministisch "zufällig" – gleicher Wert → gleiche Positionen
function svwPseudoRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function svwSvg(number, zahlenraum, modus, isActive, ungeordnet=false, gross=false) {
  const cols    = svwCols(zahlenraum);
  const digits  = cols.map(c => Math.floor(number / c.place) % 10);
  const sc      = gross ? 1.5 : 1;

  const colW    = Math.round(42 * sc);
  const dotR    = Math.round(4 * sc);
  const dotGap  = Math.round(12 * sc);
  const headerH = Math.round(26 * sc);
  const dotsH   = 9 * dotGap + Math.round(10 * sc);
  const ansH    = gross ? 56 : 42;
  const gap     = Math.round(6 * sc);
  const pad     = 1;
  const tableW  = cols.length * colW;
  const tableH  = headerH + dotsH;
  const W       = tableW + pad * 2;
  const H       = tableH + gap + ansH + pad * 2;
  const p       = pad;

  const showDots   = modus !== 'plaettchen';       // normale Plättchen schwarz
  const blueDots   = modus === 'plaettchen' && isActive; // Lösung blau
  const showNumber = modus === 'plaettchen';        // Zahl im Kästchen
  const blueNumber = modus === 'zahl' && isActive;  // Zahl als Lösung blau

  let svg = '';

  // Header-Hintergrund
  svg += `<rect x="${p}" y="${p}" width="${tableW}" height="${headerH}" fill="#f0f0f0"/>`;

  // Spalten-Beschriftung
  cols.forEach((col, i) => {
    svg += `<text x="${p + i*colW + colW/2}" y="${p + headerH - Math.round(8*sc)}"
      text-anchor="middle" font-size="${Math.round(12*sc)}" font-family="'DidactGothic7',sans-serif"
      font-weight="700" fill="#333">${col.label}</text>`;
  });

  // Plättchen
  const dotAreaTop = p + headerH + dotR + 4;
  const dotAreaBot = p + headerH + dotsH - dotR - 4;
  digits.forEach((d, ci) => {
    if (!ungeordnet) {
      for (let j = 0; j < d; j++) {
        const cx = p + ci*colW + colW/2;
        const cy = p + headerH + 8 + j*dotGap + dotR;
        if (showDots)  svg += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#222"/>`;
        else if (blueDots) svg += `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#1a56cc"/>`;
      }
    } else {
      // Verstreute Punkte: x und y zufällig, keine Berührung
      const minX = p + ci*colW + dotR + 3;
      const maxX = p + (ci+1)*colW - dotR - 3;
      const minY = dotAreaTop;
      const maxY = dotAreaBot;
      const placed = [];
      for (let j = 0; j < d; j++) {
        let cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
        for (let att = 0; att < 120; att++) {
          const s = number * 10000 + ci * 1000 + j * 100 + att;
          const tx = minX + svwPseudoRand(s * 7)  * (maxX - minX);
          const ty = minY + svwPseudoRand(s * 13) * (maxY - minY);
          if (placed.every(([px,py]) => Math.hypot(tx-px, ty-py) >= dotR*2+2)) {
            cx = tx; cy = ty; break;
          }
        }
        placed.push([cx, cy]);
        if (showDots)  svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR}" fill="#222"/>`;
        else if (blueDots) svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR}" fill="#1a56cc"/>`;
      }
    }
  });

  // Tabellenrahmen + Spaltenlinien
  svg += `<rect x="${p+0.75}" y="${p+0.75}" width="${tableW-1.5}" height="${tableH-1.5}"
    fill="none" stroke="#888" stroke-width="1.5" rx="2"/>`;
  svg += `<line x1="${p}" y1="${p+headerH}" x2="${p+tableW}" y2="${p+headerH}" stroke="#888" stroke-width="1"/>`;
  for (let i = 1; i < cols.length; i++) {
    svg += `<line x1="${p+i*colW}" y1="${p}" x2="${p+i*colW}" y2="${p+tableH}" stroke="#888" stroke-width="1"/>`;
  }

  // Antwort-Kästchen
  const ay = p + tableH + gap;
  svg += `<rect x="${p+0.75}" y="${ay+0.75}" width="${tableW-1.5}" height="${ansH-1.5}"
    fill="white" stroke="#777" stroke-width="1.5" rx="3"/>`;

  // Zahl im Kästchen
  if (showNumber || blueNumber) {
    const fill = blueNumber ? '#1a56cc' : '#222';
    const fsAns = gross ? 24 : 20;
    svg += `<text x="${p + tableW/2}" y="${ay + ansH*0.68}"
      text-anchor="middle" font-size="${fsAns}" font-family="'DidactGothic7',sans-serif"
      font-weight="700" fill="${fill}">${number}</text>`;
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;">${svg}</svg>`;
}

function svwGen(anzahl, zahlenraum) {
  const max = zahlenraum - 1;
  const min = Math.max(1, Math.floor(zahlenraum / 10));
  return Array.from({length: anzahl}, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"stellenwert", label:"Stellenwerttafel", desc:"Zahlen aus Punkten ablesen", icon:"⠿", category:"mathematik", itemsLayout: true },

  createData: id => {
    const cfg = { anzahl:4, zahlenraum:100, modus:'zahl', ungeordnet:false , aufgabenNr:0, aufgabenText:''};
    return { id, type:"stellenwert", ...cfg, zahlen: svwGen(cfg.anzahl, cfg.zahlenraum) };
  },

  render: d => {
    const zahlenraum = d.zahlenraum || 100;
    const modus      = d.modus || 'zahl';
    const isActive   = d.id === selId || _solutionsMode;
    const zahlen     = d.zahlen || svwGen(d.anzahl||4, zahlenraum);

    const ungeordnet = d.ungeordnet || false;
    const gross      = d.gross || false;
    const sc         = gross ? 1.5 : 1;
    const colW       = Math.round(42 * sc);
    const itemW      = svwCols(zahlenraum).length * colW + 2;
    return atHtml(d) + flexDistribute(
      zahlen.map(n => svwSvg(n, zahlenraum, modus, isActive, ungeordnet, gross)),
      { itemSize: `width:${itemW}px;`, itemW, d }
    );
  },

  renderProps: d => {
    const anzahl     = d.anzahl     || 4;
    const zahlenraum = d.zahlenraum || 100;
    const modus      = d.modus      || 'zahl';
    const ungeordnet = d.ungeordnet || false;
    const gross      = d.gross      || false;

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Zahl ergänzen",      modus==='zahl',       `upd(${d.id},'modus','zahl')`)}
          ${togBtn("Plättchen ergänzen", modus==='plaettchen', `upd(${d.id},'modus','plaettchen')`)}
        </div>
      </div>
      ${pr('Anzahl Aufgaben', `<input type="number" min="1" max="16" value="${anzahl}"
        onclick="event.stopPropagation()"
        onchange="svwSetLayout(${d.id},'anzahl',+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      ${pr('Zahlenraum', `<select onchange="svwSetLayout(${d.id},'zahlenraum',+this.value)"
        style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;
               font-family:inherit;font-size:12px;">
        ${[
          [10,'10'], [100,'100'], [1000,'1.000'], [10000,'10.000 (ZT)'],
          [100000,'100.000 (HT)'], [1000000,'1.000.000 (M)']
        ].map(([n,l])=>`<option value="${n}" ${zahlenraum===n?'selected':''}>${l}</option>`).join('')}
      </select>`)}
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Klein", !gross, `upd(${d.id},'gross',false)`)}
          ${togBtn("Groß",   gross, `upd(${d.id},'gross',true)`)}
        </div>
      </div>
      <button onclick="event.stopPropagation();svwWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>
      <div class="prow" style="margin-top:4px;"><label>Punkte</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Geordnet",    !ungeordnet, `upd(${d.id},'ungeordnet',false)`)}
          ${togBtn("Ungeordnet",   ungeordnet, `upd(${d.id},'ungeordnet',true)`)}
        </div></div>` ;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function svwSetLayout(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.zahlen = svwGen(w.anzahl||4, w.zahlenraum||100);
  render(); renderProps(id);
}

function svwWuerfeln(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.zahlen = svwGen(w.anzahl||4, w.zahlenraum||100);
  render(); renderProps(id);
}
