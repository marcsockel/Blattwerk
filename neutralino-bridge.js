// Neutralino-Bridge für Blattwerk
// Wird nur aktiv wenn die App in Neutralino läuft (nicht im Browser)

const NeuBridge = (() => {
  const isNeu = () => typeof Neutralino !== 'undefined';

  // ── Fenster-Titel mit Dateinamen aktualisieren ─────────────────
  function setTitle(name) {
    if (!isNeu()) return;
    Neutralino.window.setTitle(`Blattwerk – ${name}`);
  }

  // ── Datei speichern (nativer Dialog) ──────────────────────────
  async function saveBlatt(defaultName, blobOrData) {
    if (!isNeu()) return null;
    const path = await Neutralino.os.showSaveDialog('Arbeitsblatt speichern', {
      defaultPath: defaultName,
      filters: [{ name: 'Blattwerk-Datei', extensions: ['blatt'] }]
    });
    if (!path) return null;
    // Blob → Base64 → Datei schreiben
    const buf = await blobOrData.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    await Neutralino.filesystem.writeBinaryFile(path, b64);
    return path;
  }

  // ── Datei öffnen (nativer Dialog) ─────────────────────────────
  async function openBlatt() {
    if (!isNeu()) return null;
    const entries = await Neutralino.os.showOpenDialog('Arbeitsblatt öffnen', {
      filters: [{ name: 'Blattwerk-Datei', extensions: ['blatt'] }]
    });
    if (!entries || !entries.length) return null;
    const b64 = await Neutralino.filesystem.readBinaryFile(entries[0]);
    // Base64 → Blob
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], entries[0].split('/').pop(), { type: 'application/zip' });
  }

  // ── Still drucken (ohne Dialog) ───────────────────────────────
  async function silentPrint() {
    if (!isNeu()) { window.print(); return; }
    // Neutralino v5+: über os.execCommand lp/print aufrufen
    // Erst PDF generieren, dann an Standarddrucker senden
    Neutralino.window.print();   // öffnet nativen Druckdialog des WebView
  }

  // ── Initialisierung ───────────────────────────────────────────
  function init() {
    if (!isNeu()) return;
    Neutralino.init();

    // Fenster-Close abfangen (optional: "Wirklich beenden?")
    Neutralino.events.on('windowClose', () => Neutralino.app.exit());

    // Tastenkürzel für Vollbild
    Neutralino.events.on('ready', () => {
      console.log('Blattwerk läuft als Neutralino-Desktop-App');
    });
  }

  return { init, setTitle, saveBlatt, openBlatt, silentPrint, isNeu };
})();

// Auto-Init
NeuBridge.init();
