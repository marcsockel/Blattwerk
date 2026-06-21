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
    border:'thin', bgColor:'',         // kein Hintergrund, außer man wählt einen
    aufgabenNr:0, aufgabenText:'',
  }),

  // Wird nicht im Fluss gerendert (Overlay via makeFloatEl).
  render: () => '',

  renderProps: d => {
    const np = getPageRanges().length;
    const child = widgets.find(w => w.parent === d.id);
    const opts = WIDGETS
      .filter(w => !['group', 'floatbox'].includes(w.meta.type))
      .map(w => `<option value="${w.meta.type}">${w.meta.icon} ${w.meta.label}</option>`).join('');
    const num = (label, key, val, min, max) =>
      pr(label, `<input type="number" min="${min}" max="${max}" value="${Math.round(val)}" onchange="fbSet(${d.id},'${key}',+this.value)">`);

    return `<div class="prow"><label>${child ? 'Widget ersetzen' : 'Widget einsetzen'}</label>
        <div style="display:flex;gap:4px;">
          <select id="fb-add-${d.id}" onclick="event.stopPropagation()"
            style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px;">${opts}</select>
          <button onclick="event.stopPropagation();fbAddChild(${d.id},document.getElementById('fb-add-${d.id}').value)"
            style="padding:4px 10px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                   font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">${child ? 'Ersetzen' : 'Einsetzen'}</button>
        </div>
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

// Baut das absolut positionierte Overlay-Element einer Box (inkl. Kind-Widget).
function makeFloatEl(f) {
  const div = document.createElement('div');
  // Ohne gewählten Rahmen: KEIN echter Rahmen (nur eine Bildschirm-Hilfslinie via .float-noborder,
  // die im Druck ausgeblendet wird) — sonst druckt der gestrichelte groupBorderCss-Fallback mit.
  div.className = 'wwrap floatbox' + (f.border ? '' : ' float-noborder') + (selId === f.id ? ' sel' : '');
  div.dataset.id = f.id;
  div.style.cssText = `position:absolute;left:${f.x}%;top:${f.y}%;width:${f.w}%;`
    + `min-height:${f.h}%;z-index:40;box-sizing:border-box;margin:0;`;

  const bcss = f.border ? (typeof groupBorderCss === 'function' ? groupBorderCss(f.border) : '') : '';
  const frameStyle = bcss
    + (f.bgColor ? `background:${f.bgColor};` : '')   // ohne Auswahl transparent
    + 'box-sizing:border-box;padding:8px;min-height:100%;';

  const child = widgets.find(w => w.parent === f.id);

  div.innerHTML = `
    <div class="float-grip" title="Ziehen zum Verschieben"
      style="position:absolute;top:-11px;left:8px;z-index:11;display:inline-flex;align-items:center;gap:4px;
             padding:1px 7px;border-radius:5px;background:#89b4fa;color:#1e1e2e;font-size:10px;font-weight:700;
             cursor:move;line-height:1.7;box-shadow:0 1px 2px rgba(0,0,0,.18);user-select:none;">⠿ Rahmen</div>
    <div class="wacts">
      <button class="wa del" onclick="event.stopPropagation();fbDelete(${f.id})" title="Rahmen löschen">✕</button>
    </div>
    <div class="winner" style="${frameStyle}">
      ${atHtml(f)}
      <div class="float-child">${child ? '' : `<div style="color:#bbb;font-size:11px;text-align:center;padding:10px;">Leerer Rahmen – rechts ein Widget einsetzen</div>`}</div>
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
    div.style.left = w.x + '%'; div.style.top = w.y + '%';
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
    div.style.width = w.w + '%'; div.style.minHeight = w.h + '%';
  };
  const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); renderProps(id); };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}
