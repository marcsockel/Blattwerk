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
  if (d._mtCell != null) return '';
  const nr  = d.aufgabenNr || 0;
  const txt = (d.aufgabenText || '').trim();
  if (!nr && !txt) return '';
  // Stil der Nummer: kreis | kreis-fill | quadrat | quadrat-fill
  const stil   = d.aufgabenStil || 'kreis';
  const radius = stil.startsWith('quadrat') ? '3px' : '50%';
  const fill   = stil.endsWith('-fill');
  return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    ${nr > 0
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;
           width:22px;height:22px;border-radius:${radius};border:1.8px solid #222;
           background:${fill ? '#222' : 'transparent'};
           font-family:'DidactGothic7',sans-serif;font-size:13px;font-weight:700;
           color:${fill ? '#fff' : '#222'};flex-shrink:0;line-height:1;">${nr}</span>`
      : ''}
    ${txt
      ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:18px;
           color:#222;line-height:1.2;">${esc(txt)}</span>`
      : ''}
  </div>`;
}

/**
 * ptHtml(d)
 * Punktetext unten rechts (z.B. „___/6 Pkt."), Gegenstück zu atHtml oben links.
 * d.punkte (0 = aus), d.punkteEinheit ('Pkt.' | 'Punkte' | '' = ohne).
 * Wird zentral ans Winner-Ende gehängt (makeWrap/winnerInner) — Widgets, deren
 * Daten kein punkte-Feld haben, bleiben unverändert.
 */
function ptHtml(d) {
  if (d._mtCell != null) return '';
  const pts = d.punkte || 0;
  if (!pts) return '';
  const einheit = d.punkteEinheit != null ? d.punkteEinheit : 'Pkt.';
  return `<div style="display:flex;justify-content:flex-end;align-items:flex-end;gap:5px;margin-top:8px;
      font-family:'DidactGothic7',sans-serif;font-size:13px;color:#222;line-height:1;">
    <span style="display:inline-block;width:30px;border-bottom:1.5px solid #222;height:15px;"></span>
    <span>/ ${pts}${einheit ? ' ' + esc(einheit) : ''}</span>
  </div>`;
}

function widgetIsActive(d) {
  if (_solutionsMode) return true;
  if (d._mtCell != null && d._mtParent != null) {
    return selId === d._mtParent && _mtSel
      && _mtSel.id === d._mtParent && _mtSel.idx === d._mtCell;
  }
  return d.id === selId;
}

// Ausrichtungs-Toggle (Links / Mitte / Rechts) für Text-Widgets.
// Setzt d.align ('left' | 'center' | 'right'); im Render text-align nutzen.
function alignToggle(id, align, withJustify) {
  const cur = align || 'left';
  const btn = (val, label) =>
    `<button onclick="event.stopPropagation();upd(${id},'align','${val}')"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
             background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
  return `<div class="prow"><label>Ausrichtung</label>
    <div style="display:flex;gap:4px;">
      ${btn('left','Links')}${btn('center','Mitte')}${btn('right','Rechts')}${withJustify ? btn('justify','Block') : ''}
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

/** Schriftliches Rechnen: Kästchengröße (aktuell = klein). */
const SCHRIFTLICH_SIZE = {
  klein:  { cs: 20, fs: 14 },
  mittel: { cs: 28, fs: 18 },
  gross:  { cs: 36, fs: 24 },
};
function schriftlichSize(d) {
  const g = (d && d.groesse) || 'klein';
  return SCHRIFTLICH_SIZE[g] || SCHRIFTLICH_SIZE.klein;
}
function schriftlichGroesseBlock(id, d) {
  const g = (d && d.groesse) || 'klein';
  const btn = (val, label) => {
    const on = g === val;
    return `<button onclick="event.stopPropagation();upd(${id},'groesse','${val}')"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on ? '#a6e3a1' : '#ddd'};
             background:${on ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${on ? '#1e1e2e' : '#999'};">${label}</button>`;
  };
  return `<div class="prow"><label>Größe</label>
    <div style="display:flex;gap:4px;">
      ${btn('klein', 'Klein')}${btn('mittel', 'Mittel')}${btn('gross', 'Groß')}
    </div></div>`;
}

/** Einheitliche Item-Verteilung: Pro Zeile / Ausrichtung / Abstände (Footer „Verteilung"). */
const ITEM_GAP_MAP = {
  eng:    { h: 12, v: 12 },  // verkleinert (2026-07-31) — kommt näher an die alten,
                             // pro Widget fest einprogrammierten Abstände heran
                             // (z.B. zahlenhaus 10px), damit „Eng" wieder mehr
                             // Items pro Zeile erlaubt als der neue Mittel-Default.
  normal: { h: 43, v: 29 },  // früher „Weit“ — UI-Label „Mittel“
  weit:   { h: 64, v: 44 },  // ~ gleiche Stufe weiter
};

/** Standardwerte für neue Widgets mit itemsLayout (Pro Zeile / Ausrichtung / Abstände). */
const ITEMS_LAYOUT_DEFAULTS = {
  itemsPerRow: 'auto',
  align: 'auto',
  itemGapH: 'normal',
  itemGapV: 'normal',
  itemGap: 'normal',
};

function normItemGapKey(v) {
  return ITEM_GAP_MAP[v] ? v : 'normal';
}

/**
 * Normalisiert itemsPerRow / align / itemGapH / itemGapV aus Widget-Daten.
 * Migration: proZeile → itemsPerRow; itemGap → beide Abstände; fehlend → normal.
 */
function itemsLayoutProps(d) {
  d = d || {};
  let per = d.itemsPerRow;
  if (per == null && d.proZeile != null) per = d.proZeile;
  if (per === 'auto' || per == null || per === '' || per === 0) per = 'auto';
  else {
    per = Math.max(1, Math.min(6, Math.round(+per) || 1));
  }
  // Nur noch Links | Mitte | Block (Default). Ältere Werte werden umgedeutet:
  // 'auto' → Block, 'right' → Mitte. So gibt es keine Einstellung mehr, die schlecht aussieht.
  let align = d.align;
  if (align === 'right') align = 'center';
  if (!['left', 'center', 'justify'].includes(align)) align = 'justify';
  let gapHKey = d.itemGapH;
  let gapVKey = d.itemGapV;
  if (gapHKey == null && gapVKey == null) {
    if (d.itemGap != null) gapHKey = gapVKey = d.itemGap;
    else if (d.abstand != null) gapHKey = gapVKey = d.abstand; // Blattwerkstatt-Altfeld
  }
  gapHKey = normItemGapKey(gapHKey || 'normal');
  gapVKey = normItemGapKey(gapVKey || 'normal');
  // Spaltenabstand ist keine Einstellung mehr → immer „Mittel". Auch bei Block NICHT 0:
  // Widgets mit eigenem Raster (bildwort, hunderterfeld) nutzen L.gap direkt.
  const gapH = ITEM_GAP_MAP.normal.h;
  const gapV = ITEM_GAP_MAP[gapVKey].v;
  return {
    itemsPerRow: per, align,
    itemGapH: gapHKey, itemGapV: gapVKey,
    itemGap: gapHKey,
    gap: gapH, mb: gapV,
  };
}

/** Props-UI: Pro Zeile / Ausrichtung / Abstand (Eigenschaften → Verteilung). */
function itemsLayoutPropsBlock(id, w) {
  const L = itemsLayoutProps(w);
  const btn = (key, val, label) => {
    const cur = L[key];
    const on = cur === val;
    const v = typeof val === 'string' ? `'${val}'` : val;
    return `<button onclick="event.stopPropagation();upd(${id},'${key}',${v})"
      style="flex:1;padding:5px 2px;border-radius:4px;border:none;
             background:${on ? '#3b6fd4' : '#eef0f4'};font-family:inherit;font-size:11px;font-weight:700;
             cursor:pointer;color:${on ? '#fff' : '#7c828d'};">${label}</button>`;
  };
  // Nur Anzahlen anbieten, die mit Mindestabstand wirklich in die Breite passen
  // (aus der gemessenen Serie). Ohne Messung (noch nicht gerendert) → alle.
  const maxFit = seriesMaxFit(id);
  const perRowBtns = ['auto', 1, 2, 3, 4, 5, 6].filter(v => v === 'auto' || v <= maxFit || v === L.itemsPerRow).map(v => btn('itemsPerRow', v, v === 'auto' ? 'Auto' : String(v))).join('');
  const alignBtns = [
    ['left', 'Links'], ['center', 'Mitte'], ['justify', 'Block']
  ].map(([v, l]) => btn('align', v, l)).join('');
  const gapBtns = (key) => [
    ['eng', 'Eng'], ['normal', 'Mittel'], ['weit', 'Weit']
  ].map(([v, l]) => btn(key, v, l)).join('');
  return `<div class="sf-h">Pro Zeile</div>
    <div style="display:flex;gap:3px;margin-bottom:9px;">${perRowBtns}</div>
    <div class="sf-h">Ausrichtung</div>
    <div style="display:flex;gap:3px;margin-bottom:9px;">${alignBtns}</div>
    <div class="sf-h">Zeilenabstand</div>
    <div style="display:flex;gap:3px;">${gapBtns('itemGapV')}</div>`;
}

/**
 * Einheitliches Reihen-Verteilungs-Layout für gleich breite Items
 * (Rechenpäckchen, Karten, SVG-Felder, Räder, Tabellen, Stücke …).
 *
 * Steuerung über d.itemsPerRow / d.align / d.itemGapH / d.itemGapV (Props „Verteilung"):
 *  - Pro Zeile Auto → der Browser MISST die echte Container-Breite (ResizeObserver,
 *    siehe fitSeries/attachSeries unten) und setzt die Spaltenzahl — keine
 *    geom()-Schätzung mehr.
 *  - Pro Zeile 1–6 → feste Spaltenzahl, unabhängig von der Breite.
 *  - Ausrichtung Auto → volle Zeile spreizt (space-between), sonst eng
 *    (links/mitte/rechts). Block → spreizt IMMER, auch bei nicht voller Zeile.
 *  - Spaltenabstand Eng/Normal/Weit → column-gap (bei Blocksatz ausgeblendet/0).
 *  - Zeilenabstand Eng/Normal/Weit → row-gap.
 *
 * Implementierung: EIN `.series`-Grid mit expliziten Spalten `repeat(N, itemW)`.
 * Weil alle Zeilen dieselben Spuren nutzen, richtet sich eine unvollständige
 * letzte Zeile von selbst aus — keine Füller, keine Umbruchkante wie bei
 * flex-wrap (früherer Bug: „nur 4 passen, aber bei 4 wird nicht verteilt").
 *
 * @param {string[]} innerHtmls  Item-Inhalte (je 1 Item).
 * @param {object} [opts] gap, itemSize, marginBottom, sample, itemW (px), d (Widget-Daten).
 * @returns {string} HTML des Layout-Containers.
 */
function flexDistribute(innerHtmls, opts) {
  opts = opts || {};
  const items = innerHtmls || [];
  if (!items.length) return '';

  const d = opts.d || {};
  const layout = itemsLayoutProps(d);
  const sz = opts.itemSize || '';
  const blockMode = layout.align === 'justify';

  // Spaltenabstand ist keine Einstellung mehr: Block verteilt selbst, Links/Mitte
  // nehmen den im Widget abgestimmten Abstand (opts.gap), sonst „Mittel".
  const gapCol = blockMode ? 0 : (opts.gap != null ? opts.gap : ITEM_GAP_MAP.normal.h);
  const gapRow = opts.marginBottom != null ? opts.marginBottom : layout.mb;

  let itemW = +opts.itemW || 0;
  if (!itemW) {
    const m = /width:\s*(\d+(?:\.\d+)?)px/.exec(sz);
    if (m) itemW = parseFloat(m[1]);
  }
  if (!itemW) itemW = 120;
  itemW = Math.round(itemW);

  const perRow = layout.itemsPerRow === 'auto' ? 0 : layout.itemsPerRow;
  const cells = items.map(h => `<div class="series-item" style="${sz}">${h}</div>`).join('');
  const initial = perRow > 0 ? String(perRow) : 'auto-fill';

  return `<div class="series" data-itemw="${itemW}"${opts.estimate ? ' data-estimate="1"' : ''} data-align="${layout.align}"`
    + ` data-gapcol="${gapCol}" data-perrow="${perRow}" data-count="${items.length}"`
    + ` style="--s-col-gap:${gapCol}px;--s-row-gap:${gapRow}px;`
    + `grid-template-columns:repeat(${initial},${itemW}px);">${cells}</div>`;
}

/** Toleranz gegen Bruchbreiten (mm/Zoom). Nach OBEN — bei Grid ist exakte
 *  Gleichheit unproblematisch, anders als bei flex-wrap. */
const SERIES_EPS = 0.5;

/** Kleinster Abstand, den eine feste „Pro Zeile"-Wahl noch haben darf. */
const SERIES_MIN_GAP = 12;

/** Größte sinnvolle „Pro Zeile"-Zahl für ein Widget (aus der letzten Messung). */
function seriesMaxFit(id) {
  const el = document.querySelector(`.wwrap[data-id="${id}"] .series[data-maxfit]`);
  return el ? Math.max(1, +el.dataset.maxfit || 1) : 6;
}

/** Wie viele Items passen bei Breite w nebeneinander? (rein, testbar) */
function seriesFits(w, itemW, minGap) {
  if (!(w > 0) || !(itemW > 0)) return 1;
  return Math.max(1, Math.floor((w + minGap + SERIES_EPS) / (itemW + minGap)));
}

/**
 * Spaltenzahl und Ausrichtung einer Serie. Rein — ohne DOM testbar.
 *
 * WICHTIG zu `align`:
 *   'auto'    = bisheriges Verhalten (volle Zeile verteilen, sonst eng links).
 *   'justify' = AUSDRÜCKLICH Blocksatz: verteilt IMMER über die volle Breite,
 *               auch wenn die Zeile nicht voll ist. Eine Heuristik darf eine
 *               ausdrückliche Wahl nicht überstimmen.
 */
function seriesResolve(o) {
  const { width, itemW, count, perRow, minGap, align } = o;
  // Breite je Item. Ohne Messung: alle gleich itemW. Items gleicher Spalte teilen sich
  // die Spaltenbreite (= breitestes Item der Spalte) → ein einzelnes breites Päckchen
  // (z.B. mit einer 100) macht nicht gleich ALLE Spalten breiter.
  const n0 = Math.max(1, count || 1);
  const ws = (o.widths && o.widths.length) ? o.widths : Array(n0).fill(itemW);
  const wMax = Math.max(...ws);
  const colWidths = n => {
    const c = Array(n).fill(0);
    for (let i = 0; i < Math.max(ws.length, n); i++) c[i % n] = Math.max(c[i % n], ws[i] != null ? ws[i] : wMax);
    return c;
  };
  const need = (n, g) => colWidths(n).reduce((a, b) => a + b, 0) + (n - 1) * g;
  const fitsN = g => { let best = 1; for (let n = 2; n <= 12; n++) if (need(n, g) <= width + SERIES_EPS) best = n; return best; };

  let soll = Math.max(1, perRow > 0 ? perRow : fitsN(minGap));
  let gap = null;   // null = Abstand aus den Props; Zahl = verkleinerter Abstand
  // Feste „Pro Zeile"-Zahl passt mit dem gewählten Abstand nicht in die Breite:
  // erst den Abstand verkleinern (nie unter SERIES_MIN_GAP), sonst weniger Spalten.
  if (perRow > 0 && need(soll, minGap) > width + SERIES_EPS) {
    soll = Math.min(soll, fitsN(SERIES_MIN_GAP));
    if (soll > 1 && need(soll, minGap) > width + SERIES_EPS) {
      gap = Math.floor((width - need(soll, 0)) / (soll - 1));
    }
  }
  const effGap = gap != null ? gap : minGap;
  const passt = need(soll, effGap) <= width + SERIES_EPS;

  const volleZeile = count >= soll;
  const spreizen = soll > 1 && passt && (
    align === 'justify' ||            // ausdrücklich gewählt: immer
    (align === 'auto' && volleZeile)  // Automatik: nur bei voller Zeile
  );

  // Nie mehr Spuren als Items. Sonst hält `space-between` Platz für ein Item
  // frei, das es gar nicht gibt.
  const cols = Math.max(1, Math.min(soll, count));

  const jc = spreizen ? 'space-between'
    : align === 'center' ? 'center'
    : align === 'right' ? 'end'
    : 'start';

  return { cols, jc, spreizen, ueberlauf: !passt, gap, colWidths: colWidths(cols),
           maxFit: fitsN(SERIES_MIN_GAP) };
}

/** Misst einen .series-Container und setzt die Spalten. Kein Re-Render. */
function fitSeries(el) {
  if (!el || !el.isConnected) return;
  const width = el.clientWidth;
  if (!width) return;                       // display:none (Lösungsseiten)

  // itemW ist bei manchen Widgets nur GESCHÄTZT (z.B. Rechenaufgaben im
  // Größer/Kleiner-Modus: zwei Terme + Kästchen sind viel breiter). Ist der
  // echte Inhalt breiter als die Spalte, würde er in die Nachbarspalte bzw.
  // über den Widgetrand ragen → echte Breite messen und nur nach OBEN korrigieren.
  let itemW = +el.dataset.itemw || 0;
  let widths = null;   // nur bei gemessenen (estimate-)Serien: Breite je Item
  if (el.dataset.estimate) {
    // Nur geschätzt → echte Inhaltsbreite messen (Spalten kurz auf max-content).
    // Sonst bleibt bei zu großer Schätzung rechts in jeder Spalte Leerraum, und der
    // Abstand zum rechten Widgetrand ist größer als zum linken.
    el.style.gridTemplateColumns = `repeat(${el.children.length || 1}, max-content)`;
    widths = [...el.children].map(c => Math.ceil(c.getBoundingClientRect().width));
    if (widths.some(v => v > 0)) itemW = Math.max(...widths);
    else widths = null;
  } else {
    for (const c of el.children) itemW = Math.max(itemW, Math.ceil(c.scrollWidth));
  }
  const minGap = +el.dataset.gapcol || 24;
  const r = seriesResolve({
    width, itemW,
    count: +el.dataset.count || el.children.length,
    perRow: +el.dataset.perrow || 0,
    minGap,
    align: el.dataset.align || 'auto',
    widths,
  });

  el.style.gridTemplateColumns = widths
    ? r.colWidths.map(v => v + 'px').join(' ')
    : `repeat(${r.cols}, ${itemW}px)`;
  el.style.justifyContent = r.jc;
  el.style.columnGap = r.gap != null ? r.gap + 'px' : '';
  // Blocksatz: unterschiedlich breite Items in ihrer Spalte so ausrichten, dass sie
  // außen bündig mit dem Rand abschließen (1. Spalte links, letzte rechts, Mitte zentriert).
  // Sonst bleibt bei einem schmaleren Item in der letzten Spalte rechts mehr Luft als links.
  [...el.children].forEach((c, i) => {
    const col = i % r.cols;
    c.style.justifySelf = (!r.spreizen || r.cols < 2) ? ''
      : col === 0 ? 'start' : col === r.cols - 1 ? 'end' : 'center';
  });
  el.classList.toggle('is-stretched', r.spreizen);
  el.classList.toggle('is-overflow', r.ueberlauf);
  el.dataset.fit = String(r.cols);
  el.dataset.mw = String(itemW);
  el.dataset.maxfit = String(widths ? r.maxFit : seriesFits(width, itemW, SERIES_MIN_GAP));
}

/** EIN ResizeObserver für die ganze App — feuert bei Orientierung, Breite,
 *  Zoom und nach dem Fontload, also genau dann, wenn eine Schätzung falsch läge. */
let _seriesRO = null;
function attachSeries(root) {
  if (!_seriesRO && typeof ResizeObserver === 'function') {
    _seriesRO = new ResizeObserver(entries => { for (const e of entries) fitSeries(e.target); });
  }
  (root || document).querySelectorAll('.series').forEach(el => {
    fitSeries(el);
    if (_seriesRO) _seriesRO.observe(el);
  });
}

/** Synchron messen — vor window.print(), weil der Observer zu spät käme. */
function fitAllSeries(root) {
  (root || document).querySelectorAll('.series').forEach(fitSeries);
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
  // Neu erzeugte .series-Container messen (Blocksatz/Spalten) — sonst bleiben
  // sie nach sel()/desel() im Startzustand (auto-fill, linksbündig) stehen.
  if (typeof attachSeries === 'function') attachSeries(winner);
  if (typeof fitAllFrameInkSvgs === 'function') fitAllFrameInkSvgs(winner);
  if (typeof fitNumberlineSvg === 'function') {
    winner.querySelectorAll('svg.numberline-svg').forEach(fitNumberlineSvg);
  }
  // Verbindungslinien (Anlaut-Zuordnung etc.) nach Layout neu messen
  requestAnimationFrame(() => {
    if (typeof matchingDrawNow !== 'function') return;
    winner.querySelectorAll('[data-azsegs]').forEach(box => {
      try {
        const segs = JSON.parse(box.dataset.azsegs || '[]');
        if (segs.length) matchingDrawNow(box.id, ...segs);
      } catch (e) {}
    });
  });
}

/** Misst Container und zeichnet Tusche-Rand mit einheitlicher px-Skalierung. */
function fitFrameInkSvg(svg) {
  const W = Math.round(svg.clientWidth);
  const H = Math.round(svg.clientHeight);
  if (W < 2 || H < 2) return;
  const wwrap = svg.closest('.wwrap');
  if (!wwrap || typeof widgets === 'undefined') return;
  const w0 = widgets.find(x => x.id === +wwrap.dataset.id);
  if (!w0) return;
  // Textfluss-Fortsetzung: Tusche-Rahmen des Masters übernehmen
  const w = typeof frameStyleSrc === 'function' ? frameStyleSrc(w0) : w0;
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

/** Rahmen/Hintergrund-Quelle: Textfluss-Fortsetzungen erben ALLE Optik vom Master. */
function frameStyleSrc(w) {
  if (w && w.type === 'textfluss' && typeof widgets !== 'undefined') {
    const m = widgets.find(x => x.id === w.master);
    if (m) return m;
  }
  return w;
}

/** Inhalt von .winner inkl. Tusche-SVG (für Teil-Updates in sel/desel). */
function winnerInner(w) {
  const def = typeof WIDGET_MAP !== 'undefined' ? WIDGET_MAP[w.type] : null;
  if (!def) return '';
  return frameInkInsert(frameStyleSrc(w)) + def.render(w) + ptHtml(w);
}

/**
 * Ansichts-Zoom (#canvas-zoom transform:scale, transform-origin:top center).
 * Screen → Element-lokal: (client − getBoundingClientRect) / scale — nicht nur /z von links,
 * weil top-center die horizontale Position beim Zoomen mitverschiebt.
 */
function viewZoomScale() {
  const wrap = document.getElementById('canvas-zoom');
  if (!wrap) return 1;
  const tr = wrap.style.transform;
  if (!tr || tr === 'none') return 1;
  const m = tr.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function screenToElLocal(clientX, clientY, el) {
  const r = el.getBoundingClientRect();
  const z = viewZoomScale();
  return { x: (clientX - r.left) / z, y: (clientY - r.top) / z };
}
