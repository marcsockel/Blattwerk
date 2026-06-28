// Widget: Säulen-/Balkendiagramm (auch gruppiert / mehrere Reihen)
// Daten: eine Zeile je Kategorie. Werte KOMMAGETRENNT = mehrere Reihen, z.B.
//   Hund: 6, 4   →  zwei Säulen (Reihe 1 = 6, Reihe 2 = 4) nebeneinander.
// Gruppennamen (Legende) in eigenem Feld, z.B. "Klasse A, Klasse B".
// Säulen (senkrecht) / Balken (waagerecht); Kästchen-Raster optional (1 Zelle = 1 Einheit);
// gefüllt oder leere Vorlage; Größe Klein/Mittel/Groß.

const BD_COLORS = [
  { fill:'#7aa7e0', stroke:'#3a6fb0' }, // blau
  { fill:'#e8985a', stroke:'#c06a2a' }, // orange
  { fill:'#83c47e', stroke:'#4e9248' }, // grün
  { fill:'#b58ad0', stroke:'#8459a8' }, // lila
  { fill:'#e6cf5a', stroke:'#b09320' }, // gelb
];

function bdDarken(hex, amt) {
  const m = (hex || '').replace('#', '');
  if (m.length !== 6) return hex;
  const ch = i => Math.round(parseInt(m.slice(i, i + 2), 16) * (1 - amt)).toString(16).padStart(2, '0');
  return '#' + ch(0) + ch(2) + ch(4);
}
// Effektive Farbe je Reihe: eigene (d.farben[s]) oder Palette.
function bdFill(d, s)   { return (d.farben || [])[s] || BD_COLORS[s % BD_COLORS.length].fill; }
function bdStroke(d, s) { const c = (d.farben || [])[s]; return c ? bdDarken(c, 0.3) : BD_COLORS[s % BD_COLORS.length].stroke; }

function bdParse(text) {
  const toVals = s => s.split(/[,;\s]+/).map(t => parseFloat(t)).filter(v => !isNaN(v)).map(v => Math.max(0, v));
  return (text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(.*?)[:=]\s*(.+)$/);
    if (m && m[1].trim()) { const v = toVals(m[2]); return { label: m[1].trim(), values: v.length ? v : [0] }; }
    const m2 = l.match(/^(\D.*?)\s+([\d.,;\s]+)$/);
    if (m2) { const v = toVals(m2[2]); if (v.length) return { label: m2[1].trim(), values: v }; }
    return { label: l, values: [0] };
  });
}

function bdSeriesNames(d, seriesN) {
  const gn = (d.gruppen || '').split(',').map(s => s.trim()).filter(Boolean);
  return Array.from({ length: seriesN }, (_, s) => gn[s] || `Reihe ${s + 1}`);
}

function bdSvg(d) {
  const items = bdParse(d.data);
  if (!items.length) return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Daten – im Textfeld „Label: Wert" eintragen.</div>`;
  const horiz   = d.orientation === 'balken';
  const cs      = ({ klein: 16, mittel: 20, gross: 28 })[d.groesse || 'mittel'] || 20;  // Klein/Mittel = Kästchen-Widget; Groß bewusst kleiner (40 wäre zu wuchtig)
  const grid    = d.grid !== false;
  const filled  = d.gefuellt !== false;
  const n        = items.length;
  const seriesN  = Math.max(1, ...items.map(i => i.values.length));
  const maxData  = Math.max(1, ...items.flatMap(i => i.values.map(v => Math.ceil(v))));
  const M        = Math.max(1, (d.maxVal > 0 ? d.maxVal : maxData));
  const step     = M <= 20 ? 1 : (M <= 50 ? 5 : 10);
  const gridMax  = M + 2;                    // 2 Kästchenreihen Luft (oben bei Säulen, rechts bei Balken)
  const slot     = seriesN + 1;             // Zellen je Kategorie (Säulen + 1 Lücke)
  const ff       = "font-family:'DidactGothic7',sans-serif;";
  const fsNum    = Math.round(cs * 0.52), fsLab = Math.round(cs * 0.52);
  const axis = '#333', gc = '#dcdcdc';
  const line = (x1, y1, x2, y2, c, w) => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${w}"/>`;
  const col = s => ({ fill: bdFill(d, s), stroke: bdStroke(d, s) });
  let g = '';

  const skala = d.skala !== false;
  if (!horiz) {
    const plotW = n * slot * cs, plotH = gridMax * cs;
    const mL = skala ? Math.max(20, String(gridMax).length * fsNum * 0.75 + 12) : 4, mB = fsLab + 12, mT = 6, mR = 8;
    const W = mL + plotW + mR, H = mT + plotH + mB;
    const x0 = mL, baseY = mT + plotH;
    // Säulen zuerst …
    items.forEach((it, i) => {
      const sx = x0 + i * slot * cs;
      it.values.forEach((v, s) => {
        if (filled && v > 0) g += `<rect x="${(sx + s * cs).toFixed(1)}" y="${(baseY - v * cs).toFixed(1)}" width="${cs}" height="${(v * cs).toFixed(1)}" fill="${col(s).fill}" stroke="${col(s).stroke}" stroke-width="1.3"/>`;
      });
      g += `<text x="${(sx + seriesN * cs / 2).toFixed(1)}" y="${baseY + fsLab + 4}" text-anchor="middle" font-size="${fsLab}" fill="#222">${esc(it.label)}</text>`;
    });
    // … dann das Kästchen-Raster DARÜBER (Zellenstruktur scheint durch die Säulen)
    if (grid) {
      for (let c = 0; c <= n * slot; c++) g += line(x0 + c * cs, mT, x0 + c * cs, baseY, gc, 1);
      for (let r = 0; r <= gridMax; r++) g += line(x0, baseY - r * cs, x0 + plotW, baseY - r * cs, gc, 1);
    }
    g += line(x0, mT, x0, baseY, axis, 1.6) + line(x0, baseY, x0 + plotW, baseY, axis, 1.6);
    if (skala) for (let r = 0; r <= gridMax; r += step) {
      const y = baseY - r * cs;
      g += `<text x="${x0 - 6}" y="${y}" text-anchor="end" dominant-baseline="central" style="${ff}" font-size="${fsNum}" fill="#222">${r}</text>` + line(x0 - 3, y, x0, y, axis, 1.4);
    }
    return `<svg width="${W.toFixed(0)}" height="${H.toFixed(0)}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
  }

  // Balken (waagerecht)
  const plotW = gridMax * cs, plotH = n * slot * cs;
  const longest = Math.max(...items.map(i => i.label.length));
  const mL = Math.max(40, Math.round(longest * fsLab * 0.55) + 10), mB = skala ? fsNum + 12 : 6, mT = 6, mR = 10;
  const W = mL + plotW + mR, H = mT + plotH + mB;
  const x0 = mL, baseY = mT + plotH;
  // Balken zuerst …
  items.forEach((it, i) => {
    const sy = mT + i * slot * cs;
    it.values.forEach((v, s) => {
      if (filled && v > 0) g += `<rect x="${x0.toFixed(1)}" y="${(sy + s * cs).toFixed(1)}" width="${(v * cs).toFixed(1)}" height="${cs}" fill="${col(s).fill}" stroke="${col(s).stroke}" stroke-width="1.3"/>`;
    });
    g += `<text x="${x0 - 6}" y="${(sy + seriesN * cs / 2).toFixed(1)}" text-anchor="end" dominant-baseline="central" font-size="${fsLab}" fill="#222">${esc(it.label)}</text>`;
  });
  // … dann das Kästchen-Raster DARÜBER
  if (grid) {
    for (let c = 0; c <= gridMax; c++) g += line(x0 + c * cs, mT, x0 + c * cs, baseY, gc, 1);
    for (let r = 0; r <= n * slot; r++) g += line(x0, mT + r * cs, x0 + plotW, mT + r * cs, gc, 1);
  }
  g += line(x0, mT, x0, baseY, axis, 1.6) + line(x0, baseY, x0 + plotW, baseY, axis, 1.6);
  if (skala) for (let v = 0; v <= gridMax; v += step) {
    const x = x0 + v * cs;
    g += `<text x="${x}" y="${baseY + fsNum + 4}" text-anchor="middle" style="${ff}" font-size="${fsNum}" fill="#222">${v}</text>` + line(x, baseY, x, baseY + 3, axis, 1.4);
  }
  return `<svg width="${W.toFixed(0)}" height="${H.toFixed(0)}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

function bdSetColor(id, s, hex) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.farben = (w.farben || []).slice();
  w.farben[s] = hex;
  render(); renderProps(id);
}

WIDGETS.push({
  meta: { type:'diagramm', group:'diagramme', label:'Säulen-/Balkendiagramm', desc:'Daten als Säulen oder Balken (auch gruppiert)', icon:'📊', category:'mathematik' },

  createData: id => ({
    id, type:'diagramm',
    orientation:'saeulen',
    data:'Hund: 6\nKatze: 3\nVogel: 8\nFisch: 4',
    gruppen:'', grid:true, gefuellt:true, skala:true, groesse:'mittel', maxVal:0,
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const items = bdParse(d.data);
    const seriesN = Math.max(1, ...items.map(i => i.values.length));
    let legend = '';
    if (seriesN > 1) {
      const names = bdSeriesNames(d, seriesN);
      legend = `<div style="align-self:flex-start;border:1.5px solid #999;border-radius:5px;padding:7px 10px;display:flex;flex-direction:column;gap:6px;font-size:12px;">` +
        names.map((nm, s) => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
          <span style="width:14px;height:14px;border-radius:2px;flex-shrink:0;background:${bdFill(d,s)};border:1px solid ${bdStroke(d,s)};"></span>${esc(nm)}</span>`).join('') + `</div>`;
    }
    return atHtml(d) +
      `<div style="display:inline-flex;align-items:flex-start;gap:14px;"><div style="display:inline-block;">${bdSvg(d)}</div>${legend}</div>`;
  },

  renderProps: d => {
    const ori  = d.orientation || 'saeulen';
    const size = d.groesse || 'mittel';
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    const btgl = (active, label, key, val) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}',${val})"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Ausrichtung</label>
        <div style="display:flex;gap:4px;">${tgl(ori,'saeulen','Säulen','orientation')}${tgl(ori,'balken','Balken','orientation')}</div>
      </div>
      <div class="prow"><label>Daten <span style="font-weight:400;color:#aaa;font-size:10px;">(„Label: Wert" – mehrere Reihen: „Hund: 6, 4")</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'data',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:90px;font-family:monospace;font-size:12px;line-height:1.6;color:#333;margin-bottom:8px;">${esc(d.data||'')}</textarea>` +
      pr('Gruppen / Legende <span style="font-weight:400;color:#aaa;font-size:10px;">(kommagetrennt)</span>',
        `<input value="${esc(d.gruppen||'')}" placeholder="z.B. Klasse A, Klasse B" onchange="upd(${d.id},'gruppen',this.value)">`) +
      (() => {
        const seriesN = Math.max(1, ...bdParse(d.data).map(i => i.values.length));
        const names = bdSeriesNames(d, seriesN);
        const rows = Array.from({ length: seriesN }, (_, s) =>
          `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <input type="color" value="${bdFill(d, s)}" onchange="bdSetColor(${d.id},${s},this.value)"
              style="width:36px;height:26px;padding:0;border:1.5px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;">
            <span style="font-size:12px;color:#444;">${esc(names[s])}</span>
          </div>`).join('');
        return `<div class="prow"><label>Farben</label>${rows}</div>`;
      })() +
      `<div class="prow"><label>Kästchen-Raster</label>
        <div style="display:flex;gap:4px;">${btgl(d.grid!==false,'An','grid',true)}${btgl(d.grid===false,'Aus','grid',false)}</div>
      </div>
      <div class="prow"><label>Maßlatte (Werte-Skala)</label>
        <div style="display:flex;gap:4px;">${btgl(d.skala!==false,'An','skala',true)}${btgl(d.skala===false,'Aus','skala',false)}</div>
      </div>
      <div class="prow"><label>Säulen/Balken</label>
        <div style="display:flex;gap:4px;">${btgl(d.gefuellt!==false,'Gefüllt','gefuellt',true)}${btgl(d.gefuellt===false,'Leer (Vorlage)','gefuellt',false)}</div>
      </div>
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${tgl(size,'klein','Klein','groesse')}${tgl(size,'mittel','Mittel','groesse')}${tgl(size,'gross','Groß','groesse')}</div>
      </div>` +
      pr('Achsen-Maximum (0 = automatisch)',
        `<input type="number" min="0" max="100" value="${d.maxVal||0}" onchange="upd(${d.id},'maxVal',+this.value)">`);
  },
});
