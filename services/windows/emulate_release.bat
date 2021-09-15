REM @echo off
cd /D %~dp0\..\app
echo "release" > .\www\mode.txt
C:\Users\KevBo\AppData\Roaming\npm\cordova emulate android
pause