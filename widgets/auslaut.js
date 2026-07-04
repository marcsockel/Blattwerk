// Widget: Auslautverhärtung (d/t, b/p, g/k)

// Font-Liste zentral in main/helpers.js (SCHREIB_FONTS).

const AUSLAUT_POOL = {
  'g/k': [
    {art:'die', wort:'Burg',   plural:'Burgen'},
    {art:'der', wort:'Tag',    plural:'Tage'},
    {art:'der', wort:'Weg',    plural:'Wege'},
    {art:'der', wort:'Berg',   plural:'Berge'},
    {art:'der', wort:'Zug',    plural:'Züge'},
    {art:'der', wort:'Zweig',  plural:'Zweige'},
    {art:'der', wort:'Sieg',   plural:'Siege'},
    {art:'der', wort:'Teig',   plural:'Teige'},
    {art:'der', wort:'Sarg',   plural:'Särge'},
    {art:'der', wort:'Steg',   plural:'Stege'},
    {art:'der', wort:'Krug',   plural:'Krüge'},
    {art:'der', wort:'Flug',   plural:'Flüge'},
    {art:'der', wort:'Steig',  plural:'Steige'},
    {art:'der', wort:'Pflug',  plural:'Pflüge'},
    {art:'der', wort:'Betrug', plural:'Betrüge'},
  ],
  'd/t': [
    {art:'das', wort:'Bad',   plural:'Bäder'},
    {art:'das', wort:'Rad',   plural:'Räder'},
    {art:'der', wort:'Hund',  plural:'Hunde'},
    {art:'der', wort:'Wald',  plural:'Wälder'},
    {art:'das', wort:'Kind',  plural:'Kinder'},
    {art:'das', wort:'Land',  plural:'Länder'},
    {art:'das', wort:'Pferd', plural:'Pferde'},
    {art:'der', wort:'Mond',  plural:'Monde'},
    {art:'das', wort:'Lied',  plural:'Lieder'},
    {art:'das', wort:'Bild',  plural:'Bilder'},
    {art:'der', wort:'Rand',  plural:'Ränder'},
    {art:'der', wort:'Held',  plural:'Helden'},
    {art:'das', wort:'Feld',  plural:'Felder'},
    {art:'das', wort:'Hemd',  plural:'Hemden'},
    {art:'der', wort:'Herd',  plural:'Herde'},
    {art:'das', wort:'Pfand', plural:'Pfänder'},
  ],
  'b/p': [
    {art:'das', wort:'Grab',    plural:'Gräber'},
    {art:'der', wort:'Korb',    plural:'Körbe'},
    {art:'der', wort:'Stab',    plural:'Stäbe'},
    {art:'der', wort:'Dieb',    plural:'Diebe'},
    {art:'das', wort:'Kalb',    plural:'Kälber'},
    {art:'das', wort:'Sieb',    plural:'Siebe'},
    {art:'der', wort:'Betrieb', plural:'Betriebe'},
    {art:'der', wort:'Trieb',   plural:'Triebe'},
    {art:'der', wort:'Urlaub',  plural:'Urlaube'},
    {art:'das', wort:'Weib',    plural:'Weiber'},
  ],
};

function auslautPairForChar(c) {
  if (c === 'd') return { hard:'t', soft:'d' };
  if (c === 'b') return { hard:'p', soft:'b' };
  return { hard:'k', soft:'g' };
}

function auslautParseText(text) {
  return (text || '').split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const [left, right] = l.split(',').map(s => s.trim());
      if (!left || !right) return null;
      const sp = left.indexOf(' ');
      if (sp < 0) return null;
      return { art: left.slice(0, sp), wort: left.slice(sp + 1).trim(), plural: right };
    }).filter(Boolean);
}

function auslautGenText(modi, anzahl) {
  const pool = [];
  if (modi.includes('g/k')) pool.push(...AUSLAUT_POOL['g/k']);
  if (modi.includes('d/t')) pool.push(...AUSLAUT_POOL['d/t']);
  if (modi.includes('b/p')) pool.push(...AUSLAUT_POOL['b/p']);
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.min(anzahl, pool.length))
    .map(e => `${e.art} ${e.wort}, ${e.plural}`)
    .join('\n');
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:'auslaut', label:'Auslautverhärtung', desc:'d/t, b/p, g/k erkennen', icon:'✏', category:'deutsch' },

  createData: id => {
    const modi = ['g/k'], anzahl = 6;
    return { id, type:'auslaut', modi, anzahl, zeigVerlaengerung: false,
             font: "'Grundschrift', sans-serif", fontSize: 16,
             text: auslautGenText(modi, anzahl) , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const modi     = d.modi || ['g/k'];
    const zeigVerl = d.zeigVerlaengerung || false;
    const font     = d.font     || "'Grundschrift', sans-serif";
    const fontSize = d.fontSize || 16;
    const eintraege = auslautParseText(d.text);
    const isActive = d.id === selId || _solutionsMode;
    const solStyle = 'color:#2563eb;font-weight:700;';

    if (!eintraege.length)
      return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Wörter eingetragen.</div>`;

    const thS = `padding:5px 10px;font-size:11px;font-weight:700;color:#888;
                 border-bottom:2px solid #ddd;text-align:left;white-space:nowrap;`;
    const tdS = `padding:9px 10px;border-bottom:1px solid #eee;vertical-align:middle;
                 font-family:${font};font-size:${fontSize}px;`;
    const lineBase = `display:inline-block;border-bottom:2px solid #444;height:${Math.round(fontSize*0.5)}px;vertical-align:-${Math.round(fontSize*0.4)}px;`;

    const rows = eintraege.map(({ art, wort, plural }) => {
      const stamm   = wort.slice(0, -1);
      const lastC   = wort.slice(-1).toLowerCase();
      const stemLen = wort.length - 1;
      const { hard, soft } = auslautPairForChar(lastC);

      // Verlängerungsspalte (langer Strich)
      let verlCell;
      if (zeigVerl) {
        const pBefore    = plural.slice(0, stemLen);
        const pKey       = plural[stemLen] || '';
        const pAfter     = plural.slice(stemLen + 1);
        const pluralHtml = `${pBefore}<u style="font-weight:700;text-decoration-thickness:2px;">${pKey}</u>${pAfter}`;
        verlCell = `viele ${pluralHtml}`;
      } else if (isActive) {
        verlCell = `viele <span style="${solStyle}">${esc(plural)}</span>`;
      } else {
        verlCell = `viele <span style="${lineBase}min-width:150px;margin-left:4px;"></span>`;
      }

      const loesCell = isActive
        ? `also: <span style="${solStyle}margin-left:4px;">${esc(art + ' ' + wort)}</span>`
        : `also: <span style="${lineBase}min-width:100px;margin-left:4px;"></span>`;

      return `<tr>
        <td style="${tdS}">
          ${art} ${stamm}<span style="background:#f0ede6;border-radius:3px;
            padding:1px 5px;font-weight:700;">${hard}/${soft}</span>
        </td>
        <td style="${tdS}">${verlCell}</td>
        <td style="${tdS};white-space:nowrap;">${loesCell}</td>
      </tr>`;
    }).join('');

    return atHtml(d) + `<table style="width:100%;border-collapse:collapse;font-family:${font};">
      <thead><tr>
        <th style="${thS}">Wort</th>
        <th style="${thS}"><svg height="12" viewBox="0 0 150 58" style="display:inline-block;vertical-align:middle;margin-right:4px;" xmlns="http://www.w3.org/2000/svg"><path d="M11.0313 17.709C11.0313 34.2776 24.4628 47.709 41.0313 47.709C57.5999 47.709 71.0313 34.2776 71.0313 17.709L105.904 17.709" fill="none" stroke="#888" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/><path d="M105.904 8.70902L127.904 17.709L105.904 26.709Z" fill="#888"/></svg>Verlängerung</th>
        <th style="${thS}">Lösung</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  renderProps: d => {
    const modi     = d.modi || ['g/k'];
    const anzahl   = d.anzahl || 6;
    const zeigVerl = d.zeigVerlaengerung || false;
    const font     = d.font     || "'Grundschrift', sans-serif";
    const fontSize = d.fontSize || 16;
    const text     = d.text || '';

    const poolSize = (modi.includes('g/k') ? AUSLAUT_POOL['g/k'].length : 0)
                   + (modi.includes('d/t') ? AUSLAUT_POOL['d/t'].length : 0)
                   + (modi.includes('b/p') ? AUSLAUT_POOL['b/p'].length : 0);

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;
               border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;
               font-size:11px;font-weight:700;cursor:pointer;
               color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `
      <div class="prow"><label>Modi</label>
        <div style="display:flex;gap:4px;">
          ${togBtn('d / t', modi.includes('d/t'), `auslautToggleModus(${d.id},'d/t')`)}
          ${togBtn('b / p', modi.includes('b/p'), `auslautToggleModus(${d.id},'b/p')`)}
          ${togBtn('g / k', modi.includes('g/k'), `auslautToggleModus(${d.id},'g/k')`)}
        </div>
      </div>
      <div class="prow"><label>Verlängerung</label>
        <div style="display:flex;gap:4px;">
          ${togBtn('Ausblenden', !zeigVerl, `upd(${d.id},'zeigVerlaengerung',false)`)}
          ${togBtn('Anzeigen',    zeigVerl, `upd(${d.id},'zeigVerlaengerung',true)`)}
        </div>
      </div>
      ${pr('Anzahl', `<input type="number" min="1" max="30"
        value="${anzahl}" onclick="event.stopPropagation()"
        onchange="auslautSetAnzahl(${d.id},+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      <div class="prow"><label>Wörter</label></div>
      <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:6px;">
        <div style="display:flex;align-items:center;padding:5px 6px;border-bottom:1px solid #eee;background:#fafafa;">
          <div style="margin-left:auto;"><input type="number" min="8" max="36" value="${fontSize}"
            onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
                   font-family:inherit;font-size:12px;text-align:center;"></div>
        </div>
        <textarea onclick="event.stopPropagation()"
          onfocus="edFocus()" onblur="edBlur()"
          oninput="auslautUpdText(${d.id},this.value)"
          style="width:100%;height:150px;font-family:inherit;font-size:12px;
                 border:none;outline:none;padding:8px 10px;
                 resize:vertical;box-sizing:border-box;line-height:1.6;display:block;"
          >${esc(text)}</textarea>
        <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
            ${SCHREIB_FONTS.map(f=>`<option value="${f.value}" ${font===f.value?'selected':''}>${f.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <button onclick="event.stopPropagation();auslautWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` ;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function auslautToggleModus(id, m) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const modi = (w.modi || ['g/k']).slice();
  const idx  = modi.indexOf(m);
  if (idx >= 0) {
    if (modi.length === 1) return; // mindestens einer muss aktiv sein
    modi.splice(idx, 1);
  } else {
    modi.push(m);
  }
  saveHistory();
  w.modi = modi;
  w.text = auslautGenText(modi, w.anzahl || 6);
  render(); renderProps(id);
}

// Manuelles Bearbeiten des Textfelds: Anzahl an die tatsächliche Zeilenzahl
// koppeln, damit sie mitwächst. Fokus bleibt erhalten (updq → kein renderProps).
function auslautUpdText(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.anzahl = Math.max(1, auslautParseText(val).length);
  updq(id, 'text', val);
}

function auslautSetAnzahl(id, anzahl) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.anzahl = anzahl;
  w.text   = auslautGenText(w.modi || ['g/k'], anzahl);
  render(); renderProps(id);
}

function auslautWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.text = auslautGenText(w.modi || ['g/k'], w.anzahl || 6);
  render(); renderProps(id);
}
