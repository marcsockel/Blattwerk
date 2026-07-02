// ── Shared widget helpers ──────────────────────────────────────────
// Loaded once before all widget scripts.

/**
 * parseMarkup(text)
 * Konvertiert einfaches Markup zu HTML für Display/Speicherung.
 * **text** → <b>, _text_ → <i>, __text__ → <u>, \n → <br>
 */
function parseMarkup(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => {
      const safe = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return safe
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
        .replace(/__(.+?)__/g,     '<u>$1</u>')
        .replace(/_(.+?)_/g,       '<i>$1</i>');
    })
    .join('<br>');
}

/**
 * htmlToMarkup(html)
 * Konvertiert gespeichertes HTML zu Markup für die Textarea-Anzeige.
 */
function htmlToMarkup(html) {
  if (!html) return '';
  return html
    .replace(/<b>([\s\S]*?)<\/b>/gi,          '**$1**')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<i>([\s\S]*?)<\/i>/gi,          '_$1_')
    .replace(/<em>([\s\S]*?)<\/em>/gi,        '_$1_')
    .replace(/<u>([\s\S]*?)<\/u>/gi,          '__$1__')
    .replace(/<br\s*\/?>/gi,                  '\n')
    .replace(/<[^>]+>/g,                      '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'");
}

/**
 * atHtml(d)
 * Renders the task-number badge + label above a widget's task block.
 * Uses d.aufgabenNr (0 = no badge) and d.aufgabenText.
 */
function atHtml(d) {
  const nr  = d.aufgabenNr || 0;
  const txt = (d.aufgabenText || '').trim();
  if (!nr && !txt) return '';
  // Stil der Nummer: kreis | kreis-fill | quadrat | quadrat-fill
  const stil   = d.aufgabenStil || 'kreis';
  const radius = stil.startsWith('quadrat') ? '3px' : '50%';
  const fill   = stil.endsWith('-fill');
  return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
    ${nr > 0
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;
           width:16px;height:16px;border-radius:${radius};border:1.5px solid #222;
           background:${fill ? '#222' : 'transparent'};
           font-family:'DidactGothic7',sans-serif;font-size:10px;font-weight:700;
           color:${fill ? '#fff' : '#222'};flex-shrink:0;line-height:1;">${nr}</span>`
      : ''}
    ${txt
      ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:13px;
           color:#222;">${esc(txt)}</span>`
      : ''}
  </div>`;
}

// Ausrichtungs-Toggle (Links / Mitte / Rechts) für Text-Widgets.
// Setzt d.align ('left' | 'center' | 'right'); im Render text-align nutzen.
function alignToggle(id, align) {
  const cur = align || 'left';
  const btn = (val, label) =>
    `<button onclick="event.stopPropagation();upd(${id},'align','${val}')"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
             background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
  return `<div class="prow"><label>Ausrichtung</label>
    <div style="display:flex;gap:4px;">
      ${btn('left','Links')}${btn('center','Mitte')}${btn('right','Rechts')}
    </div></div>`;
}

// Hinweis: Der frühere Helfer atProps() (Hintergrund + Aufgabentext) wurde
// entfernt. Diese Felder werden jetzt zentral im Standard-Props-Footer
// (standardFooter() in index.html) für alle Widgets einheitlich gerendert.

// ── Klappbare Props-Abschnitte (Eigenschaftenfenster) ───────────────
const _propFold = {};
function propFoldIsOpen(key, defaultOpen) {
  return Object.prototype.hasOwnProperty.call(_propFold, key) ? _propFold[key] : defaultOpen;
}
function propFoldSave(key, open) {
  _propFold[key] = open;
}
/** Klappbarer Block für das Eigenschaftenfenster. key = globaler Zustandsschlüssel. */
function propFold(key, title, inner, defaultOpen) {
  if (defaultOpen === undefined) defaultOpen = false;
  const open = propFoldIsOpen(key, defaultOpen);
  const k = String(key).replace(/'/g, "\\'");
  return `<details class="prop-fold"${open ? ' open' : ''} ontoggle="propFoldSave('${k}',this.open)">
    <summary class="prop-fold-h">${title}</summary>
    <div class="prop-fold-b">${inner}</div>
  </details>`;
}

// ── Zentrale Font-Listen (vorher dupliziert in gap_text/aeue/auslaut) ──
// GAP_FONTS: volle Auswahl für Text-Widgets (heading, text, infobox, …)
const GAP_FONTS = [
  { value: "inherit",                       label: "Standard (Nunito)" },
  { value: "'Andika', sans-serif",          label: "Andika" },
  { value: "'Lexend', sans-serif",          label: "Lexend" },
  { value: "'Quicksand', sans-serif",       label: "Quicksand" },
  { value: "'Caveat', cursive",             label: "Caveat (Handschrift)" },
  { value: "'Fira Sans', sans-serif",       label: "Fira Sans" },
  { value: "'Grundschrift', sans-serif",    label: "Grundschrift" },
  { value: "'DidactGothic7', sans-serif",   label: "Didact Gothic" },
  { value: "'DM Mono', monospace",          label: "DM Mono" },
  { value: "Georgia, serif",                label: "Georgia (Serif)" },
  { value: "'Arial', sans-serif",           label: "Arial" },
];
// SCHREIB_FONTS: kompakte Liste für Schreib-Übungswidgets (aeue, auslaut)
const SCHREIB_FONTS = [
  { value: "'Grundschrift', sans-serif",  label: "Grundschrift" },
  { value: "inherit",                     label: "Standard (Nunito)" },
  { value: "'DidactGothic7', sans-serif", label: "Didact Gothic" },
  { value: "'DM Mono', monospace",        label: "DM Mono" },
  { value: "Georgia, serif",              label: "Georgia" },
];

/**
 * seededShuffle(arr, seed)
 * Deterministisches Fisher-Yates-Shuffle (LCG). Gleicher Seed → gleiche
 * Reihenfolge bei jedem Render, damit Druck/PDF der Vorschau entspricht.
 */
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Einheitliches Reihen-Verteilungs-Layout für gleich breite Items
 * (Rechenpäckchen, Karten, SVG-Felder, Räder, Tabellen, Stücke …).
 *
 * EIN Modus für alle: flex-wrap. Der Browser bricht an der ECHTEN Breite um.
 *  - Volle Zeile → über die Breite verteilt (space-between; erstes randbündig links, letztes
 *    rechts), letzte/unvolle Zeile via unsichtbarer Füller (echtes Item auf Höhe 0) ausgerichtet.
 *  - Wenige Items / Zeile nicht voll → eng linksbündig (flex-start), NICHT vorab verteilt.
 * Die Voll/Nicht-voll-Entscheidung nutzt eine perRow-Schätzung aus opts.itemW + opts.d
 * (geom().contentW×widthFrac(d) MINUS .winner-Padding). Die echte Spaltenzahl macht der Browser.
 *
 * @param {string[]} innerHtmls  Item-Inhalte (je 1 Item).
 * @param {object} [opts] gap, itemSize, marginBottom, sample, itemW (px), d (Widget-Daten).
 * @returns {string} HTML des Layout-Containers.
 */
function flexDistribute(innerHtmls, opts) {
  opts = opts || {};
  const gap = opts.gap != null ? opts.gap : 24;
  const sz  = opts.itemSize || '';
  const mb  = opts.marginBottom != null ? opts.marginBottom : 16;
  const samp = opts.sample != null ? opts.sample : (innerHtmls[0] || '');
  const n = innerHtmls.length;
  const items = innerHtmls.map(h => `<div style="flex:0 0 auto;${sz}margin-bottom:${mb}px;">${h}</div>`).join('');

  // Voll/Nicht-voll-Entscheidung: passt noch ein Item in die Zeile → eng linksbündig, sonst
  // verteilen (volle Zeile). perRow aus bekannter Itembreite + verfügbarer Breite.
  // WICHTIG: vom Blatt-Inhaltsmaß (geom().contentW) das .winner-Padding (~18px links+rechts)
  // ABZIEHEN — sonst zählt die Schätzung eine Spalte zu viel (Bug: „nur 4 passen, aber bei 4
  // wird nicht verteilt"). Die echte Spaltenzahl macht weiterhin der Browser (flex-wrap).
  const WINNER_PAD = 18;
  let perRow = Infinity;
  if (opts.itemW && opts.d && typeof geom === 'function' && typeof widthFrac === 'function') {
    const avail = geom().contentW * widthFrac(opts.d) - WINNER_PAD;
    perRow = Math.max(1, Math.floor((avail + gap) / (opts.itemW + gap)));
  }
  if (n < perRow) {
    // keine volle Zeile → eng linksbündig, ohne Füller
    return `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;column-gap:${gap}px;row-gap:0;justify-content:flex-start;">${items}</div>`;
  }
  // Füller (echtes Item auf Höhe 0) richten die letzte Zeile an denselben Spalten aus.
  const filler  = `<div aria-hidden="true" style="flex:0 0 auto;margin:0;${sz}height:0;overflow:hidden;">${samp}</div>`;
  const fillers = n ? Array(16).fill(filler).join('') : '';
  return `<div style="display:flex;flex-wrap:wrap;align-items:flex-start;column-gap:${gap}px;row-gap:0;justify-content:space-between;">${items}${fillers}</div>`;
}

// ── Tusche-Rahmen (handgezeichnet wirkende SVG-Kontur) ──────────────
const INK_WAVE_PX = 13;   // Wellenlänge in px — gleich auf allen Seiten
const INK_JITTER_PX = 1; // Sketch-Ghost-Versatz in px (Basis, mit Zufallsstreuung)
const INK_DISP_PX = 2.8;  // Roughen-Amplitude in px (≈ früher sichtbar, jetzt px-einheitlich)
const INK_INSET_PX = 0.5; // Pfadmittel am Rand (≈ halbe Strichstärke)
const INK_RENDER_VER = '5';

function inkRand(seed) {
  let s = ((seed >>> 0) * 2654435761) >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function frameInkStroke() {
  return 1.35;
}

function frameInkCornerR(W, H) {
  return Math.min(8, Math.max(2, Math.min(W, H) * 0.04));
}

function frameInkBasePathPx(m, W, H, rounded) {
  if (!rounded) {
    return `M ${m},${m} H ${W - m} V ${H - m} H ${m} Z`;
  }
  const cr = frameInkCornerR(W, H);
  const x1 = m, x2 = W - m, y1 = m, y2 = H - m;
  return `M ${x1 + cr},${y1} H ${x2 - cr} Q ${x2},${y1} ${x2},${y1 + cr}`
    + ` V ${y2 - cr} Q ${x2},${y2} ${x2 - cr},${y2} H ${x1 + cr}`
    + ` Q ${x1},${y2} ${x1},${y2 - cr} V ${y1 + cr} Q ${x1},${y1} ${x1 + cr},${y1} Z`;
}

function frameInkStrokePath(d, sw, opacity, dx, dy) {
  const tr = (dx || dy) ? ` transform="translate(${dx.toFixed(2)},${dy.toFixed(2)})"` : '';
  return `<path d="${d}" fill="none" stroke="#2a2a2a" stroke-width="${sw}" stroke-opacity="${opacity}"`
    + ` stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"${tr}/>`;
}

/** SVG-Inhalt in Pixel-Koordinaten (1 Einheit = 1 px, gleichmäßige Verzerrung). */
function frameInkSvgInner(w, W, H) {
  const widgetId = w.id;
  const r = inkRand(widgetId);
  const base = frameInkStroke();
  const m = INK_INSET_PX;
  const rounded = typeof frameEcken === 'function' && frameEcken(w) === 'rund';
  const d = frameInkBasePathPx(m, W, H, rounded);
  const fid = `ink-f-${widgetId}`;
  const seed = widgetId % 997;
  const freq = (1 / INK_WAVE_PX).toFixed(5);
  const fPad = 4;

  let ghosts = '';
  const nSketch = 4;
  for (let i = 0; i < nSketch; i++) {
    const jitter = INK_JITTER_PX * (0.75 + r() * 0.5);
    const dx = (r() - 0.5) * jitter * 2;
    const dy = (r() - 0.5) * jitter * 2;
    const sw = (base * (0.6 + r() * 0.5)).toFixed(2);
    const op = (0.2 + r() * 0.22).toFixed(2);
    ghosts += frameInkStrokePath(d, sw, op, dx, dy);
  }

  const main = frameInkStrokePath(d, base.toFixed(2), 1, 0, 0);

  return `<defs>`
    + `<filter id="${fid}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse"`
    + ` x="${-fPad}" y="${-fPad}" width="${W + fPad * 2}" height="${H + fPad * 2}" color-interpolation-filters="sRGB">`
    + `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="noise"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${INK_DISP_PX}" xChannelSelector="R" yChannelSelector="G"/>`
    + `</filter></defs>`
    + `<g filter="url(#${fid})">${ghosts}${main}</g>`;
}

/** Platzhalter-SVG — fitFrameInkSvg() zeichnet nach dem Layout in echten Pixeln. */
function frameInkOverlay(w) {
  return `<svg class="frame-ink-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"`
    + ` style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;"`
    + ` viewBox="0 0 1 1"></svg>`;
}

function disconnectInkObserverOn(el) {
  if (!el || !el._inkFitObs) return;
  el._inkFitObs.disconnect();
  delete el._inkFitObs;
}

/** Tusche-ResizeObserver trennen — vor innerHTML-Ersetzung oder vollem render(). */
function disconnectInkObservers(root) {
  const scope = root && root.querySelectorAll ? root : document;
  disconnectInkObserverOn(root);
  scope.querySelectorAll('.winner.frame-ink, .group-frame.frame-ink').forEach(disconnectInkObserverOn);
  // Legacy: Observer direkt am SVG (ältere Sessions)
  scope.querySelectorAll('svg.frame-ink-svg').forEach(disconnectInkObserverOn);
}

function attachInkResizeObserver(svg) {
  const host = svg && svg.closest('.winner, .group-frame');
  if (!host || host._inkFitObs) return;
  host._inkFitObs = new ResizeObserver(() => {
    host.querySelectorAll('svg.frame-ink-svg').forEach(s => fitFrameInkSvg(s));
  });
  host._inkFitObs.observe(host);
}

/** .winner-Inhalt ersetzen — ink-Observer vorher sauber trennen. */
function replaceWinnerContent(winner, html) {
  if (!winner) return;
  disconnectInkObservers(winner);
  winner.innerHTML = html;
}

/** Teil-Update von .winner inkl. Tusche-/Zahlenstrahl-Fit. */
function winnerInnerRefresh(w, winner) {
  if (!w || !winner) return;
  replaceWinnerContent(winner, winnerInner(w));
  if (typeof fitAllFrameInkSvgs === 'function') fitAllFrameInkSvgs(winner);
  if (typeof fitNumberlineSvg === 'function') {
    winner.querySelectorAll('svg.numberline-svg').forEach(fitNumberlineSvg);
  }
}

/** Misst Container und zeichnet Tusche-Rand mit einheitlicher px-Skalierung. */
function fitFrameInkSvg(svg) {
  const W = Math.round(svg.clientWidth);
  const H = Math.round(svg.clientHeight);
  if (W < 2 || H < 2) return;
  const wwrap = svg.closest('.wwrap');
  if (!wwrap || typeof widgets === 'undefined') return;
  const w = widgets.find(x => x.id === +wwrap.dataset.id);
  if (!w) return;
  const b = typeof frameBorder === 'function' ? frameBorder(w) : (w.border || '');
  if (b !== 'ink') {
    disconnectInkObserverOn(svg);
    disconnectInkObserverOn(svg.closest('.winner, .group-frame'));
    return;
  }
  if (svg.dataset.inkW === String(W) && svg.dataset.inkH === String(H)
    && svg.dataset.inkVer === INK_RENDER_VER && svg.innerHTML) return;
  svg.dataset.inkW = W;
  svg.dataset.inkH = H;
  svg.dataset.inkVer = INK_RENDER_VER;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = frameInkSvgInner(w, W, H);
  attachInkResizeObserver(svg);
}

function fitAllFrameInkSvgs(root) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('svg.frame-ink-svg').forEach(svg => fitFrameInkSvg(svg));
}

function frameInkInsert(w) {
  const b = typeof frameBorder === 'function' ? frameBorder(w) : (w.border || '');
  if (b === 'ink') return frameInkOverlay(w);
  return '';
}

function frameInkPad() {
  return '8px';
}

/** Inhalt von .winner inkl. Tusche-SVG (für Teil-Updates in sel/desel). */
function winnerInner(w) {
  const def = typeof WIDGET_MAP !== 'undefined' ? WIDGET_MAP[w.type] : null;
  if (!def) return '';
  return frameInkInsert(w) + def.render(w);
}
