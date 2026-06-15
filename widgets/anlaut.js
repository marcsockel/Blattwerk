// Widget: Anlautbilder mit Multiple-Choice-Kästchen
WIDGETS.push({
  meta: { type:"anlaut", group:"anlaut", label:"Anlautbild", desc:"Anlautbild mit Buchstabenauswahl", icon:"🔤", category:"deutsch" },

  createData: id => ({
    id, type:"anlaut",
    items: [
      { anlaut:"A", src:anlautDefaultSrc("A"), choices:anlautShuffleOpts("A",null,"gross") },
      { anlaut:"B", src:anlautDefaultSrc("B"), choices:anlautShuffleOpts("B",null,"gross") },
      { anlaut:"C", src:anlautDefaultSrc("C"), choices:anlautShuffleOpts("C",null,"gross") },
    ],
    schreibweise: "gross",
    size: 80, gap: 16,
    align: "left", buchstabenAus: false,
    aufgabenNr: 0, aufgabenText: "",
  }),

  render: d => {
    // Backward compat: migrate old d.letters + d.choices + d.imgSrcs model
    const items = d.items || (d.letters || ['A','B','C']).map((letter, i) => ({
      anlaut:  letter,
      src:     (d.imgSrcs||{})[letter] || anlautDefaultSrc(letter),
      choices: (d.choices && d.choices[i]) || anlautShuffleOpts(letter, null, d.schreibweise||'gross'),
    }));
    const size        = d.size  || 80;
    const gap         = d.gap   ?? 16;
    const align       = d.align || "left";
    const buchstabenAus = d.buchstabenAus || false;
    const schreibweise  = d.schreibweise  || "gross";
    const fs = Math.max(11, Math.round(size * 0.2));

    const justifyMap = { left:"flex-start", center:"center", right:"flex-end" };
    const justify = justifyMap[align] || "flex-start";

    const rendered = items.map(item => {
      const src  = item.src || anlautDefaultSrc(item.anlaut);
      const opts = item.choices || anlautShuffleOpts(item.anlaut, null, schreibweise);

      const cells = opts.map((opt, j) =>
        `<div style="flex:1;text-align:center;padding:3px 0;font-size:${fs}px;font-weight:700;font-family:inherit;${j < 2 ? "border-right:1px solid #bbb;" : ""}">${esc(opt)}</div>`
      ).join("");

      const choiceBox = buchstabenAus ? "" :
        `<div style="display:flex;border:1.5px solid #bbb;border-radius:5px;overflow:hidden;width:${size}px;margin-top:5px;">${cells}</div>`;

      return `<div style="display:inline-flex;flex-direction:column;align-items:center;">${anlautImg(src, size)}${choiceBox}</div>`;
    });

    return atHtml(d) +
      `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;justify-content:${justify};">` +
        rendered.map(i => `<div>${i}</div>`).join("") +
      `</div>`;
  },

  renderProps: d => {
    const items      = d.items || [];
    const schreibweise = d.schreibweise || "gross";
    const size       = d.size || 80;
    const gap        = d.gap  ?? 16;

    const available = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Ä","Ö","Ü","ß","Au","Ei","Eu","Sch","Sp","St"]);

    const letterBtns = available.map(l => {
      const isLong = l.length > 1;
      return `<button onclick="event.stopPropagation();anlautAddItem(${d.id},'${l}')"
        style="width:${isLong?34:26}px;height:26px;border-radius:4px;border:1.5px solid #ddd;
               background:#fff;font-family:inherit;font-size:${isLong?9:11}px;font-weight:700;
               cursor:pointer;color:#555;">+${l}</button>`;
    }).join("");

    const itemRows = items.map((item, idx) => {
      const src      = item.src || anlautDefaultSrc(item.anlaut);
      const variants = ANLAUT_BILDER[item.anlaut] || [];
      const picker   = variants.map(v => {
        const active = v === src;
        return `<button onclick="event.stopPropagation();anlautSetItemSrc(${d.id},${idx},'${v}')"
          title="${anlautWortFromSrc(v)||v}"
          style="padding:1px;border:2px solid ${active?'#89b4fa':'#eee'};border-radius:3px;
                 background:${active?'#e8f0fe':'transparent'};cursor:pointer;line-height:0;">
          <img src="assets/anlaut/${v}.svg" width="22" height="22" style="display:block;object-fit:contain;">
        </button>`;
      }).join("");

      return `<div style="display:flex;align-items:center;gap:4px;padding:3px 4px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:10px;font-weight:700;color:#888;flex-shrink:0;min-width:14px;">${item.anlaut}</span>
        <div style="display:flex;gap:2px;flex-wrap:wrap;flex:1;">${picker}</div>
        <button onclick="event.stopPropagation();anlautRemoveItem(${d.id},${idx})"
          style="width:18px;height:18px;border-radius:3px;border:1px solid #ddd;background:#fff;
                 cursor:pointer;font-size:13px;line-height:1;color:#bbb;flex-shrink:0;padding:0;">×</button>
      </div>`;
    }).join("");

    return `<div class="prow">
        <label>Buchstaben</label>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${letterBtns}</div>
      </div>` +
      (items.length ? `<div class="prow">
        <label>Liste</label>
        <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-top:4px;">${itemRows}</div>
        <button onclick="event.stopPropagation();anlautShuffleItems(${d.id})"
          style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;
                 background:#313244;color:#cdd6f4;font-family:inherit;font-size:11px;
                 font-weight:700;cursor:pointer;">🔀 Reihenfolge mischen</button>
      </div>` : "") +
      `<div class="prow"><label>Buchstaben-Kästchen</label>
        <div style="display:flex;gap:4px;">
          ${[["An",false],["Aus",true]].map(([lbl,val]) => {
            const active = (!!d.buchstabenAus) === val;
            return `<button onclick="event.stopPropagation();upd(${d.id},'buchstabenAus',${val})"
              style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
                     background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
                     font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${lbl}</button>`;
          }).join("")}
        </div></div>` +
      `<div class="prow"><label>Schreibweise</label>
        <div style="display:flex;gap:4px;">
          ${[["A","gross"],["a","klein"],["Aa","gemischt"]].map(([lbl,sw]) => {
            const active = schreibweise === sw;
            return `<button onclick="event.stopPropagation();anlautSetSchreibweise(${d.id},'${sw}')"
              style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
                     background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:12px;
                     font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${lbl}</button>`;
          }).join("")}
        </div></div>` +
      `<button onclick="event.stopPropagation();anlautReshuffleChoices(${d.id})"
        style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">
        🔀 Ablenker neu mischen</button>` +
      `<div class="prow" style="margin-top:6px;"><label>Ausrichtung</label>
        <div style="display:flex;gap:4px;">
          ${[["Links","left"],["Mitte","center"],["Rechts","right"]].map(([lbl,val]) => {
            const active = (d.align||"left") === val;
            return `<button onclick="event.stopPropagation();upd(${d.id},'align','${val}')"
              style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
                     background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
                     font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${lbl}</button>`;
          }).join("")}
        </div></div>` +
      pr("Bildgröße (px)",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="40" max="200" value="${size}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'size',+this.value)" style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:36px;">${size}px</span>
        </div>`) +
      pr("Abstand",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="4" max="60" value="${gap}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'gap',+this.value)" style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:30px;">${gap}px</span>
        </div>`) +
      atProps(d.id, d);
  },
});

// ── Anlaut helpers ──────────────────────────────────────────────────────────

// Alle Bilder aus assets/anlaut/ — Reihenfolge: Wort-Bilder zuerst, alte Buchstaben-Bilder zuletzt.
// Konvention: ANLAUT-Wort.svg (Trennzeichen - oder _)
const ANLAUT_BILDER = {
  'A':   ['A-Affe', 'A-Apfel', 'A-Arm'],
  'Au':  ['Au-Auto'],
  'Ä':   ['Ä-Ähre', 'Ä-Ärmel'],
  'B':   ['B-Baum', 'B-Bett', 'B-Biene', 'B-Bus', 'B'],
  'C':   ['C-Clown', 'C-Computer'],
  'D':   ['D-Dach', 'D-Daumen', 'D-Dino', 'D-Dose'],
  'E':   ['E-Elefant', 'E-Engel', 'E-Esel', 'E-Ente'],
  'Ei':  ['Ei-Eimer', 'Ei-Eis', 'Ei-Frühstücksei'],
  'Eu':  ['Eu-Eule', 'Eu-Euter'],
  'F':   ['F-Fahrrad', 'F-Feder', 'F-Fenster', 'F-Fisch'],
  'G':   ['G-Gabel', 'G-Geschenk', 'G-Giraffe', 'G-Glas'],
  'H':   ['H-Hammer', 'H-Hand', 'H-Hut', 'H'],
  'I':   ['I-Igel', 'I-Indianer', 'I-Insel'],
  'J':   ['J-Jacke', 'J-Jojo', 'J-Junge'],
  'K':   ['K-Kamm', 'K-Kanne', 'K-Katze', 'K-Kerze', 'K-Krone'],
  'L':   ['L-Lampe', 'L-Leiter', 'L-Löffel', 'L-Löwe'],
  'M':   ['M-Maus', 'M-Mond', 'M-Motorrad', 'M-Mütze'],
  'N':   ['N-Nase', 'N-Nest', 'N-Nudeln'],
  'O':   ['O-Ohr', 'O-Orange', 'O'],
  'Ö':   ['Ö-Öffner', 'Ö-Öl'],
  'P':   ['P-Pferd', 'P-Pilz', 'P-Pinsel', 'P-Pirat'],
  'Q':   ['Q-Qualle'],
  'R':   ['R-Rakete', 'R-Regenbogen', 'R-Ring', 'R-Rose', 'R'],
  'S':   ['S-Seife', 'S-Socken', 'S-Sonne'],
  'Sch': ['Sch-Schaf', 'Sch-Schere', 'Sch-Schuh'],
  'Sp':  ['Sp-Spiegel', 'Sp-Spinne'],
  'St':  ['St-Stern', 'St-Staubsauger', 'St-Stuhl'],
  'T':   ['T-Tiger', 'T-Tisch', 'T'],
  'U':   ['U-Uboot', 'U_Uhr'],
  'Ü':   ['Ü-Überholverbot'],
  'V':   ['V-Vase', 'V-Vogel'],
  'W':   ['W-Waffel', 'W-Wolke', 'W-Wurm'],
  'X':   ['X-Xylophon'],
  'Y':   ['Y-Yak', 'Y-Yoga'],
  'Z':   ['Z-Zaun', 'Z-Zebra', 'Z-Zitrone'],
  'ß':   ['ß-Fuß'],
};

// Extrahiert den Wortteil aus einem Dateinamen (ohne .svg).
// Unterstützt Bindestrich (A-Auto → Auto, U-U-Boot → U-Boot)
// und Unterstrich (U_Uhr → Uhr).
// Gibt '' zurück für alte Einzelbuchstaben-Dateien (B, H, O, R, T).
function anlautWortFromSrc(src) {
  if (!src) return '';
  const hi = src.indexOf('-');
  const ui = src.indexOf('_');
  if (hi > 0) return src.split('-').slice(1).join('-');
  if (ui > 0) return src.split('_').slice(1).join('_');
  return '';
}

function anlautDefaultSrc(anlaut) {
  const variants = ANLAUT_BILDER[anlaut];
  return (variants && variants.length > 0) ? variants[0] : anlaut;
}

function anlautImg(src, size) {
  size = size || 80;
  return `<img src="assets/anlaut/${src}.svg" width="${size}" height="${size}" style="display:block;object-fit:contain;">`;
}

function anlautAddItem(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const sw  = w.schreibweise || 'gross';
  const src = anlautDefaultSrc(anlaut);
  w.items = [...(w.items || []), { anlaut, src, choices: anlautShuffleOpts(anlaut, null, sw) }];
  render(); renderProps(id);
}

function anlautRemoveItem(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = (w.items || []).filter((_, i) => i !== idx);
  render(); renderProps(id);
}

function anlautSetItemSrc(id, idx, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  items[idx] = { ...items[idx], src };
  w.items = items;
  render(); renderProps(id);
}

function anlautShuffleItems(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  w.items = items;
  render(); renderProps(id);
}

function anlautReshuffleChoices(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const sw = w.schreibweise || 'gross';
  w.items = (w.items || []).map(item => ({
    ...item, choices: anlautShuffleOpts(item.anlaut, null, sw)
  }));
  render(); renderProps(id);
}

function anlautSetSchreibweise(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.schreibweise = val;
  w.items = (w.items || []).map(item => ({
    ...item, choices: anlautShuffleOpts(item.anlaut, null, val)
  }));
  render(); renderProps(id);
}

function anlautApplyCase(letter, schreibweise) {
  if (schreibweise === 'klein') return letter.toLowerCase();
  if (schreibweise === 'gross') return letter.toUpperCase();
  return Math.random() < 0.5 ? letter.toLowerCase() : letter.toUpperCase();
}

function anlautGenChoices(letters, schreibweise) {
  const sw  = schreibweise || 'gross';
  const ALL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Ä","Ö","Ü","ß"]);
  return letters.map(letter => anlautShuffleOpts(letter, ALL, sw));
}

function anlautShuffleOpts(letter, pool, schreibweise) {
  const ALL = pool || "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Ä","Ö","Ü","ß"]);
  const sw  = schreibweise || 'gross';
  // Für Digrafen (Ei, Sch) den ersten Buchstaben als Kästchen-Buchstabe nehmen
  const baseLetter = letter.length > 1 ? letter[0] : letter;
  const p = ALL.filter(l => l !== baseLetter.toUpperCase());
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const opts = [anlautApplyCase(baseLetter, sw), anlautApplyCase(p[0], sw), anlautApplyCase(p[1], sw)];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}
