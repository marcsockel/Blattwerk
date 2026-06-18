// Widget: Geheimschrift
// Wort als Anlautbilder verschlüsseln — unter jedem Bild ein Kästchen
WIDGETS.push({
  meta: {
    type: "geheimschrift",
    group: "anlaut",
    label: "Geheimschrift",
    desc: "Wort als Anlautbilder + Kästchen",
    icon: "🔐",
    category: "deutsch",
  },

  createData: id => {
    const defaultWords = "Auge";
    const items = gsTokenizeWord(defaultWords)
      .filter(a => ANLAUT_BILDER[a])
      .map(anlaut => ({ anlaut, src: anlautDefaultSrc(anlaut) }));
    return {
      id, type: "geheimschrift",
      items,
      modus: "klein",
      font: "'Grundschrift', sans-serif", fontSize: 16,
      imgSize: 52,
      gap: 8,
      lineatur: 1, lineaturGross: false,
      schreibfeld: true,
      wordsText: defaultWords,
      aufgabenNr: 0, aufgabenText: "",
    };
  },

  render: d => {
    const font          = d.font          || "inherit";
    const fontSize      = d.fontSize      || 16;
    const imgSize       = d.imgSize       || 52;
    const lineatur      = d.lineatur      ?? 1;
    const lineaturGross = d.lineaturGross || false;
    const lMul          = lineaturGross ? 1.5 : 1;
    const gap        = d.gap        ?? 8;
    const schreibfeld = d.schreibfeld || false;
    const items      = d.items      || [];

    // Feste Kästchenhöhe (passt zu Lineatur 1)
    const boxH = Math.round(36 * lMul);

    const isSelected = (typeof selId !== "undefined") && selId === d.id;

    // Einfaches Kästchen ohne Lineatur, gleiche Breite wie Bild
    const kaestchen = (anlaut) =>
      `<div style="width:${imgSize}px;height:${boxH}px;` +
      `border:1px solid #bbb;background:#fff;box-sizing:border-box;` +
      `display:flex;align-items:center;justify-content:center;">` +
      (isSelected
        ? `<span style="font-family:${font};font-size:${Math.round(boxH*0.55)}px;color:#89b4fa;line-height:1;">${esc(anlaut.toUpperCase())}</span>`
        : '') +
      `</div>`;

    // Schreibfeld-Lineatur (gleiche Höhe wie Kästchen, füllt verfügbare Breite)
    const schreibfeldHtml = () => {
      if (lineatur === 1) {
        return `<div style="border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;flex:1;">` +
          `<div style="height:${11*lMul}px;border-top:1px solid #bbb;"></div>` +
          `<div style="height:${11*lMul}px;border-top:1px solid #bbb;background:#dff0f8;"></div>` +
          `<div style="height:${11*lMul}px;border-top:2px solid #777;"></div>` +
          `<div style="height:${3*lMul}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
        `</div>`;
      }
      if (lineatur === 2) {
        return `<div style="border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;flex:1;">` +
          `<div style="height:${16*lMul}px;border-top:1px dashed #bbb;"></div>` +
          `<div style="height:${5*lMul}px;border-top:2px solid #777;"></div>` +
          `<div style="height:${4*lMul}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
        `</div>`;
      }
      return `<div style="flex:1;height:${boxH}px;border-bottom:1.5px solid #999;"></div>`;
    };

    // Wörter an Trennern aufteilen
    const groups = [];
    let cur = [];
    for (const item of items) {
      if (item.anlaut === "__sep__") { if (cur.length) groups.push(cur); cur = []; }
      else cur.push(item);
    }
    if (cur.length) groups.push(cur);
    if (!groups.length) return atHtml(d);

    const innerGap = 4; // fester Abstand zwischen Buchstaben innerhalb eines Wortes

    const groupHtml = groups.map(grp => {
      const imgRow = grp.map(item => {
        const src = item.src || anlautDefaultSrc(item.anlaut);
        return anlautImg(src, imgSize);
      }).join(`<div style="width:${innerGap}px;"></div>`);

      const sfWidth = grp.length * imgSize + (grp.length - 1) * innerGap;
      const boxRow = grp.map(item => kaestchen(item.anlaut))
        .join(`<div style="width:${innerGap}px;"></div>`);

      return `<div style="display:inline-flex;flex-direction:column;gap:4px;">` +
        `<div style="display:flex;">${imgRow}</div>` +
        `<div style="display:flex;">${boxRow}</div>` +
        (schreibfeld ? `<div style="width:${sfWidth}px;">${schreibfeldHtml()}</div>` : '') +
      `</div>`;
    }).join("");

    return atHtml(d) +
      `<div style="display:flex;flex-wrap:wrap;gap:${gap}px;">${groupHtml}</div>`;
  },

  renderProps: d => {
    const font        = d.font        || "inherit";
    const fontSize    = d.fontSize    || 16;
    const imgSize     = d.imgSize     || 52;
    const lineatur    = d.lineatur    ?? 1;
    const schreibfeld  = d.schreibfeld  || false;
    const items       = d.items       || [];
    const gap         = d.gap         ?? 8;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? "#a6e3a1" : "#ddd"};
               background:${active ? "#e8fdf0" : "#fff"};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? "#1e1e2e" : "#999"};">${label}</button>`;

    const itemCells = items.map((item, idx) => {
      if (item.anlaut === "__sep__") {
        return `
          <div style="display:flex;align-items:center;gap:4px;">
            <span style="font-size:10px;color:#aaa;font-style:italic;letter-spacing:1px;">── Trenner ──</span>
          </div>
          <button onclick="event.stopPropagation();gsRemoveItem(${d.id},${idx})"
            style="width:18px;height:18px;border-radius:3px;border:1px solid #ddd;background:#fff;
                   cursor:pointer;font-size:13px;line-height:1;color:#bbb;padding:0;justify-self:end;">×</button>`;
      }
      const src      = item.src || anlautDefaultSrc(item.anlaut);
      const variants = ANLAUT_BILDER[item.anlaut] || [];
      const picker   = variants.map(v => {
        const active = v === src;
        return `<button onclick="event.stopPropagation();gsSetItemSrc(${d.id},${idx},'${v}')"
          title="${anlautWortFromSrc(v)||v}"
          style="padding:1px;border:2px solid ${active?'#89b4fa':'#eee'};border-radius:3px;
                 background:${active?'#e8f0fe':'transparent'};cursor:pointer;line-height:0;">
          <img src="assets/anlaut/${v}.svg" width="20" height="20" style="display:block;object-fit:contain;">
        </button>`;
      }).join("");
      return `
        <div style="display:flex;align-items:center;gap:3px;">
          <span style="font-size:10px;font-weight:700;color:#888;min-width:14px;">${item.anlaut}</span>
          <div style="display:flex;gap:2px;flex-wrap:wrap;">${picker}</div>
        </div>
        <button onclick="event.stopPropagation();gsRemoveItem(${d.id},${idx})"
          style="width:18px;height:18px;border-radius:3px;border:1px solid #ddd;background:#fff;
                 cursor:pointer;font-size:13px;line-height:1;color:#bbb;padding:0;justify-self:end;">×</button>`;
    }).join("");

    const itemRows = items.length
      ? `<div style="display:grid;grid-template-columns:1fr 18px;gap:4px 6px;
                     align-items:center;padding:4px 6px;">${itemCells}</div>`
      : "";

    return `<div class="prow" style="margin-bottom:4px;">
        <div style="display:flex;gap:4px;align-items:center;margin-top:2px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="flex:1;font-size:11px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;">
            ${fontOptions}
          </select>
          <input type="number" min="8" max="32" value="${fontSize}"
            onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:46px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;
                   font-family:inherit;font-size:11px;text-align:center;">
        </div>
      </div>` +
      `<div class="prow">
        <label>Wörter eingeben</label>
        <div style="display:flex;gap:4px;margin-top:4px;">
          <input type="text" id="gs-words-${d.id}" placeholder="BAUM, HAUS, BALL"
            value="${esc(d.wordsText || '')}"
            onclick="event.stopPropagation()"
            onkeydown="if(event.key==='Enter'){event.stopPropagation();gsSetWords(${d.id},this.value);}"
            style="flex:1;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;
                   font-family:inherit;font-size:12px;">
          <button onclick="event.stopPropagation();const inp=document.getElementById('gs-words-${d.id}');gsSetWords(${d.id},inp.value);"
            style="padding:3px 8px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                   font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;">↵</button>
        </div>
      </div>` +
      (items.length ? `<div class="prow">
        <label>Liste</label>
        <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-top:4px;">${itemRows}</div>
      </div>` : "") +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", d.modus !== "gross", `gsModus(${d.id},'klein')`)}
          ${toggleBtn("Groß",  d.modus === "gross", `gsModus(${d.id},'gross')`)}
        </div></div>` +
      pr("Bildgröße (px)",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="30" max="120" value="${imgSize}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'imgSize',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:36px;">${imgSize}px</span>
        </div>`) +
      pr("Abstand",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="2" max="40" value="${gap}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'gap',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:30px;">${gap}px</span>
        </div>`) +
      pr("Lineatur",
        `<select onchange="upd(${d.id},'lineatur',+this.value)"
          style="width:100%;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;">
          <option value="0" ${lineatur === 0 ? "selected" : ""}>Einfache Linie</option>
          <option value="1" ${lineatur === 1 ? "selected" : ""}>Lineatur 1 (1. Klasse)</option>
          <option value="2" ${lineatur === 2 ? "selected" : ""}>Lineatur 2 (2. Klasse)</option>
        </select>`) +
      `<div class="prow"><label>Schreibfeld</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !schreibfeld, `upd(${d.id},'schreibfeld',false)`)}
          ${toggleBtn("An",   schreibfeld, `upd(${d.id},'schreibfeld',true)`)}
        </div></div>` ;
  },
});

// ── Geheimschrift helpers ──────────────────────────────────────────────────

function gsAddItem(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = [...(w.items || []), { anlaut, src: anlautDefaultSrc(anlaut) }];
  render(); renderProps(id);
}

function gsRemoveItem(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = (w.items || []).filter((_, i) => i !== idx);
  render(); renderProps(id);
}

function gsSetItemSrc(id, idx, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  items[idx] = { ...items[idx], src };
  w.items = items;
  render(); renderProps(id);
}

function gsShuffleItems(id) {
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

function gsModus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.modus = modus;
  const font = "'Grundschrift', sans-serif";
  if (modus === "klein") {
    Object.assign(w, { lineaturGross: false, fontSize: 16, imgSize: 52, font });
  } else {
    Object.assign(w, { lineaturGross: true, fontSize: 24, imgSize: 66, font });
  }
  render(); renderProps(id);
}

// Wort in Anlaut-Tokens aufteilen (Sch, Eu, Ei, St, Sp als Einheit)
function gsTokenizeWord(word) {
  const tokens = [];
  let i = 0;
  while (i < word.length) {
    const c3 = word.slice(i, i + 3).toUpperCase();
    const c2 = word.slice(i, i + 2).toUpperCase();
    if      (c3 === "SCH")           { tokens.push("Sch"); i += 3; }
    else if (c2 === "AU")            { tokens.push("Au");  i += 2; }
    else if (c2 === "EU")            { tokens.push("Eu");  i += 2; }
    else if (c2 === "EI")            { tokens.push("Ei");  i += 2; }
    else if (c2 === "ST")            { tokens.push("St");  i += 2; }
    else if (c2 === "SP")            { tokens.push("Sp");  i += 2; }
    else { tokens.push(word[i].toUpperCase()); i++; }
  }
  return tokens;
}

// Kommagetrennte Wörter als Items setzen (Trenner zwischen Wörtern)
function gsSetWords(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!text.trim()) return;
  saveHistory();
  w.wordsText = text;
  const words = text.split(",").map(s => s.trim()).filter(Boolean);
  const newItems = [];
  words.forEach((word, wi) => {
    if (wi > 0) newItems.push({ anlaut: "__sep__" });
    gsTokenizeWord(word).forEach(anlaut => {
      if (ANLAUT_BILDER[anlaut]) {
        newItems.push({ anlaut, src: anlautDefaultSrc(anlaut) });
      }
    });
  });
  w.items = newItems;
  render(); renderProps(id);
}
