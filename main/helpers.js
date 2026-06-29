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
