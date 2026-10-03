# Film frontend: its own Vite on port 5174, talking to the film backend on 5257 (run-backend.ps1).
$repo = Resolve-Path "$PSScriptRoot\..\.."
$env:CASTOR_BACKEND_URL = 'http://localhost:5257'
npm --prefix "$repo\frontend" run dev -- --port 5174 --strictPort
