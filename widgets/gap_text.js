// Widget: Lückentext
// Gap words are marked with [brackets] in the text string, e.g. "Der [Elefant] heißt [Elmar]."

// GAP_FONTS ist jetzt zentral in main/helpers.js definiert.

WIDGETS.push({
  meta: { type:"gap_text", label:"Lückentext", desc:"Wörter als Lücken markieren", icon:"___", category:"deutsch" },

  createData: id => ({
    id, type:"gap_text",
    text:"Der [Elefant] heißt Elmar. Er ist sehr [bunt] und [fröhlich].",
    showLoesungen: false,
    font: "inherit",
    fontSize: 16,
    fontFeatures: "", aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const font = d.font || "inherit";
    const fontFeatures = d.fontFeatures ? `font-feature-settings:${d.fontFeatures};` : "";
    const isActive = d.id === selId || _solutionsMode;
    const parts = d.text.split(/(\[[^\]]+\])/);
    const content = parts.map(part => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const word = part.slice(1, -1).replace(/<[^>]+>/g, ''); // strip tags inside brackets
        if (isActive) {
          return `<span style="color:#2563eb;font-weight:700;">${esc(word)}</span>`;
        }
        const width = Math.max(66, word.length * 14);
        return `<span style="display:inline-block;border-bottom:1.5px solid #555;min-width:${width}px;height:1.3em;margin:0 2px;vertical-align:baseline;"></span>`;
      }
      return part; // already HTML – do not escape
    }).join('');

    const gapWords = [...d.text.matchAll(/\[([^\]]+)\]/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').replace(/[.,!?;:]+$/, ''));
    const shuffleSeed = d.id * 31 + gapWords.length + (d.loesungShuffle || 0) * 997;
    const shuffled = seededShuffle(gapWords, shuffleSeed);

    const solutionBand = (d.showLoesungen && shuffled.length > 0)
      ? `<div style="margin-top:10px;border-top:1.5px dashed #ccc;padding-top:7px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;">
           <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;">Lösungen:</span>
           ${shuffled.map(w => `<span style="font-family:${font};font-size:13px;color:#555;">${esc(w)}</span>`).join('')}
         </div>`
      : '';

    const fontSize = d.fontSize || 16;
    const pad = d.innerPad != null ? `padding:${d.innerPad}px;` : '';
    return atHtml(d) + `<div style="font-family:${font};font-size:${fontSize}px;line-height:2.4;${fontFeatures}${pad}">${content}</div>${solutionBand}`;
  },

  renderProps: d => {
    const sl           = d.showLoesungen || false;
    const font         = d.font || "inherit";
    const fontSize     = d.fontSize || 16;

    const tokens = gapTokenize(d.text);
    const wordBtns = gapWordBtnsHtml(d.id, tokens, font);

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? 'selected' : ''}>${f.label}</option>`
    ).join('');

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    return `<div class="prow"><label>Text <span style="font-weight:400;color:#aaa;font-size:10px;">([Wort] = Lücke)</span></label></div>` +
      makeRichEditorBox(d.id, 'text', d.text, font, sizeInput, fontOptions, `gapRefreshWords(${d.id})`) +
      innerPadPropsControl(d) +
      `<div class="prow">
        <label>Wort anklicken = Lücke</label>
        <div id="gap-words-${d.id}" style="margin-top:5px;line-height:2;">${wordBtns}</div>
      </div>` +
      `<div class="prow"><label>Lösungen anzeigen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'showLoesungen',false)`)}
          ${toggleBtn("Einblenden", sl,  `upd(${d.id},'showLoesungen',true)`)}
        </div>
      </div>` ;
  },
});

// ── Gap text helpers ──────────────────────────────────────────────

/** Wörter/Lücken als exakte Ausschnitte aus dem HTML-Quelltext (nicht Plaintext). */
function gapTokenize(html) {
  const tokens = [];
  let i = 0;
  const len = (html || '').length;
  while (i < len) {
    while (i < len && /\s/.test(html[i])) i++;
    if (i >= len) break;
    const start = i;
    while (i < len && !/\s/.test(html[i])) i++;
    const raw = html.slice(start, i);
    const plain = raw.replace(/<[^>]+>/g, '');
    if (!plain) continue;
    tokens.push({
      raw,
      start,
      end: i,
      plain,
      isGap: plain.startsWith('[') && plain.endsWith(']')
    });
  }
  return tokens;
}

function gapTokenLabel(tok) {
  return tok.isGap ? tok.plain.slice(1, -1) : tok.plain;
}

function gapWordBtnsHtml(id, tokens, font) {
  return tokens.map((tok, i) => {
    const isGap = tok.isGap;
    const display = gapTokenLabel(tok);
    return `<span onclick="event.stopPropagation();gapToggle(${id},${i})"
      style="display:inline-block;padding:2px 6px;margin:2px 1px;border-radius:4px;cursor:pointer;
             font-family:${font};font-size:13px;line-height:1.8;
             background:${isGap ? '#fde8ec' : '#f0eee8'};
             border:1.5px solid ${isGap ? '#f38ba8' : '#ddd'};
             color:${isGap ? '#a0003c' : '#333'};
             font-weight:${isGap ? '700' : '400'};">${esc(display)}</span>`;
  }).join('');
}

const _gapRefreshTimers = {};

function gapRefreshWords(id) {
  clearTimeout(_gapRefreshTimers[id]);
  _gapRefreshTimers[id] = setTimeout(() => gapRefreshWordsNow(id), 150);
}

function gapRefreshWordsNow(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const container = document.getElementById(`gap-words-${id}`);
  if (!container) return;
  const tokens = gapTokenize(w.text);
  const font = w.font || 'inherit';
  container.innerHTML = gapWordBtnsHtml(id, tokens, font);
}

function gapToggle(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const tokens = gapTokenize(w.text);
  if (idx >= tokens.length) return;

  const tok = tokens[idx];
  const newPlain = tok.isGap ? tok.plain.slice(1, -1) : `[${tok.plain}]`;
  let newRaw;
  if (tok.raw === tok.plain) {
    newRaw = newPlain;
  } else {
    newRaw = tok.raw.replace(tok.plain, newPlain);
    if (newRaw === tok.raw) newRaw = newPlain;
  }
  w.text = w.text.slice(0, tok.start) + newRaw + w.text.slice(tok.end);

  renderProps(id);
  if (typeof patchWidget === 'function' && patchWidget(id)) {
    if (typeof schedulePatchOverflow === 'function') schedulePatchOverflow();
  } else {
    render();
  }
}
