// Widget: Strichliste / Häufigkeitstabelle
// Tabelle: Kategorie | Strichliste | Anzahl. Daten „Label: Wert" (ein Wert je Zeile).
// Modi (richtung):
//   malen   – Anzahl gegeben, Striche selbst malen (Default); Lösung = Striche blau
//   zaehlen – Striche gegeben, Anzahl auszählen;             Lösung = Zahl blau
//   leer    – beide Spalten leer (Vorlage zum eigenen Erheben), keine Lösung
//   voll    – Striche + Anzahl vorgegeben (Beispiel/Ablesen)

function slParse(text) {
  return (text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    let label, val;
    const m = l.match(/^(.*?)[:=]\s*(.+)$/);
    if (m && m[1].trim()) { label = m[1].trim(); val = parseFloat(String(m[2]).replace(',', '.')); }
    else {
      const m2 = l.match(/^(\D.*?)\s+([\d.,]+)$/);
      if (m2) { label = m2[1].trim(); val = parseFloat(m2[2].replace(',', '.')); }
      else { label = l; val = 0; }
    }
    if (isNaN(val) || val < 0) val = 0;
    return { label, value: Math.round(val) };
  });
}

// Strichliste (Bündel zu 5: vier senkrechte + ein diagonaler Strich).
// draw=false → nur Maße (für leere Mal-Felder mit passender Breite).
function slTally(n, color, size, draw) {
  const h = size === 'gross' ? 28 : size === 'klein' ? 18 : 23;
  const sp = Math.max(5, Math.round(h * 0.30));
  const sw = Math.max(1.6, h * 0.075);
  const gap = Math.round(h * 0.55);
  const over = sp * 0.35;
  const pad = 4;
  const y0 = pad, y1 = pad + h;
  const groups = Math.floor(n / 5), rem = n % 5;
  let x = pad, parts = '';
  const vert = xx => `<line x1="${xx.toFixed(1)}" y1="${y0}" x2="${xx.toFixed(1)}" y2="${y1}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
  for (let gI = 0; gI < groups; gI++) {
    const gx = x + over;
    if (draw) {
      for (let i = 0; i < 4; i++) parts += vert(gx + i * sp);
      parts += `<line x1="${(gx - over).toFixed(1)}" y1="${y1}" x2="${(gx + 3 * sp + over).toFixed(1)}" y2="${y0}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    x = gx + 3 * sp + over + gap;
  }
  if (rem > 0) {
    const gx = x;
    if (draw) for (let i = 0; i < rem; i++) parts += vert(gx + i * sp);
    x = gx + (rem - 1) * sp + sp;
  }
  const w = Math.max(pad * 2 + sp, x + pad);
  const H = h + pad * 2;
  const svg = draw
    ? `<svg width="${w.toFixed(0)}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${parts}</svg>`
    : '';
  return { svg, w: Math.round(w), h: H };
}

function slRowHtml(it, d, active, dims) {
  const { fs, ncw, size } = dims;
  const richtung = d.richtung || 'malen';
  const tallyGiven = richtung === 'zaehlen' || richtung === 'voll';
  const numGiven   = richtung === 'malen'   || richtung === 'voll';
  const showSol = active && richtung !== 'leer';
  const n = it.value;
  const cb = `border:1.2px solid #333;padding:3px 8px;font-family:'DidactGothic7',sans-serif;font-size:${fs}px;`;

  let html = `<tr><td style="${cb}text-align:left;color:#222;white-space:nowrap;">${esc(it.label)}</td>`;

  // Strichliste
  if (tallyGiven) html += `<td style="${cb}text-align:left;">${slTally(n, '#222', size, true).svg}</td>`;
  else if (showSol && richtung === 'malen') html += `<td style="${cb}text-align:left;">${slTally(n, '#2563eb', size, true).svg}</td>`;
  else {
    const mw = richtung === 'leer' ? 170 : Math.max(80, slTally(n, '#222', size, false).w);
    html += `<td style="${cb}min-width:${mw}px;"></td>`;
  }

  // Anzahl
  if (numGiven) html += `<td style="${cb}text-align:center;width:${ncw}px;color:#222;">${n}</td>`;
  else if (showSol && richtung === 'zaehlen') html += `<td style="${cb}text-align:center;width:${ncw}px;color:#2563eb;font-weight:700;">${n}</td>`;
  else html += `<td style="${cb}text-align:center;width:${ncw}px;"></td>`;

  return html + `</tr>`;
}

WIDGETS.push({
  meta: { type:'strichliste', group:'diagramme', label:'Strichliste / Häufigkeitstabelle', desc:'Kategorie, Striche und Anzahl', icon:'🇮', category:'mathematik' },

  createData: id => ({
    id, type:'strichliste',
    data:'Hund: 6\nKatze: 3\nVogel: 8\nFisch: 4',
    richtung:'malen', groesse:'mittel', align:'left',
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const items = slParse(d.data);
    if (!items.length)
      return atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Daten – im Textfeld „Label: Wert" eintragen.</div>`;
    const active = d.id === selId || _solutionsMode;
    const size = d.groesse || 'mittel';
    const dims = {
      fs: size === 'gross' ? 17 : size === 'klein' ? 13 : 15,
      ncw: size === 'gross' ? 64 : size === 'klein' ? 46 : 56,
      size,
    };
    const align = d.align || 'left';
    const thB = `border:1.2px solid #333;padding:4px 8px;background:#f0f0f0;`
              + `font-family:'DidactGothic7',sans-serif;font-size:${dims.fs}px;font-weight:700;color:#333;`;
    const head = `<tr><th style="${thB}text-align:left;">Kategorie</th>`
               + `<th style="${thB}text-align:left;">Strichliste</th>`
               + `<th style="${thB}text-align:center;">Anzahl</th></tr>`;
    const body = items.map(it => slRowHtml(it, d, active, dims)).join('');
    return atHtml(d) +
      `<div style="text-align:${align};">`
      + `<table style="border-collapse:collapse;display:inline-table;">${head}${body}</table></div>`;
  },

  renderProps: d => {
    const size = d.groesse || 'mittel';
    const r = d.richtung || 'malen';
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;

    return `<div class="prow"><label>Daten <span style="font-weight:400;color:#aaa;font-size:10px;">(„Label: Wert" – ein Wert je Zeile)</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'data',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:90px;font-family:monospace;font-size:12px;line-height:1.6;color:#333;margin-bottom:8px;">${esc(d.data||'')}</textarea>
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${tgl(r,'malen','Anzahl → Striche','richtung')}
          ${tgl(r,'zaehlen','Striche → Anzahl','richtung')}
          ${tgl(r,'leer','Leere Vorlage','richtung')}
          ${tgl(r,'voll','Alles gegeben','richtung')}
        </div>
      </div>
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${tgl(size,'klein','Klein','groesse')}${tgl(size,'mittel','Mittel','groesse')}${tgl(size,'gross','Groß','groesse')}</div>
      </div>` +
      alignToggle(d.id, d.align);
  },
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { slParse, slTally };
}
