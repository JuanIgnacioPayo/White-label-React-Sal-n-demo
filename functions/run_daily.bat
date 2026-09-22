@echo off
cd /d "%~dp0"
echo Running Guillermo Moreno Local Worker...
node local_worker.js
timeout /t 10
