// Widget: Multiple Choice
// Textformat: Erste Zeile = Frage, folgende Zeilen = Antworten (erste = richtig)
// Leerzeile trennt Fragen voneinander.

function mcParseText(text) {
  const blocks = (text || '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    return { q: lines[0], answers: lines.slice(1), correct: 0 };
  }).filter(Boolean);
}

function mcSerializeQuestions(questions) {
  return questions.map(item =>
    [item.q, ...item.answers].join('\n')
  ).join('\n\n');
}

WIDGETS.push({
  meta: { type:"multiplechoice", label:"Multiple Choice", desc:"Fragen mit Antwortoptionen", icon:"☑", category:"allgemein" },

  createData: id => ({
    id, type:"multiplechoice",
    text: "Was ist die Hauptstadt von Deutschland?\nBerlin\nMünchen\nHamburg\nWien\n\nWelches Tier ist ein Säugetier?\nDelfin\nLachs\nAdler\nEidechse",
    cols: 1,
    shuffle: false,
  }),

  render: d => {
    const cols      = d.cols || 1;
    const questions = mcParseText(d.text);
    const isActive  = d.id === selId || _solutionsMode;
    const labels    = ["a","b","c","d","e","f","g","h"];
    const doShuffle = d.shuffle !== false && d.shuffle;

    const qBlocks = questions.map((item, qi) => {
      // Antworten ggf. mischen (deterministisch per seed = widget-id + frage-index)
      let entries = item.answers.map((text, i) => ({ text, correct: i === item.correct }));
      if (doShuffle) entries = mcShuffled(entries, d.id * 31 + qi);

      const answers = entries.map((entry, ai) => {
        const isCorrect = isActive && entry.correct;
        const circle = `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;
                               border:2px solid ${isCorrect ? '#2563eb' : '#555'};
                               flex-shrink:0;margin-top:1px;
                               background:${isCorrect ? '#2563eb' : 'transparent'};"></span>`;
        return `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;">
          ${circle}
          <span style="font-size:13px;font-family:inherit;">
            <span style="font-weight:600;">${labels[ai] || ai+1})</span>&nbsp;${esc(entry.text)}
          </span>
        </div>`;
      }).join('');

      return `<div style="margin-bottom:12px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:5px;font-family:inherit;">
          ${qi+1}.&nbsp;${esc(item.q)}
        </div>
        <div style="padding-left:4px;">${answers}</div>
      </div>`;
    });

    const perCol = Math.ceil(qBlocks.length / cols);
    const colDivs = Array.from({length: cols}, (_, i) =>
      `<div style="flex:1;min-width:0;">${qBlocks.slice(i*perCol,(i+1)*perCol).join('')}</div>`
    ).join('');

    return `<div style="display:flex;gap:24px;align-items:flex-start;">${colDivs}</div>`;
  },

  renderProps: d => {
    const cols = d.cols || 1;
    return `
      <div class="prow"><label>Fragen & Antworten</label></div>
      <div style="font-size:11px;color:#888;margin-bottom:4px;line-height:1.5;">
        1. Zeile = Frage · folgende Zeilen = Antworten<br>
        Erste Antwort = richtige Antwort · Leerzeile trennt Fragen
      </div>
      <textarea onclick="event.stopPropagation()"
        onchange="mcUpdate(${d.id},this.value)"
        style="width:100%;font-family:inherit;font-size:12px;border:1.5px solid #ddd;border-radius:4px;
               padding:6px 8px;min-height:160px;resize:vertical;box-sizing:border-box;line-height:1.6;"
      >${esc(d.text||'')}</textarea>
      ${pr('Spalten', `<input type="number" min="1" max="4" value="${cols}"
        onclick="event.stopPropagation()"
        onchange="upd(${d.id},'cols',+this.value)"
        style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      ${pr('Antworten mischen', `<input type="checkbox" ${d.shuffle?'checked':''} onclick="event.stopPropagation()" onchange="upd(${d.id},'shuffle',this.checked)">`)}`;
  },
});

// ── Helper ────────────────────────────────────────────────────────
function mcShuffled(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcUpdate(id, text) {
  const w = widgets.find(x=>x.id===id); if (!w) return;
  saveHistory();
  w.text = text; render(); renderProps(id);
}
