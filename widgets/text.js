// Widget: Text
// ── Shared rich-editor helpers (reused by instruction, infobox, gap_text) ──

function richSave(id, el) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w[el.dataset.field || 'html'] = el.innerHTML;
}
function richBlur(id, el) { saveHistory(); richSave(id, el); render(); }
function richFmt(id, cmd) {
  const el = document.getElementById(`txted-${id}`);
  if (!el) return;
  el.focus();
  document.execCommand(cmd, false, null);
  richSave(id, el);
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
    fontSize: 13,
  }),

  render: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 13;
    return `<div style="font-family:${font};font-size:${fontSize}px;line-height:1.7;
                        color:#333;white-space:pre-wrap;word-break:break-word;min-height:1em;"
            >${d.html}</div>`;
  },

  renderProps: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 13;
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font===f.value?"selected":""}>${f.label}</option>`
    ).join("");

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', d.html, font, fontSize, sizeInput, fontOptions);
  },
});
