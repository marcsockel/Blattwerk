// Widget: Silbenwort
// Wörter mit Silbenbögen
// Hypher wird von silbentext.js geladen.

// ── Modus: Wortform ───────────────────────────────────────────────
// CSS-Bogen unter jeder Silbe, passt sich automatisch der Breite an
function silbenbogenHTML(word, fontSize) {
  const arcH = Math.round(fontSize * 0.75);

  if (!window._hypherDE) {
    if (!window._hypherFailed) hypherScheduleRender();
    return `<span style="display:inline-block;font-size:${fontSize}px;font-family:inherit;">${esc(word)}</span>`;
  }

  const customEx  = silbenParseAusnahmen(window._silbenCustomText || '');
  const syllables = silbenTrenne(word, customEx);

  const spans = syllables.map(s =>
    `<span style="display:inline-block;position:relative;
                  border-bottom:2px solid #222;
                  border-radius:0 0 50% 50% / 0 0 ${Math.round(fontSize * 0.6)}px ${Math.round(fontSize * 0.6)}px;
                  padding:0 1px ${Math.round(fontSize * 0.5)}px 1px;
                  line-height:1;"
    >${esc(s)}</span>`
  ).join('');

  return `<span style="display:inline-block;font-size:${fontSize}px;font-family:inherit;">${spans}</span>`;
}

// ── Modus: Gleichlang ─────────────────────────────────────────────
// Bögen mindestens arcWidth breit; zu lange Silben bekommen einen breiteren Bogen.
// Breite wird nach Render gemessen und SVG-Pfad entsprechend gesetzt.
function silbenbogenGleichlangHTML(word, fontSize, arcWidth, widgetId, wordIdx) {
  const arcH  = Math.round(fontSize * 0.75);
  const svgH  = arcH + 2;

  if (!window._hypherDE) {
    if (!window._hypherFailed) hypherScheduleRender();
    return `<span style="display:inline-block;font-size:${fontSize}px;font-family:inherit;">${esc(word)}</span>`;
  }

  const customEx  = silbenParseAusnahmen(window._silbenCustomText || '');
  const syllables = silbenTrenne(word, customEx);

  const spans = syllables.map((s, si) => {
    const spanId = `silbegl-${widgetId}-${wordIdx}-${si}`;
    const svg = `<svg id="${spanId}-arc"
                   style="position:absolute;bottom:-3px;left:0;width:100%;height:${svgH}px;"
                   viewBox="0 0 100 ${svgH}" xmlns="http://www.w3.org/2000/svg">
                   <path d="" fill="none" stroke="#222" stroke-width="2"/>
                 </svg>`;
    return `<span id="${spanId}"
                  data-silbegl-widget="${widgetId}"
                  data-arc-h="${svgH}"
                  style="display:inline-block;position:relative;
                         min-width:${arcWidth}px;text-align:center;
                         padding-bottom:${svgH + 1}px;line-height:1;"
            >${esc(s)}${svg}</span>`;
  }).join('');

  return `<span style="display:inline-block;font-size:${fontSize}px;font-family:inherit;">${spans}</span>`;
}

// ── Bögen nach Render messen und zeichnen (Gleichlang) ───────────
function silbenwortDrawGleichlang(widgetId) {
  const steep = 10;
  document.querySelectorAll(`[data-silbegl-widget="${widgetId}"]`).forEach(span => {
    const w    = span.offsetWidth;
    const svgH = parseInt(span.dataset.arcH);
    const svg  = document.getElementById(span.id + '-arc');
    if (!svg || w === 0) return;
    const path = `M 1,1 C ${steep},${svgH - 1} ${w - steep},${svgH - 1} ${w - 1},1`;
    svg.setAttribute('viewBox', `0 0 ${w} ${svgH}`);
    svg.querySelector('path').setAttribute('d', path);
  });
}

// ── Bögen nach Render mit echten Pixelbreiten zeichnen (Wortform) ─
function silbenwortDrawArcs(widgetId) {
  const steep = 10;
  document.querySelectorAll(`[data-silbe-widget="${widgetId}"]`).forEach(span => {
    const w    = span.offsetWidth;
    const svgH = parseInt(span.dataset.arcH);
    const svg  = document.getElementById(span.id + '-arc');
    if (!svg || w === 0) return;
    const path = `M 1,1 C ${steep},${svgH - 1} ${w - steep},${svgH - 1} ${w - 1},1`;
    svg.setAttribute('viewBox', `0 0 ${w} ${svgH}`);
    svg.querySelector('path').setAttribute('d', path);
  });
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: {
    type: "silbenwort",
    label: "Silbenwort",
    desc: "Wörter mit Silbenbögen",
    icon: "⌢",
    category: "deutsch",
  },

  createData: id => ({
    id, type: "silbenwort",
    words: ["Sonne", "Schmetterling", "Apfel", "Hausaufgaben"],
    fontSize: 22,
    font: "inherit",
    modus: "gleichlang", // "wortform" | "gleichlang" | "zeichnen"
    arcWidth: 60,
    cols: 1,
    ausnahmen: "", aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const fontSize = d.fontSize || 22;
    const font     = d.font || "inherit";
    const words    = d.words || [];
    const modus    = d.modus || "wortform";
    const arcWidth = d.arcWidth || 60;

    window._silbenCustomText = d.ausnahmen || '';

    const boxH = 28; // Kastenhöhe im Zeichnen-Modus — fest, wächst NICHT mit der Schrift
    const clean = words.map(w => w.trim()).filter(Boolean);

    const items = clean.map((w, wi) => {
      if (modus === "zeichnen") {
        const wordId = `silbwort-zeichnen-${d.id}-${wi}`;
        // Wort oben, darunter ein Kasten – Breite wird nach Render gemessen
        const box = `<div id="${wordId}-box"
                          style="background:#e6e6e6;border-radius:3px;
                                 height:${boxH}px;margin-top:3px;"></div>`;
        const wordSpan = `<div id="${wordId}"
                               data-zeichnen-widget="${d.id}"
                               style="font-size:${fontSize}px;font-family:${font};
                                      line-height:1.1;white-space:nowrap;"
                          >${esc(w)}</div>`;
        return `<div data-aufg="1" style="display:inline-block;line-height:1.4;margin-bottom:${Math.round(fontSize * 0.6)}px;">${wordSpan}${box}</div>`;
      }
      const inner = modus === "gleichlang"
        ? silbenbogenGleichlangHTML(w, fontSize, arcWidth, d.id, wi)
        : silbenbogenHTML(w, fontSize);
      // white-space:nowrap → ein Wort wird NIE über zwei Zeilen getrennt
      return `<div data-aufg="1" style="font-family:${font};line-height:1.4;white-space:nowrap;margin-bottom:${Math.round(fontSize * 0.6)}px;">${inner}</div>`;
    });

    // Wörter untereinander; Spaltenzahl wie beim Multiple-Choice-Quiz (spaltenweise gefüllt).
    // Jede Spalte ist so breit wie ihr längstes Wort. Passt die gewählte Spaltenzahl nicht
    // in die Breite, nimmt silbenwortFitCols() nach dem Zeichnen automatisch weniger.
    const want = Math.max(1, Math.min(4, d.cols || 1));
    const fitKey = silbenwortFitKey(d);
    const cols = (d._fit && d._fit.key === fitKey) ? Math.min(want, d._fit.cols) : want;
    const colDivs = mcColumnChunks(items, cols)
      .map(ch => `<div style="display:flex;flex-direction:column;align-items:flex-start;">${ch.join('')}</div>`).join('');

    const fitTrigger = `<img src="" onerror="this.onerror=null;setTimeout(()=>silbenwortFitCols(${d.id}),0)" style="display:none">`;
    const trigger = modus === "gleichlang"
      ? `<img src="" onerror="this.onerror=null;silbenwortDrawGleichlang(${d.id})" style="display:none">`
      : modus === "zeichnen"
      ? `<img src="" onerror="this.onerror=null;silbenwortSyncBoxen(${d.id})" style="display:none">`
      : '';

    return atHtml(d) + (items.length
      ? `<div data-silben-grid="${d.id}" style="display:grid;grid-template-columns:repeat(${cols},max-content);column-gap:32px;justify-content:space-between;align-items:start;">${colDivs}</div>` + trigger + fitTrigger
      : '') ;
  },

  renderProps: d => {
    const fontSize = d.fontSize || 22;
    const font     = d.font || "inherit";
    const words    = d.words || [];
    const modus    = d.modus || "wortform";
    const arcWidth = d.arcWidth || 60;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    const togBtn = (label, val) => {
      const active = modus === val;
      return `<button onclick="event.stopPropagation();upd(${d.id},'modus','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;
    };

    const wordInputs = words.map((w, i) =>
      `<div style="display:flex;gap:4px;margin-bottom:4px;">
        <input type="text" value="${esc(w)}"
          onclick="event.stopPropagation()"
          onchange="silbenwortUpdate(${d.id},${i},this.value)"
          style="flex:1;padding:4px 6px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:13px;">
        <button onclick="event.stopPropagation();silbenwortRemove(${d.id},${i})"
          style="padding:3px 8px;border:1.5px solid #ddd;border-radius:4px;background:#fff;
                 color:#aaa;font-size:13px;cursor:pointer;">✕</button>
      </div>`
    ).join('');

    const arcWidthInput = modus === "gleichlang"
      ? pr("Bogenlänge (px)", `<input type="number" min="30" max="200" value="${arcWidth}"
          onclick="event.stopPropagation()"
          onchange="upd(${d.id},'arcWidth',+this.value)"
          style="width:60px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
                 font-family:inherit;font-size:12px;text-align:center;">`)
      : '';

    const sizeInput = `<input type="number" min="10" max="60" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    const fontSelect = `<select onchange="upd(${d.id},'font',this.value)"
      style="flex:1;border:1.5px solid #ddd;border-radius:4px;background:#fff;
             font-family:inherit;font-size:12px;padding:3px 5px;">
      ${fontOptions}
    </select>`;

    return `
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;">
          ${togBtn("Wortform", "wortform")}
          ${togBtn("Gleichlang", "gleichlang")}
          ${togBtn("Zeichnen", "zeichnen")}
        </div>
      </div>
      ${arcWidthInput}
      <div class="prow"><label>Wörter</label></div>
      <div id="silbenwort-list-${d.id}">${wordInputs}</div>
      <button onclick="event.stopPropagation();silbenwortAdd(${d.id})"
        style="width:100%;padding:5px;margin-bottom:10px;border:1.5px dashed #bbb;
               border-radius:4px;background:#fafafa;font-family:inherit;font-size:12px;
               color:#666;cursor:pointer;">+ Wort hinzufügen</button>
      ${pr("Spalten", `<input type="number" min="1" max="4" value="${d.cols || 1}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'cols',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      ${pr("Schriftgröße", sizeInput)}
      <div class="prow"><label>Schriftart</label>${fontSelect}</div>
      <div style="margin-top:10px;padding:7px 9px;background:#fffbea;border:1.5px solid #f0d060;
                  border-radius:5px;font-size:11px;color:#7a6000;line-height:1.5;">
        ⚠️ Die automatische Silbentrennung basiert auf einem typografischen Algorithmus –
        manche Wörter (z.&nbsp;B. <em>Igel, Abend</em>) werden dabei nicht korrekt getrennt.
        Häufige Ausnahmen sind bereits eingebaut. Eigene Ausnahmen unten eintragen.
      </div>
      <div class="prow" style="margin-top:8px;"><label>Eigene Ausnahmen</label></div>
      <textarea onclick="event.stopPropagation()"
        onchange="upd(${d.id},'ausnahmen',this.value)"
        placeholder="Format: Wort=Sil-ben&#10;z. B. Tiger=Ti-ger"
        style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;
               border-radius:4px;padding:4px 6px;min-height:60px;resize:vertical;
               box-sizing:border-box;"
      >${esc(d.ausnahmen || '')}</textarea>` ;
  },
});

// ── Spalten automatisch reduzieren, wenn die Wörter nicht nebeneinander passen ──
function silbenwortFitKey(d) {
  return JSON.stringify([d.cols || 1, d.words, d.fontSize, d.font, d.modus, d.arcWidth, d.widthFraction]);
}
function silbenwortFitCols(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const grid = document.querySelector(`[data-silben-grid="${id}"]`); if (!grid || !grid.clientWidth) return;
  const cols = (grid.style.gridTemplateColumns.match(/repeat\((\d+)/) || [])[1] | 0;
  if (cols > 1 && grid.scrollWidth > grid.clientWidth + 1) {
    w._fit = { key: silbenwortFitKey(w), cols: cols - 1 };
    if (!(typeof patchWidget === 'function' && patchWidget(id))) render();
  }
}

// ── Kasten-Breite an Wort anpassen (Zeichnen-Modus) ──────────────
function silbenwortSyncBoxen(widgetId) {
  document.querySelectorAll(`[data-zeichnen-widget="${widgetId}"]`).forEach(wordDiv => {
    const w   = wordDiv.offsetWidth;
    const box = document.getElementById(wordDiv.id + '-box');
    if (box && w > 0) box.style.width = w + 'px';
  });
}

// ── Helpers ───────────────────────────────────────────────────────
function silbenwortUpdate(id, idx, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.words[idx] = value;
  render(); renderProps(id);
}

function silbenwortRemove(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.words.splice(idx, 1);
  render(); renderProps(id);
}

function silbenwortAdd(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.words.push("");
  render(); renderProps(id);
}

// Wort direkt im Blatt ändern (main/helpers.js → BW_AUFGABE); Silben/Bögen rechnen sich neu
BW_AUFGABE.silbenwort = {
  ziel: '[data-aufg]',
  text: (w, i) => (w.words || []).map(x => x.trim()).filter(Boolean)[i] ?? null,
  setzen: (w, i, txt) => {
    const t = txt.trim();
    if (/\s/.test(t)) return 'Bitte nur ein Wort (ohne Leerzeichen).';
    let k = -1;
    w.words = (w.words || []).map(x => (x.trim() && ++k === i) ? t : x);
    return true;
  },
};
