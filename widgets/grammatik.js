// Widgets: Artikel (der/die/das) und Wortarten (Nomen/Verben/Adjektive markieren)

/* ═══════════════════════════ ARTIKEL ═══════════════════════════
 * Eingabe: ein Nomen mit Artikel je Zeile („der Hund"). Formate (format):
 *   luecke    – ___ Hund            (Artikel auf die Linie schreiben)
 *   ankreuzen – ☐der ☐die ☐das Hund (richtigen Artikel ankreuzen)
 *   tabelle   – Wortkasten + Tabelle der | die | das (Nomen einsortieren)
 * Lösung blau (ausgewählt / Lösungsblatt). */
const ARTK_ART = ['der', 'die', 'das'];
function artkParse(text) {
  return String(text || '').split('\n').map(l => l.trim().replace(/\s+/g, ' ')).filter(Boolean).map(l => {
    const m = l.match(/^(der|die|das)\s+(.+)$/i);
    return m ? { art: m[1].toLowerCase(), wort: m[2] } : { art: '', wort: l };
  });
}
function artkMischen(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  const L = String(w.woerter || '').split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [L[i], L[j]] = [L[j], L[i]]; }
  w.woerter = L.join('\n');
  render(); renderProps(id);
}

WIDGETS.push({
  meta: { type:'artikel', group:'grammatik', label:'Artikel', desc:'der, die oder das zuordnen', icon:'🏷', category:'deutsch' },

  createData: id => ({
    id, type:'artikel',
    woerter: 'der Hund\ndie Katze\ndas Haus\ndie Blume\nder Baum\ndas Auto\ndie Sonne\nder Ball',
    format:'luecke', cols:2, groesse:'mittel', font:"'DidactGothic7', sans-serif",
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const items = artkParse(d.woerter);
    if (!items.length)
      return atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Wörter – im Textfeld je Zeile ein Nomen mit Artikel eintragen (z. B. „der Hund").</div>`;
    const isActive = d.id === selId || _solutionsMode;
    const g = d.groesse || 'mittel', fs = g === 'gross' ? 22 : g === 'klein' ? 15 : 18;
    const font = d.font || "'DidactGothic7', sans-serif";
    const format = d.format || 'luecke';
    const basis = `font-family:${font};font-size:${fs}px;color:#222;`;

    if (format === 'tabelle') {
      // Wortkasten (gemischt, feste Reihenfolge) + Tabelle mit so vielen Zeilen wie die vollste Spalte braucht
      const kasten = seededShuffle(items.map(it => it.wort), (Math.imul(d.id, 2654435761) + items.length * 40503) >>> 0);
      const jeArt = ARTK_ART.map(a => items.filter(it => it.art === a).map(it => it.wort));
      const zeilen = Math.max(2, ...jeArt.map(l => l.length));
      let t = `<tr>${ARTK_ART.map(a => `<th style="width:33.33%;padding:${Math.round(fs * 0.25)}px 6px;font-size:.9em;">${a}</th>`).join('')}</tr>`;
      for (let r = 0; r < zeilen; r++)
        t += `<tr>${jeArt.map(l => `<td style="height:${Math.round(fs * 2)}px;padding:0 8px;color:#2563eb;font-weight:700;">${isActive && l[r] ? esc(l[r]) : ''}</td>`).join('')}</tr>`;
      return atHtml(d)
        + `<div style="${basis}border:1.5px solid #555;border-radius:8px;padding:${Math.round(fs * 0.45)}px ${Math.round(fs * 0.7)}px;margin-bottom:${Math.round(fs * 0.7)}px;display:flex;flex-wrap:wrap;gap:${Math.round(fs * 0.3)}px ${Math.round(fs * 1.3)}px;justify-content:center;line-height:1.4;">`
        + kasten.map(w => `<span style="white-space:nowrap;">${esc(w)}</span>`).join('') + `</div>`
        + `<table class="bw-tab" style="${basis}width:100%;table-layout:fixed;">${t}</table>`;
    }

    const cols = Math.max(1, Math.min(4, Math.round(+d.cols) || 2));
    const kaestchen = (art, richtig) => {
      const k = Math.round(fs * 0.85);
      return `<span style="display:inline-flex;align-items:center;gap:${Math.round(fs * 0.22)}px;margin-right:${Math.round(fs * 0.5)}px;white-space:nowrap;">`
        + `<span style="display:inline-flex;align-items:center;justify-content:center;width:${k}px;height:${k}px;border:1.4px solid #555;border-radius:3px;box-sizing:border-box;`
        + `color:${isActive && richtig ? '#2563eb' : 'transparent'};font-weight:700;font-size:${Math.round(k * 0.9)}px;line-height:1;font-family:Arial,sans-serif;">✕</span>${art}</span>`;
    };
    const zeile = it => {
      const vorn = format === 'ankreuzen'
        ? ARTK_ART.map(a => kaestchen(a, it.art === a)).join('')
        : `<span style="display:inline-block;width:${Math.round(fs * 2.6)}px;border-bottom:1.5px solid #555;text-align:center;color:#2563eb;font-weight:700;margin-right:${Math.round(fs * 0.4)}px;line-height:1.15;">${isActive && it.art ? it.art : '&nbsp;'}</span>`;
      return `<div style="display:flex;align-items:baseline;flex-wrap:wrap;margin-bottom:${Math.round(fs * 0.7)}px;break-inside:avoid;">${vorn}<span style="font-weight:700;white-space:nowrap;">${esc(it.wort)}</span></div>`;
    };
    // spaltenweise füllen (erst links hinunter, dann rechts)
    const proSp = Math.ceil(items.length / cols);
    const spalten = Array.from({ length: cols }, (_, c) =>
      `<div style="flex:1;min-width:0;">${items.slice(c * proSp, (c + 1) * proSp).map(zeile).join('')}</div>`).join('');
    return atHtml(d) + `<div style="${basis}display:flex;gap:${Math.round(fs * 1.6)}px;align-items:flex-start;">${spalten}</div>`;
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', format = d.format || 'luecke', font = d.font || "'DidactGothic7', sans-serif";
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    const ohne = artkParse(d.woerter).filter(it => !it.art).length;
    return `<div class="prow"><label>Wörter <span style="font-weight:400;color:#aaa;font-size:10px;">(je Zeile: Artikel + Nomen)</span></label></div>
      <textarea onclick="event.stopPropagation()" onchange="upd(${d.id},'woerter',this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:110px;font-family:inherit;font-size:12px;line-height:1.6;color:#333;margin-bottom:6px;">${esc(d.woerter || '')}</textarea>`
      + (ohne ? `<div style="font-size:10.5px;color:#e64553;margin-bottom:6px;">${ohne} Zeile${ohne > 1 ? 'n' : ''} ohne der/die/das am Anfang – dort gibt es keine Lösung.</div>` : '')
      + `<button onclick="event.stopPropagation();artkMischen(${d.id})"
        style="margin:0 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Reihenfolge mischen</button>
      <div class="prow"><label>Aufgabe</label><div style="display:flex;gap:4px;">
        ${tgl(format==='luecke','Eintragen',`upd(${d.id},'format','luecke')`)}${tgl(format==='ankreuzen','Ankreuzen',`upd(${d.id},'format','ankreuzen')`)}${tgl(format==='tabelle','Tabelle',`upd(${d.id},'format','tabelle')`)}</div></div>`
      + (format !== 'tabelle' ? pr('Spalten (1–4)', `<input type="number" min="1" max="4" value="${Math.max(1, Math.min(4, d.cols || 2))}" onchange="upd(${d.id},'cols',Math.max(1,Math.min(4,+this.value||1)))">`) : '')
      + pr('Schrift', `<select onchange="upd(${d.id},'font',this.value)">${SCHREIB_FONTS.map(f => `<option value="${f.value}" ${font===f.value?'selected':''}>${f.label}</option>`).join('')}</select>`)
      + `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>`;
  },
});

/* ═══════════════════════════ WORTARTEN ═══════════════════════════
 * Text, in dem die Kinder Wortarten bestimmen. Ablauf für die Lehrkraft:
 *   1. Text eingeben → die Wortarten werden automatisch erkannt (widgets/wortarten_lexikon.js).
 *   2. Vorschlag korrigieren: Wort anklicken (im Blatt oder in den Eigenschaften) wechselt
 *      seine Wortart.
 * Gespeichert wird alles im Text selbst, als Kennzeichen direkt hinter dem Wort:
 *   Hund/N  bellt/V  kleine/A      — optional mit eigener Grundform:  lief/V=laufen
 * Die Kennzeichen werden nicht gedruckt.
 *   arten       gesuchte Wortarten (Legende, Lösung, Zusatzaufgabe nur für diese)
 *   schreibung  normal | nomenklein (Nomen kleingeschrieben) | gross (ALLES GROSS)
 *   zusatz      ohne | schreiben (Grundformen auf Linien) | tabelle (in Spalten sortieren)
 *               → Linien bzw. Tabellenzeilen entstehen in der passenden Anzahl. */
const WART = {
  N: { name: 'Nomen',     farbe: '#2563eb', hell: '#dbeafe', farbname: 'blau' },
  V: { name: 'Verben',    farbe: '#dc2626', hell: '#fee2e2', farbname: 'rot'  },
  A: { name: 'Adjektive', farbe: '#16a34a', hell: '#dcfce7', farbname: 'grün' },
};
// Wort mit Satzzeichen davor/dahinter und optionalem Kennzeichen
const WART_TOK = /^([„"»«‚'(\[]*)(.*?)(?:\/([NVA])(?:=([^\s\/]+?))?)?([.,;:!?…"“”»«‘’')\]]*)$/;

// Text → Zeilen aus Teilen: {leer:' '} oder {pre, wort, tag, lemma, post, n (laufende Wortnummer),
// satzanfang, ende}
function wartZeilen(text) {
  let n = 0;
  return String(text || '').split('\n').map(zeile => {
    let anfang = true;
    const teile = zeile.split(/(\s+)/).filter(x => x !== '').map(tok => {
      if (!tok.trim()) return { leer: tok };
      const m = tok.match(WART_TOK) || [tok, '', tok, '', '', ''];
      const t = { pre: m[1], wort: m[2], tag: m[3] || '', lemma: m[4] || '', post: m[5], n: n++, satzanfang: anfang, ende: /[.!?]/.test(m[5]) };
      anfang = /[.!?:]/.test(m[5]);
      return t;
    });
    const w = teile.filter(t => !t.leer);
    if (w.length) w[w.length - 1].ende = true;
    return teile;
  });
}
function wartText(zeilen) {
  return zeilen.map(z => z.map(t => t.leer != null ? t.leer
    : t.pre + t.wort + (t.tag ? '/' + t.tag + (t.lemma ? '=' + t.lemma : '') : '') + t.post).join('')).join('\n');
}
function wartWoerter(d) { return wartZeilen(d.text).flat().filter(t => t.leer == null && t.wort); }
function wartArten(d) { const a = Array.isArray(d.arten) ? d.arten.filter(x => WART[x]) : []; return a.length ? a : ['N', 'V', 'A']; }

// Automatische Erkennung: setzt alle Kennzeichen neu
function wartErkenneText(text) {
  if (typeof wartLexErkenne !== 'function') return text;
  const zeilen = wartZeilen(text), w = zeilen.flat().filter(t => t.leer == null);
  const tags = wartLexErkenne(w);
  w.forEach((t, i) => { t.tag = tags[i] || ''; t.lemma = ''; });
  return wartText(zeilen);
}
function wartErkennen(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  upd(id, 'text', wartErkenneText(w.text));
}
// Text aus dem Eingabefeld: NEU hinzugekommene Wörter werden automatisch erkannt (bei einem
// frisch eingefügten Text also alle). Wörter, die schon im alten Text standen, behalten ihren
// Stand — auch „keine Wortart", falls die Lehrkraft ein Kennzeichen bewusst entfernt hat.
// (Als „schon da" zählen deshalb nur Wörter, die im alten Text OHNE Kennzeichen standen.)
function wartTextSet(id, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  if (typeof wartLexErkenne !== 'function') { upd(id, 'text', value); return; }
  const alt = {}; wartWoerter(w).filter(t => !t.tag).forEach(t => { const k = t.wort.toLowerCase(); alt[k] = (alt[k] || 0) + 1; });
  const zeilen = wartZeilen(value), neu = zeilen.flat().filter(t => t.leer == null);
  const tags = wartLexErkenne(neu), gesehen = {};
  neu.forEach((t, i) => {
    const k = t.wort.toLowerCase(); gesehen[k] = (gesehen[k] || 0) + 1;
    if (!t.tag && gesehen[k] > (alt[k] || 0)) t.tag = tags[i] || '';
  });
  upd(id, 'text', wartText(zeilen));
}
// Klick auf ein Wort: Wortart weiterschalten (keine → gesuchte Wortarten der Reihe nach → keine)
function wartKlick(id, n) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const zeilen = wartZeilen(w.text), t = zeilen.flat().find(x => x.n === n); if (!t) return;
  const folge = ['', ...wartArten(w)], i = folge.indexOf(t.tag);
  t.tag = folge[(i + 1) % folge.length] || '';       // unbekannt/nicht gesucht (i = -1) → keine
  t.lemma = '';
  upd(id, 'text', wartText(zeilen));
}
function wartToggle(id, art) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const a = wartArten(w), i = a.indexOf(art);
  if (i >= 0) { if (a.length > 1) a.splice(i, 1); } else a.push(art);
  upd(id, 'arten', ['N', 'V', 'A'].filter(x => a.includes(x)));
}
// Grundform eines gekennzeichneten Wortes (eigene Angabe > Wortliste > Wort selbst)
function wartGrundform(t) {
  if (t.lemma) return t.lemma;
  if (t.tag === 'N') return t.wort;
  const g = typeof wartLexGrundform === 'function' ? wartLexGrundform(t.wort, t.tag) : null;
  return g || t.wort.toLowerCase();
}
// Gesuchte Wörter einer Wortart ohne Doppelte: [{wort, grundform}]
function wartListe(d, art) {
  const out = [], seen = new Set();
  wartWoerter(d).filter(t => t.tag === art).forEach(t => {
    const g = wartGrundform(t), k = g.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    // Nomen/Wörter am Satzanfang in ihrer üblichen Schreibung zeigen
    const wort = art === 'N' ? t.wort : (t.satzanfang ? t.wort.charAt(0).toLowerCase() + t.wort.slice(1) : t.wort);
    out.push({ wort, grundform: g });
  });
  return out;
}

WIDGETS.push({
  meta: { type:'wortarten', group:'grammatik', label:'Wortarten', desc:'Nomen, Verben, Adjektive erkennen, markieren, sortieren', icon:'🖍', category:'deutsch' },

  createData: id => ({
    id, type:'wortarten',
    text: 'Der kleine/A Hund/N bellt/V laut/A. Die Katze/N schläft/V auf dem weichen/A Sofa/N.\nIm Garten/N blühen/V bunte/A Blumen/N. Die Kinder/N spielen/V fröhlich/A mit dem Ball/N.',
    arten:['N','V','A'], schreibung:'normal', zusatz:'ohne', legende:true, groesse:'mittel', font:"'DidactGothic7', sans-serif",
    aufgabenNr:0, aufgabenText:'',
  }),

  render: d => {
    const zeilen = wartZeilen(d.text).filter(z => z.some(t => t.leer == null));
    if (!zeilen.length)
      return atHtml(d) + `<div style="color:#aaa;font-size:13px;padding:8px;">Kein Text – in den Eigenschaften eingeben, die Wortarten werden automatisch erkannt.</div>`;
    const isActive = d.id === selId || _solutionsMode;
    const klickbar = d.id === selId && !_solutionsMode;
    const g = d.groesse || 'mittel', fs = g === 'gross' ? 24 : g === 'klein' ? 16 : 20;
    const font = d.font || "'DidactGothic7', sans-serif";
    const arten = wartArten(d), schr = d.schreibung || 'normal';
    const zeig = w => schr === 'gross' ? w.toUpperCase() : w;

    const legende = d.legende === false ? '' :
      `<div style="display:flex;flex-wrap:wrap;gap:6px ${Math.round(fs * 1.2)}px;margin-bottom:${Math.round(fs * 0.6)}px;font-family:'DidactGothic7',sans-serif;font-size:${Math.round(fs * 0.8)}px;color:#222;">`
      + arten.map(a => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">`
        + `<span style="display:inline-block;width:${Math.round(fs * 0.8)}px;height:${Math.round(fs * 0.8)}px;border-radius:3px;background:${WART[a].farbe};"></span>${WART[a].name} = ${WART[a].farbname}</span>`).join('')
      + `</div>`;

    const text = zeilen.map(z =>
      `<p style="margin:0 0 ${Math.round(fs * 0.5)}px;">` + z.filter(t => t.leer == null).map(t => {
        let wort = t.wort;
        if (schr === 'nomenklein' && t.tag === 'N' && !t.satzanfang) wort = wort.charAt(0).toLowerCase() + wort.slice(1);
        const zeigen = isActive && t.tag && arten.includes(t.tag);
        const stil = zeigen ? `color:${WART[t.tag].farbe};font-weight:700;border-bottom:${Math.max(2, Math.round(fs * 0.13))}px solid ${WART[t.tag].farbe};` : '';
        const klick = klickbar ? ` onclick="event.stopPropagation();wartKlick(${d.id},${t.n})" title="Klick: Wortart ändern"` : '';
        return esc(zeig(t.pre)) + `<span style="${stil}${klickbar ? 'cursor:pointer;' : ''}"${klick}>${esc(zeig(wort))}</span>` + esc(zeig(t.post));
      }).join(' ') + `</p>`).join('');

    // Zusatzaufgabe: Linien bzw. Tabellenzeilen in der passenden Anzahl
    let zusatz = '';
    const listen = arten.map(a => ({ a, l: wartListe(d, a) })).filter(x => x.l.length);
    const basis = `font-family:${font};font-size:${Math.round(fs * 0.9)}px;color:#222;`;
    if (d.zusatz === 'schreiben' && listen.length) {
      const frac = typeof widthFrac === 'function' ? widthFrac(d) : 1;
      const platz = typeof geom === 'function' ? geom().contentW * frac - 30 : 600;
      const cols = Math.max(1, Math.min(4, Math.floor(platz / (fs * 9))));
      zusatz = listen.map(({ a, l }) =>
        (listen.length > 1 ? `<div style="font-family:'DidactGothic7',sans-serif;font-size:${Math.round(fs * 0.75)}px;font-weight:700;color:#444;margin:${Math.round(fs * 0.5)}px 0 2px;">${WART[a].name}</div>` : '')
        + `<div style="${basis}display:grid;grid-template-columns:repeat(${cols},1fr);column-gap:${Math.round(fs * 1.2)}px;">`
        + l.map(x => `<div style="height:${Math.round(fs * 1.9)}px;border-bottom:1.5px solid #555;display:flex;align-items:flex-end;padding:0 4px 2px;box-sizing:border-box;color:#2563eb;font-weight:700;white-space:nowrap;overflow:hidden;">${isActive ? esc(x.grundform) : ''}</div>`).join('')
        + `</div>`).join('');
      zusatz = `<div style="margin-top:${Math.round(fs * 0.7)}px;">${zusatz}</div>`;
    } else if (d.zusatz === 'tabelle' && listen.length) {
      const sp = arten.map(a => ({ a, l: wartListe(d, a) }));
      const n = Math.max(2, ...sp.map(x => x.l.length));
      let t = `<tr>${sp.map(x => `<th style="width:${(100 / sp.length).toFixed(2)}%;padding:${Math.round(fs * 0.25)}px 6px;font-family:'DidactGothic7',sans-serif;">${WART[x.a].name}</th>`).join('')}</tr>`;
      for (let r = 0; r < n; r++)
        t += `<tr>${sp.map(x => `<td style="height:${Math.round(fs * 1.8)}px;padding:0 8px;color:#2563eb;font-weight:700;overflow:hidden;white-space:nowrap;">${isActive && x.l[r] ? esc(x.l[r].wort) : ''}</td>`).join('')}</tr>`;
      zusatz = `<table class="bw-tab" style="${basis}width:100%;table-layout:fixed;margin-top:${Math.round(fs * 0.8)}px;">${t}</table>`;
    }

    // Großer Zeilen- und Wortabstand: Platz zum Unterstreichen/Anmalen
    return atHtml(d) + legende
      + `<div style="font-family:${font};font-size:${fs}px;line-height:2.1;word-spacing:${(fs * 0.22).toFixed(1)}px;color:#222;">${text}</div>` + zusatz;
  },

  renderProps: d => {
    const g = d.groesse || 'mittel', font = d.font || "'DidactGothic7', sans-serif", arten = wartArten(d);
    const schr = d.schreibung || 'normal', zus = d.zusatz || 'ohne';
    const tgl = (aktiv, label, js) =>
      `<button onclick="event.stopPropagation();${js}"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${aktiv?'#89b4fa':'#ddd'};
               background:${aktiv?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${aktiv?'#1e1e2e':'#999'};">${label}</button>`;
    const woerter = wartWoerter(d);
    const zahl = a => woerter.filter(t => t.tag === a).length;
    const chips = woerter.map(t => {
      const an = t.tag && arten.includes(t.tag), c = an ? WART[t.tag] : null;
      return `<span onclick="event.stopPropagation();wartKlick(${d.id},${t.n})"
        style="display:inline-block;padding:2px 6px;margin:2px 1px;border-radius:4px;cursor:pointer;font-size:13px;line-height:1.8;
               background:${c ? c.hell : '#f0eee8'};border:1.5px solid ${c ? c.farbe : '#ddd'};color:${c ? c.farbe : '#333'};
               font-weight:${c ? 700 : 400};">${esc(t.wort)}</span>`;
    }).join('');
    return `<div class="prow"><label>Text</label></div>
      <textarea onclick="event.stopPropagation()" onchange="wartTextSet(${d.id},this.value)"
        style="width:100%;box-sizing:border-box;border:1.5px solid #ddd;border-radius:6px;outline:none;resize:vertical;
               padding:8px 10px;min-height:120px;font-family:inherit;font-size:12px;line-height:1.6;color:#333;margin-bottom:6px;">${esc(d.text || '')}</textarea>
      <div style="font-size:10.5px;color:#aaa;margin-bottom:6px;line-height:1.4;">Neuen Text einfügen → die Wortarten werden automatisch erkannt und mit /N, /V, /A hinter dem Wort gekennzeichnet (wird nicht gedruckt). Eigene Grundform: lief/V=laufen.</div>
      <button onclick="event.stopPropagation();wartErkennen(${d.id})"
        style="margin:0 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
               color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🔍 Wortarten neu erkennen</button>
      <div class="prow"><label>Gesuchte Wortarten</label><div style="display:flex;gap:4px;">
        ${['N','V','A'].map(a => tgl(arten.includes(a), `${WART[a].name} (${zahl(a)})`, `wartToggle(${d.id},'${a}')`)).join('')}</div></div>
      <div class="prow"><label>Wort anklicken = Wortart ändern</label>
        <div style="margin-top:5px;line-height:2;">${chips}</div>
        <div style="font-size:10.5px;color:#aaa;margin-top:3px;">Die Erkennung ist ein Vorschlag – bitte kurz durchsehen. Geht auch direkt im Blatt.</div></div>
      <div class="prow"><label>Schreibung</label><div style="display:flex;gap:4px;">
        ${tgl(schr==='normal','Normal',`upd(${d.id},'schreibung','normal')`)}${tgl(schr==='nomenklein','Nomen klein',`upd(${d.id},'schreibung','nomenklein')`)}${tgl(schr==='gross','ALLES GROSS',`upd(${d.id},'schreibung','gross')`)}</div></div>
      <div class="prow"><label>Zusatzaufgabe</label><div style="display:flex;gap:4px;">
        ${tgl(zus==='ohne','Keine',`upd(${d.id},'zusatz','ohne')`)}${tgl(zus==='schreiben','Grundform schreiben',`upd(${d.id},'zusatz','schreiben')`)}${tgl(zus==='tabelle','Tabelle',`upd(${d.id},'zusatz','tabelle')`)}</div></div>
      <div class="prow"><label>Farb-Legende</label><div style="display:flex;gap:4px;">
        ${tgl(d.legende !== false,'Anzeigen',`upd(${d.id},'legende',true)`)}${tgl(d.legende === false,'Ohne',`upd(${d.id},'legende',false)`)}</div></div>`
      + pr('Schrift', `<select onchange="upd(${d.id},'font',this.value)">${SCHREIB_FONTS.map(f => `<option value="${f.value}" ${font===f.value?'selected':''}>${f.label}</option>`).join('')}</select>`)
      + `<div class="prow"><label>Größe</label><div style="display:flex;gap:4px;">
        ${tgl(g==='klein','Klein',`upd(${d.id},'groesse','klein')`)}${tgl(g==='mittel','Mittel',`upd(${d.id},'groesse','mittel')`)}${tgl(g==='gross','Groß',`upd(${d.id},'groesse','gross')`)}</div></div>`;
  },
});
