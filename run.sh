#!/bin/bash

PORT=8101
URL="http://localhost:$PORT"

echo ""
echo "  ███████╗██╗   ██╗██╗      █████╗ ███╗   ██╗ ██████╗███████╗"
echo "  ██╔════╝╚██╗ ██╔╝██║     ██╔══██╗████╗  ██║██╔════╝██╔════╝"
echo "  █████╗   ╚████╔╝ ██║     ███████║██╔██╗ ██║██║     █████╗  "
echo "  ██╔══╝    ╚██╔╝  ██║     ██╔══██║██║╚██╗██║██║     ██╔══╝  "
echo "  ██║        ██║   ███████╗██║  ██║██║ ╚████║╚██████╗███████╗"
echo "  ╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚══════╝"
echo ""
echo "  Freelance management, simplified."
echo "  by CK Softwares — https://cksoftwares.com"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Navigate to SPA folder
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPA_DIR="$SCRIPT_DIR/SPA"

if [ ! -d "$SPA_DIR" ]; then
  echo "  ✖ SPA folder not found at: $SPA_DIR"
  echo ""
  exit 1
fi

cd "$SPA_DIR"
echo "  ➜  Serving from: $SPA_DIR"
echo ""

# Detect available runtimes
HAS_PHP=false
HAS_NODE=false
HAS_PYTHON3=false
HAS_PYTHON2=false

command -v php &>/dev/null && HAS_PHP=true
command -v node &>/dev/null && HAS_NODE=true
command -v python3 &>/dev/null && HAS_PYTHON3=true
command -v python &>/dev/null && HAS_PYTHON2=true

echo "  Detected runtimes:"
$HAS_NODE    && echo "    ✔ Node.js   $(node -v)"
$HAS_PHP     && echo "    ✔ PHP       $(php -r 'echo phpversion();')"
$HAS_PYTHON3 && echo "    ✔ Python3   $(python3 --version 2>&1 | awk '{print $2}')"
$HAS_PYTHON2 && echo "    ✔ Python2   $(python --version 2>&1 | awk '{print $2}')"
echo ""

# Pick the best available runtime (Node > PHP > Python3 > Python2)
if $HAS_NODE; then
  RUNTIME="node"
elif $HAS_PHP; then
  RUNTIME="php"
elif $HAS_PYTHON3; then
  RUNTIME="python3"
elif $HAS_PYTHON2; then
  RUNTIME="python2"
else
  echo "  ✖ No supported runtime found."
  echo "  Install Node.js, PHP, or Python to run the dev server."
  echo ""
  exit 1
fi

echo "  Starting server using → $RUNTIME"
echo ""
echo "  ➜  Local:   $URL"
echo "  ➜  Press Ctrl+C to stop"
echo ""
echo "────────────────────────────────────────────────────────────"
echo ""

# Open in Chrome (cross-platform)
if command -v google-chrome &>/dev/null; then
  google-chrome "$URL" &>/dev/null &
elif command -v google-chrome-stable &>/dev/null; then
  google-chrome-stable "$URL" &>/dev/null &
elif command -v chromium-browser &>/dev/null; then
  chromium-browser "$URL" &>/dev/null &
elif command -v chromium &>/dev/null; then
  chromium "$URL" &>/dev/null &
elif [[ "$OSTYPE" == "darwin"* ]]; then
  open -a "Google Chrome" "$URL" &>/dev/null &
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  start chrome "$URL" &>/dev/null &
fi

# Start the server
case $RUNTIME in
  node)
    # Use npx serve if available, else fallback to a tiny http-server one-liner
    if command -v npx &>/dev/null; then
      npx serve -l $PORT .
    else
      node -e "
        const http = require('http');
        const fs = require('fs');
        const path = require('path');
        const port = $PORT;
        const mimeTypes = {
          '.html': 'text/html', '.css': 'text/css',
          '.js': 'application/javascript', '.json': 'application/json',
          '.png': 'image/png', '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
        };
        http.createServer((req, res) => {
          let filePath = '.' + req.url;
          if (filePath === './') filePath = './index.html';
          const ext = path.extname(filePath);
          const mime = mimeTypes[ext] || 'text/plain';
          fs.readFile(filePath, (err, data) => {
            if (err) { res.writeHead(404); res.end('Not found'); return; }
            res.writeHead(200, { 'Content-Type': mime });
            res.end(data);
          });
        }).listen(port, () => console.log('Node server running on port ' + port));
      "
    fi
    ;;
  php)
    php -S localhost:$PORT
    ;;
  python3)
    python3 -m http.server $PORT
    ;;
  python2)
    python -m SimpleHTTPServer $PORT
    ;;
esac