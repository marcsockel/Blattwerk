// Gemeinsamer Bild-Auswahl-Dialog für alle Widgets mit Bildern.
// Aufruf: openImgPicker({ onPick(src, meta), query })

let _imgPickerCb = null;
let _imgPickerResults = [];
let _imgPickerAnlautList = [];
let _imgPickerView = "home"; // home | commons | anlaut
let _imgPickerPrefill = "";
let _imgPickerFilePending = false;

// ⚠️ Nach dem Worker-Deploy hier deine eigene URL eintragen
// (die von `npx wrangler deploy` ausgegebene …workers.dev-Adresse):
const PIXABAY_PROXY = "https://pixabay-proxy.DEIN-SUBDOMAIN.workers.dev/";

// Pixabay-Paginierung („Mehr laden")
let _imgPickerPixQuery = "";
let _imgPickerPixPage = 1;
let _imgPickerPixTotal = 0;
let _imgPickerPixLoading = false;

// Wikimedia-Paginierung („Mehr laden")
let _imgPickerComQuery = "";
let _imgPickerComContinue = null;
let _imgPickerComLoading = false;

const IMG_PICKER_ANLAUT_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")
  .concat(["Ä", "Ö", "Ü", "ß", "Au", "Ei", "Eu", "Sch", "Sp", "St"]);

function imgPickerAnlautLetters() {
  if (typeof ANLAUT_BILDER !== "object" || !ANLAUT_BILDER) return [];
  const keys = Object.keys(ANLAUT_BILDER);
  const ordered = IMG_PICKER_ANLAUT_ORDER.filter(l => keys.includes(l));
  keys.forEach(k => { if (!ordered.includes(k)) ordered.push(k); });
  return ordered;
}

function imgPickerBuildAnlautList() {
  const list = [];
  imgPickerAnlautLetters().forEach(letter => {
    (ANLAUT_BILDER[letter] || []).forEach(v => {
      list.push({
        anlaut: letter,
        src: `assets/anlaut/${v}.svg`,
        title: (typeof anlautWortFromSrc === "function" ? anlautWortFromSrc(v) : "") || v,
      });
    });
  });
  return list;
}

function imgPickerIsImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg|bmp|ico|heic|heif|avif)$/i.test(file.name || "");
}

function openImgPicker(opts) {
  opts = opts || {};
  _imgPickerCb = typeof opts.onPick === "function" ? opts.onPick : null;
  _imgPickerResults = [];
  _imgPickerAnlautList = [];
  _imgPickerView = "home";
  _imgPickerPrefill = opts.query || "";
  const ov = document.getElementById("img-picker-overlay");
  if (!ov) return;
  ov.style.display = "flex";
  imgPickerRenderHome();
}

function closeImgPicker() {
  if (_imgPickerFilePending) return;
  const ov = document.getElementById("img-picker-overlay");
  if (ov) ov.style.display = "none";
  _imgPickerCb = null;
  _imgPickerResults = [];
  _imgPickerAnlautList = [];
  _imgPickerPrefill = "";
  const file = document.getElementById("img-picker-file");
  if (file) file.value = "";
}

function imgPickerApply(src, meta) {
  const cb = _imgPickerCb;
  _imgPickerFilePending = false;
  const ov = document.getElementById("img-picker-overlay");
  if (ov) ov.style.display = "none";
  _imgPickerCb = null;
  _imgPickerResults = [];
  _imgPickerAnlautList = [];
  _imgPickerPrefill = "";
  const file = document.getElementById("img-picker-file");
  if (file) file.value = "";
  if (cb) cb(src, meta || {});
}

function imgPickerRenderHome() {
  _imgPickerView = "home";
  const body = document.getElementById("img-picker-body");
  const title = document.getElementById("img-picker-title");
  if (title) title.textContent = "Bild auswählen";
  if (!body) return;

  const card = (icon, label, desc, onclick) =>
    `<button type="button" onclick="event.stopPropagation();${onclick}"
      style="display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;
             padding:14px 14px;border:1.5px solid #313244;border-radius:8px;background:#181825;
             cursor:pointer;font-family:inherit;color:inherit;transition:border-color .12s,background .12s;"
      onmouseover="this.style.borderColor='#89b4fa';this.style.background='#1e2030';"
      onmouseout="this.style.borderColor='#313244';this.style.background='#181825';">
      <span style="font-size:22px;line-height:1;flex-shrink:0;">${icon}</span>
      <span style="min-width:0;">
        <span style="display:block;font-size:13px;font-weight:800;color:#cdd6f4;margin-bottom:3px;">${label}</span>
        <span style="display:block;font-size:11px;color:#a6adc8;line-height:1.45;">${desc}</span>
      </span>
    </button>`;

  body.innerHTML =
    `<div style="display:flex;flex-direction:column;gap:8px;">
      ${card("🔤", "Anlautbilder", "Cliparts nach Anfangsbuchstabe auswählen", "imgPickerShowAnlaut()")}
      ${card("🌐", "Wikimedia Commons", "Kostenlose Cliparts und Fotos online suchen", "imgPickerShowCommons()")}
      ${card("📷", "Pixabay", "Große Foto- und Clipart-Datenbank durchsuchen", "imgPickerShowPixabay()")}
      ${card("📁", "Von Festplatte", "Eigenes Bild von diesem Computer laden — oder Datei hierher ziehen", "imgPickerFromDisk()")}
    </div>`;
}

function imgPickerShowAnlaut() {
  _imgPickerView = "anlaut";
  const body = document.getElementById("img-picker-body");
  const title = document.getElementById("img-picker-title");
  if (title) title.textContent = "Anlautbilder";
  if (!body) return;

  _imgPickerAnlautList = imgPickerBuildAnlautList();
  const letters = imgPickerAnlautLetters();

  if (!letters.length || !_imgPickerAnlautList.length) {
    body.innerHTML =
      `<button type="button" onclick="event.stopPropagation();imgPickerRenderHome()"
        style="background:none;border:none;color:#89b4fa;font-family:inherit;font-size:11px;
               font-weight:700;cursor:pointer;padding:0;margin-bottom:10px;">← Zurück</button>
      <div style="color:#6c7086;font-size:12px;padding:8px 0;">Anlautbilder nicht verfügbar.</div>`;
    return;
  }

  let idx = 0;
  const sections = letters.map(letter => {
    const variants = ANLAUT_BILDER[letter] || [];
    if (!variants.length) return "";
    const thumbs = variants.map(v => {
      const item = _imgPickerAnlautList[idx];
      const i = idx++;
      const label = item ? item.title : v;
      return `<div onclick="event.stopPropagation();imgPickerSelectAnlaut(${i})"
          title="${esc(label)}"
          style="cursor:pointer;border:1.5px solid #313244;border-radius:6px;overflow:hidden;
                 width:52px;height:52px;display:flex;align-items:center;justify-content:center;
                 background:#ffffff;transition:border-color .12s;flex-shrink:0;"
          onmouseover="this.style.borderColor='#89b4fa'"
          onmouseout="this.style.borderColor='#313244'">
          <img src="assets/anlaut/${v}.svg" alt="" style="max-width:90%;max-height:90%;object-fit:contain;" loading="lazy">
        </div>`;
    }).join("");

    return `<div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:800;color:#a6adc8;margin-bottom:6px;letter-spacing:.3px;">${esc(letter)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">${thumbs}</div>
      </div>`;
  }).join("");

  body.innerHTML =
    `<button type="button" onclick="event.stopPropagation();imgPickerRenderHome()"
      style="background:none;border:none;color:#89b4fa;font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;padding:0;margin-bottom:10px;">← Zurück</button>
    <div style="max-height:380px;overflow-y:auto;padding-right:2px;">${sections}</div>`;
}

function imgPickerSelectAnlaut(i) {
  const item = _imgPickerAnlautList[i];
  if (!item) return;
  imgPickerApply(item.src, { title: item.title, source: "anlaut", anlaut: item.anlaut });
}

function imgPickerShowCommons() {
  _imgPickerView = "commons";
  const body = document.getElementById("img-picker-body");
  const title = document.getElementById("img-picker-title");
  if (title) title.textContent = "Wikimedia Commons";
  if (!body) return;

  const q = esc(_imgPickerPrefill || "");
  body.innerHTML =
    `<button type="button" onclick="event.stopPropagation();imgPickerRenderHome()"
      style="background:none;border:none;color:#89b4fa;font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;padding:0;margin-bottom:10px;">← Zurück</button>
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <input id="img-picker-q" type="text" value="${q}" placeholder="z.B. Elefant, Hund, Apfel…"
        style="flex:1;border:1.5px solid #45475a;border-radius:6px;padding:7px 10px;font-size:13px;
               font-family:inherit;outline:none;background:#11111b;color:#cdd6f4;"
        onkeydown="if(event.key==='Enter'){event.preventDefault();imgPickerCommonsSearch();}"
        onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#45475a'">
      <button type="button" onclick="event.stopPropagation();imgPickerCommonsSearch()"
        style="padding:7px 14px;border:none;border-radius:6px;background:#89b4fa;color:#1e1e2e;
               font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">Suchen</button>
    </div>
    <div id="img-picker-results" style="min-height:120px;"></div>`;

  const input = document.getElementById("img-picker-q");
  if (input) {
    input.focus();
    input.select();
  }
}

async function imgPickerCommonsSearch() {
  const input = document.getElementById("img-picker-q");
  const results = document.getElementById("img-picker-results");
  if (!input || !results) return;
  const query = input.value.trim();
  if (!query) {
    results.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Bitte einen Suchbegriff eingeben.</div>`;
    return;
  }

  _imgPickerComQuery = query;
  _imgPickerComContinue = null;
  _imgPickerResults = [];

  results.innerHTML =
    `<div id="img-picker-cgrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:340px;overflow-y:auto;padding:2px;"></div>
     <div id="img-picker-cfoot" style="margin-top:8px;text-align:center;">
       <div style="color:#6c7086;font-size:12px;padding:8px 0;">Suche läuft…</div>
     </div>`;

  await imgPickerCommonsLoad();
}

async function imgPickerCommonsLoad() {
  const grid = document.getElementById("img-picker-cgrid");
  const foot = document.getElementById("img-picker-cfoot");
  if (!grid || !foot || _imgPickerComLoading) return;
  _imgPickerComLoading = true;

  try {
    let url = `https://commons.wikimedia.org/w/api.php?action=query`
      + `&generator=search&gsrsearch=${encodeURIComponent(_imgPickerComQuery)}&gsrnamespace=6&gsrlimit=24`
      + `&prop=imageinfo&iiprop=url&iiurlwidth=120&format=json&origin=*`;

    // Fortsetzungs-Parameter der vorigen Seite anhängen
    if (_imgPickerComContinue) {
      for (const [k, v] of Object.entries(_imgPickerComContinue)) {
        url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
      }
    }

    const res = await fetch(url);
    const data = await res.json();
    _imgPickerComContinue = data.continue || null;

    const newItems = Object.values(data.query?.pages || {})
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(p => ({
        thumb: p.imageinfo?.[0]?.thumburl,
        url:   p.imageinfo?.[0]?.url,
        title: p.title?.replace(/^File:/i, "").replace(/\.\w+$/, "") || "",
      }))
      .filter(p => p.thumb && p.url && /\.(png|jpg|jpeg|svg|gif|webp)/i.test(p.url));

    if (!_imgPickerResults.length && !newItems.length) {
      foot.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Keine Ergebnisse gefunden.</div>`;
      return;
    }

    const startIndex = _imgPickerResults.length;
    _imgPickerResults = _imgPickerResults.concat(newItems);

    grid.insertAdjacentHTML("beforeend",
      newItems.map((img, k) => {
        const i = startIndex + k;
        return `<div onclick="event.stopPropagation();imgPickerSelectResult(${i})"
          title="${esc(img.title)}"
          style="cursor:pointer;border:1.5px solid #313244;border-radius:6px;overflow:hidden;
                 aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
                 background:#11111b;transition:border-color .12s;"
          onmouseover="this.style.borderColor='#89b4fa'"
          onmouseout="this.style.borderColor='#313244'">
          <img src="${img.thumb}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy">
        </div>`;
      }).join("")
    );

    imgPickerComRenderFoot();
  } catch (err) {
    foot.innerHTML = `<div style="color:#f38ba8;font-size:12px;padding:8px 0;">
      Fehler beim Laden. Bitte Internetverbindung prüfen.</div>`;
  } finally {
    _imgPickerComLoading = false;
  }
}

function imgPickerComRenderFoot() {
  const foot = document.getElementById("img-picker-cfoot");
  if (!foot) return;
  const more = !!_imgPickerComContinue;
  foot.innerHTML =
    (more
      ? `<button type="button" onclick="event.stopPropagation();imgPickerCommonsMore()"
           style="padding:7px 16px;border:1.5px solid #45475a;border-radius:6px;background:#181825;
                  color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;
                  transition:border-color .12s;"
           onmouseover="this.style.borderColor='#89b4fa'"
           onmouseout="this.style.borderColor='#45475a'">Mehr laden</button>`
      : "") +
    `<div style="font-size:10px;color:#585b70;margin-top:8px;text-align:center;">
       Bilder: Wikimedia Commons · Lizenzen variieren · ${_imgPickerResults.length} geladen
     </div>`;
}

async function imgPickerCommonsMore() {
  const foot = document.getElementById("img-picker-cfoot");
  if (foot) foot.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Lädt…</div>`;
  await imgPickerCommonsLoad();
}

function imgPickerSelectResult(i) {
  const img = _imgPickerResults[i];
  if (!img) return;
  imgPickerApply(img.url, { title: img.title, source: "commons" });
}

function imgPickerShowPixabay() {
  _imgPickerView = "pixabay";
  const body = document.getElementById("img-picker-body");
  const title = document.getElementById("img-picker-title");
  if (title) title.textContent = "Pixabay";
  if (!body) return;

  const q = esc(_imgPickerPrefill || "");
  body.innerHTML =
    `<button type="button" onclick="event.stopPropagation();imgPickerRenderHome()"
      style="background:none;border:none;color:#89b4fa;font-family:inherit;font-size:11px;
             font-weight:700;cursor:pointer;padding:0;margin-bottom:10px;">← Zurück</button>
    <div style="display:flex;gap:6px;margin-bottom:10px;">
      <input id="img-picker-pq" type="text" value="${q}" placeholder="z.B. Elefant, Hund, Apfel…"
        style="flex:1;border:1.5px solid #45475a;border-radius:6px;padding:7px 10px;font-size:13px;
               font-family:inherit;outline:none;background:#11111b;color:#cdd6f4;"
        onkeydown="if(event.key==='Enter'){event.preventDefault();imgPickerPixabaySearch();}"
        onfocus="this.style.borderColor='#89b4fa'" onblur="this.style.borderColor='#45475a'">
      <button type="button" onclick="event.stopPropagation();imgPickerPixabaySearch()"
        style="padding:7px 14px;border:none;border-radius:6px;background:#89b4fa;color:#1e1e2e;
               font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;">Suchen</button>
    </div>
    <div id="img-picker-presults" style="min-height:120px;"></div>`;

  const input = document.getElementById("img-picker-pq");
  if (input) {
    input.focus();
    input.select();
  }
}

async function imgPickerPixabaySearch() {
  const input = document.getElementById("img-picker-pq");
  const results = document.getElementById("img-picker-presults");
  if (!input || !results) return;
  const query = input.value.trim();
  if (!query) {
    results.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Bitte einen Suchbegriff eingeben.</div>`;
    return;
  }

  _imgPickerPixQuery = query;
  _imgPickerPixPage = 1;
  _imgPickerPixTotal = 0;
  _imgPickerResults = [];

  results.innerHTML =
    `<div id="img-picker-pgrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:340px;overflow-y:auto;padding:2px;"></div>
     <div id="img-picker-pfoot" style="margin-top:8px;text-align:center;">
       <div style="color:#6c7086;font-size:12px;padding:8px 0;">Suche läuft…</div>
     </div>`;

  await imgPickerPixabayLoad();
}

async function imgPickerPixabayLoad() {
  const grid = document.getElementById("img-picker-pgrid");
  const foot = document.getElementById("img-picker-pfoot");
  if (!grid || !foot || _imgPickerPixLoading) return;
  _imgPickerPixLoading = true;

  try {
    const url = `${PIXABAY_PROXY}?q=${encodeURIComponent(_imgPickerPixQuery)}`
      + `&image_type=all&per_page=24&lang=de&page=${_imgPickerPixPage}`;

    const res = await fetch(url);
    const data = await res.json();
    _imgPickerPixTotal = data.totalHits || 0;

    const newItems = (data.hits || [])
      .map(h => ({
        thumb: h.previewURL,
        url:   h.largeImageURL || h.webformatURL,
        title: (h.tags || "").split(",")[0].trim(),
      }))
      .filter(x => x.thumb && x.url);

    if (_imgPickerPixPage === 1 && !newItems.length) {
      foot.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Keine Ergebnisse gefunden.</div>`;
      return;
    }

    const startIndex = _imgPickerResults.length;
    _imgPickerResults = _imgPickerResults.concat(newItems);

    // Keine neuen Treffer mehr → Button künftig ausblenden
    if (_imgPickerPixPage > 1 && !newItems.length) {
      _imgPickerPixTotal = _imgPickerResults.length;
    }

    grid.insertAdjacentHTML("beforeend",
      newItems.map((img, k) => {
        const i = startIndex + k;
        return `<div onclick="event.stopPropagation();imgPickerSelectPixabay(${i})"
          title="${esc(img.title)}"
          style="cursor:pointer;border:1.5px solid #313244;border-radius:6px;overflow:hidden;
                 aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;
                 background:#11111b;transition:border-color .12s;"
          onmouseover="this.style.borderColor='#89b4fa'"
          onmouseout="this.style.borderColor='#313244'">
          <img src="${img.thumb}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" loading="lazy">
        </div>`;
      }).join("")
    );

    imgPickerPixRenderFoot();
  } catch (err) {
    foot.innerHTML = `<div style="color:#f38ba8;font-size:12px;padding:8px 0;">
      Fehler beim Laden. Bitte Internetverbindung und Worker-URL prüfen.</div>`;
  } finally {
    _imgPickerPixLoading = false;
  }
}

function imgPickerPixRenderFoot() {
  const foot = document.getElementById("img-picker-pfoot");
  if (!foot) return;
  const shown = _imgPickerResults.length;
  const more = shown < _imgPickerPixTotal;
  foot.innerHTML =
    (more
      ? `<button type="button" onclick="event.stopPropagation();imgPickerPixabayMore()"
           style="padding:7px 16px;border:1.5px solid #45475a;border-radius:6px;background:#181825;
                  color:#cdd6f4;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;
                  transition:border-color .12s;"
           onmouseover="this.style.borderColor='#89b4fa'"
           onmouseout="this.style.borderColor='#45475a'">Mehr laden</button>`
      : "") +
    `<div style="font-size:10px;color:#585b70;margin-top:8px;text-align:center;">
       Bilder: Pixabay · ${shown} von ${_imgPickerPixTotal}
     </div>`;
}

async function imgPickerPixabayMore() {
  _imgPickerPixPage += 1;
  const foot = document.getElementById("img-picker-pfoot");
  if (foot) foot.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Lädt…</div>`;
  await imgPickerPixabayLoad();
}

async function imgPickerSelectPixabay(i) {
  const img = _imgPickerResults[i];
  if (!img) return;
  const results = document.getElementById("img-picker-presults");
  // Bild über den Proxy holen und als Data-URL einbetten,
  // damit es dauerhaft im Arbeitsblatt bleibt (Pixabay-URLs laufen ab).
  try {
    if (results) {
      results.innerHTML = `<div style="color:#6c7086;font-size:12px;padding:8px 0;">Bild wird geladen…</div>`;
    }
    const res = await fetch(`${PIXABAY_PROXY}?img=${encodeURIComponent(img.url)}`);
    if (!res.ok) throw new Error("proxy");
    const blob = await res.blob();
    const reader = new FileReader();
    reader.onload = ev => imgPickerApply(ev.target.result, { title: img.title, source: "pixabay" });
    reader.readAsDataURL(blob);
  } catch (err) {
    // Notfall-Fallback: direkte URL (kann nach 24 h ablaufen)
    imgPickerApply(img.url, { title: img.title, source: "pixabay" });
  }
}

function imgPickerFromDisk() {
  _imgPickerFilePending = true;
  const file = document.getElementById("img-picker-file");
  if (file) file.click();
}

function imgPickerFileChosen(input) {
  _imgPickerFilePending = false;
  const file = input && input.files && input.files[0];
  if (!imgPickerIsImageFile(file)) return;
  const reader = new FileReader();
  reader.onload = ev => {
    imgPickerApply(ev.target.result, { title: file.name.replace(/\.\w+$/, ""), source: "disk" });
  };
  reader.readAsDataURL(file);
}

function imgPickerDrop(e) {
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!imgPickerIsImageFile(file)) return;
  const reader = new FileReader();
  reader.onload = ev => {
    imgPickerApply(ev.target.result, { title: file.name.replace(/\.\w+$/, ""), source: "disk" });
  };
  reader.readAsDataURL(file);
}

// Dateidialog abgebrochen → Pending-Flag zurücksetzen
window.addEventListener("focus", () => {
  if (!_imgPickerFilePending) return;
  setTimeout(() => { _imgPickerFilePending = false; }, 400);
});

// Nur schließen, wenn der Klick AUF dem Hintergrund begonnen hat –
// nicht, wenn eine Textmarkierung im Feld nach außen gezogen wurde.
(function imgPickerOverlayGuard() {
  const setup = () => {
    const ov = document.getElementById("img-picker-overlay");
    if (!ov) return;
    ov.onclick = null; // Inline-Handler (closeImgPicker) entschärfen
    let downOnOverlay = false;
    ov.addEventListener("mousedown", e => { downOnOverlay = (e.target === ov); });
    ov.addEventListener("click", e => {
      if (downOnOverlay && e.target === ov) closeImgPicker();
      downOnOverlay = false;
    });
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
