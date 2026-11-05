@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ================================================
echo URBANGROW - Laboratorio 3D en Next.js
echo ================================================
where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js. Instala Node.js 20.9 o superior desde https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias la primera vez...
  call npm install
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias. Comprueba tu conexion a Internet.
    pause
    exit /b 1
  )
)
echo.
echo Abre http://localhost:3000 en tu navegador.
echo Pulsa Ctrl+C para detener el servidor.
call npm run dev
pause
