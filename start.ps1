Write-Host "Arrancando Anime Hub..." -ForegroundColor Cyan

Set-Location "$PSScriptRoot"

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host "Servidor en http://localhost:4200" -ForegroundColor Green
npm start
