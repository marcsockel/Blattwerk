// Widget: Geld
// Scheine und Münzen als SVG, ähnlich Stellenwerttafel

// ── Denominationen (in Cent) ──────────────────────────────────────
const GELD_SCHEINE = [5000, 2000, 1000, 500];          // 50€, 20€, 10€, 5€
const GELD_EURO    = [200, 100];                        // 2€, 1€
const GELD_CENT    = [50, 20, 10, 5, 2, 1];            // 50ct … 1ct

// Hintergrundfarben im Farbmodus (Wert in Cent → RGB, vom Nutzer vorgegeben).
// Euromünzen (100/200) folgen später. 10000 = 100€-Schein (kommt derzeit nicht vor).
const GELD_FARBEN = {
  10000: 'rgb(207,226,207)', // 100€
  5000:  'rgb(240,213,186)', // 50€
  2000:  'rgb(188,216,234)', // 20€
  1000:  'rgb(242,152,141)', // 10€
  500:   'rgb(183,198,183)', // 5€
  50: 'rgb(237,212,153)', 20: 'rgb(237,212,153)', 10: 'rgb(237,212,153)', // Gold-Cents
  5:  'rgb(235,159,119)', 2:  'rgb(235,159,119)', 1:  'rgb(235,159,119)',  // Kupfer-Cents
  // Euromünzen sind zweifarbig: { outer = Ring/Fläche außen, inner = Scheibe innen }
  200: { outer: 'rgb(202,202,202)', inner: 'rgb(238,225,183)' }, // 2€: außen silber, innen gold
  100: { outer: 'rgb(211,180,121)', inner: 'rgb(225,225,225)' }, // 1€: außen gold, innen silber
};

function geldLabel(val) {
  // Nur die Zahl, ohne Einheit (kein € / ct auf Münzen und Scheinen)
  return val >= 100 ? `${val/100}` : `${val}`;
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

  // Mindestens 2 Items generieren – bei Bedarf wiederholen
  let items = [], total = 0, tries = 0;
  while (items.length < 2 && tries++ < 30) {
    items = []; total = 0;
    const numItems = Math.floor(Math.random() * 4) + 2; // 2–5 Items
    for (let i = 0; i < numItems; i++) {
      const fits = pool.filter(v => total + v <= maxEuroCents);
      if (!fits.length) break;
      const pick = fits[Math.floor(Math.random() * fits.length)];
      items.push(pick);
      total += pick;
    }
  }

  // Fallback falls kein Zahlenraum für 2 Items reicht
  if (!items.length) {
    const pick = pool[pool.length - 1];
    items = [pick]; total = pick;
  }

  return {betrag: total, items, posSeed: Math.random()};
}

// Deterministischer Pseudo-Zufall basierend auf Seed (wie svwPseudoRand)
function geldPseudoRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── SVG-Zeichenfunktionen ─────────────────────────────────────────
function drawSchein(val, cx, cy, sc=1, fill) {
  const {w, h} = geldItemSize(val, sc);
  const label = geldLabel(val);
  const fs = Math.round((w < 40 ? 9 : w < 46 ? 10 : 11) * sc);
  // Eckige Ecken, kein innerer Rahmen. Weißer Streifen links (~1/4 der Breite, innerhalb
  // des Rands). Trennlinie rechts, damit er auch in S/W (off-white) sichtbar ist.
  // Zahl mittig im gefärbten Bereich (rechts vom Streifen), nicht in der Gesamtmitte.
  const sw = Math.round(w * 0.25);
  const stripeX = 1.5, R = stripeX + sw;
  const labelX = (R + (w - 1.5)) / 2;
  return `<g transform="translate(${cx - w/2},${cy - h/2})">
    <rect x="0.75" y="0.75" width="${w-1.5}" height="${h-1.5}"
      fill="${fill || '#fdfdf8'}" stroke="#666" stroke-width="1.5"/>
    <rect x="${stripeX}" y="1.5" width="${sw}" height="${h-3}" fill="#fff"/>
    <line x1="${R}" y1="1.5" x2="${R}" y2="${h-1.5}" stroke="#bbb" stroke-width="0.8"/>
    <text x="${labelX}" y="${h/2+Math.round(4*sc)}" text-anchor="middle"
      font-size="${fs}" font-family="sans-serif" font-weight="700" fill="#222">${label}</text>
  </g>`;
}

function drawEuro(val, cx, cy, sc=1, fill) {
  const r = Math.round(13 * sc);
  const label = geldLabel(val);
  const fs = Math.round(10 * sc);
  // fill (Farbmodus) = { outer, inner }; ohne Farbe: off-white außen, innen nur Kontur
  const outerFill = fill ? fill.outer : '#fdfdf5';
  const innerFill = fill ? fill.inner : 'none';
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r-0.75}" fill="${outerFill}" stroke="#888" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${r-Math.round(4*sc)}" fill="${innerFill}" stroke="#888" stroke-width="1"/>
    <text x="${cx}" y="${cy+Math.round(4*sc)}" text-anchor="middle"
      font-size="${fs}" font-family="sans-serif" font-weight="700" fill="#222">${label}</text>
  </g>`;
}

function drawCent(val, cx, cy, sc=1, fill) {
  const r = Math.round((val >= 10 ? 11 : 9) * sc);
  const label = geldLabel(val);
  const fs = Math.round((label.length > 3 ? 7 : 9) * sc);
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r-0.75}" fill="${fill || '#faf8f0'}" stroke="#aaa" stroke-width="1.5"/>
    <text x="${cx}" y="${cy+Math.round(3*sc)}" text-anchor="middle"
      font-size="${fs}" font-family="sans-serif" font-weight="700" fill="#444">${label}</text>
  </g>`;
}

function geldItemSize(val, sc=1) {
  let w, h;
  if      (val === 5000) { w=54; h=29; }
  else if (val === 2000) { w=52; h=27; }
  else if (val === 1000) { w=46; h=25; }
  else if (val === 500)  { w=40; h=22; }
  else if (val >= 100)   { w=24; h=24; }
  else if (val >= 10)    { w=20; h=20; }
  else                   { w=17; h=17; }
  return {w: Math.round(w*sc), h: Math.round(h*sc)};
}

// ── Haupt-SVG für eine Aufgabe ────────────────────────────────────
function geldSvg(aufgabe, mitCent, modus, isActive, gross=false, farbe=false) {
  const amountCents = aufgabe.betrag;
  const showGeld   = modus !== 'betrag';
  const blueGeld   = modus === 'betrag' && isActive;
  const showBetrag = modus === 'betrag';
  const blueBetrag = modus === 'geld' && isActive;

  const sc       = gross ? 1.5 : 1;
  const pad      = 2;
  const maxW     = gross ? 270 : 168;
  const contentH = gross ? 132 : 90;   // gross: 26px an ansH abgetreten
  const innerPad = gross ? 18 : 7;     // Abstand Inhalt ↔ gestrichelte Linie
  const gap      = 4;
  const ansH     = gross ? 52 : 39;     // gross: 2×, klein: 1.5×
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

    const seed = aufgabe.posSeed || 0.5;
    const positions = [];
    rawItems.forEach((val, ji) => {
      const {w, h} = geldItemSize(val, sc);
      const minCX = innerPad + w / 2;
      const maxCX = innerPad + availW - w / 2;
      const minCY = innerPad + h / 2;
      const maxCY = innerPad + availH - h / 2;

      let bestCX = minCX + geldPseudoRand(seed * 7 + ji * 100) * Math.max(0, maxCX - minCX);
      let bestCY = minCY + geldPseudoRand(seed * 13 + ji * 100) * Math.max(0, maxCY - minCY);
      let bestScore = -Infinity;

      // 60 Versuche, Position mit größtem Mindestabstand zu bereits platzierten Items wählen
      for (let attempt = 0; attempt < 60; attempt++) {
        const cx = minCX + geldPseudoRand(seed * 7  + ji * 100 + attempt * 3 + 1) * Math.max(0, maxCX - minCX);
        const cy = minCY + geldPseudoRand(seed * 13 + ji * 100 + attempt * 3 + 2) * Math.max(0, maxCY - minCY);

        let minDist = Infinity;
        for (const p of positions) {
          const dx = cx - p.cx, dy = cy - p.cy;
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

      const rot = (geldPseudoRand(seed * 999 + ji * 77) - 0.5) * 14; // ±7°, deterministisch
      positions.push({val, cx: bestCX, cy: bestCY, w, h, rot});
    });

    for (const {val, cx, cy, rot} of positions) {
      const ox = pad + cx, oy = pad + cy;
      const fill = farbe ? (GELD_FARBEN[val] || null) : null;
      let el = '';
      if (val >= 500) el = drawSchein(val, ox, oy, sc, fill);
      else if (val >= 100) el = drawEuro(val, ox, oy, sc, fill);
      else el = drawCent(val, ox, oy, sc, fill);
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
  const fsEuro = gross ? 20 : 18;
  svg += `<text x="${pad + maxW - Math.round(8*sc)}" y="${ay + ansH*0.70}"
    text-anchor="end" font-size="${fsEuro}" font-family="sans-serif" font-weight="600" fill="#777">€</text>`;

  // Betrag als Lösung
  if (showBetrag || blueBetrag) {
    const euros = Math.floor(amountCents / 100);
    const cents = amountCents % 100;
    const label = mitCent
      ? `${euros},${String(cents).padStart(2,'0')}`
      : `${euros}`;
    const fillColor = blueBetrag ? '#1a56cc' : '#222';
    const fsBetrag = gross ? 23 : 20;
    svg += `<text x="${pad + maxW/2 - Math.round(6*sc)}" y="${ay + ansH*0.70}"
      text-anchor="middle" font-size="${fsBetrag}" font-family="'DidactGothic7',sans-serif"
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
    const cfg = { anzahl:4, maxEuro:10, mitCent:false, modus:'geld', farbe:false , aufgabenNr:0, aufgabenText:''};
    return { id, type:"geld", ...cfg,
      aufgaben: geldGen(cfg.anzahl, cfg.maxEuro*100, cfg.mitCent) };
  },

  render: d => {
    const mitCent  = d.mitCent  || false;
    const modus    = d.modus    || 'geld';
    const gross    = d.gross    || false;
    const isActive = d.id === selId || _solutionsMode;
    const aufgaben = d.aufgaben || geldGen(d.anzahl||4, (d.maxEuro||10)*100, mitCent);
    const itemW    = (gross ? 270 : 168) + 4;

    const fracMap = { 'full':1, '3/4':0.75, '1/2':0.5, '1/4':0.25 };
    const frac    = fracMap[d.widthFraction || (d.halfWidth ? '1/2' : 'full')] || 1;
    const avail   = Math.round(640 * frac);
    const farbe    = d.farbe || false;
    const items   = aufgaben.map(a => `<div>${geldSvg(a, mitCent, modus, isActive, gross, farbe)}</div>`);
    const _perRow = Math.max(1, Math.floor((avail + 20) / (itemW + 20)));
    return atHtml(d) + `<div style="display:grid;grid-template-columns:repeat(${_perRow},${itemW}px);gap:16px 20px;justify-content:space-between;">${items.join("")}</div>`;
  },

  renderProps: d => {
    const anzahl  = d.anzahl  || 4;
    const maxEuro = d.maxEuro || 10;
    const mitCent = d.mitCent || false;
    const modus   = d.modus   || 'geld';
    const gross   = d.gross   || false;
    const farbe   = d.farbe   || false;

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
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Klein",  !gross, `upd(${d.id},'gross',false)`)}
          ${togBtn("Groß",    gross, `upd(${d.id},'gross',true)`)}
        </div>
      </div>
      <button onclick="event.stopPropagation();geldWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>
      <div class="prow" style="margin-top:8px;"><label>Darstellung</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("S/W",   !farbe, `upd(${d.id},'farbe',false)`)}
          ${togBtn("Farbe",  farbe, `upd(${d.id},'farbe',true)`)}
        </div>
      </div>` ;
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
