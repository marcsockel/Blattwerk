// Widget: Rechenaufgaben
const ARITH_DEFAULT_FONT = "'Arial', sans-serif";

WIDGETS.push({
  meta: { type:"arithmetic", label:"Rechenaufgaben", desc:"Plus, Minus, Mal, Geteilt", icon:"➕", category:"mathematik" },

  createData: id => {
    const w = {
      id, type:"arithmetic",
      tasks:"",
      cols: 2,
      zahlenraum: 20,
      ueberschreitung: 'ohne',
      hueberschreitung: 'ohne',
      aufgabenProPaeckchen: 4,
      ops: ["+", "-"],
      ergaenzung: false,
      zeichen: false,
      vergleich: false,
      vergleichSeiten: "gemischt",
      luecke: "erste",
      showLoesungen: false, groesse:'klein', font: ARITH_DEFAULT_FONT, aufgabenNr:0, aufgabenText:'',
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
    // Größe: klein = bisherige Maße (Faktor 1), mittel = 1.3x, groß = 1.5x.
    // ch-basierte Slots skalieren automatisch über die Schriftgröße mit.
    const S = d.groesse === 'gross' ? 1.5 : d.groesse === 'mittel' ? 1.3 : 1;
    const px = v => Math.round(v * S);
    const FS = px(16);   // Schriftgröße
    const LH = px(20);   // Zeilen-/Kästchenhöhe
    const FF = d.font || ARITH_DEFAULT_FONT;
    const BW = px(36);   // Antwortkästchen-Breite (ungeteilt)
    const CW = px(18);   // Stellen-Zellenbreite
    const box = `<span style="display:inline-block;width:${BW}px;height:${LH}px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;"></span>`;
    // „Stellen anzeigen": Antwortkästchen in n berührende Ziffern-Zellen unterteilen,
    // dazwischen nur ein dünner Strich (CW px je Stelle). n = Stellen der erwarteten Antwort.
    // Fallback (aus / Antwort unbekannt) = einfaches Kästchen.
    const stellen = !!d.stellen;
    const boxW = n => n*CW + (n-1) + 3; // Außenbreite inkl. Trennstriche+Rahmen (Footprint für blaue Lösung)
    // Kästchen in Original-Optik, blau gefüllt (Lösungsvorschau = Original + Inhalt)
    const blueBox = (v, w, h = LH) =>
      `<span style="display:inline-flex;width:${w}px;height:${h}px;align-items:center;justify-content:center;border:1.5px solid #999;border-radius:2px;background:#fff;vertical-align:middle;font-family:${FF};font-size:${FS}px;color:#2563eb;font-weight:700;">${esc(String(v))}</span>`;
    const boxN = (n, v) => {
      if (!stellen || !n || n < 1) return v === undefined ? box : blueBox(v, BW);
      const s = v === undefined ? null : String(v);
      return `<span style="display:inline-flex;height:${LH}px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;">` +
        Array.from({length:n}, (_,i) => {
          const ch = s && s.length >= n - i ? esc(s[s.length - n + i]) : '';
          return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${CW}px;height:100%;${i ? 'border-left:1px solid #999;' : ''}font-family:${FF};font-size:${FS}px;color:#2563eb;font-weight:700;">${ch}</span>`;
        }).join("") +
      `</span>`;
    };
    const ansDigits = v => v == null ? 0 : String(v).replace(/\D/g, "").length;
    const ansW = v => (stellen && ansDigits(v)) ? boxW(ansDigits(v)) : BW;
    const tdBase = `padding:${px(3)}px 0;font-size:${FS}px;font-family:${FF};vertical-align:middle;line-height:${LH}px;`;
    // Die Schrift hat KEINE Tabellenziffern (kein tnum-Feature — „1" ist 6.6px, „8" 8.9px),
    // font-variant-numeric:tabular-nums wirkt also nicht. Darum bekommt jede Ziffer eine
    // eigene Zelle (zentriert) → Einer stehen unter Einern, egal welche Ziffer. Etwas
    // breiter als 1ch, sonst berühren sich benachbarte Ziffern (v.a. Nullen ≈ 1ch breit).
    const digitCells = v => String(v).split("").map(c =>
      /[0-9]/.test(c)
        ? `<span style="display:inline-block;width:1.2ch;text-align:center;">${c}</span>`
        : esc(c)
    ).join("");
    const numSpan = (v, w = numW) => `<span style="display:inline-block;min-width:${w};min-height:${LH}px;line-height:${LH}px;text-align:right;font-family:${FF};font-size:${FS}px;">${digitCells(v)}</span>`;
    // Blaue Lösung: in eine Box mit GENAU der Breite des jeweiligen Platzhalter-Kästchens
    // (w px) gesetzt → ausgewählt (Zahl) und abgewählt (Kästchen) sind gleich breit, der
    // Umbruch/die Position bleibt identisch.
    const blueVal = (v, w) => `<span style="display:inline-block;width:${w}px;text-align:center;font-family:${FF};font-size:${FS}px;color:#2563eb;font-weight:700;">${esc(String(v))}</span>`;

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

    const parsed = allTasks.map(parse);
    // Slot-Breiten aus den ECHT vorkommenden Zahlen statt pauschal aus dem Zahlenraum:
    // rechtsbündig (stellengerecht) bleibt, aber ohne Dauerlücke nach dem Rechenzeichen,
    // wenn z.B. im 100er-Raum gar keine dreistellige Zahl dabei ist. Widget-weit berechnet
    // → alle Päckchen bleiben exakt gleich breit (flexDistribute-Voraussetzung).
    const digitsOf = v => (v && v !== "_") ? String(v).replace(/\D/g, "").length : 0;
    let dL = 0, dR = 0, dRes = 0;
    parsed.forEach(p => {
      if (p.raw !== undefined || p.isVergleich) return;
      dL   = Math.max(dL,   digitsOf(p.left));
      dR   = Math.max(dR,   digitsOf(p.right));
      dRes = Math.max(dRes, digitsOf(p.result));
    });
    const lW = (dL || maxDigits) + 'ch', rW = (dR || maxDigits) + 'ch', resW = (dRes || maxDigits) + 'ch';
    const cell = (val, align = "right", override = null, w = numW) => {
      const content = override !== null ? override : val === "_" ? box : numSpan(val, w);
      return `<td style="text-align:${align};${tdBase}min-width:${w};font-variant-numeric:tabular-nums;">${content}</td>`;
    };
    const perCol = Math.ceil(parsed.length / numCols);
    const groups = Array.from({length: numCols}, (_, i) =>
      parsed.slice(i * perCol, (i + 1) * perCol)
    ).filter(g => g.length);

    // Collect answers for the Lösungen band
    const answers = [];
    parsed.forEach(p => {
      if (p.raw !== undefined || p.isVergleich) return;
      if (p.result !== null) {
        // Ergänzung: die fehlende Zahl berechnen (nur die berechnete Antwort pushen —
        // früher wurde hier zusätzlich ein nicht existentes Feld gepusht → undefined-Lücken im Lösungsband)
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

    // Stellengerechte Ergebnis-Kästchen: breiteste Antwort im Widget bestimmt die
    // Slot-Breite hinter dem „=", darin rechtsbündig → Einer-Zelle unter Einer-Zelle.
    let dAns = 0;
    if (stellen) parsed.forEach(p => {
      if (p.raw === undefined && !p.isVergleich && p.result === null && p.hasEq)
        dAns = Math.max(dAns, ansDigits(computeAns(p)));
    });

    const ergaenzungZufall = !!(d.ergaenzung && d.luecke === 'zufall');
    let zSlotL = dL, zSlotR = dR, zSlotRes = dRes;
    if (ergaenzungZufall) {
      parsed.forEach(p => {
        if (p.raw !== undefined || p.isVergleich || p.result == null) return;
        const gap = computeAns(p);
        if (p.left === '_') zSlotL = Math.max(zSlotL, ansDigits(gap));
        if (p.right === '_') zSlotR = Math.max(zSlotR, ansDigits(gap));
      });
      zSlotL = zSlotL || maxDigits;
      zSlotR = zSlotR || maxDigits;
      zSlotRes = zSlotRes || maxDigits;
    }

    const renderZufallRow = p => {
      const placeW = '1.2ch';
      const placeTd = ch =>
        `<td style="text-align:center;${tdBase}width:${placeW};min-width:${placeW};max-width:${placeW};padding-left:0;padding-right:0;vertical-align:middle;">`
        + (ch ? `<span style="display:inline-block;width:${placeW};text-align:center;">${esc(ch)}</span>` : '')
        + `</td>`;
      const placeTable = (val, nPlaces, gapAns) => {
        if (val === '_') {
          const n = Math.max(1, ansDigits(gapAns));
          return isActive && gapAns != null
            ? (stellen ? boxN(n, gapAns) : blueBox(gapAns, BW))
            : (stellen ? boxN(n) : box);
        }
        const digits = String(val).replace(/\D/g, '');
        const cells = [];
        for (let i = 0; i < nPlaces; i++) {
          const fromRight = nPlaces - i;
          const dIdx = digits.length - fromRight;
          cells.push(placeTd(dIdx >= 0 ? digits[dIdx] : ''));
        }
        return `<table style="border-collapse:collapse;margin:0 auto;"><tr>${cells.join('')}</tr></table>`;
      };
      const wrapCell = inner =>
        `<td style="text-align:center;${tdBase}padding-left:0;padding-right:0;vertical-align:middle;white-space:nowrap;">${inner}</td>`;
      const gapAns = (p.left === '_' || p.right === '_') ? computeAns(p) : null;
      const opCell = `<td style="text-align:center;${tdBase}padding-left:4px;padding-right:4px;"><span style="display:inline-block;width:${px(9)}px;text-align:center;">${esc(p.op)}</span></td>`;
      const eqCell = `<td style="${tdBase}padding-left:5px;padding-right:6px;text-align:center;white-space:nowrap;vertical-align:middle;">=</td>`;
      return `<tr>`
        + wrapCell(placeTable(p.left, zSlotL, gapAns))
        + opCell
        + wrapCell(placeTable(p.right, zSlotR, gapAns))
        + eqCell
        + wrapCell(placeTable(p.result, zSlotRes, null))
        + `</tr>`;
    };

    const renderTaskRow = p => {
      if (p.raw !== undefined) {
        const ans = p.hasEq ? (isActive ? `&thinsp;<span style="margin-right:6px;">=</span>${blueBox(computeAns(p)??'?', BW)}` : `&thinsp;<span style="margin-right:6px;">=</span>${box}`) : "";
        return `<tr><td colspan="5" style="${tdBase}">${esc(p.raw)}${ans}</td></tr>`;
      }
      const sqBoxInner = `<span style="display:block;width:${LH}px;height:${LH}px;border:1.5px solid #999;border-radius:2px;background:#fff;flex-shrink:0;"></span>`;
      const sqBoxSlot = (inner, w = px(28)) => `<span style="display:inline-flex;width:${w}px;height:${LH}px;align-items:center;justify-content:center;vertical-align:middle;">${inner}</span>`;
      const sqBox = sqBoxSlot(sqBoxInner);
      if (p.isVergleich) {
        const cmpBox = `<span style="display:inline-block;width:${px(24)}px;height:${px(24)}px;border:1.5px solid #999;border-radius:2px;vertical-align:middle;background:#fff;"></span>`;
        const mid = isActive ? blueBox(p.sym, px(24), px(24)) : cmpBox;
        return `<tr>
          <td style="text-align:right;${tdBase}padding-left:6px;padding-right:6px;white-space:nowrap;">${numSpan(p.left)}</td>
          <td style="text-align:center;${tdBase}padding-left:8px;padding-right:8px;">${mid}</td>
          <td style="text-align:left;${tdBase}padding-left:6px;padding-right:6px;white-space:nowrap;">${numSpan(p.right)}</td>
        </tr>`;
      }
      const opCell = p.isZeichen
        ? `<td style="text-align:center;${tdBase}padding-left:6px;padding-right:2px;">${isActive ? sqBoxSlot(blueBox(p.op, LH)) : sqBox}</td>`
        : `<td style="text-align:center;${tdBase}padding-left:4px;padding-right:4px;"><span style="display:inline-block;width:${px(9)}px;text-align:center;">${esc(p.op)}</span></td>`;
      const gapAns = (p.left === "_" || p.right === "_") ? computeAns(p) : null;
      const leftContent  = (p.left === "_" && isActive) ? boxN(ansDigits(gapAns), gapAns ?? '?') : (p.left === "_" ? boxN(ansDigits(gapAns)) : null);
      const rightContent = (p.right === "_" && isActive) ? boxN(ansDigits(gapAns), gapAns ?? '?') : (p.right === "_" ? boxN(ansDigits(gapAns)) : null);
      if (p.result !== null) {
        return `<tr>${cell(p.left, "right", leftContent, lW)}${opCell}${cell(p.right, "right", rightContent, rW)}<td style="${tdBase}padding-left:5px;white-space:nowrap;"><span style="margin-right:6px;">=</span>${numSpan(p.result, resW)}</td></tr>`;
      }
      const ans = computeAns(p);
      const ansInner = isActive && ans ? boxN(ansDigits(ans), ans) : boxN(ansDigits(ans));
      const ansSlot = (stellen && dAns)
        ? `<span style="display:inline-block;min-width:${boxW(dAns)}px;text-align:right;vertical-align:middle;">${ansInner}</span>`
        : ansInner;
      const ansCell = p.hasEq
        ? `<td style="${tdBase}padding-left:5px;white-space:nowrap;"><span style="margin-right:6px;">=</span>${ansSlot}</td>`
        : `<td></td>`;
      return `<tr>${cell(p.left, "right", leftContent, lW)}${opCell}${cell(p.right, "right", rightContent, rW)}${ansCell}</tr>`;
    };

    const renderGroup = group => {
      const rows = group.map(p => {
        if (ergaenzungZufall && p.result != null && p.raw === undefined && !p.isVergleich && !p.isZeichen)
          return renderZufallRow(p);
        return renderTaskRow(p);
      }).join('');
      return `<table style="border-collapse:collapse;">${rows}</table>`;
    };

    // Einheitliches Verteilungs-Layout (siehe flexDistribute in helpers.js). Items sind
    // durch die festen Zahl-Slots (min-width:Xch + tabular-nums) gleich breit. Füller-Muster
    // = ein einzelnes Päckchen (leicht) mit identischer Breite.
    // itemW hier nur GROB geschätzt (font-abhängige Breite) — dient allein der Voll/Nicht-
    // voll-Entscheidung in flexDistribute; die echte Spaltenzahl misst der Browser.
    const tasksHtml = atHtml(d) + flexDistribute(
      groups.map(g => renderGroup(g)),
      { gap: 24, marginBottom: 16, sample: parsed.length ? renderGroup([parsed[0]]) : '',
        itemW: Math.round((3 * maxDigits * 9 + 70) * S), d, estimate: true }
    );

    if (!d.showLoesungen || shuffled.length === 0) return tasksHtml;

    const loesungenHtml = `
      <div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 10px;">
        ${shuffled.map(a => `<span style="font-family:${FF};font-size:${px(14)}px;color:#555;">${esc(a)}</span>`).join("")}
      </div>`;

    return tasksHtml + loesungenHtml;
  },

  renderProps: d => {
    const ops  = d.ops || ["+", "-"];
    const zr   = d.zahlenraum || 20;
    const ueMode = d.ueberschreitung === true ? 'gemischt'
                 : (d.ueberschreitung === false || d.ueberschreitung == null) ? 'ohne'
                 : d.ueberschreitung;
    const hueMode = d.hueberschreitung || 'ohne';
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
      </div>` +
      (zr > 100 ? `<div class="prow"><label>Hunderterübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Ohne",     hueMode==='ohne',     `arithSetLayout(${d.id},'hueberschreitung','ohne')`)}
          ${toggleBtn("Gemischt", hueMode==='gemischt', `arithSetLayout(${d.id},'hueberschreitung','gemischt')`)}
          ${toggleBtn("Nur mit",  hueMode==='nur',      `arithSetLayout(${d.id},'hueberschreitung','nur')`)}
        </div>
      </div>` : '');

    const anordnungBlock =
      pr("Aufgaben pro Päckchen",
        `<input type="number" min="1" max="20" value="${app}" onchange="arithSetLayout(${d.id},'aufgabenProPaeckchen',+this.value)">`) +
      pr("Anzahl Päckchen",
        `<input type="number" min="1" max="36" value="${cols}" onchange="arithSetLayout(${d.id},'cols',+this.value)">`);

    const groesseBlock = `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Klein",  (d.groesse||'klein')==='klein', `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn("Mittel", d.groesse==='mittel',           `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn("Groß",   d.groesse==='gross',            `upd(${d.id},'groesse','gross')`)}
        </div>
      </div>`;

    const stellenBlock = (!(d.vergleich || d.zeichen) ? `<div class="prow"><label>Stellen anzeigen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn("Aus", !d.stellen,  `upd(${d.id},'stellen',false)`)}
          ${toggleBtn("An",  !!d.stellen, `upd(${d.id},'stellen',true)`)}
        </div>
      </div>` : '');

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
      groesseBlock +
      stellenBlock +
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
  arithDoGenerate(w);   // Aufgaben passen sonst nicht mehr zu den gewählten Zeichen
  render(); renderProps(id);
}

function arithSetErgaenzung(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.ergaenzung = val;
  render(); renderProps(id);
}

function arithParseStandardTask(task) {
  const norm = task.replace(/[×*]/g, "·").replace(/[÷]/g, ":");
  const mErg = norm.match(/^(-?\d+|_)\s*([+\-·:])\s*(-?\d+|_)\s*=\s*(-?\d+(?:[.,]\d+)?)$/);
  if (mErg) {
    return {
      kind: 'erg',
      left: mErg[1],
      op: mErg[2],
      right: mErg[3],
      result: +String(mErg[4]).replace(',', '.'),
    };
  }
  const hasEq = norm.trimEnd().endsWith('=');
  const core = hasEq ? norm.slice(0, norm.lastIndexOf('=')).trim() : norm.trim();
  const m = core.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-·:])\s*(-?\d+(?:[.,]\d+)?)$/);
  if (!m) return null;
  return {
    kind: 'normal',
    left: +String(m[1]).replace(',', '.'),
    op: m[2],
    right: +String(m[3]).replace(',', '.'),
  };
}

function arithComputeResult(a, op, b) {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '·') return a * b;
  return a / b;
}

function arithFmtNum(n) {
  return Number.isInteger(n) ? String(n) : String(n);
}

/** Rechenaufgaben „a op b =" → Ergänzung „_ op b = r" / „a op _ = r". */
function arithConvertNormalToErgaenzung(tasksText, luecke) {
  return tasksText.split('\n').map(line => {
    const t = line.trim();
    if (!t) return line;
    const p = arithParseStandardTask(t);
    if (!p || p.kind !== 'normal') return line;
    const result = arithComputeResult(p.left, p.op, p.right);
    if (!Number.isFinite(result)) return line;
    const resStr = arithFmtNum(result);
    const erste = luecke === 'erste' ? true : luecke === 'zweite' ? false : Math.random() < 0.5;
    if (erste) return `_ ${p.op} ${arithFmtNum(p.right)} = ${resStr}`;
    return `${arithFmtNum(p.left)} ${p.op} _ = ${resStr}`;
  }).join('\n');
}

/** Ergänzung → Rechenaufgaben „a op b =". */
function arithConvertErgaenzungToNormal(tasksText) {
  return tasksText.split('\n').map(line => {
    const t = line.trim();
    if (!t) return line;
    const p = arithParseStandardTask(t);
    if (!p || p.kind !== 'erg') return line;
    const b = p.right === '_' ? null : +p.right;
    const a = p.left === '_' ? null : +p.left;
    const res = p.result;
    let left, right;
    if (p.left === '_') {
      if (p.op === '+') left = res - b;
      else if (p.op === '-') left = res + b;
      else if (p.op === '·') left = res / b;
      else left = res * b;
      right = b;
    } else {
      left = a;
      if (p.op === '+') right = res - a;
      else if (p.op === '-') right = a - res;
      else if (p.op === '·') right = res / a;
      else right = a / res;
    }
    if (!Number.isFinite(left) || !Number.isFinite(right)) return line;
    return `${arithFmtNum(left)} ${p.op} ${arithFmtNum(right)} =`;
  }).join('\n');
}

function arithSetModus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const prevModus = w.ergaenzung ? 'ergaenzung' : w.zeichen ? 'zeichen' : w.vergleich ? 'vergleich' : 'normal';

  w.ergaenzung = modus === 'ergaenzung';
  w.zeichen    = modus === 'zeichen';
  w.vergleich  = modus === 'vergleich';
  if (modus === 'ergaenzung') w.luecke = w.luecke || 'erste';
  if (modus === 'vergleich')  w.vergleichSeiten = w.vergleichSeiten || 'gemischt';
  // Lösung anzeigen gibt es bei Rechenzeichen/Vergleich nicht → abwählen
  if (modus === 'zeichen' || modus === 'vergleich') w.showLoesungen = false;

  const hasTasks = !!(w.tasks || '').trim();
  const convertNormalErg = hasTasks && (
    (prevModus === 'normal' && modus === 'ergaenzung') ||
    (prevModus === 'ergaenzung' && modus === 'normal')
  );

  if (convertNormalErg) {
    w.tasks = modus === 'ergaenzung'
      ? arithConvertNormalToErgaenzung(w.tasks, w.luecke || 'erste')
      : arithConvertErgaenzungToNormal(w.tasks);
    render(); renderProps(id);
    return;
  }

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
  // Bei reiner Mengenänderung (Päckchen/Aufgaben) vorhandene Aufgaben behalten,
  // sonst (Zahlenraum/Übergänge) komplett neu würfeln.
  if (key === 'cols' || key === 'aufgabenProPaeckchen') {
    arithResize(w);
    render(); renderProps(id);
  } else {
    arithGenerate(id);
  }
}

function arithTotal(w) {
  return (w.aufgabenProPaeckchen || 4) * (w.cols || 2);
}

// Baut `count` neue Aufgaben-Zeilen anhand der Einstellungen von w.
function arithBuildLines(w, count) {
  const zr   = w.zahlenraum || 20;
  // Zehnerübergang: 'ohne' | 'gemischt' | 'nur' (Legacy bool: false→ohne, true→gemischt)
  const _u = w.ueberschreitung;
  const ueMode = _u === true ? 'gemischt' : (_u === false || _u == null) ? 'ohne' : _u;
  // Hunderterübergang separat (Übertrag/Borgen oberhalb der Einerstelle).
  // Bis Zahlenraum 100 ist die Prop ausgeblendet → an den Zehnerübergang koppeln:
  // 'ohne' filtert wie früher ALLE Überträge (auch 50+50=100), sonst neutral
  // ('nur' darf nicht auf Hunderter bestehen — im ZR 100 kaum erfüllbar).
  const hueMode = zr > 100 ? (w.hueberschreitung || 'ohne')
                           : (ueMode === 'ohne' ? 'ohne' : 'gemischt');
  const ops    = w.ops || ["+", "-"];
  const erg    = w.ergaenzung || false;
  const zeichen= w.zeichen || false;
  const vergleich = w.vergleich || false;
  const vglSeiten = w.vergleichSeiten || 'gemischt';
  const luecke = w.luecke || "erste";

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Übertrags-Positionen MIT Weiterreichung (55+45: Einer 10 → Übertrag, Zehner 5+5+1=11
  // → auch Hunderterübergang). z = Übertrag an der Einerstelle (Zehnerübergang),
  // h = Übertrag an einer höheren Stelle (Hunderter- und darüber).
  const carryPos = (a, b, op) => {
    let z = false, h = false, aa = a, bb = b, pos = 0;
    if (op === "+") {
      let carry = 0;
      while (aa > 0 || bb > 0 || carry) {
        carry = (aa % 10 + bb % 10 + carry) >= 10 ? 1 : 0;
        if (carry) { if (pos === 0) z = true; else h = true; }
        aa = Math.floor(aa/10); bb = Math.floor(bb/10);
        if (++pos > 8) break;
      }
    } else if (op === "-") {
      let borrow = 0;
      while (aa > 0 || bb > 0 || borrow) {
        borrow = (aa % 10 - bb % 10 - borrow) < 0 ? 1 : 0;
        if (borrow) { if (pos === 0) z = true; else h = true; }
        aa = Math.floor(aa/10); bb = Math.floor(bb/10);
        if (++pos > 8) break;
      }
    }
    return { z, h };
  };

  // Prüft eine Aufgabe gegen Zehner- UND Hunderterübergang-Modus (nur bei +/− relevant).
  const ueOk = (a, b, op) => {
    if (op !== "+" && op !== "-") return true;
    const { z, h } = carryPos(a, b, op);
    const zOk = ueMode  === 'ohne' ? !z : ueMode  === 'nur' ? z : true;
    const hOk = hueMode === 'ohne' ? !h : hueMode === 'nur' ? h : true;
    return zOk && hOk;
  };

  // Plus/Minus-Operanden ziehen. Sonderfall „Nur mit Hunderterübergang" im ZR 100:
  // per Zufall fast nie zu treffen (Summe muss exakt 100 sein bzw. Minuend = 100)
  // → gezielt konstruieren, sonst gibt die 200-Versuche-Schleife erfolglos auf.
  const drawPM = op => {
    if (hueMode === 'nur' && zr === 100) {
      let x;
      if (ueMode === 'ohne') x = 10 * rand(1, 9);                       // Einer glatt → kein Zehnerübergang
      else if (ueMode === 'nur') { do { x = rand(1, 99); } while (x % 10 === 0); } // Einerübertrag erzwingen
      else x = rand(1, 99);
      return op === "+" ? [x, 100 - x] : [100, x];
    }
    if (op === "+") { const a = rand(1, zr - 1); return [a, rand(1, zr - a)]; }
    const a = rand(1, zr); return [a, rand(0, a)];
  };

  const makeNormal = op => {
    let a, b, tries = 0;
    do {
      tries++;
      if (op === "+" || op === "-") {
        [a, b] = drawPM(op);
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
      if (op === "+" || op === "-") {
        [a, b] = drawPM(op);
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
      if (op === "+" || op === "-") { [a, b] = drawPM(op); }
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
      if (op === "+" || op === "-") { [a, b] = drawPM(op); }
      else if (op === "·") { const maxF = Math.floor(Math.sqrt(zr)); a = rand(2, Math.min(maxF, 10)); b = rand(2, Math.min(Math.floor(zr / a), 10)); }
      else { b = rand(2, Math.min(10, Math.floor(Math.sqrt(zr)))); a = rand(1, Math.max(1, Math.floor(zr / b))) * b; }
      if (!ueOk(a, b, op)) continue;
      break;
    } while (tries < 200);
    return `${a} ${op} ${b}`;
  };
  const makeVergleich = () => `${makeVergleichSide()} <?> ${makeVergleichSide()}`;

  const lines = [];
  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    lines.push(vergleich ? makeVergleich() : zeichen ? makeZeichen(op) : erg ? makeErgaenzung(op) : makeNormal(op));
  }
  return lines;
}

// Alle Aufgaben neu würfeln.
function arithDoGenerate(w) {
  w.tasks = arithBuildLines(w, arithTotal(w)).join("\n");
}

// Nur die Anzahl anpassen: vorhandene Aufgaben behalten, fehlende ergänzen bzw.
// überzählige abschneiden (z.B. beim Hinzufügen eines Päckchens).
function arithResize(w) {
  const total = arithTotal(w);
  let lines = (w.tasks || '').split('\n').map(t => t.trim()).filter(Boolean);
  if (lines.length > total) lines = lines.slice(0, total);
  else if (lines.length < total) lines = lines.concat(arithBuildLines(w, total - lines.length));
  w.tasks = lines.join('\n');
}

function arithGenerate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  arithDoGenerate(w);
  render(); renderProps(id);
}
