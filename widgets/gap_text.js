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
    const shuffled = seededShuffle(gapWords, d.id * 31 + gapWords.length);

    const solutionBand = (d.showLoesungen && shuffled.length > 0)
      ? `<div style="margin-top:10px;border-top:1.5px dashed #ccc;padding-top:7px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;">
           <span style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;">Lösungen:</span>
           ${shuffled.map(w => `<span style="font-family:${font};font-size:13px;color:#555;">${esc(w)}</span>`).join('')}
         </div>`
      : '';

    const fontSize = d.fontSize || 16;
    return atHtml(d) + `<div style="font-family:${font};font-size:${fontSize}px;line-height:2.4;${fontFeatures}">${content}</div>${solutionBand}`;
  },

  renderProps: d => {
    const sl           = d.showLoesungen || false;
    const font         = d.font || "inherit";
    const fontSize     = d.fontSize || 16;
    const fontFeatures = d.fontFeatures || "";

    // Strip HTML tags for word-toggle display (replace block elements with spaces first)
    const plainText = d.text
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?(div|p|li|tr)[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, '');
    const tokens = plainText.split(/\s+/).filter(Boolean);

    const wordBtns = tokens.map((tok, i) => {
      const isGap = tok.startsWith('[') && tok.endsWith(']');
      const display = isGap ? tok.slice(1, -1) : tok;
      return `<span onclick="event.stopPropagation();gapToggle(${d.id},${i})"
        style="display:inline-block;padding:2px 6px;margin:2px 1px;border-radius:4px;cursor:pointer;
               font-family:${font};font-size:13px;line-height:1.8;
               background:${isGap ? '#fde8ec' : '#f0eee8'};
               border:1.5px solid ${isGap ? '#f38ba8' : '#ddd'};
               color:${isGap ? '#a0003c' : '#333'};
               font-weight:${isGap ? '700' : '400'};">${esc(display)}</span>`;
    }).join('');

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
      makeRichEditorBox(d.id, 'text', d.text, font, fontSize, sizeInput, fontOptions, `gapRefreshWords(${d.id})`) +
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
function gapRefreshWords(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const container = document.getElementById(`gap-words-${id}`);
  if (!container) return;
  const plainText = w.text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(div|p|li|tr)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  const tokens = plainText.split(/\s+/).filter(Boolean);
  const font = w.font || 'inherit';
  container.innerHTML = tokens.map((tok, i) => {
    const isGap = tok.startsWith('[') && tok.endsWith(']');
    const display = isGap ? tok.slice(1,-1) : tok;
    return `<span onclick="event.stopPropagation();gapToggle(${id},${i})"
      style="display:inline-block;padding:2px 6px;margin:2px 1px;border-radius:4px;cursor:pointer;
             font-family:${font};font-size:13px;line-height:1.8;
             background:${isGap?'#fde8ec':'#f0eee8'};
             border:1.5px solid ${isGap?'#f38ba8':'#ddd'};
             color:${isGap?'#a0003c':'#333'};
             font-weight:${isGap?'700':'400'};">${esc(display)}</span>`;
  }).join('');
}

function gapToggle(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const plainText = w.text
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(div|p|li|tr)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  const tokens = plainText.split(/\s+/).filter(Boolean);
  if (idx >= tokens.length) return;

  const tok      = tokens[idx];
  const isGap    = tok.startsWith('[') && tok.endsWith(']');
  const searchFor  = tok;                              // exactly as it appears in tokens
  const replaceWith = isGap ? tok.slice(1,-1) : `[${tok}]`;

  // Count how many times searchFor already appeared in tokens before idx
  let occurrence = 0;
  for (let i = 0; i < idx; i++) if (tokens[i] === searchFor) occurrence++;

  // Replace the (occurrence)-th match of searchFor in w.text
  const escaped = searchFor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let count = 0;
  w.text = w.text.replace(new RegExp(escaped, 'g'), match =>
    count++ === occurrence ? replaceWith : match
  );
  renderProps(id); render();
}
