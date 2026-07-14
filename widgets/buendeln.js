// Widget: Bündeln
// Im Rahmen liegen kleine Anlautbilder verstreut; darunter H/Z/E-Stellenwerttafel
// und daneben ein Strich für die Gesamtzahl.

const BUENDELN_BILDER = [
  { label: 'Apfel',     src: 'A-Apfel' },
  { label: 'Biene',     src: 'B-Biene' },
  { label: 'Dino',      src: 'D-Dino' },
  { label: 'Ente',      src: 'E-Ente' },
  { label: 'Elefant',   src: 'E-Elefant' },
  { label: 'Esel',      src: 'E-Esel' },
  { label: 'Feder',     src: 'F-Feder' },
  { label: 'Fisch',     src: 'F-Fisch' },
  { label: 'Gabel',     src: 'G-Gabel' },
  { label: 'Geschenk',  src: 'G-Geschenk' },
  { label: 'Giraffe',   src: 'G-Giraffe' },
  { label: 'Hammer',    src: 'H-Hammer' },
  { label: 'Hut',       src: 'H-Hut' },
  { label: 'Igel',      src: 'I-Igel' },
  { label: 'Kanne',     src: 'K-Kanne' },
  { label: 'Katze',     src: 'K-Katze' },
  { label: 'Kerze',     src: 'K-Kerze' },
  { label: 'Krone',     src: 'K-Krone' },
  { label: 'Löffel',    src: 'L-Löffel' },
  { label: 'Löwe',      src: 'L-Löwe' },
  { label: 'Maus',      src: 'M-Maus' },
  { label: 'Mond',      src: 'M-Mond' },
  { label: 'Mütze',     src: 'M-Mütze' },
  { label: 'Nest',      src: 'N-Nest' },
  { label: 'Orange',    src: 'O-Orange' },
  { label: 'Pilz',      src: 'P-Pilz' },
  { label: 'Pinsel',    src: 'P-Pinsel' },
  { label: 'Qualle',    src: 'Q-Qualle' },
  { label: 'Rakete',    src: 'R-Rakete' },
  { label: 'Ring',      src: 'R-Ring' },
  { label: 'Rose',      src: 'R-Rose' },
  { label: 'Sonne',     src: 'S-Sonne' },
  { label: 'U-Boot',    src: 'U-Uboot' },
  { label: 'Uhr',       src: 'U_Uhr' },
  { label: 'Vase',      src: 'V-Vase' },
  { label: 'Vogel',     src: 'V-Vogel' },
  { label: 'Wolke',     src: 'W-Wolke' },
  { label: 'Wurm',      src: 'W-Wurm' },
  { label: 'Zebra',     src: 'Z-Zebra' },
  { label: 'Zitrone',   src: 'Z-Zitrone' },
];

const BU_FRAME_ASPECT = 255 / 420;
const BU_IMG_RATIO = 24 / 420;
const BU_WINNER_PAD = 18;

function buRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function buPseudoRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function buContentW(d) {
  if (typeof geom === 'function' && typeof widthFrac === 'function') {
    const pad = d && d.flush ? 0 : BU_WINNER_PAD; // bündig: kein .winner-Padding
    return Math.round(geom().contentW * widthFrac(d) - pad);
  }
  return 400;
}

function buFullContentW() {
  if (typeof geom === 'function') return Math.round(geom().contentW - BU_WINNER_PAD);
  return 400;
}

function buGroesse(d) {
  if (d.groesse === 'klein') return 'klein';
  return 'gross';
}

function buLayout(d) {
  const klein = buGroesse(d) === 'klein';
  const contentW = buContentW(d);
  const colGap = 8;
  const rowGap = klein ? 14 : 48;
  let frameW;
  if (klein) {
    // Klein: feste Aufgabenbreite wie bei voller Seitenbreite (2 pro Zeile),
    // aber nie breiter als das Widget — schmale Widgets brechen per flex-wrap um.
    const ideal = Math.floor((buFullContentW() - colGap) / 2);
    frameW = Math.min(ideal, contentW);
  } else {
    frameW = contentW;
  }
  const frameH = Math.round(frameW * BU_FRAME_ASPECT);
  const baseImg = Math.max(18, Math.round(frameW * BU_IMG_RATIO));
  return {
    klein, colGap, rowGap, frameW, frameH, baseImg, contentW,
    autoBild: d.autoBildGroesse !== false,
    colW: 34,
    cellH: 30,
    headH: 22,
    lineH: 30,
    lineW: 72,
    fs: 16,
    fsHead: 11,
    footGap: 8,
    footInnerGap: 10,
  };
}

// Wenige Bilder → größer, viele → kleiner; bei „Einheitlich“ bleibt baseImg.
function buImgForTask(count, lay) {
  const base = lay.baseImg;
  if (!lay.autoBild) return base;
  const ref = 28;
  let img = base * Math.sqrt(ref / Math.max(1, count));
  const minImg = Math.max(14, Math.round(base * 0.55));
  const maxImg = Math.round(base * 2.15);
  img = Math.max(minImg, Math.min(maxImg, Math.round(img)));
  const innerPad = img * (2 / 3);
  const usableW = Math.max(1, lay.frameW - 2 * innerPad);
  const usableH = Math.max(1, lay.frameH - 2 * innerPad);
  const pitch = img * 0.82;
  const maxFit = Math.floor((usableW / pitch) * (usableH / pitch) * 0.6);
  if (count > maxFit && maxFit > 0) {
    img = Math.max(minImg, Math.round(img * Math.sqrt(maxFit / count)));
  }
  return img;
}

function buAnlautSlot(src, size, x, y) {
  const left = (x - size / 2).toFixed(1);
  const top = (y - size / 2).toFixed(1);
  return `<span style="position:absolute;left:${left}px;top:${top}px;width:${size}px;height:${size}px;`
    + `display:flex;align-items:center;justify-content:center;pointer-events:none;">`
    + `<img src="assets/anlaut/${src}.svg" alt="" width="${size}" height="${size}" `
    + `style="display:block;width:${size}px;height:${size}px;min-width:${size}px;max-width:${size}px;`
    + `min-height:${size}px;max-height:${size}px;object-fit:contain;flex-shrink:0;">`
    + `</span>`;
}

function buScatter(count, src, frameW, frameH, imgSize, seed) {
  const html = [];
  const innerPad = imgSize * (2 / 3);
  const minX = innerPad + imgSize / 2;
  const maxX = frameW - innerPad - imgSize / 2;
  const minY = innerPad + imgSize / 2;
  const maxY = frameH - innerPad - imgSize / 2;
  const placed = [];
  for (let i = 0; i < count; i++) {
    let x = frameW / 2, y = frameH / 2;
    for (let att = 0; att < 100; att++) {
      const s = seed + i * 131 + att * 17;
      const tx = minX + buPseudoRand(s * 7) * (maxX - minX);
      const ty = minY + buPseudoRand(s * 13) * (maxY - minY);
      if (placed.every(p => Math.hypot(tx - p.x, ty - p.y) >= imgSize * 0.82)) {
        x = tx; y = ty; break;
      }
      x = tx; y = ty;
    }
    placed.push({ x, y });
    html.push(buAnlautSlot(src, imgSize, x, y));
  }
  return html.join('');
}

function buHzeTable(count, isActive, lay) {
  const showH = count === 100;
  const cols = showH ? ['H', 'Z', 'E'] : ['Z', 'E'];
  const vals = showH
    ? [1, 0, 0]
    : [Math.floor(count / 10), count % 10];
  const { colW, cellH, headH, fs, fsHead } = lay;
  const head = cols.map(l =>
    `<th style="width:${colW}px;min-width:${colW}px;padding:0;border:1px solid #888;`
    + `background:#f0f0f0;font-family:'DidactGothic7',sans-serif;font-size:${fsHead}px;`
    + `font-weight:700;text-align:center;height:${headH}px;vertical-align:middle;">${l}</th>`
  ).join('');
  const cells = vals.map(v => {
    const show = isActive ? `<span style="color:#2563eb;font-weight:700;font-size:${fs}px;">${v}</span>` : '&nbsp;';
    return `<td style="width:${colW}px;min-width:${colW}px;height:${cellH}px;border:1px solid #888;`
      + `background:#fff;text-align:center;vertical-align:middle;font-family:'DidactGothic7',sans-serif;">${show}</td>`;
  }).join('');
  return `<table style="border-collapse:collapse;table-layout:fixed;background:#fff;">`
    + `<thead><tr>${head}</tr></thead><tbody><tr>${cells}</tr></tbody></table>`;
}

function buNumberLine(count, isActive, lay) {
  const { lineH, lineW, fs } = lay;
  const inner = isActive
    ? `<span style="color:#2563eb;font-weight:700;font-size:${fs}px;font-family:'DidactGothic7',sans-serif;">${count}</span>`
    : '&nbsp;';
  return `<div style="display:flex;align-items:flex-end;min-width:${lineW}px;height:${lineH + 4}px;`
    + `padding-bottom:2px;border-bottom:1.6px solid #333;box-sizing:border-box;background:#fff;">${inner}</div>`;
}

function buTaskHtml(task, isActive, lay) {
  const seed = (task.count * 997) ^ String(task.src).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const img = buImgForTask(task.count, lay);
  const imgs = buScatter(task.count, task.src, lay.frameW, lay.frameH, img, seed);
  return `<div style="width:${lay.frameW}px;">`
    + `<div style="position:relative;width:${lay.frameW}px;height:${lay.frameH}px;`
    + `border:1.5px solid #888;border-radius:4px;background:#fff;overflow:hidden;box-sizing:border-box;">${imgs}</div>`
    + `<div style="display:flex;justify-content:center;margin-top:${lay.footGap}px;">`
    + `<div style="display:flex;align-items:flex-end;gap:${lay.footInnerGap}px;">`
    + `${buHzeTable(task.count, isActive, lay)}${buNumberLine(task.count, isActive, lay)}`
    + `</div></div></div>`;
}

function buGridHtml(tasks, isActive, lay) {
  const items = tasks.map(t => buTaskHtml(t, isActive, lay)).join('');
  return `<div style="display:flex;flex-wrap:wrap;column-gap:${lay.colGap}px;row-gap:${lay.rowGap}px;">${items}</div>`;
}

function buClampCounts(w) {
  w.minAnzahl = Math.max(1, Math.min(100, w.minAnzahl ?? 10));
  w.maxAnzahl = Math.max(1, Math.min(100, w.maxAnzahl ?? 100));
  if (w.minAnzahl > w.maxAnzahl) w.minAnzahl = w.maxAnzahl;
}

function buBildByName(name) {
  const q = String(name).trim().toLowerCase();
  if (!q) return null;
  return BUENDELN_BILDER.find(b =>
    b.label.toLowerCase() === q ||
    b.src.toLowerCase() === q ||
    b.src.split('-').pop().toLowerCase() === q
  ) || null;
}

// Textformat: eine Zeile pro Aufgabe — „37“ oder „37 Maus“
function buTaskToLine(t) {
  const b = BUENDELN_BILDER.find(x => x.src === t.src);
  return b ? `${t.count} ${b.label}` : String(t.count);
}

function buTasksToText(w) {
  return (w.tasks || []).map(buTaskToLine).join('\n');
}

function buParseLine(line, fallbackSrc) {
  const trimmed = String(line).trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{1,3})\s*(?:[,;]\s*|\s+)?(.*)?$/);
  if (!m) return null;
  const count = parseInt(m[1], 10);
  if (count < 1 || count > 100) return null;
  let src = fallbackSrc || 'A-Apfel';
  if (m[2] && m[2].trim()) {
    const hit = buBildByName(m[2]);
    if (hit) src = hit.src;
  }
  return { count, src };
}

function buApplyManual(w, text) {
  w.manualText = text;
  const fallback = w.bildSrc || 'A-Apfel';
  const tasks = String(text).split('\n')
    .map(l => buParseLine(l, fallback))
    .filter(Boolean);
  if (tasks.length) {
    w.tasks = tasks;
    w.anzahl = tasks.length;
  }
}

function buAppendTask(w) {
  const src = w.bildSrc || 'A-Apfel';
  const zufallBild = w.zufallBild !== false;
  buClampCounts(w);
  const { minAnzahl: min, maxAnzahl: max } = w;
  return {
    count: buRand(min, max),
    src: zufallBild ? BUENDELN_BILDER[buRand(0, BUENDELN_BILDER.length - 1)].src : src,
  };
}

function buGenTasks(w) {
  const n = Math.max(1, Math.min(8, w.anzahl || 2));
  w.anzahl = n;
  w.tasks = Array.from({ length: n }, () => buAppendTask(w));
  w.manualText = buTasksToText(w);
}

function buResize(w) {
  const n = Math.max(1, Math.min(8, w.anzahl || 2));
  const tasks = (w.tasks || []).slice(0, n);
  while (tasks.length < n) tasks.push(buAppendTask(w));
  w.tasks = tasks;
  w.anzahl = n;
  w.manualText = buTasksToText(w);
}

WIDGETS.push({
  meta: {
    type: 'buendeln',
    group: 'rechenformate',
    label: 'Bündeln',
    desc: 'Bilder zählen und in H/Z/E eintragen',
    icon: '📦',
    category: 'mathematik',
  },

  createData: id => {
    const w = {
      id, type: 'buendeln',
      anzahl: 2,
      bildSrc: 'A-Apfel',
      zufallBild: true,
      minAnzahl: 10,
      maxAnzahl: 100,
      groesse: 'klein',
      autoBildGroesse: true,
      aufgabenNr: 0, aufgabenText: '',
    };
    buGenTasks(w);
    return w;
  },

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const tasks = d.tasks || [];
    const lay = buLayout(d);
    return atHtml(d) + buGridHtml(tasks, isActive, lay);
  },

  renderProps: d => {
    const anzahl = d.anzahl || 2;
    const bildSrc = d.bildSrc || 'A-Apfel';
    const zufallBild = d.zufallBild !== false;
    const minAnzahl = d.minAnzahl ?? 10;
    const maxAnzahl = d.maxAnzahl ?? 100;
    const klein = buGroesse(d) === 'klein';
    const autoBild = d.autoBildGroesse !== false;

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    const bildBtns = BUENDELN_BILDER.map(b => {
      const on = !zufallBild && bildSrc === b.src;
      return `<button onclick="event.stopPropagation();buSetBild(${d.id},'${b.src}')"
        title="${b.label}"
        style="padding:2px;border:2px solid ${on ? '#89b4fa' : '#eee'};border-radius:4px;
               background:${on ? '#e8f0fe' : '#fff'};cursor:pointer;line-height:0;">
        <img src="assets/anlaut/${b.src}.svg" width="22" height="22" style="display:block;object-fit:contain;">
      </button>`;
    }).join('');

    return `<div class="prow"><label>Bild</label>
        <div style="display:flex;gap:4px;margin-bottom:4px;">
          ${toggleBtn('Zufällig', zufallBild, `buSetZufallBild(${d.id},true)`)}
          ${toggleBtn('Fest', !zufallBild, `buSetZufallBild(${d.id},false)`)}
        </div>
        ${zufallBild ? '' : `<div style="display:flex;flex-wrap:wrap;gap:3px;max-height:120px;overflow:auto;
          padding:4px;border:1.5px solid #eee;border-radius:6px;">${bildBtns}</div>`}
      </div>` +
      pr('Anzahl Aufgaben',
        `<input type="number" min="1" max="8" value="${anzahl}" onclick="event.stopPropagation()"
          onchange="buSet(${d.id},'anzahl',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      pr('Bilder min',
        `<input type="number" min="1" max="100" value="${minAnzahl}" onclick="event.stopPropagation()"
          onchange="buSet(${d.id},'minAnzahl',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      pr('Bilder max',
        `<input type="number" min="1" max="100" value="${maxAnzahl}" onclick="event.stopPropagation()"
          onchange="buSet(${d.id},'maxAnzahl',+this.value)"
          style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;">`) +
      `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Klein', klein, `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn('Groß', !klein, `upd(${d.id},'groesse','gross')`)}
        </div></div>` +
      `<div class="prow"><label>Symbole</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Automatisch', autoBild, `upd(${d.id},'autoBildGroesse',true)`)}
          ${toggleBtn('Einheitlich', !autoBild, `upd(${d.id},'autoBildGroesse',false)`)}
        </div></div>` +
      `<button onclick="event.stopPropagation();buWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
      propFold('bu-manuell', 'Manuelle Bearbeitung',
        pr('Manuell bearbeiten (eine Zeile pro Aufgabe, z.B. 37 Maus)',
          `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
            onclick="event.stopPropagation()" onchange="buManual(${d.id},this.value)">${esc(d.manualText != null ? d.manualText : buTasksToText(d))}</textarea>`),
        false);
  },
});

function buSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  if (key === 'minAnzahl' || key === 'maxAnzahl') {
    w[key] = Math.max(1, Math.min(100, val || 1));
    buClampCounts(w);
    buGenTasks(w);
  } else {
    w[key] = val;
    if (key === 'anzahl') buResize(w);
  }
  render(); renderProps(id);
}

function buSetBild(id, src) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.bildSrc = src;
  w.zufallBild = false;
  buGenTasks(w);
  render(); renderProps(id);
}

function buSetZufallBild(id, zufall) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.zufallBild = zufall;
  buGenTasks(w);
  render(); renderProps(id);
}

function buWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  buGenTasks(w);
  render(); renderProps(id);
}

function buManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  buApplyManual(w, text);
  render(); renderProps(id);
}
