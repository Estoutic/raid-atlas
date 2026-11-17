#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
npm ci
cp node_modules/three/examples/jsm/libs/draco/draco_decoder.js node_modules/three/examples/jsm/libs/draco/draco_decoder.js.txt
./node_modules/.bin/esbuild factory-viewer.js --bundle --minify --format=iife --loader:.txt=text --outfile=../app/web/factory-viewer.js
python3 - <<'PYGEN'
from pathlib import Path
import base64,json
r=Path('..');entries=json.loads((r/'sources/tkl/manifest.json').read_text())
models={str(e['floor']):base64.b64encode((r/'sources/tkl'/e['file']).read_bytes()).decode() for e in entries}
(r/'app/web/factory-models.js').write_text('window.FACTORY_MODELS='+json.dumps(models)+';\n')
PYGEN
