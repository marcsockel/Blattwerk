// Widget: Suchsel (Buchstabengitter)

function wsGetDirs(opts) {
  const dirs = [];
  const rw = opts.rueckwaerts !== false; // default false wenn nicht gesetzt
  if (opts.horizontal !== false) { dirs.push([0,1]); if (rw) dirs.push([0,-1]); }
  if (opts.vertikal   !== false) { dirs.push([1,0]); if (rw) dirs.push([-1,0]); }
  if (opts.diagonal   !== false) { dirs.push([1,1],[1,-1]); if (rw) dirs.push([-1,-1],[-1,1]); }
  return dirs.length ? dirs : [[0,1]]; // mindestens eine Richtung
}

function wsGenGrid(words, cols, rows, opts) {
  opts = opts || {};
  const C = Math.max(cols || 10, words.reduce((m,w) => Math.max(m, w.length), 5));
  const R = Math.max(rows || cols || 10, words.reduce((m,w) => Math.max(m, w.length), 5));
  const grid = Array.from({length:R}, () => Array(C).fill(""));
  const dirs = wsGetDirs(opts);
  words.forEach(word => {
    for(let a = 0; a < 200; a++){
      const [dr,dc] = dirs[Math.floor(Math.random()*dirs.length)];
      const maxR = dr>0 ? R-word.length : dr<0 ? word.length-1 : R-1;
      const maxC = dc>0 ? C-word.length : dc<0 ? word.length-1 : C-1;
      if(maxR<0||maxC<0) continue;
      const r = Math.floor(Math.random()*(maxR+1));
      const c = Math.floor(Math.random()*(maxC+1));
      let ok = true;
      for(let i=0;i<word.length;i++){
        const ri=r+dr*i, ci=c+dc*i;
        if(ri<0||ri>=R||ci<0||ci>=C){ok=false;break;}
        const ch=grid[ri][ci];if(ch&&ch!==word[i]){ok=false;break;}
      }
      if(ok){for(let i=0;i<word.length;i++) grid[r+dr*i][c+dc*i]=word[i]; break;}
    }
  });
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(!grid[r][c]) grid[r][c]=L[Math.floor(Math.random()*26)];
  return grid;
}

WIDGETS.push({
  meta: { type:"wordsearch", label:"Suchsel", desc:"Buchstabengitter", icon:"🔠", category:"deutsch" },

  createData: id => {
    const words = "ELMAR,ELEFANT,BUNT,FREUND".split(",").map(w => w.trim().toUpperCase());
    const cols = 10, rows = 10;
    const opts = { horizontal:true, vertikal:true, diagonal:true, rueckwaerts:false };
    return { id, type:"wordsearch", words:"ELMAR,ELEFANT,BUNT,FREUND", cols, rows, gross:false, ...opts, grid: wsGenGrid(words, cols, rows, opts) , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const words = d.words.split(",").map(w => w.trim().toUpperCase()).filter(Boolean);
    const grid  = d.grid || wsGenGrid(words, d.cols||d.size||10, d.rows||d.size||10);
    const R = grid.length, C = grid[0]?.length || R;
    const cs = d.gross ? 40 : 24;
    const fs = d.gross ? 22 : 12;
    const isActive = d.id === selId || _solutionsMode;

    // Zellen der gesuchten Wörter finden und markieren
    const highlighted = new Set();
    if (isActive) {
      const dirs = [[0,1],[1,0],[1,1],[0,-1],[-1,0],[-1,-1],[1,-1],[-1,1]];
      words.forEach(word => {
        for (let r = 0; r < R; r++) {
          for (let c = 0; c < C; c++) {
            for (const [dr, dc] of dirs) {
              let match = true;
              for (let i = 0; i < word.length; i++) {
                const ri = r + dr*i, ci = c + dc*i;
                if (ri < 0 || ri >= R || ci < 0 || ci >= C || grid[ri][ci] !== word[i]) { match = false; break; }
              }
              if (match) {
                for (let i = 0; i < word.length; i++) highlighted.add(`${r+dr*i},${c+dc*i}`);
              }
            }
          }
        }
      });
    }

    const cells = grid.map((row, ri) => row.map((ch, ci) => {
      const hl = highlighted.has(`${ri},${ci}`);
      return `<div style="width:${cs}px;height:${cs}px;border:1px solid #e0ddd6;display:flex;align-items:center;
                  justify-content:center;font-family:'Grundschrift',sans-serif;font-size:${fs}px;
                  font-weight:500;color:${hl ? '#1a56cc' : '#333'};
                  background:${hl ? '#dbeafe' : 'transparent'};">${ch}</div>`;
    }).join("")).join("");

    const wl = words.map(w => `<span style="font-family:monospace;font-size:12px;background:#f0eee8;padding:2px 6px;border-radius:3px;margin:2px;display:inline-block;">${w}</span>`).join("");
    return atHtml(d) + `<div>
      <div style="font-size:11px;color:#888;font-weight:700;margin-bottom:5px;">Finde die Wörter:</div>
      <div style="margin-bottom:7px;">${wl}</div>
      <div style="display:inline-grid;grid-template-columns:repeat(${C},${cs}px);gap:0;">${cells}</div>
    </div>`;
  },

  renderProps: d => {
    const cols  = d.cols  || d.size || 10;
    const rows  = d.rows  || d.size || 10;
    const gross = d.gross || false;
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    const h  = d.horizontal  !== false;
    const v  = d.vertikal    !== false;
    const dg = d.diagonal    !== false;
    const rw = d.rueckwaerts === true;
    return pr("Wörter (kommagetrennt)", `<input value="${esc(d.words)}" onchange="wsUpdate(${d.id},'words',this.value)">`) +
      `<div class="prow"><label>Richtungen</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn("Horizontal", h,  `wsToggleOpt(${d.id},'horizontal',${!h})`)}
          ${toggleBtn("Vertikal",   v,  `wsToggleOpt(${d.id},'vertikal',${!v})`)}
          ${toggleBtn("Diagonal",   dg, `wsToggleOpt(${d.id},'diagonal',${!dg})`)}
          ${toggleBtn("Rückwärts",  rw, `wsToggleOpt(${d.id},'rueckwaerts',${!rw})`)}
        </div>
      </div>` +
      `<div class="prow"><label>Kästchengröße</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", !gross, `upd(${d.id},'gross',false)`)}
          ${toggleBtn("Groß",   gross, `upd(${d.id},'gross',true)`)}
        </div>
      </div>` +
    `<div class="prow"><label>Gittergröße (Spalten × Zeilen)</label>
      <div style="display:flex;align-items:center;gap:6px;">
        <input type="number" min="6" max="25" value="${cols}"
          oninput="wsUpdSize(${d.id},'cols',+this.value)"
          style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;">
        <span style="color:#aaa;font-size:13px;">×</span>
        <input type="number" min="6" max="25" value="${rows}"
          oninput="wsUpdSize(${d.id},'rows',+this.value)"
          style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;">
      </div>
    </div>` +
    `<button onclick="event.stopPropagation();wsReshuffle(${d.id})"
      style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#313244;
             color:#cdd6f4;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">
      🔀 Neu generieren</button>` ;
  },
});

// ── Wordsearch helpers ────────────────────────────────────────────
function wsRegen(w) {
  const words = w.words.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
  w.grid = wsGenGrid(words, w.cols||w.size||10, w.rows||w.size||10, w);
}

function wsUpdate(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val; wsRegen(w); render(); renderProps(id);
}

function wsUpdSize(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val; wsRegen(w); render(); renderProps(id);
}

function wsToggleOpt(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val; wsRegen(w); render(); renderProps(id);
}

function wsReshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  wsRegen(w); render(); renderProps(id);
}
