// Widget: Zahlenkarten
// Zahlen einzeln auf Karten (gleiche Optik wie die Aufgabenkarten der Zahlentafel im
// Modus „Eintragen"). Zahlen werden gewürfelt (Zahlenraum, Anzahl, sortiert/gemischt)
// oder von Hand eingetragen – auch direkt im Blatt per Klick/Doppelklick.
// Anordnung: Standard-Verteilung (Links = Standard, Mitte, Block), so viele Karten pro Reihe wie passen.

const ZK_GROESSE = { klein: 15, mittel: 19, gross: 27 };   // Schriftgröße der Zahlen

function zkaWuerfeln(w) {
  const zr = w.zahlenraum || 20, n = Math.max(1, Math.min(60, w.anzahl || 10));
  const pool = [];
  for (let v = (w.mitNull ? 0 : 1); v <= zr; v++) pool.push(v);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let z = pool.slice(0, Math.min(n, pool.length));
  while (z.length < n) z.push(pool[Math.floor(Math.random() * pool.length)]);   // mehr Karten als Zahlen → Wiederholungen
  if ((w.reihenfolge || 'gemischt') === 'sortiert') z.sort((a, b) => a - b);
  w.zahlen = z;
}

function zkaParse(text) {
  return String(text || '').split(/[^0-9]+/).filter(Boolean).map(v => parseInt(v, 10));
}

WIDGETS.push({
  meta: { type: 'zahlenkarten', label: 'Zahlenkarten', desc: 'Zahlen einzeln auf Karten', icon: '🃏', category: 'mathematik', itemsLayout: true },

  createData: id => {
    const w = { id, type: 'zahlenkarten', zahlenraum: 20, anzahl: 10, reihenfolge: 'gemischt', mitNull: false,
                groesse: 'mittel', align: 'left', itemsPerRow: 'auto', aufgabenNr: 0, aufgabenText: '' };
    zkaWuerfeln(w);
    return w;
  },

  render: d => {
    const zahlen = d.zahlen || [];
    if (!zahlen.length) return atHtml(d) + `<span style="color:#999;font-size:12px;">Keine Zahlen.</span>`;
    const fs = ZK_GROESSE[d.groesse] || ZK_GROESSE.mittel;
    const L = Math.max(2, ...zahlen.map(n => String(n).length));
    const kw = Math.round(fs * Math.max(2.2, 0.62 * L + 0.5)), kh = Math.round(fs * 1.6);
    const karten = zahlen.map(z => `<span data-aufg="1" style="display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;`
      + `width:${kw}px;height:${kh}px;border:1.5px solid #555;border-radius:3px;background:#fff;`
      + `font-family:'DidactGothic7',sans-serif;font-size:${fs}px;color:#222;">${z}</span>`);
    // Standard-Verteilung (Box → Verteilung): Links (Standard) · Mitte · Block; Abstand 10 px
    return atHtml(d) + flexDistribute(karten, { itemW: kw, itemSize: `width:${kw}px;`, gap: 10, marginBottom: 10, d });
  },

  renderProps: d => {
    const zr = d.zahlenraum || 20, g = d.groesse || 'mittel', rf = d.reihenfolge || 'gemischt';
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();zkaSet(${d.id},'${key}',${typeof val === 'string' ? `'${val}'` : val})"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    const vtgl = (cur, val, label) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'groesse','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    return pr('Zahlenraum',
        `<select onchange="zkaSet(${d.id},'zahlenraum',+this.value)">
          ${[10, 20, 100, 1000].map(v => `<option value="${v}" ${zr === v ? 'selected' : ''}>bis ${v}</option>`).join('')}
        </select>`) +
      pr('Anzahl Karten', `<input type="number" min="1" max="60" value="${d.anzahl || 10}" onchange="zkaSet(${d.id},'anzahl',Math.max(1,Math.min(60,+this.value||1)))">`) +
      `<div class="prow"><label>Reihenfolge</label><div style="display:flex;gap:4px;">
        ${tgl(rf, 'gemischt', 'Gemischt', 'reihenfolge')}${tgl(rf, 'sortiert', 'Sortiert', 'reihenfolge')}</div></div>` +
      `<div class="prow"><label>Null mit dabei</label><div style="display:flex;gap:4px;">
        ${tgl(!!d.mitNull, false, 'Nein', 'mitNull')}${tgl(!!d.mitNull, true, 'Ja', 'mitNull')}</div></div>` +
      `<button onclick="event.stopPropagation();zkaRoll(${d.id})"
        style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
      pr('Zahlen (eigene, kommagetrennt)',
        `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:50px;resize:vertical;box-sizing:border-box;"
          onclick="event.stopPropagation()" onchange="zkaManual(${d.id},this.value)">${esc((d.zahlen || []).join(', '))}</textarea>
         <div style="font-size:10.5px;color:#999;margin-top:3px;">Tipp: Karte im Blatt anklicken (Doppelklick, wenn nicht ausgewählt) und Zahl ändern.</div>`) +
      `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${vtgl(g, 'klein', 'Klein')}${vtgl(g, 'mittel', 'Mittel')}${vtgl(g, 'gross', 'Groß')}</div></div>`;
  },
});

function zkaSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  if (key === 'reihenfolge' && val === 'sortiert') w.zahlen = (w.zahlen || []).slice().sort((a, b) => a - b);
  else zkaWuerfeln(w);
  render(); renderProps(id);
}
function zkaRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory(); zkaWuerfeln(w); render(); renderProps(id);
}
function zkaManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const z = zkaParse(text); if (!z.length) return;
  saveHistory(); w.zahlen = z; w.anzahl = z.length; render(); renderProps(id);
}

// Karte direkt im Blatt ändern (main/helpers.js → BW_AUFGABE)
BW_AUFGABE.zahlenkarten = {
  ziel: '[data-aufg]',
  text: (w, i) => (w.zahlen || [])[i] != null ? String(w.zahlen[i]) : null,
  setzen: (w, i, txt) => {
    if (!/^\d+$/.test(txt.trim())) return 'Bitte eine Zahl eingeben.';
    w.zahlen[i] = +txt.trim();
    return true;
  },
};
