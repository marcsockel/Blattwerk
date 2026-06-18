// Widget: Buchstabensalat 2
// Buchstaben in 2D gestreut + Bild + Schreibleinie
WIDGETS.push({
  meta: {
    type: "buchstabensalat2",
    group: "anlaut",
    label: "Buchstabensalat 2",
    desc: "Buchstaben 2D + Bild + Linie",
    icon: "🔀✏",
    category: "deutsch",
  },

  createData: id => {
    const mkItem = anlaut => ({ anlaut, src: anlautDefaultSrc(anlaut) });
    const items = [mkItem("A"), mkItem("B"), mkItem("C")];
    return {
      id, type: "buchstabensalat2",
      items,
      itemsPerRow: 3,
      modus: "klein",
      font: "'Grundschrift', sans-serif", fontSize: 18,
      imgSize: 40,
      boxHeight: 80,
      gap: 10,
      lineatur: 1, lineaturGross: false,
      erstBuchstabeUnterstreichen: false,
      beispiel: false,
      beispielText: anlautWortFromSrc(items[0].src) || items[0].anlaut,
      aufgabenNr: 0, aufgabenText: "",
    };
  },

  render: d => {
    const font                      = d.font                      || "inherit";
    const fontSize                  = d.fontSize                  || 18;
    const imgSize                   = d.imgSize                   || 40;
    const lineatur                  = d.lineatur                  ?? 1;
    const lineaturGross             = d.lineaturGross             || false;
    const lMul                      = lineaturGross ? 1.5 : 1;
    const itemsPerRow               = d.itemsPerRow               || 3;
    const boxHeight                 = d.boxHeight                 || 80;
    const gap                       = d.gap                       ?? 10;
    const erstBuchstabeUnterstreichen = d.erstBuchstabeUnterstreichen || false;
    const beispiel                  = d.beispiel                  || false;
    const beispielText              = d.beispielText              ?? "";
    const items                     = d.items                     || [];

    const answerFs = (lineatur === 1 ? 20 : 22) * lMul;

    const textOverlay = (answer, bottomPx) =>
      `<div style="position:absolute;top:0;left:4px;right:4px;bottom:${bottomPx}px;` +
      `display:flex;align-items:flex-end;pointer-events:none;">` +
      `<span style="font-size:${answerFs}px;font-family:${font};` +
      `line-height:1;white-space:nowrap;overflow:visible;color:#222;">${esc(answer)}</span></div>`;

    const writeLine = (answer) => {
      if (lineatur === 1) {
        return `<div style="padding:2px 0;">` +
          `<div style="position:relative;border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;">` +
            `<div style="height:${11*lMul}px;border-top:1px solid #bbb;"></div>` +
            `<div style="height:${11*lMul}px;border-top:1px solid #bbb;background:#dff0f8;"></div>` +
            `<div style="height:${11*lMul}px;border-top:2px solid #777;"></div>` +
            `<div style="height:${3*lMul}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
            (answer !== undefined ? textOverlay(answer, 14*lMul - Math.round(answerFs * 0.2)) : '') +
          `</div></div>`;
      }
      if (lineatur === 2) {
        return `<div style="padding:2px 0;">` +
          `<div style="position:relative;background:#fff;">` +
            `<div style="height:${16*lMul}px;border-top:1px dashed #bbb;"></div>` +
            `<div style="height:${5*lMul}px;border-top:2px solid #777;"></div>` +
            `<div style="height:${4*lMul}px;border-top:1px solid #bbb;"></div>` +
            (answer !== undefined ? textOverlay(answer, 9*lMul - Math.round(answerFs * 0.2)) : '') +
          `</div></div>`;
      }
      const h = answer !== undefined ? answerFs + 10 : fontSize + 10;
      return `<div style="padding:2px 0;">` +
        `<div style="position:relative;height:${h}px;border-bottom:1.5px solid #999;">` +
          (answer !== undefined ? textOverlay(answer, Math.round(answerFs * 0.1)) : '') +
        `</div></div>`;
    };

    const scatterBox = (word, src, idx) => {
      const emptyBox = `<div style="height:${boxHeight}px;border:1.5px solid #ddd;` +
        `border-radius:4px;background:#fafafa;display:flex;align-items:center;padding:4px;">` +
        anlautImg(src, imgSize) + `</div>`;

      if (!word) return emptyBox;

      const tokens = bs2Tokenize(word);
      const n = tokens.length;

      // Wrap tokens with original-index info so we can track the first one
      const tokenObjs = tokens.map((tok, i) => ({ tok, isFirst: i === 0 }));

      // Seeded from word content + position
      const baseSeed = (word.split('').reduce(
        (acc, c) => ((acc * 31 + c.charCodeAt(0)) & 0x7fffffff), 0
      ) + idx * 1009 + d.id * 17) >>> 0;

      // Shuffle preserving isFirst metadata
      let shuffled = seededShuffle(tokenObjs, baseSeed);

      // Ensure not identical to original order (try different seeds)
      for (let t = 1; t < 8 && n > 1 && shuffled.map(o => o.tok).join('') === word; t++) {
        shuffled = seededShuffle(tokenObjs, baseSeed + t * 997);
      }

      // Seeded PRNG for positions
      let s = (baseSeed * 1664525 + 1013904223) >>> 0;
      const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
      };

      // Grid-with-jitter placement (percentage coords within right portion)
      const cols = Math.max(2, Math.ceil(Math.sqrt(n * 2.2)));
      const rows = Math.ceil(n / cols);
      const xUsable = 84;
      const yUsable = 72;
      const xOff    = 5;
      const yOff    = 10;

      const posHtml = shuffled.map(({ tok, isFirst }, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cellW = xUsable / cols;
        const cellH = yUsable / rows;
        const baseX = xOff + (col + 0.5) * cellW;
        const baseY = yOff + (row + 0.5) * cellH;
        const jx = (rand() - 0.5) * cellW * 0.4;
        const jy = (rand() - 0.5) * cellH * 0.4;
        const x = Math.max(2, Math.min(90, baseX + jx));
        const y = Math.max(4, Math.min(82, baseY + jy));
        const underline = erstBuchstabeUnterstreichen && isFirst
          ? 'border-bottom:2px solid #222;padding-bottom:1px;'
          : '';
        return `<span style="position:absolute;left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;` +
          `font-size:${fontSize}px;font-family:${font};line-height:1;color:#222;` +
          `transform:translate(-50%,-50%);user-select:none;${underline}">${esc(tok)}</span>`;
      }).join('');

      // Image pinned to left inside the box, letters fill the rest
      return `<div style="display:flex;align-items:center;width:100%;height:${boxHeight}px;` +
        `border:1.5px solid #aaa;border-radius:4px;overflow:hidden;background:#fff;">` +
        `<div style="flex-shrink:0;padding:4px;">${anlautImg(src, imgSize)}</div>` +
        `<div style="position:relative;flex:1;height:100%;">` +
          posHtml +
        `</div>` +
      `</div>`;
    };

    const itemCards = items.map((item, i) => {
      const src    = item.src || anlautDefaultSrc(item.anlaut);
      const word   = anlautWortFromSrc(src) || item.anlaut;
      const answer = (beispiel && i === 0) ? beispielText : undefined;
      return `<div style="display:flex;flex-direction:column;gap:4px;">` +
        scatterBox(word, src, i) +
        writeLine(answer) +
      `</div>`;
    }).join('');

    const gridStyle =
      `display:grid;grid-template-columns:repeat(${itemsPerRow},1fr);gap:${gap}px;`;

    return atHtml(d) + `<div style="${gridStyle}">${itemCards}</div>`;
  },

  renderProps: d => {
    const font                        = d.font                        || "inherit";
    const fontSize                    = d.fontSize                    || 18;
    const imgSize                     = d.imgSize                     || 40;
    const lineatur                    = d.lineatur                    ?? 1;
    const beispiel                    = d.beispiel                    || false;
    const beispielText                = d.beispielText                ?? "";
    const erstBuchstabeUnterstreichen = d.erstBuchstabeUnterstreichen || false;
    const items                       = d.items                       || [];
    const itemsPerRow                 = d.itemsPerRow                 || 3;
    const boxHeight                   = d.boxHeight                   || 80;
    const gap                         = d.gap                         ?? 10;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? "#a6e3a1" : "#ddd"};
               background:${active ? "#e8fdf0" : "#fff"};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? "#1e1e2e" : "#999"};">${label}</button>`;

    const available = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["Ä","Ö","Ü","ß","Au","Ei","Eu","Sch","Sp","St"]);

    const letterBtns = available.map(l => {
      const isLong = l.length > 1;
      return `<button onclick="event.stopPropagation();bs2AddItem(${d.id},'${l}')"
        style="width:${isLong?34:26}px;height:26px;border-radius:4px;border:1.5px solid #ddd;
               background:#fff;font-family:inherit;font-size:${isLong?9:11}px;font-weight:700;
               cursor:pointer;color:#555;">+${l}</button>`;
    }).join("");

    const itemCells = items.map((item, idx) => {
      const src      = item.src || anlautDefaultSrc(item.anlaut);
      const variants = ANLAUT_BILDER[item.anlaut] || [];
      const picker   = variants.map(v => {
        const active = v === src;
        return `<button onclick="event.stopPropagation();bs2SetItemSrc(${d.id},${idx},'${v}')"
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
        <button onclick="event.stopPropagation();bs2RemoveItem(${d.id},${idx})"
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
          <input type="number" min="10" max="36" value="${fontSize}"
            onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:46px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;
                   font-family:inherit;font-size:11px;text-align:center;">
        </div>
      </div>` +
      `<div class="prow">
        <label>Buchstaben</label>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${letterBtns}</div>
      </div>` +
      (items.length ? `<div class="prow">
        <label>Liste</label>
        <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-top:4px;">${itemRows}</div>
        <button onclick="event.stopPropagation();bs2ShuffleItems(${d.id})"
          style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;
                 background:#313244;color:#cdd6f4;font-family:inherit;font-size:11px;
                 font-weight:700;cursor:pointer;">🔀 Reihenfolge mischen</button>
      </div>` : "") +
      pr("Items pro Reihe",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="1" max="6" value="${itemsPerRow}"
            oninput="this.nextElementSibling.textContent=this.value"
            onchange="upd(${d.id},'itemsPerRow',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:16px;">${itemsPerRow}</span>
        </div>`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", d.modus !== "gross", `bs2Modus(${d.id},'klein')`)}
          ${toggleBtn("Groß",  d.modus === "gross", `bs2Modus(${d.id},'gross')`)}
        </div></div>` +
      pr("Bildgröße (px)",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="20" max="80" value="${imgSize}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'imgSize',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:36px;">${imgSize}px</span>
        </div>`) +
      pr("Box-Höhe (px)",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="50" max="160" value="${boxHeight}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'boxHeight',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:36px;">${boxHeight}px</span>
        </div>`) +
      pr("Abstand",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="4" max="60" value="${gap}"
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
      `<div class="prow"><label>Ersten Buchstaben unterstreichen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !erstBuchstabeUnterstreichen, `upd(${d.id},'erstBuchstabeUnterstreichen',false)`)}
          ${toggleBtn("An",   erstBuchstabeUnterstreichen, `upd(${d.id},'erstBuchstabeUnterstreichen',true)`)}
        </div></div>` +
      `<div class="prow"><label>Beispiel (1. Kästchen)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !beispiel, `upd(${d.id},'beispiel',false)`)}
          ${toggleBtn("An",   beispiel, `upd(${d.id},'beispiel',true)`)}
        </div></div>` +
      (beispiel ? pr("Beispielwort",
        `<input type="text" value="${esc(beispielText)}"
          onchange="upd(${d.id},'beispielText',this.value)"
          style="width:100%;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;">`) : "") ;
  },
});

// ── Buchstabensalat 2 helpers ──────────────────────────────────────────────

// Tokenizer: Buchstabengruppen bleiben zusammen (Sch vor ch, dann eu/ei/st/sp/au/ch)
function bs2Tokenize(word) {
  const groups = ["sch", "eu", "ei", "st", "sp", "au", "ch"];
  const tokens = [];
  let i = 0;
  while (i < word.length) {
    let found = false;
    for (const g of groups) {
      if (word.slice(i, i + g.length).toLowerCase() === g) {
        tokens.push(word.slice(i, i + g.length));
        i += g.length;
        found = true;
        break;
      }
    }
    if (!found) { tokens.push(word[i]); i++; }
  }
  return tokens;
}

function bs2AddItem(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const src = anlautDefaultSrc(anlaut);
  const wasEmpty = !(w.items && w.items.length);
  w.items = [...(w.items || []), { anlaut, src }];
  if (wasEmpty) w.beispielText = anlautWortFromSrc(src) || anlaut;
  render(); renderProps(id);
}

function bs2RemoveItem(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = (w.items || []).filter((_, i) => i !== idx);
  if (idx === 0 && w.items[0]) {
    const src = w.items[0].src || anlautDefaultSrc(w.items[0].anlaut);
    w.beispielText = anlautWortFromSrc(src) || w.items[0].anlaut;
  }
  render(); renderProps(id);
}

function bs2SetItemSrc(id, idx, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  items[idx] = { ...items[idx], src };
  w.items = items;
  if (idx === 0) w.beispielText = anlautWortFromSrc(src) || items[0].anlaut;
  render(); renderProps(id);
}

function bs2ShuffleItems(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  w.items = items;
  if (items[0]) {
    const src = items[0].src || anlautDefaultSrc(items[0].anlaut);
    w.beispielText = anlautWortFromSrc(src) || items[0].anlaut;
  }
  render(); renderProps(id);
}

function bs2Modus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.modus = modus;
  const font = "'Grundschrift', sans-serif";
  if (modus === "klein") {
    Object.assign(w, { lineaturGross: false, fontSize: 18, imgSize: 40, boxHeight: 80, font });
  } else {
    Object.assign(w, { lineaturGross: true, fontSize: 26, imgSize: 54, boxHeight: 110, font });
  }
  render(); renderProps(id);
}
