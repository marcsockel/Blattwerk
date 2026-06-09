# Blattwerk als Neutralino Desktop-App

## Einmalige Einrichtung

```bash
# 1. Ins Blattwerk-Verzeichnis wechseln
cd /Users/nemo/GitHub/Blattwerk

# 2. Neutralino CLI installieren
npm install -g @neutralinojs/neu

# 3. Binaries herunterladen (macOS + Windows + Linux, ~3MB je)
neu update

# 4. App starten (Entwicklungsmodus)
neu run
```

## Was passiert danach

`neu update` lädt folgende Dateien herunter:
- `neutralino.js`          – Client-Bibliothek (ins Projektverzeichnis)
- `binaries/blattwerk-mac` – macOS Binary
- `binaries/blattwerk-win` – Windows .exe
- `binaries/blattwerk-linux` – Linux Binary

## Release bauen

```bash
neu build
# → dist/blattwerk/ enthält die fertige App
```

## Unterschied Browser vs. Desktop

Die App erkennt automatisch ob sie in Neutralino läuft:
- **Browser**: alles funktioniert wie gewohnt, NeuBridge ist inaktiv
- **Desktop**: native Dateidialoge, kein Browser-Chrome, keine Extensions

## Nächste Schritte (optional)

- `blattSave()` / `blattOpen()` in index.html auf `NeuBridge.saveBlatt()` umstellen
  → nativer Speichern/Öffnen-Dialog statt Browser-Download
- Fenstergröße / Position merken via `Neutralino.storage`
- App-Icon: `neutralino.config.json` → `modes.window.icon`
