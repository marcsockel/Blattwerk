// Widget: Zuordnung
WIDGETS.push({
  meta: { type:"matching", label:"Zuordnung", desc:"Paare verbinden", icon:"↔", category:"deutsch" },

  createData: id => {
    const pairs = [["Hund","bellt"],["Katze","miaut"],["Kuh","muht"]];
    return { id, type:"matching", pairs, rightOrder: matchingShuffleIdx(pairs.length) };
  },

  render: d => {
    const order = d.rightOrder || matchingShuffleIdx(d.pairs.length);
    const left  = d.pairs.map(([a]) => a);
    const right = order.map(i => d.pairs[i][1]);
    const cell  = val => `<td style="padding:3px 6px;font-size:13px;white-space:nowrap;">
      <span style="display:block;border:1.5px solid #bbb;border-radius:5px;padding:3px 10px;text-align:center;">${esc(val)}</span>
    </td>`;
    const rows = left.map((a, i) => `<tr>${cell(a)}<td style="width:24px;"></td>${cell(right[i])}</tr>`).join("");
    return `<table style="border-collapse:collapse;border-spacing:0 5px;width:auto;">${rows}</table>`;
  },

  renderProps: d => pr("Paare (Format: links=rechts)",
    `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
      onchange="matchingUpdate(${d.id},this.value)">${d.pairs.map(([a,b])=>`${a}=${b}`).join("\n")}</textarea>`) +
    `<button onclick="event.stopPropagation();matchingReshuffle(${d.id})"
      style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
             font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">🔀 Neu mischen</button>`,
});

// ── Matching helpers ──────────────────────────────────────────────
function matchingShuffleIdx(n) {
  const arr = Array.from({length: n}, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function matchingReshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.rightOrder = matchingShuffleIdx(w.pairs.length);
  render(); renderProps(id);
}

function matchingUpdate(id, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.pairs = value.split('\n').filter(l => l.includes('=')).map(l => {
    const [a, ...b] = l.split('=');
    return [a.trim(), b.join('=').trim()];
  });
  w.rightOrder = matchingShuffleIdx(w.pairs.length);
  render(); renderProps(id);
}
