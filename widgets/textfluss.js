// Textfluss über Seiten: Ein Text-Widget mit fliessen:true wird bei Überlauf
// WORTWEISE geteilt statt komplett verschoben. Der Originaltext bleibt die einzige
// Datenquelle (master.html); Fortsetzungen (type:'textfluss') speichern nur
// master-Id + Sequenznummer und rendern den jeweiligen Token-Ausschnitt.
//
// Datenmodell am Master:  splits    = [tokenIdx, ...]  (aufsteigend; Teil k = [splits[k-1], splits[k]])
//                         flowLines = [zeilenTeil0, ...] (für fortlaufende Zeilennummern)
// Kette in widgets[]:     master, {pagebreak flow:true}, cont(seq1), {pagebreak flow:true}, cont(seq2), …
// Die Flow-Pagebreaks tragen flow:true (NICHT auto) → der Underflow-Zweig von
// checkOverflow zieht sie nie heraus; Auf-/Abbau macht ausschließlich dieser Code.

// ── Token-Werkzeuge ───────────────────────────────────────────────
// HTML (nur b/i/u/br aus dem richHtml-Serializer) in Tokens zerlegen.
function tfTokens(html) {
  const out = [];
  const re = /(<[^>]+>)|(\s+)|([^<\s]+)/g;
  let m;
  while ((m = re.exec(String(html || '')))) {
    out.push(m[1] ? { t: 'tag', s: m[1] } : m[2] ? { t: 'sp', s: m[2] } : { t: 'w', s: m[3] });
  }
  return out;
}

// Teilanfang normalisieren: führende Leerzeichen/<br> überspringen — sonst beginnt
// eine Fortsetzungsseite mit Leerzeile(n), wenn der Split auf ein Absatzende fällt.
function tfFlowFrom(toks, from) {
  while (from < toks.length) {
    const t = toks[from];
    if (t.t === 'sp' || (t.t === 'tag' && /^<br\s*\/?>$/i.test(t.s))) from++;
    else break;
  }
  return from;
}

// Ausschnitt [from,to) tag-sicher rendern: offene b/i/u am Anfang wieder öffnen,
// am Ende schließen.
function tfSlice(html, from, to) {
  const toks = tfTokens(html);
  from = Math.max(0, Math.min(from || 0, toks.length));
  to = to == null ? toks.length : Math.max(from, Math.min(to, toks.length));
  const stack = [];
  const apply = tok => {
    if (tok.t !== 'tag') return;
    const m = tok.s.match(/^<(\/)?(b|i|u)>$/i);
    if (!m) return;
    const tag = m[2].toLowerCase();
    if (m[1]) { const ix = stack.lastIndexOf(tag); if (ix >= 0) stack.splice(ix, 1); }
    else stack.push(tag);
  };
  for (let k = 0; k < from; k++) apply(toks[k]);
  let out = stack.map(t => `<${t}>`).join('');
  for (let k = from; k < to; k++) { out += toks[k].s; apply(toks[k]); }
  out += stack.slice().reverse().map(t => `</${t}>`).join('');
  return out;
}

// ── Gemeinsamer Text-Renderer (Master-Teil & Fortsetzungen) ───────
// lineOffset = Zeilen der vorigen Teile → Zeilennummern laufen über Seiten weiter.
function tfTextDiv(m, html, lineOffset) {
  const font = m.font || 'inherit';
  const fontSize = m.fontSize || 16;
  const align = m.align || 'left';
  const pad = m.innerPad != null ? `padding:${m.innerPad}px;` : '';
  // Blocksatz: pre-wrap unterdrückt in WebKit die Spatien-Dehnung → white-space:normal.
  // Zeilenumbrüche bleiben erhalten (der Editor speichert sie ohnehin als <br>).
  const ws = align === 'justify' ? 'normal' : 'pre-wrap';
  const textDiv = `<div data-flowtext="1" style="font-family:${font};font-size:${fontSize}px;line-height:1.7;
      color:#333;white-space:${ws};word-break:break-word;min-height:1em;text-align:${align};${pad}">${html}</div>`;
  if (!m.zeilenNr) return textDiv;
  // Nummernspalte mit IDENTISCHEN Zeilenmetriken wie der Text (gleiche font-size +
  // line-height, eine Zeile pro Textzeile) — px-Rechnung driftet in Safari über die
  // Seite (Zeilenboxen-Rundung), gleicher Zeilensatz kann nicht auseinanderlaufen.
  const p = m.innerPad != null ? m.innerPad : 0;
  const off = lineOffset || 0;
  const rows = [];
  for (let i = 1; i <= 300; i++) {
    const g = i + off;
    rows.push(g % 5 === 0 ? `<span style="font-size:11px;color:#999;font-family:sans-serif;">${g}</span>` : '');
  }
  return `<div style="position:relative;padding-left:30px;">
    <div aria-hidden="true" style="position:absolute;left:0;top:${p}px;bottom:${p}px;width:26px;overflow:hidden;
      text-align:right;padding-right:4px;box-sizing:border-box;font-family:${font};font-size:${fontSize}px;line-height:1.7;">${rows.join('<br>')}</div>
    ${textDiv}
  </div>`;
}

// ── Kette verwalten ───────────────────────────────────────────────
function tfChain(masterId) {
  return widgets.filter(x => x.type === 'textfluss' && x.master === masterId)
    .sort((a, b) => (a.seq || 0) - (b.seq || 0));
}

// Kette neu aufbauen, wenn sie nicht zur splits-Länge passt. true = geändert.
function tfSyncChain(master) {
  const need = (master.splits || []).length;
  const chain = tfChain(master.id);
  const ok = chain.length === need && chain.every((c, k) =>
    c.seq === k + 1 && c.widthFraction === master.widthFraction && c.halfWidth === master.halfWidth);
  if (ok) return false;
  // Alte Kette (inkl. Flow-Breaks davor) entfernen
  for (let i = widgets.length - 1; i >= 0; i--) {
    const x = widgets[i];
    if (!x) continue; // Index kann nach Doppel-Splice (Break+Fortsetzung) überhängen
    if (x.type === 'textfluss' && x.master === master.id) {
      widgets.splice(i, 1);
      if (widgets[i - 1] && widgets[i - 1].type === 'pagebreak' && widgets[i - 1].flow) widgets.splice(i - 1, 1);
    }
  }
  const mIdx = widgets.findIndex(x => x.id === master.id);
  if (mIdx < 0) return true;
  let at = mIdx + 1;
  for (let k = 1; k <= need; k++) {
    widgets.splice(at++, 0, { id: ++idC, type: 'pagebreak', flow: true });
    widgets.splice(at++, 0, { id: ++idC, type: 'textfluss', master: master.id, seq: k,
                              widthFraction: master.widthFraction, halfWidth: master.halfWidth });
  }
  return true;
}

// ── Messung: wieviele Wörter passen in availPx? ──────────────────
// Liefert {cut, lines} — cut = Token-Index NACH dem letzten passenden Wort,
// oder null wenn nicht sinnvoll teilbar. slack: px-Reserve (Hysterese gegen Flattern).
function tfMeasureSplit(master, toks, from, availPx, widthPx, slack) {
  const page = document.querySelector('#canvas-area .page');
  if (!page || widthPx < 20) return null;
  const fontSize = master.fontSize || 16;
  const pad = master.innerPad != null ? `padding:${master.innerPad}px;` : '';
  const box = document.createElement('div');
  box.style.cssText = `position:absolute;left:-9999px;top:0;width:${widthPx}px;visibility:hidden;
    font-family:${master.font || 'inherit'};font-size:${fontSize}px;line-height:1.7;
    white-space:pre-wrap;word-break:break-word;text-align:${master.align || 'left'};${pad}`;
  page.appendChild(box);
  try {
    const limit = availPx - (slack || 0);
    if (from > 0) from = tfFlowFrom(toks, from); // wie der Renderer: Teil beginnt am ersten Wort
    // Kandidaten: Token-Index nach jedem Wort ab from
    const cuts = [];
    for (let k = from; k < toks.length; k++) if (toks[k].t === 'w') cuts.push(k + 1);
    if (!cuts.length) return null;
    const html = master.html || '';
    const h = cut => { box.innerHTML = tfSlice(html, from, cut); return box.offsetHeight; };
    // Passt alles?
    if (h(toks.length) <= limit) {
      const lines = Math.round((box.offsetHeight - 2 * (master.innerPad || 0)) / (fontSize * 1.7));
      return { cut: toks.length, lines };
    }
    // Binärsuche: größter cut mit Höhe ≤ limit
    let lo = 0, hi = cuts.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (h(cuts[mid]) <= limit) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0 || best >= cuts.length - 1) {
      // nichts passt bzw. es bliebe kein Rest → kein Split
      return best < 0 ? null : { cut: toks.length, lines: 0 };
    }
    const cut = cuts[best];
    const hFinal = h(cut);
    const lines = Math.round((hFinal - 2 * (master.innerPad || 0)) / (fontSize * 1.7));
    return { cut, lines };
  } finally {
    box.remove();
  }
}

// Teil (Master seq0 oder Fortsetzung seq k) läuft über → Split setzen/verkleinern.
function tfTrySplit(w, wrapEl, maxBottom) {
  const master = w.type === 'textfluss' ? widgets.find(x => x.id === w.master) : w;
  if (!master || !master.fliessen) return false;
  const seq = w.type === 'textfluss' ? (w.seq || 1) : 0;
  const toks = tfTokens(master.html || '');
  const splits = (master.splits || []).slice();
  const from = seq === 0 ? 0 : Math.min(splits[seq - 1] ?? toks.length, toks.length);
  const txtEl = wrapEl.querySelector('[data-flowtext]');
  if (!txtEl) return false;
  const overhead = wrapEl.offsetHeight - txtEl.offsetHeight;
  const avail = maxBottom - wrapEl.offsetTop - overhead;
  if (avail < (master.fontSize || 16) * 1.7 * 2) return false; // < 2 Zeilen → normaler Break sinnvoller
  const meas = tfMeasureSplit(master, toks, from, avail, txtEl.clientWidth, 0);
  if (!meas || meas.cut >= toks.length || meas.cut <= from) return false;
  if (splits[seq] === meas.cut) return false; // bereits so — kein Fortschritt
  splits[seq] = meas.cut;
  master.splits = splits;
  (master.flowLines = master.flowLines || [])[seq] = meas.lines;
  tfSyncChain(master);
  return true;
}

// Stabiler Zustand: Ketten aufräumen und Splits nachziehen (wachsen/verschmelzen).
// true = etwas geändert → Aufrufer rendert neu.
function tfRebalance() {
  // 1) Verwaiste Fortsetzungen (Master weg oder fliessen aus) entfernen
  for (const c of widgets.filter(x => x.type === 'textfluss')) {
    const m = widgets.find(x => x.id === c.master);
    if (!m || !m.fliessen) {
      if (m) { m.splits = []; m.flowLines = []; return tfSyncChain(m) || true; }
      const i = widgets.indexOf(c);
      widgets.splice(i, 1);
      if (widgets[i - 1] && widgets[i - 1].type === 'pagebreak' && widgets[i - 1].flow) widgets.splice(i - 1, 1);
      return true;
    }
  }
  // 2) Kettenlänge ↔ splits synchron?
  for (const m of widgets.filter(x => x.type === 'text' && x.fliessen)) {
    if (tfSyncChain(m)) return true;
  }
  // 3) Splits nachziehen: passt in Teil k mehr (oder alles) hinein?
  for (const m of widgets.filter(x => x.type === 'text' && x.fliessen && (x.splits || []).length)) {
    const toks = tfTokens(m.html || '');
    const splits = m.splits.slice();
    for (let s = 0; s < splits.length; s++) {
      const partW = s === 0 ? m : tfChain(m.id)[s - 1];
      if (!partW) break;
      const wrap = document.querySelector(`.wwrap[data-id="${partW.id}"]`);
      const pageEl = wrap && wrap.closest('.page');
      if (!wrap || !pageEl) continue;
      const txtEl = wrap.querySelector('[data-flowtext]');
      if (!txtEl) continue;
      const pxPerMm = pageEl.offsetWidth / geom().scrW;
      const maxBottom = geom().endTop * pxPerMm;
      const overhead = wrap.offsetHeight - txtEl.offsetHeight;
      const avail = maxBottom - wrap.offsetTop - overhead;
      const from = s === 0 ? 0 : Math.min(splits[s - 1], toks.length);
      // Wachsen nur mit 3px-Hysterese → kein Flattern zwischen Split/Overflow
      const meas = tfMeasureSplit(m, toks, from, avail, txtEl.clientWidth, 3);
      if (!meas) continue;
      if (meas.cut >= toks.length) {
        // ab hier passt ALLES auf diese Seite → restliche Teile verschmelzen
        m.splits = splits.slice(0, s);
        m.flowLines = (m.flowLines || []).slice(0, s);
        tfSyncChain(m);
        return true;
      }
      if (meas.cut > splits[s]) { // nur wachsen — schrumpfen macht der Overflow-Zweig
        splits[s] = meas.cut;
        m.splits = splits;
        (m.flowLines = m.flowLines || [])[s] = meas.lines;
        return true;
      }
    }
  }
  return false;
}

// Props-Toggle des Text-Widgets
function tfSetFliessen(id, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.fliessen = val;
  if (!val) { w.splits = []; w.flowLines = []; tfSyncChain(w); }
  render(); renderProps(id);
}

// ── Fortsetzungs-Widget ───────────────────────────────────────────
WIDGETS.push({
  meta: { type:'textfluss', hidden:true, label:'Text (Fortsetzung)', desc:'Fortsetzung eines fließenden Textes', icon:'T', category:'allgemein' },

  createData: id => ({ id, type:'textfluss', master:null, seq:1 }),

  render: d => {
    const m = widgets.find(x => x.id === d.master);
    if (!m) return '';
    const toks = tfTokens(m.html || '');
    const splits = m.splits || [];
    const seq = d.seq || 1;
    const from = tfFlowFrom(toks, Math.min(splits[seq - 1] ?? toks.length, toks.length));
    const to = splits[seq] != null ? Math.min(splits[seq], toks.length) : null;
    const offset = (m.flowLines || []).slice(0, seq).reduce((a, b) => a + (b || 0), 0);
    return tfTextDiv(m, tfSlice(m.html, from, to), offset);
  },

  renderProps: d => {
    const m = widgets.find(x => x.id === d.master);
    return `<div style="padding:10px;color:#888;font-size:12px;line-height:1.5;">
      Fortsetzung des fließenden Textes${m ? '' : ' (Original fehlt)'} — bearbeitet wird der Originaltext.
    </div>` + (m ? `<button onclick="event.stopPropagation();sel(${m.id});renderProps(${m.id})"
      style="width:100%;padding:6px;border:none;border-radius:5px;background:#313244;color:#cdd6f4;
             font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">↑ Zum Originaltext</button>` : '');
  },
});
