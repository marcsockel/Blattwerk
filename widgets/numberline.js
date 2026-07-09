// Widget: Zahlenstrahl

// Baut den Inhalt des Zahlenstrahl-SVG für eine gegebene Pixel-Breite W.
// Vertikale Maße + Schrift bleiben in px KONSTANT; nur die horizontale Verteilung
// (lineR) richtet sich nach W → der Strahl wächst in der Breite mit (auch Querformat),
// ohne dass Zahlen/Striche/Kästchen größer werden. Aufgerufen aus render() (Default-
// Breite) und fitNumberlineSvg() (echte Containerbreite nach dem Layout).
function nlBuild(d, W, isActive) {
  const start=+d.start, end=+d.end, step=+d.step;
  const gaps=new Set((d.gaps||"").split(",").map(n=>parseInt(n.trim())).filter(n=>!isNaN(n)));
  const modus = d.modus || 'luecken';
  const nurRandwerte = d.nurRandwerte || false;
  const lineL = 18, lineR = Math.max(lineL + 20, W - 22);
  const range = (end - start) || 1;
  const scale = v => lineL + ((v - start) / range) * (lineR - lineL);
  const half = step >= 2 ? step / 2 : null;
  const unit = step >= 1000 ? 100 : step >= 100 ? 10 : step >= 10 ? 1 : null;
  const fs   = step >= 1000 ? 10 : step >= 100 ? 11 : 12;
  const axis = lineY =>
    `<line x1="${lineL}" y1="${lineY}" x2="${lineR}" y2="${lineY}" stroke="#000" stroke-width="2"/>` +
    `<polygon points="${lineR+7},${lineY} ${lineR},${lineY-3} ${lineR},${lineY+3}" fill="#000"/>`;

  // ── Modi Ohne / Lücken (Strahl oben, Beschriftung darunter) ──
  if (modus === 'ohne' || modus === 'luecken') {
    const lineY = 28;
    let ticks = "", labels = "";
    if (unit !== null) for (let v=start; v<=end; v+=unit){ if (v%step===0 || (half && v%half===0)) continue; ticks += `<line x1="${scale(v)}" y1="25" x2="${scale(v)}" y2="31" stroke="#000" stroke-width="1"/>`; }
    if (half !== null) for (let v=start; v<end; v+=step){ const x=scale(v+half); ticks += `<line x1="${x}" y1="21" x2="${x}" y2="35" stroke="#000" stroke-width="1.5"/>`; }
    for (let v=start; v<=end; v+=step){
      const x = scale(v);
      ticks += `<line x1="${x}" y1="16" x2="${x}" y2="40" stroke="#000" stroke-width="2"/>`;
      if (modus === 'luecken' && gaps.has(v)) {
        const boxW = (step >= 100 ? 36 : step >= 10 ? 28 : 22) * 1.5; // 1,5× größere Kästchen
        labels += `<rect x="${x-boxW/2}" y="42" width="${boxW}" height="24" rx="2" fill="white" stroke="#000" stroke-width="1.2"/>`;
        if (isActive) {
          labels += `<text x="${x}" y="58" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fs}" font-weight="700" fill="#2563eb">${v}</text>`;
        }
      } else if (!nurRandwerte || v===start || v===end) {
        labels += `<text x="${x}" y="55" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fs}" fill="#000">${v}</text>`;
      }
    }
    return { body: axis(lineY) + ticks + labels, vbY: 0, vbH: modus === 'ohne' ? 62 : 70 };
  }

  // ── Modi Eintragen / Verbinden (Kästchen oben, Strahl darunter) ──
  const lineY = 75;
  let ticks = "", labels = "";
  if (unit !== null) for (let v=start; v<=end; v+=unit){ if (v%step===0 || (half && v%half===0)) continue; ticks += `<line x1="${scale(v)}" y1="72" x2="${scale(v)}" y2="78" stroke="#000" stroke-width="1"/>`; }
  if (half !== null) for (let v=start; v<end; v+=step){ const x=scale(v+half); ticks += `<line x1="${x}" y1="68" x2="${x}" y2="82" stroke="#000" stroke-width="1.5"/>`; }
  for (let v=start; v<=end; v+=step){ const x=scale(v); ticks += `<line x1="${x}" y1="63" x2="${x}" y2="87" stroke="#000" stroke-width="2"/>`; if (!nurRandwerte || v===start || v===end) labels += `<text x="${x}" y="100" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fs}" fill="#000">${v}</text>`; }

  const marked = [...gaps].filter(v => v>=start && v<=end).sort((a,b)=>a-b);
  const n  = marked.length || 1;
  const bw = step >= 100 ? 36 : step >= 10 ? 32 : 26, bh = 20;
  const boxY = [12, -10]; // row 0: unten, row 1: oben
  const curve = (x1,y1,x2,y2) => { const cy=(y1+y2)/2; return `<path d="M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}" fill="none"`; };
  let boxes = "", lines = "";
  marked.forEach((val, idx) => {
    const row = idx % 2, by = boxY[row];
    const bx = lineL + (idx + 0.5) * (lineR - lineL) / n;
    const tx = scale(val), ty = lineY - 4;
    const lc = isActive ? "#2563eb" : "#555";
    if (modus === 'eintragen') {
      const ebw = Math.round(bw*1.5), ebh = Math.round(bh*1.5);
      const tY = by + Math.round(ebh*0.7);
      lines += `${curve(bx, by+ebh, tx, ty)} stroke="${lc}" stroke-width="1.3"/>`;
      if (isActive) {
        boxes += `<rect x="${bx-ebw/2}" y="${by}" width="${ebw}" height="${ebh}" rx="3" fill="white" stroke="#2563eb" stroke-width="1.2"/>`;
        boxes += `<text x="${bx}" y="${tY}" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fs}" font-weight="700" fill="#2563eb">${val}</text>`;
      } else {
        boxes += `<rect x="${bx-ebw/2}" y="${by}" width="${ebw}" height="${ebh}" rx="3" fill="white" stroke="#000" stroke-width="1.2"/>`;
      }
    } else {
      boxes += `<rect x="${bx-bw/2}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="white" stroke="#000" stroke-width="1.2"/>`;
      boxes += `<text x="${bx}" y="${by+14}" text-anchor="middle" font-family="'Grundschrift',sans-serif" font-size="${fs}" fill="#000">${val}</text>`;
      if (isActive) lines += `${curve(bx, by+bh, tx, ty)} stroke="#2563eb" stroke-width="2"/>`;
    }
  });
  return { body: axis(lineY) + ticks + labels + lines + boxes, vbY: -12, vbH: 122 };
}

// Misst die echte Containerbreite und zeichnet den Strahl 1:1 in px neu → Strahl
// füllt die Breite (auch Querformat), Elementgrößen bleiben konstant. Läuft nach
// jedem render() (rAF-Hook in index.html) und nach sel()/desel() (Auswahl rendert
// das Widget neu) sowie vor dem Drucken (doPrint).
function fitNumberlineSvg(svg) {
  const wrap = svg.closest('.wwrap'); if (!wrap) return;
  const d = widgets.find(x => x.id === +wrap.dataset.id); if (!d) return;
  const W = svg.clientWidth; if (!W) return;
  const isActive = d.id === selId || _solutionsMode;
  const { body, vbY, vbH } = nlBuild(d, W, isActive);
  svg.setAttribute('viewBox', `0 ${vbY} ${W} ${vbH}`);
  svg.setAttribute('height', vbH);
  svg.innerHTML = body;
}

WIDGETS.push({
  meta: { type:"numberline", label:"Zahlenstrahl", desc:"Lücken eintragen", icon:"↔", category:"mathematik" },

  createData: id => {
    // Zufällige Lücken bei Schritt 10 im Bereich 0–50
    const candidates = [10,20,30,40].sort(()=>Math.random()-.5).slice(0,2).sort((a,b)=>a-b);
    return { id, type:"numberline", start:0, end:50, step:10, gaps:candidates.join(','), modus:"ohne", nurRandwerte:false , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    // Default-Breite 580; fitNumberlineSvg() passt nach dem Layout an die echte
    // Containerbreite an. preserveAspectRatio (Default „meet") hält die Vorab-
    // Anzeige in natürlicher Größe, falls der Fit nicht greift (z.B. clientWidth 0).
    const { body, vbY, vbH } = nlBuild(d, 580, isActive);
    return atHtml(d) + `<svg class="numberline-svg" width="100%" height="${vbH}" viewBox="0 ${vbY} 580 ${vbH}" style="display:block;">${body}</svg>`;
  },

  renderProps: d => {
    const modus = d.modus || 'luecken';
    const stepSel = `<select onchange="upd(${d.id},'step',+this.value)">
      <option value="1"    ${+d.step===1   ?"selected":""}>1</option>
      <option value="10"   ${+d.step===10  ?"selected":""}>10</option>
      <option value="100"  ${+d.step===100 ?"selected":""}>100</option>
      <option value="1000" ${+d.step===1000?"selected":""}>1000</option>
    </select>`;
    const nurRandwerte = d.nurRandwerte || false;
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn("Ohne",      modus==='ohne',      `upd(${d.id},'modus','ohne')`)}
          ${toggleBtn("Lücken",    modus==='luecken',   `upd(${d.id},'modus','luecken')`)}
          ${toggleBtn("Eintragen", modus==='eintragen', `upd(${d.id},'modus','eintragen')`)}
          ${toggleBtn("Verbinden", modus==='verbinden', `upd(${d.id},'modus','verbinden')`)}
        </div></div>` +
      pr("Start", `<input type="number" value="${d.start}" onchange="upd(${d.id},'start',+this.value)">`) +
      pr("Ende",  `<input type="number" value="${d.end}"   onchange="upd(${d.id},'end',+this.value)">`) +
      pr("Schritt", stepSel) +
      `<div class="prow"><label>Beschriftung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Alle",            !nurRandwerte, `upd(${d.id},'nurRandwerte',false)`)}
          ${toggleBtn("Nur Rand + Lücken", nurRandwerte, `upd(${d.id},'nurRandwerte',true)`)}
        </div></div>` +
      (modus !== 'ohne' ? pr(modus==='luecken' ? "Lücken" : "Zahlen (beliebig, kommagetrennt)",
        `<input value="${esc(d.gaps)}" placeholder="${modus==='luecken'?'z.B. 20,40':'z.B. 5,17,32'}" onchange="upd(${d.id},'gaps',this.value)">`) : '') +
      (modus !== 'luecken' && modus !== 'ohne' ? `<button onclick="nlRoll(${d.id})"
        style="margin-top:4px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Zahlen würfeln</button>` : '') ;
  },
});

function nlRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const start=+w.start, end=+w.end, step=+w.step;
  // Sub-step: step/10 for step>=10, else 1
  const sub = step >= 1000 ? 100 : step >= 100 ? 10 : step >= 10 ? 1 : 1;
  const nurRandwerte = w.nurRandwerte || false;
  const candidates = [];
  for (let v = start + sub; v < end; v += sub) {
    // Wenn nurRandwerte: auch Hauptschritt-Werte erlaubt (außer start/end)
    if (!nurRandwerte && v % step === 0) continue;
    candidates.push(v);
  }
  // Shuffle and pick 5
  candidates.sort(() => Math.random() - 0.5);
  w.gaps = candidates.slice(0, 5).sort((a,b)=>a-b).join(',');
  render(); renderProps(id);
}
