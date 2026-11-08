// Widget: Schwebender Rahmen (frei positionierbar, Ebene über dem Blatt)
// Liegt NICHT im Dokumentfluss: position:absolute innerhalb einer .page, an eine
// Seite gepinnt, Position/Größe in % der Seite (WYSIWYG für Bildschirm & Druck).
// Nimmt GENAU EIN Widget auf (echtes Top-Level-Widget mit parent-Tag → volle
// Funktionalität). render() in index.html zeichnet die Boxen als Overlay (makeFloatEl).

WIDGETS.push({
  meta: { type:'floatbox', label:'Schwebender Rahmen', desc:'Frei positionierbar, nimmt ein Widget auf',
          icon:'🗗', category:'allgemein', section:'Profi-Tools', selSafe:true, floating:true },

  createData: id => ({
    id, type:'floatbox', floating:true, page:0,
    x:28, y:28, w:44, h:22,            // % der Seite
    border:'', bgColor:'',             // standardmäßig ohne Rahmen und ohne Hintergrund
    aufgabenNr:0, aufgabenText:'',
  }),

  // Wird nicht im Fluss gerendert (Overlay via makeFloatEl).
  render: () => '',

  renderProps: d => {
    const np = getPageRanges().length;
    const child = widgets.find(w => w.parent === d.id);
    const num = (label, key, val, min, max) =>
      pr(label, `<input type="number" min="${min}" max="${max}" value="${Math.round(val)}" onchange="fbSet(${d.id},'${key}',+this.value)">`);

    return `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;padding:9px 10px;border-radius:6px;
          background:#eef4ff;border:1.5px solid #c9dafc;font-size:12px;line-height:1.45;color:#2a3b5c;text-align:left;">
        <span style="font-size:16px;line-height:1;">👈</span>
        <span>${child
          ? '<b>Widget ersetzen:</b> links in der Auswahl ein anderes Widget anklicken.'
          : '<b>Widget einsetzen:</b> links in der Auswahl ein Widget anklicken – es landet in diesem Rahmen.'}</span>
      </div>` +
      (child
        ? `<button onclick="event.stopPropagation();fbRemoveChild(${d.id})"
             style="width:100%;margin-bottom:6px;padding:5px;border:none;border-radius:4px;background:#fde8ec;
                    color:#a0003c;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">🗑 Widget entfernen</button>`
        : '') +
      `<div class="prow"><label>Position &amp; Größe (% der Seite)</label></div>` +
      num('Position X', 'x', d.x ?? 28, 0, 100) +
      num('Position Y', 'y', d.y ?? 28, 0, 100) +
      num('Breite',     'w', d.w ?? 44, 5, 100) +
      num('Höhe',       'h', d.h ?? 22, 3, 100) +
      pr('Seite', `<input type="number" min="1" max="${np}" value="${(d.page||0)+1}" onchange="fbSet(${d.id},'page',Math.max(0,+this.value-1))">`) +
      `<div style="font-size:11px;color:#aaa;margin-top:6px;">Verschieben: Rahmen ziehen. Größe: Ecke unten rechts. Das eingesetzte Widget bearbeitest du per Klick darauf.</div>`;
  },
});

// Position/Größe in % der BILDSCHIRM-Seite, aber in mm umgerechnet und am linken Inhaltsrand
// verankert: Im Druck ist die Seite breiter (210mm statt 190mm) und der linke Rand größer
// (25mm Lochrand statt 10mm). Reine %-Werte würden dort verrutschen; so bleibt der Rahmen
// exakt an derselben Stelle relativ zum Inhalt. --fb-pl = linkes Seiten-Padding (Druck-CSS).
const fbLeft  = x => `calc(var(--fb-pl, 10mm) - 10mm + ${x} * var(--scr-page-w) / 100)`;
const fbWidth = w => `calc(${w} * var(--scr-page-w) / 100)`;
const fbTop   = y => `calc(${y} * var(--scr-page-h) / 100)`;

// Baut das absolut positionierte Overlay-Element einer Box (inkl. Kind-Widget).
function makeFloatEl(f) {
  const div = document.createElement('div');
  // Ohne gewählten Rahmen: KEIN echter Rahmen (nur eine Bildschirm-Hilfslinie via .float-noborder,
  // die im Druck ausgeblendet wird) — sonst druckt der gestrichelte groupBorderCss-Fallback mit.
  div.className = 'wwrap floatbox' + wrapEckenClass(f) + (frameBorder(f) ? '' : ' float-noborder') + (selId === f.id ? ' sel' : '');
  div.dataset.id = f.id;
  div.style.cssText = `position:absolute;left:${fbLeft(f.x)};top:${fbTop(f.y)};width:${fbWidth(f.w)};`
    + `min-height:${fbTop(f.h)};z-index:40;box-sizing:border-box;margin:0;`;

  const frameStyle = frameDeco(f)
    + (f.bgColor ? `background:${f.bgColor};` : '')
    + `box-sizing:border-box;padding:${frameBorder(f) ? frameInkPad(f) : '8px'};min-height:100%;`;

  const child = widgets.find(w => w.parent === f.id);

  div.innerHTML = `
    <div class="float-grip" title="Ziehen zum Verschieben"
      style="position:absolute;top:-11px;left:8px;z-index:11;display:inline-flex;align-items:center;gap:4px;
             padding:1px 7px;border-radius:5px;background:#89b4fa;color:#1e1e2e;font-size:10px;font-weight:700;
             cursor:move;line-height:1.7;box-shadow:0 1px 2px rgba(0,0,0,.18);user-select:none;">⠿ Rahmen</div>
    <div class="wacts wacts-right">
      <button class="wa" onclick="event.stopPropagation();fbDup(${f.id})" title="Rahmen duplizieren">⧉</button>
      <button class="wa del" onclick="event.stopPropagation();fbDelete(${f.id})" title="Rahmen löschen">✕</button>
    </div>
    <div class="winner${f.schatten?' fx-shadow':''}${frameInkInsert(f)?' frame-ink':''}" style="${frameStyle}">
      ${frameInkInsert(f)}
      ${atHtml(f)}
      <div class="float-child">${child ? '' : `<div style="color:#7a8599;font-size:13px;line-height:1.45;text-align:center;padding:14px 10px;
          border:1.5px dashed #c3cad6;border-radius:6px;background:rgba(238,244,255,.6);">
          <div style="font-weight:800;margin-bottom:3px;">Leerer Rahmen</div>
          👈 Links in der Auswahl ein Widget anklicken,<br>um es hier einzusetzen.</div>`}</div>
    </div>
    <div class="float-resize" title="Größe ändern"
      style="position:absolute;right:-3px;bottom:-3px;width:15px;height:15px;cursor:nwse-resize;z-index:11;
             background:#89b4fa;border:2px solid #fff;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.25);"></div>`;

  // Kind-Widget einsetzen (echtes Widget via makeWrap/layoutInto → volle Funktionalität)
  if (child && typeof layoutInto === 'function') {
    const host = div.querySelector('.float-child');
    layoutInto(host, [child], widgets.indexOf(child));
    host.querySelectorAll('.wwrap').forEach(el => { el.draggable = false; }); // kein Reorder im Rahmen
  }

  // Auswahl
  div.addEventListener('click', () => sel(f.id), true);
  div.onclick = e => e.stopPropagation();

  // Verschieben / Größe ändern (nicht, wenn man das Kind-Widget bedient)
  div.addEventListener('mousedown', e => {
    if (e.target.classList.contains('float-resize')) { fbStartResize(e, f.id); return; }
    if (e.target.closest('.float-child')) return;
    fbStartDrag(e, f.id);
  });

  return div;
}

// ── Helpers ───────────────────────────────────────────────────────
function fbSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  render(); renderProps(id);
}

// Setzt EIN Widget in den Rahmen (ersetzt ein bestehendes).
function fbAddChild(floatId, type) {
  const def = WIDGET_MAP[type];
  if (!def || (def.meta && def.meta.floating) || type === 'group') return;
  const f = widgets.find(x => x.id === floatId); if (!f) return;
  saveHistory();
  const old = widgets.findIndex(x => x.parent === floatId);
  if (old >= 0) widgets.splice(old, 1);
  const w = def.createData(++idC);
  w.parent = floatId;
  const fi = widgets.findIndex(x => x.id === floatId);
  widgets.splice(fi + 1, 0, w); // direkt hinter den Rahmen (Position im Array egal, da via parent gefunden)
  selId = floatId;              // Rahmen ausgewählt lassen
  render(); renderProps(floatId);
}

function fbRemoveChild(floatId) {
  const ci = widgets.findIndex(x => x.parent === floatId); if (ci < 0) return;
  saveHistory();
  widgets.splice(ci, 1);
  render(); renderProps(floatId);
}

// Rahmen inkl. Kind-Widget duplizieren (neue IDs, leicht versetzt, gleiche Seite).
function fbDup(floatId) {
  const f = widgets.find(x => x.id === floatId); if (!f) return;
  saveHistory();
  const copy = JSON.parse(JSON.stringify(f));
  copy.id = ++idC;
  copy.x = Math.min(100 - (copy.w || 10), (f.x || 0) + 4);
  copy.y = Math.min(99, (f.y || 0) + 4);
  const fi = widgets.findIndex(x => x.id === floatId);
  widgets.splice(fi + 1, 0, copy);
  const child = widgets.find(x => x.parent === floatId);
  if (child) {
    const cc = JSON.parse(JSON.stringify(child));
    cc.id = ++idC;
    cc.parent = copy.id;
    widgets.splice(widgets.findIndex(x => x.id === copy.id) + 1, 0, cc);
  }
  selId = copy.id;
  render(); renderProps(copy.id);
}

// Rahmen löschen → Kind mitlöschen (sonst bliebe es unsichtbar im Array zurück).
function fbDelete(floatId) {
  saveHistory();
  const ci = widgets.findIndex(x => x.parent === floatId);
  if (ci >= 0) widgets.splice(ci, 1);
  const fi = widgets.findIndex(x => x.id === floatId);
  if (fi >= 0) widgets.splice(fi, 1);
  if (selId === floatId) selId = null;
  render(); renderProps(selId);
}

// Rahmen-ID, wenn die Auswahl ein Rahmen oder dessen Kind ist (für addWidget-Routing).
function currentFloatContext() {
  if (selId == null) return null;
  const sw = widgets.find(x => x.id === selId);
  if (!sw) return null;
  if (sw.type === 'floatbox') return selId;
  if (sw.parent) { const p = widgets.find(x => x.id === sw.parent); if (p && p.type === 'floatbox') return p.id; }
  return null;
}

function fbStartDrag(e, id) {
  e.preventDefault();
  const div = document.querySelector(`.floatbox[data-id="${id}"]`);
  const page = div && div.closest('.page'); if (!page) return;
  const w = widgets.find(x => x.id === id); if (!w) return;
  const pw = page.offsetWidth, ph = page.offsetHeight;
  const sx = e.clientX, sy = e.clientY, ox = w.x, oy = w.y;
  saveHistory();
  if (selId !== id) sel(id);
  const move = ev => {
    const dx = (ev.clientX - sx) / pw * 100, dy = (ev.clientY - sy) / ph * 100;
    w.x = Math.max(0, Math.min(100 - w.w, ox + dx));
    w.y = Math.max(0, Math.min(100 - 1, oy + dy));
    div.style.left = fbLeft(w.x); div.style.top = fbTop(w.y);
  };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); renderProps(id); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function fbStartResize(e, id) {
  e.preventDefault(); e.stopPropagation();
  const div = document.querySelector(`.floatbox[data-id="${id}"]`);
  const page = div && div.closest('.page'); if (!page) return;
  const w = widgets.find(x => x.id === id); if (!w) return;
  const pw = page.offsetWidth, ph = page.offsetHeight;
  const sx = e.clientX, sy = e.clientY, ow = w.w, oh = w.h;
  saveHistory();
  const move = ev => {
    const dw = (ev.clientX - sx) / pw * 100, dh = (ev.clientY - sy) / ph * 100;
    w.w = Math.max(5, Math.min(100 - w.x, ow + dw));
    w.h = Math.max(3, Math.min(100, oh + dh));
    div.style.width = fbWidth(w.w); div.style.minHeight = fbTop(w.h);
  };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); renderProps(id); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}
