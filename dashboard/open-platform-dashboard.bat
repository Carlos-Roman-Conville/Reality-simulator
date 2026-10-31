@echo off
title Platform dashboard
rem Build state.json (no tokens), keep rebuilding every 60 s, serve Toolchain/ on :8099, open the page.
python "%~dp0build.py"
start "Platform dashboard builder" /min python "%~dp0build.py" --watch
start "Platform dashboard server" /min python -m http.server 8099 --bind 127.0.0.1 --directory "%~dp0.."
start "" "http://127.0.0.1:8099/dashboard/index.html"
