// Widget: Text
// ── Shared rich-editor helpers (reused by instruction, infobox, gap_text) ──

const RICH_EDITOR_FONT_SIZE = 13; // Props-Editor: fest, unabhängig von Sheet-Schriftgröße

let _formatting = false;

// Eigener DOM-Serializer: liest Text-Nodes direkt via nodeValue,
// umgeht Chrome's innerHTML-Whitespace-Normalisierung komplett.
// <div>-Elemente (von Chrome's insertLineBreak erzeugt) → '<br>' + Kinder.
function richHtml(el) {
  function walk(node) {
    if (node.nodeType === 3) { // TEXT_NODE
      return node.nodeValue
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>'); // Chrome pre-wrap: \n als Zeilenumbruch
    }
    if (node.nodeType === 1) { // ELEMENT_NODE
      const tag  = node.tagName.toLowerCase();
      if (tag === 'br') return '<br>';
      const kids = Array.from(node.childNodes).map(walk).join('');
      if (tag === 'b' || tag === 'strong') return `<b>${kids}</b>`;
      if (tag === 'i' || tag === 'em')     return `<i>${kids}</i>`;
      if (tag === 'u')                     return `<u>${kids}</u>`;
      if (tag === 'div') return '<br>' + kids; // Zeilenumbruch-Container
      return kids; // span usw. → Inhalt durchreichen
    }
    return '';
  }
  const raw = Array.from(el.childNodes).map(walk).join('');
  // Führendes <br> entfernen — entsteht wenn erster Knoten ein <div> ist
  return raw.startsWith('<br>') ? raw.slice(4) : raw;
}

function richSave(id, el) {
  if (_formatting) return; // oninput während execCommand überspringen
  const w = widgets.find(x => x.id === id); if (!w) return;
  w[el.dataset.field || 'html'] = richHtml(el);
  const def = WIDGET_MAP[w.type];
  if (def) {
    const winner = document.querySelector(`.wwrap[data-id="${id}"] .winner`);
    if (winner) winnerInnerRefresh(w, winner);
    // Fließender Text: auch die Fortsetzungs-Widgets sofort aktualisieren
    if (w.fliessen && typeof tfChain === 'function') tfChain(w.id).forEach(c => {
      const el = document.querySelector(`.wwrap[data-id="${c.id}"] .winner`);
      if (el) winnerInnerRefresh(c, el);
    });
    if (typeof schedulePatchOverflow === 'function') schedulePatchOverflow();
  }
}
// Undo-Fix: Der Vorher-Zustand wird bei onfocus (edFocus) gemerkt und hier
// per edBlur() in die History gepusht — saveHistory() NACH der Mutation würde
// nur den neuen Zustand sichern und Strg+Z wäre wirkungslos.
function richBlur(id, el) {
  richSave(id, el);
  edBlur();
  if (typeof schedulePatchOverflow === 'function') schedulePatchOverflow();
}
function richFmt(id, cmd) {
  const el = document.getElementById(`txted-${id}`);
  if (!el) return;
  el.focus();

  const sel   = window.getSelection();
  const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  const state = document.queryCommandState(cmd);
  const tagMap = { bold:'b', italic:'i', underline:'u' };
  const tag = tagMap[cmd];

  // _formatting blockiert oninput während aller DOM-Änderungen
  _formatting = true;
  if (tag && range && !range.collapsed && !state) {
    // Formatting EINschalten: manuell wrappen — execCommand trimmt sonst Leerzeichen
    const frag    = range.extractContents();
    const wrapper = document.createElement(tag);
    wrapper.appendChild(frag);
    range.insertNode(wrapper);
    const nr = document.createRange();
    nr.selectNodeContents(wrapper);
    sel.removeAllRanges();
    sel.addRange(nr);
  } else {
    // Formatting AUSschalten oder removeFormat
    document.execCommand(cmd, false, null);
  }
  _formatting = false;
  richSave(id, el);           // sofort lesen, DOM ist stabil
  _formatting = true;         // async oninput nach diesem Stack blockieren
  setTimeout(() => { _formatting = false; }, 0);
  richUpdateBtns(id);
}
function richUpdateBtns(id) {
  ['bold','italic','underline'].forEach(cmd => {
    const btn = document.getElementById(`txbtn-${id}-${cmd}`);
    if (!btn) return;
    const on = document.queryCommandState(cmd);
    btn.style.background  = on ? '#313244' : '#fff';
    btn.style.borderColor = on ? '#89b4fa' : '#ddd';
    btn.style.color       = on ? '#cdd6f4' : '';
  });
}

function makeRichToolbar(id, field, extraRight='') {
  const b = (cmd, label, style) =>
    `<button id="txbtn-${id}-${cmd}"
       onmousedown="event.preventDefault()"
       onclick="event.stopPropagation();richFmt(${id},'${cmd}')"
       style="padding:4px 8px;border-radius:4px;border:1.5px solid #ddd;background:#fff;
              font-family:inherit;font-size:13px;cursor:pointer;
              transition:background .1s,border-color .1s;${style}">${label}</button>`;
  return `<div style="display:flex;align-items:center;gap:4px;padding:5px 6px;
                      border-bottom:1px solid #eee;background:#fafafa;">
    ${b('bold',         'B', 'font-weight:800;')}
    ${b('italic',       'K', 'font-style:italic;font-weight:700;')}
    ${b('underline',    'U', 'text-decoration:underline;font-weight:700;')}
    ${b('removeFormat', '✕', 'color:#aaa;font-size:11px;')}
    ${extraRight ? `<div style="margin-left:auto;">${extraRight}</div>` : ''}
  </div>`;
}

function makeRichEditorBox(id, field, html, font, extraRight='', fontOptions='', oninputExtra='') {
  const bottomBar = fontOptions
    ? `<div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
         <select onchange="upd(${id},'font',this.value)"
           style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
           ${fontOptions}
         </select>
       </div>`
    : '';
  return `<div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:8px;">
    ${makeRichToolbar(id, field, extraRight)}
    <div id="txted-${id}" contenteditable="true" data-field="${field}"
      onclick="event.stopPropagation()"
      onpaste="event.preventDefault();document.execCommand('insertText',false,(event.clipboardData||window.clipboardData).getData('text/plain'))"
      onkeydown="if(event.key==='Enter'){event.preventDefault();document.execCommand('insertLineBreak');richSave(${id},this);}"
      onfocus="edFocus()"
      oninput="richSave(${id},this)${oninputExtra?';'+oninputExtra:''}"
      onblur="richBlur(${id},this)"
      onkeyup="richUpdateBtns(${id})"
      onmouseup="richUpdateBtns(${id})"
      style="outline:none;padding:8px 10px;font-family:${font};font-size:${RICH_EDITOR_FONT_SIZE}px;
             line-height:1.7;min-height:60px;color:#333;white-space:pre-wrap;word-break:break-word;"
    >${html}</div>
    ${bottomBar}
  </div>`;
}

// ── Widget ────────────────────────────────────────────────────────

/** Text/Silbentext/Lückentext: eigener Innenabstand aktiv? (sonst .winner-Padding wie bisher) */
function textUsesInnerPad(w) {
  return w && (w.type === 'text' || w.type === 'silbentext' || w.type === 'gap_text') && w.innerPad != null;
}

function textInnerPadLabel(d) {
  return d.innerPad != null ? `${d.innerPad} px` : 'Standard';
}

function innerPadPropsControl(d) {
  const padVal = d.innerPad != null ? d.innerPad : 8;
  return `<div class="prow"><label>Innenabstand</label>
      <div style="display:flex;gap:6px;align-items:center;">
        <input type="range" min="0" max="32" step="1" value="${padVal}"
          onclick="event.stopPropagation()"
          oninput="document.getElementById('text-pad-lbl-${d.id}').textContent=this.value+' px'"
          onchange="upd(${d.id},'innerPad',+this.value)"
          style="flex:1;accent-color:#7287fd;">
        <span id="text-pad-lbl-${d.id}" style="font-size:11px;color:#666;min-width:52px;text-align:right;">${textInnerPadLabel(d)}</span>
      </div>
      ${d.innerPad != null ? `<button onclick="event.stopPropagation();upd(${d.id},'innerPad',null)"
        style="margin-top:4px;width:100%;padding:4px;border:1.5px solid #ddd;border-radius:4px;background:#fff;
               font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:#666;">Standard wiederherstellen</button>` : ''}
    </div>`;
}

WIDGETS.push({
  meta: { type:"text", label:"Text", desc:"Formatierter Fließtext", icon:"T", category:"allgemein" },

  createData: id => ({
    id, type:"text",
    html:"Hier steht ein Text.",
    font:"inherit",
    fontSize: 16, align:"left", aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    // Gemeinsamer Renderer (textfluss.js): Zeilennummern-Rinne, data-flowtext-Marker.
    // Fließender Text mit Split → nur Teil 0 rendern, Rest übernimmt die Fortsetzung.
    const html = (d.fliessen && (d.splits || []).length)
      ? tfSlice(d.html, 0, d.splits[0])
      : d.html;
    return atHtml(d) + tfTextDiv(d, html, 0);
  },

  renderProps: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 16;
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    const zTgl = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return propFold('text-editor', 'Text',
        makeRichEditorBox(d.id, 'html', d.html, font, sizeInput, fontOptions), true) +
      innerPadPropsControl(d) +
      alignToggle(d.id, d.align, true) +
      `<div class="prow"><label>Zeilenbeschriftung (alle 5 Zeilen)</label>
        <div style="display:flex;gap:4px;">
          ${zTgl("Aus", !d.zeilenNr,  `upd(${d.id},'zeilenNr',false)`)}
          ${zTgl("An",  !!d.zeilenNr, `upd(${d.id},'zeilenNr',true)`)}
        </div>
      </div>` +
      `<div class="prow"><label>Über Seiten fließen</label>
        <div style="display:flex;gap:4px;">
          ${zTgl("Aus", !d.fliessen,  `tfSetFliessen(${d.id},false)`)}
          ${zTgl("An",  !!d.fliessen, `tfSetFliessen(${d.id},true)`)}
        </div>
      </div>`;
  },
});
