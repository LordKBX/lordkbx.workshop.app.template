@echo off
cd /D %~dp0\..\app
set ip_address_string="Adresse IPv4"
for /f "usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do (
    echo Your IP Address is: %%f
	echo debug:%%f
	echo debug:%%f > .\www\mode.txt
	START /B node "..\services\livews.js"
	C:\Users\KevBo\AppData\Roaming\npm\cordova prepare android && C:\Users\KevBo\AppData\Roaming\npm\cordova run android
	pause
    goto :eof
)