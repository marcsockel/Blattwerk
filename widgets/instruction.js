// Widget: Aufgabentext
WIDGETS.push({
  meta: { type:"instruction", label:"Aufgabentext", desc:"Aufgabenstellung", icon:"📋", category:"allgemein" },

  createData: id => ({ id, type:"instruction", html:"Lies den Text und beantworte die Fragen." }),

  render: d => `<div style="background:#f8f6f2;border-left:4px solid #fab387;padding:7px 11px;
                             border-radius:0 5px 5px 0;font-size:13px;line-height:1.6;color:#555;"
                >${d.html || esc(d.text||'')}</div>`,

  renderProps: d => {
    const html = d.html || esc(d.text||'');
    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', html, 'inherit', 13);
  },
});
