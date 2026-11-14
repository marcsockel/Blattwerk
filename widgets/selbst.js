// Widget: Selbsteinschätzung
// Die Kinder schätzen sich zu einigen Aussagen selbst ein („Ich kann …").
//   aussagen  eine Aussage je Zeile
//   art       smiley  – je Aussage drei Gesichter (froh, neutral, traurig) zum Ankreuzen/Anmalen
//             daumen  – je Aussage drei Daumen (hoch, zur Seite, runter)
//             ampel   – je Aussage eine liegende Ampel (grün, gelb, rot)
//             ziel    – je Aussage eine kleine Zielscheibe (Kreuz setzen: je näher an der Mitte,
//                       desto besser)
// Aussagen lassen sich direkt im Blatt ändern (Doppelklick; BW_AUFGABE unten).
//             zielscheibe – EINE große Zielscheibe mit einem Feld je Aussage; die Aussagen
//                       stehen nummeriert daneben
//   farbe     farbig | sw (Umrisse zum Selbst-Ausmalen, auch für Schwarz-Weiß-Druck)
// Keine Lösung — es gibt kein „richtig".

const SE_ARTEN = ['smiley', 'daumen', 'ampel', 'ziel', 'zielscheibe'];
const SE_RINGE = ['#fecaca', '#fde68a', '#d9f99d', '#86efac'];          // außen → innen
function seAussagen(d) { return String(d.aussagen || '').split('\n').map(s => s.trim()).filter(Boolean); }
function seArt(d) { return SE_ARTEN.includes(d.art) ? d.art : 'smiley'; }

// Gesicht: stufe 0 = froh, 1 = neutral, 2 = traurig
function seSmiley(stufe, px, farbig) {
  const fill = farbig ? ['#bbf7d0', '#fef08a', '#fecaca'][stufe] : '#fff';
  const mund = stufe === 0 ? 'M30 60 Q50 80 70 60' : stufe === 1 ? 'M32 66 H68' : 'M30 72 Q50 54 70 72';
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto;">`
    + `<circle cx="50" cy="50" r="45" fill="${fill}" stroke="#222" stroke-width="5"/>`
    + `<circle cx="35" cy="40" r="5.5" fill="#222"/><circle cx="65" cy="40" r="5.5" fill="#222"/>`
    + `<path d="${mund}" fill="none" stroke="#222" stroke-width="5.5" stroke-linecap="round"/></svg>`;
}
// Daumen: stufe 0 = hoch, 1 = zur Seite, 2 = runter (dieselbe Hand, gedreht; zur Seite: gespiegelt, Arm unten)
function seDaumen(stufe, px, farbig) {
  const fill = farbig ? ['#bbf7d0', '#fef08a', '#fecaca'][stufe] : '#fff';
  return `<svg viewBox="0 0 100 100" width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto;">`
    + `<g transform="${stufe === 1 ? 'translate(0 100) scale(1 -1) ' : ''}rotate(${stufe * 90} 50 50)" fill="${fill}" stroke="#222" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">`
    + `<rect x="9" y="46" width="19" height="42" rx="4"/>`
    + `<path d="M34 48 L47 22 Q51 9 60 13 Q68 17 64 31 L60 44 H80 Q91 44 89 54 Q93 62 87 68 Q90 76 83 80 Q83 89 72 89 H46 Q38 89 34 85 Z"/>`
    + `</g></svg>`;
}
// Liegende Ampel mit drei Lichtern (grün – gelb – rot)
function seAmpel(px, farbig) {
  const lichter = ['#22c55e', '#facc15', '#ef4444'];
  return `<svg viewBox="0 0 300 100" width="${px * 3}" height="${px}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto;">`
    + `<rect x="3" y="3" width="294" height="94" rx="47" fill="${farbig ? '#3f3f46' : '#fff'}" stroke="#222" stroke-width="5"/>`
    + lichter.map((c, i) => `<circle cx="${50 + i * 100}" cy="50" r="32" fill="${farbig ? c : '#fff'}" stroke="#222" stroke-width="${farbig ? 3 : 4.5}"/>`).join('')
    + `</svg>`;
}
// Zielscheibe mit 4 Ringen. n > 0: n Felder mit Nummern außen (große Scheibe);
// n = 0: kleine Scheibe ohne Felder (eine je Aussage)
function seZielscheibe(n, px, farbig) {
  const R = 100, rand = n ? 26 : 4, S = 2 * (R + rand), c = R + rand;
  const dick = n ? 1 : 2.4;                                    // kleine Scheibe: kräftigere Linien
  const pt = (winkel, r) => [c + r * Math.sin(winkel), c - r * Math.cos(winkel)];
  let g = '';
  SE_RINGE.forEach((f, i) => { g += `<circle cx="${c}" cy="${c}" r="${R * (4 - i) / 4}" fill="${farbig ? f : '#fff'}" stroke="#222" stroke-width="${(i === 0 ? 2.4 : 1.4) * dick}"/>`; });
  g += `<circle cx="${c}" cy="${c}" r="${n ? 5 : 8}" fill="#222"/>`;
  for (let k = 0; k < n; k++) {
    const a = 2 * Math.PI * k / n;
    if (n > 1) { const [x, y] = pt(a, R); g += `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#222" stroke-width="1.8"/>`; }
    const [tx, ty] = pt(a + Math.PI / n, R + rand * 0.52);
    g += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="'DidactGothic7',sans-serif" font-size="19" font-weight="700" fill="#222">${k + 1}</text>`;
  }
  return `<svg viewBox="0 0 ${S} ${S}" width="${px}" height="${px}" xmlns="http://www.w3.org/2000/svg" style="display:block;flex:0 0 auto;max-width:100%;height:auto;">${g}</svg>`;
}

WIDGETS.push({
  meta: { type:'selbsteinschaetzung', label:'Selbsteinschätzung', desc:'Smiley, Daumen, Ampel oder Zielscheibe zu „Ich kann …"-Aussagen', icon:'🎯', category:'allgemein' },

  createData: id => ({
    id, type:'selbsteinschaetzung',
    aussagen: 'Ich habe die Aufgaben verstanden.\nIch konnte alleine arbeiten.\nIch habe ordentlich gearbeitet.',
    art:'smiley', farbe:'farbig', groesse:'mittel',
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const A = seAussagen(d);
    if (!A.length)
      return atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Aussagen – in den Eigenschaften je Zeile eine Aussage eintragen.</div>`;
    const g = d.groesse || 'mittel', fs = g === 'gross' ? 21 : g === 'klein' ? 15 : 18;
    const farbig = (d.farbe || 'farbig') !== 'sw';
    const art = seArt(d);
    const ff = `font-family:'DidactGothic7',sans-serif;font-size:${fs}px;line-height:1.3;color:#222;`;

    if (art === 'zielscheibe') {
      const px = g === 'gross' ? 280 : g === 'klein' ? 170 : 220;
      const n = Math.min(A.length, 12);
      const liste = A.slice(0, n).map((t, i) =>
        `<div style="display:flex;gap:${Math.round(fs * 0.45)}px;margin-bottom:${Math.round(fs * 0.45)}px;"><span style="font-weight:700;min-width:${Math.round(fs * 1.1)}px;text-align:right;">${i + 1}</span><span data-aufg="1">${esc(t)}</span></div>`).join('');
      return atHtml(d)
        + `<div style="${ff}display:flex;flex-wrap:wrap;align-items:center;gap:${Math.round(fs * 0.8)}px ${Math.round(fs * 1.4)}px;">`
        + `<div style="flex:0 1 auto;min-width:0;max-width:100%;">${seZielscheibe(n, px, farbig)}</div>`
        + `<div style="flex:1 1 200px;min-width:min(200px,100%);">${liste}</div></div>`;
    }

    const px = g === 'gross' ? 38 : g === 'klein' ? 24 : 30;
    const skala = art === 'ampel' ? seAmpel(px, farbig)
      : art === 'ziel' ? seZielscheibe(0, Math.round(px * 2.1), farbig)
      : `<div style="display:flex;gap:${Math.round(px * 0.3)}px;flex:0 0 auto;">${[0, 1, 2].map(s => (art === 'daumen' ? seDaumen : seSmiley)(s, px, farbig)).join('')}</div>`;
    return atHtml(d) + `<div style="${ff}">` + A.map((t, i) =>
      `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:${Math.round(fs * 0.3)}px ${Math.round(fs * 0.9)}px;padding:${Math.round(fs * 0.35)}px 0;${i ? 'border-top:1px solid #ddd;' : ''}break-inside:avoid;">`
      // schmale Spalte: die Skala rutscht unter die Aussage statt über den Rand
      + `<div data-aufg="1" style="flex:1 1 ${Math.round(fs * 4.5)}px;min-width:0;">${esc(t)}</div>${skala}</div>`).join('')
      + `</div>`;
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', art = seArt(d), farbig = (d.farbe || 'farbig') !== 'sw';
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    const zuViele = art === 'zielscheibe' && seAussagen(d).length > 12;
    return `<div class="prow"><label>Aussagen <span style="font-weight:400;color:#aaa;font-size:10px;">(eine je Zeile)</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'aussagen',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:96px;font-family:inherit;font-size:12px;line-height:1.6;color:#333;margin-bottom:8px;">${esc(d.aussagen || '')}</textarea>`
      + (zuViele ? `<div style="font-size:10.5px;color:#e64553;margin:-2px 0 8px;">Die große Zielscheibe zeigt höchstens 12 Aussagen.</div>` : '')
      + `<div class="prow"><label>Darstellung</label>
        <div style="display:flex;gap:4px;margin-bottom:4px;">${tgl(art==='smiley','Smiley',`upd(${d.id},'art','smiley')`)}${tgl(art==='daumen','Daumen',`upd(${d.id},'art','daumen')`)}${tgl(art==='ampel','Ampel',`upd(${d.id},'art','ampel')`)}</div>
        <div style="display:flex;gap:4px;">${tgl(art==='ziel','Zielscheibe je Aussage',`upd(${d.id},'art','ziel')`)}${tgl(art==='zielscheibe','Eine große Zielscheibe',`upd(${d.id},'art','zielscheibe')`)}</div></div>
      <div class="prow"><label>Farbe</label><div style="display:flex;gap:4px;">
        ${tgl(farbig,'Farbig',`upd(${d.id},'farbe','farbig')`)}${tgl(!farbig,'S/W',`upd(${d.id},'farbe','sw')`)}</div></div>
      <div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>`;
  },
});

// Aussage direkt im Blatt ändern (main/helpers.js → BW_AUFGABE): Doppelklick auf den Text
BW_AUFGABE.selbsteinschaetzung = {
  ziel: '[data-aufg]',
  text: (w, i) => seAussagen(w)[i] ?? null,
  setzen: (w, i, txt) => {
    const t = String(txt).replace(/\s+/g, ' ').trim();
    if (!t) return 'Bitte einen Text eingeben.';
    const L = seAussagen(w);
    L[i] = t;
    w.aussagen = L.join('\n');
    return true;
  },
};
