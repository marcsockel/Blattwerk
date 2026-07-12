// Widget: Erste Paketchen — Rechenaufgaben ZR ≤ 20, alle Zahlen in quadratischen Kästchen

function epTotal(w) {
  return (w.aufgabenProPaeckchen || 4) * (w.cols || 2);
}

function epClampZr(w) {
  let zr = Math.min(100, Math.max(10, +w.zahlenraum || 20));
  if (w.zehnerStop && zr === 10) zr = 20;
  w.zahlenraum = zr;
}

function epGenZr(zr) {
  zr = +zr || 20;
  return zr === 100 ? 99 : zr;
}

function epForGen(w) {
  return { ...w, zahlenraum: epGenZr(w.zahlenraum) };
}

function epBuildUmkehrPair(w) {
  const tmp = { ...epForGen(w), ops: ['+'], ergaenzung: false, zeichen: false, vergleich: false };
  const line = arithBuildLines(tmp, 1)[0];
  const p = epParse(line);
  const a = +p.left, b = +p.right;
  const c = a + b;
  return [`${a} + ${b} =`, `${c} - ${b} =`];
}

function epBuildZehnerStopPair(w) {
  const zr = epGenZr(w.zahlenraum || 20);
  let a, b, tries = 0;
  do {
    tries++;
    a = Math.floor(Math.random() * (zr - 1)) + 1;
    b = Math.floor(Math.random() * (zr - a)) + 1;
    const onesA = a % 10;
    if (onesA + (b % 10) < 10) continue;
    const part1 = 10 - onesA;
    if (part1 <= 0 || b <= part1) continue;
    break;
  } while (tries < 200);
  const part1 = 10 - (a % 10);
  const part2 = b - part1;
  return [`${a} + ${b} =`, `${a} + ${part1} + ${part2} =`];
}

function epIsPairMode(w) {
  return !!(w.umkehr || w.zehnerStop);
}

function epBuildPair(w) {
  if (w.umkehr) return epBuildUmkehrPair(w);
  if (w.zehnerStop) return epBuildZehnerStopPair(w);
  return [];
}

function epDoGenerate(w) {
  epClampZr(w);
  const total = epTotal(w);
  if (epIsPairMode(w)) {
    const lines = [];
    for (let i = 0; i < total; i++) lines.push(...epBuildPair(w));
    w.tasks = lines.join('\n');
  } else {
    w.tasks = arithBuildLines(epForGen(w), total).join('\n');
  }
}

function epResize(w) {
  epClampZr(w);
  const total = epTotal(w);
  let lines = (w.tasks || '').split('\n').map(t => t.trim()).filter(Boolean);
  if (epIsPairMode(w)) {
    const pairCount = Math.ceil(lines.length / 2);
    if (pairCount > total) lines = lines.slice(0, total * 2);
    else if (pairCount < total) {
      for (let i = pairCount; i < total; i++) lines.push(...epBuildPair(w));
    }
  } else {
    if (lines.length > total) lines = lines.slice(0, total);
    else if (lines.length < total) lines = lines.concat(arithBuildLines(epForGen(w), total - lines.length));
  }
  w.tasks = lines.join('\n');
}

function epGenerate(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  epDoGenerate(w);
  render(); renderProps(id);
}

function epSetLayout(id, key, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = value;
  if (key === 'cols' || key === 'aufgabenProPaeckchen') {
    epResize(w);
    render(); renderProps(id);
  } else {
    epGenerate(id);
  }
}

function epToggleOp(id, sym) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const ops = (w.ops || ['+', '-']).slice();
  const idx = ops.indexOf(sym);
  if (idx >= 0) { if (ops.length > 1) ops.splice(idx, 1); }
  else ops.push(sym);
  w.ops = ops;
  epDoGenerate(w);
  render(); renderProps(id);
}

function epGetModus(w) {
  if (w.umkehr) return 'umkehr';
  if (w.zehnerStop) return 'zehnerStop';
  if (w.ergaenzung) return 'ergaenzung';
  return 'normal';
}

function epSetModus(id, modus) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const prev = epGetModus(w);
  w.ergaenzung = modus === 'ergaenzung';
  w.umkehr = modus === 'umkehr';
  w.zehnerStop = modus === 'zehnerStop';
  w.zeichen = false;
  w.vergleich = false;
  if (modus === 'zehnerStop' && w.zahlenraum === 10) w.zahlenraum = 20;
  if (modus === 'ergaenzung') w.luecke = w.luecke || 'erste';

  const hasTasks = !!(w.tasks || '').trim();
  if (hasTasks && prev === 'normal' && modus === 'ergaenzung') {
    w.tasks = arithConvertNormalToErgaenzung(w.tasks, w.luecke || 'erste');
    render(); renderProps(id);
    return;
  }
  if (hasTasks && prev === 'ergaenzung' && modus === 'normal') {
    w.tasks = arithConvertErgaenzungToNormal(w.tasks);
    render(); renderProps(id);
    return;
  }
  epGenerate(id);
}

function epSetLuecke(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.luecke = val;
  epGenerate(id);
}

function epParse(task) {
  const norm = task.replace(/[×*]/g, '·').replace(/[÷]/g, ':');
  const mErg = norm.match(/^(-?\d+|_)\s*([+\-·:])\s*(-?\d+|_)\s*=\s*(-?\d+)$/);
  if (mErg) return { left: mErg[1], op: mErg[2], right: mErg[3], result: mErg[4] };
  const hasEq = norm.trimEnd().endsWith('=');
  const core = hasEq ? norm.slice(0, norm.lastIndexOf('=')).trim() : norm.trim();
  const mNorm = core.match(/^(-?\d+(?:[.,]\d+)?)\s*([+\-·:])\s*(-?\d+(?:[.,]\d+)?)$/);
  if (mNorm) return { left: mNorm[1], op: mNorm[2], right: mNorm[3], result: null, hasEq };
  return { raw: norm.replace(/\s*=\s*$/, ''), hasEq };
}

function epParseStopLine(task) {
  const m = task.trim().match(/^(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=$/);
  if (m) return { left: m[1], part1: m[2], part2: m[3], hasEq: true };
  return null;
}

function epParsePairs(lines, stop = false) {
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (i + 1 < lines.length) {
      if (stop) pairs.push({ row1: epParse(lines[i]), row2: epParseStopLine(lines[i + 1]) });
      else pairs.push({ plus: epParse(lines[i]), minus: epParse(lines[i + 1]) });
    }
  }
  return pairs;
}

function epComputeStopAns(p) {
  if (!p || !p.hasEq) return null;
  const ans = (+p.left) + (+p.part1) + (+p.part2);
  return isFinite(ans) ? String(ans) : null;
}

function epComputeAns(p) {
  if (p.result !== null) {
    const l = p.left === '_' ? null : +p.left;
    const r = p.right === '_' ? null : +p.right;
    const res = +p.result;
    let ans;
    if (p.left === '_') {
      if (p.op === '+') ans = res - r;
      else if (p.op === '-') ans = res + r;
      else if (p.op === '·') ans = res / r;
      else ans = res * r;
    } else {
      if (p.op === '+') ans = res - l;
      else if (p.op === '-') ans = l - res;
      else if (p.op === '·') ans = res / l;
      else ans = l / res;
    }
    return isFinite(ans) ? String(ans) : null;
  }
  if (p.hasEq) {
    const l = +p.left, r = +p.right;
    let ans;
    if (p.op === '+') ans = l + r;
    else if (p.op === '-') ans = l - r;
    else if (p.op === '·') ans = l * r;
    else ans = l / r;
    return isFinite(ans) ? String(ans) : null;
  }
  return null;
}

WIDGETS.push({
  meta: { type: 'erste_paketchen', label: 'Erste Paketchen', desc: 'Kopfrechnen ZR 20, Zahlen in Kästchen', icon: '📦', category: 'mathematik' },

  createData: id => {
    const w = {
      id, type: 'erste_paketchen',
      tasks: '',
      cols: 2,
      zahlenraum: 20,
      ueberschreitung: 'ohne',
      aufgabenProPaeckchen: 4,
      ops: ['+', '-'],
      ergaenzung: false,
      umkehr: false,
      zehnerStop: false,
      luecke: 'erste',
      showLoesungen: false,
      grauBeschreiben: true,
      hilfe: true,
      font: "'DidactGothic7', sans-serif",
      bold: false,
      groesse: 'klein',
      aufgabenNr: 0, aufgabenText: '',
    };
    epDoGenerate(w);
    return w;
  },

  render: d => {
    const isActive = widgetIsActive(d);
    const numCols = d.cols || 2;
    const allTasks = (d.tasks || '').split('\n').map(t => t.trim()).filter(Boolean);
    const S = d.groesse === 'gross' ? 1.4 : d.groesse === 'mittel' ? 1.2 : 1;
    const px = v => Math.round(v * S);
    const FS = px(17);
    const SQ = px(32);
    const FF = d.font || "'DidactGothic7', sans-serif";
    const FW = d.bold ? 700 : 400;
    const tdBase = `padding:${px(3)}px 0;font-family:${FF};font-weight:${FW};vertical-align:middle;white-space:nowrap;`;

    const GAP = px(22);
    const ROW_GAP = px(14);
    const PAIR_GAP = px(30);
    const PACK_GAP = px(44);
    const zehnerStopMode = !!d.zehnerStop;
    const SPLIT_W = SQ * 2 + GAP;
    const packW = zehnerStopMode ? SQ * 4 + GAP * 3 : SQ * 3 + GAP * 2;
    const writeBg = d.grauBeschreiben !== false ? '#ececec' : '#fff';
    const sqBoxStyle = bg =>
      `display:inline-flex;align-items:center;justify-content:center;width:${SQ}px;height:${SQ}px;border:1.5px solid #999;border-radius:2px;background:${bg};flex:0 0 ${SQ}px;`;
    const sqEmpty = `<span style="${sqBoxStyle(writeBg)}"></span>`;
    const numInner = v => {
      const digits = String(v).split('');
      if (digits.length < 2) return esc(String(v));
      return `<span style="display:inline-flex;align-items:center;gap:${px(2.5)}px;">`
        + digits.map(c => `<span>${esc(c)}</span>`).join('')
        + `</span>`;
    };
    const sqVal = (v, blue = false) => {
      const col = blue ? '#2563eb' : '#1e1e2e';
      return `<span style="${sqBoxStyle('#fff')}font-family:${FF};font-size:${FS}px;font-weight:${FW};color:${col};">${numInner(v)}</span>`;
    };
    const sqHint = v =>
      `<span style="${sqBoxStyle('#ececec')}font-family:${FF};font-size:${FS}px;font-weight:${FW};color:#1e1e2e;">${numInner(v)}</span>`;
    const sqGap = ans => (isActive && ans != null) ? sqVal(ans, true) : sqEmpty;
    const midSlot = content =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:${GAP}px;height:${SQ}px;flex:0 0 ${GAP}px;font-family:${FF};font-size:${FS}px;font-weight:${FW};line-height:1;">${content}</span>`;
    const taskRow = (leftSq, op, rightSq, ansSq) =>
      `<div style="display:flex;align-items:center;height:${SQ}px;line-height:0;flex:0 0 ${SQ}px;">${leftSq}${midSlot(esc(op))}${rightSq}${midSlot('=')}${ansSq}</div>`;

    const wideSlot = innerSq =>
      `<span style="display:inline-flex;align-items:center;justify-content:center;width:${SPLIT_W}px;height:${SQ}px;flex:0 0 ${SPLIT_W}px;">${innerSq}</span>`;
    const splitPair = (p1Sq, p2Sq) =>
      `<span style="display:inline-flex;align-items:center;height:${SQ}px;flex:0 0 ${SPLIT_W}px;">${p1Sq}${midSlot('+')}${p2Sq}</span>`;
    const stopRow1 = (leftSq, rightSq, ansSq) =>
      `<div style="display:flex;align-items:center;height:${SQ}px;line-height:0;">${leftSq}${midSlot('+')}${wideSlot(rightSq)}${midSlot('=')}${ansSq}</div>`;
    const stopRow2 = (leftSq, p1Sq, p2Sq, ansSq) =>
      `<div style="display:flex;align-items:center;height:${SQ}px;line-height:0;">${leftSq}${midSlot('+')}${splitPair(p1Sq, p2Sq)}${midSlot('=')}${ansSq}</div>`;

    const umkehr = !!d.umkehr;
    const zehnerStop = zehnerStopMode;
    const pairMode = umkehr || zehnerStop;
    const lines = allTasks;
    const parsed = pairMode ? null : lines.map(epParse);
    const pairs = umkehr ? epParsePairs(lines, false)
      : zehnerStop ? epParsePairs(lines, true) : null;

    const perCol = pairMode
      ? Math.ceil((pairs.length || 1) / numCols)
      : Math.ceil((parsed.length || 1) / numCols);
    const groups = pairMode
      ? Array.from({ length: numCols }, (_, i) =>
          pairs.slice(i * perCol, (i + 1) * perCol)
        ).filter(g => g.length)
      : Array.from({ length: numCols }, (_, i) =>
          parsed.slice(i * perCol, (i + 1) * perCol)
        ).filter(g => g.length);

    const answers = [];
    if (umkehr) {
      pairs.forEach(({ plus, minus }) => {
        const c = epComputeAns(plus);
        const a = epComputeAns(minus);
        if (c != null) answers.push(c);
        if (a != null) answers.push(a);
      });
    } else if (zehnerStop) {
      pairs.forEach(({ row1, row2 }) => {
        const c = epComputeAns(row1);
        if (c != null) answers.push(c);
        if (row2) {
          answers.push(row2.part1);
          answers.push(row2.part2);
        }
      });
    } else {
      parsed.forEach(p => {
        if (p.raw !== undefined) return;
        const ans = epComputeAns(p);
        if (ans != null && Number.isInteger(+ans)) answers.push(ans);
      });
    }
    const shuffled = mcShuffled(answers, d.id);

    const epArrow = (arrId, x1, y1, x2, y2, packW, pairH) =>
      `<svg style="position:absolute;left:0;top:0;width:${packW}px;height:${pairH}px;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg">`
      + `<defs><marker id="${arrId}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">`
      + `<path d="M0,0 L6,3 L0,6 Z" fill="#666"/></marker></defs>`
      + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="1.5" marker-end="url(#${arrId})"/>`
      + `</svg>`;

    const renderUmkehrPair = (pair, idx) => {
      const { plus, minus } = pair;
      const c = epComputeAns(plus);
      const a = epComputeAns(minus);
      const b = minus.right;
      const row1 = taskRow(sqVal(plus.left), '+', sqVal(plus.right), isActive && c ? sqVal(c, true) : sqEmpty);
      const row2 = taskRow(
        isActive && c ? sqVal(c, true) : sqEmpty,
        '-', sqVal(b), isActive && a ? sqVal(a, true) : sqEmpty
      );
      const pairH = SQ + ROW_GAP + SQ;
      const x1 = 2 * (SQ + GAP) + SQ / 2;
      const y1 = SQ;
      const x2 = SQ / 2;
      const y2 = SQ + ROW_GAP;
      const arrow = epArrow(`ep-arr-${d.id}-${idx}`, x1, y1, x2, y2, packW, pairH);
      return `<div style="position:relative;width:${packW}px;line-height:0;">`
        + `${row1}<div style="height:${ROW_GAP}px;"></div>${row2}${arrow}</div>`;
    };

    const renderZehnerStopPair = (pair, idx, pairIdx) => {
      const { row1, row2 } = pair;
      if (!row2) return '';
      const c = epComputeAns(row1) || epComputeStopAns(row2);
      const ansSq = isActive && c ? sqVal(c, true) : sqEmpty;
      const hilfe = d.hilfe !== false;
      const decompSq = (part, val) => {
        const showHint = hilfe && (pairIdx === 0 || (pairIdx === 1 && part === 1));
        if (showHint) return sqHint(val);
        if (isActive) return sqVal(val, true);
        return sqEmpty;
      };
      const row1Html = stopRow1(sqVal(row1.left), sqVal(row1.right), ansSq);
      const row2Html = stopRow2(
        sqVal(row2.left),
        decompSq(1, row2.part1),
        decompSq(2, row2.part2),
        ansSq
      );
      const pairH = SQ + ROW_GAP + SQ;
      const splitL = SQ + GAP;
      const rightCx = splitL + SPLIT_W / 2;
      const p1Cx = splitL + SQ / 2;
      const p2Cx = splitL + SQ + GAP + SQ / 2;
      const y1 = SQ;
      const y2 = SQ + ROW_GAP;
      const arrow1 = epArrow(`ep-arr-${d.id}-${idx}-a`, rightCx, y1, p1Cx, y2, packW, pairH);
      const arrow2 = epArrow(`ep-arr-${d.id}-${idx}-b`, rightCx, y1, p2Cx, y2, packW, pairH);
      return `<div style="position:relative;width:${packW}px;line-height:0;">`
        + `${row1Html}<div style="height:${ROW_GAP}px;"></div>${row2Html}${arrow1}${arrow2}</div>`;
    };

    const renderGroup = (group, gIdx = 0) => {
      if (umkehr) {
        const items = group.map((pair, i) => renderUmkehrPair(pair, `${gIdx}-${i}`)).join('');
        return `<div style="display:flex;flex-direction:column;gap:${PAIR_GAP}px;line-height:0;">${items}</div>`;
      }
      if (zehnerStop) {
        const items = group.map((pair, i) =>
          renderZehnerStopPair(pair, `${gIdx}-${i}`, gIdx * perCol + i)
        ).join('');
        return `<div style="display:flex;flex-direction:column;gap:${PAIR_GAP}px;line-height:0;">${items}</div>`;
      }
      const rows = group.map(p => {
        if (p.raw !== undefined) {
          const ans = p.hasEq ? (isActive ? sqVal(epComputeAns(p) ?? '?', true) : sqEmpty) : '';
          return `<div style="${tdBase}font-size:${FS}px;">${esc(p.raw)}${p.hasEq ? midSlot('=') + ans : ''}</div>`;
        }
        const gapAns = (p.left === '_' || p.right === '_') ? epComputeAns(p) : null;
        if (p.result !== null) {
          const leftSq = p.left === '_' ? sqGap(gapAns) : sqVal(p.left);
          const rightSq = p.right === '_' ? sqGap(gapAns) : sqVal(p.right);
          return taskRow(leftSq, p.op, rightSq, sqVal(p.result));
        }
        const ans = epComputeAns(p);
        const ansSq = isActive && ans ? sqVal(ans, true) : sqEmpty;
        return taskRow(sqVal(p.left), p.op, sqVal(p.right), ansSq);
      }).join('');
      return `<div style="display:flex;flex-direction:column;gap:${ROW_GAP}px;line-height:0;">${rows}</div>`;
    };

    const sample = pairMode
      ? (pairs.length ? renderGroup([pairs[0]], 0) : '')
      : (parsed.length ? renderGroup([parsed[0]]) : '');
    const tasksHtml = atHtml(d) + flexDistribute(
      groups.map((g, gi) => renderGroup(g, gi)),
      { gap: PACK_GAP, marginBottom: px(44), sample,
        itemW: packW, d }
    );

    if (!d.showLoesungen || shuffled.length === 0) return tasksHtml;

    const loesungenHtml = `
      <div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 10px;">
        ${shuffled.map(a => `<span style="font-family:${FF};font-size:${px(14)}px;font-weight:${FW};color:#555;">${esc(a)}</span>`).join('')}
      </div>`;
    return tasksHtml + loesungenHtml;
  },

  renderProps: d => {
    const ops = d.ops || ['+', '-'];
    const zr = d.zahlenraum || 20;
    const ueMode = d.ueberschreitung === true ? 'gemischt'
      : (d.ueberschreitung === false || d.ueberschreitung == null) ? 'ohne'
      : d.ueberschreitung;
    const erg = d.ergaenzung || false;
    const umkehr = !!d.umkehr;
    const zehnerStop = !!d.zehnerStop;
    const pairMode = umkehr || zehnerStop;
    const luecke = d.luecke || 'erste';
    const grau = d.grauBeschreiben !== false;
    const hilfe = d.hilfe !== false;
    const font = d.font || "'DidactGothic7', sans-serif";
    const bold = !!d.bold;
    const fontOptions = GAP_FONTS.map(f =>
      `<option value="${f.value}" ${font === f.value ? 'selected' : ''}>${f.label}</option>`
    ).join('');

    const toggleBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
               background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;

    const opBtn = (sym, label) => {
      const active = ops.includes(sym);
      return `<button onclick="event.stopPropagation();epToggleOp(${d.id},'${sym}')"
        style="padding:3px 8px;border-radius:4px;border:1.5px solid ${active ? '#89b4fa' : '#ddd'};
               background:${active ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:13px;
               font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;
    };

    const modusBlock = `
      <div class="prow"><label>Modus</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${toggleBtn('Rechenaufgaben', !erg && !pairMode, `epSetModus(${d.id},'normal')`)}
          ${toggleBtn('Ergänzung', erg, `epSetModus(${d.id},'ergaenzung')`)}
          ${toggleBtn('Umkehraufgabe', umkehr, `epSetModus(${d.id},'umkehr')`)}
          ${toggleBtn('10er Stop', zehnerStop, `epSetModus(${d.id},'zehnerStop')`)}
        </div>
      </div>
      ${erg ? `<div class="prow"><label>Lücke</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('1. Zahl', luecke === 'erste', `epSetLuecke(${d.id},'erste')`)}
          ${toggleBtn('2. Zahl', luecke === 'zweite', `epSetLuecke(${d.id},'zweite')`)}
          ${toggleBtn('Zufall', luecke === 'zufall', `epSetLuecke(${d.id},'zufall')`)}
        </div>
      </div>` : ''}
      ${!pairMode ? `<div class="prow"><label>Rechenzeichen</label>
        <div style="display:flex;gap:4px;margin-top:2px;">
          ${opBtn('+', '+')}${opBtn('-', '−')}
        </div>
      </div>` : ''}` +
      pr('Zahlenraum',
        `<select onchange="epSetLayout(${d.id},'zahlenraum',+this.value)">
          ${(zehnerStop ? [20, 100] : [10, 20, 100]).map(n => `<option value="${n}" ${zr === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select>`) +
      (!zehnerStop ? `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Ohne', ueMode === 'ohne', `epSetLayout(${d.id},'ueberschreitung','ohne')`)}
          ${toggleBtn('Gemischt', ueMode === 'gemischt', `epSetLayout(${d.id},'ueberschreitung','gemischt')`)}
          ${toggleBtn('Nur mit', ueMode === 'nur', `epSetLayout(${d.id},'ueberschreitung','nur')`)}
        </div>
      </div>` : '');

    const anordnungBlock =
      pr('Aufgaben pro Päckchen',
        `<input type="number" min="1" max="20" value="${d.aufgabenProPaeckchen || 4}" onchange="epSetLayout(${d.id},'aufgabenProPaeckchen',+this.value)">`) +
      pr('Anzahl Päckchen',
        `<input type="number" min="1" max="36" value="${d.cols || 2}" onchange="epSetLayout(${d.id},'cols',+this.value)">`);

    const groesseBlock = `<div class="prow"><label>Größe</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Klein', (d.groesse || 'klein') === 'klein', `upd(${d.id},'groesse','klein')`)}
          ${toggleBtn('Mittel', d.groesse === 'mittel', `upd(${d.id},'groesse','mittel')`)}
          ${toggleBtn('Groß', d.groesse === 'gross', `upd(${d.id},'groesse','gross')`)}
        </div>
      </div>`;

    const grauBlock = `<div class="prow"><label>Beschreib-Kästchen</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Weiß', !grau, `upd(${d.id},'grauBeschreiben',false)`)}
          ${toggleBtn('Grau', grau, `upd(${d.id},'grauBeschreiben',true)`)}
        </div>
      </div>`;

    const hilfeBlock = zehnerStop ? `<div class="prow"><label>Hilfe (10er Stop)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Aus', !hilfe, `upd(${d.id},'hilfe',false)`)}
          ${toggleBtn('An', hilfe, `upd(${d.id},'hilfe',true)`)}
        </div>
        <div style="font-size:10px;color:#888;margin-top:3px;">1. Aufgabe: beide Teile · 2.: nur 1. Teil · ab 3.: leer (widgetweit)</div>
      </div>` : '';

    const fontBlock = pr('Schrift (Test)',
      `<select onchange="upd(${d.id},'font',this.value)">${fontOptions}</select>`) +
      `<div class="prow"><label>Fett (Test)</label>
        <div style="display:flex;gap:4px;">
          ${toggleBtn('Normal', !bold, `upd(${d.id},'bold',false)`)}
          ${toggleBtn('Fett', bold, `upd(${d.id},'bold',true)`)}
        </div>
      </div>`;

    const wuerfelBtn =
      `<button onclick="event.stopPropagation();epGenerate(${d.id})"
        style="margin-top:8px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>`;

    const manuellBlock =
      pr(`Manuell bearbeiten${erg ? ' (_ = Lücke, z.B. 3 + _ = 10)' : umkehr ? ' (je 2 Zeilen: Plus, dann Minus)' : zehnerStop ? ' (je 2 Zeilen: a+b=, dann a+teil1+teil2=)' : ''}`,
        `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;" onchange="upd(${d.id},'tasks',this.value)">${esc(d.tasks)}</textarea>`);

    return modusBlock + anordnungBlock + groesseBlock + grauBlock + hilfeBlock + fontBlock + wuerfelBtn +
      propFold('ep-manuell', 'Manuelle Bearbeitung', manuellBlock, false);
  },
});
