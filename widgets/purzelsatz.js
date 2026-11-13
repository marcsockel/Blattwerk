// Widget: Purzelsatz
// Je Satz: die Wörter durcheinander als Wortkärtchen, darunter Schreiblinie(n) für den
// geordneten Satz. Lösung (der Satz) blau auf der Linie, wenn ausgewählt / Lösungsblatt.
//   saetze       ein Satz je Zeile
//   satzzeichen  'dran' – Satzzeichen bleibt am Wort (Hilfe: Satzende erkennbar)
//                'weg'  – Satzzeichen fehlen auf den Kärtchen (Kind setzt sie selbst)
//   lineatur     0 einfache Linie | 1 Lineatur 1 | 2 Lineatur 2 (wie Schreiblinien-Widget)
//   zeilen       Schreiblinien je Satz (1–3); lange Sätze bekommen von selbst mehr Linien
//   seed         Mischzähler („Neu mischen")
// Gemischt wird deterministisch (seededShuffle) → gleiche Reihenfolge bei jedem Zeichnen.

function pzSaetze(d) { return String(d.saetze || '').split('\n').map(s => s.trim().replace(/\s+/g, ' ')).filter(Boolean); }

// Wörter eines Satzes in gemischter Reihenfolge
function pzWoerter(d, satz, i) {
  let w = satz.split(' ');
  if ((d.satzzeichen || 'dran') === 'weg') w = w.map(x => x.replace(/[.,!?;:…]+$/u, '')).filter(Boolean);
  if (new Set(w).size < 2) return w;
  const orig = w.join(' ');
  let m = w;
  for (let t = 0; t < 8; t++) {
    m = seededShuffle(w, d.id * 31 + i * 7 + (d.seed || 0) * 101 + t * 1009);
    if (m.join(' ') !== orig) break;
  }
  return m;
}

// Eine Schreiblinie in der gewählten Lineatur (Maße wie widgets/linebox.js); text = Lösung
function pzLinie(d, text, fs, mul) {
  const lin = d.lineatur || 0, font = d.font || "'DidactGothic7', sans-serif";
  const h = v => Math.round(v * mul);
  const adj = (font === 'inherit' || font.includes('Grundschrift') || font.includes('DM Mono')) ? 0 : 2;
  const over = (bottom) => text
    ? `<div style="position:absolute;top:0;left:4px;right:4px;bottom:${bottom}px;display:flex;align-items:flex-end;pointer-events:none;">`
      + `<span style="display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;padding:.4em 0 .2em;margin-bottom:-.2em;font-size:${fs}px;font-family:${font};line-height:1;white-space:nowrap;color:#2563eb;">${esc(text)}</span></div>`
    : '';
  if (lin === 1)
    return `<div style="position:relative;margin-bottom:${h(10)}px;border-left:1px solid #bbb;border-right:1px solid #bbb;background:#fff;">`
      + `<div style="height:${h(11)}px;border-top:1px solid #bbb;"></div>`
      + `<div style="height:${h(11)}px;border-top:1px solid #bbb;background:#dff0f8;"></div>`
      + `<div style="height:${h(11)}px;border-top:2px solid #777;"></div>`
      + `<div style="height:${h(3)}px;border-top:1px solid #bbb;border-bottom:1px solid #bbb;"></div>`
      + over(14 * mul - Math.round(fs * 0.2) + adj) + `</div>`;
  if (lin === 2)
    return `<div style="position:relative;margin-bottom:${h(10)}px;background:#fff;">`
      + `<div style="height:${h(16)}px;border-top:1px dashed #bbb;"></div>`
      + `<div style="height:${h(5)}px;border-top:2px solid #777;"></div>`
      + `<div style="height:${h(4)}px;border-top:1px solid #bbb;"></div>`
      + over(9 * mul - Math.round(fs * 0.2) + adj) + `</div>`;
  return `<div style="position:relative;border-bottom:1.5px solid #999;height:${h(30)}px;margin-bottom:${h(6)}px;">`
    + over(Math.round(fs * 0.1) - 3) + `</div>`;
}

WIDGETS.push({
  meta: { type:'purzelsatz', label:'Purzelsatz', desc:'Wörter eines Satzes ordnen und aufschreiben', icon:'🤸', category:'deutsch' },

  createData: id => ({
    id, type:'purzelsatz',
    saetze: 'Der Hund spielt im Garten.\nLisa malt ein buntes Bild.\nWir gehen heute ins Schwimmbad.',
    satzzeichen:'dran', lineatur:0, zeilen:1, groesse:'mittel', font:"'DidactGothic7', sans-serif", seed:0,
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const saetze = pzSaetze(d);
    if (!saetze.length)
      return atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Sätze – im Textfeld einen Satz je Zeile eintragen.</div>`;
    const isActive = d.id === selId || _solutionsMode;
    const g = d.groesse || 'mittel';
    const fs = g === 'gross' ? 23 : g === 'klein' ? 16 : 19;          // Schrift der Wortkärtchen
    const mul = g === 'gross' ? 1.5 : 1;                               // Lineatur klein/groß
    const font = d.font || "'DidactGothic7', sans-serif";
    const zeilen = Math.max(1, Math.min(3, Math.round(+d.zeilen) || 1));
    // Lösungsschrift auf der Linie; lange Sätze etwas kleiner, damit sie in die Breite passen
    const frac = typeof widthFrac === 'function' ? widthFrac(d) : 1;
    const platz = typeof geom === 'function' ? geom().contentW * frac - 30 - (frac < 1 ? 12 : 0) : 600;
    const basisFs = ((d.lineatur || 0) === 1 ? 24 : 22) * mul;
    return atHtml(d) + saetze.map((satz, i) => {
      const karten = pzWoerter(d, satz, i).map(w =>
        `<span style="display:inline-flex;align-items:center;border:1.5px solid #555;border-radius:${Math.round(fs * 0.3)}px;background:#fff;`
        + `padding:${Math.round(fs * 0.22)}px ${Math.round(fs * 0.55)}px;font-family:${font};font-size:${fs}px;line-height:1.25;color:#222;white-space:nowrap;">${esc(w)}</span>`).join('');
      // Satz auf die Linien verteilen: passt er nicht auf eine, bekommt er weitere (höchstens 3) —
      // so viel Platz braucht auch das Kind zum Schreiben. Reicht selbst das nicht, wird die
      // Lösungsschrift kleiner.
      const proLinie = Math.max(8, Math.floor(platz / (basisFs * 0.5)));
      const teile = [''];
      satz.split(' ').forEach(w => {
        const k = teile.length - 1;
        if (teile[k] && (teile[k] + ' ' + w).length > proLinie && teile.length < 3) teile.push(w);
        else teile[k] = teile[k] ? teile[k] + ' ' + w : w;
      });
      const laengste = Math.max(...teile.map(t => t.length));
      const lsgFs = Math.max(9, Math.min(basisFs, Math.floor(platz / (laengste * 0.5))));
      const n = Math.max(zeilen, teile.length);
      const linien = Array.from({ length: n }, (_, z) => pzLinie(d, isActive ? (teile[z] || '') : '', lsgFs, mul)).join('');
      return `<div style="margin-bottom:${Math.round(fs * (i < saetze.length - 1 ? 1.1 : 0.2))}px;break-inside:avoid;">`
        + `<div data-aufg="1" style="display:flex;flex-wrap:wrap;gap:${Math.round(fs * 0.4)}px ${Math.round(fs * 0.5)}px;margin-bottom:${Math.round(fs * 0.55)}px;">${karten}</div>`
        + linien + `</div>`;
    }).join('');
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', sz = d.satzzeichen || 'dran', lin = d.lineatur || 0, font = d.font || "'DidactGothic7', sans-serif";
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Sätze <span style="font-weight:400;color:#aaa;font-size:10px;">(ein Satz je Zeile)</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'saetze',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:96px;font-family:inherit;font-size:12px;line-height:1.6;color:#333;margin-bottom:8px;">${esc(d.saetze || '')}</textarea>
      <button onclick="event.stopPropagation();upd(${d.id},'seed',${(d.seed || 0) + 1})"
        style="margin:0 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu mischen</button>
      <div class="prow"><label>Satzzeichen</label><div style="display:flex;gap:4px;">
        ${tgl(sz==='dran','Am Wort',`upd(${d.id},'satzzeichen','dran')`)}${tgl(sz==='weg','Weglassen',`upd(${d.id},'satzzeichen','weg')`)}</div></div>`
      + pr('Schreiblinien', `<select onchange="upd(${d.id},'lineatur',+this.value)">
          <option value="0" ${lin===0?'selected':''}>Einfache Linie</option>
          <option value="1" ${lin===1?'selected':''}>Lineatur 1 (1. Klasse)</option>
          <option value="2" ${lin===2?'selected':''}>Lineatur 2 (2. Klasse)</option></select>`)
      + pr('Linien je Satz (1–3)', `<input type="number" min="1" max="3" value="${Math.max(1, Math.min(3, d.zeilen || 1))}" onchange="upd(${d.id},'zeilen',Math.max(1,Math.min(3,+this.value||1)))">`)
      + pr('Schrift', `<select onchange="upd(${d.id},'font',this.value)">${SCHREIB_FONTS.map(f => `<option value="${f.value}" ${font===f.value?'selected':''}>${f.label}</option>`).join('')}</select>`)
      + `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>`;
  },
});

// Satz direkt im Blatt ändern (main/helpers.js → BW_AUFGABE); er wird neu gemischt
BW_AUFGABE.purzelsatz = {
  ziel: '[data-aufg]',
  text: (w, i) => pzSaetze(w)[i] ?? null,
  setzen: (w, i, txt) => {
    const t = String(txt).replace(/\s+/g, ' ').trim();
    if (!t) return 'Bitte einen Satz eingeben.';
    const L = pzSaetze(w);
    L[i] = t;
    w.saetze = L.join('\n');
    return true;
  },
};
