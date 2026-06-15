// Widget: Wörter mit äu und ä

// Font-Liste zentral in main/helpers.js (SCHREIB_FONTS).

const AEUE_POOL = {
  'äu': [
    { art:'',    stem:'tr',  alt:'eu/äu', end:'men',   verwandt:'der Traum'   },
    { art:'die', stem:'Tr',  alt:'eu/äu', end:'me',    verwandt:'der Traum'   },
    { art:'die', stem:'B',   alt:'eu/äu', end:'me',    verwandt:'der Baum'    },
    { art:'die', stem:'M',   alt:'eu/äu', end:'se',    verwandt:'die Maus'    },
    { art:'die', stem:'H',   alt:'eu/äu', end:'ser',   verwandt:'das Haus'    },
    { art:'die', stem:'F',   alt:'eu/äu', end:'ste',   verwandt:'die Faust'   },
    { art:'die', stem:'L',   alt:'eu/äu', end:'se',    verwandt:'die Laus'    },
    { art:'die', stem:'Kr',  alt:'eu/äu', end:'ter',   verwandt:'das Kraut'   },
    { art:'',    stem:'s',   alt:'eu/äu', end:'bern',  verwandt:'sauber'      },
    { art:'die', stem:'M',   alt:'eu/äu', end:'ler',   verwandt:'das Maul'    },
    { art:'die', stem:'R',   alt:'eu/äu', end:'ber',   verwandt:'der Raub'    },
    { art:'die', stem:'Str', alt:'eu/äu', end:'cher',  verwandt:'der Strauch' },
  ],
  'ä': [
    { art:'die', stem:'W',   alt:'e/ä', end:'lder',  verwandt:'der Wald'   },
    { art:'die', stem:'B',   alt:'e/ä', end:'der',   verwandt:'das Bad'    },
    { art:'die', stem:'G',   alt:'e/ä', end:'rten',  verwandt:'der Garten' },
    { art:'',    stem:'k',   alt:'e/ä', end:'mpfen', verwandt:'der Kampf'  },
    { art:'die', stem:'H',   alt:'e/ä', end:'nde',   verwandt:'die Hand'   },
    { art:'die', stem:'B',   alt:'e/ä', end:'nke',   verwandt:'die Bank'   },
    { art:'die', stem:'Gl',  alt:'e/ä', end:'ser',   verwandt:'das Glas'   },
    { art:'die', stem:'M',   alt:'e/ä', end:'nner',  verwandt:'der Mann'   },
    { art:'die', stem:'B',   alt:'e/ä', end:'lle',   verwandt:'der Ball'   },
    { art:'die', stem:'V',   alt:'e/ä', end:'ter',   verwandt:'der Vater'  },
    { art:'die', stem:'St',  alt:'e/ä', end:'dte',   verwandt:'die Stadt'  },
    { art:'die', stem:'N',   alt:'e/ä', end:'chte',  verwandt:'die Nacht'  },
    { art:'die', stem:'W',   alt:'e/ä', end:'nde',   verwandt:'die Wand'   },
    { art:'',    stem:'w',   alt:'e/ä', end:'rmer',  verwandt:'warm'       },
  ],
};

function aeueGenText(modi, anzahl) {
  const pool = [];
  if (modi.includes('äu')) pool.push(...AEUE_POOL['äu']);
  if (modi.includes('ä'))  pool.push(...AEUE_POOL['ä']);
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, Math.min(anzahl, pool.length))
    .map(e => `${e.art ? e.art + ' ' : ''}${e.stem}[${e.alt}]${e.end}, ${e.verwandt}`)
    .join('\n');
}

function aeueParseText(text) {
  return (text || '').split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const commaIdx = l.indexOf(',');
      if (commaIdx < 0) return null;
      const left     = l.slice(0, commaIdx).trim();
      const verwandt = l.slice(commaIdx + 1).trim();
      const bo = left.indexOf('['), bc = left.indexOf(']');
      if (bo < 0 || bc < 0) return null;
      const before = left.slice(0, bo);
      const alt    = left.slice(bo + 1, bc);
      const end    = left.slice(bc + 1);
      const sp = before.lastIndexOf(' ');
      let art = '', stem = before.trim();
      if (sp >= 0) { art = before.slice(0, sp).trim(); stem = before.slice(sp + 1); }
      return { art, stem, alt, end, verwandt };
    }).filter(Boolean);
}

// ── Widget ────────────────────────────────────────────────────────
WIDGETS.push({
  meta: { type:'aeue', label:'äu / ä', desc:'Wörter mit äu und ä', icon:'ä', category:'deutsch' },

  createData: id => {
    const modi = ['äu', 'ä'], anzahl = 6;
    return { id, type:'aeue', modi, anzahl,
             font: "'Grundschrift', sans-serif", fontSize: 16,
             text: aeueGenText(modi, anzahl) , aufgabenNr:0, aufgabenText:''};
  },

  render: d => {
    const font      = d.font     || "'Grundschrift', sans-serif";
    const fontSize  = d.fontSize || 16;
    const eintraege = aeueParseText(d.text);

    if (!eintraege.length)
      return `<div style="color:#aaa;font-size:13px;padding:8px;">Keine Wörter eingetragen.</div>`;

    const thS = `padding:5px 10px;font-size:11px;font-weight:700;color:#888;
                 border-bottom:2px solid #ddd;text-align:left;white-space:nowrap;`;
    const tdS = `padding:9px 10px;border-bottom:1px solid #eee;vertical-align:middle;
                 font-family:${font};font-size:${fontSize}px;`;
    const lineBase = `display:inline-block;border-bottom:2px solid #444;height:${Math.round(fontSize*0.5)}px;vertical-align:-${Math.round(fontSize*0.4)}px;`;

    const rows = eintraege.map(({ art, stem, alt, end, verwandt }) =>
      `<tr>
        <td style="${tdS};white-space:nowrap;">
          ${art ? art + ' ' : ''}${stem}<span style="background:#f0ede6;border-radius:3px;
            padding:1px 5px;font-weight:700;">${alt}</span>${end}
        </td>
        <td style="${tdS};">
          <span style="${lineBase}min-width:100px;"></span>
        </td>
        <td style="${tdS};white-space:nowrap;">
          also: <span style="${lineBase}min-width:150px;margin-left:4px;"></span>
        </td>
      </tr>`
    ).join('');

    return atHtml(d) + `<table style="width:100%;border-collapse:collapse;font-family:${font};">
      <thead><tr>
        <th style="${thS}">Wort</th>
        <th style="${thS}">verwandt mit:</th>
        <th style="${thS}">also:</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  },

  renderProps: d => {
    const modi     = d.modi     || ['äu', 'ä'];
    const anzahl   = d.anzahl   || 6;
    const font     = d.font     || "'Grundschrift', sans-serif";
    const fontSize = d.fontSize || 16;
    const text     = d.text     || '';

    const poolSize = (modi.includes('äu') ? AEUE_POOL['äu'].length : 0)
                   + (modi.includes('ä')  ? AEUE_POOL['ä'].length  : 0);

    const togBtn = (label, active, onclick) =>
      `<button onclick="event.stopPropagation();${onclick}"
        style="flex:1;padding:5px 4px;border-radius:4px;
               border:1.5px solid ${active?'#a6e3a1':'#ddd'};
               background:${active?'#e8fdf0':'#fff'};font-family:inherit;
               font-size:11px;font-weight:700;cursor:pointer;
               color:${active?'#1e1e2e':'#999'};">${label}</button>`;

    return `
      <div class="prow"><label>Modi</label>
        <div style="display:flex;gap:4px;">
          ${togBtn('ä',  modi.includes('ä'),  `aeueToggleModus(${d.id},'ä')`)}
          ${togBtn('äu', modi.includes('äu'), `aeueToggleModus(${d.id},'äu')`)}
        </div>
      </div>
      ${pr('Anzahl', `<input type="number" min="1" max="${poolSize}"
        value="${anzahl}" onclick="event.stopPropagation()"
        onchange="aeueSetAnzahl(${d.id},+this.value)"
        style="width:54px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
               font-family:inherit;font-size:12px;text-align:center;">`)}
      <div class="prow"><label>Wörter</label></div>
      <div style="border:1.5px solid #ddd;border-radius:6px;overflow:hidden;margin-bottom:6px;">
        <div style="display:flex;align-items:center;padding:5px 6px;border-bottom:1px solid #eee;background:#fafafa;">
          <div style="margin-left:auto;"><input type="number" min="8" max="36" value="${fontSize}"
            onclick="event.stopPropagation()"
            onchange="upd(${d.id},'fontSize',+this.value)"
            style="width:46px;padding:3px 5px;border:1.5px solid #ddd;border-radius:4px;
                   font-family:inherit;font-size:12px;text-align:center;"></div>
        </div>
        <textarea onclick="event.stopPropagation()"
          onfocus="edFocus()" onblur="edBlur()"
          oninput="updq(${d.id},'text',this.value)"
          style="width:100%;height:150px;font-family:inherit;font-size:12px;
                 border:none;outline:none;padding:8px 10px;
                 resize:vertical;box-sizing:border-box;line-height:1.6;display:block;"
          >${esc(text)}</textarea>
        <div style="border-top:1px solid #eee;background:#fafafa;padding:4px 6px;">
          <select onchange="upd(${d.id},'font',this.value)"
            style="width:100%;border:none;background:transparent;font-family:inherit;font-size:12px;outline:none;cursor:pointer;">
            ${SCHREIB_FONTS.map(f=>`<option value="${f.value}" ${font===f.value?'selected':''}>${f.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <button onclick="event.stopPropagation();aeueWuerfeln(${d.id})"
        style="margin-top:6px;width:100%;padding:6px;border:none;border-radius:5px;
               background:#313244;color:#cdd6f4;font-family:inherit;font-size:12px;
               font-weight:700;cursor:pointer;">🎲 Neu würfeln</button>` +
    atProps(d.id, d);
  },
});

// ── Helpers ───────────────────────────────────────────────────────
function aeueToggleModus(id, m) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  const modi = (w.modi || ['äu', 'ä']).slice();
  const idx  = modi.indexOf(m);
  if (idx >= 0) {
    if (modi.length === 1) return;
    modi.splice(idx, 1);
  } else {
    modi.push(m);
  }
  saveHistory();
  w.modi = modi;
  w.text = aeueGenText(modi, w.anzahl || 6);
  render(); renderProps(id);
}

function aeueSetAnzahl(id, anzahl) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.anzahl = anzahl;
  w.text   = aeueGenText(w.modi || ['äu', 'ä'], anzahl);
  render(); renderProps(id);
}

function aeueWuerfeln(id) {
  const w = widgets.find(x => x.id === id); if (!w) return;
  saveHistory();
  w.text = aeueGenText(w.modi || ['äu', 'ä'], w.anzahl || 6);
  render(); renderProps(id);
}
