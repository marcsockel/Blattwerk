// Widget: Verlängern Tabelle — „die Bur[g/k]" → „viele Burgen" → „die Burg"

// Font-Liste zentral in main/helpers.js (SCHREIB_FONTS).

// Wortschatz aus dem Widget „Auslautverhärtung" (AUSLAUT_POOL in auslaut.js):
// {art, wort, plural} — der richtige Buchstabe ist der letzte von „wort".
const VL_PAARE = ['g/k', 'd/t', 'b/p', 'doppelt'];
const VL_LABEL  = { 'g/k': 'g/k', 'd/t': 'd/t', 'b/p': 'b/p', 'doppelt': 'Doppelt' };

// Doppelter Konsonant am Ende: erst beim Verlängern hörbar (Ball → Bälle).
// Einige Wörter mit EINFACHEM Konsonanten (Wal → Wale), damit nicht immer „doppelt" stimmt.
const VL_DOPPEL = [
  {art:'der', wort:'Ball',    plural:'Bälle'},     {art:'das', wort:'Fell',    plural:'Felle'},
  {art:'der', wort:'Stall',   plural:'Ställe'},    {art:'der', wort:'Kamm',    plural:'Kämme'},
  {art:'der', wort:'Stamm',   plural:'Stämme'},    {art:'der', wort:'Schwamm', plural:'Schwämme'},
  {art:'das', wort:'Bett',    plural:'Betten'},    {art:'das', wort:'Blatt',   plural:'Blätter'},
  {art:'das', wort:'Brett',   plural:'Bretter'},   {art:'der', wort:'Mann',    plural:'Männer'},
  {art:'das', wort:'Fass',    plural:'Fässer'},    {art:'der', wort:'Fluss',   plural:'Flüsse'},
  {art:'der', wort:'Kuss',    plural:'Küsse'},     {art:'das', wort:'Schloss', plural:'Schlösser'},
  {art:'das', wort:'Schiff',  plural:'Schiffe'},   {art:'das', wort:'Riff',    plural:'Riffe'},
  {art:'der', wort:'Wal',     plural:'Wale'},      {art:'das', wort:'Tal',     plural:'Täler'},
  {art:'der', wort:'Hut',     plural:'Hüte'},      {art:'das', wort:'Brot',    plural:'Brote'},
  {art:'der', wort:'Kran',    plural:'Kräne'},     {art:'das', wort:'Gras',    plural:'Gräser'},
  {art:'das', wort:'Schaf',   plural:'Schafe'},    {art:'der', wort:'Hof',     plural:'Höfe'},
];

function vlEintrag(e, paar) {
  const art = e.art ? e.art + ' ' : '';
  if (paar !== 'doppelt') return `${art}${e.wort.slice(0, -1)}[${paar}], viele ${e.plural}`;
  const c = e.wort.slice(-1);
  const dbl = e.wort.slice(-2) === c + c;
  return `${art}${e.wort.slice(0, dbl ? -2 : -1)}[${c}/${c}${c}], viele ${e.plural}`;
}

function vlGenText(modi, anzahl) {
  const pool = [];
  modi.forEach(m => {
    if (m === 'doppelt') pool.push(...VL_DOPPEL.map(e => ({ e, m })));
    else if (typeof AUSLAUT_POOL !== 'undefined' && AUSLAUT_POOL[m]) pool.push(...AUSLAUT_POOL[m].map(e => ({ e, m })));
  });
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.min(anzahl, pool.length)).map(x => vlEintrag(x.e, x.m)).join('\n');
}

// Welcher der beiden Buchstaben ist richtig? Der, der in der verlängerten Form
// hinter dem Wortstamm steht (Umlaute gleichgesetzt: Wald → Wälder).
function vlRichtig(stem, alt, verlaengert) {
  const norm = t => String(t).toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
  const v = norm(verlaengert), tail = norm(stem).slice(-2);
  // längste Variante zuerst prüfen: „Bälle" passt zu „ll" (und auch zu „l")
  const opts = alt.split('/');
  const byLen = [...opts].sort((a, b) => b.length - a.length);
  return byLen.find(o => v.includes(tail + norm(o))) || opts[opts.length - 1];
}

function vlParseText(text) {
  return (text || '').split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const commaIdx = l.indexOf(',');
      if (commaIdx < 0) return null;
      const left     = l.slice(0, commaIdx).trim();
      const verwandt = l.slice(commaIdx + 1).trim();
      const bo = left.indexOf('['), bc = left.indexOf(']');
      if (bo < 0 || bc < 0) return null;
      const before = left.slice(0, bo);
      const alt    = left.slice(bo + 1, bc);
      const end    = left.slice(bc + 1);
      const sp = before.lastIndexOf(' ');
      let art = '', stem = before.trim();
      if (sp >= 0) { art = before.slice(0, sp).trim(); stem = before.slice(sp + 1); }
      return { art, stem, alt, end, verwandt };
    }).filter(Boolean);
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:'verlaengern', label:'Verlängern Tabelle', desc:'Auslaut durch Verlängern finden (g/k, d/t, b/p)', icon:'↔', category:'deutsch' },

  createData: id => {
    const modi = ['g/k', 'd/t', 'b/p'], anzahl = 6;
    return { id, type:'verlaengern', modi, anzahl,
             font: "'Grundschrift', sans-serif", fontSize: 20,
             text: vlGenText(modi, anzahl) , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const font      = d.font     || "'Grundschrift', sans-serif";
    const fontSize  = d.fontSize || 16;
    const eintraege = vlParseText(d.text);
    const isActive  = d.id === selId || _solutionsMode;
    const solStyle  = 'color:#2563eb;font-weight:700;';

    if (!eintraege.length)
      return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Wörter eingetragen.</div>`;

    const thS = `padding:6px 10px;font-size:15px;font-weight:700;color:#666;
                 border-bottom:2px solid #ddd;text-align:left;white-space:nowrap;`;
    const tdS = `padding:9px 10px;border-bottom:1px solid #eee;vertical-align:middle;
                 font-family:${font};font-size:${fontSize}px;`;
    // Antwortlinien liegen GENAU auf der Zeilenlinie der Tabelle (Zelle ohne Polster
    // unten, Linie überdeckt den hellen Zeilenstrich) und füllen die Spalte ganz aus.
    const lh = Math.round(fontSize * 1.5);
    const ansTd = `padding:0 10px;border-bottom:1px solid #eee;vertical-align:bottom;
                   font-family:${font};font-size:${fontSize}px;`;
    const line = content => `<div style="flex:1;min-width:0;border-bottom:2px solid #444;margin-bottom:-1px;
                   height:${lh}px;line-height:${lh}px;white-space:nowrap;overflow:hidden;">${content}</div>`;
    const sol = t => isActive ? `<span style="${solStyle}">${esc(t)}</span>` : '';

    const rows = eintraege.map(({ art, stem, alt, end, verwandt }) => {
      const richtig = vlRichtig(stem, alt, verwandt);      // z.B. 'g' bei „viele Burgen"
      const geloest = `${art ? art + ' ' : ''}${stem}${richtig}${end}`; // z.B. 'die Burg'
      return `<tr>
        <td style="${tdS};padding-bottom:2px;line-height:${lh}px;vertical-align:bottom;white-space:nowrap;width:1%;">
          ${art ? art + ' ' : ''}${stem}<span style="background:#f0ede6;border-radius:3px;
            padding:1px 5px;font-weight:700;">${alt}</span>${end}
        </td>
        <td style="${ansTd}width:30%;"><div style="display:flex;">${line(sol(verwandt))}</div></td>
        <td style="${ansTd}"><div style="display:flex;align-items:flex-end;gap:6px;">
          <span style="line-height:${lh}px;white-space:nowrap;">also:</span>${line(sol(geloest))}</div></td>
      </tr>`;
    }).join('');

    return atHtml(d) + `<table style="width:100%;border-collapse:collapse;font-family:${font};">
      <thead><tr>
        <th style="${thS}">Wort</th>
        <th style="${thS}">verlängert:</th>
        <th style="${thS}">also:</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  renderProps: d => {
    const modi     = d.modi     || ['g/k', 'd/t', 'b/p'];
    const anzahl   = d.anzahl   || 6;
    const font     = d.font     || "'Grundschrift', sans-serif";
    const fontSize = d.fontSize || 16;
    const text     = d.text     || '';

    const poolSize = modi.reduce((n, m) => n + (m === 'doppelt' ? VL_DOPPEL.length : ((typeof AUSLAUT_POOL !== 'undefined' && AUSLAUT_POOL[m]) ? AUSLAUT_POOL[m].length : 0)), 0);

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;
               border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;
               font-size:11px;font-weight:700;cursor:pointer;
               color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `
      <div class="prow"><label>Beispiele</label>
        <div style="display:flex;gap:4px;">
          ${VL_PAARE.map(m => togBtn(VL_LABEL[m], modi.includes(m), `vlToggleModus(${d.id},'${m}')`)).join('')}
        </div>
      </div>
      ${pr('Anzahl', `<input type="number" min="1" max="30"
        value="${anzahl}" onclick="event.stopPropagation()"
        onchange="vlSetAnzahl(${d.id},+this.value)"
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
          oninput="vlUpdText(${d.id},this.value)"
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
      <button onclick="event.stopPropagation();vlWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` ;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function vlToggleModus(id, m) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const modi = (w.modi || ['g/k', 'd/t', 'b/p']).slice();
  const idx  = modi.indexOf(m);
  if (idx >= 0) {
    if (modi.length === 1) return;
    modi.splice(idx, 1);
  } else {
    modi.push(m);
  }
  saveHistory();
  w.modi = modi;
  w.text = vlGenText(modi, w.anzahl || 6);
  render(); renderProps(id);
}

// Manuelles Bearbeiten des Textfelds: Anzahl an die tatsächliche Zeilenzahl
// koppeln, damit sie mitwächst. Fokus bleibt erhalten (updq → kein renderProps).
function vlUpdText(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  w.anzahl = Math.max(1, vlParseText(val).length);
  updq(id, 'text', val);
}

function vlSetAnzahl(id, anzahl) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.anzahl = anzahl;
  w.text   = vlGenText(w.modi || ['g/k', 'd/t', 'b/p'], anzahl);
  render(); renderProps(id);
}

function vlWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.text = vlGenText(w.modi || ['g/k', 'd/t', 'b/p'], w.anzahl || 6);
  render(); renderProps(id);
}
