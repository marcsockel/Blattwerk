// Widget: Bild-Wort-Zuordnung

function bwShuffle(n) {
  const arr = Array.from({length: n}, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

WIDGETS.push({
  meta: { type:"bildwort", label:"Bild-Wort-Zuordnung", desc:"Bild mit Wort verbinden", icon:"🖼↔", category:"deutsch" },

  createData: id => ({
    id, type:"bildwort",
    imageSize: 80,
    groesse: "klein",
    proZeile: 2,
    trennlinien: false,
    trennStil: "thin",
    aufgaben: [
      { src:"", word:"Hund",  distractors:["Katze","Maus"],    order: bwShuffle(3) },
      { src:"", word:"Apfel", distractors:["Birne","Kirsche"], order: bwShuffle(3) },
      { src:"", word:"Haus",  distractors:["Auto","Baum"],     order: bwShuffle(3) },
    ], aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const baseSize = d.imageSize || 80;
    const gross = (d.groesse || "klein") === "gross";
    const size = gross ? Math.round(baseSize * 1.2) : baseSize;
    const fontSize = gross ? 18 : 14;
    const cb = gross ? 15 : 13;
    const proZeile = Math.max(1, Math.min(3, d.proZeile || 2));
    const trenn = !!d.trennlinien;
    const isActive = d.id === selId || _solutionsMode;
    const checkbox = on => {
      const bCol = on ? '#2563eb' : '#555';
      const bg = on ? '#2563eb' : 'transparent';
      return `<span style="display:inline-block;width:${cb}px;height:${cb}px;border:1.5px solid ${bCol};`
        + `border-radius:2px;flex-shrink:0;background:${bg};"></span>`;
    };

    const colGap = trenn ? 0 : 24;
    const rowMb = trenn ? 0 : 32;
    const cellPad = trenn ? '22px 14px' : '0';
    // Eigener Linienstil (unabhängig vom Widget-Rahmen).
    const b = d.trennStil || "thin";
    const lineCss = ({
      dashed: '1.5px dashed #555',
      thin:   '1px solid #333',
      medium: '2px solid #333',
      thick:  '3px solid #333',
      ink:    '1.35px solid #2a2a2a',
    })[b] || '1px solid #333';
    const itemBasis = proZeile === 1
      ? null
      : `calc(${100 / proZeile}% - ${colGap * (proZeile - 1) / proZeile}px)`;

    const aufgaben = d.aufgaben || [];
    const n = aufgaben.length;
    const rows = Math.max(1, Math.ceil(n / proZeile));

    const renderItem = (a, i) => {
      const allWords = [a.word, ...(a.distractors || ["", ""])];
      const order    = a.order || [0,1,2];
      const words    = order.map(j => allWords[j] || "");
      const correctPos = order.indexOf(0);

      const imgEl = a.src
        ? `<div style="flex-shrink:0;"
             ondragover="event.preventDefault();event.stopPropagation();this.style.outline='2px solid #89b4fa';"
             ondragleave="this.style.outline='none';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.outline='none';bwDrop(${d.id},${i},event);">
             <img src="${a.src}" draggable="false" style="width:${size}px;height:${size}px;object-fit:contain;display:block;border-radius:4px;pointer-events:none;">
           </div>`
        : `<div style="width:${size}px;height:${size}px;flex-shrink:0;background:#f5f5f5;border:1.5px dashed #ccc;
             border-radius:4px;display:flex;align-items:center;justify-content:center;
             font-size:11px;color:#bbb;box-sizing:border-box;"
             ondragover="event.preventDefault();event.stopPropagation();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
             ondragleave="this.style.borderColor='#ccc';this.style.background='#f5f5f5';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.borderColor='#ccc';this.style.background='#f5f5f5';bwDrop(${d.id},${i},event);">Bild</div>`;

      const wordList = `<div style="display:flex;flex-direction:column;justify-content:space-between;height:${Math.round(size * 0.88)}px;min-width:0;flex:1;">` +
        words.map((w, wi) =>
          `<div style="display:flex;align-items:center;gap:7px;min-width:0;">${checkbox(isActive && wi === correctPos)}
            <span style="font-size:${fontSize}px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(w)}</span>
          </div>`
        ).join("") +
        `</div>`;

      const fullWidth = proZeile > 1 || trenn;
      const inner =
        `<div style="display:flex;align-items:center;gap:16px;${fullWidth ? 'width:100%;' : 'width:max-content;'}min-width:0;box-sizing:border-box;">
          ${imgEl}
          ${wordList}
        </div>`;

      if (trenn) {
        const col = i % proZeile;
        const row = Math.floor(i / proZeile);
        const br = col < proZeile - 1 ? `border-right:${lineCss};` : '';
        const bb = row < rows - 1 ? `border-bottom:${lineCss};` : '';
        return `<div style="box-sizing:border-box;padding:${cellPad};${br}${bb}">${inner}</div>`;
      }

      if (proZeile === 1) {
        return `<div style="flex:0 0 auto;margin-bottom:${rowMb}px;">${inner}</div>`;
      }
      return `<div style="flex:0 0 ${itemBasis};max-width:${itemBasis};box-sizing:border-box;margin-bottom:${rowMb}px;">${inner}</div>`;
    };

    const cells = aufgaben.map((a, i) => renderItem(a, i));
    // Leere Zellen füllen die letzte Zeile, damit Trennlinien durchlaufen.
    if (trenn) {
      while (cells.length < rows * proZeile) {
        const i = cells.length;
        const col = i % proZeile;
        const row = Math.floor(i / proZeile);
        const br = col < proZeile - 1 ? `border-right:${lineCss};` : '';
        const bb = row < rows - 1 ? `border-bottom:${lineCss};` : '';
        cells.push(`<div style="box-sizing:border-box;padding:${cellPad};${br}${bb}"></div>`);
      }
      return atHtml(d) +
        `<div style="display:grid;grid-template-columns:repeat(${proZeile},1fr);">${cells.join("")}</div>`;
    }

    return atHtml(d) +
      `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;column-gap:${colGap}px;row-gap:0;justify-content:flex-start;margin-bottom:-${rowMb}px;">${cells.join("")}</div>`;
  },

  renderProps: d => {
    const size = d.imageSize || 80;
    const g = d.groesse || "klein";
    const proZeile = Math.max(1, Math.min(3, d.proZeile || 2));
    const trenn = !!d.trennlinien;
    const trennStil = d.trennStil || "thin";
    const aufgaben = d.aufgaben || [];
    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const stilOpt = (val, label) =>
      `<option value="${val}" ${trennStil===val?'selected':''}>${label}</option>`;
    const trennStilSelect = trenn
      ? `<select onchange="upd(${d.id},'trennStil',this.value)"
          style="width:100%;margin-top:6px;border:1.5px solid #ddd;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px;">
          ${stilOpt("dashed","- - - Gestrichelt")}
          ${stilOpt("thin","──── Leicht (1px)")}
          ${stilOpt("medium","──── Mittel (2px)")}
          ${stilOpt("thick","──── Dick (3px)")}
          ${stilOpt("ink","✒ Tusche")}
        </select>`
      : "";

    const thumbSz = 40;
    const aufgabeCards = aufgaben.map((a, idx) => {
      const thumb = a.src
        ? `<div title="Bild auswählen / hierher ziehen"
             style="flex-shrink:0;cursor:pointer;width:${thumbSz}px;height:${thumbSz}px;"
             onclick="event.stopPropagation();bwOpenImgPicker(${d.id},${idx});"
             ondragover="event.preventDefault();event.stopPropagation();this.style.outline='2px solid #89b4fa';"
             ondragleave="this.style.outline='none';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.outline='none';bwDrop(${d.id},${idx},event);">
             <img src="${a.src}" draggable="false"
               style="width:${thumbSz}px;height:${thumbSz}px;object-fit:contain;border-radius:3px;border:1px solid #eee;display:block;pointer-events:none;">
           </div>`
        : `<div title="Bild auswählen / hierher ziehen"
             onclick="event.stopPropagation();bwOpenImgPicker(${d.id},${idx});"
             ondragover="event.preventDefault();event.stopPropagation();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
             ondragleave="this.style.borderColor='#ccc';this.style.background='#f0f0f0';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.borderColor='#ccc';this.style.background='#f0f0f0';bwDrop(${d.id},${idx},event);"
             style="flex-shrink:0;width:${thumbSz}px;height:${thumbSz}px;background:#f0f0f0;border:1.5px dashed #ccc;border-radius:3px;
             display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;transition:border-color .12s,background .12s;">🖼</div>`;

      return `<div style="border:1.5px solid #eee;border-radius:6px;padding:8px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;">
            ${thumb}
            ${a.src ? `<button onclick="event.stopPropagation();bwUpdAufgabe(${d.id},${idx},'src','')"
              style="padding:1px 5px;border:none;border-radius:3px;background:#fde8ec;color:#a0003c;
                     font-size:10px;cursor:pointer;">🗑</button>` : ""}
          </div>
          <div style="flex:1;">
            <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">Richtiges Wort</div>
            <input value="${esc(a.word)}" placeholder="z.B. Hund"
              style="width:100%;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
              onchange="bwUpdAufgabe(${d.id},${idx},'word',this.value)"
              onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          </div>
          <button onclick="event.stopPropagation();bwRemoveAufgabe(${d.id},${idx})"
            style="padding:2px 6px;border:none;border-radius:4px;background:#fde8ec;color:#a0003c;
                   font-size:12px;cursor:pointer;flex-shrink:0;">✕</button>
        </div>
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">Ablenkwörter</div>
        <div style="display:flex;gap:4px;">
          <input value="${esc((a.distractors||[])[0]||"")}" placeholder="Wort 2"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bwUpdDistractor(${d.id},${idx},0,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <input value="${esc((a.distractors||[])[1]||"")}" placeholder="Wort 3"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bwUpdDistractor(${d.id},${idx},1,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
        </div>
      </div>`;
    }).join("");

    return pr("Bildgröße (px)",
        `<input type="number" min="40" max="200" step="10" value="${size}" onchange="upd(${d.id},'imageSize',+this.value)">`) +
      `<div class="prow"><label>Schriftgröße</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein", g !== "gross", `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn("Groß", g === "gross", `upd(${d.id},'groesse','gross')`)}
        </div>
      </div>` +
      `<div class="prow"><label>Pro Zeile</label>
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="range" min="1" max="3" step="1" value="${proZeile}"
            oninput="this.nextElementSibling.textContent=this.value"
            onchange="upd(${d.id},'proZeile',+this.value)" style="flex:1;accent-color:#7287fd;">
          <span style="font-size:11px;color:#666;min-width:14px;font-weight:700;">${proZeile}</span>
        </div>
      </div>` +
      `<div class="prow"><label>Trennlinien</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !trenn, `upd(${d.id},'trennlinien',false)`)}
          ${toggleBtn("An", trenn, `upd(${d.id},'trennlinien',true)`)}
        </div>
        ${trennStilSelect}
      </div>` +
      `<div style="margin:6px 0 4px;font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;">Aufgaben</div>` +
      aufgabeCards +
      `<button onclick="event.stopPropagation();bwAddAufgabe(${d.id})"
        style="width:100%;padding:5px;border:1.5px dashed #89b4fa;border-radius:5px;background:#eef4ff;
               color:#4a8fd4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">+ Aufgabe hinzufügen</button>` +
      `<button onclick="event.stopPropagation();bwReshuffle(${d.id})"
        style="margin-top:5px;width:100%;padding:5px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔀 Wörter neu mischen</button>` ;
  },
});

// ── Bild-Wort helpers ─────────────────────────────────────────────
function bwUpdAufgabe(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben[idx][key] = val;
  render(); renderProps(id);
}

function bwUpdDistractor(id, idx, di, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  if (!w.aufgaben[idx].distractors) w.aufgaben[idx].distractors = ["",""];
  w.aufgaben[idx].distractors[di] = val;
  render(); renderProps(id);
}

function bwAddAufgabe(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben.push({ src:"", word:"", distractors:["",""], order: bwShuffle(3) });
  render(); renderProps(id);
}

function bwRemoveAufgabe(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben.splice(idx, 1);
  render(); renderProps(id);
}

function bwReshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.aufgaben.forEach(a => { a.order = bwShuffle(3); });
  render(); renderProps(id);
}

function bwOpenImgPicker(id, idx) {
  if (window._imgDropGuard) return; // kein Picker direkt nach Drag & Drop
  const w = widgets.find(x => x.id === id);
  const hint = w && w.aufgaben && w.aufgaben[idx] ? (w.aufgaben[idx].word || "") : "";
  openImgPicker({
    query: hint,
    onPick: (src) => {
      const ww = widgets.find(x => x.id === id); if (!ww || !ww.aufgaben[idx]) return;
      saveHistory();
      ww.aufgaben[idx].src = src;
      render(); renderProps(id);
    },
  });
}

function bwDrop(id, idx, e) {
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  window._imgDropGuard = true;
  setTimeout(() => { window._imgDropGuard = false; }, 200);
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w) return;
    saveHistory();
    w.aufgaben[idx].src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}
