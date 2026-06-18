// Widget: Wort-Schreiben
// Anlautbild | Schreiblinie (ohne Wortkarten)
WIDGETS.push({
  meta: {
    type: "wortschreiben",
    group: "anlaut",
    label: "Wort-Schreiben",
    desc: "Bild + Schreibleinie",
    icon: "🔤✏",
    category: "deutsch",
  },

  createData: id => {
    const mkItem = anlaut => {
      const src = anlautDefaultSrc(anlaut);
      return { anlaut, src };
    };
    const items = [mkItem("A"), mkItem("B"), mkItem("C")];
    return {
      id, type: "wortschreiben",
      items,
      modus: "klein",
      font: "'Grundschrift', sans-serif", fontSize: 16,
      imgSize: 52,
      lineatur: 1, lineaturGross: false,
      beispiel: false, beispielText: anlautWortFromSrc(items[0].src) || items[0].anlaut,
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
    const beispiel      = d.beispiel      || false;
    const beispielText  = d.beispielText  ?? "";

    // Backward compat
    const items = d.items || [];

    const answerFs = (lineatur === 1 ? 20 : 22) * lMul;

    const textOverlay = (answer, bottomPx) =>
      `<div style="position:absolute;top:0;left:4px;right:4px;bottom:${bottomPx}px;` +
      `display:flex;align-items:flex-end;pointer-events:none;">` +
      `<span style="font-size:${answerFs}px;font-family:${font};` +
      `line-height:1;white-space:nowrap;overflow:visible;color:#222;">${esc(answer)}</span></div>`;

    const writeLine = (answer) => {
      if (lineatur === 1) {
        return `<div style="padding:2px 6px;">` +
          `<div style="position:relative;border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;">` +
            `<div style="height:${11*lMul}px;border-top:1px solid #bbb;"></div>` +
            `<div style="height:${11*lMul}px;border-top:1px solid #bbb;background:#dff0f8;"></div>` +
            `<div style="height:${11*lMul}px;border-top:2px solid #777;"></div>` +
            `<div style="height:${3*lMul}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>` +
            (answer !== undefined ? textOverlay(answer, 14*lMul - Math.round(answerFs * 0.2)) : ``) +
          `</div></div>`;
      }
      if (lineatur === 2) {
        return `<div style="padding:2px 6px;">` +
          `<div style="position:relative;background:#fff;">` +
            `<div style="height:${16*lMul}px;border-top:1px dashed #bbb;"></div>` +
            `<div style="height:${5*lMul}px;border-top:2px solid #777;"></div>` +
            `<div style="height:${4*lMul}px;border-top:1px solid #bbb;"></div>` +
            (answer !== undefined ? textOverlay(answer, 9*lMul - Math.round(answerFs * 0.2)) : ``) +
          `</div></div>`;
      }
      const off0 = Math.round(answerFs * 0.1);
      const h = answer !== undefined ? answerFs + 10 : fontSize + 10;
      return `<div style="padding:2px 6px;">` +
        `<div style="position:relative;height:${h}px;border-bottom:1.5px solid #999;">` +
          (answer !== undefined ? textOverlay(answer, off0) : ``) +
        `</div></div>`;
    };

    const imgCell = (item, id) => {
      const src = item.src || anlautDefaultSrc(item.anlaut);
      return `<div style="padding:2px 6px;">` +
        (id ? `<span id="${id}" style="display:inline-block;">` : "") +
        anlautImg(src, imgSize) +
        (id ? `</span>` : "") +
        `</div>`;
    };

    const gridStyle =
      `display:grid;grid-template-columns:max-content 10px 1fr;` +
      `row-gap:6px;align-items:center;width:100%;`;

    const rows = items.map((item, i) => {
      const isFirst = beispiel && i === 0;
      const answer  = isFirst ? beispielText : undefined;
      return imgCell(item, isFirst ? `wsleft-${d.id}` : null) +
        `<div></div>` +
        writeLine(answer);
    }).join("");

    return atHtml(d) + `<div style="${gridStyle}">${rows}</div>`;
  },

  renderProps: d => {
    const font          = d.font          || "inherit";
    const fontSize      = d.fontSize      || 16;
    const imgSize       = d.imgSize       || 52;
    const lineatur      = d.lineatur      ?? 1;
    const beispiel      = d.beispiel      || false;
    const beispielText  = d.beispielText  ?? "";

    const items = d.items || [];

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
      return `<button onclick="event.stopPropagation();wortSchreibenAddItem(${d.id},'${l}')"
        style="width:${isLong?34:26}px;height:26px;border-radius:4px;border:1.5px solid #ddd;
               background:#fff;font-family:inherit;font-size:${isLong?9:11}px;font-weight:700;
               cursor:pointer;color:#555;">+${l}</button>`;
    }).join("");

    const itemCells = items.map((item, idx) => {
      const src      = item.src || anlautDefaultSrc(item.anlaut);
      const variants = ANLAUT_BILDER[item.anlaut] || [];
      const picker   = variants.map(v => {
        const active = v === src;
        return `<button onclick="event.stopPropagation();wortSchreibenSetItemSrc(${d.id},${idx},'${v}')"
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
        <button onclick="event.stopPropagation();wortSchreibenRemoveItem(${d.id},${idx})"
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
        <label>Buchstaben</label>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:4px;">${letterBtns}</div>
      </div>` +
      (items.length ? `<div class="prow">
        <label>Liste</label>
        <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-top:4px;">${itemRows}</div>
        <button onclick="event.stopPropagation();wortSchreibenShuffleItems(${d.id})"
          style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;
                 background:#313244;color:#cdd6f4;font-family:inherit;font-size:11px;
                 font-weight:700;cursor:pointer;">🔀 Reihenfolge mischen</button>
      </div>` : "") +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", d.modus !== "gross", `wortSchreibenModus(${d.id},'klein')`)}
          ${toggleBtn("Groß",  d.modus === "gross", `wortSchreibenModus(${d.id},'gross')`)}
        </div></div>` +
      pr("Bildgröße (px)",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="30" max="120" value="${imgSize}"
            oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'imgSize',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:36px;">${imgSize}px</span>
        </div>`) +
      pr("Lineatur",
        `<select onchange="upd(${d.id},'lineatur',+this.value)"
          style="width:100%;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;">
          <option value="0" ${lineatur === 0 ? "selected" : ""}>Einfache Linie</option>
          <option value="1" ${lineatur === 1 ? "selected" : ""}>Lineatur 1 (1. Klasse)</option>
          <option value="2" ${lineatur === 2 ? "selected" : ""}>Lineatur 2 (2. Klasse)</option>
        </select>`) +
      `<div class="prow"><label>Beispiel (1. Zeile)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !beispiel, `upd(${d.id},'beispiel',false)`)}
          ${toggleBtn("An",   beispiel, `upd(${d.id},'beispiel',true)`)}
        </div></div>` +
      (beispiel ? pr("Text auf der Linie",
        `<input type="text" value="${esc(beispielText)}"
          onchange="upd(${d.id},'beispielText',this.value)"
          style="width:100%;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;">`) : "") ;
  },
});

// ── Wort-Schreiben helpers ─────────────────────────────────────────────────

function wortSchreibenAddItem(id, anlaut) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const src = anlautDefaultSrc(anlaut);
  const wasEmpty = !(w.items && w.items.length);
  w.items = [...(w.items || []), { anlaut, src }];
  if (wasEmpty) w.beispielText = anlautWortFromSrc(src) || anlaut;
  render(); renderProps(id);
}

function wortSchreibenRemoveItem(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = (w.items || []).filter((_, i) => i !== idx);
  if (idx === 0 && w.items[0]) w.beispielText = anlautWortFromSrc(w.items[0].src) || w.items[0].anlaut;
  render(); renderProps(id);
}

function wortSchreibenSetItemSrc(id, idx, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  items[idx] = { ...items[idx], src };
  w.items = items;
  if (idx === 0) w.beispielText = anlautWortFromSrc(src) || items[0].anlaut;
  render(); renderProps(id);
}

function wortSchreibenShuffleItems(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = [...(w.items || [])];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  w.items = items;
  if (items[0]) w.beispielText = anlautWortFromSrc(items[0].src) || items[0].anlaut;
  render(); renderProps(id);
}

function wortSchreibenModus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.modus = modus;
  const font = "'Grundschrift', sans-serif";
  if (modus === "klein") {
    Object.assign(w, { lineaturGross: false, fontSize: 16, imgSize: 52, font });
  } else {
    Object.assign(w, { lineaturGross: true, fontSize: 28, imgSize: 66, font });
  }
  render(); renderProps(id);
}
