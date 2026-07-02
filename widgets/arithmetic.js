// Widget: Rechenaufgaben
WIDGETS.push({
  meta: { type:"arithmetic", label:"Rechenaufgaben", desc:"Plus, Minus, Mal, Geteilt", icon:"➕", category:"mathematik" },

  createData: id => {
    const w = {
      id, type:"arithmetic",
      tasks:"",
      cols: 2,
      zahlenraum: 20,
      ueberschreitung: 'ohne',
      aufgabenProPaeckchen: 4,
      ops: ["+", "-"],
      ergaenzung: false,
      zeichen: false,
      vergleich: false,
      vergleichSeiten: "gemischt",
      luecke: "erste",
      showLoesungen: false, aufgabenNr:0, aufgabenText:'',
    };
    arithDoGenerate(w);
    return w;
  },

  render: d => {
    const isActive = d.id === selId || _solutionsMode;
    const numCols = d.cols || 2;
    // Feste Slot-Breite für jede Zahl: max. Stellenzahl des Zahlenraums × Ziffernbreite.
    // Zusammen mit tabular-nums (gleich breite Ziffern) stehen Kästchen und „=" in
    // JEDER Aufgabe an derselben Stelle — egal ob ein- oder zweistellig, egal welche Ziffer.
    const maxDigits = String(Math.abs(+d.zahlenraum) || 20).length;
    const numW = maxDigits + 'ch';
    const allTasks = d.tasks.split("\n").map(t => t.trim()).filter(Boolean);
    const box = `<span style="display:inline-block;width:36px;height:20px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;"></span>`;
    const tdBase = `padding:3px 0;font-size:16px;font-family:'DidactGothic7',sans-serif;vertical-align:middle;line-height:20px;`;
    const numSpan = v => `<span style="display:inline-block;min-width:${numW};min-height:20px;line-height:20px;text-align:right;font-variant-numeric:tabular-nums;font-family:'DidactGothic7',sans-serif;font-size:16px;">${esc(v)}</span>`;
    // Blaue Lösung: in eine Box mit GENAU der Breite des jeweiligen Platzhalter-Kästchens
    // (w px) gesetzt → ausgewählt (Zahl) und abgewählt (Kästchen) sind gleich breit, der
    // Umbruch/die Position bleibt identisch.
    const blueVal = (v, w) => `<span style="display:inline-block;width:${w}px;text-align:center;font-family:'DidactGothic7',sans-serif;font-size:16px;color:#2563eb;font-weight:700;">${esc(String(v))}</span>`;

    // Parse a task string into parts.
    // Normal:      "12 + 4 ="        → { left:"12", op:"+", right:"4", result:null }
    // Ergänzung:   "3 + _ = 10"      → { left:"3",  op:"+", right:"_", result:"10" }
    //              "_ + 7 = 10"      → { left:"_",  op:"+", right:"7", result:"10" }
    const parse = task => {
      const norm = task.replace(/[×*]/g, "·").replace(/[÷]/g, ":");

      // Ergänzung pattern: "a op _ = r" or "_ op a = r"
      const mErg = norm.match(/^(-?\d+|_)\s*([+\-·:])\s*(-?\d+|_)\s*=\s*(-?\d+)$/);
      if (mErg) return { left: mErg[1], op: mErg[2], right: mErg[3], result: mErg[4] };

      // Vergleich pattern: "LEFT <?> RIGHT" (Seiten = Zahl oder Aufgabe)
      const mVgl = norm.match(/^(.+?)\s*<\?>\s*(.+)$/);
      if (mVgl) {
        const evalSide = s => {
          s = s.trim();
          const mm = s.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-·:])\s*(-?\d+(?:[.,]\d+)?)$/);
          if (mm) { const a=+mm[1].replace(',','.'), b=+mm[3].replace(',','.'), op=mm[2];
            return op==='+'?a+b:op==='-'?a-b:op==='·'?a*b:a/b; }
          return +s.replace(',','.');
        };
        const lv = evalSide(mVgl[1]), rv = evalSide(mVgl[2]);
        const sym = lv < rv ? '<' : lv > rv ? '>' : '=';
        return { isVergleich:true, left: mVgl[1].trim(), right: mVgl[2].trim(), sym };
      }

      // Zeichen-Modus pattern: "a ? b = c"
      const mZeichen = norm.match(/^(-?\d+(?:[.,]\d+)?)\s*\?\s*(-?\d+(?:[.,]\d+)?)\s*=\s*(-?\d+(?:[.,]\d+)?)$/);
      if (mZeichen) return { left: mZeichen[1], op: "?", right: mZeichen[2], result: mZeichen[3], isZeichen: true };

      // Normal pattern: "a op b ="
      const hasEq = norm.trimEnd().endsWith("=");
      const core  = hasEq ? norm.slice(0, norm.lastIndexOf("=")).trim() : norm.trim();
      const mNorm = core.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-·:])\s*(-?\d+(?:[.,]\d+)?)$/);
      if (mNorm) return { left: mNorm[1], op: mNorm[2], right: mNorm[3], result: null, hasEq };

      return { raw: norm.replace(/\s*=\s*$/, ""), hasEq };
    };

    const cell = (val, align = "right", override = null) => {
      const content = override !== null ? override : val === "_" ? box : numSpan(val);
      return `<td style="text-align:${align};${tdBase}min-width:${numW};font-variant-numeric:tabular-nums;">${content}</td>`;
    };

    const parsed = allTasks.map(parse);
    const perCol = Math.ceil(parsed.length / numCols);
    const groups = Array.from({length: numCols}, (_, i) =>
      parsed.slice(i * perCol, (i + 1) * perCol)
    ).filter(g => g.length);

    // Collect answers for the Lösungen band
    const answers = [];
    parsed.forEach(p => {
      if (p.raw !== undefined || p.isVergleich) return;
      if (p.result !== null) {
        // Ergänzung: the missing value is the one that was "_"
        answers.push(p.left === "_" ? p.left_val : p.right_val);
        // Recalculate: we need the numeric answer
        const l = p.left === "_" ? null : +p.left;
        const r = p.right === "_" ? null : +p.right;
        const res = +p.result;
        let ans;
        if (p.left === "_") {
          if (p.op === "+") ans = res - r;
          else if (p.op === "-") ans = res + r;
          else if (p.op === "·") ans = res / r;
          else ans = res * r;
        } else {
          if (p.op === "+") ans = res - l;
          else if (p.op === "-") ans = l - res;
          else if (p.op === "·") ans = res / l;
          else ans = l / res;
        }
        if (!isNaN(ans) && isFinite(ans)) answers.push(String(ans));
      } else if (p.hasEq) {
        const l = +p.left, r = +p.right;
        let ans;
        if (p.op === "+") ans = l + r;
        else if (p.op === "-") ans = l - r;
        else if (p.op === "·") ans = l * r;
        else ans = l / r;
        if (!isNaN(ans) && isFinite(ans) && Number.isInteger(ans)) answers.push(String(ans));
      }
    });
    // Shuffle answers
    const shuffled = mcShuffled(answers, d.id);

    // Compute answer for a parsed task (used for blue solution display)
    const computeAns = p => {
      if (p.result !== null) {
        const l = p.left === "_" ? null : +p.left;
        const r = p.right === "_" ? null : +p.right;
        const res = +p.result;
        let ans;
        if (p.left === "_") {
          if (p.op==="+") ans=res-r; else if (p.op==="-") ans=res+r;
          else if (p.op==="·") ans=res/r; else ans=res*r;
        } else {
          if (p.op==="+") ans=res-l; else if (p.op==="-") ans=l-res;
          else if (p.op==="·") ans=res/l; else ans=l/res;
        }
        return isFinite(ans) ? String(ans) : null;
      } else if (p.hasEq) {
        const l=+p.left, r=+p.right;
        let ans;
        if (p.op==="+") ans=l+r; else if (p.op==="-") ans=l-r;
        else if (p.op==="·") ans=l*r; else ans=l/r;
        return isFinite(ans) ? String(ans) : null;
      }
      return null;
    };

    const renderGroup = group => {
      const rows = group.map(p => {
        if (p.raw !== undefined) {
          const ans = p.hasEq ? (isActive ? `&thinsp;<span style="margin-right:6px;">=</span>${blueVal(computeAns(p)??'?', 36)}` : `&thinsp;<span style="margin-right:6px;">=</span>${box}`) : "";
          return `<tr><td colspan="5" style="${tdBase}">${esc(p.raw)}${ans}</td></tr>`;
        }
        const sqBoxInner = `<span style="display:block;width:20px;height:20px;border:1.5px solid #999;border-radius:2px;background:#fff;flex-shrink:0;"></span>`;
        const sqBoxSlot = (inner, w = 28) => `<span style="display:inline-flex;width:${w}px;height:20px;align-items:center;justify-content:center;vertical-align:middle;">${inner}</span>`;
        const sqBox = sqBoxSlot(sqBoxInner);
        if (p.isVergleich) {
          const cmpBox = `<span style="display:inline-block;width:24px;height:24px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;"></span>`;
          const mid = isActive ? blueVal(p.sym, 24) : cmpBox;
          return `<tr>
            <td style="text-align:right;${tdBase}padding-left:6px;padding-right:6px;white-space:nowrap;">${numSpan(p.left)}</td>
            <td style="text-align:center;${tdBase}padding-left:8px;padding-right:8px;">${mid}</td>
            <td style="text-align:left;${tdBase}padding-left:6px;padding-right:6px;white-space:nowrap;">${numSpan(p.right)}</td>
          </tr>`;
        }
        const opCell = p.isZeichen
          ? `<td style="text-align:center;${tdBase}padding-left:6px;padding-right:2px;">${isActive ? sqBoxSlot(blueVal(p.op, 20)) : sqBox}</td>`
          : `<td style="text-align:center;${tdBase}padding-left:6px;padding-right:6px;">${esc(p.op)}</td>`;
        const leftContent = (p.left === "_" && isActive) ? blueVal(computeAns(p)??'?', 36) : (p.left === "_" ? box : null);
        const rightContent = (p.right === "_" && isActive) ? blueVal(computeAns(p)??'?', 36) : (p.right === "_" ? box : null);
        if (p.result !== null) {
          return `<tr>${cell(p.left, "right", leftContent)}${opCell}${cell(p.right, "right", rightContent)}<td style="${tdBase}padding-left:5px;white-space:nowrap;"><span style="margin-right:6px;">=</span>${numSpan(p.result)}</td></tr>`;
        } else {
          const ans = computeAns(p);
          const ansCell = p.hasEq
            ? `<td style="${tdBase}padding-left:5px;white-space:nowrap;"><span style="margin-right:6px;">=</span>${isActive && ans ? blueVal(ans, 36) : box}</td>`
            : `<td></td>`;
          return `<tr>${cell(p.left, "right", leftContent)}${opCell}${cell(p.right, "right", rightContent)}${ansCell}</tr>`;
        }
      }).join("");
      return `<table style="border-collapse:collapse;">${rows}</table>`;
    };

    // Einheitliches Verteilungs-Layout (siehe flexDistribute in helpers.js). Items sind
    // durch die festen Zahl-Slots (min-width:Xch + tabular-nums) gleich breit. Füller-Muster
    // = ein einzelnes Päckchen (leicht) mit identischer Breite.
    // itemW hier nur GROB geschätzt (font-abhängige Breite) — dient allein der Voll/Nicht-
    // voll-Entscheidung in flexDistribute; die echte Spaltenzahl misst der Browser.
    const tasksHtml = atHtml(d) + flexDistribute(
      groups.map(g => renderGroup(g)),
      { gap: 29, marginBottom: 16, sample: parsed.length ? renderGroup([parsed[0]]) : '',
        itemW: 3 * maxDigits * 9 + 70, d, estimate: true }
    );

    if (!d.showLoesungen || shuffled.length === 0) return tasksHtml;

    const loesungenHtml = `
      <div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 10px;">
        ${shuffled.map(a => `<span style="font-family:'DidactGothic7',sans-serif;font-size:14px;color:#555;">${esc(a)}</span>`).join("")}
      </div>`;

    return tasksHtml + loesungenHtml;
  },

  renderProps: d => {
    const ops  = d.ops || ["+", "-"];
    const zr   = d.zahlenraum || 20;
    const ueMode = d.ueberschreitung === true ? 'gemischt'
                 : (d.ueberschreitung === false || d.ueberschreitung == null) ? 'ohne'
                 : d.ueberschreitung;
    const app  = d.aufgabenProPaeckchen || 4;
    const cols = d.cols || 2;
    const erg    = d.ergaenzung || false;
    const sl     = d.showLoesungen || false;
    const luecke = d.luecke || "zufall";

    const opBtn = (sym, label) => {
      const active = ops.includes(sym);
      return `<button onclick="event.stopPropagation();arithToggleOp(${d.id},'${sym}')"
        style="padding:3px 8px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:13px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    };

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    const modusBlock = `
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn("Rechenaufgaben", !erg && !d.zeichen && !d.vergleich, `arithSetModus(${d.id},'normal')`)}
          ${toggleBtn("Ergänzung",      erg,                `arithSetModus(${d.id},'ergaenzung')`)}
          ${toggleBtn("Rechenzeichen",  d.zeichen||false,   `arithSetModus(${d.id},'zeichen')`)}
          ${toggleBtn("Größer/Kleiner", d.vergleich||false, `arithSetModus(${d.id},'vergleich')`)}
        </div>
      </div>
      ${erg ? `<div class="prow"><label>Lücke</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("1. Zahl", luecke==="erste",  `arithSetLuecke(${d.id},'erste')`)}
          ${toggleBtn("2. Zahl", luecke==="zweite", `arithSetLuecke(${d.id},'zweite')`)}
          ${toggleBtn("Zufall",  luecke==="zufall", `arithSetLuecke(${d.id},'zufall')`)}
        </div>
      </div>` : ''}
      ${d.vergleich ? `<div class="prow"><label>Seiten</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Zahlen",   (d.vergleichSeiten||'gemischt')==='zahlen',   `arithSetVglSeiten(${d.id},'zahlen')`)}
          ${toggleBtn("Aufgaben", (d.vergleichSeiten||'gemischt')==='aufgaben', `arithSetVglSeiten(${d.id},'aufgaben')`)}
          ${toggleBtn("Gemischt", (d.vergleichSeiten||'gemischt')==='gemischt', `arithSetVglSeiten(${d.id},'gemischt')`)}
        </div>
      </div>` : ''}
      ${!d.vergleich ? `<div class="prow"><label>Rechenzeichen</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
          ${opBtn("+","+")}${opBtn("-","−")}${opBtn("·","·")}${opBtn(":","÷")}
        </div>
      </div>` : ''}` +
      pr("Zahlenraum",
        `<select onchange="arithSetLayout(${d.id},'zahlenraum',+this.value)">
          ${[10,20,100,1000].map(n=>`<option value="${n}" ${zr===n?"selected":""}>${n}</option>`).join("")}
        </select>`) +
      `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne",     ueMode==='ohne',     `arithSetLayout(${d.id},'ueberschreitung','ohne')`)}
          ${toggleBtn("Gemischt", ueMode==='gemischt', `arithSetLayout(${d.id},'ueberschreitung','gemischt')`)}
          ${toggleBtn("Nur mit",  ueMode==='nur',      `arithSetLayout(${d.id},'ueberschreitung','nur')`)}
        </div>
      </div>`;

    const anordnungBlock =
      pr("Aufgaben pro Päckchen",
        `<input type="number" min="1" max="20" value="${app}" onchange="arithSetLayout(${d.id},'aufgabenProPaeckchen',+this.value)">`) +
      pr("Anzahl Päckchen",
        `<input type="number" min="1" max="36" value="${cols}" onchange="arithSetLayout(${d.id},'cols',+this.value)">`);

    const loesungBlock = (!(d.vergleich || d.zeichen) ? `<div class="prow"><label>Lösungen anzeigen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ausblenden", !sl, `upd(${d.id},'showLoesungen',false)`)}
          ${toggleBtn("Einblenden", sl,  `upd(${d.id},'showLoesungen',true)`)}
        </div>
      </div>` : '');

    const wuerfelBtn =
      `<button onclick="event.stopPropagation();arithGenerate(${d.id})"
        style="margin-top:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>`;

    const manuellBlock =
      pr(`Manuell bearbeiten${erg?" (_ = Lücke, z.B. 3 + _ = 10)":""}`,
        `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;" onchange="upd(${d.id},'tasks',this.value)">${esc(d.tasks)}</textarea>`);

    return modusBlock +
      anordnungBlock +
      loesungBlock +
      wuerfelBtn +
      propFold('arith-manuell', 'Manuelle Bearbeitung', manuellBlock, false);
  },
});

// ── Arithmetic helpers (global) ───────────────────────────────────
function arithToggleOp(id, sym) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const ops = (w.ops || ["+", "-"]).slice();
  const idx = ops.indexOf(sym);
  if (idx >= 0) { if (ops.length > 1) ops.splice(idx, 1); }
  else ops.push(sym);
  w.ops = ops;
  render(); renderProps(id);
}

function arithSetErgaenzung(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.ergaenzung = val;
  render(); renderProps(id);
}

function arithSetModus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.ergaenzung = modus === 'ergaenzung';
  w.zeichen    = modus === 'zeichen';
  w.vergleich  = modus === 'vergleich';
  if (modus === 'ergaenzung') w.luecke = w.luecke || 'erste';
  if (modus === 'vergleich')  w.vergleichSeiten = w.vergleichSeiten || 'gemischt';
  // Lösung anzeigen gibt es bei Rechenzeichen/Vergleich nicht → abwählen
  if (modus === 'zeichen' || modus === 'vergleich') w.showLoesungen = false;
  arithGenerate(id);
}

function arithSetVglSeiten(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.vergleichSeiten = val;
  arithGenerate(id);
}

function arithSetLuecke(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.luecke = val;
  arithGenerate(id);
}

function arithSetLayout(id, key, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = value;
  // Tasks neu generieren damit Anzahl stimmt
  arithGenerate(id);
}

function arithDoGenerate(w) {
  const zr   = w.zahlenraum || 20;
  // Zehnerübergang: 'ohne' | 'gemischt' | 'nur' (Legacy bool: false→ohne, true→gemischt)
  const _u = w.ueberschreitung;
  const ueMode = _u === true ? 'gemischt' : (_u === false || _u == null) ? 'ohne' : _u;
  const app    = w.aufgabenProPaeckchen || 4;
  const cols   = w.cols || 2;
  const ops    = w.ops || ["+", "-"];
  const erg    = w.ergaenzung || false;
  const zeichen= w.zeichen || false;
  const vergleich = w.vergleich || false;
  const vglSeiten = w.vergleichSeiten || 'gemischt';
  const luecke = w.luecke || "erste";
  const total = app * cols;

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const noCarry = (a, b, op) => {
    if (op === "+") {
      let aa = a, bb = b;
      while (aa > 0 || bb > 0) {
        if ((aa % 10) + (bb % 10) >= 10) return false;
        aa = Math.floor(aa/10); bb = Math.floor(bb/10);
      }
      return true;
    }
    if (op === "-") {
      let aa = a, bb = b;
      while (aa > 0 || bb > 0) {
        if ((aa % 10) < (bb % 10)) return false;
        aa = Math.floor(aa/10); bb = Math.floor(bb/10);
      }
      return true;
    }
    return true;
  };

  // Prüft eine Aufgabe gegen den Zehnerübergang-Modus (nur bei +/− relevant).
  const ueOk = (a, b, op) => {
    if (op !== "+" && op !== "-") return true;
    const carry = !noCarry(a, b, op);
    return ueMode === 'ohne' ? !carry : ueMode === 'nur' ? carry : true;
  };

  const makeNormal = op => {
    let a, b, tries = 0;
    do {
      tries++;
      if (op === "+") {
        a = rand(1, zr - 1); b = rand(1, zr - a);
      } else if (op === "-") {
        a = rand(1, zr); b = rand(0, a);
      } else if (op === "·") {
        const maxF = Math.floor(Math.sqrt(zr));
        a = rand(2, Math.min(maxF, 10));
        b = rand(2, Math.min(Math.floor(zr / a), 10));
      } else { // :
        b = rand(2, Math.min(10, Math.floor(Math.sqrt(zr))));
        const q = rand(1, Math.max(1, Math.floor(zr / b)));
        a = q * b;
      }
      if (!ueOk(a, b, op)) continue;
      break;
    } while (tries < 200);
    return `${a} ${op} ${b} =`;
  };

  const makeErgaenzung = op => {
    let a, b, tries = 0;
    do {
      tries++;
      if (op === "+") {
        a = rand(1, zr - 1); b = rand(1, zr - a);
      } else if (op === "-") {
        a = rand(1, zr); b = rand(0, a);
      } else if (op === "·") {
        const maxF = Math.floor(Math.sqrt(zr));
        a = rand(2, Math.min(maxF, 10));
        b = rand(2, Math.min(Math.floor(zr / a), 10));
      } else { // :
        b = rand(2, Math.min(10, Math.floor(Math.sqrt(zr))));
        const q = rand(1, Math.max(1, Math.floor(zr / b)));
        a = q * b;
      }
      if (!ueOk(a, b, op)) continue;
      break;
    } while (tries < 200);

    const ersteFehlend = luecke === "erste" ? true : luecke === "zweite" ? false : Math.random() < 0.5;
    if (op === "+") {
      const result = a + b;
      return ersteFehlend ? `_ + ${b} = ${result}` : `${a} + _ = ${result}`;
    } else if (op === "-") {
      const result = a - b;
      return ersteFehlend ? `_ - ${b} = ${result}` : `${a} - _ = ${result}`;
    } else if (op === "·") {
      const result = a * b;
      return ersteFehlend ? `_ · ${b} = ${result}` : `${a} · _ = ${result}`;
    } else { // :
      const result = a / b;
      return ersteFehlend ? `_ : ${b} = ${result}` : `${a} : _ = ${result}`;
    }
  };

  const makeZeichen = op => {
    let a, b, tries = 0;
    do {
      tries++;
      if (op === "+") { a = rand(1, zr - 1); b = rand(1, zr - a); }
      else if (op === "-") { a = rand(1, zr); b = rand(0, a); }
      else if (op === "·") { const maxF = Math.floor(Math.sqrt(zr)); a = rand(2, Math.min(maxF, 10)); b = rand(2, Math.min(Math.floor(zr / a), 10)); }
      else { b = rand(2, Math.min(10, Math.floor(Math.sqrt(zr)))); a = rand(1, Math.max(1, Math.floor(zr / b))) * b; }
      if (!ueOk(a, b, op)) continue;
      break;
    } while (tries < 200);
    const result = op === "+" ? a+b : op === "-" ? a-b : op === "·" ? a*b : a/b;
    return `${a} ? ${b} = ${result}`;
  };

  // Vergleich: jede Seite ist Zahl oder Aufgabe (je nach vglSeiten); dazwischen ein Kästchen für < > =
  const makeVergleichSide = () => {
    const expr = vglSeiten === 'aufgaben' ? true : vglSeiten === 'zahlen' ? false : Math.random() < 0.5;
    if (!expr) return String(rand(0, zr));
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, tries = 0;
    do {
      tries++;
      if (op === "+") { a = rand(1, zr - 1); b = rand(1, zr - a); }
      else if (op === "-") { a = rand(1, zr); b = rand(0, a); }
      else if (op === "·") { const maxF = Math.floor(Math.sqrt(zr)); a = rand(2, Math.min(maxF, 10)); b = rand(2, Math.min(Math.floor(zr / a), 10)); }
      else { b = rand(2, Math.min(10, Math.floor(Math.sqrt(zr)))); a = rand(1, Math.max(1, Math.floor(zr / b))) * b; }
      if (!ueOk(a, b, op)) continue;
      break;
    } while (tries < 200);
    return `${a} ${op} ${b}`;
  };
  const makeVergleich = () => `${makeVergleichSide()} <?> ${makeVergleichSide()}`;

  const lines = [];
  for (let i = 0; i < total; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    lines.push(vergleich ? makeVergleich() : zeichen ? makeZeichen(op) : erg ? makeErgaenzung(op) : makeNormal(op));
  }
  w.tasks = lines.join("\n");
}

function arithGenerate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  arithDoGenerate(w);
  render(); renderProps(id);
}
