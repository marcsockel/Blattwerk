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
    aufgaben: [
      { src:"", word:"Hund",  distractors:["Katze","Maus"],    order: bwShuffle(3) },
      { src:"", word:"Apfel", distractors:["Birne","Kirsche"], order: bwShuffle(3) },
      { src:"", word:"Haus",  distractors:["Auto","Baum"],     order: bwShuffle(3) },
    ],
  }),

  render: d => {
    const size = d.imageSize || 80;
    const checkbox = `<span style="display:inline-block;width:13px;height:13px;border:1.5px solid #555;
                        border-radius:2px;flex-shrink:0;"></span>`;

    const items = (d.aufgaben||[]).map(a => {
      const allWords = [a.word, ...(a.distractors || ["", ""])];
      const order    = a.order || [0,1,2];
      const words    = order.map(i => allWords[i] || "");

      const imgEl = a.src
        ? `<img src="${a.src}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;border-radius:4px;">`
        : `<div style="width:${size}px;height:${size}px;background:#f5f5f5;border:1.5px dashed #ccc;
             border-radius:4px;display:flex;align-items:center;justify-content:center;
             font-size:11px;color:#bbb;">Bild</div>`;

      const wordList = `<div style="display:flex;flex-direction:column;justify-content:space-between;height:${size}px;min-width:0;flex:1;">` +
        words.map(w =>
          `<div style="display:flex;align-items:center;gap:7px;min-width:0;">${checkbox}
            <span style="font-size:14px;font-family:'DidactGothic7',sans-serif;white-space:nowrap;">${esc(w)}</span>
          </div>`
        ).join("") +
        `</div>`;

      return `<div style="display:flex;align-items:center;gap:16px;min-width:0;">
        <div style="flex-shrink:0;">${imgEl}</div>
        ${wordList}
      </div>`;
    });

    return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px 24px;">${items.join("")}</div>`;
  },

  renderProps: d => {
    const size = d.imageSize || 80;
    const aufgaben = d.aufgaben || [];

    const aufgabeCards = aufgaben.map((a, idx) => {
      const thumb = a.src
        ? `<img src="${a.src}"
             ondragover="event.preventDefault();event.stopPropagation();this.style.opacity='.6';"
             ondragleave="this.style.opacity='1';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.opacity='1';bwDrop(${d.id},${idx},event);"
             style="width:40px;height:40px;object-fit:contain;border-radius:3px;border:1px solid #eee;cursor:pointer;">`
        : `<div ondragover="event.preventDefault();event.stopPropagation();this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
             ondragleave="this.style.borderColor='#ccc';this.style.background='#f0f0f0';"
             ondrop="event.preventDefault();event.stopPropagation();this.style.borderColor='#ccc';this.style.background='#f0f0f0';bwDrop(${d.id},${idx},event);"
             style="width:40px;height:40px;background:#f0f0f0;border:1.5px dashed #ccc;border-radius:3px;
             display:flex;align-items:center;justify-content:center;font-size:16px;cursor:default;transition:border-color .12s,background .12s;">🖼</div>`;

      return `<div style="border:1.5px solid #eee;border-radius:6px;padding:8px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
          ${thumb}
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
        <div style="display:flex;gap:4px;margin-bottom:6px;">
          <input value="${esc((a.distractors||[])[0]||"")}" placeholder="Wort 2"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bwUpdDistractor(${d.id},${idx},0,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <input value="${esc((a.distractors||[])[1]||"")}" placeholder="Wort 3"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onchange="bwUpdDistractor(${d.id},${idx},1,this.value)"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
        </div>
        <div style="font-size:10px;color:#aaa;font-weight:700;margin-bottom:3px;">
          Bild <span style="font-weight:400;">(Wikimedia Commons)</span>
        </div>
        <div style="display:flex;gap:4px;">
          <input id="bw-q-${d.id}-${idx}" type="text" placeholder="Suchbegriff…"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;font-size:12px;font-family:inherit;outline:none;"
            onkeydown="if(event.key==='Enter'){event.preventDefault();bwSearch(${d.id},${idx});}"
            onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#ddd'">
          <button onclick="event.stopPropagation();bwSearch(${d.id},${idx})"
            style="padding:3px 9px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                   font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔍</button>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          <label style="flex:1;padding:4px;border:1.5px solid #ddd;border-radius:4px;background:#f8f8f8;
                         font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;text-align:center;color:#555;">
            📁 Eigenes Bild
            <input type="file" accept="image/*" style="display:none;"
              onchange="event.stopPropagation();bwUpload(${d.id},${idx},this)">
          </label>
          ${a.src ? `<button onclick="event.stopPropagation();bwUpdAufgabe(${d.id},${idx},'src','')"
            style="padding:4px 8px;border:none;border-radius:4px;background:#fde8ec;
                   color:#a0003c;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">🗑</button>` : ""}
        </div>
        <div id="bw-results-${d.id}-${idx}" style="margin-top:5px;"></div>
      </div>`;
    }).join("");

    return pr("Bildgröße (px)",
        `<input type="number" min="40" max="200" step="10" value="${size}" onchange="upd(${d.id},'imageSize',+this.value)">`) +
      `<div style="margin:6px 0 4px;font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px;">Aufgaben</div>` +
      aufgabeCards +
      `<button onclick="event.stopPropagation();bwAddAufgabe(${d.id})"
        style="width:100%;padding:5px;border:1.5px dashed #89b4fa;border-radius:5px;background:#eef4ff;
               color:#4a8fd4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">+ Aufgabe hinzufügen</button>` +
      `<button onclick="event.stopPropagation();bwReshuffle(${d.id})"
        style="margin-top:5px;width:100%;padding:5px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔀 Wörter neu mischen</button>`;
  },
});

// ── Bild-Wort helpers ─────────────────────────────────────────────
function bwUpdAufgabe(id, idx, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben[idx][key] = val;
  render(); renderProps(id);
}

function bwUpdDistractor(id, idx, di, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (!w.aufgaben[idx].distractors) w.aufgaben[idx].distractors = ["",""];
  w.aufgaben[idx].distractors[di] = val;
  render(); renderProps(id);
}

function bwAddAufgabe(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben.push({ src:"", word:"", distractors:["",""], order: bwShuffle(3) });
  render(); renderProps(id);
}

function bwRemoveAufgabe(id, idx) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben.splice(idx, 1);
  render(); renderProps(id);
}

function bwReshuffle(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben.forEach(a => { a.order = bwShuffle(3); });
  render(); renderProps(id);
}

async function bwSearch(id, idx) {
  const input = document.getElementById(`bw-q-${id}-${idx}`);
  if (!input) return;
  const query = input.value.trim();
  if (!query) return;

  const results = document.getElementById(`bw-results-${id}-${idx}`);
  results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Suche läuft…</div>`;

  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query`
      + `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12`
      + `&prop=imageinfo&iiprop=url&iiurlwidth=80&format=json&origin=*`;

    const res  = await fetch(url);
    const data = await res.json();
    const pages = Object.values(data.query?.pages || {});

    const imgs = pages
      .map(p => ({
        thumb: p.imageinfo?.[0]?.thumburl,
        url:   p.imageinfo?.[0]?.url,
        title: p.title?.replace(/^File:/i, '').replace(/\.\w+$/, ''),
      }))
      .filter(p => p.thumb && p.url && /\.(png|jpg|jpeg|svg|gif|webp)/i.test(p.url));

    if (!imgs.length) {
      results.innerHTML = `<div style="color:#aaa;font-size:11px;padding:4px 0;">Keine Ergebnisse.</div>`;
      return;
    }

    results.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">` +
      imgs.map(img =>
        `<div onclick="event.stopPropagation();bwPickImage(${id},${idx},'${img.url.replace(/'/g,"\\'")}','${img.title.replace(/'/g,"\\'").substring(0,40)}')"
          style="cursor:pointer;border:1.5px solid #eee;border-radius:4px;overflow:hidden;
                 aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
                 background:#f8f6f2;transition:border-color .12s;"
          onmouseover="this.style.borderColor='#89b4fa';this.style.background='#eef4ff';"
          onmouseout="this.style.borderColor='#eee';this.style.background='#f8f6f2';">
          <img src="${img.thumb}" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy">
        </div>`
      ).join("") +
      `</div><div style="font-size:10px;color:#bbb;margin-top:4px;text-align:center;">Wikimedia Commons</div>`;
  } catch(err) {
    results.innerHTML = `<div style="color:#f38ba8;font-size:11px;padding:4px 0;">Fehler beim Laden.</div>`;
  }
}

function bwPickImage(id, idx, url, title) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.aufgaben[idx].src = url;
  render(); renderProps(id);
}

function bwDrop(id, idx, e) {
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w) return;
    w.aufgaben[idx].src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}

function bwUpload(id, idx, input) {
  const file = input.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const w = widgets.find(x => x.id === id); if (!w) return;
    w.aufgaben[idx].src = ev.target.result;
    render(); renderProps(id);
  };
  reader.readAsDataURL(file);
}
