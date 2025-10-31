@echo off
echo Starting TCP Congestion Control Simulation...
echo.
echo Server will start at http://localhost:5000
echo Frontend will be available at file:///c:/Users/Administrator/Desktop/CN2/index.html
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "c:\Users\Administrator\Desktop\CN2"
start "" "http://localhost:5000"
start "" "file:///c:/Users/Administrator/Desktop/CN2/index.html"
python server.py

pause