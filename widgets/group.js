// Widget: Gruppe (Beta)
// Ein Eltern-Container, der mehrere Widgets in EINEM Rahmen mit EINEM
// Aufgabentext bündelt. Umgesetzt als Marker-Paar im flachen widgets[]-Array:
//   { type:'group', ... }  … Kinder (echte Top-Level-Widgets) …  { type:'groupEnd' }
// Die Zugehörigkeit ist rein POSITIONELL (alles zwischen den Markern) — dadurch
// funktioniert Drag rein/raus automatisch über die bestehende Sortier-Logik, und
// die Kinder behalten ihre volle Funktionalität (eigene Props/Helfer via widgets.find).
//
// Basic-Props (Aufgabentext, Hintergrund, Rahmen, Layout) liefert standardFooter()
// automatisch, da das Gruppen-Datenobjekt aufgabenNr/aufgabenText/border/bgColor hat.

WIDGETS.push({
  meta: { type:'group', label:'Gruppe', desc:'Rahmen für mehrere Widgets',
          icon:'🗂', category:'allgemein', section:'Profi-Tools', selSafe:true },

  // createData wird beim Einfügen genutzt; das passende groupEnd-Marker-Objekt
  // setzt addWidget() in index.html direkt dahinter.
  createData: id => ({
    id, type:'group', border:'thin', bgColor:'', flush:false,
    aufgabenNr:0, aufgabenText:''
  }),

  // Wird nie direkt verwendet — renderPage() baut den Rahmen via makeGroupWrap().
  render: () => '',

  renderProps: d => {
    const opts = WIDGETS
      .filter(w => w.meta.type !== 'group')
      .map(w => `<option value="${w.meta.type}">${w.meta.icon} ${w.meta.label}</option>`)
      .join('');
    const flush = !!d.flush;
    const tgl = (label, active, val) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'flush',${val})"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${active?'#89b4fa':'#ddd'};
               background:${active?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${active?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div class="prow"><label>Widget hinzufügen</label>
      <div style="display:flex;gap:4px;">
        <select id="grp-add-${d.id}" onclick="event.stopPropagation()"
          style="flex:1;border:1.5px solid #ddd;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px;">
          ${opts}
        </select>
        <button onclick="event.stopPropagation();groupAddChild(${d.id},document.getElementById('grp-add-${d.id}').value)"
          style="padding:4px 10px;border:none;border-radius:4px;background:#313244;color:#cdd6f4;
                 font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">+ Einfügen</button>
      </div>
      <div style="font-size:11px;color:#aaa;margin-top:6px;">
        Oder ein Widget vom Blatt in den Rahmen ziehen. Rahmen, Hintergrund &amp; Aufgabentext unten.</div>
    </div>
    <div class="prow"><label>Innenabstand</label>
      <div style="display:flex;gap:4px;">
        ${tgl('Mit Abstand', !flush, false)}
        ${tgl('Bündig', flush, true)}
      </div>
      <div style="font-size:10px;color:#aaa;margin-top:4px;">Bündig: Widgets nutzen die volle Rahmenbreite (Aufgabentext bleibt eingerückt).</div>
    </div>`;
  },
});

// Rahmen-Stil (gleiche Schlüssel wie makeWrap/sfBorderBlock).
function groupBorderCss(b) {
  return ({
    dashed:        'border:1.5px dashed #555;border-radius:6px;',
    thin:          'border:1px solid #333;border-radius:6px;',
    medium:        'border:2px solid #333;border-radius:6px;',
    thick:         'border:3px solid #333;border-radius:6px;',
    'dashed-rect': 'border:1.5px dashed #555;',
    'thin-rect':   'border:1px solid #333;',
    'medium-rect': 'border:2px solid #333;',
    'thick-rect':  'border:3px solid #333;',
  })[b] || 'border:1.5px dashed #ccc;border-radius:6px;'; // Fallback: dezenter Rahmen, damit die Gruppe sichtbar ist
}

// Baut den Gruppen-Wrapper (eine .wwrap-Einheit). Kinder werden über die
// gemeinsame layoutInto()-Funktion (½/¼-Layout) in den Rahmen gelegt.
// gIdx = globaler Index des group-Markers, kidBase = globaler Index des 1. Kindes.
function makeGroupWrap(g, gIdx, kids, kidBase) {
  const div = document.createElement('div');
  div.className = 'wwrap' + (selId === g.id ? ' sel' : '');
  div.dataset.idx = gIdx;
  div.dataset.id  = g.id;
  div.style.marginBottom = '14px';

  const frameStyle = frameDeco(g)
    + (g.bgColor ? `background:${g.bgColor};` : '')
    + 'position:relative;min-height:54px;';
  const noBorder = !frameBorder(g);

  // Padding NICHT auf den Rahmen, sondern getrennt:
  //  - Aufgabentext: fester Abstand (10px), unabhängig vom Toggle.
  //  - Kinder: per flush-Toggle 10px ODER 0 → Widgets nutzen dann die volle Breite.
  const taskRendered = atHtml(g);                 // '' wenn keine Nr/kein Text
  const ip = g.flush ? 0 : 10;                    // innerer Abstand der Kinder
  const kidsTop = taskRendered ? 0 : ip;          // Aufgabentext liefert sonst den oberen Abstand

  div.innerHTML = `
    <div class="group-handle" onclick="event.stopPropagation();sel(${g.id})" title="Gruppe auswählen"
      style="position:absolute;top:-11px;left:8px;z-index:11;display:inline-flex;align-items:center;gap:4px;
             padding:1px 7px;border-radius:5px;background:#89b4fa;color:#1e1e2e;font-size:10px;font-weight:700;
             cursor:pointer;line-height:1.7;box-shadow:0 1px 2px rgba(0,0,0,.18);user-select:none;">⠿ Gruppe</div>
    <div class="wacts">
      <button class="wa" onclick="event.stopPropagation();groupMove(${g.id},-1)" title="Gruppe nach oben">↑</button>
      <button class="wa" onclick="event.stopPropagation();groupMove(${g.id},1)"  title="Gruppe nach unten">↓</button>
      <button class="wa" onclick="event.stopPropagation();groupDup(${g.id})"      title="Gruppe duplizieren">⧉</button>
      <button class="wa del" onclick="event.stopPropagation();groupDelete(${g.id})"
        title="Gruppierung auflösen (Inhalte bleiben)">✕</button>
    </div>
    <div class="group-frame${g.schatten?' fx-shadow':''}${noBorder?' frame-noborder':''}${frameInkInsert(g)?' frame-ink':''}" style="${frameStyle}">
      ${frameInkInsert(g)}
      ${taskRendered ? `<div style="padding:10px 10px 0 10px;">${taskRendered}</div>` : ''}
      <div class="group-kids" style="padding:${kidsTop}px ${ip}px ${ip}px ${ip}px;"></div>
      ${kids.length ? '' : `<div style="color:#bbb;font-size:11px;text-align:center;padding:6px;">
        Leerer Rahmen – Widget rechts hinzufügen oder hereinziehen</div>`}
    </div>`;

  // Kinder einlayouten (gleiche Reihen-/Breitenlogik wie auf der Seite)
  const kidsEl = div.querySelector('.group-kids');
  layoutInto(kidsEl, kids, kidBase);

  // Auswahl: Klick auf den Rahmen wählt die Gruppe (Kinder fangen Klicks via
  // eigener Capture-Listener ab → sie gewinnen, wenn man ein Kind anklickt).
  div.addEventListener('click', () => sel(g.id), true);
  div.onclick = e => e.stopPropagation();

  // Der GANZE Rahmen ist die Ablagefläche. Drops, die direkt auf einem Kind
  // landen, übernimmt dessen eigener Drop-Handler (Umsortieren) — dann hier nicht
  // nochmal verarbeiten.
  const frame = div.querySelector('.group-frame');
  frame.addEventListener('dragover', e => {
    if (dragSrc === null) return;
    e.preventDefault();
    frame.style.outline = '2px dashed #89b4fa'; frame.style.outlineOffset = '2px';
  });
  frame.addEventListener('dragleave', () => { frame.style.outline = ''; });
  frame.addEventListener('drop', e => {
    frame.style.outline = '';
    const onChild = e.target.closest('.wwrap') && e.target.closest('.wwrap') !== div;
    if (onChild) return; // Kind-Handler erledigt das
    e.preventDefault();
    groupDropInto(g.id);
  });

  return div;
}

// ── Gruppen-Aktionen ──────────────────────────────────────────────
// groupEnd-Index zu einem group-Marker finden (Index direkt VOR groupEnd = letztes Kind+1).
function groupEndIndex(startIdx) {
  let e = startIdx + 1;
  while (e < widgets.length && widgets[e].type !== 'groupEnd') e++;
  return e; // Index des groupEnd (oder widgets.length, falls fehlend)
}

function groupAddChild(groupId, type) {
  if (type === 'group') return; // keine verschachtelten Gruppen
  const def = WIDGET_MAP[type]; if (!def) return;
  const s = widgets.findIndex(x => x.id === groupId); if (s < 0) return;
  const e = groupEndIndex(s);
  saveHistory();
  const w = def.createData(++idC);
  widgets.splice(e, 0, w);
  selId = groupId; // Gruppe ausgewählt lassen → schnelles Mehrfach-Hinzufügen
  render(); renderProps(groupId);
}

function groupDropInto(groupId) {
  if (dragSrc === null) return;
  const dragged = widgets[dragSrc];
  if (!dragged || dragged.type === 'group' || dragged.type === 'groupEnd') { dragSrc = null; return; }
  const s = widgets.findIndex(x => x.id === groupId);
  if (s < 0) { dragSrc = null; return; }
  saveHistory();
  const m = widgets.splice(dragSrc, 1)[0];
  const s2 = widgets.findIndex(x => x.id === groupId); // nach dem Entfernen neu suchen
  const e2 = groupEndIndex(s2);
  widgets.splice(e2, 0, m); // direkt vor groupEnd einfügen
  dragSrc = null;
  render();
}

// Ganze Gruppe (Marker + Kinder) als Block um eine Top-Level-Einheit
// verschieben. Seitengrenzen (pagebreak) werden für die Beta nicht überschritten.
function groupMove(groupId, dir) {
  const s = widgets.findIndex(x => x.id === groupId); if (s < 0) return;
  const e = groupEndIndex(s); if (e >= widgets.length) return; // groupEnd fehlt → abbrechen
  const span = widgets.slice(s, e + 1);
  if (dir < 0) {
    let p = s - 1;
    if (p < 0 || widgets[p].type === 'pagebreak') return;
    if (widgets[p].type === 'groupEnd') { // vorherige Einheit ist eine Gruppe → vor deren Start
      let ps = p - 1; while (ps >= 0 && widgets[ps].type !== 'group') ps--;
      if (ps < 0) return; p = ps;
    }
    saveHistory();
    widgets.splice(s, span.length);   // Block entfernen
    widgets.splice(p, 0, ...span);    // bei p (< s) wieder einsetzen
  } else {
    let n = e + 1;
    if (n >= widgets.length || widgets[n].type === 'pagebreak') return;
    let insertAfter; // Index des letzten Elements der nachfolgenden Einheit
    if (widgets[n].type === 'group') insertAfter = groupEndIndex(n);
    else insertAfter = n;
    saveHistory();
    widgets.splice(s, span.length);              // Block entfernen
    const shifted = insertAfter - span.length;   // Indizes nach dem Block rücken nach links
    widgets.splice(shifted + 1, 0, ...span);
  }
  render();
}

// Ganze Gruppe inkl. Kinder duplizieren (neue IDs).
function groupDup(groupId) {
  const s = widgets.findIndex(x => x.id === groupId); if (s < 0) return;
  const e = groupEndIndex(s); if (e >= widgets.length) return;
  saveHistory();
  const copy = widgets.slice(s, e + 1).map(w => {
    const c = JSON.parse(JSON.stringify(w));
    c.id = ++idC;
    return c;
  });
  widgets.splice(e + 1, 0, ...copy);
  selId = copy[0].id;
  render(); renderProps(selId);
}

// Gruppierung auflösen: nur die Marker entfernen, Kinder bleiben als
// normale Top-Level-Widgets an Ort und Stelle erhalten.
function groupDelete(groupId) {
  const s = widgets.findIndex(x => x.id === groupId); if (s < 0) return;
  const e = groupEndIndex(s);
  saveHistory();
  if (e < widgets.length && widgets[e].type === 'groupEnd') widgets.splice(e, 1);
  widgets.splice(s, 1);
  if (selId === groupId) selId = null;
  render(); renderProps(selId);
}

// Liefert die Gruppen-ID, wenn die aktuelle Auswahl in einer Gruppe liegt
// (oder die Gruppe selbst ist) — sonst null. Genutzt von addWidget().
function currentGroupContext() {
  if (selId == null) return null;
  const sw = widgets.find(x => x.id === selId);
  if (sw && sw.type === 'group') return selId;
  const idx = widgets.findIndex(x => x.id === selId);
  if (idx < 0) return null;
  for (let k = idx; k >= 0; k--) {
    if (widgets[k].type === 'groupEnd') return null; // hinter einem Ende → außerhalb
    if (widgets[k].type === 'group') return widgets[k].id;
  }
  return null;
}
