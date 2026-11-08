// Widget: Leinwand (Profi-Tools)
// Freie Fläche mit einfachen Grafiken (Rechteck, Ellipse, Linie, Pfeil), Text-Bausteinen, Bildern und Symbolen.
// Flächen-Elemente liegen absolut auf der Leinwand; Position/Größe in % der Leinwand (x, y, w, h).
// Linien/Pfeile bestehen aus zwei Punkten (x1, y1, x2, y2) in %.
// Bedienung (Widget angewählt): Element anklicken = auswählen, ziehen = verschieben,
// Griff unten rechts = Größe ändern, runder Griff oben = drehen, Doppelklick auf Text = Text bearbeiten.
// Linie/Pfeil: Knopf drücken, dann auf der Leinwand von Punkt zu Punkt ziehen; Endpunkte bleiben verschiebbar.
// Mehrfachauswahl: Shift+Klick oder Rahmen aufziehen; Gruppieren → wird zusammen ausgewählt, verschoben,
// skaliert und gedreht. Gruppen sind verschachtelbar: it.gruppen = [äußerste, …, innerste] Gruppen-ID.
// Klick wählt die äußerste Gruppe, jeder Doppelklick geht eine Ebene tiefer (bis zum einzelnen Element).

let _lwSel = null;          // { id: Widget-ID, item: Element-ID } oder bei Mehrfachauswahl { id, item:null, multi:[Element-IDs] }
let _lwDrag = null;         // laufende Zieh-Aktion
let _lwLetzterKlick = null; // für die Doppelklick-Erkennung
let _lwZeichne = null;      // { id, kind } – Linie/Pfeil wird gerade gezeichnet

const LW_FARBEN  = ['#000000', '#ffffff', '#666666', '#aaaaaa', '#2563eb', '#16a34a', '#dc2626', '#ea580c', '#9333ea'];
const LW_FUELLUNG = ['', '#ffffff', '#000000', '#f2f2f2', '#d9d9d9', '#dbeafe', '#dcfce7', '#fee2e2', '#fef3c7'];

// Symbole (assets/symbole/<name>.svg): [Dateiname, Bezeichnung, Seitenverhältnis, Gruppe]
const LW_SYMBOL_GRUPPEN = ["Pfeile & Zeichen", "Schulsachen", "Lernen & Ordnung", "Sport & Belohnung", "Menschen & Kommunikation", "Technik & Medien", "Natur & Wetter"];
const LW_SYMBOLE = [
  ['pfeil-rechts','Pfeil rechts',1.44,0], ['pfeil-links','Pfeil links',1.27,0], ['pfeil-hoch','Pfeil hoch',0.75,0], ['pfeil-runter','Pfeil runter',0.81,0], ['bogen-rechts','Bogen rechts',1.17,0], ['bogen-links','Bogen links',1.17,0], ['kreislauf','Kreislauf',0.98,0], ['weiter','Weiter',1.10,0], ['pfeil-klein','Pfeil dunkel',1.29,0], ['richtig','Richtig',0.99,0], ['falsch','Falsch',1.00,0], ['achtung','Achtung',0.99,0], ['frage','Frage',0.99,0], ['info','Info',0.98,0], ['plus','Plus',0.98,0], ['minus','Minus',0.98,0], ['gleich','Gleich',1.00,0], ['eins','1',1.00,0], ['zwei','2',0.99,0], ['drei','3',1.07,0], ['warnung','Warnung',1.11,0], ['schild-ok','Schild ok',0.92,0], ['schild-nein','Schild nein',0.87,0], ['stern','Stern',1.04,0], ['herz','Herz',1.14,0], ['daumen-hoch','Daumen hoch',1.00,0], ['daumen-runter','Daumen runter',1.03,0],
  ['tafel','Tafel',1.42,1], ['buecherstapel','Bücherstapel',1.08,1], ['buch','Buch',1.33,1], ['buch-offen','Buch offen',1.32,1], ['buecher','Bücher',1.16,1], ['ringbuch','Ringbuch',1.30,1], ['notizblock','Notizblock',0.87,1], ['aktenordner','Aktenordner',0.74,1], ['ordner','Ordner',1.24,1], ['schulranzen','Schulranzen',0.82,1], ['bleistift','Bleistift',0.99,1], ['buntstifte','Buntstifte',1.05,1], ['fueller','Füller',0.96,1], ['textmarker','Textmarker',1.04,1], ['radiergummi','Radiergummi',1.12,1], ['anspitzer','Anspitzer',1.08,1], ['schere','Schere',0.96,1], ['klebestift','Klebestift',0.66,1], ['kleber','Kleber',0.76,1], ['lineal','Lineal',0.99,1], ['geodreieck','Geodreieck',0.86,1], ['winkelmesser','Winkelmesser',1.54,1], ['zirkel','Zirkel',0.68,1], ['taschenrechner','Taschenrechner',0.82,1], ['rechenrahmen','Rechenrahmen',1.11,1], ['globus','Globus',0.84,1], ['mikroskop','Mikroskop',0.82,1], ['kolben','Experiment',0.92,1], ['reagenzglaeser','Reagenzgläser',1.30,1], ['farbpalette','Farbpalette',1.17,1], ['musik','Musik',1.05,1], ['trommel','Trommel',1.08,1], ['trinkflasche','Trinkflasche',0.64,1], ['brotdose','Brotdose',1.27,1], ['fruehstueckstasche','Frühstückstasche',1.22,1], ['apfel','Apfel',0.91,1],
  ['unterricht','Unterricht',1.18,2], ['schule','Schule',1.19,2], ['checkliste','Checkliste',0.83,2], ['checkliste-2','Checkliste 2',0.85,2], ['klemmbrett','Klemmbrett',0.79,2], ['dokument','Dokument',0.84,2], ['dokumente','Dokumente',0.86,2], ['urkunde','Urkunde',1.03,2], ['doktorhut','Doktorhut',1.35,2], ['idee','Idee',0.89,2], ['ziel','Ziel',1.01,2], ['lupe','Lupe',0.96,2], ['puzzle','Puzzle',0.90,2], ['puzzle-bunt','Puzzle bunt',1.03,2], ['kalender','Kalender',1.03,2], ['kalender-2','Kalender 2',1.00,2], ['uhr','Uhr',1.01,2], ['wecker','Wecker',1.00,2], ['sanduhr','Sanduhr',0.75,2], ['band-blau','Band blau',0.84,2], ['band-gruen','Band grün',0.83,2], ['band-gelb','Band gelb',0.84,2], ['band-rot','Band rot',0.84,2], ['flagge','Flagge',0.91,2], ['zahnraeder','Zahnräder',1.07,2], ['diagramm','Diagramm',0.97,2],
  ['fussball','Fußball',1.01,3], ['basketball','Basketball',1.00,3], ['huetchen','Hütchen',0.95,3], ['pokal','Pokal',1.00,3], ['medaille','Medaille',0.74,3], ['siegertreppchen','Siegertreppchen',1.38,3],
  ['person','Person',0.77,4], ['menschen','Menschen',1.56,4], ['gruppe','Gruppe',1.35,4], ['handschlag','Handschlag',1.51,4], ['rollstuhl','Rollstuhl',0.92,4], ['sprechblase','Sprechblase',1.09,4], ['gespraech','Gespräch',1.13,4], ['denkblase','Denkblase',1.01,4], ['brief','Brief',1.35,4], ['papierflieger','Papierflieger',1.24,4], ['glocke','Glocke',1.15,4], ['haus','Haus',1.17,4], ['ort','Ort',0.76,4], ['wegweiser','Wegweiser',0.96,4], ['schloss-zu','Schloss zu',0.82,4], ['schloss-offen','Schloss offen',0.97,4], ['schluessel','Schlüssel',1.10,4], ['pylone','Pylone',0.98,4],
  ['laptop','Laptop',1.37,5], ['monitor','Bildschirm',1.16,5], ['tablet','Tablet',0.83,5], ['handy','Handy',0.66,5], ['wlan','WLAN',1.21,5], ['hochladen','Hochladen',1.35,5], ['herunterladen','Herunterladen',1.28,5], ['cloud-sync','Cloud Sync',1.25,5], ['akku-voll','Akku voll',1.67,5], ['akku-leer','Akku leer',1.63,5], ['bild','Bild',1.12,5], ['film','Film',0.98,5], ['ton-an','Ton an',1.18,5], ['ton-aus','Ton aus',1.04,5], ['kopfhoerer','Kopfhörer',1.08,5], ['mikrofon','Mikrofon',0.69,5],
  ['pflanze','Pflanze',1.03,6], ['setzling','Setzling',0.89,6], ['baum','Baum',0.99,6], ['blatt','Blatt',0.91,6], ['erde','Erde',1.01,6], ['recycling','Recycling',1.04,6], ['tropfen','Tropfen',0.76,6], ['feuer','Feuer',0.81,6], ['schneeflocke','Schneeflocke',0.92,6], ['sonne','Sonne',0.98,6], ['regen','Regen',1.01,6]];
const lwSymbolSrc = n => `assets/symbole/${n}.svg`;
let _lwSymbolWahl = null;   // Widget-ID, deren Symbol-Auswahl offen ist
// ◐ neben „Symbol suchen": Symbole schwarz-weiß einfügen (pro Browser gemerkt)
let _lwSymbolGrau = (() => { try { return !!localStorage.getItem('blattwerk-lw-symgrau'); } catch (e) { return false; } })();

const lwIstLinie = it => it.kind === 'line' || it.kind === 'arrow';
const lwClamp = v => Math.max(0, Math.min(100, v));
// Beim Bearbeiten darf über den Rand hinaus gearbeitet werden (abgewählt wird abgeschnitten);
// ein Rest von 3 % bleibt immer auf der Leinwand, damit nichts verloren geht.
const lwClampWeit = v => Math.max(-100, Math.min(200, v));
const lwImBild = (d, lo, hi) => Math.max(3 - hi, Math.min(97 - lo, d));

function lwNeuesElement(kind, d) {
  const id = 1 + Math.max(0, ...(d.items || []).map(i => i.id || 0));
  // Jedes neue Element etwas versetzt, damit es nicht genau auf dem vorigen liegt
  const off = ((d.items || []).length % 6) * 5;
  const base = { id, kind, x: 10 + off, y: 10 + off, w: 26, h: 40, stroke: '#000000', fill: '', sw: 2 };
  if (lwIstLinie(base)) Object.assign(base, { x1: 10 + off, y1: 30 + off, x2: 36 + off, y2: 30 + off });
  if (kind === 'text') Object.assign(base, { w: 34, h: 22, sw: 0, text: 'Text', fontSize: 20, font: 'inherit' });
  if (kind === 'image') Object.assign(base, { sw: 0 });
  // Zeichenebene = ganze Seite (hoch) → kleinere Standardmaße, damit Formen nicht riesig/lang starten
  if (d.type === 'zeichenebene') {
    if (kind === 'rect' || kind === 'ellipse') Object.assign(base, { w: 20, h: 13 });
    if (kind === 'text') Object.assign(base, { h: 7 });
    if (lwIstLinie(base)) Object.assign(base, { y1: 15 + off, y2: 15 + off });
  }
  return base;
}

// Ältere Linien (Box + Richtung) in Zwei-Punkt-Form bringen
function lwPunkte(it) {
  if (!lwIstLinie(it) || it.x1 != null) return;
  const up = it.dir === 'up';
  it.x1 = it.x; it.y1 = up ? it.y + it.h : it.y;
  it.x2 = it.x + it.w; it.y2 = up ? it.y : it.y + it.h;
}

function lwLinieHtml(it, d, aktiv) {
  lwPunkte(it);
  const sw = Math.max(1, it.sw ?? 2);
  const gewaehlt = aktiv && _lwSel && _lwSel.id === d.id && _lwSel.item === it.id;
  const inMulti = aktiv && lwInMulti(d, it);
  const P = `x1="${it.x1}%" y1="${it.y1}%" x2="${it.x2}%" y2="${it.y2}%"`;
  const mid = `lw-ah-${d.id}-${it.id}`;
  const ms = 6 + sw * 3;
  const pfeil = it.kind === 'arrow';
  const marker = pfeil
    ? `<defs><marker id="${mid}" markerWidth="${ms}" markerHeight="${ms}" refX="8" refY="5" orient="auto-start-reverse"
         markerUnits="userSpaceOnUse" viewBox="0 0 10 10"><path d="M0,0 L10,5 L0,10 z" fill="${it.stroke}"/></marker></defs>` : '';
  const spitzen = pfeil ? ` marker-end="url(#${mid})"${it.beide ? ` marker-start="url(#${mid})"` : ''}` : '';
  const halo = gewaehlt || inMulti ? `<line ${P} stroke="#3b6fd4" stroke-opacity="0.25" stroke-width="${sw + 8}" stroke-linecap="round"/>` : '';
  const hit = aktiv ? `<line ${P} stroke="transparent" stroke-width="16" stroke-linecap="round"
       style="pointer-events:stroke;cursor:move;touch-action:none;" onpointerdown="lwDown(event,${d.id},${it.id},'move')"
       ondblclick="lwEinzeln(event,${d.id},${it.id})"/>` : '';
  const griff = (n, x, y) => `<div class="lw-ui" onpointerdown="lwDown(event,${d.id},${it.id},'p${n}')"
       style="position:absolute;left:${x}%;top:${y}%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;
              background:#3b6fd4;border:2px solid #fff;box-sizing:border-box;cursor:crosshair;pointer-events:auto;touch-action:none;"></div>`;
  return `<div data-lw-item="${it.id}" style="position:absolute;inset:0;pointer-events:none;">
      <svg style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;">${marker}${halo}
        <line ${P} stroke="${it.stroke}" stroke-width="${sw}" stroke-linecap="round"${spitzen}/>${hit}</svg>
      ${gewaehlt ? griff(1, it.x1, it.y1) + griff(2, it.x2, it.y2) : ''}</div>`;
}

// Drehgriff über dem Element (unter dem Element, wenn oben kein Platz ist)
function lwDrehGriff(it, d, mode = 'rot', abstand = 0) {
  const unten = it.y * lwMasse(d)[1] / 100 < 34 + abstand;
  const pos = unten ? 'bottom' : 'top';
  return `<div class="lw-ui" style="position:absolute;left:50%;${pos}:${-20 - abstand}px;width:1.5px;height:17px;margin-left:-0.75px;background:#3b6fd4;pointer-events:none;"></div>
    <div class="lw-ui" title="Drehen (Shift = 15°-Schritte)" onpointerdown="lwDown(event,${d.id},${it.id || 0},'${mode}')"
      style="position:absolute;left:50%;${pos}:${-31 - abstand}px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:#fff;
             border:2px solid #3b6fd4;box-sizing:border-box;cursor:grab;touch-action:none;pointer-events:auto;"></div>`;
}

// Text-Baustein: formatierter Inhalt (nur <b>, <i>, <u>, <br> aus richHtml) oder älterer Klartext
function lwTextHtml(it) {
  return it.html != null ? it.html : esc(it.text || '').replace(/\n/g, '<br>');
}

function lwElementHtml(it, d, aktiv) {
  if (lwIstLinie(it)) return lwLinieHtml(it, d, aktiv);
  const st = `position:absolute;left:${it.x}%;top:${it.y}%;width:${it.w}%;height:${it.h}%;box-sizing:border-box;`
           + (it.rot ? `transform:rotate(${it.rot}deg);` : '');
  const sw = it.sw ?? 2;
  let inner = '';
  if (it.kind === 'rect' || it.kind === 'ellipse') {
    const shape = it.kind === 'rect'
      ? `<rect x="0" y="0" width="100" height="100" rx="${it.rund ? 6 : 0}" fill="${it.fill || 'none'}" stroke="${sw ? it.stroke : 'none'}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`
      : `<ellipse cx="50" cy="50" rx="50" ry="50" fill="${it.fill || 'none'}" stroke="${sw ? it.stroke : 'none'}" stroke-width="${sw}" vector-effect="non-scaling-stroke"/>`;
    inner = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;">${shape}</svg>`;
  } else if (it.kind === 'text') {
    const rahmen = sw ? `border:${sw}px solid ${it.stroke};` : '';
    inner = `<div class="lw-text" data-lw-text="${it.id}" ${aktiv ? `ondblclick="lwTextEdit(event,${d.id},${it.id})"` : ''}
        style="position:absolute;inset:0;${rahmen}background:${it.fill || 'transparent'};padding:4px 6px;box-sizing:border-box;
               font-family:${it.font || 'inherit'};font-size:${it.fontSize || 20}px;line-height:1.3;color:${it.color || '#000000'};
               text-align:${it.align || 'left'};white-space:pre-wrap;word-break:break-word;overflow:hidden;border-radius:${it.rund ? 6 : 0}px;">${lwTextHtml(it)}</div>`;
  } else if (it.kind === 'image') {
    const rahmen = sw ? `border:${sw}px solid ${it.stroke};` : '';
    inner = it.src
      ? `<img src="${it.src}" draggable="false" alt=""${it.grau ? ' class="img-sw"' : ''} style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;
           ${it.grau ? 'filter:grayscale(100%);' : ''}${rahmen}box-sizing:border-box;border-radius:${it.rund ? 6 : 0}px;pointer-events:none;user-select:none;">`
      : `<div style="position:absolute;inset:0;border:1.5px dashed #bbb;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px;">Bild</div>`;
  }
  const gewaehlt = aktiv && _lwSel && _lwSel.id === d.id && _lwSel.item === it.id;
  const griffe = gewaehlt
    ? `<div class="lw-ui" style="position:absolute;inset:-3px;border:1.5px dashed #3b6fd4;pointer-events:none;"></div>
       <div class="lw-ui" onpointerdown="lwDown(event,${d.id},${it.id},'size')"
         style="position:absolute;right:-7px;bottom:-7px;width:12px;height:12px;background:#3b6fd4;border:2px solid #fff;
                border-radius:3px;cursor:nwse-resize;touch-action:none;"></div>` + lwDrehGriff(it, d)
    : aktiv && lwInMulti(d, it) ? `<div class="lw-ui" style="position:absolute;inset:-2px;border:1px dashed rgba(59,111,212,.6);pointer-events:none;"></div>` : '';
  const ev = aktiv ? `onpointerdown="lwDown(event,${d.id},${it.id},'move')" ondblclick="lwEinzeln(event,${d.id},${it.id})"` : '';
  return `<div data-lw-item="${it.id}" ${ev} style="${st}${aktiv ? 'cursor:move;touch-action:none;' : ''}">${inner}${griffe}</div>`;
}

WIDGETS.push({
  meta: { type:'leinwand', label:'Leinwand', desc:'Freie Grafiken, Pfeile, Text-Bausteine und Bilder – frei verschieb- und skalierbar',
          icon:'🎨', category:'allgemein', section:'Profi-Tools' },

  createData: id => ({
    id, type:'leinwand', hoehe: 260, border:'thin',
    items: [], aufgabenNr:0, aufgabenText:''
  }),

  render: d => {
    const ebene = d.type === 'zeichenebene';
    const aktiv = d.id === selId && !_solutionsMode && (!ebene || _zeBearbeiten);
    const items = d.items || [];
    const zeichnen = aktiv && _lwZeichne && _lwZeichne.id === d.id;
    const leer = !items.length && !zeichnen && (aktiv || !ebene)
      ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:13px;pointer-events:none;">
           Leere Leinwand – Formen, Pfeile, Text, Bilder und Symbole in den Eigenschaften hinzufügen</div>` : '';
    const hinweis = zeichnen
      ? `<div class="lw-ui" style="position:absolute;left:50%;top:6px;transform:translateX(-50%);background:#3b6fd4;color:#fff;
           font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px;pointer-events:none;white-space:nowrap;z-index:5;">
           ${_lwZeichne.kind === 'arrow' ? 'Pfeil' : 'Linie'}: von Punkt zu Punkt ziehen</div>` : '';
    // will-change (nur beim Bearbeiten): eigene Ebene für die Leinwand. Ohne sie hinterlassen Griffe und
    // Elemente außerhalb des Leinwandrands (overflow:visible) beim Ziehen Spuren, die der Browser
    // erst bei einem vollständigen Neuzeichnen entfernt (v. a. Safari).
    return atHtml(d) + `<div class="lw-canvas" data-lw="${d.id}"
        ${aktiv ? `onpointerdown="lwLeerKlick(event,${d.id})" ondragover="event.preventDefault()" ondrop="lwDrop(event,${d.id})"` : ''}
        style="position:relative;width:100%;height:${ebene ? '100%' : (d.hoehe || 260) + 'px'};${aktiv ? 'overflow:visible;z-index:30;outline:1px dashed rgba(59,111,212,.45);will-change:transform;' : 'overflow:hidden;'}${zeichnen ? 'cursor:crosshair;touch-action:none;' : ''}">${leer}${lwInhalt(d, aktiv)}${hinweis}</div>`;
  },

  renderProps: d => {
    const it = lwItem(d);
    const mehrere = lwAuswahl(d);
    const knopf = (label, onclick, extra = '') => `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:6px 4px;border-radius:4px;border:1.5px solid #ddd;background:#fff;font-family:inherit;
               font-size:11px;font-weight:700;cursor:pointer;color:#444;${extra}">${label}</button>`;
    const tgl = (label, on, onclick) => `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${on?'#89b4fa':'#ddd'};background:${on?'#e8f0ff':'#fff'};
               font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;color:${on?'#1e1e2e':'#999'};">${label}</button>`;
    const swatches = (key, list, cur) => list.map(c => `<button title="${c || 'keine'}" onclick="event.stopPropagation();lwSet(${d.id},'${key}','${c}')"
        style="width:22px;height:22px;border-radius:4px;border:2px solid ${cur === c ? '#3b6fd4' : '#ddd'};cursor:pointer;padding:0;
               background:${c || '#fff'};font-size:11px;color:#bbb;">${c ? '' : '✕'}</button>`).join('');
    const zk = k => _lwZeichne && _lwZeichne.id === d.id && _lwZeichne.kind === k;
    const zeichenKnopf = (label, k) => knopf(label, `lwZeichnen(${d.id},'${k}')`,
        zk(k) ? 'border-color:#3b6fd4;background:#e8f0ff;color:#1e1e2e;' : '');

    let html = `<div class="prow"><label>Hinzufügen</label>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${knopf('▭ Rechteck', `lwAdd(${d.id},'rect')`)}${knopf('◯ Ellipse', `lwAdd(${d.id},'ellipse')`)}${knopf('T Text', `lwAdd(${d.id},'text')`)}
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          ${zeichenKnopf('╱ Linie', 'line')}${zeichenKnopf('➚ Pfeil', 'arrow')}${knopf('🖼 Bild', `lwAddBild(${d.id})`)}
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          ${knopf('★ Symbol', `lwSymbolWahl(${d.id})`, _lwSymbolWahl === d.id ? 'border-color:#3b6fd4;background:#e8f0ff;color:#1e1e2e;' : '')}
        </div>
        ${_lwSymbolWahl === d.id ? `<div style="display:flex;gap:4px;margin-top:6px;">
            <input type="search" placeholder="Symbol suchen …" onclick="event.stopPropagation()" oninput="lwSymbolFilter(this.value)"
              style="flex:1;min-width:0;box-sizing:border-box;padding:5px 8px;border:1.5px solid #ddd;border-radius:5px;font-family:inherit;font-size:12px;">
            <button onclick="event.stopPropagation();lwSymbolGrauUmschalten(${d.id})"
              title="${_lwSymbolGrau ? 'Symbole werden schwarz-weiß eingefügt – klicken für Farbe' : 'Symbole schwarz-weiß einfügen'}"
              style="flex-shrink:0;padding:0 9px;border-radius:5px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:800;
                     border:1.5px solid ${_lwSymbolGrau ? '#333' : '#ddd'};background:${_lwSymbolGrau ? '#333' : '#fff'};color:${_lwSymbolGrau ? '#fff' : '#666'};">◐ S/W</button>
          </div>
          <div class="lw-symgrid" style="margin-top:4px;max-height:340px;overflow-y:auto;border:1.5px solid #e5e5e5;border-radius:6px;padding:5px 6px;background:#fafafa;">
          ${LW_SYMBOL_GRUPPEN.map((g, gi) => `<div class="lw-symgrp">
            <div style="font-size:10px;font-weight:800;color:#888;text-transform:uppercase;letter-spacing:.4px;margin:6px 0 4px;text-align:left;">${g}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:4px;">
            ${LW_SYMBOLE.filter(x => x[3] === gi).map(([n, t]) => `<button title="${t}" onclick="event.stopPropagation();lwSymbolEinfuegen(${d.id},'${n}')"
              style="aspect-ratio:1;border:1.5px solid #e5e5e5;border-radius:5px;background:#fff;cursor:pointer;padding:3px;">
              <img src="${lwSymbolSrc(n)}" alt="${t}" loading="lazy" style="width:100%;height:100%;object-fit:contain;pointer-events:none;${_lwSymbolGrau ? 'filter:grayscale(100%);' : ''}"></button>`).join('')}
            </div></div>`).join('')}
        </div>` : ''}
        ${_lwZeichne && _lwZeichne.id === d.id ? `<div style="font-size:11px;color:#3b6fd4;margin-top:5px;line-height:1.4;">
          Jetzt auf der Leinwand vom Start- zum Endpunkt ziehen. Gerade Linien rasten ein, mit Shift in 45°-Schritten.</div>` : ''}
        </div>` +
      (d.type === 'zeichenebene' ? '' : pr('Höhe der Leinwand (px)', `<input type="number" min="80" max="1000" step="10" value="${d.hoehe || 260}" onchange="upd(${d.id},'hoehe',+this.value)">`));

    if (mehrere.length > 1) {
      const grp = lwAuswahlGruppe(d, mehrere);
      html += `<div style="border-top:1px solid #e5e5e5;margin-top:10px;padding-top:10px;">
        <div style="font-weight:800;font-size:12px;color:#333;margin-bottom:8px;">${grp ? 'Gruppe' : 'Ausgewählt'}: ${mehrere.length} Elemente</div>
        <div style="display:flex;gap:4px;">
          ${grp ? knopf('⊟ Gruppierung aufheben', `lwGruppeAufloesen(${d.id})`)
                : knopf('⊞ Gruppieren', `lwGruppieren(${d.id})`, 'border-color:#3b6fd4;background:#e8f0ff;color:#1e1e2e;')}
        </div>
        <div class="prow" style="margin-top:10px;"><label>Ausrichten</label>
          <div style="display:flex;gap:4px;">
            ${knopf('⇤ Links', `lwAusrichten(${d.id},'links')`)}${knopf('↔ Mitte', `lwAusrichten(${d.id},'hmitte')`)}${knopf('⇥ Rechts', `lwAusrichten(${d.id},'rechts')`)}
          </div>
          <div style="display:flex;gap:4px;margin-top:4px;">
            ${knopf('⤒ Oben', `lwAusrichten(${d.id},'oben')`)}${knopf('↕ Mitte', `lwAusrichten(${d.id},'vmitte')`)}${knopf('⤓ Unten', `lwAusrichten(${d.id},'unten')`)}
          </div>
        </div>
        <div class="prow"><label>Gleichmäßig verteilen</label>
          <div style="display:flex;gap:4px;">
            ${lwEinheiten(d, mehrere).length >= 3
              ? knopf('↔ Horizontal', `lwVerteilen(${d.id},'h')`) + knopf('↕ Vertikal', `lwVerteilen(${d.id},'v')`)
              : '<div style="font-size:11px;color:#aaa;text-align:left;">Dafür mindestens drei Elemente auswählen.</div>'}
          </div>
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          ${knopf('⧉ Duplizieren', `lwDuplizieren(${d.id})`)}${knopf('🗑 Löschen', `lwLoeschen(${d.id})`, 'background:#fde8ec;color:#a0003c;border-color:#f5c2cf;')}
        </div>
        <div style="font-size:11px;color:#999;margin-top:8px;line-height:1.5;">Ziehen verschiebt alle zusammen, Griff unten rechts
          vergrößert, runder Griff dreht. Doppelklick auf ein Element bearbeitet es einzeln.
          Tasten: ${navigator.platform && /Mac/.test(navigator.platform) ? 'Cmd' : 'Strg'}+G gruppieren, +Shift+G aufheben.</div>
      </div>`;
      return html;
    }

    if (!it) {
      html += `<div style="font-size:11px;color:#999;margin-top:8px;line-height:1.5;">Element anklicken zum Auswählen,
        ziehen zum Verschieben, blauer Griff unten rechts zum Vergrößern. Text: Doppelklick zum Bearbeiten.
        Mehrere Elemente: mit Shift anklicken oder auf der leeren Leinwand einen Rahmen aufziehen – dann gruppieren.
        Bilder kann man auch direkt auf die Leinwand ziehen.</div>`;
      return html;
    }

    const linie = lwIstLinie(it);
    const name = it.symbol ? 'Symbol' : { rect:'Rechteck', ellipse:'Ellipse', line:'Linie', arrow:'Pfeil', text:'Text', image:'Bild' }[it.kind];
    html += `<div style="border-top:1px solid #e5e5e5;margin-top:10px;padding-top:10px;">
      <div style="font-weight:800;font-size:12px;color:#333;margin-bottom:8px;">Ausgewählt: ${name}</div>`;
    if (lwPfad(it).length) {
      html += `<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;font-size:11px;color:#666;">
          <span style="flex:1;text-align:left;">Teil einer Gruppe</span>${knopf('Gruppe wählen', `lwGruppeWaehlen(${d.id})`, 'flex:0 0 auto;padding:5px 8px;')}</div>`;
    }
    if (it.kind === 'image' && !it.symbol) {
      html += `<div style="display:flex;gap:4px;margin-bottom:8px;">${knopf('🖼 Bild ändern', `lwBildAendern(${d.id})`)}</div>`;
    }
    if (it.kind === 'image') {
      html += `<div class="prow"><label>Farbe</label><div style="display:flex;gap:4px;">
          ${tgl('Farbig', !it.grau, `lwSet(${d.id},'grau',false)`)}${tgl('◐ Schwarz-Weiß', !!it.grau, `lwSet(${d.id},'grau',true)`)}</div></div>`;
    }
    if (it.kind === 'text') {
      const font = it.font || 'inherit';
      const fb = (cmd, label, style) => `<button id="txbtn-lw${d.id}-${cmd}" onmousedown="event.preventDefault()"
          onclick="event.stopPropagation();lwRichFmt(${d.id},'${cmd}')"
          style="padding:4px 8px;border-radius:4px;border:1.5px solid #ddd;background:#fff;font-family:inherit;font-size:13px;cursor:pointer;${style}">${label}</button>`;
      html += `<div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:4px;padding:5px 6px;border-bottom:1px solid #eee;background:#fafafa;">
            ${fb('bold', 'B', 'font-weight:800;')}${fb('italic', 'K', 'font-style:italic;font-weight:700;')}
            ${fb('underline', 'U', 'text-decoration:underline;font-weight:700;')}${fb('removeFormat', '✕', 'color:#aaa;font-size:11px;')}
            <div style="margin-left:auto;"><input type="number" min="8" max="80" value="${it.fontSize || 20}" title="Schriftgröße"
              onclick="event.stopPropagation()" onchange="lwSet(${d.id},'fontSize',+this.value)"
              style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;font-family:inherit;font-size:12px;text-align:center;"></div>
          </div>
          <div id="lwted-${d.id}" contenteditable="true" onclick="event.stopPropagation()"
            onpaste="event.preventDefault();document.execCommand('insertText',false,(event.clipboardData||window.clipboardData).getData('text/plain'))"
            onkeydown="if(event.key==='Enter'){event.preventDefault();document.execCommand('insertLineBreak');lwRichSave(${d.id},this);}"
            onfocus="edFocus()" oninput="lwRichSave(${d.id},this)" onblur="lwRichSave(${d.id},this);edBlur()"
            onkeyup="richUpdateBtns('lw${d.id}')" onmouseup="richUpdateBtns('lw${d.id}')"
            style="outline:none;padding:8px 10px;font-family:${font};font-size:${typeof RICH_EDITOR_FONT_SIZE !== 'undefined' ? RICH_EDITOR_FONT_SIZE : 13}px;
                   line-height:1.7;min-height:54px;color:#333;white-space:pre-wrap;word-break:break-word;text-align:left;">${lwTextHtml(it)}</div>
          <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
            <select onchange="lwSet(${d.id},'font',this.value)"
              style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
              ${GAP_FONTS.map(f => `<option value="${f.value}" ${font === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
            </select>
          </div>
        </div>` +
        `<div class="prow"><label>Ausrichtung</label><div style="display:flex;gap:4px;">
          ${tgl('Links', (it.align||'left')==='left', `lwSet(${d.id},'align','left')`)}${tgl('Mitte', it.align==='center', `lwSet(${d.id},'align','center')`)}${tgl('Rechts', it.align==='right', `lwSet(${d.id},'align','right')`)}
        </div></div>` +
        `<div class="prow"><label>Textfarbe</label><div style="display:flex;gap:3px;flex-wrap:wrap;">${swatches('color', LW_FARBEN, it.color || '#000000')}</div></div>`;
    }
    if (it.kind === 'arrow') {
      html += `<div class="prow"><label>Spitzen</label><div style="display:flex;gap:4px;">
          ${tgl('→ eine', !it.beide, `lwSet(${d.id},'beide',false)`)}${tgl('↔ beide', !!it.beide, `lwSet(${d.id},'beide',true)`)}
          ${knopf('⇄ Umdrehen', `lwUmdrehen(${d.id})`)}
        </div></div>`;
    }
    if (linie) {
      html += `<div style="font-size:10px;color:#aaa;margin:-2px 0 8px;line-height:1.4;">Blaue Punkte an den Enden ziehen, um Start und Ziel zu ändern. Shift = 45°-Schritte.</div>`;
    }
    const rahmenArt = it.kind === 'text' || it.kind === 'image';
    html += `<div class="prow"><label>${rahmenArt ? 'Rahmenfarbe' : 'Linienfarbe'}</label><div style="display:flex;gap:3px;flex-wrap:wrap;">${swatches('stroke', LW_FARBEN, it.stroke)}</div></div>` +
      `<div class="prow"><label>${rahmenArt ? 'Rahmen' : 'Linienstärke'}</label><div style="display:flex;gap:4px;">
        ${(linie ? [1,2,3,5] : [0,1,2,3,5]).map(v => tgl(v === 0 ? 'ohne' : v + ' px', (it.sw ?? 2) === v, `lwSet(${d.id},'sw',${v})`)).join('')}
      </div></div>`;
    if (!linie) {
      if (it.kind !== 'image') html += `<div class="prow"><label>Füllung</label><div style="display:flex;gap:3px;flex-wrap:wrap;">${swatches('fill', LW_FUELLUNG, it.fill || '')}</div></div>`;
      if (it.kind !== 'ellipse') html += `<div class="prow"><label>Ecken</label><div style="display:flex;gap:4px;">${tgl('Eckig', !it.rund, `lwSet(${d.id},'rund',false)`)}${tgl('Rund', !!it.rund, `lwSet(${d.id},'rund',true)`)}</div></div>`;
    }
    if (!linie) {
      html += `<div class="prow"><label>Drehung (°)</label><div style="display:flex;gap:4px;align-items:center;">
          <input type="number" min="-180" max="180" step="5" value="${Math.round(it.rot || 0)}" onclick="event.stopPropagation()"
            onchange="lwSet(${d.id},'rot',((+this.value % 360) + 540) % 360 - 180)" style="flex:1;">
          ${knopf('↺ 0°', `lwSet(${d.id},'rot',0)`, 'flex:0 0 auto;padding:6px 10px;')}
        </div></div>`;
    }
    html += `<div style="display:flex;gap:4px;margin-top:8px;">
        ${knopf('⬆ Nach vorne', `lwEbene(${d.id},1)`)}${knopf('⬇ Nach hinten', `lwEbene(${d.id},-1)`)}
      </div>
      <div style="display:flex;gap:4px;margin-top:4px;">
        ${knopf('⧉ Duplizieren', `lwDuplizieren(${d.id})`)}${knopf('🗑 Löschen', `lwLoeschen(${d.id})`, 'background:#fde8ec;color:#a0003c;border-color:#f5c2cf;')}
      </div></div>`;
    return html;
  },
});

// ── Aktionen ──────────────────────────────────────────────────────
function lwW(id) { return widgets.find(x => x.id === id); }
function lwItem(w) { return w && _lwSel && _lwSel.id === w.id && !_lwSel.multi ? (w.items || []).find(i => i.id === _lwSel.item) : null; }

// ── Mehrfachauswahl & Gruppen ─────────────────────────────────────
function lwSelIds(w) {
  if (!w || !_lwSel || _lwSel.id !== w.id) return [];
  return _lwSel.multi ? _lwSel.multi.slice() : (_lwSel.item != null ? [_lwSel.item] : []);
}
function lwAuswahl(w) { const ids = lwSelIds(w); return (w && w.items || []).filter(i => ids.includes(i.id)); }
function lwInMulti(d, it) { return !!(_lwSel && _lwSel.id === d.id && _lwSel.multi && _lwSel.multi.includes(it.id)); }
function lwSetzeAuswahl(id, ids, ebene = 0) {
  ids = [...new Set(ids)];
  _lwSel = !ids.length ? null : ids.length === 1 ? { id, item: ids[0], ebene } : { id, item: null, multi: ids, ebene };
}
// Gruppenpfad eines Elements (ältere Blätter: einzelne Nummer in it.gruppe)
function lwPfad(it) {
  if (!it.gruppen) { it.gruppen = it.gruppe ? [it.gruppe] : []; delete it.gruppe; }
  return it.gruppen;
}
function lwMitglieder(w, g) { return w.items.filter(i => lwPfad(i).includes(g)); }
// Auswahl-Einheit auf Ebene t: die Gruppe pfad[t] – oder das Element selbst, wenn es tiefer keine Gruppe gibt
function lwEinheit(w, it, t) {
  const p = lwPfad(it);
  if (t < p.length) return { ids: lwMitglieder(w, p[t]).map(i => i.id), ebene: t };
  return { ids: [it.id], ebene: p.length };
}
// Genau eine Gruppe ausgewählt? → deren ID (sonst null)
function lwAuswahlGruppe(w, items) {
  if (items.length < 2) return null;
  const ids = new Set(items.map(i => i.id));
  for (const g of lwPfad(items[0])) {
    if (!items.every(i => lwPfad(i).includes(g))) continue;
    const m = lwMitglieder(w, g);
    if (m.length === items.length && m.every(i => ids.has(i.id))) return g;
  }
  return null;
}
function lwNeueGruppenId(w) { return 1 + Math.max(0, ...w.items.flatMap(i => lwPfad(i))); }
// Gemeinsamer Pfad-Anfang aller Elemente
function lwGemeinsamerPfad(items) {
  const ps = items.map(lwPfad); let n = 0;
  while (ps.every(p => p.length > n && p[n] === ps[0][n])) n++;
  return ps[0] ? ps[0].slice(0, n) : [];
}
// IDs um alle Mitglieder ihrer jeweils ÄUSSERSTEN Gruppe ergänzen
function lwMitGruppe(w, ids) {
  const g = new Set(w.items.filter(i => ids.includes(i.id) && lwPfad(i).length).map(i => lwPfad(i)[0]));
  return [...new Set([...ids, ...w.items.filter(i => g.has(lwPfad(i)[0])).map(i => i.id)])];
}
// Leinwandmaße in px (für gedrehte Elemente nötig, da x/y in % unterschiedlich skaliert sind)
function lwMasse(d) {
  const c = d && lwCanvas(d.id);
  return c && c.clientWidth ? [c.clientWidth, c.clientHeight] : [700, (d && d.hoehe) || 260];
}
function lwBox(it, m) {
  if (lwIstLinie(it)) { lwPunkte(it); return { x: Math.min(it.x1, it.x2), y: Math.min(it.y1, it.y2), x2: Math.max(it.x1, it.x2), y2: Math.max(it.y1, it.y2) }; }
  if (!it.rot || !m) return { x: it.x, y: it.y, x2: it.x + it.w, y2: it.y + it.h };
  // Gedreht: umschließendes Rechteck der gedrehten Box
  const [cw, ch] = m, t = it.rot * Math.PI / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  const hw = it.w * cw / 200, hh = it.h * ch / 200;
  const ex = (hw * c + hh * s) / cw * 100, ey = (hw * s + hh * c) / ch * 100;
  const mx = it.x + it.w / 2, my = it.y + it.h / 2;
  return { x: mx - ex, y: my - ey, x2: mx + ex, y2: my + ey };
}
function lwBBox(items, m) {
  const bs = items.map(i => lwBox(i, m));
  return { x: Math.min(...bs.map(b => b.x)), y: Math.min(...bs.map(b => b.y)), x2: Math.max(...bs.map(b => b.x2)), y2: Math.max(...bs.map(b => b.y2)) };
}
// Rahmen um die Mehrfachauswahl mit Größen- und Drehgriff
function lwMultiHtml(d) {
  const items = lwAuswahl(d); if (items.length < 2) return '';
  const b = lwBBox(items, lwMasse(d)), grp = lwAuswahlGruppe(d, items);
  return `<div class="lw-ui" style="position:absolute;left:${b.x}%;top:${b.y}%;width:${b.x2 - b.x}%;height:${b.y2 - b.y}%;
      outline:1.5px ${grp ? 'solid' : 'dashed'} #3b6fd4;outline-offset:5px;pointer-events:none;z-index:4;">
      <div class="lw-ui" title="Alle vergrößern/verkleinern" onpointerdown="lwDown(event,${d.id},0,'msize')"
        style="position:absolute;right:-12px;bottom:-12px;width:12px;height:12px;background:#3b6fd4;border:2px solid #fff;
               border-radius:3px;cursor:nwse-resize;touch-action:none;pointer-events:auto;"></div>
      ${lwDrehGriff({ y: b.y }, d, 'mrot', 5)}</div>`;
}
function lwInhalt(d, aktiv) {
  return (d.items || []).map(it => lwElementHtml(it, d, aktiv)).join('') + (aktiv ? lwMultiHtml(d) : '');
}
function lwCanvasNeu(id) {
  const w = lwW(id), c = lwCanvas(id); if (!w || !c) return;
  const m = c.querySelector('.lw-marquee');
  c.querySelectorAll('[data-lw-item], .lw-ui').forEach(el => { if (el.parentElement === c) el.remove(); });
  c.insertAdjacentHTML('beforeend', lwInhalt(w, true));
  if (m) c.appendChild(m);
}
// ── Ausrichten & Verteilen ────────────────────────────────────────
// Einheiten: ganze Gruppen bewegen sich gemeinsam. Ist genau EINE Gruppe ausgewählt,
// werden ihre Elemente einzeln ausgerichtet (Ordnen innerhalb der Gruppe).
function lwEinheiten(w, items) {
  // Einheiten = Untergruppen direkt unterhalb des gemeinsamen Pfads (ist eine Gruppe ausgewählt,
  // gehört sie zum gemeinsamen Pfad → ihre Teile werden geordnet)
  const n = lwGemeinsamerPfad(items).length;
  const map = new Map(), out = [];
  items.forEach(i => {
    const g = lwPfad(i)[n];
    if (g == null) { out.push([i]); return; }
    if (!map.has(g)) { const u = []; map.set(g, u); out.push(u); }
    map.get(g).push(i);
  });
  return out;
}
function lwVerschiebe(items, dx, dy) {
  items.forEach(i => {
    if (lwIstLinie(i)) { lwPunkte(i); i.x1 += dx; i.x2 += dx; i.y1 += dy; i.y2 += dy; }
    else { i.x += dx; i.y += dy; }
  });
}
function lwAusrichten(id, art) {
  const w = lwW(id), items = lwAuswahl(w); if (items.length < 2) return;
  const m = lwMasse(w), b = lwBBox(items, m), units = lwEinheiten(w, items);
  saveHistory();
  units.forEach(u => {
    const ub = lwBBox(u, m);
    const dx = art === 'links' ? b.x - ub.x : art === 'rechts' ? b.x2 - ub.x2 : art === 'hmitte' ? (b.x + b.x2) / 2 - (ub.x + ub.x2) / 2 : 0;
    const dy = art === 'oben' ? b.y - ub.y : art === 'unten' ? b.y2 - ub.y2 : art === 'vmitte' ? (b.y + b.y2) / 2 - (ub.y + ub.y2) / 2 : 0;
    lwVerschiebe(u, dx, dy);
  });
  lwRefresh(id);
}
// Zwischen dem äußersten linken (oberen) und rechten (unteren) Element gleiche Abstände
function lwVerteilen(id, achse) {
  const w = lwW(id), items = lwAuswahl(w); if (items.length < 3) return;
  const m = lwMasse(w);
  const units = lwEinheiten(w, items).map(u => ({ u, b: lwBBox(u, m) })); if (units.length < 3) return;
  const [a, a2] = achse === 'h' ? ['x', 'x2'] : ['y', 'y2'];
  units.sort((p, q) => p.b[a] - q.b[a]);
  const start = units[0].b[a], ende = Math.max(...units.map(e => e.b[a2]));
  const summe = units.reduce((s, e) => s + (e.b[a2] - e.b[a]), 0);
  const luecke = (ende - start - summe) / (units.length - 1);
  saveHistory();
  let pos = start;
  units.forEach(e => {
    const d = pos - e.b[a];
    achse === 'h' ? lwVerschiebe(e.u, d, 0) : lwVerschiebe(e.u, 0, d);
    pos += (e.b[a2] - e.b[a]) + luecke;
  });
  lwRefresh(id);
}

// Neue Gruppe direkt unterhalb des gemeinsamen Pfads einfügen → bestehende Gruppen bleiben als Untergruppen erhalten
function lwGruppieren(id) {
  const w = lwW(id), items = lwAuswahl(w); if (items.length < 2) return;
  if (lwAuswahlGruppe(w, items)) return;             // ist schon genau eine Gruppe
  saveHistory();
  const gid = lwNeueGruppenId(w), n = lwGemeinsamerPfad(items).length;
  items.forEach(i => { const p = lwPfad(i); p.splice(n, 0, gid); });
  lwSetzeAuswahl(id, items.map(i => i.id), n);
  lwRefresh(id);
}
// Die ausgewählte Gruppe auflösen (Untergruppen bleiben bestehen)
function lwGruppeAufloesen(id) {
  const w = lwW(id), items = lwAuswahl(w), g = lwAuswahlGruppe(w, items); if (g == null) return;
  saveHistory();
  items.forEach(i => { const p = lwPfad(i), k = p.indexOf(g); if (k >= 0) p.splice(k, 1); });
  lwRefresh(id);
}
// Vom einzelnen Element eine Ebene nach oben: seine innerste Gruppe
function lwGruppeWaehlen(id) {
  const w = lwW(id), it = lwItem(w); if (!it) return;
  const p = lwPfad(it); if (!p.length) return;
  lwSetzeAuswahl(id, lwMitglieder(w, p[p.length - 1]).map(i => i.id), p.length - 1);
  lwRefresh(id);
}
// Doppelklick: eine Ebene tiefer (äußere Gruppe → Untergruppe → … → Element)
function lwTiefer(e, id, itemId) {
  const w = lwW(id), it = w && w.items.find(i => i.id === itemId); if (!it) return;
  const ids = lwSelIds(w);
  const ebene = ids.includes(itemId) && _lwSel ? (_lwSel.ebene ?? (ids.length > 1 ? 0 : lwPfad(it).length)) + 1 : 1;
  const u = lwEinheit(w, it, ebene);
  if (u.ids.length > 1) { lwSetzeAuswahl(id, u.ids, u.ebene); lwRefresh(id); return; }
  if (it.kind === 'text') lwTextEdit(e, id, itemId); else lwEinzeln(e, id, itemId);
}
// Doppelklick: ein einzelnes Element (auch innerhalb einer Gruppe) auswählen
function lwEinzeln(e, id, itemId) {
  if (selId !== id) return;
  e.stopPropagation();
  if (_lwSel && _lwSel.id === id && !_lwSel.multi && _lwSel.item === itemId) return;
  _lwSel = { id, item: itemId, ebene: lwPfad(lwW(id).items.find(i => i.id === itemId) || {}).length };
  lwRefresh(id);
}
// Nur die Leinwand neu zeichnen (Zeichenebene liegt außerhalb des Flusses → eigener Weg)
function lwPatch(id) {
  const w = lwW(id);
  if (w && w.type === 'zeichenebene') {
    const win = document.querySelector(`.wwrap.zeichenebene[data-id="${id}"] > .winner`);
    if (!win) return false;
    win.innerHTML = WIDGET_MAP.zeichenebene.render(w);
    return true;
  }
  return typeof patchWidget === 'function' && patchWidget(id);
}
function lwRefresh(id) { if (!lwPatch(id)) render(); renderProps(id); }
function lwCanvas(id) { return document.querySelector(`.lw-canvas[data-lw="${id}"]`); }

function lwAdd(id, kind) {
  const w = lwW(id); if (!w) return;
  saveHistory();
  _lwZeichne = null;
  const it = lwNeuesElement(kind, w);
  w.items = [...(w.items || []), it];
  _lwSel = { id, item: it.id };
  lwRefresh(id);
}
function lwZeichnen(id, kind) {
  _lwZeichne = (_lwZeichne && _lwZeichne.id === id && _lwZeichne.kind === kind) ? null : { id, kind };
  lwRefresh(id);
}
function lwSet(id, key, val) {
  const w = lwW(id), it = lwItem(w); if (!it) return;
  saveHistory();
  it[key] = val;
  lwRefresh(id);
}
// Text tippen: nur Leinwand aktualisieren (Fokus im Textfeld bleibt erhalten)
// Formatierter Text: speichern + nur den Baustein auf der Leinwand aktualisieren (Fokus bleibt im Editor)
let _lwFormatting = false;
function lwRichSave(id, el) {
  if (_lwFormatting) return;
  const w = lwW(id), it = lwItem(w); if (!it || it.kind !== 'text') return;
  it.html = richHtml(el);
  it.text = el.innerText;
  _dirty = true;
  const t = document.querySelector(`.lw-canvas[data-lw="${id}"] [data-lw-text="${it.id}"]`);
  if (t) t.innerHTML = it.html;
  if (typeof scheduleDraftSave === 'function') scheduleDraftSave();
}
function lwRichFmt(id, cmd) {
  const el = document.getElementById(`lwted-${id}`); if (!el) return;
  el.focus();
  const sel = window.getSelection(), range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
  const state = document.queryCommandState(cmd);
  const tag = { bold:'b', italic:'i', underline:'u' }[cmd];
  _lwFormatting = true;
  if (tag && range && !range.collapsed && !state) {
    // Einschalten: selbst umschließen (execCommand würde Leerzeichen abschneiden)
    const wrap = document.createElement(tag);
    wrap.appendChild(range.extractContents());
    range.insertNode(wrap);
    const nr = document.createRange(); nr.selectNodeContents(wrap);
    sel.removeAllRanges(); sel.addRange(nr);
  } else {
    document.execCommand(cmd, false, null);
  }
  _lwFormatting = false;
  lwRichSave(id, el);
  _lwFormatting = true; setTimeout(() => { _lwFormatting = false; }, 0);
  richUpdateBtns('lw' + id);
}

function lwSetQuiet(id, key, val) {
  const w = lwW(id), it = lwItem(w); if (!it) return;
  it[key] = val; _dirty = true;
  const el = document.querySelector(`.lw-canvas[data-lw="${id}"] [data-lw-text="${it.id}"]`);
  if (el) el.textContent = val;
  if (typeof scheduleDraftSave === 'function') scheduleDraftSave();
}
function lwUmdrehen(id) {
  const w = lwW(id), it = lwItem(w); if (!it || !lwIstLinie(it)) return;
  saveHistory();
  [it.x1, it.y1, it.x2, it.y2] = [it.x2, it.y2, it.x1, it.y1];
  lwRefresh(id);
}
function lwEbene(id, dir) {
  const w = lwW(id), it = lwItem(w); if (!it) return;
  saveHistory();
  const a = w.items, i = a.indexOf(it), j = Math.max(0, Math.min(a.length - 1, i + dir));
  a.splice(i, 1); a.splice(j, 0, it);
  lwRefresh(id);
}
function lwDuplizieren(id) {
  const w = lwW(id), items = lwAuswahl(w); if (!items.length) return;
  saveHistory();
  const b = lwBBox(items, lwMasse(w));
  const dx = b.x2 + 4 > 100 ? -4 : 4, dy = b.y2 + 4 > 100 ? -4 : 4;
  let next = 1 + Math.max(0, ...w.items.map(i => i.id)), gnext = lwNeueGruppenId(w);
  // Gruppen, die ganz in der Auswahl liegen, bekommen neue IDs; umgebende Gruppen bleiben (Kopie gehört mit dazu)
  const ids = new Set(items.map(i => i.id)), gmap = {};
  const neu = items.map(it => {
    const c = JSON.parse(JSON.stringify(it));
    c.id = next++;
    c.gruppen = lwPfad(it).map(g => {
      if (!lwMitglieder(w, g).every(m => ids.has(m.id))) return g;
      if (!(g in gmap)) gmap[g] = gnext++;
      return gmap[g];
    });
    if (lwIstLinie(c)) { c.x1 += dx; c.x2 += dx; c.y1 += dy; c.y2 += dy; }
    else { c.x += dx; c.y += dy; }
    return c;
  });
  w.items.push(...neu);
  lwSetzeAuswahl(id, neu.map(c => c.id), _lwSel && _lwSel.ebene || 0);
  lwRefresh(id);
}
function lwLoeschen(id) {
  const w = lwW(id), ids = lwSelIds(w); if (!ids.length) return;
  saveHistory();
  w.items = w.items.filter(i => !ids.includes(i.id)); _lwSel = null;
  lwRefresh(id);
}
function lwLeerKlick(e, id) {
  if (_lwZeichne && _lwZeichne.id === id) { lwZeichnenStart(e, id); return; }
  if (e.target.closest('[data-lw-item]') || e.target.closest('.lw-ui')) return;
  // Leere Fläche: Auswahlrahmen aufziehen (bloßer Klick = Auswahl aufheben, s. pointerup).
  // preventDefault: kein Widget-Ziehen/Textmarkieren durch den Browser
  e.preventDefault();
  const r = e.currentTarget.getBoundingClientRect();
  _lwDrag = { id, mode: 'marquee', sx: e.clientX, sy: e.clientY, rl: r.left, rt: r.top, cw: r.width, ch: r.height,
              moved: false, shift: e.shiftKey, vorher: lwSelIds(lwW(id)) };
}
function lwTextEdit(e, id, itemId) {
  e.stopPropagation();
  _lwSel = { id, item: itemId, ebene: lwPfad(lwW(id).items.find(i => i.id === itemId) || {}).length };
  if (!lwPatch(id)) render();
  renderProps(id);
  if (typeof setPropTab === 'function') setPropTab('inhalt');
  const ed = document.getElementById(`lwted-${id}`);
  if (ed) { ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
}

// ── Bilder ────────────────────────────────────────────────────────
// Bildgröße so wählen, dass das Seitenverhältnis stimmt (w/h in % der Leinwand)
function lwBildMasse(id, ar, breite) {
  const c = lwCanvas(id), w = lwW(id);
  const cw = c ? c.clientWidth : 700, ch = c ? c.clientHeight : (w && w.hoehe || 260);
  let bw = breite, bh = bw * cw / ch / ar;
  if (bh > 85) { bh = 85; bw = bh * ch / cw * ar; }
  return [bw, bh];
}
function lwBildLaden(src, fertig) {
  const im = new Image();
  im.onload = () => fertig((im.naturalWidth || 1) / (im.naturalHeight || 1));
  im.onerror = () => fertig(1);
  im.src = src;
}
function lwSymbolWahl(id) {
  _lwSymbolWahl = _lwSymbolWahl === id ? null : id;
  renderProps(id);
}
function lwSymbolFilter(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#pi .lw-symgrp').forEach(g => {
    let n = 0;
    g.querySelectorAll('button').forEach(b => { const ok = !q || b.title.toLowerCase().includes(q); b.style.display = ok ? '' : 'none'; n += ok; });
    g.style.display = n ? '' : 'none';
  });
}
function lwSymbolEinfuegen(id, name) {
  const s = LW_SYMBOLE.find(x => x[0] === name); if (!s) return;
  lwBildEinfuegen(id, lwSymbolSrc(name), null, null, { ar: s[2], breite: 14, symbol: name, grau: _lwSymbolGrau });
}
function lwSymbolGrauUmschalten(id) {
  _lwSymbolGrau = !_lwSymbolGrau;
  try { localStorage.setItem('blattwerk-lw-symgrau', _lwSymbolGrau ? '1' : ''); } catch (e) {}
  // ausgewähltes Symbol gleich mit umstellen
  const w = lwW(id), it = lwItem(w);
  if (it && it.symbol && !!it.grau !== _lwSymbolGrau) { saveHistory(); it.grau = _lwSymbolGrau; lwPatch(id); }
  renderProps(id);
}
function lwBildEinfuegen(id, src, px, py, opt = {}) {
  const weiter = fertig => opt.ar ? fertig(opt.ar) : lwBildLaden(src, fertig);
  weiter(ar => {
    const w = lwW(id); if (!w) return;
    saveHistory();
    _lwZeichne = null;
    const it = lwNeuesElement('image', w);
    const [bw, bh] = lwBildMasse(id, ar, opt.breite || 30);
    Object.assign(it, { src, ar, w: bw, h: bh });
    if (opt.symbol) it.symbol = opt.symbol;
    if (opt.grau) it.grau = true;
    if (px != null) { it.x = Math.max(0, Math.min(100 - bw, px - bw / 2)); it.y = Math.max(0, Math.min(100 - bh, py - bh / 2)); }
    else { it.x = Math.min(it.x, 100 - bw); it.y = Math.min(it.y, 100 - bh); }
    w.items = [...(w.items || []), it];
    _lwSel = { id, item: it.id };
    lwRefresh(id);
  });
}
function lwAddBild(id) {
  openImgPicker({ query: '', onPick: src => lwBildEinfuegen(id, src) });
}
function lwBildAendern(id) {
  const w0 = lwW(id), it0 = lwItem(w0); if (!it0) return;
  const itemId = it0.id;
  openImgPicker({ query: '', onPick: src => lwBildLaden(src, ar => {
    const w = lwW(id), it = w && w.items.find(i => i.id === itemId); if (!it) return;
    saveHistory();
    const [bw, bh] = lwBildMasse(id, ar, it.w);
    Object.assign(it, { src, ar, w: bw, h: bh });
    _lwSel = { id, item: itemId };
    lwRefresh(id);
  }) });
}
function lwDrop(e, id) {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  e.preventDefault(); e.stopPropagation();
  const r = e.currentTarget.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width * 100, py = (e.clientY - r.top) / r.height * 100;
  const reader = new FileReader();
  reader.onload = ev => lwBildEinfuegen(id, ev.target.result, px, py);
  reader.readAsDataURL(file);
}

// ── Linie/Pfeil zeichnen ──────────────────────────────────────────
// Gerade (waagerecht/senkrecht) rastet ein, Shift = 45°-Schritte
function lwSnap(ox, oy, px, py, cw, ch, shift) {
  const vx = (px - ox) * cw / 100, vy = (py - oy) * ch / 100, len = Math.hypot(vx, vy);
  if (len < 1) return [px, py];
  const a = Math.atan2(vy, vx), step = shift ? Math.PI / 4 : Math.PI / 2, s = Math.round(a / step) * step;
  if (!shift && Math.abs(a - s) > 4 * Math.PI / 180) return [px, py];
  return [ox + Math.cos(s) * len / cw * 100, oy + Math.sin(s) * len / ch * 100];
}
function lwZeichnenStart(e, id) {
  e.preventDefault(); e.stopPropagation();
  const w = lwW(id); if (!w) return;
  const r = e.currentTarget.getBoundingClientRect();
  const px = lwClamp((e.clientX - r.left) / r.width * 100), py = lwClamp((e.clientY - r.top) / r.height * 100);
  saveHistory();
  const it = lwNeuesElement(_lwZeichne.kind, w);
  Object.assign(it, { x1: px, y1: py, x2: px, y2: py });
  w.items = [...(w.items || []), it];
  _lwSel = { id, item: it.id };
  _lwDrag = { id, itemId: it.id, mode: 'p2', neu: true, sx: e.clientX, sy: e.clientY,
              rl: r.left, rt: r.top, cw: r.width, ch: r.height, moved: true };
  lwRefresh(id);
}

// ── Ziehen / Größe ändern ─────────────────────────────────────────
function lwDown(e, id, itemId, mode) {
  if (selId !== id) return;                       // erst Widget anwählen
  if (_lwZeichne && _lwZeichne.id === id) return; // Zeichenmodus: Klick geht an die Leinwand
  e.stopPropagation(); e.preventDefault();
  const w = lwW(id); if (!w) return;
  let canvas = lwCanvas(id); if (!canvas) return;
  if (mode === 'msize' || mode === 'mrot') { lwMultiStart(e, w, canvas.getBoundingClientRect(), mode); return; }
  const it = w.items.find(i => i.id === itemId); if (!it) return;
  if (mode === 'move' && !e.shiftKey) {
    // Doppelklick selbst erkennen (das Element wird beim ersten Klick neu gezeichnet → kein natives dblclick)
    const jetzt = Date.now(), l = _lwLetzterKlick;
    _lwLetzterKlick = { id, itemId, t: jetzt };
    if (l && l.id === id && l.itemId === itemId && jetzt - l.t < 450) {
      _lwLetzterKlick = null;
      lwTiefer(e, id, itemId);
      return;
    }
  }
  if (mode === 'move') {
    const ids = lwSelIds(w);
    if (e.shiftKey) {                              // Shift+Klick: zur Auswahl hinzufügen / entfernen
      const neu = lwMitGruppe(w, [itemId]), drin = neu.every(i => ids.includes(i));
      lwSetzeAuswahl(id, drin ? ids.filter(i => !neu.includes(i)) : [...ids, ...neu]);
      lwRefresh(id); return;
    }
    if (ids.length > 1 && ids.includes(itemId)) { lwMultiStart(e, w, canvas.getBoundingClientRect(), 'mmove'); return; }
    const u = lwEinheit(w, it, 0);
    if (!ids.includes(itemId) && u.ids.length > 1) {   // Klick auf Gruppe: äußerste Gruppe zusammen
      lwSetzeAuswahl(id, u.ids, 0);
      lwRefresh(id);
      canvas = lwCanvas(id);
      lwMultiStart(e, w, canvas.getBoundingClientRect(), 'mmove'); return;
    }
  }
  const neuGewaehlt = !(_lwSel && _lwSel.id === id && _lwSel.item === itemId);
  if (neuGewaehlt) _lwSel = { id, item: itemId, ebene: lwPfad(it).length };
  const r = canvas.getBoundingClientRect();
  lwPunkte(it);
  _lwDrag = { id, itemId, mode, sx: e.clientX, sy: e.clientY, x: it.x, y: it.y, w: it.w, h: it.h,
              x1: it.x1, y1: it.y1, x2: it.x2, y2: it.y2,
              rl: r.left, rt: r.top, cw: r.width, ch: r.height, moved: false };
  if (mode === 'rot') {
    const el = canvas.querySelector(`[data-lw-item="${itemId}"]`), b = el.getBoundingClientRect();
    _lwDrag.cx = b.left + b.width / 2; _lwDrag.cy = b.top + b.height / 2;
  }
  if (neuGewaehlt) { lwRefresh(id); }             // Griffe zeigen
}
function lwMultiStart(e, w, r, mode) {
  const items = lwAuswahl(w); if (!items.length) return;
  const b = lwBBox(items, [r.width, r.height]);
  const snap = items.map(i => ({ ref: i, x: i.x, y: i.y, w: i.w, h: i.h, x1: i.x1, y1: i.y1, x2: i.x2, y2: i.y2, rot: i.rot || 0, fs: i.fontSize }));
  const g = _lwDrag = { id: w.id, multi: true, mode, sx: e.clientX, sy: e.clientY, rl: r.left, rt: r.top, cw: r.width, ch: r.height, b, snap, moved: false };
  if (mode === 'mrot') {
    g.gx = r.left + (b.x + b.x2) / 2 / 100 * r.width; g.gy = r.top + (b.y + b.y2) / 2 / 100 * r.height;
    g.a0 = Math.atan2(e.clientY - g.gy, e.clientX - g.gx);
  }
}
function lwMultiMove(g, e, dx, dy) {
  const b = g.b, cw = g.cw, ch = g.ch;
  if (g.mode === 'mmove') {
    const mx = lwImBild(dx, b.x, b.x2), my = lwImBild(dy, b.y, b.y2);
    g.snap.forEach(s => {
      const i = s.ref;
      if (lwIstLinie(i)) { i.x1 = s.x1 + mx; i.x2 = s.x2 + mx; i.y1 = s.y1 + my; i.y2 = s.y2 + my; }
      else { i.x = s.x + mx; i.y = s.y + my; }
    });
  } else if (g.mode === 'msize') {
    // Gleichmäßig skalieren (Seitenverhältnisse bleiben), Ankerpunkt oben links
    const bw = (b.x2 - b.x) / 100 * cw, bh = (b.y2 - b.y) / 100 * ch;
    const fx = bw > 5 ? (bw + e.clientX - g.sx) / bw : null, fy = bh > 5 ? (bh + e.clientY - g.sy) / bh : null;
    let k = fx != null && fy != null ? (fx + fy) / 2 : (fx ?? fy ?? 1);
    k = Math.max(0.1, Math.min(k, 20));
    g.snap.forEach(s => {
      const i = s.ref;
      if (lwIstLinie(i)) {
        i.x1 = b.x + (s.x1 - b.x) * k; i.x2 = b.x + (s.x2 - b.x) * k; i.y1 = b.y + (s.y1 - b.y) * k; i.y2 = b.y + (s.y2 - b.y) * k;
      } else {
        i.x = b.x + (s.x - b.x) * k; i.y = b.y + (s.y - b.y) * k; i.w = s.w * k; i.h = s.h * k;
        if (s.fs) i.fontSize = Math.max(6, Math.round(s.fs * k));
      }
    });
  } else if (g.mode === 'mrot') {
    let a = (Math.atan2(e.clientY - g.gy, e.clientX - g.gx) - g.a0) * 180 / Math.PI;
    if (e.shiftKey) a = Math.round(a / 15) * 15;
    else { const r90 = Math.round(a / 90) * 90; if (Math.abs(a - r90) < 5) a = r90; }
    const t = a * Math.PI / 180, cos = Math.cos(t), sin = Math.sin(t);
    const Gx = (b.x + b.x2) / 2 * cw / 100, Gy = (b.y + b.y2) / 2 * ch / 100;
    const dreh = (xp, yp) => { const X = xp * cw / 100 - Gx, Y = yp * ch / 100 - Gy; return [(Gx + X * cos - Y * sin) / cw * 100, (Gy + X * sin + Y * cos) / ch * 100]; };
    g.snap.forEach(s => {
      const i = s.ref;
      if (lwIstLinie(i)) { [i.x1, i.y1] = dreh(s.x1, s.y1); [i.x2, i.y2] = dreh(s.x2, s.y2); }
      else {
        const [cx, cy] = dreh(s.x + s.w / 2, s.y + s.h / 2);
        i.x = cx - s.w / 2; i.y = cy - s.h / 2;
        let r = ((Math.round(s.rot + a) % 360) + 540) % 360 - 180; if (r === -180) r = 180;
        i.rot = r;
      }
    });
  }
  lwCanvasNeu(g.id);
}
function lwMarquee(g, e) {
  const c = lwCanvas(g.id); if (!c) return null;
  const x0 = (g.sx - g.rl) / g.cw * 100, y0 = (g.sy - g.rt) / g.ch * 100;
  const x1 = (e.clientX - g.rl) / g.cw * 100, y1 = (e.clientY - g.rt) / g.ch * 100;
  const r = { x: lwClamp(Math.min(x0, x1)), y: lwClamp(Math.min(y0, y1)), x2: lwClamp(Math.max(x0, x1)), y2: lwClamp(Math.max(y0, y1)) };
  let m = c.querySelector('.lw-marquee');
  if (!m) { m = document.createElement('div'); m.className = 'lw-marquee';
    m.style.cssText = 'position:absolute;border:1px dashed #3b6fd4;background:rgba(59,111,212,.08);pointer-events:none;z-index:6;'; c.appendChild(m); }
  Object.assign(m.style, { left: r.x + '%', top: r.y + '%', width: (r.x2 - r.x) + '%', height: (r.y2 - r.y) + '%' });
  g.rect = r;
  return r;
}
document.addEventListener('pointermove', e => {
  const g = _lwDrag; if (!g) return;
  let dx = (e.clientX - g.sx) / g.cw * 100, dy = (e.clientY - g.sy) / g.ch * 100;
  if (!g.moved && Math.abs(e.clientX - g.sx) + Math.abs(e.clientY - g.sy) < 3) return;
  if (g.mode === 'marquee') { g.moved = true; lwMarquee(g, e); return; }
  if (!g.moved) { g.moved = true; saveHistory(); }
  if (g.multi) { lwMultiMove(g, e, dx, dy); return; }
  const w = lwW(g.id), it = w && w.items.find(i => i.id === g.itemId); if (!it) return;
  if (lwIstLinie(it)) {
    if (g.mode === 'move') {
      const xs = [g.x1, g.x2], ys = [g.y1, g.y2];
      const mx = lwImBild(dx, Math.min(...xs), Math.max(...xs));
      const my = lwImBild(dy, Math.min(...ys), Math.max(...ys));
      it.x1 = g.x1 + mx; it.x2 = g.x2 + mx; it.y1 = g.y1 + my; it.y2 = g.y2 + my;
    } else {
      let px = lwClampWeit((e.clientX - g.rl) / g.cw * 100), py = lwClampWeit((e.clientY - g.rt) / g.ch * 100);
      const p1 = g.mode === 'p1';
      [px, py] = lwSnap(p1 ? it.x2 : it.x1, p1 ? it.y2 : it.y1, px, py, g.cw, g.ch, e.shiftKey);
      px = lwClampWeit(px); py = lwClampWeit(py);
      if (p1) { it.x1 = px; it.y1 = py; } else { it.x2 = px; it.y2 = py; }
    }
    const el = document.querySelector(`.lw-canvas[data-lw="${g.id}"] [data-lw-item="${g.itemId}"]`);
    if (el) el.outerHTML = lwElementHtml(it, w, true);
    return;
  }
  if (g.mode === 'rot') {
    let a = Math.atan2(e.clientY - g.cy, e.clientX - g.cx) * 180 / Math.PI + 90;
    if (e.shiftKey) a = Math.round(a / 15) * 15;
    else { const r90 = Math.round(a / 90) * 90; if (Math.abs(a - r90) < 5) a = r90; }   // gerade rastet ein
    it.rot = ((Math.round(a) % 360) + 540) % 360 - 180;
    if (it.rot === -180) it.rot = 180;
    const el = document.querySelector(`.lw-canvas[data-lw="${g.id}"] [data-lw-item="${g.itemId}"]`);
    if (el) el.style.transform = it.rot ? `rotate(${it.rot}deg)` : '';
    return;
  }
  if (g.mode === 'size' && it.rot) {
    // Ziehen in die gedrehten Achsen des Elements umrechnen
    const t = it.rot * Math.PI / 180, px = dx * g.cw / 100, py = dy * g.ch / 100;
    const lx = px * Math.cos(t) + py * Math.sin(t), ly = -px * Math.sin(t) + py * Math.cos(t);
    dx = lx / g.cw * 100; dy = ly / g.ch * 100;
  }
  if (g.mode === 'move') {
    it.x = Math.max(-it.w + 3, Math.min(97, g.x + dx));
    it.y = Math.max(-it.h + 3, Math.min(97, g.y + dy));
  } else if (it.kind === 'image' && it.ar) {
    // Bilder behalten ihr Seitenverhältnis
    const nw = Math.max(3, g.w + dx);
    it.w = nw; it.h = nw * g.cw / g.ch / it.ar;
  } else {
    it.w = Math.max(3, g.w + dx);
    it.h = Math.max(3, g.h + dy);
  }
  const el = document.querySelector(`.lw-canvas[data-lw="${g.id}"] [data-lw-item="${g.itemId}"]`);
  if (el) { el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.width = it.w + '%'; el.style.height = it.h + '%'; }
});
document.addEventListener('pointerup', () => {
  const g = _lwDrag; if (!g) return;
  _lwDrag = null;
  if (g.mode === 'marquee') {
    const w = lwW(g.id); if (!w) return;
    if (!g.moved || !g.rect) { if (_lwSel && _lwSel.id === g.id && !g.shift) { _lwSel = null; lwRefresh(g.id); } return; }
    const r = g.rect;
    const treffer = w.items.filter(i => { const b = lwBox(i, [g.cw, g.ch]); return b.x < r.x2 && b.x2 > r.x && b.y < r.y2 && b.y2 > r.y; }).map(i => i.id);
    const ids = lwMitGruppe(w, treffer);
    lwSetzeAuswahl(g.id, g.shift ? [...g.vorher, ...ids] : ids);
    lwRefresh(g.id);
    return;
  }
  if (g.multi) {
    if (g.moved) { _dirty = true; if (typeof scheduleDraftSave === 'function') scheduleDraftSave(); lwRefresh(g.id); }
    return;
  }
  if (g.neu) {
    // Nur geklickt statt gezogen → Linie mit Standardlänge
    const w = lwW(g.id), it = w && w.items.find(i => i.id === g.itemId);
    if (it && Math.hypot((it.x2 - it.x1) * g.cw, (it.y2 - it.y1) * g.ch) / 100 < 8) {
      it.x2 = it.x1 + 20 <= 100 ? it.x1 + 20 : it.x1 - 20; it.y2 = it.y1;
    }
    _lwZeichne = null;
    _dirty = true; if (typeof scheduleDraftSave === 'function') scheduleDraftSave();
    lwRefresh(g.id);
    return;
  }
  if (g.moved) { _dirty = true; if (typeof scheduleDraftSave === 'function') scheduleDraftSave(); renderProps(g.id); }
});

// ── Tastatur (aufgerufen vom globalen keydown in index.html; true = erledigt) ──
// Entf/⌫ = Element löschen · Pfeiltasten = verschieben (Shift = größere Schritte)
// Strg/Cmd+D = duplizieren · Esc = Zeichnen abbrechen bzw. Element abwählen
function lwTaste(e) {
  if (_lwZeichne && e.key === 'Escape') { const id = _lwZeichne.id; _lwZeichne = null; lwRefresh(id); return true; }
  if (!_lwSel || selId !== _lwSel.id) return false;
  const id = _lwSel.id, w = lwW(id), items = lwAuswahl(w); if (!items.length) return false;
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === 'Delete' || e.key === 'Backspace') { lwLoeschen(id); return true; }
  if (e.key === 'Escape') { _lwSel = null; lwRefresh(id); return true; }
  if (mod && (e.key === 'd' || e.key === 'D')) { lwDuplizieren(id); return true; }
  if (mod && (e.key === 'g' || e.key === 'G')) { e.shiftKey ? lwGruppeAufloesen(id) : lwGruppieren(id); return true; }
  const pfeile = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (pfeile && !mod && !e.altKey) {
    const c = lwCanvas(id), cw = c ? c.clientWidth : 700, ch = c ? c.clientHeight : (w.hoehe || 260);
    const px = e.shiftKey ? 10 : 1;                       // Schritt in Bildschirm-Pixeln
    let dx = pfeile[0] * px / cw * 100, dy = pfeile[1] * px / ch * 100;
    saveHistory();
    if (items.length > 1 || lwIstLinie(items[0])) {        // zusammen verschieben, innerhalb der Leinwand
      const b = lwBBox(items, [cw, ch]);
      dx = lwImBild(dx, b.x, b.x2); dy = lwImBild(dy, b.y, b.y2);
      items.forEach(it => {
        if (lwIstLinie(it)) { it.x1 += dx; it.x2 += dx; it.y1 += dy; it.y2 += dy; }
        else { it.x += dx; it.y += dy; }
      });
    } else {
      const it = items[0];
      it.x = Math.max(-it.w + 3, Math.min(97, it.x + dx));
      it.y = Math.max(-it.h + 3, Math.min(97, it.y + dy));
    }
    if (!lwPatch(id)) render();
    return true;
  }
  return false;
}

// ══ Zeichenebene ═════════════════════════════════════════════════
// Je Seite eine Leinwand über der ganzen Seite (über allen Widgets). Links unter Allgemein → Profi-Tools
// schaltet man das Bearbeiten an/aus: Aus → die Zeichnungen bleiben sichtbar (und im Druck),
// aber alles darunter ist wieder normal bedienbar. 👁 blendet die Zeichnungen ganz aus (auch im Druck).
// Daten: Widget {type:'zeichenebene', floating:true, page, items, aus} – Elemente wie in der Leinwand.
let _zeBearbeiten = false;

WIDGETS.push({
  meta: { type:'zeichenebene', label:'Zeichenebene', desc:'Zeichenfläche über der ganzen Seite', icon:'✏️',
          category:'allgemein', hidden:true, noFooter:true, floating:true },
  createData: id => ({ id, type:'zeichenebene', floating:true, page:0, items:[] }),
  render: d => WIDGET_MAP.leinwand.render(d),
  renderProps: d => `<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;padding:8px 10px;border-radius:6px;
        background:#eef4ff;border:1.5px solid #c9dafc;font-size:12px;color:#2a3b5c;text-align:left;">
        <span style="flex:1;">Zeichenebene von <b>Seite ${(d.page || 0) + 1}</b>. Darunter liegende Widgets sind gesperrt, solange du zeichnest.</span>
        <button onclick="event.stopPropagation();zeBearbeiten(false)" style="flex-shrink:0;padding:5px 8px;border-radius:4px;border:none;
          background:#3b6fd4;color:#fff;font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;">Fertig</button></div>`
    + WIDGET_MAP.leinwand.renderProps(d),
});

function zeEbenen() { return widgets.filter(w => w.type === 'zeichenebene'); }
function zeSichtbar() { return !zeEbenen().some(w => w.aus); }

// Overlay je Seite zeichnen (aus render() in index.html)
function zeRenderLayers(pageEls) {
  const da = new Set();
  zeEbenen().forEach(f => {
    const pe = pageEls[f.page || 0]; if (!pe || da.has(f.page || 0)) return;
    da.add(f.page || 0);
    if (f.aus && !_zeBearbeiten) return;
    pe.style.position = 'relative';
    pe.appendChild(zeLayerEl(f));
  });
}
function zeLayerEl(f) {
  const div = document.createElement('div');
  div.className = 'wwrap zeichenebene' + (selId === f.id ? ' sel' : '');
  div.dataset.id = f.id;
  // gleiche mm-Geometrie wie schwebende Rahmen (floatbox.js) → im Druck exakt an derselben Stelle
  div.style.cssText = `position:absolute;left:${fbLeft(0)};top:0;width:${fbWidth(100)};height:${fbTop(100)};`
    + `z-index:45;margin:0;pointer-events:${_zeBearbeiten ? 'auto' : 'none'};`;
  div.innerHTML = `<div class="winner" style="position:absolute;inset:0;padding:0;">${winnerInner(f)}</div>`;
  div.addEventListener('click', () => { if (selId !== f.id) sel(f.id); }, true);
  div.onclick = e => e.stopPropagation();
  return div;
}
// Sicherstellen, dass jede Seite eine Ebene hat (beim Einschalten)
function zeAnlegen() {
  const ranges = getPageRanges(), vorhanden = new Set(zeEbenen().map(w => w.page || 0));
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (vorhanden.has(i)) continue;
    const w = WIDGET_MAP.zeichenebene.createData(++idC);
    w.page = i;
    widgets.splice(ranges[i].end, 0, w);
  }
}
function zeBearbeiten(an) {
  if (an === _zeBearbeiten) return;
  saveHistory();
  _zeBearbeiten = an;
  if (an) {
    zeAnlegen();
    zeEbenen().forEach(w => { delete w.aus; });
    const ziel = zeEbenen().find(w => (w.page || 0) === (typeof activePage === 'number' ? activePage : 0)) || zeEbenen()[0];
    selId = ziel ? ziel.id : null;
    _lwSel = null;
  } else {
    // leere Ebenen wieder entfernen
    widgets = widgets.filter(w => w.type !== 'zeichenebene' || (w.items || []).length);
    if (selId != null && !widgets.some(w => w.id === selId)) selId = null;
    const sw = widgets.find(w => w.id === selId);
    if (sw && sw.type === 'zeichenebene') selId = null;
    _lwSel = null; _lwZeichne = null;
  }
  _dirty = true;
  render();
  if (selId != null) renderProps(selId); else document.getElementById('pi').innerHTML = '<span style="color:#bbb;">Widget auswählen</span>';
  buildList();
}
// Seitenwechsel (Scrollen) beim Bearbeiten: Ebene der neuen Seite auswählen (fehlt sie, z. B. bei
// einer neu entstandenen Seite, wird sie angelegt)
function zeSeiteGewechselt(seite) {
  if (!_zeBearbeiten || _lwDrag) return;
  let f = zeEbenen().find(w => (w.page || 0) === seite);
  if (!f) {
    const ranges = getPageRanges(); if (!ranges[seite]) return;
    f = WIDGET_MAP.zeichenebene.createData(++idC);
    f.page = seite;
    widgets.splice(ranges[seite].end, 0, f);
    _lwSel = null; _lwZeichne = null; _lwSymbolWahl = null;
    selId = f.id;
    render(); renderProps(f.id);
    return;
  }
  if (selId === f.id) return;
  _lwSel = null; _lwZeichne = null;
  sel(f.id);
}
function zeSichtbarkeit() {
  const ebenen = zeEbenen(); if (!ebenen.length) return;
  saveHistory();
  const aus = zeSichtbar();
  ebenen.forEach(w => { if (aus) w.aus = true; else delete w.aus; });
  if (aus && _zeBearbeiten) { _zeBearbeiten = false; const sw = widgets.find(w => w.id === selId); if (sw && sw.type === 'zeichenebene') selId = null; }
  _dirty = true;
  render(); buildList();
  if (selId == null) document.getElementById('pi').innerHTML = '<span style="color:#bbb;">Widget auswählen</span>';
}
// Schalter im Reiter „Allgemein" unter „Profi-Tools"
function zeSidebarEl() {
  const an = _zeBearbeiten, hat = zeEbenen().some(w => (w.items || []).length), sicht = zeSichtbar();
  const el = document.createElement('div');
  el.innerHTML = `<div style="display:flex;gap:6px;align-items:stretch;margin:0 0 4px;">
      <button onclick="zeBearbeiten(${!an})" title="Zeichenebene über der ganzen Seite bearbeiten"
        style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:7px;cursor:pointer;font-family:inherit;
               border:1.5px solid ${an ? '#89b4fa' : '#3a3d45'};background:${an ? '#1c2c42' : '#24262c'};color:#c7cad1;text-align:left;">
        <span style="font-size:16px;">✏️</span>
        <span style="flex:1;font-size:12px;font-weight:700;">Zeichenebene<span style="display:block;font-size:10px;font-weight:600;color:#8a8f99;">${an ? 'Bearbeiten – darunter gesperrt' : 'Über die ganze Seite zeichnen'}</span></span>
        <span style="width:30px;height:17px;border-radius:9px;background:${an ? '#3b6fd4' : '#4a4d55'};position:relative;flex-shrink:0;">
          <span style="position:absolute;top:2px;left:${an ? 15 : 2}px;width:13px;height:13px;border-radius:50%;background:#fff;transition:left .15s;"></span></span>
      </button>
      ${hat ? `<button onclick="zeSichtbarkeit()" title="${sicht ? 'Zeichnungen ausblenden (auch im Druck)' : 'Zeichnungen wieder einblenden'}"
        style="width:38px;border-radius:7px;cursor:pointer;border:1.5px solid #3a3d45;background:#24262c;font-size:15px;opacity:${sicht ? 1 : .45};">${sicht ? '👁' : '🙈'}</button>` : ''}
    </div>`;
  return el;
}
