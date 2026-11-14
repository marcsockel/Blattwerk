// Widget: Punkte-Summe
// Feld „PUNKTE ___ / 24", auf Wunsch mit Feld für die Note und einem Notenschlüssel.
// Die Gesamtpunktzahl wird aus den Punkten aller Aufgaben des Blatts zusammengezählt
// (Eigenschaften der Widgets → „Punkte"); wahlweise lässt sich eine eigene Zahl vorgeben.
//   eigene        0 = automatisch zählen, sonst feste Gesamtpunktzahl
//   einheit       'Punkte' | 'Pkt.' | ''
//   note          Feld „Note: ___" anzeigen
//   schluessel    Notenschlüssel-Tabelle anzeigen
//   prozent       Untergrenzen der Noten 1–5 in Prozent, z. B. „92, 81, 67, 50, 30"
// index.html zeichnet dieses Widget neu, sobald sich irgendwo Punkte ändern (applyWidgetUpdate).

const PS_PROZENT = '92, 81, 67, 50, 30';
// Summe der Punkte aller Aufgaben (auch in Gruppen und Rahmen)
function psSumme() {
  return widgets.reduce((s, w) => s + (w.type !== 'punktesumme' && typeof widgetHasPunkte === 'function' && widgetHasPunkte(w) ? Math.max(0, +w.punkte || 0) : 0), 0);
}
function psGesamt(d) { const e = Math.round(+d.eigene || 0); return e > 0 ? e : psSumme(); }
// „92, 81, 67, 50, 30" → fünf fallende Prozentwerte oder null
function psProzent(text) {
  const z = String(text || '').split(/[;,\s]+/).filter(Boolean).map(x => parseFloat(x.replace(',', '.')));
  if (z.length !== 5 || z.some(v => !(v >= 0 && v <= 100))) return null;
  for (let i = 1; i < 5; i++) if (z[i] >= z[i - 1]) return null;
  return z;
}
// Punktebereiche der Noten 1–6: [{note, von, bis}] (bis < von = diese Note kommt nicht vor)
function psBereiche(gesamt, prozent) {
  const ab = prozent.map(p => Math.ceil(gesamt * p / 100 - 1e-9));      // Mindestpunkte für Note 1–5
  const out = []; let oben = gesamt;
  for (let n = 1; n <= 6; n++) {
    const unten = n <= 5 ? Math.min(ab[n - 1], oben + 1) : 0;
    out.push({ note: n, von: oben, bis: unten });
    oben = unten - 1;
  }
  return out;
}

WIDGETS.push({
  meta: { type:'punktesumme', label:'Punkte-Summe', desc:'Gesamtpunkte, Note und Notenschlüssel', icon:'Σ', category:'allgemein' },

  createData: id => ({ id, type:'punktesumme', eigene:0, einheit:'Punkte', note:true, schluessel:false, prozent:PS_PROZENT, groesse:'mittel' }),

  render: d => {
    const gesamt = psGesamt(d);
    const g = d.groesse || 'mittel', fs = g === 'gross' ? 22 : g === 'klein' ? 15 : 18;
    const einheit = d.einheit != null ? d.einheit : 'Punkte';
    const ff = `font-family:'DidactGothic7',sans-serif;font-size:${fs}px;color:#222;line-height:1.2;`;
    // Punkte und Note als beschriftete Felder (Rahmen wie die Tabellen, class bw-tab in index.html)
    const feld = (label, breite, hinten) =>
      `<span style="display:inline-flex;align-items:center;gap:${Math.round(fs * 0.45)}px;border:1.3px solid #555;border-radius:6px;padding:${Math.round(fs * 0.32)}px ${Math.round(fs * 0.6)}px;white-space:nowrap;">`
      + (label ? `<span style="font-size:.78em;font-weight:700;color:#555;letter-spacing:.04em;">${label}</span>` : '')
      + `<span style="display:inline-block;width:${Math.round(fs * breite)}px;"></span>${hinten || ''}</span>`;
    let html = `<div style="${ff}display:flex;flex-wrap:wrap;align-items:stretch;justify-content:flex-end;gap:${Math.round(fs * 0.45)}px ${Math.round(fs * 0.7)}px;">`
      + feld(einheit === 'Pkt.' ? 'PKT.' : einheit ? 'PUNKTE' : '', 2.4, `<span style="color:#555;">/ ${gesamt || '&nbsp;&nbsp;&nbsp;'}</span>`)
      + (d.note !== false ? feld('NOTE', 2.8, '') : '')
      + `</div>`;
    const pz = psProzent(d.prozent != null ? d.prozent : PS_PROZENT);
    if (d.schluessel && gesamt > 0 && pz) {
      const B = psBereiche(gesamt, pz);
      const zf = `padding:${Math.round(fs * 0.22)}px 4px;text-align:center;`;
      const bereich = b => b.bis > b.von ? '–' : b.von === b.bis ? b.von : `${b.von}–${b.bis}`;
      const tab = `${ff}font-size:${Math.round(fs * 0.82)}px;margin-top:${Math.round(fs * 0.6)}px;`;
      // Schmale Spalte (z. B. ¼ Breite): Noten untereinander statt nebeneinander
      const platz = typeof geom === 'function' && typeof widthFrac === 'function' ? geom().contentW * widthFrac(d) - 30 : 600;
      if (platz < fs * 19)
        html += `<table class="bw-tab" style="${tab}margin-left:auto;"><tr><th style="${zf}padding:2px 10px;">Note</th><th style="${zf}padding:2px 10px;">Punkte</th></tr>`
          + B.map(b => `<tr><td style="${zf}font-weight:700;">${b.note}</td><td style="${zf}padding:2px 10px;white-space:nowrap;">${bereich(b)}</td></tr>`).join('') + `</table>`;
      else
        html += `<table class="bw-tab" style="${tab}width:100%;table-layout:fixed;">`
          + `<tr>${B.map(b => `<th style="${zf}white-space:nowrap;">Note ${b.note}</th>`).join('')}</tr>`
          + `<tr>${B.map(b => `<td style="${zf}padding:${Math.round(fs * 0.3)}px 4px;white-space:nowrap;">${bereich(b)}</td>`).join('')}</tr>`
          + `</table>`;
    }
    return html;
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', einheit = d.einheit != null ? d.einheit : 'Punkte';
    const summe = psSumme(), eigene = Math.round(+d.eigene || 0);
    const pzText = d.prozent != null ? d.prozent : PS_PROZENT, pzOk = !!psProzent(pzText);
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    return `<div style="font-size:11px;color:#666;margin-bottom:8px;line-height:1.45;">Auf dem Blatt vergeben: <b>${summe} Punkte</b>.${summe ? '' : ' Punkte trägst du bei jeder Aufgabe in den Eigenschaften unter „Punkte" ein.'}</div>`
      + pr('Gesamtpunkte (0 = automatisch zählen)', `<input type="number" min="0" max="999" value="${eigene}" onchange="upd(${d.id},'eigene',Math.max(0,Math.round(+this.value||0)))">`)
      + (eigene > 0 && summe > 0 && eigene !== summe ? `<div style="font-size:10.5px;color:#e64553;margin:-2px 0 8px;">Die eigene Zahl (${eigene}) weicht von den vergebenen Punkten (${summe}) ab.</div>` : '')
      + `<div class="prow"><label>Einheit</label><div style="display:flex;gap:4px;">
        ${tgl(einheit==='Punkte','Punkte',`upd(${d.id},'einheit','Punkte')`)}${tgl(einheit==='Pkt.','Pkt.',`upd(${d.id},'einheit','Pkt.')`)}${tgl(einheit==='','ohne',`upd(${d.id},'einheit','')`)}</div></div>
      <div class="prow"><label>Feld für die Note</label><div style="display:flex;gap:4px;">
        ${tgl(d.note !== false,'Anzeigen',`upd(${d.id},'note',true)`)}${tgl(d.note === false,'Ohne',`upd(${d.id},'note',false)`)}</div></div>
      <div class="prow"><label>Notenschlüssel</label><div style="display:flex;gap:4px;">
        ${tgl(!d.schluessel,'Ohne',`upd(${d.id},'schluessel',false)`)}${tgl(!!d.schluessel,'Anzeigen',`upd(${d.id},'schluessel',true)`)}</div></div>`
      + (d.schluessel
        ? pr('Noten 1–5 ab … Prozent', `<input value="${esc(pzText)}" placeholder="${PS_PROZENT}" onchange="upd(${d.id},'prozent',this.value)">`)
          + (pzOk ? `<div style="font-size:10.5px;color:#aaa;margin:-2px 0 8px;line-height:1.4;">Fünf fallende Werte: ab wie viel Prozent es die Note 1, 2, 3, 4, 5 gibt. Darunter ist es eine 6.</div>`
                  : `<div style="font-size:10.5px;color:#e64553;margin:-2px 0 8px;">Bitte fünf fallende Prozentwerte eingeben, z. B. ${PS_PROZENT}.</div>`)
          + (psGesamt(d) > 0 ? '' : `<div style="font-size:10.5px;color:#e64553;margin:-2px 0 8px;">Der Notenschlüssel erscheint, sobald Punkte vergeben sind.</div>`)
        : '')
      + `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>`;
  },
});
