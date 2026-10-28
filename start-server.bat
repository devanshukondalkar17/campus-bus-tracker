@echo off
title NUV Transit AI - Backend Server (Port 5000)
color 0A
cd /d "%~dp0server"
echo Starting Navrachana Transit AI Backend on Port 5000...
node server.js
pause
