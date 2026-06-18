// Widget: Kreuzworträtsel

// ── Generator ─────────────────────────────────────────────────────
// hBias: >1 bevorzugt waagerecht, <1 bevorzugt senkrecht (default 1.4 = quer)
// maxRows: maximale Höhe in Kästchen (0 = unbegrenzt)
function cwBuild(wordClues, hBias, maxRows) {
  if (!wordClues.length) return null;
  hBias = hBias ?? 1.4;
  maxRows = maxRows || 0;

  // Längste Wörter zuerst, Gleichlange zufällig mischen
  const sorted = [...wordClues].sort((a,b) =>
    b.word.length !== a.word.length
      ? b.word.length - a.word.length
      : Math.random() - 0.5
  );

  // Grid: "r,c" → {letter, h:bool, v:bool}
  const G = {};
  const get = (r,c) => G[`${r},${c}`];
  const set = (r,c,l,dir) => {
    const k = `${r},${c}`;
    if (!G[k]) G[k] = {letter:l, h:false, v:false};
    G[k][dir] = true;
  };

  function canPlace(word, r, c, dr, dc) {
    const dir = dc ? 'h' : 'v';
    const [pr, pc] = dc ? [1,0] : [0,1];
    if (get(r-dr, c-dc)) return false;
    if (get(r+dr*word.length, c+dc*word.length)) return false;
    let hits = 0;
    for (let i = 0; i < word.length; i++) {
      const ri=r+dr*i, ci=c+dc*i, cell=get(ri,ci);
      if (cell) {
        if (cell.letter !== word[i] || cell[dir]) return false;
        hits++;
      } else {
        if (get(ri+pr,ci+pc)?.[dir] || get(ri-pr,ci-pc)?.[dir]) return false;
      }
    }
    if (!hits && Object.keys(G).length) return false;
    // Höhenbegrenzung prüfen
    if (maxRows > 0) {
      const allR = Object.keys(G).map(k=>+k.split(',')[0]);
      const minR = Math.min(...allR, r);
      const maxR = Math.max(...allR, r + dr*(word.length-1));
      if (maxR - minR + 1 > maxRows) return false;
    }
    return true;
  }

  function place(word, r, c, dr, dc) {
    const dir = dc ? 'h' : 'v';
    for (let i=0; i<word.length; i++) set(r+dr*i, c+dc*i, word[i], dir);
  }

  // Score: Schnittmenge × Richtungsbias + kleines Rauschen für Variation
  function score(word, r, c, dr, dc) {
    let s=0;
    for (let i=0; i<word.length; i++) if (get(r+dr*i,c+dc*i)) s++;
    const bias = dc ? hBias : 1; // waagerecht bevorzugen wenn hBias > 1
    return s * bias + Math.random() * 0.3; // leichtes Rauschen für Variation
  }

  // Längstes Wort waagerecht (quer) oder senkrecht (hoch) in die Mitte
  const firstDir = hBias >= 1 ? [0,1] : [1,0];
  place(sorted[0].word, 0, 0, firstDir[0], firstDir[1]);
  const placed = [{...sorted[0], r:0, c:0, dr:firstDir[0], dc:firstDir[1]}];

  // Restliche Wörter durch Schnittmengen einfügen
  for (let wi=1; wi<sorted.length; wi++) {
    const {word, clue} = sorted[wi];
    let best=null, bestS=-1;

    for (let li=0; li<word.length; li++) {
      for (const [k, cell] of Object.entries(G)) {
        if (cell.letter !== word[li]) continue;
        const [gr,gc] = k.split(',').map(Number);
        for (const [dr,dc] of [[0,1],[1,0]]) {
          const sr=gr-dr*li, sc=gc-dc*li;
          if (canPlace(word,sr,sc,dr,dc)) {
            const s=score(word,sr,sc,dr,dc);
            if (s>bestS) { bestS=s; best={word,clue,r:sr,c:sc,dr,dc}; }
          }
        }
      }
    }
    if (best) { place(best.word,best.r,best.c,best.dr,best.dc); placed.push(best); }
  }

  // Koordinaten normalisieren (min = 0)
  const allR=Object.keys(G).map(k=>+k.split(',')[0]);
  const allC=Object.keys(G).map(k=>+k.split(',')[1]);
  const minR=Math.min(...allR), minC=Math.min(...allC);
  const maxR=Math.max(...allR), maxC=Math.max(...allC);
  const numRows=maxR-minR+1, numCols=maxC-minC+1;

  const normG={};
  for (const [k,v] of Object.entries(G)) {
    const [r,c]=k.split(',').map(Number);
    normG[`${r-minR},${c-minC}`]=v;
  }
  const normP=placed.map(p=>({...p,r:p.r-minR,c:p.c-minC}));

  // Wörter nummerieren (von oben-links nach unten-rechts)
  const numbers={};
  let num=1;
  for (let r=0; r<numRows; r++) {
    for (let c=0; c<numCols; c++) {
      const cell=normG[`${r},${c}`];
      if (!cell) continue;
      const hStart = cell.h && !normG[`${r},${c-1}`]?.h;
      const vStart = cell.v && !normG[`${r-1},${c}`]?.v;
      if (hStart||vStart) { numbers[`${r},${c}`]=num++; }
    }
  }
  normP.forEach(p => { p.num=numbers[`${p.r},${p.c}`]; });

  return {grid:normG, placed:normP, numbers, numRows, numCols};
}

function cwParsePairs(text) {
  return (text||'').split('\n')
    .map(l=>l.trim()).filter(l=>l.includes('='))
    .map(l=>{ const [w,...rest]=l.split('='); return {word:w.trim().toUpperCase(), clue:rest.join('=').trim()}; })
    .filter(p=>p.word.length>1);
}

function cwRegen(w) {
  const pairs   = cwParsePairs(w.pairs);
  const bias    = w.hBias ?? 1.4;
  const maxRows = w.maxRows || 0;
  let best = null;
  for (let i = 0; i < 30; i++) {
    const result = cwBuild(pairs, bias, maxRows);
    if (!best || result.placed.length > best.placed.length) best = result;
    if (best.placed.length === pairs.length) break;
  }
  w.cw = best;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"crossword", label:"Kreuzworträtsel", desc:"Automatisch generiertes Kreuzworträtsel", icon:"✚", category:"deutsch" },

  createData: id => {
    const w = {
      id, type:"crossword",
      pairs: "SONNE=Scheint am Tag\nMOND=Leuchtet nachts\nSTERN=Funkelt am Himmel\nWOLKE=Bringt Regen\nREGEN=Fällt vom Himmel\nSCHNEE=Weißer Wintergast\nWIND=Bewegt die Blätter",
      cellSize: 28,
      hBias: 1.4,
      maxRows: 0,
      cw: null, aufgabenNr:0, aufgabenText:"",
    };
    cwRegen(w);
    return w;
  },

  render: d => {
    if (!d.cw) return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Daten – bitte Wörter eingeben.</div>`;
    const {grid, placed, numbers, numRows, numCols} = d.cw;
    const cs = d.cellSize || 28;
    const fs = Math.round(cs * 0.52);
    const numFs = Math.round(cs * 0.27);
    const isActive = d.id === selId || _solutionsMode;

    // Gitter als SVG – jede Linie wird genau einmal gezeichnet
    const maxRows = d.maxRows || 0;
    const W = numCols * cs;
    const H = numRows * cs;
    const svgH = maxRows > 0 ? maxRows * cs : H;
    const offsetY = Math.round((svgH - H) / 2); // vertikal zentrieren

    // Weiße Rechtecke für Buchstabenzellen
    let rects = '', texts = '';
    for (let r=0; r<numRows; r++) {
      for (let c=0; c<numCols; c++) {
        const cell = grid[`${r},${c}`];
        const num  = numbers[`${r},${c}`];
        if (!cell) continue;
        const x = c*cs, y = r*cs;
        rects += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="white"/>`;
        if (num) texts += `<text x="${x+2}" y="${y+numFs+1}" font-size="${numFs}" font-family="sans-serif" font-weight="600" fill="#444">${num}</text>`;
        if (isActive) texts += `<text x="${x+cs/2}" y="${y+cs*0.68}" text-anchor="middle" font-size="${fs}" font-family="'Grundschrift',sans-serif" font-weight="600" fill="#1a56cc">${cell.letter}</text>`;
      }
    }

    // Kanten sammeln – jede Kante nur einmal
    const edges = new Set();
    for (let r=0; r<numRows; r++) {
      for (let c=0; c<numCols; c++) {
        if (!grid[`${r},${c}`]) continue;
        edges.add(`h_${r}_${c}`);
        edges.add(`h_${r+1}_${c}`);
        edges.add(`v_${r}_${c}`);
        edges.add(`v_${r}_${c+1}`);
      }
    }
    let lines = '';
    for (const key of edges) {
      const [t, a, b] = key.split('_').map((x,i)=>i?+x:x);
      if (t==='h') lines += `<line x1="${b*cs}" y1="${a*cs}" x2="${(b+1)*cs}" y2="${a*cs}"/>`;
      else         lines += `<line x1="${b*cs}" y1="${a*cs}" x2="${b*cs}"     y2="${(a+1)*cs}"/>`;
    }

    const gridSvg = `<svg width="${W}" height="${svgH}" style="display:block;overflow:visible;" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0,${offsetY})">
        ${rects}
        <g stroke="#999" stroke-width="1.5" stroke-linecap="square">${lines}</g>
        ${texts}
      </g>
    </svg>`;

    // Hinweise aufteilen
    const waagerecht = placed.filter(p=>p.dc===1).sort((a,b)=>a.num-b.num);
    const senkrecht  = placed.filter(p=>p.dr===1).sort((a,b)=>a.num-b.num);
    const unplaced   = cwParsePairs(d.pairs).filter(p => !placed.find(pl=>pl.word===p.word));

    const clueList = list => list.map(p=>
      `<div style="margin-bottom:4px;font-size:12px;font-family:inherit;">
         <strong style="font-family:'DidactGothic7',sans-serif;">${p.num}.</strong>&nbsp;${esc(p.clue)}
       </div>`
    ).join('');

    const unplacedWarning = unplaced.length
      ? `<div style="margin-top:8px;padding:6px 8px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;font-size:11px;color:#856404;">
           ⚠️ Nicht platziert: ${unplaced.map(p=>p.word).join(', ')}
         </div>`
      : '';

    return atHtml(d) + `<div>
      <div style="display:flex;justify-content:center;">${gridSvg}</div>
      ${unplacedWarning}
      <div style="display:flex;gap:24px;margin-top:${cs}px;flex-wrap:wrap;">
        <div style="flex:1;min-width:140px;">
          <div style="font-size:11px;font-weight:700;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">Waagerecht</div>
          ${clueList(waagerecht)}
        </div>
        <div style="flex:1;min-width:140px;">
          <div style="font-size:11px;font-weight:700;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px;">Senkrecht</div>
          ${clueList(senkrecht)}
        </div>
      </div>
    </div>`;
  },

  renderProps: d => {
    const cs      = d.cellSize || 28;
    const hBias   = d.hBias ?? 1.4;
    const maxRows = d.maxRows || 0;
    const placed  = d.cw?.placed || [];
    const total  = cwParsePairs(d.pairs).length;
    const ok     = placed.length;

    return `
      <div class="prow"><label>Wörter & Hinweise</label></div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;">Format: Wort=Hinweis (ein Eintrag pro Zeile)</div>
      <textarea onclick="event.stopPropagation()"
        onchange="cwUpdate(${d.id},this.value)"
        style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;
               padding:4px 6px;min-height:120px;resize:vertical;box-sizing:border-box;"
      >${esc(d.pairs||'')}</textarea>
      <div style="font-size:11px;color:${ok<total?'#b45309':'#2d6a4f'};margin:4px 0 8px;">
        ${ok} von ${total} Wörtern platziert
      </div>
      ${pr('Max. Höhe (Kästchen, 0 = frei)', `<input type="number" min="0" max="30" value="${maxRows}"
        onclick="event.stopPropagation()"
        onchange="cwSetMaxRows(${d.id},+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      <div class="prow"><label>Ausrichtung</label>
        <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#666;">
          <span>Hoch</span>
          <input type="range" min="0.4" max="2.5" step="0.1" value="${hBias}"
            onclick="event.stopPropagation()"
            oninput="cwSetBias(${d.id},+this.value)"
            style="flex:1;cursor:pointer;">
          <span>Quer</span>
        </div>
      </div>
      ${pr('Zellgröße (px)', `<input type="number" min="20" max="50" value="${cs}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'cellSize',+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      <button onclick="event.stopPropagation();cwRegenWidget(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🔀 Neu generieren</button>` ;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function cwUpdate(id, text) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.pairs = text;
  cwRegen(w);
  render(); renderProps(id);
}

function cwRegenWidget(id) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  cwRegen(w);
  render(); renderProps(id);
}

function cwSetMaxRows(id, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.maxRows = val;
  cwRegen(w);
  render(); renderProps(id);
}

function cwSetBias(id, val) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.hBias = val;
  cwRegen(w);
  render(); renderProps(id);
}
