#!/usr/bin/env python3
"""
Launcher for 30 Years Underground.
Finds an available port starting from 8080, starts a local HTTP server,
and opens the game in your default browser.
"""

import sys
import os
import socket
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

START_PORT = 8080
MAX_PORT = 8100

def find_available_port(start_port=START_PORT, max_port=MAX_PORT):
    for port in range(start_port, max_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    raise RuntimeError(f"Could not find an open port in range {start_port}-{max_port}")

class CustomHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg',
        '.png': 'image/png'
    }

    def log_message(self, format, *args):
        # Keep terminal output clean
        pass

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = find_available_port()
    url = f"http://localhost:{port}/index.html"

    server = HTTPServer(('127.0.0.1', port), CustomHandler)
    print("=" * 65)
    print(" 🧟 30 YEARS UNDERGROUND — COLONY SIMULATION")
    print(f" 🌐 Сервер запущен на: {url}")
    print(" ⏹️  Для остановки сервера нажмите Ctrl+C")
    print("=" * 65)

    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен.")
        server.server_close()
        sys.exit(0)

if __name__ == '__main__':
    main()
