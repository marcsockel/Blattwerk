// Widget: Text
// ── Shared rich-editor helpers (reused by instruction, infobox, gap_text) ──

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
    if (winner) winner.innerHTML = def.render(w);
  }
}
// Undo-Fix: Der Vorher-Zustand wird bei onfocus (edFocus) gemerkt und hier
// per edBlur() in die History gepusht — saveHistory() NACH der Mutation würde
// nur den neuen Zustand sichern und Strg+Z wäre wirkungslos.
function richBlur(id, el) { richSave(id, el); edBlur(); render(); }
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

function makeRichEditorBox(id, field, html, font, fontSize, extraRight='', fontOptions='', oninputExtra='') {
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
      style="outline:none;padding:8px 10px;font-family:${font};font-size:${fontSize}px;
             line-height:1.7;min-height:60px;color:#333;white-space:pre-wrap;word-break:break-word;"
    >${html}</div>
    ${bottomBar}
  </div>`;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:"text", label:"Text", desc:"Formatierter Fließtext", icon:"T", category:"allgemein" },

  createData: id => ({
    id, type:"text",
    html:"Hier steht ein Text.",
    font:"inherit",
    fontSize: 16, align:"left", aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 16;
    const align    = d.align    || "left";
    return atHtml(d) + `<div style="font-family:${font};font-size:${fontSize}px;line-height:1.7;
                        color:#333;white-space:pre-wrap;word-break:break-word;min-height:1em;text-align:${align};"
            >${d.html}</div>`;
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

    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', d.html, font, fontSize, sizeInput, fontOptions) +
      alignToggle(d.id, d.align) ;
  },
});
