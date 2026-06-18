// Widget: Bild-Wort-Zuordnung 2 (mit Anlaut-SVGs)

WIDGETS.push({
  meta: {
    type: "bildwort2",
    group: "anlaut",
    label: "Bild-Wort-Zuordnung 2",
    desc: "Anlautbild + Wort zuordnen",
    icon: "🖼↔",
    category: "deutsch",
  },

  createData: id => {
    const mkAufgabe = (anlaut, distractors) => {
      const src  = anlautDefaultSrc(anlaut);
      const word = anlautWortFromSrc(src) || anlaut;
      return { anlaut, src, word, distractors, order: bw2Shuffle(3) };
    };
    return {
      id, type: "bildwort2",
      imageSize: 70,
      zeilenabstand: 10,
      aufgaben: [
        mkAufgabe("A",  ["Birne","Haus"]),
        mkAufgabe("B",  ["Apfel","Auto"]),
        mkAufgabe("H",  ["Baum","Ball"]),
      ],
      aufgabenNr: 0, aufgabenText: "",
    };
  },

  render: d => {
    const size          = d.imageSize    || 70;
    const zeilenabstand = d.zeilenabstand ?? 10;
    const checkbox = `<span style="display:inline-block;width:13px;height:13px;border:1.5px solid #555;
                        border-radius:2px;flex-shrink:0;"></span>`;

    const items = (d.aufgaben || []).map(a => {
      const src      = a.src || anlautDefaultSrc(a.anlaut);
      const allWords = [a.word, ...(a.distractors || ["",""])];
      const order    = a.order || [0,1,2];
      const words    = order.map(i => allWords[i] || "");

      const wordList =
        `<div style="display:flex;flex-direction:column;gap:${zeilenabstand}px;min-width:0;flex:1;">` +
        words.map(w =>
          `<div style="display:flex;align-items:center;gap:7px;min-width:0;">${checkbox}
            <span style="font-size:14px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;">${esc(w)}</span>
          </div>`
        ).join("") +
        `</div>`;

      return `<div style="display:flex;align-items:center;gap:16px;min-width:0;">
        <div style="flex-shrink:0;">${anlautImg(src, size)}</div>
        ${wordList}
      </div>`;
    });

    return atHtml(d) +
      `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px 24px;">${items.join("")}</div>`;
  },

  renderProps: d => {
    const size          = d.imageSize    || 70;
    const zeilenabstand = d.zeilenabstand ?? 10;
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

    return pr("Bildgröße (px)",
        `<input type="number" min="40" max="200" step="10" value="${size}"
           onchange="upd(${d.id},'imageSize',+this.value)">`) +
      pr("Zeilenabstand",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="4" max="40" value="${zeilenabstand}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'zeilenabstand',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:34px;">${zeilenabstand}px</span>
        </div>`) +
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

function bw2AddAufgabe(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const src  = anlautDefaultSrc(anlaut);
  const word = anlautWortFromSrc(src) || anlaut;
  w.aufgaben.push({ anlaut, src, word, distractors: ["",""], order: bw2Shuffle(3) });
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
