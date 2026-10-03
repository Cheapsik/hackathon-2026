# The whole film in one go, with run-backend.ps1 and run-frontend.ps1 already running:
# record the scenes, make the voice, render captions and end card, cut the film.
# -SkipScenes reuses the last recordings (only text, voice or captions changed).
# -SkipVoice keeps the generated voice (e.g. only captions changed).
param([switch]$SkipScenes, [switch]$SkipVoice)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
  if (-not $SkipScenes) {
    node scenes.mjs
    if ($LASTEXITCODE) { throw 'scenes failed' }
  }
  if (-not $SkipVoice) {
    python voice.py
    if ($LASTEXITCODE) { throw 'voice failed' }
  }
  node render.mjs
  if ($LASTEXITCODE) { throw 'overlays failed' }
  python montage.py
  if ($LASTEXITCODE) { throw 'montage failed' }
} finally {
  Pop-Location
}
