// Widget: Zahlenkette

// ── Ketten generieren ─────────────────────────────────────────────
function zkCompute(start, ops) {
  const vals = [start];
  ops.forEach(({op, val}) => {
    const prev = vals[vals.length - 1];
    let next;
    if      (op === '+') next = prev + val;
    else if (op === '-') next = prev - val;
    else if (op === '×') next = prev * val;
    else if (op === ':') next = (val !== 0 && prev % val === 0) ? prev / val : prev;
    else next = prev;
    vals.push(next);
  });
  return vals;
}

function zkRandStart(ops, zahlenraum) {
  // Alle gültigen Startwerte im Zahlenraum finden, dann zufällig wählen
  const candidates = [];
  for (let s = 1; s <= zahlenraum; s++) {
    const vals = zkCompute(s, ops);
    if (vals.every(v => Number.isInteger(v) && v > 0 && v <= zahlenraum)) {
      candidates.push(s);
    }
  }
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  // Fallback: ohne Ganzzahl-Bedingung, nur positiv
  const fallback = [];
  for (let s = 1; s <= zahlenraum; s++) {
    const vals = zkCompute(s, ops);
    if (vals.every(v => v > 0 && v <= zahlenraum)) fallback.push(s);
  }
  return fallback.length > 0
    ? fallback[Math.floor(Math.random() * fallback.length)]
    : Math.ceil(Math.random() * zahlenraum);
}

function zkRegen(w) {
  const ops        = w.ops || [];
  const anzahl     = w.anzahl || 4;
  const zahlenraum = w.zahlenraum || 20;
  w.ketten = Array.from({length: anzahl}, () => {
    const start = zkRandStart(ops, zahlenraum);
    return { start, vals: zkCompute(start, ops) };
  });
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"zahlenkette", label:"Zahlenkette", desc:"Rechenoperationen in einer Kette", icon:"⛓", category:"mathematik" },

  createData: id => {
    const w = {
      id, type:"zahlenkette",
      ops: [{op:'+', val:4}, {op:'×', val:2}, {op:'-', val:6}, {op:':', val:2}],
      anzahl: 4,
      zahlenraum: 20,
      zeigeStart:      true,
      zeigeZwischen:   false,
      zeigeEnde:       false,
      zeigeOps:        true,
      kastenGroesse:   34,
      ketten: [],
    };
    zkRegen(w);
    return w;
  },

  render: d => {
    const ketten       = d.ketten || [];
    const ops          = d.ops || [];
    const ks           = d.kastenGroesse || 34;
    const fs           = Math.round(ks * 0.42);
    const zeigeStart   = d.zeigeStart   !== false;
    const zeigeZwischen= d.zeigeZwischen|| false;
    const zeigeEnde    = d.zeigeEnde    || false;
    const zeigeOps     = d.zeigeOps     !== false;

    const box = (val, show) => {
      const inner = show
        ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;">${val}</span>`
        : '';
      return `<div style="width:${ks}px;height:${ks}px;border:1.5px solid #555;border-radius:3px;
                           display:inline-flex;align-items:center;justify-content:center;
                           background:#fff;flex-shrink:0;">${inner}</div>`;
    };

    const arrow = (op, val) => {
      const label = zeigeOps
        ? `<span style="font-size:${Math.round(fs*0.85)}px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;">${op}${val}</span>`
        : `<span style="font-size:${Math.round(fs*0.85)}px;color:#ccc;">···</span>`;
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;
                           justify-content:center;padding:0 4px;flex-shrink:0;">
                ${label}
                <span style="font-size:${Math.round(fs*0.9)}px;color:#555;line-height:1;">→</span>
              </div>`;
    };

    const rows = ketten.map(kette => {
      const {start, vals} = kette;
      let html = box(vals[0], zeigeStart);
      ops.forEach((o, i) => {
        html += arrow(o.op, o.val);
        const isLast = i === ops.length - 1;
        html += box(vals[i+1], isLast ? zeigeEnde : zeigeZwischen);
      });
      return `<div style="display:flex;align-items:center;margin-bottom:10px;flex-wrap:nowrap;">${html}</div>`;
    });

    return `<div>${rows.join('')}</div>`;
  },

  renderProps: d => {
    const ops          = d.ops || [];
    const anzahl       = d.anzahl || 4;
    const zahlenraum   = d.zahlenraum || 20;
    const ks           = d.kastenGroesse || 34;
    const zeigeStart   = d.zeigeStart   !== false;
    const zeigeZwischen= d.zeigeZwischen|| false;
    const zeigeEnde    = d.zeigeEnde    || false;
    const zeigeOps     = d.zeigeOps     !== false;

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:4px 3px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const opSymbols = ['+','-','×',':'];
    const opsHtml = ops.map((o, i) =>
      `<div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
        <select onchange="zkUpdOp(${d.id},${i},'op',this.value)"
          style="width:44px;padding:3px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:13px;">
          ${opSymbols.map(s=>`<option value="${s}" ${o.op===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <input type="number" value="${o.val}" min="1" max="100"
          onclick="event.stopPropagation()"
          onchange="zkUpdOp(${d.id},${i},'val',+this.value)"
          style="flex:1;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;text-align:center;">
        <button onclick="event.stopPropagation();zkRemoveOp(${d.id},${i})"
          style="padding:3px 7px;border:1.5px solid #ddd;border-radius:4px;background:#fff;
                 color:#aaa;font-size:12px;cursor:pointer;">✕</button>
      </div>`
    ).join('');

    return `
      <div class="prow"><label>Operationen</label></div>
      ${opsHtml}
      <button onclick="event.stopPropagation();zkAddOp(${d.id})"
        style="width:100%;padding:4px;margin-bottom:8px;border:1.5px dashed #bbb;border-radius:4px;
               background:#fafafa;font-family:inherit;font-size:11px;color:#666;cursor:pointer;">
        + Operation</button>

      <div class="prow"><label>Anzeigen</label>
        <div style="display:flex;gap:3px;flex-wrap:wrap;">
          ${togBtn("Start",     zeigeStart,    `zkSetZeige(${d.id},'zeigeStart',${!zeigeStart})`)}
          ${togBtn("Zwischen",  zeigeZwischen, `zkSetZeige(${d.id},'zeigeZwischen',${!zeigeZwischen})`)}
          ${togBtn("Ende",      zeigeEnde,     `zkSetZeige(${d.id},'zeigeEnde',${!zeigeEnde})`)}
          ${togBtn("Ops",       zeigeOps,      `zkSetZeige(${d.id},'zeigeOps',${!zeigeOps})`)}
        </div>
      </div>

      ${pr('Anzahl Ketten', `<input type="number" min="1" max="12" value="${anzahl}"
        onclick="event.stopPropagation()"
        onchange="zkSetLayout(${d.id},'anzahl',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      ${pr('Zahlenraum', `<select onchange="zkSetLayout(${d.id},'zahlenraum',+this.value)"
        style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;font-family:inherit;font-size:12px;">
        ${[10,20,50,100,1000].map(n=>`<option value="${n}" ${zahlenraum===n?'selected':''}>${n}</option>`).join('')}
      </select>`)}
      ${pr('Kastengröße', `<input type="number" min="24" max="60" value="${ks}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'kastenGroesse',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}

      <div style="display:flex;gap:6px;margin-top:6px;">
        <button onclick="event.stopPropagation();zkWuerfeln(${d.id})"
          style="flex:1;padding:6px;border:none;border-radius:5px;
                 background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
                 font-weight:700;cursor:pointer;">🎲 Zahlen würfeln</button>
        <button onclick="event.stopPropagation();zkWuerfelnOps(${d.id})"
          style="flex:1;padding:6px;border:none;border-radius:5px;
                 background:#45475a;color:#cdd6f4;font-family:inherit;font-size:12px;
                 font-weight:700;cursor:pointer;">🎲 Operationen würfeln</button>
      </div>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function zkUpdOp(id, i, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  w.ops[i][key] = val;
  zkRegen(w); render(); renderProps(id);
}
function zkAddOp(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  w.ops.push({op:'+', val:1});
  zkRegen(w); render(); renderProps(id);
}
function zkRemoveOp(id, i) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  w.ops.splice(i,1);
  zkRegen(w); render(); renderProps(id);
}
function zkSetZeige(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  w[key] = val; render(); renderProps(id);
}
function zkSetLayout(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  w[key] = val;
  zkRegen(w); render(); renderProps(id);
}
function zkWuerfeln(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  zkRegen(w); render(); renderProps(id);
}

function zkWuerfelnOps(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  const zr = w.zahlenraum || 20;
  const n  = w.ops.length || 4;

  // Zufällige Operationen generieren die ganzzahlige Ergebnisse liefern
  for (let attempt = 0; attempt < 100; attempt++) {
    const newOps = Array.from({length: n}, () => {
      const op  = ['+','-','×',':'][Math.floor(Math.random() * 4)];
      let val;
      if (op === '×') val = Math.floor(Math.random() * 4) + 2;       // 2–5
      else if (op === ':') val = [2,3,4,5][Math.floor(Math.random() * 4)]; // 2–5
      else val = Math.floor(Math.random() * Math.max(3, Math.round(zr / 4))) + 1;
      return {op, val};
    });
    // Prüfen ob es genug gültige Startwerte gibt
    const candidates = [];
    for (let s = 1; s <= zr; s++) {
      const vals = zkCompute(s, newOps);
      if (vals.every(v => Number.isInteger(v) && v > 0 && v <= zr)) candidates.push(s);
    }
    if (candidates.length >= 3) {
      w.ops = newOps;
      zkRegen(w);
      render(); renderProps(id);
      return;
    }
  }
  // Fallback: nur Zahlen neu würfeln
  zkRegen(w); render(); renderProps(id);
}
