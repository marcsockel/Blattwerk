#!/bin/bash
# Startet einen lokalen Webserver für Blattwerk

# Verzeichnis des Skripts
cd "$(dirname "$0")"

PORT=3000

echo "🌿 Blattwerk – lokaler Server"
echo "──────────────────────────────"

# Python 3
if command -v python3 &>/dev/null; then
  echo "Öffne http://localhost:$PORT"
  open "http://localhost:$PORT" 2>/dev/null || true
  python3 -m http.server $PORT

# Python 2 Fallback
elif command -v python &>/dev/null; then
  echo "Öffne http://localhost:$PORT"
  open "http://localhost:$PORT" 2>/dev/null || true
  python -m SimpleHTTPServer $PORT

# Node / npx
elif command -v npx &>/dev/null; then
  echo "Öffne http://localhost:$PORT"
  open "http://localhost:$PORT" 2>/dev/null || true
  npx serve -l $PORT .

else
  echo "❌ Kein geeigneter Server gefunden."
  echo "   Bitte Python 3 oder Node.js installieren."
  exit 1
fi
