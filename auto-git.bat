@echo off
cd /d "C:\Users\dinht\Documents\AGMCGIFT\AGMC"

:loop
git add .
git commit -m "Auto update %date% %time%"
git push origin main

timeout /t 300 >nul
goto loop