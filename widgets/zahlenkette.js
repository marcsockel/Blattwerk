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

// Generiert eine gültige Kette aus erlaubten Ops vorwärts
function zkGenChain(allowedOps, nSchritte, zahlenraum) {
  for (let att = 0; att < 400; att++) {
    const start = Math.floor(Math.random() * zahlenraum) + 1;
    let cur = start;
    const ops = [];
    let ok = true;
    for (let i = 0; i < nSchritte; i++) {
      const cands = [];
      for (const op of allowedOps) {
        const maxStep = Math.max(2, Math.round(zahlenraum / 4));
        if (op === '+') { for (let v=1;v<=Math.min(zahlenraum-cur,maxStep);v++) cands.push({op,val:v}); }
        else if (op === '-') { for (let v=1;v<cur&&v<=maxStep;v++) cands.push({op,val:v}); }
        else if (op === '×') { for (let v=2;v<=9&&cur*v<=zahlenraum;v++) cands.push({op,val:v}); }
        else if (op === ':') { [2,3,4,5,6,7,8,9,10].forEach(v=>{ if(cur%v===0&&cur/v>=1) cands.push({op,val:v}); }); }
      }
      if (!cands.length) { ok=false; break; }
      const pick = cands[Math.floor(Math.random()*cands.length)];
      ops.push(pick);
      if      (pick.op==='+') cur+=pick.val;
      else if (pick.op==='-') cur-=pick.val;
      else if (pick.op==='×') cur*=pick.val;
      else                     cur/=pick.val;
    }
    if (ok && ops.length===nSchritte) {
      return { start, ops, vals: zkCompute(start, ops) };
    }
  }
  return null;
}

function zkRegen(w) {
  const allowedOps = w.allowedOps || ['+','-'];
  const nSchritte  = w.nSchritte  || 4;
  const anzahl     = w.anzahl     || 4;
  const zahlenraum = w.zahlenraum || 20;
  w.ketten = [];
  for (let i = 0; i < anzahl; i++) {
    const chain = zkGenChain(allowedOps, nSchritte, zahlenraum);
    if (chain) w.ketten.push(chain); // ops sind pro Kette gespeichert
  }
  if (!w.ketten.length) w.ketten = [{start:1, ops:[], vals:[1]}];
  // d.ops auf letztes Beispiel setzen (für Abwärtskompatibilität)
  if (w.ketten[0]?.ops) w.ops = w.ketten[0].ops;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"zahlenkette", label:"Zahlenkette", desc:"Rechenoperationen in einer Kette", icon:"⛓", category:"mathematik" },

  createData: id => {
    const w = {
      id, type:"zahlenkette",
      allowedOps: ['+','-'],
      nSchritte: 4,
      ops: [],
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
    const isActive     = d.id === selId || _solutionsMode;
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
        ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;color:#222;">${val}</span>`
        : isActive
          ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;color:#2563eb;font-weight:700;">${val}</span>`
          : '';
      return `<div style="width:${ks}px;height:${ks}px;border:1.5px solid #555;border-radius:3px;
                           display:inline-flex;align-items:center;justify-content:center;
                           background:#fff;flex-shrink:0;">${inner}</div>`;
    };

    // Feste Breite für Operator-Label je nach Zahlenraum (1 Zeichen Op + N Ziffern)
    const zr = d.zahlenraum || 20;
    const valDigits = zr >= 1000 ? 3 : zr >= 100 ? 2 : 1;
    const arrowMinW = Math.round(fs * 0.85) * (valDigits + 0.5); // px estimate

    const arrow = (op, val) => {
      const label = zeigeOps
        ? `<span style="font-size:${Math.round(fs*0.85)}px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;display:inline-block;min-width:${arrowMinW}px;text-align:center;">${op}${val}</span>`
        : `<span style="font-size:${Math.round(fs*0.85)}px;color:#ccc;display:inline-block;min-width:${arrowMinW}px;text-align:center;">···</span>`;
      const ah = 5; // arrowhead half-height
      const arrowLine = `<div style="display:flex;align-items:center;width:${arrowMinW}px;">
        <div style="flex:1;height:1.5px;background:#555;"></div>
        <div style="width:0;height:0;border-top:${ah}px solid transparent;border-bottom:${ah}px solid transparent;border-left:${ah+2}px solid #555;flex-shrink:0;"></div>
      </div>`;
      return `<div style="display:inline-flex;flex-direction:column;align-items:center;
                           justify-content:center;padding:0 2px;flex-shrink:0;">
                ${label}
                ${arrowLine}
              </div>`;
    };

    const rows = ketten.map(kette => {
      const {start, vals, ops: kOps} = kette;
      const chainOps = kOps || ops; // per-chain ops preferred
      let html = box(vals[0], zeigeStart);
      chainOps.forEach((o, i) => {
        html += arrow(o.op, o.val);
        const isLast = i === chainOps.length - 1;
        html += box(vals[i+1], isLast ? zeigeEnde : zeigeZwischen);
      });
      return `<div style="display:flex;align-items:center;margin-bottom:10px;flex-wrap:nowrap;">${html}</div>`;
    });

    return `<div>${rows.join('')}</div>`;
  },

  renderProps: d => {
    const allowedOps   = d.allowedOps || ['+','-'];
    const nSchritte    = d.nSchritte  || 4;
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

    const opToggle = op => {
      const active = allowedOps.includes(op);
      return `<button onclick="event.stopPropagation();zkToggleOp(${d.id},'${op}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:13px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${op}</button>`;
    };

    return `<div class="prow"><label>Rechenarten</label>
        <div style="display:flex;gap:4px;">${['+','-','×',':'].map(opToggle).join('')}</div></div>` +
      pr('Schritte', `<input type="number" min="1" max="10" value="${nSchritte}"
        onclick="event.stopPropagation()" onchange="zkSetLayout(${d.id},'nSchritte',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      `<div class="prow"><label>Anzeigen</label>
        <div style="display:flex;gap:3px;flex-wrap:wrap;">
          ${togBtn("Start",    zeigeStart,    `zkSetZeige(${d.id},'zeigeStart',${!zeigeStart})`)}
          ${togBtn("Zwischen", zeigeZwischen, `zkSetZeige(${d.id},'zeigeZwischen',${!zeigeZwischen})`)}
          ${togBtn("Ende",     zeigeEnde,     `zkSetZeige(${d.id},'zeigeEnde',${!zeigeEnde})`)}
          ${togBtn("Ops",      zeigeOps,      `zkSetZeige(${d.id},'zeigeOps',${!zeigeOps})`)}
        </div></div>` +
      pr('Anzahl Ketten', `<input type="number" min="1" max="12" value="${anzahl}"
        onclick="event.stopPropagation()" onchange="zkSetLayout(${d.id},'anzahl',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      pr('Zahlenraum', `<select onchange="zkSetLayout(${d.id},'zahlenraum',+this.value)"
        style="border:1.5px solid #ddd;border-radius:4px;padding:3px 5px;font-family:inherit;font-size:12px;">
        ${[10,20,50,100,1000].map(n=>`<option value="${n}" ${zahlenraum===n?'selected':''}>${n}</option>`).join('')}
      </select>`) +
      pr('Kastengröße', `<input type="number" min="24" max="60" value="${ks}"
        onclick="event.stopPropagation()" onchange="upd(${d.id},'kastenGroesse',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      `<button onclick="event.stopPropagation();zkWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function zkToggleOp(id, op) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  const allowed = w.allowedOps || ['+','-'];
  const idx = allowed.indexOf(op);
  if (idx >= 0 && allowed.length > 1) allowed.splice(idx, 1);
  else if (idx < 0) allowed.push(op);
  w.allowedOps = allowed;
  zkRegen(w); render(); renderProps(id);
}
function zkSetZeige(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w[key] = val; render(); renderProps(id);
}
function zkSetLayout(id, key, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w[key] = val;
  zkRegen(w); render(); renderProps(id);
}
function zkWuerfeln(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  zkRegen(w); render(); renderProps(id);
}

function zkWuerfelnOps(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
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
