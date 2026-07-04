// Widget: Silbentext
// Wie Text, aber mit automatischer Silbenmarkierung via Hypher.js
// Silben werden abwechselnd eingefärbt (zwei Farben) für den Druck.

// ── Hypher laden (einmalig via fetch + module.exports-Shim) ──────
(function() {
  if (window._hypherReady !== undefined) return;
  window._hypherReady = false;
  window._hypherFailed = false;
  window._hypherCallbacks = [];
  window._hypherRenderQueued = false;

  // Führt CommonJS-Code im Browser aus, gibt module.exports zurück
  function loadCJS(src) {
    return fetch(src)
      .then(r => r.text())
      .then(code => {
        const mod = { exports: {} };
        // eslint-disable-next-line no-new-func
        new Function('module', 'exports', code)(mod, mod.exports);
        return mod.exports;
      });
  }

  // Zuerst lokal aus vendor/ laden (offline-fähig, wie jszip & Fonts); CDN nur als Fallback.
  const tryLoad = (local, cdn) => loadCJS(local).catch(() => loadCJS(cdn));

  tryLoad('vendor/hypher.js', 'https://cdn.jsdelivr.net/npm/hypher@0.2.5/lib/hypher.js')
    .then(Hypher => {
      return tryLoad('vendor/hyphenation-de.js', 'https://cdn.jsdelivr.net/npm/hyphenation.de@0.2.1/lib/de.js')
        .then(de => {
          window._hypherDE = new Hypher(de);
          window._hypherReady = true;
          (window._hypherCallbacks || []).forEach(fn => fn());
          window._hypherCallbacks = [];
        });
    })
    .catch(e => {
      console.error('Hypher Ladefehler:', e);
      window._hypherFailed = true;
      window._hypherReady = true;
      window._hypherCallbacks = [];
      window._hypherRenderQueued = false;
    });
})();

function hypherReady(cb) {
  if (window._hypherReady) cb();
  else window._hypherCallbacks.push(cb);
}

/** Einmalig render() nach Hypher-Ladung anfordern — verhindert Callback-Sturm. */
function hypherScheduleRender() {
  if (window._hypherFailed || typeof render !== 'function') return;
  if (window._hypherRenderQueued) return;
  window._hypherRenderQueued = true;
  hypherReady(() => {
    window._hypherRenderQueued = false;
    render();
  });
}

// ── Eingebaute Ausnahmen (Wörter die Hypher falsch trennt) ────────
window._silbenAusnahmen = {
  // Einsilbige Wörter die Hypher korrekt als eine Silbe lässt –
  // hier nur Mehrsilbler eintragen die falsch erkannt werden
  "igel":   ["I","gel"],
  "abend":  ["A","bend"],
  "esel":   ["E","sel"],
  "oma":    ["O","ma"],
  "opa":    ["O","pa"],
  "uhu":    ["U","hu"],
  "ofen":   ["O","fen"],
  "übung":  ["Ü","bung"],
  "ufer":   ["U","fer"],
  "emil":   ["E","mil"],
  "eber":   ["E","ber"],
  "elbe":   ["El","be"],
  "angel":  ["An","gel"],
  "ampel":  ["Am","pel"],
  "anker":  ["An","ker"],
  "eltern": ["El","tern"],
  "erde":   ["Er","de"],
  "ernte":  ["Ern","te"],
  "unfall": ["Un","fall"],
  "umweg":  ["Um","weg"],
  "adler":  ["Ad","ler"],
  "eimer":  ["Ei","mer"],
  "insel":  ["In","sel"],
  "alter":  ["Al","ter"],
  "arbeit": ["Ar","beit"],
  "eule":   ["Eu","le"],
  "ulme":   ["Ul","me"],
  "otter":  ["Ot","ter"],
  "ochse":  ["Och","se"],
  "iglu":   ["Ig","lu"],
  "elch":   ["Elch"],
  "abfall": ["Ab","fall"],
  "ablage": ["Ab","la","ge"],
  "abgabe": ["Ab","ga","be"],
  "eingang":["Ein","gang"],
  "einheit":["Ein","heit"],
  "einkauf":["Ein","kauf"],
  "unding": ["Un","ding"],
  "umzug":  ["Um","zug"],
  "umbau":  ["Um","bau"],
};

// ── Silben trennen (Ausnahmen → Hypher) ───────────────────────────
// customExceptions: Objekt {wort: ["Sil","ben"]} aus Widget-Einstellungen
function silbenTrenne(word, customExceptions) {
  const key = word.toLowerCase();

  // 1. Widget-eigene Ausnahmen
  if (customExceptions && customExceptions[key]) {
    return customExceptions[key];
  }

  // 2. Eingebaute Ausnahmen
  if (window._silbenAusnahmen[key]) {
    // Originalgroßschreibung wiederherstellen
    const template = window._silbenAusnahmen[key];
    let pos = 0;
    return template.map(s => {
      const orig = word.slice(pos, pos + s.length);
      pos += s.length;
      return orig;
    });
  }

  // 3. Hypher
  if (window._hypherDE) return window._hypherDE.hyphenate(word);
  return [word];
}

// ── Ausnahmen-Text parsen (Format: "Igel=I-gel" pro Zeile) ────────
function silbenParseAusnahmen(text) {
  const result = {};
  (text || '').split('\n').forEach(line => {
    line = line.trim();
    if (!line || !line.includes('=')) return;
    const [wort, silben] = line.split('=');
    const key = wort.trim().toLowerCase();
    const parts = silben.split('-').map(s => s.trim()).filter(Boolean);
    if (key && parts.length) result[key] = parts;
  });
  return result;
}

// ── Silben-HTML erzeugen ──────────────────────────────────────────
// Färbt Silben abwechselnd mit color1 / color2 ein.
// Arbeitet auf reinem Text; HTML-Tags bleiben unverändert.
function silbenHTML(html, color1, color2) {
  if (!window._hypherDE) return html;

  // Text-Nodes parsen, Tags durchlassen
  const div = document.createElement('div');
  div.innerHTML = html;

  let flip = false; // globaler Umschalter über den gesamten Text

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      // Wörter tokenisieren, Nicht-Wort-Zeichen dazwischen erhalten
      const result = text.replace(/[A-Za-zÄÖÜäöüß]+/g, word => {
        const syllables = silbenTrenne(word, window._silbenCustom || {});
        return syllables.map(s => {
          const color = flip ? color2 : color1;
          flip = !flip;
          return `<span style="color:${color};">${s}</span>`;
        }).join('');
      });
      const span = document.createElement('span');
      span.innerHTML = result;
      node.parentNode.replaceChild(span, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }

  Array.from(div.childNodes).forEach(processNode);
  return div.innerHTML;
}

const _silbenHtmlCache = new Map();
const SILBEN_CACHE_MAX = 120;

function silbenHTMLCached(id, html, color1, color2, ausnahmen) {
  const key = `${id}\x1f${color1}\x1f${color2}\x1f${ausnahmen || ''}\x1f${html}`;
  if (_silbenHtmlCache.has(key)) return _silbenHtmlCache.get(key);
  window._silbenCustom = silbenParseAusnahmen(ausnahmen || '');
  const out = silbenHTML(html, color1, color2);
  _silbenHtmlCache.set(key, out);
  if (_silbenHtmlCache.size > SILBEN_CACHE_MAX) {
    _silbenHtmlCache.delete(_silbenHtmlCache.keys().next().value);
  }
  return out;
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: {
    type: "silbentext",
    label: "Silbentext",
    desc: "Text mit farbiger Silbenmarkierung",
    icon: "Si",
    category: "deutsch"
  },

  createData: id => ({
    id, type: "silbentext",
    html: "Die Sonne scheint hell am Himmel.",
    font: "inherit",
    fontSize: 16,
    color1: "#e05252",
    color2: "#2255cc",
    ausnahmen: "", aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 16;
    const color1   = d.color1   || "#e05252";
    const color2   = d.color2   || "#2255cc";

    // Silben live einfärben wenn Hypher bereit
    let content = d.html;
    if (window._hypherDE) {
      content = silbenHTMLCached(d.id, d.html, color1, color2, d.ausnahmen || '');
    } else if (!window._hypherFailed) {
      hypherScheduleRender();
    }

    const pad      = d.innerPad != null ? `padding:${d.innerPad}px;` : '';
    const align    = d.align || 'left';
    const ws       = align === 'justify' ? 'normal' : 'pre-wrap'; // Blocksatz: pre-wrap dehnt in WebKit keine Spatien
    return atHtml(d) + `<div style="font-family:${font};font-size:${fontSize}px;line-height:1.7;
                        color:#333;white-space:${ws};word-break:break-word;min-height:1em;text-align:${align};${pad}"
            >${content}</div>`;
  },

  renderProps: d => {
    const font     = d.font     || "inherit";
    const fontSize = d.fontSize || 16;
    const color1   = d.color1   || "#e05252";
    const color2   = d.color2   || "#2255cc";

    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? "selected" : ""}>${f.label}</option>`
    ).join("");

    const sizeInput = `<input type="number" min="8" max="36" value="${fontSize}"
      onclick="event.stopPropagation()"
      onchange="upd(${d.id},'fontSize',+this.value)"
      style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
             font-family:inherit;font-size:12px;text-align:center;">`;

    return `<div class="prow"><label>Text</label></div>` +
      makeRichEditorBox(d.id, 'html', d.html, font, sizeInput, fontOptions) +
      innerPadPropsControl(d) +
      alignToggle(d.id, d.align, true) +
      `<div class="prow" style="margin-top:8px;">
         <label>Farbe 1</label>
         <input type="color" value="${color1}"
           onclick="event.stopPropagation()"
           onchange="upd(${d.id},'color1',this.value)"
           style="width:36px;height:28px;border:none;cursor:pointer;border-radius:4px;">
       </div>
       <div class="prow">
         <label>Farbe 2</label>
         <input type="color" value="${color2}"
           onclick="event.stopPropagation()"
           onchange="upd(${d.id},'color2',this.value)"
           style="width:36px;height:28px;border:none;cursor:pointer;border-radius:4px;">
       </div>
       <div style="margin-top:10px;padding:7px 9px;background:#fffbea;border:1.5px solid #f0d060;
                   border-radius:5px;font-size:11px;color:#7a6000;line-height:1.5;">
         ⚠️ Die automatische Silbentrennung basiert auf einem typografischen Algorithmus –
         manche Wörter (z.&nbsp;B. <em>Igel, Abend</em>) werden dabei nicht korrekt getrennt.
         Häufige Ausnahmen sind bereits eingebaut. Eigene Ausnahmen unten eintragen.
       </div>
       <div class="prow" style="margin-top:8px;"><label>Eigene Ausnahmen</label></div>
       <textarea onclick="event.stopPropagation()"
         onchange="upd(${d.id},'ausnahmen',this.value)"
         placeholder="Format: Wort=Sil-ben&#10;z. B. Tiger=Ti-ger"
         style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;
                border-radius:4px;padding:4px 6px;min-height:60px;resize:vertical;
                box-sizing:border-box;"
       >${esc(d.ausnahmen || '')}</textarea>` ;
  },
});
