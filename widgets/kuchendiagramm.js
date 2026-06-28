// Widget: Kuchendiagramm (Kreisdiagramm)
// Daten: eine Zeile je Teil, „Label: Wert" (ein Wert pro Zeile). Aufteilung des
// Kreises proportional zu den Werten. Farbe je Teil, gefüllt oder leere Vorlage,
// Werte/Prozent ein-/ausblendbar, optionale Legende. Aufbau analog diagramm.js.

const KD_COLORS = [
  { fill:'#7aa7e0', stroke:'#3a6fb0' }, // blau
  { fill:'#e8985a', stroke:'#c06a2a' }, // orange
  { fill:'#83c47e', stroke:'#4e9248' }, // grün
  { fill:'#b58ad0', stroke:'#8459a8' }, // lila
  { fill:'#e6cf5a', stroke:'#b09320' }, // gelb
  { fill:'#e07a9a', stroke:'#b04a6a' }, // rosa
  { fill:'#5ac4c0', stroke:'#2a9290' }, // türkis
  { fill:'#9aa0a8', stroke:'#6a7078' }, // grau
];

function kdDarken(hex, amt) {
  const m = (hex || '').replace('#', '');
  if (m.length !== 6) return hex;
  const ch = i => Math.round(parseInt(m.slice(i, i + 2), 16) * (1 - amt)).toString(16).padStart(2, '0');
  return '#' + ch(0) + ch(2) + ch(4);
}
function kdFill(d, i)   { return (d.farben || [])[i] || KD_COLORS[i % KD_COLORS.length].fill; }
function kdStroke(d, i) { const c = (d.farben || [])[i]; return c ? kdDarken(c, 0.3) : KD_COLORS[i % KD_COLORS.length].stroke; }

// Ein Wert je Zeile („Label: Wert" oder „Label Wert").
function kdParse(text) {
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
    return { label, value: val };
  });
}

// Punkt auf dem Kreis (0° = oben, im Uhrzeigersinn).
function kdPt(cx, cy, rad, deg) {
  const a = (deg - 90) * Math.PI / 180;
  return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
}

function kdSvg(d) {
  const items = kdParse(d.data);
  const total = items.reduce((s, i) => s + i.value, 0);
  if (!items.length || total <= 0)
    return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Daten – im Textfeld „Label: Wert" eintragen.</div>`;

  const r = ({ klein: 70, mittel: 95, gross: 125 })[d.groesse || 'mittel'] || 95;
  const filled = d.gefuellt !== false;
  const showLab = d.beschriftung !== false;
  const wm = d.wertmodus || 'werte';            // 'aus' | 'werte' | 'prozent'
  const ff = "font-family:'DidactGothic7',sans-serif;";
  const fs = Math.max(11, Math.round(r * 0.15));
  const longest = Math.max(1, ...items.map(i => i.label.length));
  const mX = showLab ? Math.max(54, Math.round(longest * fs * 0.5) + 12) : 14;
  const mY = showLab ? Math.round(fs * 1.8) + 10 : 14;
  const W = 2 * r + 2 * mX, H = 2 * r + 2 * mY, cx = mX + r, cy = mY + r;
  const sliceStroke = filled ? '#fff' : '#555';
  let g = '';

  const drawn = items.map((it, i) => ({ it, i })).filter(o => o.it.value > 0);

  if (drawn.length === 1) {                       // genau ein Teil → Vollkreis
    const { it, i } = drawn[0];
    g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${filled ? kdFill(d, i) : '#fff'}" stroke="${sliceStroke}" stroke-width="1.4"/>`;
    if (wm !== 'aus') {
      const t = wm === 'prozent' ? '100%' : String(it.value);
      g += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" style="${ff}" font-size="${fs}" fill="#222">${t}</text>`;
    }
    if (showLab)
      g += `<text x="${cx}" y="${cy - r - 4}" text-anchor="middle" style="${ff}" font-size="${fs}" fill="#222">${esc(it.label)}</text>`;
  } else {
    let a0 = 0;
    items.forEach((it, i) => {
      if (it.value <= 0) return;
      const frac = it.value / total;
      const a1 = a0 + frac * 360;
      const mid = (a0 + a1) / 2;
      const [x0, y0] = kdPt(cx, cy, r, a0);
      const [x1, y1] = kdPt(cx, cy, r, a1);
      const large = (a1 - a0) > 180 ? 1 : 0;
      g += `<path d="M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" `
         + `fill="${filled ? kdFill(d, i) : '#fff'}" stroke="${sliceStroke}" stroke-width="1.4"/>`;
      if (wm !== 'aus') {
        const [vx, vy] = kdPt(cx, cy, r * 0.62, mid);
        const t = wm === 'prozent' ? Math.round(frac * 100) + '%' : String(it.value);
        g += `<text x="${vx.toFixed(1)}" y="${vy.toFixed(1)}" text-anchor="middle" dominant-baseline="central" style="${ff}" font-size="${fs}" fill="#222">${t}</text>`;
      }
      if (showLab) {
        const [lx, ly] = kdPt(cx, cy, r + 10, mid);
        const cosv = Math.cos((mid - 90) * Math.PI / 180);
        const anchor = cosv > 0.15 ? 'start' : cosv < -0.15 ? 'end' : 'middle';
        g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" style="${ff}" font-size="${fs}" fill="#222">${esc(it.label)}</text>`;
      }
      a0 = a1;
    });
  }

  g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="1.6"/>`;
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

function kdSetColor(id, i, hex) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.farben = (w.farben || []).slice();
  w.farben[i] = hex;
  render(); renderProps(id);
}

WIDGETS.push({
  meta: { type:'kuchendiagramm', group:'diagramme', label:'Kuchendiagramm', desc:'Daten als Kreisdiagramm', icon:'🥧', category:'mathematik' },

  createData: id => ({
    id, type:'kuchendiagramm',
    data:'Hund: 6\nKatze: 3\nVogel: 8\nFisch: 4',
    gefuellt:true, beschriftung:true, wertmodus:'werte', legende:false, groesse:'mittel',
    farben:[],
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const items = kdParse(d.data);
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const wm = d.wertmodus || 'werte';
    let legend = '';
    if (d.legende) {
      legend = `<div style="align-self:flex-start;border:1.5px solid #999;border-radius:5px;padding:7px 10px;display:flex;flex-direction:column;gap:6px;font-size:12px;">` +
        items.map((it, i) => {
          const extra = wm === 'prozent' ? ` (${Math.round(it.value / total * 100)}%)`
                      : wm === 'werte' ? ` (${it.value})` : '';
          return `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
            <span style="width:14px;height:14px;border-radius:2px;flex-shrink:0;background:${kdFill(d, i)};border:1px solid ${kdStroke(d, i)};"></span>${esc(it.label)}${extra}</span>`;
        }).join('') + `</div>`;
    }
    return atHtml(d) +
      `<div style="display:inline-flex;align-items:flex-start;gap:14px;"><div style="display:inline-block;">${kdSvg(d)}</div>${legend}</div>`;
  },

  renderProps: d => {
    const size = d.groesse || 'mittel';
    const wm = d.wertmodus || 'werte';
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

    return `<div class="prow"><label>Daten <span style="font-weight:400;color:#aaa;font-size:10px;">(„Label: Wert" – ein Wert je Zeile)</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'data',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:90px;font-family:monospace;font-size:12px;line-height:1.6;color:#333;margin-bottom:8px;">${esc(d.data||'')}</textarea>` +
      (() => {
        const items = kdParse(d.data);
        const rows = items.map((it, i) =>
          `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <input type="color" value="${kdFill(d, i)}" onchange="kdSetColor(${d.id},${i},this.value)"
              style="width:36px;height:26px;padding:0;border:1.5px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;">
            <span style="font-size:12px;color:#444;">${esc(it.label || ('Teil ' + (i + 1)))}</span>
          </div>`).join('');
        return `<div class="prow"><label>Farben</label>${rows}</div>`;
      })() +
      `<div class="prow"><label>Beschriftung</label>
        <div style="display:flex;gap:4px;">${btgl(d.beschriftung!==false,'An','beschriftung',true)}${btgl(d.beschriftung===false,'Aus','beschriftung',false)}</div>
      </div>
      <div class="prow"><label>Werte im Kuchen</label>
        <div style="display:flex;gap:4px;">${tgl(wm,'aus','Aus','wertmodus')}${tgl(wm,'werte','Werte','wertmodus')}${tgl(wm,'prozent','Prozent','wertmodus')}</div>
      </div>
      <div class="prow"><label>Legende</label>
        <div style="display:flex;gap:4px;">${btgl(d.legende===true,'An','legende',true)}${btgl(!d.legende,'Aus','legende',false)}</div>
      </div>
      <div class="prow"><label>Kuchen</label>
        <div style="display:flex;gap:4px;">${btgl(d.gefuellt!==false,'Gefüllt','gefuellt',true)}${btgl(d.gefuellt===false,'Leer (Vorlage)','gefuellt',false)}</div>
      </div>
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${tgl(size,'klein','Klein','groesse')}${tgl(size,'mittel','Mittel','groesse')}${tgl(size,'gross','Groß','groesse')}</div>
      </div>`;
  },
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { kdParse, kdSvg, KD_COLORS };
}
