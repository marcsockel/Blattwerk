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

WIDGETS.push({
  meta: { type:"zahlenmauer", label:"Zahlenmauer", desc:"Steine addieren", icon:"🧱", category:"mathematik" },

  createData: id => {
    const base = [3,5,2,4];
    const fillMode = "basis";
    return { id, type:"zahlenmauer", rows_count:4, base, fillMode, shown: zmGenShown(4, fillMode) };
  },

  render: d => {
    const n = d.rows_count || 4;
    const base = (d.base || []).slice(0, n);
    while (base.length < n) base.push(1);
    const fillMode = d.fillMode || "basis";
    const shown = d.shown || zmGenShown(n, fillMode);

    const grid = [base.map(v => +v)];
    for (let row = 1; row < n; row++) {
      const prev = grid[row - 1];
      const next = [];
      for (let i = 0; i < prev.length - 1; i++) next.push(prev[i] + prev[i + 1]);
      grid.push(next);
    }

    const cw = 54, ch = 38, stroke = 2;
    const svgW = n * cw + stroke;
    const svgH = n * ch + stroke;

    let rects = "";
    let texts = "";

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
        const fill = isShown ? "#f0ede6" : "#ffffff";

        rects += `<rect x="${x + stroke/2}" y="${y + stroke/2}" width="${cw}" height="${ch}" fill="${fill}" stroke="#444" stroke-width="${stroke}"/>`;
        if (isShown) {
          texts += `<text x="${x + stroke/2 + cw/2}" y="${y + stroke/2 + ch/2 + 5}" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="14" font-weight="700" fill="#222">${val}</text>`;
        }
      }
    }

    return `<svg width="${svgW}" height="${svgH}" style="display:block;max-width:100%;" xmlns="http://www.w3.org/2000/svg">${rects}${texts}</svg>`;
  },

  renderProps: d => {
    const n = d.rows_count || 4;
    const base = (d.base || []).slice(0,n);
    while(base.length < n) base.push(1);
    const fillMode = d.fillMode || "basis";

    const basisInputs = base.map((v,col) =>
      `<input type="number" min="1" max="99" value="${v}" style="width:40px;border:1.5px solid #ddd;border-radius:4px;padding:4px;font-size:13px;text-align:center;font-family:'Grundschrift',sans-serif;outline:none;"
        onchange="zmSetBase(${d.id},${col},this.value)">`
    ).join("");

    return pr("Anzahl Basissteine",
        `<select onchange="zmResize(${d.id},+this.value)">
          <option value="2" ${n===2?"selected":""}>2</option>
          <option value="3" ${n===3?"selected":""}>3</option>
          <option value="4" ${n===4?"selected":""}>4</option>
          <option value="5" ${n===5?"selected":""}>5</option>
          <option value="6" ${n===6?"selected":""}>6</option>
        </select>`) +
      pr("Sichtbare Steine",
        `<select onchange="zmFillMode(${d.id},this.value)">
          <option value="basis" ${fillMode==="basis"?"selected":""}>Nur Basissteine</option>
          <option value="random" ${fillMode==="random"?"selected":""}>Zufällig (eindeutig lösbar)</option>
        </select>`) +
      pr("Basissteine (von links)", `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">${basisInputs}</div>`) +
      `<button onclick="zmRandomBase(${d.id})" style="margin-top:8px;width:100%;background:#e8e6e0;border:none;border-radius:4px;padding:5px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;color:#555;">🎲 Zufällige Basiszahlen</button>`;
  },
});
