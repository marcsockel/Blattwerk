// Widget: Hunderterfeld (Punkte- oder Kästchenfeld bis 100)
// 10×10 Zellen, wahlweise Punkte oder Kästchen. Jedes Feld = eine Zufallsaufgabe.
// Modi: Nur Feld · Zahl schreiben · Plus (+Ergänzung) · Minus (+Ergänzung)
//   (Struktur angelehnt an arithmetic.js: Ergänzung mit Lücke 1./2./Zufall).
// Darstellung der Mengen: Punkte grau (Farbe: rot), Kästchen dunkelgrau (Farbe: braun).
// Aufgabenteil (zweiter Operand / Subtrahend): Punkte schwarz (Farbe: blau),
//   Kästchen durchgestrichen (weißes X) — wie Zwanzigerfeld bei Minus.
// Antwort/Lücke: im Auswahl-/Lösungsmodus blau eingeblendet.

function hfRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
// Zahl mit Zehner UND Einer (Zehner 1..maxTens, Einer 1..9) → nie z.B. „1" oder „70".
function hfRandTO(maxTens) { return hfRand(1, maxTens) * 10 + hfRand(1, 9); }

// Eine Zufallsaufgabe je nach Modus erzeugen.
// Beide Zahlen haben immer Zehner + Einer. ueberschreitung steuert, ob die Einer
// zusammen über 9 gehen dürfen (Plus: Übertrag; Minus: Entleihen).
function hfGenItem(w) {
  const modus = w.modus || 'feld';
  if (modus === 'feld' || modus === 'zahl') return { typ: modus, n: hfRand(1, 99) };
  // ueberschreitung: 'ohne' | 'gemischt' | 'nur' (Legacy: false→ohne, true→gemischt)
  const u = w.ueberschreitung;
  const ueMode = u === true ? 'gemischt' : (u === false || u == null) ? 'ohne' : u;
  let a, b, t = 0, ok = false;
  if (modus === 'plus') {
    while (!ok && t++ < 500) {
      a = hfRandTO(8); b = hfRandTO(8);
      if (a + b > 100) continue;
      const cs = (a % 10) + (b % 10);
      ok = ueMode === 'ohne' ? cs <= 9 : ueMode === 'nur' ? cs > 9 : true;
    }
    if (!ok) { if (ueMode === 'nur') { a = 27; b = 45; } else { a = 23; b = 34; } }
  } else {
    while (!ok && t++ < 500) {
      a = hfRandTO(9); b = hfRandTO(9);
      if (b >= a) continue;
      const borrow = (a % 10) < (b % 10);
      ok = ueMode === 'ohne' ? !borrow : ueMode === 'nur' ? borrow : true;
    }
    if (!ok) { if (ueMode === 'nur') { a = 53; b = 28; } else { a = 87; b = 34; } }
  }
  const result = modus === 'plus' ? a + b : a - b;
  const fmt = w.format || (w.ergaenzung ? 'luecke' : 'ergebnis');  // Altdaten: ergaenzung→luecke
  let blank = null;
  if (fmt === 'luecke') {
    const l = w.luecke || 'erste';
    blank = l === 'erste' ? 'a' : l === 'zweite' ? 'b' : (Math.random() < 0.5 ? 'a' : 'b');
  }
  return { typ: modus, a, b, result, blank };
}

function hfGenAll(w) {
  const anz = Math.max(1, Math.min(24, w.anzahl || 1));
  return Array.from({ length: anz }, () => hfGenItem(w));
}

// Items ⇄ Text (für „Manuell bearbeiten"): eine Zahl bzw. Aufgabe pro Zeile.
function hfSerialize(items) {
  return (items || []).map(it => {
    if (it.typ === 'plus')  return `${it.a} + ${it.b}`;
    if (it.typ === 'minus') return `${it.a} - ${it.b}`;
    return `${it.n}`;
  }).join('\n');
}

function hfParse(text, w) {
  const modus = w.modus || 'feld';
  const items = [];
  (text || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    if (modus === 'feld' || modus === 'zahl') {
      const n = parseInt(line, 10);
      if (Number.isFinite(n)) items.push({ typ: modus, n: Math.max(0, Math.min(100, n)) });
      return;
    }
    const m = line.replace(/[–—]/g, '-').match(/^(\d+)\s*([+\-])\s*(\d+)$/);
    if (!m) return;
    const a = +m[1], b = +m[3], typ = m[2] === '+' ? 'plus' : 'minus';
    const result = typ === 'plus' ? a + b : a - b;
    let blank = null;
    if (w.ergaenzung) { const l = w.luecke || 'erste'; blank = l === 'erste' ? 'a' : l === 'zweite' ? 'b' : (Math.random() < 0.5 ? 'a' : 'b'); }
    items.push({ typ, a, b, result, blank });
  });
  return items;
}

function hfEnsure(w) {
  const anz = Math.max(1, Math.min(24, w.anzahl || 1));
  if (!Array.isArray(w.items)) w.items = [];
  while (w.items.length < anz) w.items.push(hfGenItem(w));
  if (w.items.length > anz) w.items = w.items.slice(0, anz);
}

// Wie viele Zellen Basis (Menge/Ergebnis) und wie viele Aufgabenteil (op).
function hfCounts(item) {
  if (item.typ === 'plus')  return { base: item.a,      op: item.b };
  if (item.typ === 'minus') return { base: item.result, op: item.b };
  return { base: item.n || 0, op: 0 };
}

// Füllfarbe der Basis-Menge.
function hfFill(d) {
  const farbig = d.farbe === 'farbig';
  if (d.darstellung === 'kaestchen') return farbig ? '#8a5a2b' : '#4a4a4a'; // braun / dunkelgrau
  return farbig ? '#d62828' : '#7a7a7a';                                     // rot / grau
}

function hfDims(d) {
  const big = (d.groesse || 'gross') !== 'klein';
  const square = d.darstellung === 'kaestchen';
  const g = square ? 0 : (big ? 11 : 7);   // 5er-Lücke nur bei Punkten
  if (square) {
    const cs = big ? 20 : 14, m = 2;
    return { big, square, g, cs, m, W: 2 * m + 10 * cs + g };
  }
  const s = big ? 22 : 15, r = big ? 7 : 5, m = 3;
  return { big, square, g, s, r, m, W: 2 * m + 2 * r + 9 * s + g };
}

function hfSvg(base, op, d) {
  const D = hfDims(d);
  const baseFill = hfFill(d);
  const farbig = d.farbe === 'farbig';
  const opPt = farbig ? '#2563eb' : '#111111'; // Aufgabenteil (Punkte): blau / schwarz
  const opSq = farbig ? '#c8a06e' : '#a8a8a8'; // Aufgabenteil (Kästchen): helleres Braun / helleres Grau
  let cells = '';
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const i = row * 10 + col;
      const isBase = i < base, isOp = i >= base && i < base + op;
      if (D.square) {
        const x = D.m + col * D.cs + (col >= 5 ? D.g : 0);
        const y = D.m + row * D.cs + (row >= 5 ? D.g : 0);
        // Gitterzelle (immer)
        cells += `<rect x="${x}" y="${y}" width="${D.cs}" height="${D.cs}" fill="#ffffff" stroke="#888" stroke-width="1.2"/>`;
        // Füllung leicht eingerückt → 1–2px Abstand zwischen Farbe und Gitter.
        // Aufgabenteil = hellere Farbe (statt durchgestrichen).
        if (isBase || isOp) {
          const pad = 2;
          const ix = x + pad, iy = y + pad, ic = D.cs - 2 * pad;
          cells += `<rect x="${ix}" y="${iy}" width="${ic}" height="${ic}" fill="${isOp ? opSq : baseFill}" rx="1.5"/>`;
        }
      } else {
        const cx = D.m + D.r + col * D.s + (col >= 5 ? D.g : 0);
        const cy = D.m + D.r + row * D.s + (row >= 5 ? D.g : 0);
        const fill = isBase ? baseFill : isOp ? opPt : '#ffffff';
        const stroke = isBase ? baseFill : isOp ? opPt : '#888';
        cells += `<circle cx="${cx}" cy="${cy}" r="${D.r}" fill="${fill}" stroke="${stroke}" stroke-width="${(isBase || isOp) ? 1 : 1.4}"/>`;
      }
    }
  }
  return `<svg viewBox="0 0 ${D.W} ${D.W}" width="${D.W}" height="${D.W}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${cells}</svg>`;
}

// Gestapelte Plus-Ansicht: nur a Zellen (1. Summand), eine freie Zeile, dann b
// Zellen (2. Summand) — beide gleich (Basisfarbe), keine leeren „Lehrer"-Zellen.
// Maße der gestapelten Ansicht (auch für einheitliche Höhe → Gleichung auf gleicher Höhe).
function hfStackDims(a, b, d) {
  const D = hfDims(d);
  const step = D.square ? D.cs : D.s;
  const onesGap = Math.max(4, Math.round(step * 0.4)); // Einer von den Zehnern abrücken
  const blk = N => {
    const rows = Math.max(1, Math.ceil(N / 10));
    const full = Math.floor(N / 10);
    const hasGap = (N % 10 > 0) && full >= 1;          // Einer abrücken nur wenn Zehner darüber
    return { rows, full, hasGap, height: rows * step + (hasGap ? onesGap : 0) };
  };
  const A = blk(a), B = blk(b);
  return { D, step, onesGap, A, B, W: D.W, H: 2 * D.m + A.height + step + B.height };
}

function hfStackSvg(a, b, d) {
  const { D, step, onesGap, A, B, W, H } = hfStackDims(a, b, d);
  const baseFill = hfFill(d);
  const baseTopB = A.height + step;                  // eine freie Zeile zwischen den Summanden
  let cells = '';
  // y-Offset einer Zelle innerhalb eines Blocks (mit Einer-Abstand).
  const cellY = (i, info, top) => {
    const r = Math.floor(i / 10);
    return top + r * step + (info.hasGap && r === info.full ? onesGap : 0);
  };
  const draw = (i, y0) => {
    const col = i % 10;
    if (D.square) {
      const x = D.m + col * D.cs + (col >= 5 ? D.g : 0), y = D.m + y0;
      cells += `<rect x="${x}" y="${y}" width="${D.cs}" height="${D.cs}" fill="#ffffff" stroke="#888" stroke-width="1.2"/>`;
      const pad = 2, ix = x + pad, iy = y + pad, ic = D.cs - 2 * pad;
      cells += `<rect x="${ix}" y="${iy}" width="${ic}" height="${ic}" fill="${baseFill}" rx="1.5"/>`;
    } else {
      const cx = D.m + D.r + col * D.s + (col >= 5 ? D.g : 0), cy = D.m + D.r + y0;
      cells += `<circle cx="${cx}" cy="${cy}" r="${D.r}" fill="${baseFill}" stroke="${baseFill}" stroke-width="1"/>`;
    }
  };
  for (let i = 0; i < a; i++) draw(i, cellY(i, A, 0));
  for (let i = 0; i < b; i++) draw(i, cellY(i, B, baseTopB));
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;">${cells}</svg>`;
}

// Aufgabenzeile (Gleichung / Antwortkästchen) unter dem Feld.
function hfLabel(item, d) {
  if (item.typ === 'feld') return '';
  const isActive = d.id === selId || _solutionsMode;
  const big = (d.groesse || 'gross') !== 'klein';
  const bs = big ? 32 : 24, fs = big ? 18 : 15;
  const bw = Math.round(bs * 1.5); // halbe Breite mehr → Platz für zweistellige Zahlen
  const box = v => `<span style="display:inline-flex;align-items:center;justify-content:center;width:${bw}px;height:${bs}px;
      border:2px solid #555;border-radius:4px;font-family:'DidactGothic7',sans-serif;font-size:${fs}px;
      font-weight:700;color:#2563eb;">${isActive ? v : ''}</span>`;
  if (item.typ === 'zahl') return `<div style="text-align:center;margin-top:6px;">${box(item.n)}</div>`;
  const sym = item.typ === 'plus' ? '+' : '−';
  const num = v => `<span>${v}</span>`;
  const fmt = d.format || (d.ergaenzung ? 'luecke' : 'ergebnis');
  let aS, bS, rS;
  if (fmt === 'alle') {              // ▢ + ▢ = ▢ (alle selbst eintragen)
    aS = box(item.a); bS = box(item.b); rS = box(item.result);
  } else if (fmt === 'luecke') {     // ein Operand als Lücke, Ergebnis vorgegeben
    aS = item.blank === 'a' ? box(item.a) : num(item.a);
    bS = item.blank === 'b' ? box(item.b) : num(item.b);
    rS = num(item.result);
  } else {                           // 'ergebnis': a + b = ▢
    aS = num(item.a); bS = num(item.b); rS = box(item.result);
  }
  return `<div style="margin-top:6px;font-family:'DidactGothic7',sans-serif;font-size:${fs}px;
      display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;">
      ${aS}<span>${sym}</span>${bS}<span>=</span>${rS}</div>`;
}

WIDGETS.push({
  meta: { type:'hunderterfeld', label:'Hunderterfeld', desc:'Punkte-/Kästchenfeld bis 100', icon:'⣿', category:'mathematik' },

  createData: id => {
    const w = {
      id, type:'hunderterfeld',
      modus:'feld', format:'ergebnis', luecke:'erste', ueberschreitung:'ohne', plusStapel:false,
      anzahl:4, darstellung:'punkte', farbe:'sw', groesse:'klein',
      aufgabenNr:0, aufgabenText:'',
    };
    w.items = hfGenAll(w);
    w.tasks = hfSerialize(w.items);
    return w;
  },

  render: d => {
    const anz = Math.max(1, Math.min(24, d.anzahl || 1));
    if (!Array.isArray(d.items) || d.items.length !== anz) { hfEnsure(d); d.tasks = hfSerialize(d.items); }
    const D = hfDims(d);
    // Gestapelte Plus-Ansicht: einheitliche SVG-Höhe → Gleichung darunter auf gleicher Höhe.
    const stapel = d.plusStapel;
    let maxH = 0;
    if (stapel) d.items.forEach(it => { if (it.typ === 'plus') maxH = Math.max(maxH, hfStackDims(it.a, it.b, d).H); });
    const cells = d.items.map(item => {
      const c = hfCounts(item);
      let svgBlock;
      if (item.typ === 'plus' && stapel) {
        svgBlock = `<div style="height:${maxH}px;display:flex;align-items:flex-start;justify-content:center;">${hfStackSvg(item.a, item.b, d)}</div>`;
      } else {
        svgBlock = hfSvg(c.base, c.op, d);
      }
      return `${svgBlock}${hfLabel(item, d)}`;
    });
    // Einheitliches Verteilungs-Layout (flexDistribute in helpers.js). Feste Feldbreite D.W.
    return atHtml(d) + flexDistribute(cells, { gap: 22, marginBottom: 26, itemSize: `width:${D.W}px;`, itemW: D.W, d });
  },

  renderProps: d => {
    const modus = d.modus || 'feld';
    const size  = d.groesse || 'gross';
    const dar   = d.darstellung || 'punkte';
    const far   = d.farbe || 'sw';
    const luecke = d.luecke || 'erste';
    const fmt    = d.format || (d.ergaenzung ? 'luecke' : 'ergebnis');
    const ueMode = d.ueberschreitung === true ? 'gemischt'
                 : (d.ueberschreitung === false || d.ueberschreitung == null) ? 'ohne'
                 : d.ueberschreitung;
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();hfSet(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    // Darstellung/Farbe/Größe ändern nicht die Aufgaben → upd (kein Neu-Würfeln)
    const vtgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    const istRechnen = modus === 'plus' || modus === 'minus';
    return `<div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${tgl(modus,'feld','Nur Feld','modus')}
          ${tgl(modus,'zahl','Zahl schreiben','modus')}
          ${tgl(modus,'plus','Plus','modus')}
          ${tgl(modus,'minus','Minus','modus')}
        </div></div>` +
      (istRechnen ? `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${tgl(ueMode,'ohne','Ohne','ueberschreitung')}
          ${tgl(ueMode,'gemischt','Gemischt','ueberschreitung')}
          ${tgl(ueMode,'nur','Nur mit','ueberschreitung')}
        </div></div>` : '') +
      (istRechnen ? `<div class="prow"><label>Aufgaben-Format</label>
        <div style="display:flex;gap:4px;">
          ${tgl(fmt,'ergebnis','Ergebnis','format')}
          ${tgl(fmt,'luecke','Lücke','format')}
          ${tgl(fmt,'alle','Alle','format')}
        </div>
        <div style="font-size:10px;color:#aaa;margin-top:3px;">Ergebnis: a+b=▢ · Lücke: ein Operand fehlt · Alle: ▢+▢=▢</div>
      </div>` : '') +
      (istRechnen && fmt === 'luecke' ? `<div class="prow"><label>Lücke</label>
        <div style="display:flex;gap:4px;">
          ${tgl(luecke,'erste','1. Zahl','luecke')}
          ${tgl(luecke,'zweite','2. Zahl','luecke')}
          ${tgl(luecke,'zufall','Zufall','luecke')}
        </div></div>` : '') +
      (modus === 'plus' ? `<div class="prow"><label>Plus-Ansicht</label>
        <div style="display:flex;gap:4px;">
          <button onclick="event.stopPropagation();upd(${d.id},'plusStapel',false)"
            style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${!d.plusStapel?'#89b4fa':'#ddd'};
                   background:${!d.plusStapel?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
                   font-weight:700;cursor:pointer;color:${!d.plusStapel?'#1e1e2e':'#999'};">Standard</button>
          <button onclick="event.stopPropagation();upd(${d.id},'plusStapel',true)"
            style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${d.plusStapel?'#89b4fa':'#ddd'};
                   background:${d.plusStapel?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
                   font-weight:700;cursor:pointer;color:${d.plusStapel?'#1e1e2e':'#999'};">Gestapelt (Summanden)</button>
        </div></div>` : '') +
      pr('Anzahl Hunderterfelder',
        `<input type="number" min="1" max="24" value="${d.anzahl||1}" onchange="hfSet(${d.id},'anzahl',+this.value)">`) +
      `<button onclick="event.stopPropagation();hfRoll(${d.id})"
        style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
      pr(`Manuell bearbeiten ${modus==='plus'?'(z.B. 23 + 34)':modus==='minus'?'(z.B. 87 - 34)':'(eine Zahl pro Zeile)'}`,
        `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;box-sizing:border-box;" onchange="hfEditTasks(${d.id},this.value)">${esc(d.tasks||'')}</textarea>`) +
      `<div class="prow"><label>Darstellung</label>
        <div style="display:flex;gap:4px;">${vtgl(dar,'punkte','Punkte','darstellung')}${vtgl(dar,'kaestchen','Kästchen','darstellung')}</div>
      </div>
      <div class="prow"><label>Farbe</label>
        <div style="display:flex;gap:4px;">${vtgl(far,'sw','S/W','farbe')}${vtgl(far,'farbig','Farbig','farbe')}</div>
      </div>
      <div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">${vtgl(size,'klein','Klein','groesse')}${vtgl(size,'gross','Groß','groesse')}</div>
      </div>`;
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function hfRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.items = hfGenAll(w);
  w.tasks = hfSerialize(w.items);
  render(); renderProps(id);
}

// Strukturelle Änderung: anzahl behält bestehende Aufgaben, sonst neu würfeln.
function hfSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  if (key === 'anzahl') hfEnsure(w);
  else w.items = hfGenAll(w);
  w.tasks = hfSerialize(w.items);
  render(); renderProps(id);
}

// Manuelles Bearbeiten: Text → Items (Feldanzahl = Zeilenzahl).
function hfEditTasks(id, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const items = hfParse(value, w);
  w.items = items;
  w.anzahl = Math.max(1, Math.min(24, items.length || 1));
  w.tasks = value;
  render(); renderProps(id);
}
