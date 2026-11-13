// Widget: QR-Code
// Erzeugt aus einem Link oder Text einen QR-Code als SVG (druckscharf). Der Code wird im
// Browser berechnet (vendor/qrcode.js, „QR Code Generator for JavaScript", MIT) — kein
// Internet nötig, nichts wird irgendwohin gesendet.
//   art           link | fragfinn | koepfchen | google | text | ort | wlan | mail | tel — bestimmt die Felder und die Schreibweise,
//                 an der das Handy erkennt, was es tun soll (https://…, geo:…, WIFI:…, mailto:…, tel:…)
//   inhalt (Link), suchwort (Suchmaschinen), freitext, koord, ssid/pass/wtyp, mail/betreff/mailtext, tel — Felder je Art
//   beschriftung  optionaler Text neben dem Code (z. B. „Scanne mich!")
//   zeigLink      Inhalt klein unter dem Code mitdrucken (für Kinder ohne Scanner)
//   groesse       klein | mittel | gross      align  left | center | right

// SVG des Codes; null, wenn der Inhalt leer oder zu lang ist
function qrSvg(text, px) {
  if (typeof qrcode !== 'function' || !String(text || '').trim()) return null;
  let q;
  try {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];   // Umlaute & Co. korrekt
    q = qrcode(0, 'M'); q.addData(String(text).trim()); q.make();
  } catch (e) { return null; }
  const n = q.getModuleCount(), rand = 2, t = n + 2 * rand;
  // dunkle Felder zeilenweise zu Streifen zusammenfassen (kleines SVG, keine Haarlinien)
  let p = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!q.isDark(r, c)) { c++; continue; }
      let e = c; while (e < n && q.isDark(r, e)) e++;
      p += `M${c + rand} ${r + rand}h${e - c}v1h-${e - c}z`;
      c = e;
    }
  }
  // Sehr dichte Codes (langer Inhalt) nicht kleiner als ~1,8 px je Feld zeichnen
  const seite = Math.max(px, Math.ceil(t * 1.8));
  return { seite, svg: `<svg viewBox="0 0 ${t} ${t}" width="${seite}" height="${seite}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" style="display:block;flex:0 0 auto;">`
    + `<rect width="${t}" height="${t}" fill="#fff"/><path d="${p}" fill="#000"/></svg>` };
}

const QR_ARTEN = [['link', 'Webseite (Link)'], ['fragfinn', 'Suche mit fragFINN'], ['koepfchen', 'Suche mit Helles Köpfchen'], ['google', 'Suche mit Google'],
  ['text', 'Text'], ['ort', 'Ort (Karte)'], ['wlan', 'WLAN'], ['mail', 'E-Mail'], ['tel', 'Telefon']];
// Suchmaschinen: der Code öffnet direkt die Trefferliste zum Suchwort
const QR_SUCHE = {
  fragfinn:  { name: 'fragFINN',        url: 'https://www.fragfinn.de/?stype=&s=' },
  koepfchen: { name: 'Helles Köpfchen', url: 'https://www.helles-koepfchen.de/?suche=' },
  google:    { name: 'Google',          url: 'https://www.google.de/search?q=' },
};
function qrArt(d) { return QR_ARTEN.some(a => a[0] === d.art) ? d.art : 'link'; }

// „50.9375, 6.9603" / „50,9375 6,9603" → [Breite, Länge] oder null
function qrKoord(s) {
  let t = String(s || '').trim();
  if (!t.includes('.')) t = t.replace(/(\d),(\d)/g, '$1.$2');          // deutsches Dezimalkomma
  const z = t.match(/-?\d+(?:\.\d+)?/g);
  if (!z || z.length !== 2) return null;
  const lat = +z[0], lon = +z[1];
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? [lat, lon] : null;
}

// Inhalt des Codes in der Schreibweise der gewählten Art.
// → { code, anzeige } oder { fehler } (anzeige = lesbarer Text für „Inhalt unter dem Code")
function qrInhalt(d) {
  const art = qrArt(d), v = k => String(d[k] || '').trim();
  if (QR_SUCHE[art]) {
    const q = v('suchwort'); if (!q) return { fehler: 'Kein Suchwort eingetragen.' };
    return { code: QR_SUCHE[art].url + encodeURIComponent(q).replace(/%20/g, '+'), anzeige: `${QR_SUCHE[art].name}: ${q}` };
  }
  if (art === 'text') { const t = v('freitext'); return t ? { code: t, anzeige: t } : { fehler: 'Kein Text eingetragen.' }; }
  if (art === 'ort') {
    const k = qrKoord(d.koord);
    return k ? { code: `geo:${k[0]},${k[1]}`, anzeige: `${k[0]}, ${k[1]}` }
             : { fehler: 'Koordinaten fehlen oder sind ungültig (Beispiel: 50.9413, 6.9583).' };
  }
  if (art === 'wlan') {
    const ssid = v('ssid'); if (!ssid) return { fehler: 'Kein Netzwerkname eingetragen.' };
    const e = t => String(t).replace(/([\\;,:"])/g, '\\$1');             // Sonderzeichen schützen
    const offen = d.wtyp === 'offen' || !v('pass');
    return { code: offen ? `WIFI:T:nopass;S:${e(ssid)};;` : `WIFI:T:WPA;S:${e(ssid)};P:${e(String(d.pass))};;`, anzeige: `WLAN: ${ssid}` };
  }
  if (art === 'mail') {
    const m = v('mail'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return { fehler: 'Keine gültige E-Mail-Adresse eingetragen.' };
    const q = [v('betreff') && 'subject=' + encodeURIComponent(v('betreff')), v('mailtext') && 'body=' + encodeURIComponent(v('mailtext'))].filter(Boolean).join('&');
    return { code: `mailto:${m}${q ? '?' + q : ''}`, anzeige: m };
  }
  if (art === 'tel') {
    const t = v('tel'), n = t.replace(/[^\d+]/g, '');
    return n.replace(/\D/g, '').length >= 3 ? { code: `tel:${n}`, anzeige: t } : { fehler: 'Keine Telefonnummer eingetragen.' };
  }
  // Link: ohne „https://" erkennen manche Handys nur Text → ergänzen
  let l = v('inhalt'); if (!l) return { fehler: 'Kein Link eingetragen.' };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(l)) l = 'https://' + l;
  return { code: l, anzeige: l };
}

WIDGETS.push({
  meta: { type:'qrcode', label:'QR-Code', desc:'Link, Text, Ort, WLAN … als QR-Code', icon:'🔳', category:'allgemein' },

  createData: id => ({
    id, type:'qrcode', art:'link',
    inhalt:'https://de.wikipedia.org', beschriftung:'', zeigLink:false, groesse:'mittel', align:'left',
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const g = d.groesse || 'mittel';
    const px = g === 'gross' ? 170 : g === 'klein' ? 80 : 120;
    const fs = g === 'gross' ? 22 : g === 'klein' ? 15 : 18;
    const hinweis = t => atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">${t}</div>`;
    const inh = qrInhalt(d);
    if (inh.fehler) return hinweis(esc(inh.fehler) + ' Bitte in den Eigenschaften ergänzen.');
    const qr = qrSvg(inh.code, px);
    if (!qr) return hinweis('Der Inhalt ist zu lang für einen QR-Code – bitte kürzen.');
    const jc = d.align === 'center' ? 'center' : d.align === 'right' ? 'flex-end' : 'flex-start';
    const link = d.zeigLink
      ? `<div style="width:${qr.seite}px;margin-top:4px;font-family:'DM Mono',monospace;font-size:${Math.max(8, Math.round(fs * 0.5))}px;line-height:1.25;color:#444;text-align:center;word-break:break-all;">${esc(inh.anzeige)}</div>` : '';
    const text = String(d.beschriftung || '').trim()
      ? `<div style="font-family:'DidactGothic7',sans-serif;font-size:${fs}px;line-height:1.35;color:#222;min-width:0;white-space:pre-wrap;">${esc(String(d.beschriftung).trim())}</div>` : '';
    return atHtml(d)
      + `<div style="display:flex;align-items:center;justify-content:${jc};gap:${Math.round(fs * 0.9)}px;">`
      + `<div style="flex:0 0 auto;">${qr.svg}${link}</div>${text}</div>`;
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', al = ['center', 'right'].includes(d.align) ? d.align : 'left', art = qrArt(d);
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    const feld = (label, key, ph, typ) => pr(label, `<input ${typ ? `type="${typ}"` : ''} value="${esc(d[key] || '')}" placeholder="${esc(ph || '')}" onchange="upd(${d.id},'${key}',this.value)">`);
    const bereich = (key, hoehe) => `<textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'${key}',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:6px 8px;min-height:${hoehe}px;font-family:inherit;font-size:12px;line-height:1.4;color:#333;margin-bottom:8px;">${esc(d[key] || '')}</textarea>`;
    const tipp = t => `<div style="font-size:10.5px;color:#aaa;margin:-2px 0 8px;line-height:1.4;">${t}</div>`;
    let felder = '';
    if (art === 'link') felder = `<div class="prow"><label>Link</label></div>` + bereich('inhalt', 46) + tipp('Fehlt „https://" am Anfang, wird es ergänzt. Kurze Links lassen sich besser scannen.');
    else if (QR_SUCHE[art]) felder = feld('Suchwort', 'suchwort', 'z. B. Igel') + tipp(`Das Handy öffnet die Suchergebnisse von ${QR_SUCHE[art].name} zu diesem Wort.`);
    else if (art === 'text') felder = `<div class="prow"><label>Text</label></div>` + bereich('freitext', 70) + tipp('Das Handy zeigt den Text nach dem Scannen an – z. B. ein Lösungswort zur Selbstkontrolle.');
    else if (art === 'ort') felder = feld('Koordinaten (Breite, Länge)', 'koord', '50.9413, 6.9583') + tipp('In Google Maps: Rechtsklick auf den Ort → die Zahlen oben im Menü anklicken (kopiert) und hier einfügen. Das Handy öffnet den Ort in der Karten-App.');
    else if (art === 'wlan') felder = feld('Netzwerkname', 'ssid', 'Schul-WLAN') + feld('Passwort', 'pass', '')
      + `<div class="prow"><label>Verschlüsselung</label><div style="display:flex;gap:4px;">
        ${tgl(d.wtyp !== 'offen','Mit Passwort',`upd(${d.id},'wtyp','wpa')`)}${tgl(d.wtyp === 'offen','Offen',`upd(${d.id},'wtyp','offen')`)}</div></div>`
      + tipp('Achtung: Wer den Code scannt, kennt das Passwort.');
    else if (art === 'mail') felder = feld('E-Mail-Adresse', 'mail', 'name@schule.de') + feld('Betreff (optional)', 'betreff', '') + `<div class="prow"><label>Nachricht (optional)</label></div>` + bereich('mailtext', 46);
    else felder = feld('Telefonnummer', 'tel', '+49 221 123456');
    const fehler = qrInhalt(d).fehler;
    return pr('Art', `<select onchange="upd(${d.id},'art',this.value)">${QR_ARTEN.map(([k, n]) => `<option value="${k}" ${art===k?'selected':''}>${n}</option>`).join('')}</select>`)
      + felder
      + (fehler ? `<div style="font-size:10.5px;color:#e64553;margin:-2px 0 8px;">${esc(fehler)}</div>` : '')
      + pr('Beschriftung neben dem Code', `<input value="${esc(d.beschriftung || '')}" placeholder="z. B. Scanne mich!" onchange="upd(${d.id},'beschriftung',this.value)">`)
      + `<div class="prow"><label>Inhalt unter dem Code</label><div style="display:flex;gap:4px;">
        ${tgl(!d.zeigLink,'Ohne',`upd(${d.id},'zeigLink',false)`)}${tgl(!!d.zeigLink,'Anzeigen',`upd(${d.id},'zeigLink',true)`)}</div></div>
      <div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>
      <div class="prow"><label>Ausrichtung</label><div style="display:flex;gap:4px;">
        ${tgl(al==='left','Links',`upd(${d.id},'align','left')`)}${tgl(al==='center','Mitte',`upd(${d.id},'align','center')`)}${tgl(al==='right','Rechts',`upd(${d.id},'align','right')`)}</div></div>`;
  },
});
