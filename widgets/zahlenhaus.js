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

function zhSvg(house, summands, isActive=false) {
  const { dach, dachLeer, floors } = house;
  const bw = summands === 3 ? 38 : 48;
  const bh = 34;
  const rh = 44;
  const W  = bw * summands + 4;
  const stockwerke = floors.length;
  const H  = rh + bh * stockwerke + 2;
  const cx = W / 2;

  const roof = `<polygon points="${cx},3 2,${rh} ${W-2},${rh}"
    fill="#f5f3ef" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/>`;

  const dachEl = dachLeer
    ? (isActive ? `<text x="${cx}" y="${rh-11}" text-anchor="middle" font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#2563eb">${dach}</text>` : "")
    : `<text x="${cx}" y="${rh-11}" text-anchor="middle"
        font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#222">${dach}</text>`;

  let floorsHtml = "";
  floors.forEach((floor, fi) => {
    const by = rh + fi * bh;
    for (let i = 0; i < summands; i++) {
      const bx = 2 + i * bw;
      floorsHtml += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}"
        fill="white" stroke="#555" stroke-width="1.5"/>`;
      if (!floor.leers[i]) {
        floorsHtml += `<text x="${bx + bw/2}" y="${by + bh/2 + 6}" text-anchor="middle"
          font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#222">${floor.felder[i]}</text>`;
      } else if (isActive) {
        floorsHtml += `<text x="${bx + bw/2}" y="${by + bh/2 + 6}" text-anchor="middle"
          font-family="'DidactGothic7',sans-serif" font-size="15" font-weight="700" fill="#2563eb">${floor.felder[i]}</text>`;
      }
    }
  });

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    ${roof}${dachEl}${floorsHtml}
  </svg>`;
}

WIDGETS.push({
  meta: { type:"zahlenhaus", label:"Zahlenhaus", desc:"Dach & Stockwerke", icon:"🏠", category:"mathematik" },

  createData: id => {
    const cfg = { summands:2, zahlenraum:10, haeuser:3, stockwerke:4, leerfeld:"links" };
    return { id, type:"zahlenhaus", ...cfg, houses: zhGen(cfg.haeuser, cfg.summands, cfg.stockwerke, cfg.zahlenraum, cfg.leerfeld) };
  },

  render: d => {
    const s = d.summands||2, st = d.stockwerke||4;
    const houses = d.houses || zhGen(d.haeuser||3, s, st, d.zahlenraum||10, d.leerfeld||"links");
    const active = d.id === selId || _solutionsMode;
    const svgs   = houses.map(h => `<div style="display:inline-block;">${zhSvg(h, s, active)}</div>`);
    return `<div style="display:flex;flex-wrap:wrap;gap:14px 20px;">${svgs.join("")}</div>`;
  },

  renderProps: d => {
    const summands   = d.summands   || 2;
    const zahlenraum = d.zahlenraum || 10;
    const haeuser    = d.haeuser    || 3;
    const stockwerke = d.stockwerke || 4;
    const leerfeld   = d.leerfeld   || "links";

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
        `<input type="number" min="1" max="8" value="${haeuser}" onchange="zhUpdProp(${d.id},'haeuser',+this.value)">`) +
      `<button onclick="event.stopPropagation();zhRoll(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Häuser würfeln</button>`;
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
