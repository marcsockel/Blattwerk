// Widget: Zahlenhaus

function zhGen(count, summands, stockwerke, zahlenraum, leerfeld) {
  const rand = (mn, mx) => Math.floor(Math.random() * (mx - mn + 1)) + mn;

  const makeFelder = (dach, s) => {
    if (s === 2) {
      const a = rand(1, dach - 1);
      return [a, dach - a];
    } else {
      const a = rand(1, dach - 2);
      const b = rand(1, dach - a - 1);
      return [a, b, dach - a - b];
    }
  };

  return Array.from({length: count}, () => {
    const dach = rand(summands, zahlenraum);
    const floors = Array.from({length: stockwerke}, () => {
      const felder = makeFelder(dach, summands);
      // leers[0..n-1] = which field in this floor is hidden
      const leers = Array(summands).fill(false);
      if (leerfeld === "links")    { leers[0] = true; }
      else if (leerfeld === "rechts")  { leers[summands - 1] = true; }
      else if (leerfeld === "gemischt"){ leers[rand(0, summands - 1)] = true; }
      return { felder, leers };
    });
    const dachLeer = leerfeld === "dach";
    return { dach, dachLeer, floors };
  });
}

// Größen: klein = ursprüngliche Maße, mittel = Standard (seit 2026-11), groß.
// bw2/bw3 = Feldbreite bei 2/3 Feldern, bh = Feldhöhe, fs = Ziffern im Feld,
// rh = Dachhöhe, nfs/nh = Dachzahl (Schrift/Kasten), cw = Breite je Ziffer im Kasten.
const ZH_SIZES = {
  klein:  { bw2: 48, bw3: 38, bh: 34, fs: 15, rh: 44, nfs: 15, nh: 19, cw: 11 },
  mittel: { bw2: 60, bw3: 48, bh: 44, fs: 19, rh: 52, nfs: 18, nh: 23, cw: 13 },
  gross:  { bw2: 74, bw3: 58, bh: 54, fs: 23, rh: 62, nfs: 22, nh: 28, cw: 15 },
};
// Ohne Angabe (ältere Blätter) = klein, also wie bisher.
function zhSize(groesse) { return ZH_SIZES[groesse] || ZH_SIZES.klein; }
function zhFeldW(summands, groesse) { const z = zhSize(groesse); return summands === 3 ? z.bw3 : z.bw2; }

function zhSvg(house, summands, isActive=false, farbig=false, groesse) {
  const { dach, dachLeer, floors } = house;
  const Z  = zhSize(groesse);
  const bw = zhFeldW(summands, groesse);
  const bh = Z.bh;
  const rh = Z.rh;
  const W  = bw * summands + 4;
  const stockwerke = floors.length;
  const H  = rh + bh * stockwerke + 2;
  const cx = W / 2;

  // Dach + Schornstein als EINE Form (eine geschlossene Umrisslinie).
  const rTop  = 10;                          // flacher Dachfirst (Trapez-Oberkante)
  const inset = Math.round(W * 0.30);        // Einzug der Oberkante
  const chW   = Math.max(9, Math.round(W * 0.11));
  const chX   = Math.round(W * 0.72);        // Schornstein auf der rechten Dachseite
  const sx0 = W - inset, sy0 = rTop, sx1 = W - 2, sy1 = rh;     // rechte Dachschräge
  const slopeY = x => (sy0 + (sy1 - sy0) * (x - sx0) / (sx1 - sx0)).toFixed(1);
  const roofFill = farbig ? '#b5443a' : '#f5f3ef';             // Kaminrot / hell
  const pts = `2,${rh} ${inset},${rTop} ${W-inset},${rTop} ${chX},${slopeY(chX)} ${chX},2 ${chX+chW},2 ${chX+chW},${slopeY(chX+chW)} ${W-2},${rh}`;
  const roof = `<polygon points="${pts}" fill="${roofFill}" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/>`;

  // Dachzahl in einem weißen Rechteck (gut lesbar auch auf farbigem Dach)
  const numCY  = rh - Math.round(Z.nh * 0.85);
  const digits = String(dach).length;
  const rectH  = Z.nh, rectW = Math.max(Math.round(Z.nh * 1.26), digits * Z.cw + 8);
  const numRect = `<rect x="${(cx - rectW/2).toFixed(1)}" y="${(numCY - rectH/2).toFixed(1)}" width="${rectW}" height="${rectH}" rx="2" fill="#fff" stroke="#888" stroke-width="1"/>`;
  const showNum = !dachLeer || isActive;
  const numText = showNum
    ? `<text x="${cx}" y="${(numCY + Z.nfs * 0.35).toFixed(1)}" text-anchor="middle" font-family="'DidactGothic7',sans-serif" font-size="${Z.nfs}" font-weight="700" fill="${dachLeer ? '#2563eb' : '#222'}">${dach}</text>`
    : '';
  const dachEl = numRect + numText;

  let floorsHtml = "";
  floors.forEach((floor, fi) => {
    const by = rh + fi * bh;
    for (let i = 0; i < summands; i++) {
      const bx = 2 + i * bw;
      floorsHtml += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}"
        fill="white" stroke="#555" stroke-width="1.5"/>`;
      if (!floor.leers[i]) {
        floorsHtml += `<text x="${bx + bw/2}" y="${(by + bh/2 + Z.fs * 0.35).toFixed(1)}" text-anchor="middle"
          font-family="'DidactGothic7',sans-serif" font-size="${Z.fs}" font-weight="700" fill="#222">${floor.felder[i]}</text>`;
      } else if (isActive) {
        floorsHtml += `<text x="${bx + bw/2}" y="${(by + bh/2 + Z.fs * 0.35).toFixed(1)}" text-anchor="middle"
          font-family="'DidactGothic7',sans-serif" font-size="${Z.fs}" font-weight="700" fill="#2563eb">${floor.felder[i]}</text>`;
      }
    }
  });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    ${roof}${dachEl}${floorsHtml}
  </svg>`;
}

WIDGETS.push({
  meta: { type:"zahlenhaus", group:"rechenformate", label:"Zahlenhaus", desc:"Dach & Stockwerke", icon:"🏠", category:"mathematik", itemsLayout: true },

  createData: id => {
    const cfg = { summands:2, zahlenraum:10, haeuser:4, stockwerke:4, leerfeld:"links", farbe:"sw", groesse:"mittel", aufgabenNr:0, aufgabenText:''};
    return { id, type:"zahlenhaus", ...cfg, houses: zhGen(cfg.haeuser, cfg.summands, cfg.stockwerke, cfg.zahlenraum, cfg.leerfeld) };
  },

  render: d => {
    const s      = d.summands  || 2;
    const st     = d.stockwerke || 4;
    const houses = d.houses || zhGen(d.haeuser||3, s, st, d.zahlenraum||10, d.leerfeld||"links");
    const active = d.id === selId || _solutionsMode;
    const farbig = d.farbe === 'farbig';
    const svgs   = houses.map(h => zhSvg(h, s, active, farbig, d.groesse));

    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Feste Hausbreite itemW.
    const itemW = zhFeldW(s, d.groesse) * s + 4;
    return atHtml(d) + flexDistribute(svgs, { itemSize: `width:${itemW}px;`, itemW, d });
  },

  renderProps: d => {
    const summands   = d.summands   || 2;
    const zahlenraum = d.zahlenraum || 10;
    const haeuser    = d.haeuser    || 3;
    const stockwerke = d.stockwerke || 4;
    const leerfeld   = d.leerfeld   || "links";
    const farbe      = d.farbe      || "sw";
    const ftgl = (val,label) => { const on=farbe===val; return `<button onclick="event.stopPropagation();upd(${d.id},'farbe','${val}')" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on?'#89b4fa':'#ddd'};background:${on?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on?'#1e1e2e':'#999'};">${label}</button>`; };

    const leerOpts = [
      ["dach",     "Dach leer (Summe berechnen)"],
      ["links",    "Linkes Feld leer"],
      ["rechts",   "Rechtes Feld leer"],
      ["gemischt", "Gemischt (zufällig)"],
      ["keins",    "Nichts leer (Vorlage)"],
    ].map(([v,l]) => `<option value="${v}" ${leerfeld===v?"selected":""}>${l}</option>`).join("");

    return pr("Felder pro Stockwerk",
        `<select onchange="zhUpdSummands(${d.id},+this.value)">
          <option value="2" ${summands===2?"selected":""}>2 Felder</option>
          <option value="3" ${summands===3?"selected":""}>3 Felder</option>
        </select>`) +
      pr("Stockwerke pro Haus",
        `<input type="number" min="1" max="12" value="${stockwerke}" onchange="zhUpdProp(${d.id},'stockwerke',+this.value)">`) +
      pr("Zahlenraum",
        `<select onchange="zhUpdProp(${d.id},'zahlenraum',+this.value)">
          ${[5,10,20,100].map(n=>`<option value="${n}" ${zahlenraum===n?"selected":""}>${n}</option>`).join("")}
        </select>`) +
      pr("Leerfeld", `<select onchange="zhUpdProp(${d.id},'leerfeld',this.value)">${leerOpts}</select>`) +
      pr("Anzahl Häuser",
        `<input type="number" min="1" max="40" value="${haeuser}" onchange="zhUpdProp(${d.id},'haeuser',+this.value)">`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${[['klein','Klein'],['mittel','Mittel'],['gross','Groß']].map(([v,l]) => { const on = (d.groesse || 'klein') === v; return `<button onclick="event.stopPropagation();upd(${d.id},'groesse','${v}')" style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on?'#89b4fa':'#ddd'};background:${on?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on?'#1e1e2e':'#999'};">${l}</button>`; }).join('')}</div>
      </div>` +
      `<div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">${ftgl('sw','S/W')}${ftgl('farbig','Farbig (Kaminrot)')}</div>
      </div>` +
      `<button onclick="event.stopPropagation();zhRoll(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Häuser würfeln</button>` ;
  },
});

// ── Zahlenhaus helpers ────────────────────────────────────────────
function zhRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.houses = zhGen(w.haeuser||3, w.summands||2, w.stockwerke||4, w.zahlenraum||10, w.leerfeld||"links");
  render(); renderProps(id);
}

function zhUpdSummands(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.summands = val;
  w.houses = zhGen(w.haeuser||3, val, w.stockwerke||4, w.zahlenraum||10, w.leerfeld||"links");
  render(); renderProps(id);
}

function zhUpdProp(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  w.houses = zhGen(w.haeuser||3, w.summands||2, w.stockwerke||4, w.zahlenraum||10, w.leerfeld||"links");
  render(); renderProps(id);
}
