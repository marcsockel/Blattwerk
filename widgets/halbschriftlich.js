// Widgets: Halbschriftliches Rechnen (Addition + Subtraktion)
// Addition, zwei Methoden:
//  - "schritte": Rechnen in Schritten   124+23= → 124+20=144, 144+3=147
//  - "stellen":  Stelle + Stelle         65+34= →  60+30=90,   5+4=9
// Subtraktion: immer schrittweise       124−23= → 124−20=104, 104−3=101
// Über dem Strich steht die Aufgabe (Ergebnis-Kästchen), unter dem Strich sind
// pro Stelle des 2. Operanden Zeilen vorbereitet: Rechenzeichen vorgedruckt,
// jede leere Stelle = ein Ziffern-Kästchen (unterteilt wie Stellen-Kästchen).
// Option "Hilfen anzeigen": 1. Zeile → Zahl 1+2 ausgefüllt; schrittweise zusätzlich
// in allen Zeilen die 2. Zahl; Stelle+Stelle → nur die 1. Zeile.

// Zahl in Stellenwerte zerlegen, absteigend: 124 → [100, 20, 4]
function haZerlege(n) {
  const parts = [];
  let f = 1;
  while (Math.floor(n / f) > 0) {
    const d = Math.floor(n / f) % 10;
    if (d) parts.push(d * f);
    f *= 10;
  }
  return parts.reverse();
}

// Übertrag/Borgen irgendwo (mit Weiterreichung)? Für die Zehnerübergang-Steuerung.
function haCarry(a, b, op) {
  let aa = a, bb = b, guard = 0;
  if (op === "-") {
    let borrow = 0;
    while (aa > 0 || bb > 0) {
      borrow = (aa % 10 - bb % 10 - borrow) < 0 ? 1 : 0;
      if (borrow) return true;
      aa = Math.floor(aa / 10); bb = Math.floor(bb / 10);
      if (++guard > 8) break;
    }
    return false;
  }
  let carry = 0;
  while (aa > 0 || bb > 0 || carry) {
    carry = (aa % 10 + bb % 10 + carry) >= 10 ? 1 : 0;
    if (carry) return true;
    aa = Math.floor(aa / 10); bb = Math.floor(bb / 10);
    if (++guard > 8) break;
  }
  return false;
}

// Alle Ziffern ≥ 1? (Nullen vermeiden → jede vorbereitete Zeile wird wirklich gebraucht)
function haOhneNull(n) { return !String(n).includes("0"); }

function haOp(w) { return w.type === "halbsub" ? "-" : w.type === "halbmul" ? "·" : w.type === "halbdiv" ? ":" : "+"; }

function haGenAufgabe(op, methode, zr, ueMode) {
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  let tries = 0;
  while (tries++ < 600) {
    let a, b;
    if (op === ":") {
      // Divisor einstellig, Quotient mind. zweistellig, teilt ohne Rest, Dividend ≤ ZR
      const cap = Math.min(zr, 999);
      b = rand(2, 9);
      const qMax = Math.floor(cap / b);
      if (qMax < 11) continue;
      const q = rand(11, qMax);
      a = q * b;
      return [a, b]; // Nullen im Dividend sind hier ok (freies Rechnen, keine festen Zeilen)
    } else if (op === "·") {
      // 1. Faktor einstellig, 2. Faktor zwei- bis dreistellig, Produkt ≤ ZR (max 999)
      const cap = Math.min(zr, 999);
      a = rand(2, 9);
      const bMax = Math.floor(cap / a);
      if (bMax < 11) continue;
      b = rand(11, bMax);
    } else if (op === "-") {
      // Minuend > Subtrahend, Subtrahend mind. zweistellig (sonst nur 1 Schritt)
      a = rand(23, Math.min(zr, 999));
      b = rand(11, a - 1);
    } else if (methode === "stellen") {
      // gleiche Stellenzahl, z.B. 65+34 bzw. 124+235 im 1000er
      const lo = zr > 100 ? 111 : 11;
      const hi = zr > 100 ? 888 : 88;
      a = rand(lo, hi); b = rand(lo, Math.min(hi, zr - a));
      if (b < lo) continue;
      if (String(a).length !== String(b).length) continue;
    } else {
      // Schrittweise: 2. Summand mind. zweistellig (sonst nur 1 Schritt)
      a = rand(11, zr - 11);
      b = rand(11, zr - a);
      if (b < 11) continue;
    }
    if (!haOhneNull(a) || !haOhneNull(b)) continue;
    // Vierstellige Werte (exakt 1000) vermeiden → Spaltenbreite bleibt 3-stellig,
    // drei Aufgaben passen im 1000er nebeneinander.
    if (op === "+" && a + b > 999 && zr > 100) continue;
    if (op !== "·") { // Übergangs-Steuerung nur bei Strichrechnung
      const carry = haCarry(a, b, op);
      if (ueMode === "ohne" && carry) continue;
      if (ueMode === "nur" && !carry) continue;
    }
    return [a, b];
  }
  return op === "·" ? [4, 235] : op === "-" ? [124, 23] : methode === "stellen" ? [65, 34] : [124, 23];
}

function haGen(w) {
  w.aufgaben = Array.from({ length: w.anzahl || 4 },
    () => haGenAufgabe(haOp(w), w.methode || "schritte", w.zahlenraum || 100, w.uebergang || "gemischt"));
}

// Lösungszeilen einer Aufgabe: [{l, r, res}, ...]
function haZeilen(a, b, methode, op) {
  if (op !== "-" && methode === "stellen") {
    const sa = String(a), sb = String(b);
    return sa.split("").map((ch, i) => {
      const f = Math.pow(10, sa.length - 1 - i);
      const l = +ch * f, r = +(sb[i] || 0) * f;
      return { l, r, res: l + r };
    });
  }
  if (op === "·") {
    // 4·235 → 4·200=800, 4·30=120, 4·5=20 (1. Faktor bleibt in jeder Zeile stehen)
    return haZerlege(b).map(part => ({ l: a, r: part, res: a * part }));
  }
  let acc = a;
  return haZerlege(b).map(part => {
    const row = { l: acc, r: part, res: op === "-" ? acc - part : acc + part };
    acc = row.res;
    return row;
  });
}

function haRender(d, op) {
  const isActive = d.id === selId || _solutionsMode;
  const methode  = op !== "+" ? "schritte" : (d.methode || "schritte");
  const hilfe    = !!d.hilfe;
  const stellen  = d.stellen !== false; // Trennstriche in den Kästchen (default an)
  const aufgaben = d.aufgaben || [];
  const opChar   = op === "-" ? "−" : op;
  // Größe: klein = 1x, mittel = 1.3x, groß = 1.6x (wie Rechenaufgaben)
  const S = d.groesse === 'gross' ? 1.6 : d.groesse === 'mittel' ? 1.3 : 1;
  const px = v => Math.round(v * S);
  const FS = px(16), LH = px(20), ROWH = px(28), CW = px(16); // CW = Ziffernzellen-Breite
  // Breiten-Budget (klein, ZR 1000): 3 Spalten à 3×16+4=52px + 2 Zeichen à ~16px = 188px
  // → 3 Aufgaben: 3×188 + 2×24 gap = 612 ≤ 622px verfügbar (10px Luft, alles fixe px).
  const font = `font-family:'DidactGothic7',sans-serif;font-size:${FS}px;`;

  // Widget-weite Spaltenbreiten (in Stellen) → alle Päckchen exakt gleich breit,
  // Einer unter Einern (Ziffern und Kästchen teilen dieselben Zellen).
  // Größter Wert links/im Ergebnis: Addition a+b (Zwischenergebnisse ≤ Summe),
  // Subtraktion a (Zwischenergebnisse ≤ Minuend).
  let lw = op === "·" ? 1 : 2, rw = 2, resw = 2;
  aufgaben.forEach(([a, b]) => {
    // links: '+' Zwischensummen ≤ a+b, '−' ≤ Minuend, '·' immer der 1. Faktor
    const lVal   = op === "·" ? a : op === "-" ? a : a + b;
    const resVal = op === "·" ? a * b : op === "-" ? a : a + b;
    lw   = Math.max(lw,   String(lVal).length);
    rw   = Math.max(rw,   String(b).length);
    resw = Math.max(resw, String(resVal).length);
  });

  // Ziffern in Zellen (zentriert) — deckungsgleich mit den Kästchen-Zellen
  const zif = (v, color) =>
    `<span style="display:inline-block;vertical-align:middle;${font}${color ? `color:${color};font-weight:700;` : ''}">` +
    String(v).split("").map(c => `<span style="display:inline-block;width:${CW}px;text-align:center;">${esc(c)}</span>`).join("") +
    `</span>`;
  // Unterteiltes Kästchen: n Stellen, dazwischen dünner Strich. Mit Wert v → blaue
  // Ziffern IN den Zellen (Lösungsvorschau sieht aus wie das Original, nur gefüllt).
  const boxCells = (n, v) => {
    n = Math.max(1, n);
    const s = v === undefined ? null : String(v);
    return `<span style="display:inline-flex;height:${LH}px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;">` +
    Array.from({length: n}, (_, i) => {
      const ch = s && s.length >= n - i ? esc(s[s.length - n + i]) : '';
      return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${CW}px;height:100%;${i && stellen ? 'border-left:1px solid #999;' : ''}${font}color:#2563eb;font-weight:700;">${ch}</span>`;
    }).join("") +
    `</span>`;
  };
  // Spalten-Slot: feste Breite (n Stellen), Inhalt rechtsbündig → stellengerecht
  const slot = (n, inner) =>
    `<span style="display:inline-block;width:${n * CW + 4}px;text-align:right;vertical-align:middle;">${inner || ''}</span>`;
  const sign = s => `<span style="margin:0 ${px(4)}px;color:#555;${font}">${s}</span>`;

  const items = aufgaben.map(([a, b]) => {
    const zeilen = haZeilen(a, b, methode, op);
    const ergebnis = op === "·" ? a * b : op === "-" ? a - b : a + b;
    // Stellen an → Kästchen mit so vielen Zellen wie die erwartete Zahl Stellen hat;
    // Stellen aus → immer volle Spaltenbreite (alle Kästchen gleich groß)
    const dig = v => String(v).length;
    const boxFor = (v, slotN, filled) => boxCells(stellen ? dig(v) : slotN, filled ? v : undefined);

    const kopf =
      `<div style="display:flex;align-items:center;height:${ROWH}px;">
         ${slot(lw, zif(a))}${sign(opChar)}${slot(rw, zif(b))}${sign('=')}
         ${slot(resw, boxFor(ergebnis, resw, isActive))}
       </div>`;

    const rows = zeilen.map((z, i) => {
      // Hilfen: 1. Zeile → beide Zahlen vorgedruckt. Zusätzlich:
      //  '+' schrittweise / '−' → alle Zeilen die 2. Zahl
      //  '+' Stelle+Stelle      → nur die 1. Zeile
      //  '·'                    → alle Zeilen die 1. Zahl (der Faktor bleibt gleich)
      const hl = hilfe && (op === "·" ? true : i === 0);
      const hr = hilfe && (op === "·" || methode === "stellen" ? i === 0 : true);
      // Vorschau (angewählt): Kästchen bleiben in Original-Optik, nur blau gefüllt;
      // Hilfe-Zahlen bleiben schwarz gedruckt wie im Original.
      const cl = hl ? zif(z.l) : boxFor(z.l, lw, isActive);
      const cr = hr ? zif(z.r) : boxFor(z.r, rw, isActive);
      const cres = boxFor(z.res, resw, isActive);
      return `<div style="display:flex;align-items:center;height:${ROWH}px;">
         ${slot(lw, cl)}${sign(opChar)}${slot(rw, cr)}${sign('=')}${slot(resw, cres)}
       </div>`;
    }).join("");

    // Strich nur unter der tatsächlichen Aufgabe: beginnt an der ersten Ziffer von a
    const strichEinzug = (lw - String(a).length) * CW;
    return `<div style="display:inline-block;">
      ${kopf}
      <div style="height:0;border-top:1.5px solid #333;margin-left:${strichEinzug}px;"></div>
      <div style="padding-top:2px;">${rows}</div>
    </div>`;
  });

  // Echte Itembreite: 3 Slots ((n·CW)+4) + 2 Zeichen (Glyphe ~8·S + 2·4·S Margin)
  const itemW = (lw + rw + resw) * CW + 12 + 2 * (px(8) + 2 * px(4));
  return atHtml(d) + flexDistribute(items, { itemW, d });
}

// Division: Karofeld. Oben die Aufgabe (eine Ziffer/Zeichen pro Kästchen), Strich
// darunter, danach leere Karo-Zeilen — der Schüler wählt seine Schritte selbst.
function haDivRender(d) {
  const isActive = d.id === selId || _solutionsMode;
  const aufgaben = d.aufgaben || [];
  const zeilen   = Math.max(1, d.zeilen || 4);
  const S  = d.groesse === 'gross' ? 1.6 : d.groesse === 'mittel' ? 1.3 : 1;
  const px = v => Math.round(v * S);
  const CS = px(20); // Karo-Kästchengröße
  const FS = px(16);
  const font = `font-family:'DidactGothic7',sans-serif;font-size:${FS}px;`;

  const items = aufgaben.map(([a, b]) => {
    const q = Math.floor(a / b);
    const task = [...String(a), ':', ...String(b), '=' ];
    const qDigits = String(q).split("");
    const strichCols = task.length + qDigits.length; // Strich unter Aufgabe inkl. Ergebnisplatz
    const cols = strichCols;                          // Feld exakt so breit wie die Aufgabe
    const rows = 1 + zeilen;

    let cells = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let ch = "", color = "#333";
        if (r === 0) {
          if (c < task.length) ch = task[c];
          else if (isActive && c < task.length + qDigits.length) { ch = qDigits[c - task.length]; color = "#2563eb"; }
        }
        const strich = r === 0 && c < strichCols;
        cells += `<div style="width:${CS}px;height:${CS}px;box-sizing:border-box;
          border-right:1px solid #e0ddd6;border-bottom:${strich ? '1.5px solid #333' : '1px solid #e0ddd6'};
          display:flex;align-items:center;justify-content:center;${font}font-weight:${color==='#2563eb'?700:500};color:${color};">${esc(ch)}</div>`;
      }
    }
    return `<div style="display:inline-grid;grid-template-columns:repeat(${cols},${CS}px);
      border-left:1px solid #e0ddd6;border-top:1px solid #e0ddd6;">${cells}</div>`;
  });

  // Itembreite grob: (max. Aufgabenlänge + Ergebnis + 2) Kästchen
  let maxCols = 6;
  aufgaben.forEach(([a, b]) => {
    maxCols = Math.max(maxCols, String(a).length + 1 + String(b).length + 1 + String(Math.floor(a / b)).length);
  });
  // gap 16 statt 24: 4 Felder im 100er = 4×141 + 3×16 = 612 ≤ 622px (bei vollen
  // Reihen verteilt space-between ohnehin — gap ist nur Minimum/Umbruchschwelle).
  return atHtml(d) + flexDistribute(items, { itemW: maxCols * CS + 1, d });
}

function haProps(d, op) {
  const zr = d.zahlenraum || 100;
  const ue = d.uebergang || "gemischt";
  const methode = d.methode || "schritte";
  const opChar = op === "-" ? "−" : "+";
  const toggleBtn = (label, active, onclick) =>
    `<button onclick="event.stopPropagation();${onclick}"
      style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
             background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
  return pr("Anzahl Aufgaben",
      `<input type="number" min="1" max="12" value="${d.anzahl||4}" onchange="haSet(${d.id},'anzahl',+this.value)">`) +
    (op === "+" ? `<div class="prow"><label>Methode</label>
      <div style="display:flex;gap:4px;">
        ${toggleBtn("Schrittweise",  methode==="schritte", `haSet(${d.id},'methode','schritte')`)}
        ${toggleBtn("Stelle+Stelle", methode==="stellen",  `haSet(${d.id},'methode','stellen')`)}
      </div>
    </div>` : '') +
    pr("Zahlenraum",
      `<select onchange="haSet(${d.id},'zahlenraum',+this.value)">
        ${[100,1000].map(n=>`<option value="${n}" ${zr===n?"selected":""}>${n}</option>`).join("")}
      </select>`) +
    (op !== "·" && op !== ":" ? `<div class="prow"><label>Zehnerübergang</label>
      <div style="display:flex;gap:4px;">
        ${toggleBtn("Ohne",     ue==='ohne',     `haSet(${d.id},'uebergang','ohne')`)}
        ${toggleBtn("Gemischt", ue==='gemischt', `haSet(${d.id},'uebergang','gemischt')`)}
        ${toggleBtn("Nur mit",  ue==='nur',      `haSet(${d.id},'uebergang','nur')`)}
      </div>
    </div>` : '') +
    `<div class="prow"><label>Größe</label>
      <div style="display:flex;gap:4px;">
        ${toggleBtn("Klein",  (d.groesse||'klein')==='klein', `haOpt(${d.id},'groesse','klein')`)}
        ${toggleBtn("Mittel", d.groesse==='mittel',           `haOpt(${d.id},'groesse','mittel')`)}
        ${toggleBtn("Groß",   d.groesse==='gross',            `haOpt(${d.id},'groesse','gross')`)}
      </div>
    </div>` +
    (op === ":" ? pr("Kästchen-Zeilen darunter",
      `<input type="number" min="1" max="10" value="${d.zeilen||4}" onchange="haOpt(${d.id},'zeilen',+this.value)">`)
    : `<div class="prow"><label>Stellen anzeigen</label>
      <div style="display:flex;gap:4px;">
        ${toggleBtn("Aus", d.stellen===false, `haOpt(${d.id},'stellen',false)`)}
        ${toggleBtn("An",  d.stellen!==false, `haOpt(${d.id},'stellen',true)`)}
      </div>
    </div>` +
    `<div class="prow"><label>Hilfen anzeigen</label>
      <div style="display:flex;gap:4px;">
        ${toggleBtn("Aus", !d.hilfe,  `haOpt(${d.id},'hilfe',false)`)}
        ${toggleBtn("An",  !!d.hilfe, `haOpt(${d.id},'hilfe',true)`)}
      </div>
    </div>`) +
    `<button onclick="event.stopPropagation();haRoll(${d.id})"
      style="margin-top:8px;width:100%;padding:6px;border:none;border-radius:5px;
             background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
             font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>` +
    propFold('ha-manuell', 'Manuelle Bearbeitung',
      pr(`Manuell bearbeiten (je Zeile: 124 ${opChar} 23)`,
        `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;"
          onchange="haManual(${d.id},this.value)">${esc((d.aufgaben||[]).map(([a,b])=>`${a} ${op === "-" ? "-" : op} ${b}`).join("\n"))}</textarea>`),
      false);
}

WIDGETS.push({
  meta: { type:"halbadd", group:"halbschriftlich", label:"Halbschriftlich +", desc:"Halbschriftliche Addition", icon:"🪜", category:"mathematik", itemsLayout: true },
  createData: id => {
    const w = { id, type:"halbadd", anzahl:4, methode:"schritte", zahlenraum:100,
                uebergang:"gemischt", hilfe:false, groesse:"klein", stellen:true,
                aufgabenNr:0, aufgabenText:"Rechne halbschriftlich." };
    haGen(w);
    return w;
  },
  render: d => haRender(d, "+"),
  renderProps: d => haProps(d, "+"),
});

WIDGETS.push({
  meta: { type:"halbmul", group:"halbschriftlich", label:"Halbschriftlich ·", desc:"Halbschriftliche Multiplikation", icon:"🪜", category:"mathematik", itemsLayout: true },
  createData: id => {
    const w = { id, type:"halbmul", anzahl:4, zahlenraum:1000,
                hilfe:false, groesse:"klein", stellen:true,
                aufgabenNr:0, aufgabenText:"Rechne halbschriftlich." };
    haGen(w);
    return w;
  },
  render: d => haRender(d, "·"),
  renderProps: d => haProps(d, "·"),
});

WIDGETS.push({
  meta: { type:"halbdiv", group:"halbschriftlich", label:"Halbschriftlich :", desc:"Halbschriftliche Division (Karofeld)", icon:"🪜", category:"mathematik", itemsLayout: true },
  createData: id => {
    const w = { id, type:"halbdiv", anzahl:3, zahlenraum:100, zeilen:4,
                groesse:"klein", aufgabenNr:0, aufgabenText:"Rechne halbschriftlich in Schritten." };
    haGen(w);
    return w;
  },
  render: d => haDivRender(d),
  renderProps: d => haProps(d, ":"),
});

WIDGETS.push({
  meta: { type:"halbsub", group:"halbschriftlich", label:"Halbschriftlich −", desc:"Halbschriftliche Subtraktion", icon:"🪜", category:"mathematik", itemsLayout: true },
  createData: id => {
    const w = { id, type:"halbsub", anzahl:4, zahlenraum:100,
                uebergang:"gemischt", hilfe:false, groesse:"klein", stellen:true,
                aufgabenNr:0, aufgabenText:"Rechne halbschriftlich." };
    haGen(w);
    return w;
  },
  render: d => haRender(d, "-"),
  renderProps: d => haProps(d, "-"),
});

// ── Halbschriftlich helpers (global) ─────────────────────────────
// haSet: Einstellung ändern, die neue Aufgaben erfordert (Anzahl/Methode/ZR/Übergang)
function haSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  haGen(w);
  render(); renderProps(id);
}

// haOpt: reine Darstellungsoption — Aufgaben NICHT neu würfeln
function haOpt(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  render(); renderProps(id);
}

// Manuelle Eingabe: eine Aufgabe pro Zeile ("124 + 23" bzw. "124 - 23");
// ungültige Zeilen werden ignoriert, bei Minus muss die 1. Zahl größer sein.
function haManual(id, text) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const op = haOp(w);
  const re = op === "-" ? /^\s*(\d+)\s*[-−]\s*(\d+)\s*=?\s*$/
           : op === "·" ? /^\s*(\d+)\s*[·×x*]\s*(\d+)\s*=?\s*$/
           : op === ":" ? /^\s*(\d+)\s*[:÷]\s*(\d+)\s*=?\s*$/
           : /^\s*(\d+)\s*\+\s*(\d+)\s*=?\s*$/;
  const aufgaben = String(text).split("\n")
    .map(line => line.match(re))
    .filter(Boolean)
    .map(m => [+m[1], +m[2]])
    .filter(([a, b]) => op === "-" ? a > b : op === ":" ? (b > 0 && a % b === 0) : true);
  if (!aufgaben.length) return;
  saveHistory();
  w.aufgaben = aufgaben;
  w.anzahl = aufgaben.length;
  render(); renderProps(id);
}

function haRoll(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  haGen(w);
  render(); renderProps(id);
}
