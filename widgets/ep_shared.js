// Gemeinsame Basis: Erste Päckchen & Rechenvorteil-Widgets (Kästchen-Layout)

const EP_DEFAULT_FONT = "'Arial', sans-serif";

// Defaults: Größe Mittel, Ausrichtung Block; cols = volle Zeile bei Portrait/Mittel
// (flexDistribute-Schätzung: contentW 640 − 18 Pad, packW+gap bei S=1.2).
const EP_DEFAULTS = {
  erste_paketchen: { cols: 3, groesse: 'mittel' },
  ep_zehner_stop:  { cols: 2, aufgabenProPaeckchen: 1, groesse: 'mittel' },
  ep_analogie:     { cols: 3, groesse: 'mittel', aufgabenProPaeckchen: 3 },
  ep_zerlegung:    { cols: 4, groesse: 'mittel', aufgabenProPaeckchen: 1, zahlenraum: 10, immerZehn: false },
  ep_umkehr:       { cols: 3, groesse: 'mittel', aufgabenProPaeckchen: 1 },
};

const EP_PAIR_TYPES = new Set(['ep_umkehr', 'ep_zehner_stop', 'ep_analogie', 'ep_zerlegung']);

function epTotal(w) {
  return (w.aufgabenProPaeckchen || 4) * (w.cols || 2);
}

function epClampZr(w) {
  let zr = Math.min(100, Math.max(10, +w.zahlenraum || 20));
  if (w.type === 'ep_zehner_stop' && zr === 10) zr = 20;
  if (w.type === 'ep_analogie') zr = 20;
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

function epBuildAnalogiePair(w) {
  const pool = (w.ops || ['+', '-']).filter(o => o === '+' || o === '-');
  const ops = pool.length ? pool : ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, tries = 0;
  do {
    tries++;
    if (op === '+') {
      a = Math.floor(Math.random() * 8) + 1;
      b = Math.floor(Math.random() * (9 - a)) + 1;
      if (a + 10 + b > 20) continue;
    } else {
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * (a - 1)) + 1;
    }
    break;
  } while (tries < 200);
  const a2 = a + 10;
  return [`${a} ${op} ${b} =`, `${a2} ${op} ${b} =`];
}

function epBuildZerlegPair(w) {
  let n;
  if (w.immerZehn) {
    n = 10;
  } else {
    const zr = epGenZr(w.zahlenraum || 20);
    n = Math.floor(Math.random() * (zr - 1)) + 2;
  }
  const part1 = Math.floor(Math.random() * (n - 1)) + 1;
  const part2 = n - part1;
  const line2 = Math.random() < 0.5 ? `${part1} _` : `_ ${part2}`;
  return [`${n}`, line2];
}

function epBuildPairFor(w) {
  switch (w.type) {
    case 'ep_umkehr': return epBuildUmkehrPair(w);
    case 'ep_zehner_stop': return epBuildZehnerStopPair(w);
    case 'ep_analogie': return epBuildAnalogiePair(w);
    case 'ep_zerlegung': return epBuildZerlegPair(w);
    default: return [];
  }
}

function epDoGenerate(w) {
  epClampZr(w);
  const total = epTotal(w);
  if (EP_PAIR_TYPES.has(w.type)) {
    const lines = [];
    for (let i = 0; i < total; i++) lines.push(...epBuildPairFor(w));
    w.tasks = lines.join('\n');
  } else {
    w.tasks = arithBuildLines(epForGen(w), total).join('\n');
  }
}

function epResize(w) {
  epClampZr(w);
  const total = epTotal(w);
  let lines = (w.tasks || '').split('\n').map(t => t.trim()).filter(Boolean);
  if (EP_PAIR_TYPES.has(w.type)) {
    const pairCount = Math.ceil(lines.length / 2);
    if (pairCount > total) lines = lines.slice(0, total * 2);
    else if (pairCount < total) {
      for (let i = pairCount; i < total; i++) lines.push(...epBuildPairFor(w));
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

function epSetErgaenzung(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const prev = !!w.ergaenzung;
  w.ergaenzung = val;
  if (val) w.luecke = w.luecke || 'erste';
  const hasTasks = !!(w.tasks || '').trim();
  if (hasTasks && !prev && val) {
    w.tasks = arithConvertNormalToErgaenzung(w.tasks, w.luecke || 'erste');
    render(); renderProps(id);
    return;
  }
  if (hasTasks && prev && !val) {
    w.tasks = arithConvertErgaenzungToNormal(w.tasks);
    render(); renderProps(id);
    return;
  }
  epGenerate(id);
}

function epSetImmerZehn(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.immerZehn = val;
  epDoGenerate(w);
  render(); renderProps(id);
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

function epParseZerlegLine1(task) {
  const m = String(task).trim().match(/^(\d+)$/);
  return m ? { n: m[1] } : null;
}

function epParseZerlegLine2(task) {
  const s = String(task).trim();
  let m = s.match(/^(\d+)\s*\+?\s*_\s*=?$/);
  if (m) return { part1: m[1], part2: '_', miss1: false, miss2: true };
  m = s.match(/^_\s*\+?\s*(\d+)\s*=?$/);
  if (m) return { part1: '_', part2: m[1], miss1: true, miss2: false };
  m = s.match(/^(\d+)\s*\+\s*(\d+)\s*=?$/);
  if (m) return { part1: m[1], part2: m[2], miss1: false, miss2: false };
  return null;
}

function epParseZerlegPairs(lines) {
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (i + 1 < lines.length) {
      const row1 = epParseZerlegLine1(lines[i]);
      const row2 = epParseZerlegLine2(lines[i + 1]);
      if (row1 && row2) pairs.push({ row1, row2 });
    }
  }
  return pairs;
}

function epParseSimplePairs(lines) {
  const pairs = [];
  for (let i = 0; i < lines.length; i += 2) {
    if (i + 1 < lines.length) {
      pairs.push({ row1: epParse(lines[i]), row2: epParse(lines[i + 1]) });
    }
  }
  return pairs;
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

function epBaseData(id, type) {
  return {
    id, type,
    tasks: '',
    cols: 2,
    zahlenraum: 20,
    ueberschreitung: 'ohne',
    aufgabenProPaeckchen: 4,
    ops: ['+', '-'],
    ergaenzung: false,
    luecke: 'erste',
    showLoesungen: false,
    grauBeschreiben: true,
    hilfe: true,
    font: EP_DEFAULT_FONT,
    bold: false,
    groesse: 'mittel',
    itemsPerRow: 'auto',
    align: 'auto',
    itemGapH: 'normal',
    itemGapV: 'normal',
    itemGap: 'normal',
    aufgabenNr: 0, aufgabenText: '',
    punkte: 0, punkteEinheit: 'Pkt.', // Punktetext unten rechts (ptHtml), 0 = aus
  };
}

function epBuildCtx(d) {
  const isActive = widgetIsActive(d);
  const S = d.groesse === 'gross' ? 1.4 : d.groesse === 'mittel' ? 1.2 : 1;
  const px = v => Math.round(v * S);
  const FS = px(17);
  const SQ = px(32);
  const FF = d.font || EP_DEFAULT_FONT;
  const FW = d.bold ? 700 : 400;
  const GAP = (d.type === 'ep_zehner_stop' || d.type === 'erste_paketchen') ? px(19) : px(22);
  const ROW_GAP = px(14);
  const PAIR_GAP = px(30);
  const SPLIT_W = SQ * 2 + GAP;
  const zehnerPackW = SQ * 4 + GAP * 3;
  const normalPackW = SQ * 3 + GAP * 2;
  const zerlegPackW = SPLIT_W;
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
  const centerSlot = innerSq =>
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:${SPLIT_W}px;height:${SQ}px;flex:0 0 ${SPLIT_W}px;">${innerSq}</span>`;
  const wideSlot = innerSq =>
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:${SPLIT_W}px;height:${SQ}px;flex:0 0 ${SPLIT_W}px;">${innerSq}</span>`;
  const splitPair = (p1Sq, p2Sq) =>
    `<span style="display:inline-flex;align-items:center;height:${SQ}px;flex:0 0 ${SPLIT_W}px;">${p1Sq}${midSlot('+')}${p2Sq}</span>`;
  const stopRow1 = (leftSq, rightSq, ansSq) =>
    `<div style="display:flex;align-items:center;height:${SQ}px;line-height:0;">${leftSq}${midSlot('+')}${wideSlot(rightSq)}${midSlot('=')}${ansSq}</div>`;
  const stopRow2 = (leftSq, p1Sq, p2Sq, ansSq) =>
    `<div style="display:flex;align-items:center;height:${SQ}px;line-height:0;">${leftSq}${midSlot('+')}${splitPair(p1Sq, p2Sq)}${midSlot('=')}${ansSq}</div>`;
  const epArrow = (arrId, x1, y1, x2, y2, w, pairH) =>
    `<svg style="position:absolute;left:0;top:0;width:${w}px;height:${pairH}px;pointer-events:none;overflow:visible;" xmlns="http://www.w3.org/2000/svg">`
    + `<defs><marker id="${arrId}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">`
    + `<path d="M0,0 L6,3 L0,6 Z" fill="#666"/></marker></defs>`
    + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="1.5" marker-end="url(#${arrId})"/>`
    + `</svg>`;

  return {
    isActive, px, FS, SQ, FF, FW, GAP, ROW_GAP, PAIR_GAP, SPLIT_W,
    zehnerPackW, normalPackW, zerlegPackW, writeBg,
    sqEmpty, sqVal, sqHint, sqGap, midSlot, taskRow, centerSlot, wideSlot,
    splitPair, stopRow1, stopRow2, epArrow,
    tdBase: `padding:${px(3)}px 0;font-family:${FF};font-weight:${FW};vertical-align:middle;white-space:nowrap;`,
    zerlegPairGap: px(20),
    packW: d.type === 'ep_zehner_stop' ? zehnerPackW
      : d.type === 'ep_zerlegung' ? zerlegPackW : normalPackW,
  };
}

function epCollectAnswers(d, parsed, pairs, c) {
  const answers = [];
  if (d.type === 'ep_umkehr') {
    pairs.forEach(({ plus, minus }) => {
      const rv = epComputeAns(plus);
      const ra = epComputeAns(minus);
      if (rv != null) answers.push(rv);
      if (ra != null) answers.push(ra);
    });
  } else if (d.type === 'ep_zehner_stop') {
    pairs.forEach(({ row1, row2 }) => {
      const rv = epComputeAns(row1);
      if (rv != null) answers.push(rv);
      if (row2) { answers.push(row2.part1); answers.push(row2.part2); }
    });
  } else if (d.type === 'ep_analogie') {
    pairs.forEach(({ row1, row2 }) => {
      const r1 = epComputeAns(row1);
      const r2 = epComputeAns(row2);
      if (r1 != null) answers.push(r1);
      if (r2 != null) answers.push(r2);
    });
  } else if (d.type === 'ep_zerlegung') {
    pairs.forEach(({ row1, row2 }) => {
      const n = +row1.n;
      if (row2.miss1) answers.push(String(n - (+row2.part2)));
      if (row2.miss2) answers.push(String(n - (+row2.part1)));
    });
  } else {
    parsed.forEach(p => {
      if (p.raw !== undefined) return;
      const ans = epComputeAns(p);
      if (ans != null && Number.isInteger(+ans)) answers.push(ans);
    });
  }
  return answers;
}

function epRender(d) {
  const c = epBuildCtx(d);
  const numCols = d.cols || 2;
  const lines = (d.tasks || '').split('\n').map(t => t.trim()).filter(Boolean);
  const pairMode = EP_PAIR_TYPES.has(d.type);
  const parsed = pairMode ? null : lines.map(epParse);
  const pairs = d.type === 'ep_umkehr' ? epParsePairs(lines, false)
    : d.type === 'ep_zehner_stop' ? epParsePairs(lines, true)
    : d.type === 'ep_analogie' ? epParseSimplePairs(lines)
    : d.type === 'ep_zerlegung' ? epParseZerlegPairs(lines) : null;

  const perCol = pairMode
    ? Math.ceil((pairs.length || 1) / numCols)
    : Math.ceil((parsed.length || 1) / numCols);
  const groups = pairMode
    ? Array.from({ length: numCols }, (_, i) => pairs.slice(i * perCol, (i + 1) * perCol)).filter(g => g.length)
    : Array.from({ length: numCols }, (_, i) => parsed.slice(i * perCol, (i + 1) * perCol)).filter(g => g.length);

  const shuffled = mcShuffled(epCollectAnswers(d, parsed, pairs, c), d.id);

  const renderUmkehrPair = (pair, idx) => {
    const { plus, minus } = pair;
    const rv = epComputeAns(plus);
    const ra = epComputeAns(minus);
    const row1 = c.taskRow(c.sqVal(plus.left), '+', c.sqVal(plus.right), c.isActive && rv ? c.sqVal(rv, true) : c.sqEmpty);
    const row2 = c.taskRow(
      c.isActive && rv ? c.sqVal(rv, true) : c.sqEmpty,
      '-', c.sqVal(minus.right), c.isActive && ra ? c.sqVal(ra, true) : c.sqEmpty
    );
    const pairH = c.SQ + c.ROW_GAP + c.SQ;
    const arrow = c.epArrow(`ep-arr-${d.id}-${idx}`, 2 * (c.SQ + c.GAP) + c.SQ / 2, c.SQ, c.SQ / 2, c.SQ + c.ROW_GAP, c.packW, pairH);
    return `<div style="position:relative;width:${c.packW}px;line-height:0;">`
      + `${row1}<div style="height:${c.ROW_GAP}px;"></div>${row2}${arrow}</div>`;
  };

  const renderZehnerStopPair = (pair, idx, pairIdx) => {
    const { row1, row2 } = pair;
    if (!row2) return '';
    const rv = epComputeAns(row1) || epComputeStopAns(row2);
    const ansSq = c.isActive && rv ? c.sqVal(rv, true) : c.sqEmpty;
    const hilfe = d.hilfe !== false;
    const decompSq = (part, val) => {
      const showHint = hilfe && (pairIdx === 0 || (pairIdx === 1 && part === 1));
      if (showHint) return c.sqHint(val);
      if (c.isActive) return c.sqVal(val, true);
      return c.sqEmpty;
    };
    const row1Html = c.stopRow1(c.sqVal(row1.left), c.sqVal(row1.right), ansSq);
    const row2Html = c.stopRow2(c.sqVal(row2.left), decompSq(1, row2.part1), decompSq(2, row2.part2), ansSq);
    const pairH = c.SQ + c.ROW_GAP + c.SQ;
    const splitL = c.SQ + c.GAP;
    const rightCx = splitL + c.SPLIT_W / 2;
    const p1Cx = splitL + c.SQ / 2;
    const p2Cx = splitL + c.SQ + c.GAP + c.SQ / 2;
    const arrow1 = c.epArrow(`ep-arr-${d.id}-${idx}-a`, rightCx, c.SQ, p1Cx, c.SQ + c.ROW_GAP, c.packW, pairH);
    const arrow2 = c.epArrow(`ep-arr-${d.id}-${idx}-b`, rightCx, c.SQ, p2Cx, c.SQ + c.ROW_GAP, c.packW, pairH);
    return `<div style="position:relative;width:${c.packW}px;line-height:0;">`
      + `${row1Html}<div style="height:${c.ROW_GAP}px;"></div>${row2Html}${arrow1}${arrow2}</div>`;
  };

  const renderZerlegPair = (pair, idx, pairIdx) => {
    const { row1, row2 } = pair;
    const n = +row1.n;
    const p1 = row2.part1 === '_' ? null : +row2.part1;
    const p2 = row2.part2 === '_' ? null : +row2.part2;
    const val1 = row2.miss1 ? n - p2 : p1;
    const val2 = row2.miss2 ? n - p1 : p2;
    const hilfe = d.hilfe !== false;
    const partSq = (isMissing, val) => {
      if (!isMissing) return c.sqVal(val);
      if (hilfe && pairIdx === 0) return c.sqHint(val);
      if (c.isActive) return c.sqVal(val, true);
      return c.sqEmpty;
    };
    const row1Html = `<div style="display:flex;align-items:center;justify-content:center;height:${c.SQ}px;line-height:0;">`
      + `${c.centerSlot(c.sqVal(row1.n))}</div>`;
    const row2Html = `<div style="display:flex;align-items:center;justify-content:center;height:${c.SQ}px;line-height:0;">`
      + `${c.splitPair(partSq(row2.miss1, val1), partSq(row2.miss2, val2))}</div>`;
    const pairH = c.SQ + c.ROW_GAP + c.SQ;
    const topCx = c.SPLIT_W / 2;
    const p1Cx = c.SQ / 2;
    const p2Cx = c.SQ + c.GAP + c.SQ / 2;
    const arrow1 = c.epArrow(`ep-arr-${d.id}-${idx}-a`, topCx, c.SQ, p1Cx, c.SQ + c.ROW_GAP, c.zerlegPackW, pairH);
    const arrow2 = c.epArrow(`ep-arr-${d.id}-${idx}-b`, topCx, c.SQ, p2Cx, c.SQ + c.ROW_GAP, c.zerlegPackW, pairH);
    return `<div style="position:relative;width:${c.zerlegPackW}px;line-height:0;">`
      + `${row1Html}<div style="height:${c.ROW_GAP}px;"></div>${row2Html}${arrow1}${arrow2}</div>`;
  };

  const renderAnalogiePair = (pair) => {
    const { row1, row2 } = pair;
    const r1 = epComputeAns(row1);
    const r2 = epComputeAns(row2);
    const row1Html = c.taskRow(c.sqVal(row1.left), row1.op, c.sqVal(row1.right), c.isActive && r1 ? c.sqVal(r1, true) : c.sqEmpty);
    const row2Html = c.taskRow(c.sqVal(row2.left), row2.op, c.sqVal(row2.right), c.isActive && r2 ? c.sqVal(r2, true) : c.sqEmpty);
    return `<div style="width:${c.packW}px;line-height:0;">`
      + `${row1Html}<div style="height:${c.ROW_GAP}px;"></div>${row2Html}</div>`;
  };

  const renderGroup = (group, gIdx = 0) => {
    if (d.type === 'ep_umkehr') {
      const items = group.map((pair, i) => renderUmkehrPair(pair, `${gIdx}-${i}`)).join('');
      return `<div style="display:flex;flex-direction:column;gap:${c.PAIR_GAP}px;line-height:0;">${items}</div>`;
    }
    if (d.type === 'ep_zehner_stop') {
      const items = group.map((pair, i) => renderZehnerStopPair(pair, `${gIdx}-${i}`, gIdx * perCol + i)).join('');
      return `<div style="display:flex;flex-direction:column;gap:${c.PAIR_GAP}px;line-height:0;">${items}</div>`;
    }
    if (d.type === 'ep_analogie') {
      const items = group.map(pair => renderAnalogiePair(pair)).join('');
      return `<div style="display:flex;flex-direction:column;gap:${c.PAIR_GAP}px;line-height:0;">${items}</div>`;
    }
    if (d.type === 'ep_zerlegung') {
      const items = group.map((pair, i) => renderZerlegPair(pair, `${gIdx}-${i}`, gIdx * perCol + i)).join('');
      return `<div style="display:flex;flex-direction:column;gap:${c.zerlegPairGap}px;line-height:0;">${items}</div>`;
    }
    const rows = group.map(p => {
      if (p.raw !== undefined) {
        const ans = p.hasEq ? (c.isActive ? c.sqVal(epComputeAns(p) ?? '?', true) : c.sqEmpty) : '';
        return `<div style="${c.tdBase}font-size:${c.FS}px;">${esc(p.raw)}${p.hasEq ? c.midSlot('=') + ans : ''}</div>`;
      }
      const gapAns = (p.left === '_' || p.right === '_') ? epComputeAns(p) : null;
      if (p.result !== null) {
        return c.taskRow(
          p.left === '_' ? c.sqGap(gapAns) : c.sqVal(p.left),
          p.op,
          p.right === '_' ? c.sqGap(gapAns) : c.sqVal(p.right),
          c.sqVal(p.result)
        );
      }
      const ans = epComputeAns(p);
      return c.taskRow(c.sqVal(p.left), p.op, c.sqVal(p.right), c.isActive && ans ? c.sqVal(ans, true) : c.sqEmpty);
    }).join('');
    return `<div style="display:flex;flex-direction:column;gap:${c.ROW_GAP}px;line-height:0;">${rows}</div>`;
  };

  const sample = pairMode
    ? (pairs.length ? renderGroup([pairs[0]], 0) : '')
    : (parsed.length ? renderGroup([parsed[0]]) : '');
  const tasksHtml = atHtml(d) + flexDistribute(
    groups.map((g, gi) => renderGroup(g, gi)),
    { sample, itemW: c.packW, d }
  );

  if (!d.showLoesungen || shuffled.length === 0) return tasksHtml;
  return tasksHtml + `
    <div style="margin-top:12px;border-top:1.5px dashed #ccc;padding-top:8px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px 10px;">
      ${shuffled.map(a => `<span style="font-family:${c.FF};font-size:${c.px(14)}px;font-weight:${c.FW};color:#555;">${esc(a)}</span>`).join('')}
    </div>`;
}

function epToggleBtn(d, label, active, onclick) {
  return `<button onclick="event.stopPropagation();${onclick}"
    style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active ? '#a6e3a1' : '#ddd'};
           background:${active ? '#e8fdf0' : '#fff'};font-family:inherit;font-size:11px;
           font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;
}

function epOpBtn(d, sym, label) {
  const ops = d.ops || ['+', '-'];
  const active = ops.includes(sym);
  return `<button onclick="event.stopPropagation();epToggleOp(${d.id},'${sym}')"
    style="padding:3px 8px;border-radius:4px;border:1.5px solid ${active ? '#89b4fa' : '#ddd'};
           background:${active ? '#e8f0ff' : '#fff'};font-family:inherit;font-size:13px;
           font-weight:700;cursor:pointer;color:${active ? '#1e1e2e' : '#999'};">${label}</button>`;
}

function epAnordnungBlock(d, opts = {}) {
  const showApp = opts.showApp !== false;
  const colsLabel = opts.colsLabel || 'Anzahl Päckchen';
  let html = '';
  if (showApp) {
    html += pr('Aufgaben pro Päckchen',
      `<input type="number" min="1" max="20" value="${d.aufgabenProPaeckchen || 4}" onchange="epSetLayout(${d.id},'aufgabenProPaeckchen',+this.value)">`);
  }
  html += pr(colsLabel,
    `<input type="number" min="1" max="36" value="${d.cols || 2}" onchange="epSetLayout(${d.id},'cols',+this.value)">`);
  return html;
}

function epAnordnungOpts(type) {
  if (type === 'ep_zehner_stop' || type === 'ep_zerlegung' || type === 'ep_umkehr') {
    return { showApp: false, colsLabel: 'Anzahl Aufgaben' };
  }
  return {};
}

function epGroesseBlock(d) {
  const tb = (label, active, onclick) => epToggleBtn(d, label, active, onclick);
  return `<div class="prow"><label>Größe</label>
    <div style="display:flex;gap:4px;">
      ${tb('Klein', (d.groesse || 'klein') === 'klein', `upd(${d.id},'groesse','klein')`)}
      ${tb('Mittel', d.groesse === 'mittel', `upd(${d.id},'groesse','mittel')`)}
      ${tb('Groß', d.groesse === 'gross', `upd(${d.id},'groesse','gross')`)}
    </div></div>`;
}

function epGrauBlock(d) {
  const grau = d.grauBeschreiben !== false;
  const tb = (label, active, onclick) => epToggleBtn(d, label, active, onclick);
  return `<div class="prow"><label>Beschreib-Kästchen</label>
    <div style="display:flex;gap:4px;">
      ${tb('Weiß', !grau, `upd(${d.id},'grauBeschreiben',false)`)}
      ${tb('Grau', grau, `upd(${d.id},'grauBeschreiben',true)`)}
    </div></div>`;
}

function epWuerfelBtn(d) {
  return `<button onclick="event.stopPropagation();epGenerate(${d.id})"
    style="margin-top:8px;width:100%;padding:6px;border:none;border-radius:5px;
           background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
           font-weight:700;cursor:pointer;">🎲 Aufgaben würfeln</button>`;
}

function epManualFold(d, hint) {
  const manuellBlock = pr(`Manuell bearbeiten${hint}`,
    `<textarea style="width:100%;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:80px;resize:vertical;" onchange="upd(${d.id},'tasks',this.value)">${esc(d.tasks)}</textarea>`);
  return propFold(`ep-manuell-${d.type}`, 'Manuelle Bearbeitung', manuellBlock, false);
}

function epZrSelect(d, opts) {
  const zr = d.zahlenraum || 20;
  return pr('Zahlenraum',
    `<select onchange="epSetLayout(${d.id},'zahlenraum',+this.value)">
      ${opts.map(n => `<option value="${n}" ${zr === n ? 'selected' : ''}>${n}</option>`).join('')}
    </select>`);
}

function epRenderProps(d) {
  const tb = (label, active, onclick) => epToggleBtn(d, label, active, onclick);
  const zr = d.zahlenraum || 20;
  const ueMode = d.ueberschreitung === true ? 'gemischt'
    : (d.ueberschreitung === false || d.ueberschreitung == null) ? 'ohne' : d.ueberschreitung;
  const hilfe = d.hilfe !== false;
  let top = '', manual = '', hilfeBlock = '';

  if (d.type === 'erste_paketchen') {
    const erg = d.ergaenzung || false;
    const luecke = d.luecke || 'erste';
    top = `<div class="prow"><label>Modus</label>
      <div style="display:flex;gap:4px;">
        ${tb('Rechenaufgaben', !erg, `epSetErgaenzung(${d.id},false)`)}
        ${tb('Ergänzung', erg, `epSetErgaenzung(${d.id},true)`)}
      </div></div>`
      + (erg ? `<div class="prow"><label>Lücke</label>
        <div style="display:flex;gap:4px;">
          ${tb('1. Zahl', luecke === 'erste', `epSetLuecke(${d.id},'erste')`)}
          ${tb('2. Zahl', luecke === 'zweite', `epSetLuecke(${d.id},'zweite')`)}
          ${tb('Zufall', luecke === 'zufall', `epSetLuecke(${d.id},'zufall')`)}
        </div></div>` : '')
      + `<div class="prow"><label>Rechenzeichen</label>
        <div style="display:flex;gap:4px;margin-top:2px;">
          ${epOpBtn(d, '+', '+')}${epOpBtn(d, '-', '−')}
        </div></div>`
      + epZrSelect(d, [10, 20, 100])
      + `<div class="prow"><label>Zehnerübergang</label>
        <div style="display:flex;gap:4px;">
          ${tb('Ohne', ueMode === 'ohne', `epSetLayout(${d.id},'ueberschreitung','ohne')`)}
          ${tb('Gemischt', ueMode === 'gemischt', `epSetLayout(${d.id},'ueberschreitung','gemischt')`)}
          ${tb('Nur mit', ueMode === 'nur', `epSetLayout(${d.id},'ueberschreitung','nur')`)}
        </div></div>`;
    manual = erg ? ' (_ = Lücke, z.B. 3 + _ = 10)' : '';
  }

  if (d.type === 'ep_zehner_stop') {
    top = epZrSelect(d, [20, 100]);
    hilfeBlock = `<div class="prow"><label>Hilfe</label>
      <div style="display:flex;gap:4px;">
        ${tb('Aus', !hilfe, `upd(${d.id},'hilfe',false)`)}
        ${tb('An', hilfe, `upd(${d.id},'hilfe',true)`)}
      </div>
      <div style="font-size:10px;color:#888;margin-top:3px;">1. Aufgabe: beide Teile · 2.: nur 1. Teil · ab 3.: leer</div></div>`;
    manual = ' (je 2 Zeilen: a+b=, dann a+teil1+teil2=)';
  }

  if (d.type === 'ep_analogie') {
    top = `<div class="prow"><label>Rechenzeichen</label>
      <div style="display:flex;gap:4px;margin-top:2px;">
        ${epOpBtn(d, '+', '+')}${epOpBtn(d, '-', '−')}
      </div></div>`;
    manual = ' (je 2 Zeilen: ohne Zehner, dann mit Zehner, z.B. 4-3=, 14-3=)';
  }

  if (d.type === 'ep_zerlegung') {
    const immerZehn = !!d.immerZehn;
    top = epZrSelect(d, [10, 20, 100])
      + `<div class="prow"><label>Immer 10</label>
        <div style="display:flex;gap:4px;">
          ${tb('Aus', !immerZehn, `epSetImmerZehn(${d.id},false)`)}
          ${tb('An', immerZehn, `epSetImmerZehn(${d.id},true)`)}
        </div></div>`;
    hilfeBlock = `<div class="prow"><label>Hilfe</label>
      <div style="display:flex;gap:4px;">
        ${tb('Aus', !hilfe, `upd(${d.id},'hilfe',false)`)}
        ${tb('An', hilfe, `upd(${d.id},'hilfe',true)`)}
      </div>
      <div style="font-size:10px;color:#888;margin-top:3px;">1. Aufgabe: fehlender Teil · ab 2.: leer</div></div>`;
    manual = ' (je 2 Zeilen: Zahl, dann Teile, z.B. 8 / 3 _)';
  }

  if (d.type === 'ep_umkehr') {
    manual = ' (je 2 Zeilen: Plus, dann Minus)';
  }

  return top + epAnordnungBlock(d, epAnordnungOpts(d.type)) + epGroesseBlock(d)
    + epGrauBlock(d) + hilfeBlock
    + epWuerfelBtn(d) + epManualFold(d, manual);
}

function epMakeWidget(meta) {
  return {
    meta,
    createData: id => {
      const w = { ...epBaseData(id, meta.type), ...(EP_DEFAULTS[meta.type] || {}) };
      epDoGenerate(w);
      return w;
    },
    render: epRender,
    renderProps: epRenderProps,
  };
}

const EP_GROUP = 'ep_kaestchen';

WIDGETS.push(epMakeWidget({
  type: 'erste_paketchen', group: EP_GROUP, itemsLayout: true,
  label: 'Erste Päckchen', desc: 'Plus & Minus in Kästchen, als Päckchen', icon: '📦', category: 'mathematik',
}));
WIDGETS.push(epMakeWidget({
  type: 'ep_zehner_stop', group: EP_GROUP, itemsLayout: true,
  label: '10er Stop', desc: 'Zehnerübergang mit Zerlegung', icon: '🔟', category: 'mathematik',
}));
WIDGETS.push(epMakeWidget({
  type: 'ep_analogie', group: EP_GROUP, itemsLayout: true,
  label: 'Analogieaufgaben', desc: 'Ohne und mit Zehner', icon: '↔️', category: 'mathematik',
}));
WIDGETS.push(epMakeWidget({
  type: 'ep_zerlegung', group: EP_GROUP, itemsLayout: true,
  label: 'Zahlenzerlegung', desc: 'Zahl in zwei Teile zerlegen', icon: '✂️', category: 'mathematik',
}));
WIDGETS.push(epMakeWidget({
  type: 'ep_umkehr', group: EP_GROUP, itemsLayout: true,
  label: 'Umkehraufgabe', desc: 'Plus- und Minus-Umkehr', icon: '🔄', category: 'mathematik',
}));
