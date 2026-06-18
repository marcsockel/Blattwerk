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
  return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
    ${nr > 0
      ? `<span style="display:inline-flex;align-items:center;justify-content:center;
           width:16px;height:16px;border-radius:50%;border:1.5px solid #222;
           font-family:'DidactGothic7',sans-serif;font-size:10px;font-weight:700;
           color:#222;flex-shrink:0;line-height:1;">${nr}</span>`
      : ''}
    ${txt
      ? `<span style="font-family:'DidactGothic7',sans-serif;font-size:13px;
           color:#222;">${esc(txt)}</span>`
      : ''}
  </div>`;
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
