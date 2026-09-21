@echo off
setlocal

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
  echo Node.js 22.13 or newer is required. Install it from https://nodejs.org/
  exit /b 1
)

echo Installing CareSetu dependencies...
npx.cmd --yes pnpm@11.25.0 install
if errorlevel 1 (
  echo Dependency installation failed. Check your internet connection and try again.
  exit /b 1
)

echo Starting CareSetu at http://localhost:5173 ...
npx.cmd --yes pnpm@11.25.0 dev
