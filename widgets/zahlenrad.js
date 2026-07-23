// Widget: Zahlenrad
// Ein Rad mit n Segmenten. Drei Ebenen je Segment:
//   Mitte (konstant)  = ERGEBNIS
//   Innenring + Außenring = die beiden Operanden der Aufgabe.
// Verknüpfung (Mitte = Ergebnis):  Außen ⊙ Innen = Mitte
//   +:  innen + außen = mitte      (außen = mitte − innen)
//   −:  außen − innen = mitte      (außen = mitte + innen)
//   ×:  innen × außen = mitte      (Faktorpaare von mitte)
//   ÷:  außen ÷ innen = mitte      (außen = mitte × innen)
// Entweder der Innen- ODER der Außenring ist leer (zum Ausfüllen),
// oder im Modus "gemischt" segmentweise abwechselnd innen/außen.
// Im Lösungs-/Auswahlmodus werden die leeren Felder blau eingeblendet.

function zrRand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function zrShuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

// Kein Zehnerübergang (analog arithmetic.js noCarry)
function zrNoCarry(a, b, op) {
  let aa = a, bb = b;
  if (op === '+') { while (aa > 0 || bb > 0) { if ((aa % 10) + (bb % 10) >= 10) return false; aa = Math.floor(aa / 10); bb = Math.floor(bb / 10); } return true; }
  if (op === '-') { while (aa > 0 || bb > 0) { if ((aa % 10) < (bb % 10)) return false; aa = Math.floor(aa / 10); bb = Math.floor(bb / 10); } return true; }
  return true;
}

// Alle gültigen Operandenpaare (innen/außen) für eine GEGEBENE Mitte: außen ⊙ innen = center
function zrPairsForCenter(op, zr, center, ue) {
  const pairs = [];
  if (op === '+') {
    for (let i = 0; i <= center; i++) { const innen = i, aussen = center - i; if (aussen < 0) continue; if (!ue && !zrNoCarry(aussen, innen, '+')) continue; pairs.push({ innen, aussen }); }
  } else if (op === '-') {
    const maxInn = zr - center;
    for (let i = 0; i <= maxInn; i++) { const innen = i, aussen = center + i; if (aussen > zr) break; if (!ue && !zrNoCarry(aussen, innen, '-')) continue; pairs.push({ innen, aussen }); }
  } else if (op === '*') {
    for (let d = 1; d <= center; d++) if (center % d === 0) pairs.push({ innen: d, aussen: center / d });
  } else { // '/'
    const maxInn = Math.floor(zr / Math.max(1, center));
    for (let i = 1; i <= maxInn; i++) pairs.push({ innen: i, aussen: center * i });
  }
  return pairs;
}

// Zufällige Mitte je Rechenart (wenn keine Mitte vorgegeben ist).
function zrChooseCenter(op, zr, n) {
  if (op === '+') { const lo = Math.max(1, Math.min(n - 1, zr - 1)); return zrRand(lo, zr); }
  if (op === '-') { return zrRand(1, Math.max(1, Math.floor(zr / 2))); }
  if (op === '*') {
    let best = null;
    for (let t = 0; t < 14; t++) { const c = zrRand(2, zr); const divs = []; for (let d = 1; d <= c; d++) if (c % d === 0) divs.push(d); if (!best || divs.length > best.divs.length) best = { c, divs }; if (best.divs.length >= Math.min(n, 8)) break; }
    return best.c;
  }
  return zrRand(2, Math.max(2, Math.floor(zr / Math.max(2, n)))); // '/'
}

// Erzeugt ein Rad: { op, center, segs:[{innen,aussen}] }  mit  außen ⊙ innen = center.
// forcedCenter (optional) = manuell vorgegebene Mitte.
function zrMakeWheel(op, zr, n, ue, forcedCenter) {
  const center = (forcedCenter != null) ? forcedCenter : zrChooseCenter(op, zr, n);
  let pairs = zrPairsForCenter(op, zr, center, ue);
  // Rückfall (z.B. vorgegebene Mitte > Zahlenraum): op-abhängig gültig halten.
  if (!pairs.length) pairs = (op === '*' || op === '/') ? [{ innen: 1, aussen: center }] : [{ innen: 0, aussen: center }];
  pairs = zrShuffle(pairs);
  const segs = [];
  for (let i = 0; i < n; i++) segs.push(pairs[i % pairs.length]); // zyklisch auffüllen, falls zu wenige
  return { op, center, segs };
}

function zrDoGenerate(w) {
  const op  = w.op || '/';
  const zr  = w.zahlenraum || 100;
  const ue  = w.ueberschreitung || false;
  const anz = Math.max(1, w.anzahl || 2);
  // Manuell vorgegebene Mittelzahlen (eine je Rad, in Reihenfolge); leer = zufällig.
  const centers = (w.centerList || '').split(',').map(s => parseInt(s.trim(), 10)).filter(v => Number.isFinite(v) && v >= 1);

  if (op === '1x1') {
    // Einmaleins: Mittelzahlen = die 1×1-Reihen aus der Liste (in Reihenfolge, fest,
    // ein Rad je Eintrag). Pro Würfeln werden nur die Ringe neu gewürfelt:
    // Innenring = zufällige Multiplikatoren (≤10, Produkt ≤ Zahlenraum), Außen = Mitte×Innen.
    const cs = centers.length ? centers : [2, 5, 10];
    const n = Math.max(1, Math.min(12, w.segmente || 8));
    w.wheels = cs.map(center => {
      const maxMult = Math.max(1, Math.min(10, Math.floor(zr / center)));
      const pool = [];
      for (let v = 1; v <= maxMult; v++) pool.push(v);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const mult = pool.slice(0, Math.min(n, pool.length));
      const segs = mult.map(m => ({ innen: m, aussen: center * m }));
      return { op: '1x1', center, segs };
    });
    return;
  }

  const n = Math.max(3, Math.min(12, w.segmente || 8));
  // Vorgegebene Mittelzahlen → ein Rad je Zahl (fest); sonst zufällige Mitten × Anzahl.
  w.wheels = centers.length
    ? centers.map(c => zrMakeWheel(op, zr, n, ue, c))
    : Array.from({ length: anz }, () => zrMakeWheel(op, zr, n, ue));
}

// Zeichnet ein Rad als SVG.
function zrWheelSvg(wh, d) {
  const big   = (d.groesse || 'gross') !== 'klein';
  const blank = d.blank || 'innen';
  const isActive = d.id === selId || _solutionsMode;

  const S = big ? 162 : 140;
  const cx = S / 2, cy = S / 2;
  const r0 = big ? 18 : 16;   // Mittelkreis (kleiner → mehr Platz für Innenring)
  const r1 = big ? 51 : 45;   // Grenze Innen/Außen
  const r2 = big ? 77 : 66;   // Außenrand
  const rInn = (r0 + r1) / 2, rAus = (r1 + r2) / 2;
  const fsC = big ? 18 : 15, fsR = big ? 16 : 13;
  const n = wh.segs.length, step = 2 * Math.PI / n, start = -Math.PI / 2;
  const ff = "'DidactGothic7',sans-serif";

  let g = '';
  // Ringe
  [r2, r1].forEach(r => { g += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="1.5"/>`; });
  // Trennlinien (von r0 bis r2)
  for (let i = 0; i < n; i++) {
    const a = start + i * step;
    const x1 = cx + r0 * Math.cos(a), y1 = cy + r0 * Math.sin(a);
    const x2 = cx + r2 * Math.cos(a), y2 = cy + r2 * Math.sin(a);
    g += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#333" stroke-width="1.1"/>`;
  }
  // Mittelkreis (über Linien) + Ergebniszahl
  g += `<circle cx="${cx}" cy="${cy}" r="${r0}" fill="#fff" stroke="#333" stroke-width="1.5"/>`;
  g += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${fsC}" font-weight="700">${wh.center}</text>`;
  // Segmentzahlen
  for (let i = 0; i < n; i++) {
    const ac = start + (i + 0.5) * step;
    const seg = wh.segs[i];
    const blankInnen = blank === 'innen' || (blank === 'gemischt' && i % 2 === 0);
    const blankAussen = blank === 'aussen' || (blank === 'gemischt' && i % 2 === 1);
    const put = (r, val, isBlankRing) => {
      if (isBlankRing && !isActive) return ''; // leeres Feld
      const x = cx + r * Math.cos(ac), y = cy + r * Math.sin(ac);
      const col = isBlankRing ? '#2563eb' : '#222';
      const fw  = isBlankRing ? '700' : '400';
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${fsR}" font-weight="${fw}" fill="${col}">${val}</text>`;
    };
    g += put(rInn, seg.innen, blankInnen);
    g += put(rAus, seg.aussen, blankAussen);
  }
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${g}</svg>`;
}

WIDGETS.push({
  meta: { type:'zahlenrad', group:'rechenformate', label:'Zahlenrad', desc:'Rechenrad mit Innen-/Außenring', icon:'☸', category:'mathematik', itemsLayout: true },

  createData: id => {
    const w = {
      id, type:'zahlenrad',
      op:'/', zahlenraum:100, ueberschreitung:false,
      segmente:8, groesse:'gross', blank:'innen', anzahl:2,
      centerList:'2,5,10',
      aufgabenNr:0, aufgabenText:'',
    };
    zrDoGenerate(w);
    return w;
  },

  render: d => {
    const wheels = d.wheels || [];
    const big = (d.groesse || 'gross') !== 'klein';
    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Räder haben feste
    // Breite dia → alle gleich breit.
    const dia = big ? 162 : 140;
    return atHtml(d) + flexDistribute(
      wheels.map(wh => zrWheelSvg(wh, d)),
      { itemSize: `width:${dia}px;`, itemW: dia, d }
    );
  },

  renderProps: d => {
    const op    = d.op || '/';
    const zr    = d.zahlenraum || 100;
    const ue    = d.ueberschreitung || false;
    const segs  = d.segmente || 8;
    const size  = d.groesse || 'gross';
    const blank = d.blank || 'innen';
    const anz   = d.anzahl || 2;
    const cl    = d.centerList != null ? d.centerList : '2,5,10';
    const is1x1 = op === '1x1';
    const hasCenters = !!(cl && cl.trim());

    const opBtn = (val, label) => {
      const active = op === val;
      return `<button onclick="event.stopPropagation();zrSet(${d.id},'op','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:14px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    };
    const tgl = (cur, val, label, key) => {
      const active = cur === val;
      return `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    };

    return `
      <div class="prow"><label>Rechenart</label>
        <div style="display:flex;gap:4px;">
          ${opBtn('+','+')}${opBtn('-','−')}${opBtn('*','·')}${opBtn('/','÷')}${opBtn('1x1','1×1')}
        </div>
      </div>` +
      pr('Zahlenraum (Ergebnis)',
        `<select onchange="zrSet(${d.id},'zahlenraum',+this.value)">
          ${[10,20,100,1000].map(n=>`<option value="${n}" ${zr===n?'selected':''}>${n}</option>`).join('')}
        </select>`) +
      ((op === '+' || op === '-')
        ? `<div class="prow"><label>Zehnerübergang</label>
        <label style="display:flex;align-items:center;gap:5px;font-weight:400;cursor:pointer;">
          <input type="checkbox" ${ue?'checked':''} onchange="zrSet(${d.id},'ueberschreitung',this.checked)">
          erlaubt
        </label>
      </div>`
        : '') +
      pr(is1x1
          ? 'Mittelzahlen (1×1-Reihen, kommagetrennt – ein Rad je Zahl)'
          : 'Mittelzahlen (Ergebnis je Rad, kommagetrennt – leer = zufällig)',
        `<input value="${esc(cl)}" onchange="zrSet(${d.id},'centerList',this.value)">`) +
      pr('Segmente' + (is1x1 ? ' (Multiplikatoren je Rad)' : ''),
        `<input type="number" min="1" max="12" value="${segs}" onchange="zrSet(${d.id},'segmente',+this.value)">`) +
      `<div class="prow"><label>Leerer Ring (zum Ausfüllen)</label>
        <div style="display:flex;gap:4px;">
          ${tgl(blank,'innen','Innenring','blank')}
          ${tgl(blank,'aussen','Außenring','blank')}
          ${tgl(blank,'gemischt','Gemischt','blank')}
        </div>
      </div>
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${tgl(size,'klein','Klein','groesse')}
          ${tgl(size,'gross','Groß','groesse')}
        </div>
      </div>` +
      (hasCenters ? '' : pr('Anzahl Räder',
        `<input type="number" min="1" max="24" value="${anz}" onchange="zrSet(${d.id},'anzahl',+this.value)">`)) +
      `<button onclick="event.stopPropagation();zrGenerate(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
// Strukturelle Änderung → neu generieren.
function zrSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  // Beim Wechsel ins 1×1 sinnvoller Standard: Produkte (Außenring) ausfüllen.
  if (key === 'op' && val === '1x1') w.blank = 'aussen';
  zrDoGenerate(w);
  render(); renderProps(id);
}

function zrGenerate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  zrDoGenerate(w);
  render(); renderProps(id);
}
