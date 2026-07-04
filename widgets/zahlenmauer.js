// Widget: Zahlenmauer

function zmGenShown(n, fillMode) {
  const shown = {};
  if (fillMode === "basis") {
    for (let c = 0; c < n; c++) shown[`0,${c}`] = true;
    return shown;
  }
  const allCells = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n - r; c++)
      allCells.push([r, c]);

  function cellCoeffs(gridRow, col) {
    const coeffs = new Array(n).fill(0);
    for (let k = 0; k <= gridRow; k++) {
      let binom = 1;
      for (let i = 0; i < k; i++) binom = binom * (gridRow - i) / (i + 1);
      coeffs[col + k] += binom;
    }
    return coeffs;
  }
  function matRank(cellList) {
    if (!cellList.length) return 0;
    const mat = cellList.map(([r,c]) => cellCoeffs(r, c).map(v => v));
    let rank = 0;
    for (let col = 0; col < n; col++) {
      let pivot = -1;
      for (let row = rank; row < mat.length; row++) {
        if (Math.abs(mat[row][col]) > 1e-9) { pivot = row; break; }
      }
      if (pivot === -1) continue;
      [mat[rank], mat[pivot]] = [mat[pivot], mat[rank]];
      for (let row = 0; row < mat.length; row++) {
        if (row !== rank && Math.abs(mat[row][col]) > 1e-9) {
          const f = mat[row][col] / mat[rank][col];
          for (let j = 0; j < n; j++) mat[row][j] -= f * mat[rank][j];
        }
      }
      rank++;
    }
    return rank;
  }
  const target = n + Math.floor(Math.random() * (n - 1));
  const shuffled = allCells.slice().sort(() => Math.random() - 0.5);
  const chosen = [];
  for (const cell of shuffled) {
    const candidate = [...chosen, cell];
    if (matRank(candidate) > matRank(chosen) || (chosen.length < target && matRank(chosen) === n)) chosen.push(cell);
    if (chosen.length >= target && matRank(chosen) === n) break;
  }
  if (matRank(chosen) < n) {
    for (const cell of shuffled) {
      if (!chosen.includes(cell)) chosen.push(cell);
      if (matRank(chosen) === n) break;
    }
  }
  for (const [r, c] of chosen) shown[`${r},${c}`] = true;
  return shown;
}

function zmMakeMauer(n, fillMode, zahlenraum) {
  const max = zahlenraum || 10;
  // Zahlenraum bezieht sich auf den OBERSTEN Stein (Spitze), nicht die Basis.
  // Spitze = Σ base[i] · C(n-1, i) (Binomialgewichte der Basiszeile).
  const coeffs = [];
  let bin = 1;
  for (let i = 0; i < n; i++) { coeffs.push(bin); bin = bin * (n - 1 - i) / (i + 1); }
  const coeffSum = coeffs.reduce((a, b) => a + b, 0); // = 2^(n-1) = kleinstmögliche Spitze (alle Basissteine = 1)
  // Start: alle Basissteine 1 (Spitze = coeffSum). Restbudget bis max zufällig verteilen;
  // jeder +1 auf base[i] erhöht die Spitze um coeffs[i] → Spitze bleibt garantiert ≤ max.
  const base = Array(n).fill(1);
  let budget = max - coeffSum; // < 0 falls selbst die Minimalspitze > max (großes n, kleiner Zahlenraum) → Basis bleibt alle 1 (best effort)
  let guard = 0;
  while (budget > 0 && guard++ < 2000) {
    const affordable = [];
    for (let i = 0; i < n; i++) if (coeffs[i] <= budget) affordable.push(i);
    if (!affordable.length) break;
    if (Math.random() < 0.05) break; // gelegentlich früher stoppen → mehr Variation
    const i = affordable[Math.floor(Math.random() * affordable.length)];
    base[i]++; budget -= coeffs[i];
  }
  return { base, shown: zmGenShown(n, fillMode) };
}

function zmSvg(mauer, n, fillMode, isActive=false) {
  const base = (mauer.base || []).slice(0, n);
  while (base.length < n) base.push(1);
  const shown = mauer.shown || zmGenShown(n, fillMode);

  const grid = [base.map(v => +v)];
  for (let row = 1; row < n; row++) {
    const prev = grid[row - 1];
    const next = [];
    for (let i = 0; i < prev.length - 1; i++) next.push(prev[i] + prev[i + 1]);
    grid.push(next);
  }

  const cw = 54, ch = 34, stroke = 1.5;
  const svgW = n * cw + stroke;
  const svgH = n * ch + stroke;
  let rects = "", texts = "";

  for (let visualRow = 0; visualRow < n; visualRow++) {
    const gridRow = n - 1 - visualRow;
    const stonesInRow = n - gridRow;
    const rowW = stonesInRow * cw;
    const xStart = (n * cw - rowW) / 2;
    const y = visualRow * ch;
    for (let col = 0; col < stonesInRow; col++) {
      const x = xStart + col * cw;
      const key = `${gridRow},${col}`;
      const isShown = shown[key];
      const val = grid[gridRow][col];
      rects += `<rect x="${x+stroke/2}" y="${y+stroke/2}" width="${cw}" height="${ch}"
        fill="#ffffff" stroke="#999" stroke-width="${stroke}"/>`;
      if (isShown)
        texts += `<text x="${x+stroke/2+cw/2}" y="${y+stroke/2+ch/2+5}" text-anchor="middle"
          font-family="'Grundschrift',sans-serif" font-size="14" font-weight="700" fill="#222">${val}</text>`;
      else if (isActive)
        texts += `<text x="${x+stroke/2+cw/2}" y="${y+stroke/2+ch/2+5}" text-anchor="middle"
          font-family="'Grundschrift',sans-serif" font-size="14" font-weight="700" fill="#2563eb">${val}</text>`;
    }
  }
  return `<svg width="${svgW}" height="${svgH}" style="display:block;" xmlns="http://www.w3.org/2000/svg">${rects}${texts}</svg>`;
}

WIDGETS.push({
  meta: { type:"zahlenmauer", group:"rechenformate", label:"Zahlenmauer", desc:"Steine addieren", icon:"🧱", category:"mathematik" },

  createData: id => {
    const n = 4, fillMode = "basis", anzahl = 1, zahlenraum = 10;
    const mauern = Array.from({length: anzahl}, () => zmMakeMauer(n, fillMode, zahlenraum));
    return { id, type:"zahlenmauer", rows_count:n, fillMode, anzahl, zahlenraum, mauern , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const n = d.rows_count || 4;
    const fillMode = d.fillMode || "basis";
    const anzahl = d.anzahl || 1;
    // backward compat: if no mauern array, build from old base/shown
    const mauern = d.mauern || [{ base: d.base || [], shown: d.shown }];
    const active = d.id === selId || _solutionsMode;
    const svgs = mauern.slice(0, anzahl).map(m => zmSvg(m, n, fillMode, active));
    const itemW   = Math.round(n * 54 + 2);
    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js).
    return atHtml(d) + flexDistribute(svgs, { gap: 20, marginBottom: 12, itemSize: `width:${itemW}px;`, itemW, d });
  },

  renderProps: d => {
    const n = d.rows_count || 4;
    const fillMode = d.fillMode || "basis";
    const anzahl = d.anzahl || 1;
    const zahlenraum = d.zahlenraum || 10;
    const mauern = d.mauern || [{ base: d.base || [], shown: d.shown }];
    const base = (mauern[0]?.base || []).slice(0, n);
    while (base.length < n) base.push(1);

    const basisInputs = anzahl === 1
      ? base.map((v, col) =>
          `<input type="number" min="1" max="99" value="${v}"
            style="width:40px;border:1.5px solid #ddd;border-radius:4px;padding:4px;font-size:13px;text-align:center;font-family:'Grundschrift',sans-serif;outline:none;"
            onchange="zmSetBase(${d.id},${col},this.value)">`
        ).join("")
      : null;

    return pr("Zahlenraum",
        `<select onchange="zmSetZahlenraum(${d.id},+this.value)">
          ${[10,20,100].map(v=>`<option value="${v}" ${zahlenraum===v?"selected":""}>${v}</option>`).join("")}
        </select>`) +
      pr("Anzahl Basissteine",
        `<select onchange="zmResize(${d.id},+this.value)">
          ${[2,3,4,5,6].map(v=>`<option value="${v}" ${n===v?"selected":""}>${v}</option>`).join("")}
        </select>`) +
      pr("Anzahl Mauern",
        `<input type="number" min="1" max="12" value="${anzahl}" onchange="zmSetAnzahl(${d.id},+this.value)">`) +
      pr("Sichtbare Steine",
        `<select onchange="zmFillMode(${d.id},this.value)">
          <option value="basis"  ${fillMode==="basis" ?"selected":""}>Nur Basissteine</option>
          <option value="random" ${fillMode==="random"?"selected":""}>Zufällig (eindeutig lösbar)</option>
        </select>`) +
      (basisInputs ? pr("Basissteine (von links)", `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">${basisInputs}</div>`) : "") +
      `<button onclick="zmRandomBase(${d.id})"
        style="margin-top:8px;width:100%;background:#313244;color:#cdd6f4;border:none;border-radius:4px;padding:5px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;">
        🎲 Zufällige Basiszahlen</button>` ;
  },
});
