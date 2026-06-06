// Widget: Geld
// Scheine und Münzen als SVG, ähnlich Stellenwerttafel

// ── Denominationen (in Cent) ──────────────────────────────────────
const GELD_SCHEINE = [5000, 2000, 1000, 500];          // 50€, 20€, 10€, 5€
const GELD_EURO    = [200, 100];                        // 2€, 1€
const GELD_CENT    = [50, 20, 10, 5, 2, 1];            // 50ct … 1ct

function geldLabel(val) {
  return val >= 100 ? `${val/100}€` : `${val}ct`;
}

// Generiert eine zufällige Kombination von Scheinen/Münzen
// Zuerst Items wählen, dann Betrag aus Summe berechnen
function geldGenOne(maxEuroCents, mitCent) {
  const pool = [
    ...GELD_SCHEINE.filter(v => v <= maxEuroCents),
    ...GELD_EURO.filter(v => v <= maxEuroCents),
    ...(mitCent ? GELD_CENT : []),
  ];
  if (!pool.length) return {betrag: 0, items: []};

  const numItems = Math.floor(Math.random() * 4) + 2; // 2–5 Items
  const items = [];
  let total = 0;

  for (let i = 0; i < numItems; i++) {
    // Nur Items wählen die noch reinpassen
    const fits = pool.filter(v => total + v <= maxEuroCents);
    if (!fits.length) break;
    const pick = fits[Math.floor(Math.random() * fits.length)];
    items.push(pick);
    total += pick;
  }

  // Sicherstellen dass mindestens ein Item da ist
  if (!items.length) {
    const pick = pool[pool.length - 1]; // kleinstes Item
    items.push(pick);
    total = pick;
  }

  return {betrag: total, items};
}

// ── SVG-Zeichenfunktionen ─────────────────────────────────────────
function drawSchein(val, cx, cy) {
  const {w, h} = geldItemSize(val);
  const label = geldLabel(val);
  const fs = w < 40 ? 9 : w < 46 ? 10 : 11;
  return `<g transform="translate(${cx - w/2},${cy - h/2})">
    <rect x="0.75" y="0.75" width="${w-1.5}" height="${h-1.5}" rx="3"
      fill="#fdfdf8" stroke="#666" stroke-width="1.5"/>
    <rect x="3" y="3" width="${w-6}" height="${h-6}" rx="1.5"
      fill="none" stroke="#bbb" stroke-width="0.8"/>
    <text x="${w/2}" y="${h/2+4}" text-anchor="middle"
      font-size="${fs}" font-family="sans-serif" font-weight="700" fill="#222">${label}</text>
  </g>`;
}

function drawEuro(val, cx, cy) {
  const r = 13;
  const label = geldLabel(val);
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r-0.75}" fill="#fdfdf5" stroke="#888" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r-4}"    fill="none"    stroke="#ccc" stroke-width="0.8"/>
    <text x="${cx}" y="${cy+4}" text-anchor="middle"
      font-size="10" font-family="sans-serif" font-weight="700" fill="#222">${label}</text>
  </g>`;
}

function drawCent(val, cx, cy) {
  const r = val >= 10 ? 11 : 9;
  const label = geldLabel(val);
  const fs = label.length > 3 ? 7 : 9;
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r-0.75}" fill="#faf8f0" stroke="#aaa" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r-3.5}"  fill="none"    stroke="#ddd" stroke-width="0.7"/>
    <text x="${cx}" y="${cy+3}" text-anchor="middle"
      font-size="${fs}" font-family="sans-serif" font-weight="700" fill="#444">${label}</text>
  </g>`;
}

function geldItemSize(val) {
  if (val === 5000) return {w:54, h:29}; // 50€ – etwas kleiner
  if (val === 2000) return {w:52, h:27}; // 20€
  if (val === 1000) return {w:46, h:25}; // 10€
  if (val === 500)  return {w:40, h:22}; //  5€
  if (val >= 100)   return {w:24, h:24}; // Euro-Münze
  if (val >= 10)    return {w:20, h:20}; // große Cent
  return                   {w:17, h:17}; // kleine Cent
}

// ── Haupt-SVG für eine Aufgabe ────────────────────────────────────
function geldSvg(aufgabe, mitCent, modus, isActive) {
  const amountCents = aufgabe.betrag;
  const showGeld   = modus !== 'betrag';
  const blueGeld   = modus === 'betrag' && isActive;
  const showBetrag = modus === 'betrag';
  const blueBetrag = modus === 'geld' && isActive;

  const pad      = 2;
  const maxW     = 168;   // 20% breiter
  const contentH = 90;    // 25% höher
  const innerPad = 7;     // Abstand Inhalt ↔ gestrichelte Linie
  const gap      = 4;
  const ansH     = 26;
  const ansGap   = 6;
  const W        = maxW + pad * 2;
  const H        = contentH + ansGap + ansH + pad * 2;

  let svg = '';

  // Gestrichelter Rahmen immer zeigen
  svg += `<rect x="${pad+0.75}" y="${pad+0.75}" width="${maxW-1.5}" height="${contentH-1.5}"
    rx="4" fill="white" stroke="#bbb" stroke-width="1.5" stroke-dasharray="5,3"/>`;

  // Geldbereich
  if (showGeld || blueGeld) {
    // ── 2D-Streuung mit Kollisionsvermeidung ──
    const rawItems = aufgabe.items || [];
    const availW   = maxW - innerPad * 2;
    const availH   = contentH - innerPad * 2;

    const positions = [];
    for (const val of rawItems) {
      const {w, h} = geldItemSize(val);
      const minCX = innerPad + w / 2;
      const maxCX = innerPad + availW - w / 2;
      const minCY = innerPad + h / 2;
      const maxCY = innerPad + availH - h / 2;

      let bestCX = minCX + Math.random() * (maxCX - minCX);
      let bestCY = minCY + Math.random() * (maxCY - minCY);
      let bestScore = -Infinity;

      // 60 Versuche, Position mit größtem Mindestabstand zu bereits platzierten Items wählen
      for (let attempt = 0; attempt < 60; attempt++) {
        const cx = minCX + Math.random() * (maxCX - minCX);
        const cy = minCY + Math.random() * (maxCY - minCY);

        let minDist = Infinity;
        for (const p of positions) {
          const dx = cx - p.cx, dy = cy - p.cy;
          // Überlappungsabstand: Abstand zwischen Mittelpunkten minus halbe Summe der Größen
          const clearance = Math.sqrt(dx*dx + dy*dy) - (Math.max(w,h) + Math.max(p.w,p.h)) * 0.55;
          minDist = Math.min(minDist, clearance);
        }
        if (positions.length === 0) minDist = 999;

        if (minDist > bestScore) {
          bestScore = minDist;
          bestCX = cx;
          bestCY = cy;
        }
        if (minDist > 6) break; // gut genug
      }

      const rot = (Math.random() - 0.5) * 14; // ±7°
      positions.push({val, cx: bestCX, cy: bestCY, w, h, rot});
    }

    for (const {val, cx, cy, rot} of positions) {
      const ox = pad + cx, oy = pad + cy;
      let el = '';
      if (val >= 500) el = drawSchein(val, ox, oy);
      else if (val >= 100) el = drawEuro(val, ox, oy);
      else el = drawCent(val, ox, oy);
      // Leichte zufällige Drehung
      if (rot) el = `<g transform="rotate(${rot.toFixed(1)},${ox},${oy})">${el}</g>`;

      if (blueGeld) {
        el = el
          .replace(/stroke="#[689a][68a][68a]"/g, 'stroke="#1a56cc"')
          .replace(/fill="#fd[^"]+"/g,  'fill="#e8f0ff"')
          .replace(/fill="#fa[^"]+"/g,  'fill="#e8f0ff"')
          .replace(/fill="#222"/g, 'fill="#1a56cc"')
          .replace(/fill="#444"/g, 'fill="#1a56cc"');
      }
      svg += el;
    }
  }

  // Antwort-Kästchen (volle Breite, € innen rechts)
  const ay = pad + contentH + ansGap;
  svg += `<rect x="${pad+0.75}" y="${ay+0.75}" width="${maxW-1.5}" height="${ansH-1.5}"
    rx="3" fill="white" stroke="#777" stroke-width="1.5"/>`;
  // € rechts innen
  svg += `<text x="${pad + maxW - 8}" y="${ay + ansH*0.70}"
    text-anchor="end" font-size="13" font-family="sans-serif" font-weight="600" fill="#777">€</text>`;

  // Betrag als Lösung
  if (showBetrag || blueBetrag) {
    const euros = Math.floor(amountCents / 100);
    const cents = amountCents % 100;
    const label = mitCent
      ? `${euros},${String(cents).padStart(2,'0')}`
      : `${euros}`;
    const fillColor = blueBetrag ? '#1a56cc' : '#222';
    svg += `<text x="${pad + maxW/2 - 6}" y="${ay + ansH*0.70}"
      text-anchor="middle" font-size="15" font-family="'DidactGothic7',sans-serif"
      font-weight="700" fill="${fillColor}">${label}</text>`;
  }

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;">${svg}</svg>`;
}

// ── Aufgaben generieren ───────────────────────────────────────────
function geldGen(anzahl, maxEuroCents, mitCent) {
  return Array.from({length: anzahl}, () => geldGenOne(maxEuroCents, mitCent));
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"geld", label:"Geld", desc:"Scheine und Münzen zählen", icon:"€", category:"mathematik" },

  createData: id => {
    const cfg = { anzahl:4, maxEuro:10, mitCent:false, modus:'geld' };
    return { id, type:"geld", ...cfg,
      aufgaben: geldGen(cfg.anzahl, cfg.maxEuro*100, cfg.mitCent) };
  },

  render: d => {
    const mitCent  = d.mitCent  || false;
    const modus    = d.modus    || 'geld';
    const isActive = d.id === selId || _solutionsMode;
    const aufgaben = d.aufgaben || geldGen(d.anzahl||4, (d.maxEuro||10)*100, mitCent);
    const itemW    = 168 + 4;

    const items   = aufgaben.map(a => `<div>${geldSvg(a, mitCent, modus, isActive)}</div>`);
    const spacers = Array(4).fill(`<div style="height:0;width:${itemW}px;flex-shrink:0;flex-grow:0;"></div>`).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:16px 20px;justify-content:space-between;">
      ${items.join('')}${spacers}
    </div>`;
  },

  renderProps: d => {
    const anzahl  = d.anzahl  || 4;
    const maxEuro = d.maxEuro || 10;
    const mitCent = d.mitCent || false;
    const modus   = d.modus   || 'geld';

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Betrag ergänzen", modus==='geld',   `upd(${d.id},'modus','geld')`)}
          ${togBtn("Geld ergänzen",   modus==='betrag', `upd(${d.id},'modus','betrag')`)}
        </div>
      </div>
      <div class="prow"><label>Centmünzen</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Ohne", !mitCent, `geldSetCent(${d.id},false)`)}
          ${togBtn("Mit",   mitCent, `geldSetCent(${d.id},true)`)}
        </div>
      </div>
      ${pr('Anzahl Aufgaben', `<input type="number" min="1" max="12" value="${anzahl}"
        onclick="event.stopPropagation()"
        onchange="geldSetLayout(${d.id},'anzahl',+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      ${pr('Max. Betrag (€)', `<select onchange="geldSetLayout(${d.id},'maxEuro',+this.value)"
        style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;font-family:inherit;font-size:12px;">
        ${[1,2,5,10,20,50,100].map(n=>`<option value="${n}" ${maxEuro===n?'selected':''}>${n} €</option>`).join('')}
      </select>`)}
      <button onclick="event.stopPropagation();geldWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function geldSetLayout(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.aufgaben = geldGen(w.anzahl||4, (w.maxEuro||10)*100, w.mitCent||false);
  render(); renderProps(id);
}

function geldSetCent(id, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.mitCent = val;
  w.aufgaben = geldGen(w.anzahl||4, (w.maxEuro||10)*100, val);
  render(); renderProps(id);
}

function geldWuerfeln(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.aufgaben = geldGen(w.anzahl||4, (w.maxEuro||10)*100, w.mitCent||false);
  render(); renderProps(id);
}
