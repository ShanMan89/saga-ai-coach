@echo off
REM Development tools batch file for Windows
REM Usage: dev-tools.bat [command] [args]

set NODE_PATH="C:\Program Files\nodejs\node.exe"

if "%1"=="tsc" (
    %NODE_PATH% "node_modules\typescript\lib\tsc.js" %2 %3 %4 %5 %6 %7 %8 %9
) else if "%1"=="type-check" (
    %NODE_PATH% "node_modules\typescript\lib\tsc.js" --noEmit
) else if "%1"=="next" (
    %NODE_PATH% "node_modules\next\dist\bin\next" %2 %3 %4 %5 %6 %7 %8 %9
) else if "%1"=="dev" (
    %NODE_PATH% "node_modules\next\dist\bin\next" dev
) else if "%1"=="build" (
    %NODE_PATH% "node_modules\next\dist\bin\next" build
) else if "%1"=="start" (
    %NODE_PATH% "node_modules\next\dist\bin\next" start
) else if "%1"=="lint" (
    %NODE_PATH% "node_modules\next\dist\bin\next" lint
) else if "%1"=="eslint" (
    %NODE_PATH% "node_modules\eslint\bin\eslint.js" %2 %3 %4 %5 %6 %7 %8 %9
) else (
    echo Available commands:
    echo   dev-tools.bat tsc [args]        - Run TypeScript compiler
    echo   dev-tools.bat type-check        - Run TypeScript type checking
    echo   dev-tools.bat next [args]       - Run Next.js CLI
    echo   dev-tools.bat dev               - Start Next.js development server
    echo   dev-tools.bat build             - Build Next.js application
    echo   dev-tools.bat start             - Start Next.js production server
    echo   dev-tools.bat lint              - Run Next.js linting
    echo   dev-tools.bat eslint [args]     - Run ESLint directly
)