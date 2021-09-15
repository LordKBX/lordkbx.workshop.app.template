@echo off
set ip_address_string="Adresse IPv4"
set ipv=::1
for /f "usebackq tokens=2 delims=:" %%f in (`ipconfig ^| findstr /c:%ip_address_string%`) do (
    echo Your IP Address is: %%f
	set ipv="%%f"
	echo %ipv%
	pause
    goto :eof
)
pause