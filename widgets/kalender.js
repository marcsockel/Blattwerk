// Widget: Kalender (Monatsblatt)
// Ein Monat als Tabelle Mo–So, daneben/darunter automatisch erzeugte Fragen
// (Wochentag eines Datums, Datum des n-ten Wochentags, Anzahl Tage/Wochentage, „x Tage später").
// Modi (modus):
//   voll    – alle Tage eingetragen (ablesen)
//   luecken – einige Tage fehlen und werden eingetragen; Lösung blau
// Fragen speichern nur ihre Parameter ({t:Typ, ...}); Text und Lösung entstehen beim Zeichnen
// aus Monat/Jahr. Monat/Jahr/Anzahl ändern → kalSet() würfelt Lücken und Fragen passend neu.
// Eigene Fragen („Manuelle Bearbeitung", eine Zeile je Frage, „Frage | Lösung") haben den Typ
// 'frei' ({t:'frei', q, a}) und bleiben beim Würfeln und beim Monatswechsel stehen.

const KAL_MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const KAL_WT     = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
const KAL_WT_PL  = ['Montage','Dienstage','Mittwoche','Donnerstage','Freitage','Samstage','Sonntage'];
const KAL_WT_K   = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const KAL_FRAGEN_MAX = 12;

function kalMonat(d) { return Math.max(1, Math.min(12, Math.round(+d.monat) || 1)); }
function kalJahr(d)  { return Math.max(1900, Math.min(2200, Math.round(+d.jahr) || new Date().getFullYear())); }
function kalTage(d)  { return new Date(kalJahr(d), kalMonat(d), 0).getDate(); }
// Wochentag eines Tages: 0 = Montag … 6 = Sonntag
function kalWt(d, tag) { return (new Date(kalJahr(d), kalMonat(d) - 1, tag).getDay() + 6) % 7; }
function kalRand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function kalMisch(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = kalRand(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// Alle Tage des Monats mit Wochentag wt
function kalTageMitWt(d, wt) { const out = []; for (let t = 1; t <= kalTage(d); t++) if (kalWt(d, t) === wt) out.push(t); return out; }

function kalGenLuecken(w) {
  const n = Math.max(1, Math.min(20, Math.round(+w.anzahlLuecken) || 8));
  const tage = []; for (let t = 1; t <= kalTage(w); t++) tage.push(t);
  w.luecken = kalMisch(tage).slice(0, n).sort((a, b) => a - b);
}

// Eine Frage eines Typs erzeugen (nur Parameter)
function kalFrage(w, typ) {
  const n = kalTage(w);
  if (typ === 'wt')     return { t: 'wt', tag: kalRand(1, n) };                         // Welcher Wochentag ist der 14.?
  if (typ === 'nter')   { const wt = kalRand(0, 6); return { t: 'nter', wt, nr: kalRand(1, Math.min(4, kalTageMitWt(w, wt).length)) }; }
  if (typ === 'anzWt')  return { t: 'anzWt', wt: kalRand(0, 6) };                       // Wie viele Sonntage?
  if (typ === 'tage')   return { t: 'tage' };                                           // Wie viele Tage hat der Monat?
  if (typ === 'beginn') return { t: 'beginn' };
  if (typ === 'ende')   return { t: 'ende' };
  if (typ === 'datum')  { const k = kalRand(3, 10); return { t: 'datum', k, tag: kalRand(1, n - k) }; }   // Datum k Tage später
  const k = kalRand(2, 9); return { t: 'wtSp', k, tag: kalRand(1, n - k) };            // Wochentag k Tage später
}
function kalGenFragen(w) {
  const n = Math.max(0, Math.min(KAL_FRAGEN_MAX, Math.round(+w.anzahlFragen) || 0));
  // Ablese-Fragen dürfen doppelt vorkommen (andere Zahlen), die übrigen je einmal
  const pool = kalMisch(['wt', 'nter', 'anzWt', 'datum', 'wtSp', 'tage', 'beginn', 'ende']).concat(kalMisch(['wt', 'nter', 'datum', 'wtSp']), kalMisch(['wt', 'nter', 'datum', 'wtSp']));
  const neu = [], seen = new Set();
  for (const typ of pool) {
    if (neu.length >= n) break;
    let f = null, key = '';
    for (let v = 0; v < 20; v++) { f = kalFrage(w, typ); key = JSON.stringify(f); if (!seen.has(key)) break; f = null; }
    if (f) { seen.add(key); neu.push(f); }
  }
  // Eigene Fragen bleiben an ihrer Stelle stehen, nur die übrigen werden neu gewürfelt
  const alt = Array.isArray(w.fragen) ? w.fragen : [], out = [];
  for (let i = 0; i < n; i++) {
    if (alt[i] && alt[i].t === 'frei') out.push(alt[i]);
    else if (neu.length) out.push(neu.shift());
  }
  w.fragen = out;
}
function kalGenerate(w) { kalGenLuecken(w); kalGenFragen(w); }

// Text + Lösung einer Frage
function kalFrageText(d, f) {
  const M = KAL_MONATE[kalMonat(d) - 1], n = kalTage(d);
  const tag = Math.max(1, Math.min(n, f.tag || 1));
  switch (f.t) {
    case 'frei':   return { q: f.q || '', a: f.a || '' };
    case 'wt':     return { q: `Welcher Wochentag ist der ${tag}. ${M}?`, a: KAL_WT[kalWt(d, tag)] };
    case 'nter':   { const l = kalTageMitWt(d, f.wt), nr = Math.max(1, Math.min(l.length, f.nr || 1));
                     return { q: `Welches Datum hat der ${nr}. ${KAL_WT[f.wt]} im ${M}?`, a: `${l[nr - 1]}. ${M}` }; }
    case 'anzWt':  return { q: `Wie viele ${KAL_WT_PL[f.wt]} hat der ${M}?`, a: String(kalTageMitWt(d, f.wt).length) };
    case 'tage':   return { q: `Wie viele Tage hat der ${M}?`, a: String(n) };
    case 'beginn': return { q: `An welchem Wochentag beginnt der ${M}?`, a: KAL_WT[kalWt(d, 1)] };
    case 'ende':   return { q: `An welchem Wochentag endet der ${M}?`, a: KAL_WT[kalWt(d, n)] };
    case 'datum':  { const t2 = Math.min(n, tag + f.k); return { q: `Welches Datum ist ${t2 - tag} Tage nach dem ${tag}. ${M}?`, a: `${t2}. ${M}` }; }
    default:       { const t2 = Math.min(n, tag + (f.k || 2)); return { q: `Welcher Wochentag ist ${t2 - tag} Tage nach dem ${tag}. ${M}?`, a: KAL_WT[kalWt(d, t2)] }; }
  }
}

// Fragen ⇄ Text (für „Manuelle Bearbeitung"): eine Frage je Zeile, „Frage | Lösung".
function kalSerialize(d) {
  return (d.fragen || []).map(f => { const { q, a } = kalFrageText(d, f); return a ? `${q} | ${a}` : q; }).join('\n');
}
// Unveränderte Zeilen behalten ihre automatische Frage (passt sich dem Monat weiter an);
// geänderte oder neue Zeilen werden eigene Fragen (Lösung hinter „|", darf fehlen).
function kalParse(text, d) {
  const alt = (d.fragen || []).map(f => { const { q, a } = kalFrageText(d, f); return { f, zeile: a ? `${q} | ${a}` : q }; });
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).slice(0, KAL_FRAGEN_MAX).map(l => {
    const i = alt.findIndex(x => x.zeile === l);
    if (i >= 0) return alt.splice(i, 1)[0].f;
    const k = l.lastIndexOf('|');
    return k < 0 ? { t: 'frei', q: l, a: '' } : { t: 'frei', q: l.slice(0, k).trim(), a: l.slice(k + 1).trim() };
  });
}

// Zellgröße: nach Größe — aber nie breiter als der Platz des Widgets (z. B. ½ Breite):
// dann schrumpft der Kalender, statt über den Rand zu ragen.
function kalPlatz(d) {
  return typeof geom === 'function' && typeof widthFrac === 'function'
    ? geom().contentW * widthFrac(d) - (d.flush ? 0 : 18) - 4 : 0;
}
function kalCs(d) {
  const g = d.groesse || 'mittel';
  const soll = g === 'gross' ? 56 : g === 'klein' ? 34 : 44;
  const platz = kalPlatz(d) - 10;
  return platz > 0 ? Math.max(20, Math.min(soll, Math.floor(platz / 7))) : soll;
}

// Zellbreite: wie die Höhe — nur bei „Groß" füllt der Kalender die ganze Widget-Breite
// (Zeilenhöhe bleibt, die Zellen werden breiter).
function kalCw(d) {
  const platz = kalPlatz(d) - 10;
  return (d.groesse || 'mittel') === 'gross' && platz > 0 ? Math.max(kalCs(d), Math.floor(platz / 7)) : kalCs(d);
}

function kalTabelle(d, active) {
  const g = d.groesse || 'mittel';
  const cs = kalCs(d), cw = kalCw(d);
  const fs = Math.round(cs * 0.4);
  const ff = "'DidactGothic7',sans-serif";
  const n = kalTage(d), start = kalWt(d, 1);
  const leer = new Set((d.modus || 'voll') === 'luecken' ? (d.luecken || []) : []);
  const rb = 'border:1.2px solid #333;';
  let html = `<tr><th colspan="7" style="${rb}padding:6px 4px;background:#e4e4e4;font-family:${ff};font-size:${Math.round(fs * 1.1)}px;font-weight:700;color:#222;">${KAL_MONATE[kalMonat(d) - 1]} ${kalJahr(d)}</th></tr><tr>`;
  KAL_WT_K.forEach((k, i) => { html += `<th style="${rb}width:${cw}px;height:${Math.round(cs * 0.72)}px;padding:0;background:${i >= 5 ? '#e4e4e4' : '#f3f3f3'};font-family:${ff};font-size:${Math.round(fs * 0.85)}px;font-weight:700;color:#333;">${k}</th>`; });
  html += '</tr>';
  const zellen = start + n, zeilen = Math.ceil(zellen / 7);
  for (let r = 0; r < zeilen; r++) {
    html += '<tr>';
    for (let c = 0; c < 7; c++) {
      const tag = r * 7 + c - start + 1;
      const bg = c >= 5 ? 'background:#efefef;' : '';
      let inhalt = '';
      if (tag >= 1 && tag <= n) {
        if (!leer.has(tag)) inhalt = `<span style="color:#222;">${tag}</span>`;
        else if (active) inhalt = `<span style="color:#2563eb;font-weight:700;">${tag}</span>`;
      }
      html += `<td style="${rb}width:${cw}px;height:${cs}px;padding:0;text-align:center;vertical-align:middle;${bg}font-family:${ff};font-size:${fs}px;">${inhalt}</td>`;
    }
    html += '</tr>';
  }
  // „Groß": exakt bündig mit dem Widget-Rand (gleiche Breite wie die Fragen darunter)
  const voll = (d.groesse || 'mittel') === 'gross' && cw > cs;
  return `<table style="border-collapse:collapse;flex:0 0 auto;${voll ? 'width:100%;table-layout:fixed;' : ''}">${html}</table>`;
}

// Fragen-Layout wird gerechnet (kein CSS-Spaltenumbruch → keine Leerzeile am Spaltenanfang):
//   neben dem Kalender, wenn dort mindestens 240 px frei sind → eine Spalte
//   sonst darunter → zwei gleich breite Spalten (erst links hinunter, dann rechts),
//   bei schmalem Widget eine.
const KAL_GAP = 28, KAL_FRAGEN_MIN = 240;
function kalDaneben(d) {
  const platz = kalPlatz(d);
  return !platz || platz - (7 * kalCw(d) + 10) - KAL_GAP >= KAL_FRAGEN_MIN;
}
function kalFragenHtml(d, active) {
  const fragen = d.fragen || [];
  if (!fragen.length) return '';
  const g = d.groesse || 'mittel';
  const fs = g === 'gross' ? 17 : g === 'klein' ? 14 : 16;
  const items = fragen.map(f => {
    const { q, a } = kalFrageText(d, f);
    return `<div style="padding-bottom:${Math.round(fs * 0.9)}px;">`
      + `<div style="color:#222;line-height:1.35;">${esc(q)}</div>`
      + `<div style="min-height:${Math.round(fs * 1.9)}px;border-bottom:1.2px solid #555;display:flex;align-items:flex-end;padding:0 4px 2px;box-sizing:border-box;`
      + `color:#2563eb;font-weight:700;">${active ? esc(a) : ''}</div></div>`;
  }).join('');
  const ff = `font-family:'DidactGothic7',sans-serif;font-size:${fs}px;`;
  if (kalDaneben(d)) return `<div style="flex:1 1 0;min-width:0;${ff}">${items}</div>`;
  const zwei = fragen.length > 1 && kalPlatz(d) >= 2 * KAL_FRAGEN_MIN + KAL_GAP;
  return zwei
    ? `<div style="width:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(${Math.ceil(fragen.length / 2)},auto);grid-auto-flow:column;column-gap:${KAL_GAP}px;${ff}">${items}</div>`
    : `<div style="width:100%;${ff}">${items}</div>`;
}

WIDGETS.push({
  meta: { type:'kalender', group:'zeit', label:'Kalender', desc:'Monatsblatt mit Fragen zu Datum und Wochentag', icon:'📅', category:'mathematik' },

  createData: id => {
    const h = new Date();
    const w = {
      id, type:'kalender',
      monat: h.getMonth() + 1, jahr: h.getFullYear(),
      modus:'voll', anzahlLuecken:8, anzahlFragen:4, groesse:'mittel',
      aufgabenNr:0, aufgabenText:'',
    };
    kalGenerate(w);
    return w;
  },

  render: d => {
    if (!Array.isArray(d.fragen) || !Array.isArray(d.luecken)) kalGenerate(d);
    const active = d.id === selId || _solutionsMode;
    return atHtml(d)
      + `<div style="display:flex;flex-wrap:${kalDaneben(d) ? 'nowrap' : 'wrap'};align-items:flex-start;gap:18px ${KAL_GAP}px;">${kalTabelle(d, active)}${kalFragenHtml(d, active)}</div>`;
  },

  renderProps: d => {
    const size = d.groesse || 'mittel', modus = d.modus || 'voll';
    const tgl = (cur, val, label, key) =>
      `<button onclick="event.stopPropagation();upd(${d.id},'${key}','${val}')"
        style="flex:1;padding:5px 4px;border-radius:4px;border:1.5px solid ${cur===val?'#89b4fa':'#ddd'};
               background:${cur===val?'#e8f0ff':'#fff'};font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;color:${cur===val?'#1e1e2e':'#999'};">${label}</button>`;
    const m = kalMonat(d);
    let out = pr('Monat', `<select onchange="kalSet(${d.id},'monat',+this.value)">${KAL_MONATE.map((n, i) => `<option value="${i + 1}" ${m === i + 1 ? 'selected' : ''}>${n}</option>`).join('')}</select>`)
      + pr('Jahr', `<input type="number" min="1900" max="2200" value="${kalJahr(d)}" onchange="kalSet(${d.id},'jahr',+this.value)">`)
      + `<div class="prow"><label>Kalender</label>
          <div style="display:flex;gap:4px;">${tgl(modus,'voll','Vollständig','modus')}${tgl(modus,'luecken','Mit Lücken','modus')}</div></div>`;
    if (modus === 'luecken')
      out += pr('Anzahl Lücken (1–20)', `<input type="number" min="1" max="20" value="${d.anzahlLuecken || 8}" onchange="kalSet(${d.id},'anzahlLuecken',Math.max(1,Math.min(20,+this.value||1)))">`);
    out += pr(`Anzahl Fragen (0–${KAL_FRAGEN_MAX})`, `<input type="number" min="0" max="${KAL_FRAGEN_MAX}" value="${d.anzahlFragen || 0}" onchange="kalSet(${d.id},'anzahlFragen',Math.max(0,Math.min(${KAL_FRAGEN_MAX},+this.value||0)))">`)
      + `<button onclick="event.stopPropagation();kalWuerfeln(${d.id})"
          style="margin:4px 0 8px;width:100%;padding:6px;border:none;border-radius:5px;background:#313244;
                 color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>`
      + propFold('kal-manuell', 'Manuelle Bearbeitung',
          pr('Fragen (eine Zeile je Frage, Lösung hinter | )',
            `<textarea style="width:100%;box-sizing:border-box;font-family:monospace;font-size:11px;border:1.5px solid #ddd;border-radius:4px;padding:3px 6px;min-height:120px;resize:vertical;" onclick="event.stopPropagation()" onchange="kalEditFragen(${d.id},this.value)">${esc(kalSerialize(d))}</textarea>`
            + `<div style="font-size:11px;color:#aaa;margin-top:3px;">Geänderte und neue Zeilen bleiben beim Würfeln und beim Monatswechsel stehen.</div>`), false)
      + `<div class="prow"><label>Größe</label>
          <div style="display:flex;gap:4px;">${tgl(size,'klein','Klein','groesse')}${tgl(size,'mittel','Mittel','groesse')}${tgl(size,'gross','Groß','groesse')}</div></div>`;
    return out;
  },
});

// Monat/Jahr/Anzahlen ändern → passend neu erzeugen (Fragen beziehen sich auf den Monat)
function kalSet(id, key, val) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w[key] = val;
  if (key === 'anzahlLuecken') kalGenLuecken(w);
  else if (key === 'anzahlFragen') kalGenFragen(w);
  else kalGenerate(w);
  render(); renderProps(id);
}
function kalWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  kalGenerate(w);
  render(); renderProps(id);
}

// Manuelles Bearbeiten: Text → Fragen (Anzahl Fragen = Zeilenzahl).
function kalEditFragen(id, value) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.fragen = kalParse(value, w);
  w.anzahlFragen = w.fragen.length;
  render(); renderProps(id);
}
