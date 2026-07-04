// Widget: Zuordnung (2- oder 3-spaltig je nach Eingabeformat)
WIDGETS.push({
  meta: { type:"matching", label:"Zuordnung", desc:"Paare verbinden", icon:"↔", category:"deutsch" },

  createData: id => {
    const pairs = [["Hund","bellen"],["Katze","miauen"],["Kuh","muhen"]];
    return { id, type:"matching", pairs, rightOrder: matchingShuffleIdx(pairs.length),
             rightOrder2: null, font:"inherit", fontSize:13, gap:24,
             layout:"vertikal",
             schreiblinien:false, beispiel:false, beispielText:"Der Hund bellt.",
             aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const font          = d.font          || "inherit";
    const fontSize      = d.fontSize      || 13;
    const gap           = d.gap           ?? 24;
    const schreiblinien = d.schreiblinien || false;
    const beispiel      = d.beispiel      || false;
    const beispielText  = d.beispielText  ?? "";
    const is3           = d.pairs.length > 0 && d.pairs[0].length >= 3;

    let order  = d.rightOrder  || matchingShuffleIdx(d.pairs.length);
    let order2 = is3 ? (d.rightOrder2 || matchingShuffleIdx(d.pairs.length)) : null;

    // Beispiel: matching card for pair 0 must not be in row 0
    if (beispiel && d.pairs.length > 1) {
      if (order[0] === 0) {
        order = [...order];
        [order[0], order[1]] = [order[1], order[0]];
      }
      if (is3 && order2[0] === 0) {
        order2 = [...order2];
        [order2[0], order2[1]] = [order2[1], order2[0]];
      }
    }

    const left   = d.pairs.map(p => p[0]);
    const right1 = order.map(i => d.pairs[i][1]);
    const right2 = is3 ? order2.map(i => d.pairs[i][2]) : null;
    const exPos  = beispiel ? order.indexOf(0)  : -1;
    const exPos2 = (beispiel && is3) ? order2.indexOf(0) : -1;

    const card = (val, id) =>
      `<div style="padding:3px 6px;font-size:${fontSize}px;font-family:${font};white-space:nowrap;">` +
      `<span ${id?`id="${id}"`:''}` +
      ` style="display:block;border:1.5px solid #bbb;border-radius:5px;background:#fff;` +
      `padding:3px 10px;text-align:center;">${esc(val)}</span></div>`;

    const writeLine = (answer) =>
      `<div style="padding:3px 6px;">` +
      `<span style="display:block;height:${fontSize+8}px;border-bottom:1.5px solid #bbb;` +
      (answer !== undefined
        ? `font-size:${fontSize}px;font-family:${font};color:#999;line-height:${fontSize+8}px;padding:0 2px;">${esc(answer)}</span>`
        : `"></span>`) +
      `</div>`;

    const layout = d.layout || "vertikal";

    // ── Horizontal layout: each row group stacked (Zeile 1 = linke Karten, Zeile 2 = rechte Karten) ──
    if (layout === "horizontal") {
      const rowStyle = `display:flex;gap:${gap}px;align-items:flex-start;flex-wrap:wrap;`;

      const topRow = left.map((val, i) => {
        const leftId = (beispiel && i === 0) ? `mleft-${d.id}` : null;
        return card(val, leftId);
      }).join("");

      const midRow = right1.map((val, i) => {
        const midId = (beispiel && i === exPos) ? `mmid-${d.id}` : null;
        return card(val, midId);
      }).join("");

      const mid2Row = is3 ? right2.map((val, i) => {
        const rightId = (beispiel && i === exPos2) ? `mright2-${d.id}` : null;
        return card(val, rightId);
      }).join("") : "";

      const lineRow = schreiblinien ? left.map((_, i) => {
        const writeTxt = is3 ? (i === exPos2 ? beispielText : undefined)
                              : (i === exPos  ? beispielText : undefined);
        return writeLine(writeTxt);
      }).join("") : "";

      let hHtml = `<div style="${rowStyle}">${topRow}</div>`;
      hHtml += `<div style="${rowStyle};margin-top:${gap}px;">${midRow}</div>`;
      if (is3)         hHtml += `<div style="${rowStyle};margin-top:${gap}px;">${mid2Row}</div>`;
      if (schreiblinien) hHtml += `<div style="${rowStyle};margin-top:6px;">${lineRow}</div>`;

      if (!beispiel) return atHtml(d) + hHtml;

      const lines = is3
        ? `<line id="mline1-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5"/>` +
          `<line id="mline2-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5"/>`
        : `<line id="mline1-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5"/>`;
      const drawCall = is3
        ? `matchingDraw('mbox-${d.id}','mleft-${d.id}','mmid-${d.id}','mline1-${d.id}','mmid-${d.id}','mright2-${d.id}','mline2-${d.id}')`
        : `matchingDraw('mbox-${d.id}','mleft-${d.id}','mmid-${d.id}','mline1-${d.id}')`;
      return atHtml(d) +
        `<div id="mbox-${d.id}" style="position:relative;display:block;width:100%;">` +
          `<svg style="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;overflow:visible;">${lines}</svg>` +
          hHtml +
          `<img src="data:image/png;base64,!" onerror="${drawCall}" style="display:none">` +
        `</div>`;
    }

    // ── Vertikal layout (default): grid with left | gap | right ──
    const gapDiv     = `<div></div>`;
    const spacerDiv  = `<div></div>`;

    // Grid column template: exact px for gaps, 1fr for write line
    const colTpl = [
      `max-content`, `${gap}px`, `max-content`,
      ...(is3 ? [`${gap}px`, `max-content`] : []),
      ...(schreiblinien ? [`10px`, `1fr`] : []),
    ].join(` `);

    const gridStyle = `display:${schreiblinien?'grid':'inline-grid'};` +
      `grid-template-columns:${colTpl};row-gap:5px;align-items:center;` +
      (schreiblinien ? `width:100%;` : ``);

    const rows = left.map((_, i) => {
      const leftId  = (beispiel && i === 0)     ? `mleft-${d.id}`   : null;
      const midId   = (beispiel && i === exPos)  ? `mmid-${d.id}`    : null;
      const rightId = (beispiel && i === exPos2) ? `mright2-${d.id}` : null;
      const writeTxt = schreiblinien
        ? (is3 ? (i === exPos2 ? beispielText : undefined)
                : (i === exPos  ? beispielText : undefined))
        : undefined;
      return card(left[i], leftId) + gapDiv +
        card(right1[i], midId) +
        (is3 ? gapDiv + card(right2[i], rightId) : ``) +
        (schreiblinien ? spacerDiv + writeLine(writeTxt) : ``);
    }).join("");

    const tableHtml = `<div style="${gridStyle}">${rows}</div>`;

    if (!beispiel) return atHtml(d) + tableHtml;

    // SVG overlay for connecting line(s)
    const lines = is3
      ? `<line id="mline1-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5" stroke-dasharray="none"/>` +
        `<line id="mline2-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5" stroke-dasharray="none"/>`
      : `<line id="mline1-${d.id}" x1="0" y1="0" x2="0" y2="0" stroke="#ccc" stroke-width="1.5" stroke-dasharray="none"/>`;

    const drawCall = is3
      ? `matchingDraw('mbox-${d.id}','mleft-${d.id}','mmid-${d.id}','mline1-${d.id}','mmid-${d.id}','mright2-${d.id}','mline2-${d.id}')`
      : `matchingDraw('mbox-${d.id}','mleft-${d.id}','mmid-${d.id}','mline1-${d.id}')`;

    const boxDisplay = schreiblinien ? `display:block;width:100%;` : `display:inline-block;`;
    return atHtml(d) +
      `<div id="mbox-${d.id}" style="position:relative;${boxDisplay}">` +
        `<svg style="position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;overflow:visible;">${lines}</svg>` +
        tableHtml +
        `<img src="data:image/png;base64,!" onerror="${drawCall}" style="display:none">` +
      `</div>`;
  },

  renderProps: d => {
    const font          = d.font          || "inherit";
    const fontSize      = d.fontSize      || 13;
    const gap           = d.gap           ?? 24;
    const schreiblinien = d.schreiblinien || false;
    const beispiel      = d.beispiel      || false;
    const beispielText  = d.beispielText  ?? "Der Hund bellt.";
    const is3           = d.pairs.length > 0 && d.pairs[0].length >= 3;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const hint = is3 ? "a=b=c (3 Cards)" : "links=rechts";

    return `<div class="prow" style="margin-bottom:2px;">
        <label>Paare <span style="font-weight:400;color:#aaa;font-size:10px;">(${hint})</span></label>
        <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="flex:1;font-size:11px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;">
            ${fontOptions}
          </select>
          <input type="number" min="8" max="32" value="${fontSize}"
            onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:46px;padding:2px 4px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:11px;text-align:center;">
        </div>
      </div>
      <textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
        onchange="matchingUpdate(${d.id},this.value)">${d.pairs.map(p=>p.join("=")).join("\n")}</textarea>` +
      `<button onclick="event.stopPropagation();matchingReshuffle(${d.id})"
        style="margin-top:4px;width:100%;padding:5px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
               font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">🔀 Neu mischen</button>` +
      pr("Abstand",
        `<div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="4" max="80" value="${gap}" oninput="this.nextElementSibling.textContent=this.value+'px'"
            onchange="upd(${d.id},'gap',+this.value)"
            style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:30px;">${gap}px</span>
        </div>`) +
      `<div class="prow"><label>Anordnung</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Vertikal",   (d.layout||"vertikal")==="vertikal",   `upd(${d.id},'layout','vertikal')`)}
          ${toggleBtn("Horizontal", (d.layout||"vertikal")==="horizontal", `upd(${d.id},'layout','horizontal')`)}
        </div></div>` +
      `<div class="prow"><label>Schreiblinien (3. Spalte)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !schreiblinien, `upd(${d.id},'schreiblinien',false)`)}
          ${toggleBtn("An",   schreiblinien, `upd(${d.id},'schreiblinien',true)`)}
        </div></div>` +
      `<div class="prow"><label>Beispiel (1. Zeile)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !beispiel, `upd(${d.id},'beispiel',false)`)}
          ${toggleBtn("An",   beispiel, `upd(${d.id},'beispiel',true)`)}
        </div></div>` +
      (beispiel ? pr("Text auf der Linie",
        `<input type="text" value="${esc(beispielText)}"
          onchange="upd(${d.id},'beispielText',this.value)"
          style="width:100%;padding:3px 6px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;">`) : "") ;
  },
});

// ── Matching helpers ──────────────────────────────────────────────
function matchingShuffleIdx(n) {
  const arr = Array.from({length: n}, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function matchingReshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const is3 = w.pairs.length > 0 && w.pairs[0].length >= 3;
  w.rightOrder  = matchingShuffleIdx(w.pairs.length);
  w.rightOrder2 = is3 ? matchingShuffleIdx(w.pairs.length) : null;
  render(); renderProps(id);
}

function matchingUpdate(id, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.pairs = value.split('\n').filter(l => l.includes('=')).map(l =>
    l.split('=').map(p => p.trim())
  );
  const is3 = w.pairs.some(p => p.length >= 3);
  w.rightOrder  = matchingShuffleIdx(w.pairs.length);
  w.rightOrder2 = is3 ? matchingShuffleIdx(w.pairs.length) : null;
  if (is3 && w.beispielText === "Der Hund bellt.") w.beispielText = "";
  render(); renderProps(id);
}

// Draws one or more SVG connecting lines between card spans
// matchingDraw(boxId, fromId1, toId1, lineId1 [, fromId2, toId2, lineId2, ...])
// Asynchron (rAF) für den Bildschirm; matchingDrawNow misst synchron
// (nötig für den Lösungsdruck, wo vor window.print() kein Frame mehr läuft).
function matchingDraw(boxId, ...segments) {
  requestAnimationFrame(() => matchingDrawNow(boxId, ...segments));
}

function matchingDrawNow(boxId, ...segments) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const br = box.getBoundingClientRect();
  for (let i = 0; i + 2 < segments.length; i += 3) {
    const lEl  = document.getElementById(segments[i]);
    const rEl  = document.getElementById(segments[i+1]);
    const line = document.getElementById(segments[i+2]);
    if (!lEl || !rEl || !line) continue;
    const lr = lEl.getBoundingClientRect();
    const rr = rEl.getBoundingClientRect();
    line.setAttribute('x1', lr.right  - br.left);
    line.setAttribute('y1', (lr.top + lr.bottom) / 2 - br.top);
    line.setAttribute('x2', rr.left   - br.left);
    line.setAttribute('y2', (rr.top + rr.bottom) / 2 - br.top);
  }
}
