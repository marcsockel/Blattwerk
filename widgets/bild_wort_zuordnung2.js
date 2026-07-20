// Widget: Bild-Wort-Zuordnung 2 (mit Anlaut-SVGs)

WIDGETS.push({
  meta: {
    type: "bildwort2",
    group: "anlaut",
    label: "Bild-Wort-Zuordnung 2",
    desc: "Anlautbild + Wort zuordnen",
    icon: "🖼↔",
    category: "deutsch",
    itemsLayout: true,
  },

  createData: id => {
    const mkAufgabe = (anlaut, distractors) => {
      const src  = anlautDefaultSrc(anlaut);
      const word = anlautWortFromSrc(src) || anlaut;
      return { anlaut, src, word, distractors, order: bw2Shuffle(3) };
    };
    return {
      id, type: "bildwort2",
      imageSize: 80,
      groesse: "klein",
      _bwG3: true,
      itemsPerRow: 'auto',
      align: 'auto',
      itemGapH: 'normal',
      itemGapV: 'normal',
      itemGap: 'normal',
      trennlinien: false,
      trennStil: "thin",
      aufgaben: [
        mkAufgabe("A",  ["Birne","Haus"]),
        mkAufgabe("B",  ["Apfel","Auto"]),
        mkAufgabe("H",  ["Baum","Ball"]),
      ],
      aufgabenNr: 0, aufgabenText: "",
    };
  },

  render: d => {
    const { size, fontSize, cb } = bwSizeMetrics(d);
    const trenn = !!d.trennlinien;
    const isActive = d.id === selId || _solutionsMode;
    const checkbox = on => {
      const bCol = on ? '#2563eb' : '#555';
      const bg = on ? '#2563eb' : 'transparent';
      return `<span style="display:inline-block;width:${cb}px;height:${cb}px;border:1.5px solid ${bCol};`
        + `border-radius:2px;flex-shrink:0;background:${bg};"></span>`;
    };

    const inners = (d.aufgaben || []).map(a => {
      const src      = a.src || anlautDefaultSrc(a.anlaut);
      const allWords = [a.word, ...(a.distractors || ["",""])];
      const order    = a.order || [0,1,2];
      const words    = order.map(i => allWords[i] || "");
      const correctPos = order.indexOf(0);

      const wordList =
        `<div style="display:flex;flex-direction:column;justify-content:space-between;height:${Math.round(size * 0.88)}px;min-width:0;flex:1;">` +
        words.map((w, wi) =>
          `<div style="display:flex;align-items:center;gap:7px;min-width:0;">${checkbox(isActive && wi === correctPos)}
            <span style="font-size:${fontSize}px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(w)}</span>
          </div>`
        ).join("") +
        `</div>`;

      const L = typeof itemsLayoutProps === 'function' ? itemsLayoutProps(d) : null;
      const fullWidth = trenn || (L && L.itemsPerRow !== 'auto');
      return `<div style="display:flex;align-items:center;gap:16px;${fullWidth ? 'width:100%;' : 'width:max-content;'}min-width:0;box-sizing:border-box;">
        <div style="flex-shrink:0;">${anlautImg(src, size)}</div>
        ${wordList}
      </div>`;
    });

    return atHtml(d) + bwItemsGrid(d, inners);
  },

  renderProps: d => {
    const aufgaben = d.aufgaben || [];

    const available = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Ä","Ö","Ü","ß","Au","Ei","Eu","Sch","Sp","St"]);

    const letterBtns = available.map(l => {
      const isLong = l.length > 1;
      return `<button onclick="event.stopPropagation();bw2AddAufgabe(${d.id},'${l}')"
        style="width:${isLong?34:26}px;height:26px;border-radius:4px;border:1.5px solid #ddd;
               background:#fff;font-family:inherit;font-size:${isLong?9:11}px;font-weight:700;
               cursor:pointer;color:#555;">+${l}</button>`;
    }).join("");

    const aufgabeCards = aufgaben.map((a, idx) => {
      const src      = a.src || anlautDefaultSrc(a.anlaut);
      const variants = ANLAUT_BILDER[a.anlaut] || [];
      const picker   = variants.map(v => {
        const active = v === src;
        return `<button onclick="event.stopPropagation();bw2SetSrc(${d.id},${idx},'${v}')"
          title="${anlautWortFromSrc(v)||v}"
          style="padding:1px;border:2px solid ${active?'#89b4fa':'#eee'};border-radius:3px;
                 background:${active?'#e8f0fe':'transparent'};cursor:pointer;line-height:0;">
          <img src="assets/anlaut/${v}.svg" width="24" height="24" style="display:block;object-fit:contain;">
        </button>`;
      }).join("");

      return `<div style="border:1.5px solid #eee;border-radius:6px;padding:8px;margin-bottom:8px;">
        <div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px;">
          <div style="display:flex;gap:3px;flex-wrap:wrap;flex:1;">${picker}</div>
          <button onclick="event.stopPropagation();bw2RemoveAufgabe(${d.id},${idx})"
            style="padding:2px 6px;border:none;border-radius:4px;background:#fde8ec;color:#a0003c;
                   font-size:12px;cursor:pointer;flex-shrink:0;">✕</button>
        </div>
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">Richtiges Wort</div>
        <input value="${esc(a.word)}" placeholder="z.B. Affe"
          style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;
                 font-family:inherit;outline:none;box-sizing:border-box;margin-bottom:6px;"
          onchange="bw2UpdAufgabe(${d.id},${idx},'word',this.value)"
          onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">Ablenkwörter</div>
        <div style="display:flex;gap:4px;">
          <input value="${esc((a.distractors||[])[0]||"")}" placeholder="Wort 2"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bw2UpdDistractor(${d.id},${idx},0,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <input value="${esc((a.distractors||[])[1]||"")}" placeholder="Wort 3"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bw2UpdDistractor(${d.id},${idx},1,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
        </div>
      </div>`;
    }).join("");

    return bwSharedLayoutProps(d) +
      `<div class="prow">
        <label>Buchstaben</label>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${letterBtns}</div>
      </div>` +
      `<div style="margin:6px 0 4px;font-size:10px;font-weight:700;color:#aaa;
                   text-transform:uppercase;letter-spacing:.5px;">Aufgaben</div>` +
      aufgabeCards +
      `<button onclick="event.stopPropagation();bw2Reshuffle(${d.id})"
        style="margin-top:5px;width:100%;padding:5px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">
        🔀 Wörter neu mischen</button>` ;
  },
});

// ── Bild-Wort-Zuordnung 2 helpers ─────────────────────────────────────────

function bw2Shuffle(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Zufällige Ablenkwörter aus dem Pool aller Anlautbilder (ohne das richtige Wort).
function bw2RandDistractors(correctWord, n) {
  const pool = [];
  const seen = new Set([correctWord]);
  Object.values(ANLAUT_BILDER || {}).forEach(variants => {
    variants.forEach(src => {
      const word = anlautWortFromSrc(src);
      if (word && !seen.has(word)) { seen.add(word); pool.push(word); }
    });
  });
  // Fisher-Yates auf einer Kopie, dann die ersten n nehmen
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = pool.slice(0, n);
  while (out.length < n) out.push("");   // Auffüllen, falls Pool zu klein
  return out;
}

function bw2AddAufgabe(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const src  = anlautDefaultSrc(anlaut);
  const word = anlautWortFromSrc(src) || anlaut;
  w.aufgaben.push({ anlaut, src, word, distractors: bw2RandDistractors(word, 2), order: bw2Shuffle(3) });
  render(); renderProps(id);
}

function bw2RemoveAufgabe(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben.splice(idx, 1);
  render(); renderProps(id);
}

function bw2SetSrc(id, idx, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben[idx].src  = src;
  w.aufgaben[idx].word = anlautWortFromSrc(src) || w.aufgaben[idx].anlaut;
  render(); renderProps(id);
}

function bw2UpdAufgabe(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben[idx][key] = val;
  render(); renderProps(id);
}

function bw2UpdDistractor(id, idx, di, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  if (!w.aufgaben[idx].distractors) w.aufgaben[idx].distractors = ["",""];
  w.aufgaben[idx].distractors[di] = val;
  render(); renderProps(id);
}

function bw2Reshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben.forEach(a => { a.order = bw2Shuffle(3); });
  render(); renderProps(id);
}
