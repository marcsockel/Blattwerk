// Widget: Spiegeln (Achsensymmetrie im Kästchenfeld)
// Je Aufgabe ein Kästchenraster mit Spiegelachse in der Mitte. Auf einer Seite steht die
// Figur, die andere Seite wird ergänzt; Lösung blau (ausgewählt / Lösungsblatt).
//   art    'felder' – ausgemalte Kästchen | 'linien' – Streckenzug auf den Gitterpunkten
//   achse  'senkrecht' (Figur links) | 'waagerecht' (Figur oben)
//   stufe  leicht | mittel | schwer → Rastergröße und Figur
// Koordinaten der halben Seite: a = Abstand quer zur Achse (0 = außen, w = auf der Achse),
// b = Position längs der Achse (0…h). Aufgaben speichern nur {cells:[[a,b]…]} bzw. {pts:[[a,b]…]}.

const SP_STUFEN = {
  leicht: { w: 4, h: 6, felder: [5, 7] },
  mittel: { w: 5, h: 7, felder: [8, 11] },
  schwer: { w: 6, h: 9, felder: [12, 16] },
};
function spStufe(d) { return SP_STUFEN[d.stufe] ? d.stufe : 'mittel'; }
function spDims(d) { return SP_STUFEN[spStufe(d)]; }
function spRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

// Ausgemalte Kästchen: zusammenhängende Figur. Leicht/Mittel berührt die Achse, Schwer nicht zwingend.
function spGenFelder(stufe) {
  const { w, h, felder } = SP_STUFEN[stufe];
  const n = spRand(felder[0], felder[1]);
  const key = (a, b) => a + ',' + b;
  const start = [stufe === 'schwer' ? spRand(0, w - 1) : w - 1, spRand(1, h - 2)];
  const cells = [start], set = new Set([key(start[0], start[1])]);
  for (let v = 0; v < 400 && cells.length < n; v++) {
    const [a, b] = cells[spRand(0, cells.length - 1)];
    const [da, db] = [[1, 0], [-1, 0], [0, 1], [0, -1]][spRand(0, 3)];
    const na = a + da, nb = b + db;
    if (na < 0 || na >= w || nb < 0 || nb >= h || set.has(key(na, nb))) continue;
    set.add(key(na, nb)); cells.push([na, nb]);
  }
  return { cells };
}

// Streckenzug: beginnt und endet auf der Achse, läuft dazwischen von oben nach unten
// (b nimmt nie ab) → mit dem Spiegelbild entsteht eine geschlossene Figur ohne Überschneidung.
//   leicht – nur waagerechte/senkrechte Strecken (Treppe)
//   mittel – zusätzlich Diagonalen durch die Kästchenecken
//   schwer – beliebig schräge Strecken
function spGenLinien(stufe) {
  const { w, h } = SP_STUFEN[stufe];
  const andere = a => { let n; do { n = spRand(1, w - 1); } while (n === a); return n; };
  if (stufe === 'schwer') {
    const bs = new Set(); const m = spRand(5, 7);
    while (bs.size < m) bs.add(spRand(1, h - 1));
    const b = [...bs].sort((x, y) => x - y);
    let a = w;
    return { pts: b.map((bb, i) => { a = (i === 0 || i === b.length - 1) ? w : andere(a); return [a, bb]; }) };
  }
  let a = w, b = 1, letzte = '';
  const pts = [[a, b]];
  const H = () => { a = andere(a); pts.push([a, b]); letzte = 'H'; };
  const V = () => { b += Math.min(spRand(1, 2), h - 1 - b); pts.push([a, b]); letzte = 'V'; };
  // Diagonale: gleich viele Kästchen quer wie längs
  const D = () => {
    const dirs = [-1, 1].filter(s => a + s >= 1 && a + s <= w - 1);
    if (!dirs.length || b >= h - 1) return false;
    const s = dirs[spRand(0, dirs.length - 1)];
    const max = Math.min(h - 1 - b, s < 0 ? a - 1 : w - 1 - a, 2);
    const k = spRand(1, max);
    a += s * k; b += k; pts.push([a, b]); letzte = 'D';
    return true;
  };
  H();                                             // von der Achse weg
  for (let schritt = 0; schritt < 12 && b < h - 1; schritt++) {
    if (pts.length >= 5 && b >= h - 3 && Math.random() < 0.35) break;
    const r = Math.random();
    if (stufe === 'mittel' && r < 0.45 && D()) continue;
    if (letzte === 'H' || (letzte !== 'V' && r < 0.75)) V(); else H();
  }
  if (letzte === 'H') V();                         // nicht zwei waagerechte Strecken hintereinander
  if (b > h - 1) b = h - 1;
  pts.push([w, b]);                                // waagerecht zurück zur Achse
  // gleiche Nachbarpunkte entfernen (z. B. wenn unten kein Platz mehr für eine Senkrechte war)
  return { pts: pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]) };
}

function spGenOne(d) { return (d.art || 'felder') === 'linien' ? spGenLinien(spStufe(d)) : spGenFelder(spStufe(d)); }
function spGenerate(w) {
  const n = Math.max(1, Math.min(12, Math.round(+w.anzahl) || 3));
  w.items = Array.from({ length: n }, () => spGenOne(w));
}

// Verfügbare Breite des Widgets (gerechnet, damit Zeichnen und Zählen dasselbe Ergebnis liefern)
function spPlatz(d) {
  if (typeof geom !== 'function' || typeof widthFrac !== 'function') return 625;
  const f = widthFrac(d);
  return geom().contentW * f - (d.flush ? 0 : 15) - (f < 1 ? 10 : 0);
}
function spCols(d) { const { w, h } = spDims(d); return (d.achse || 'senkrecht') === 'waagerecht' ? h : 2 * w; }
function spFits(d, cs) {
  const W = spCols(d) * cs + 12, platz = spPlatz(d);
  const n = typeof seriesFits === 'function' ? seriesFits(platz, W, 24) : Math.floor((platz + 24) / (W + 24));
  return Math.max(1, Math.min(12, n));
}
// Kästchengröße. „Groß": mindestens 24 px — und so groß, dass die Aufgaben einer Zeile die
// Breite ausfüllen (mit normalem Abstand dazwischen), höchstens 40 px.
function spCs(d) {
  const g = d.groesse || 'mittel';
  if (g !== 'gross') return g === 'klein' ? 12 : 17;
  const pro = spFits(d, 24), gap = typeof ITEM_GAP_MAP !== 'undefined' ? ITEM_GAP_MAP.normal.h : 43;
  const cs = Math.floor(((spPlatz(d) - (pro - 1) * gap) / pro - 12) / spCols(d));
  return Math.max(24, Math.min(40, cs));
}

// Wie viele Aufgaben passen in eine Zeile? (für „immer volle Zeilen" beim Umstellen)
// Rechnet wie die Verteilung selbst (main/helpers.js seriesFits, Mindestabstand 24 px).
function spProZeile(d) { return spFits(d, spCs(d)); }

function spSvg(d, item, idx) {
  const { w, h } = spDims(d), cs = spCs(d);
  const quer = (d.achse || 'senkrecht') === 'waagerecht';       // Achse waagerecht: Figur oben
  const m = 6;                                                   // Rand (Achse ragt etwas über das Raster)
  const cols = quer ? h : 2 * w, rows = quer ? 2 * w : h;
  const W = cols * cs + 2 * m, H = rows * cs + 2 * m;
  const isActive = d.id === selId || _solutionsMode;
  const klickbar = (d.art || 'felder') === 'felder' && d.id === selId && !_solutionsMode;
  // (a,b) der halben Seite → Bildpunkt; sp = true: Spiegelbild
  const P = (a, b, sp) => { const q = sp ? 2 * w - a : a; return quer ? [m + b * cs, m + q * cs] : [m + q * cs, m + b * cs]; };
  // Kästchen (a,b) → linke obere Ecke
  const C = (a, b, sp) => { const q = sp ? 2 * w - 1 - a : a; return quer ? [m + b * cs, m + q * cs] : [m + q * cs, m + b * cs]; };

  let g = `<rect x="${m}" y="${m}" width="${cols * cs}" height="${rows * cs}" fill="#fff"/>`, klick = '';
  if (item.cells) {
    const set = new Set(item.cells.map(c => c[0] + ',' + c[1]));
    item.cells.forEach(([a, b]) => {
      const [x, y] = C(a, b, false);
      g += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="#9a9a9a"/>`;
      if (isActive) { const [sx, sy] = C(a, b, true); g += `<rect x="${sx}" y="${sy}" width="${cs}" height="${cs}" fill="#2563eb" fill-opacity="0.6"/>`; }
    });
    if (klickbar) for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) {
      const [x, y] = C(a, b, false);
      klick += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="transparent" style="cursor:pointer;" onclick="event.stopPropagation();spToggle(${d.id},${idx},${a},${b})"><title>${set.has(a + ',' + b) ? 'Kästchen leeren' : 'Kästchen ausmalen'}</title></rect>`;
    }
  }
  // Raster
  let grid = '';
  for (let c = 0; c <= cols; c++) grid += `<line x1="${m + c * cs}" y1="${m}" x2="${m + c * cs}" y2="${m + rows * cs}"/>`;
  for (let r = 0; r <= rows; r++) grid += `<line x1="${m}" y1="${m + r * cs}" x2="${m + cols * cs}" y2="${m + r * cs}"/>`;
  g += `<g stroke="#b5b5b5" stroke-width="0.8">${grid}</g>`;
  g += `<rect x="${m}" y="${m}" width="${cols * cs}" height="${rows * cs}" fill="none" stroke="#777" stroke-width="1.2"/>`;
  if (item.pts) {
    const lw = Math.max(1.8, cs * 0.13);
    const linie = (sp, farbe) => `<polyline points="${item.pts.map(p => P(p[0], p[1], sp).join(',')).join(' ')}" fill="none" stroke="${farbe}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (isActive) g += linie(true, '#2563eb');
    g += linie(false, '#222');
  }
  // Spiegelachse
  const ax = m + w * cs;
  g += quer
    ? `<line x1="1" y1="${ax}" x2="${W - 1}" y2="${ax}" stroke="#e01b1b" stroke-width="2.6" stroke-linecap="round"/>`
    : `<line x1="${ax}" y1="1" x2="${ax}" y2="${H - 1}" stroke="#e01b1b" stroke-width="2.6" stroke-linecap="round"/>`;
  return { svg: `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}${klick}</svg>`, W };
}

WIDGETS.push({
  meta: { type:'spiegeln', label:'Spiegeln', desc:'Figuren an der Spiegelachse spiegeln', icon:'🪞', category:'mathematik', itemsLayout: true },

  createData: id => {
    const w = { id, type:'spiegeln', art:'felder', achse:'senkrecht', stufe:'mittel', anzahl:3, groesse:'mittel', aufgabenNr:0, aufgabenText:'' };
    spGenerate(w);
    return w;
  },

  render: d => {
    if (!Array.isArray(d.items) || !d.items.length) spGenerate(d);
    const teile = d.items.map((it, i) => spSvg(d, it, i));
    const itemW = teile[0].W;
    return atHtml(d) + flexDistribute(teile.map(t => t.svg), { itemSize: `width:${itemW}px;`, itemW, d });
  },

  renderProps: d => {
    const art = d.art || 'felder', achse = d.achse || 'senkrecht', stufe = spStufe(d), size = d.groesse || 'mittel';
    const btn = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    const set = (cur, val, label, key) => btn(cur === val, label, `spSet(${d.id},'${key}','${val}')`);
    const zeile = (label, inhalt) => `<div class="prow"><label>${label}</label><div style="display:flex;gap:4px;">${inhalt}</div></div>`;
    return zeile('Figur', set(art,'felder','Kästchen','art') + set(art,'linien','Linien','art'))
      + zeile('Spiegelachse', set(achse,'senkrecht','Senkrecht','achse') + set(achse,'waagerecht','Waagerecht','achse'))
      + zeile('Schwierigkeit', set(stufe,'leicht','Leicht','stufe') + set(stufe,'mittel','Mittel','stufe') + set(stufe,'schwer','Schwer','stufe'))
      + pr('Anzahl Aufgaben (1–12)', `<input type="number" min="1" max="12" value="${(d.items || []).length || d.anzahl || 3}" onchange="spSet(${d.id},'anzahl',Math.max(1,Math.min(12,+this.value||1)))">`)
      + `<button onclick="event.stopPropagation();spWuerfeln(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`
      + (art === 'felder' ? `<div style="font-size:11px;color:#aaa;margin-bottom:6px;">Klick auf ein Kästchen der vorgegebenen Seite malt es aus bzw. leert es.</div>` : '')
      + zeile('Größe', set(size,'klein','Klein','groesse') + set(size,'mittel','Mittel','groesse') + set(size,'gross','Groß','groesse'));
  },
});

// Figur/Schwierigkeit ändern → alles neu erzeugen; Anzahl ändern → vorhandene Aufgaben behalten;
// Achse/Größe ändern → dieselben Figuren, nur anders gezeichnet.
// Ändert sich dabei, wie viele Aufgaben in eine Zeile passen (Schwierigkeit, Achse, Größe),
// wird die Anzahl auf volle Zeilen angepasst (gleich viele Zeilen wie vorher) — sonst bliebe
// z. B. eine einzelne Aufgabe in der zweiten Zeile übrig.
function spSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const nAlt = (w.items || []).length || w.anzahl || 3, proAlt = spProZeile(w);
  w[key] = val;
  let n = key === 'anzahl' ? val : nAlt;
  if (['stufe', 'achse', 'groesse'].includes(key)) {
    const pro = spProZeile(w);
    if (pro !== proAlt) n = Math.max(1, Math.min(12, Math.ceil(nAlt / proAlt) * pro));
  }
  w.anzahl = n;
  if (key === 'art' || key === 'stufe') spGenerate(w);
  else { const alt = Array.isArray(w.items) ? w.items : []; w.items = Array.from({ length: n }, (_, k) => alt[k] || spGenOne(w)); }
  render(); renderProps(id);
}
function spWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  spGenerate(w);
  render(); renderProps(id);
}
// Kästchen der vorgegebenen Seite an/aus (Klick im Blatt)
function spToggle(id, idx, a, b) {
  const w = widgets.find(x => x.id === id); if (!w || !w.items || !w.items[idx] || !w.items[idx].cells) return;
  saveHistory();
  const cells = w.items[idx].cells, i = cells.findIndex(c => c[0] === a && c[1] === b);
  if (i >= 0) cells.splice(i, 1); else cells.push([a, b]);
  if (typeof patchWidget !== 'function' || !patchWidget(id)) render();
}
