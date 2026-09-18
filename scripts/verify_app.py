import urllib.request
import sys

print('=== VERIFICATION APP & DEV SERVER ===')
try:
    with urllib.request.urlopen('http://localhost:5173/') as response:
        status = response.status
        html = response.read().decode('utf-8')
        has_title = '<title>' in html
        has_root = 'id="root"' in html
        has_vite = '@vite/client' in html
        has_main = 'main.tsx' in html
        print(f'Dev Server Status: {status} OK')
        print(f'HTML Length: {len(html)} bytes')
        print(f'Title in HTML: {has_title}')
        print(f'Root div in HTML: {has_root}')
        print(f'Vite client in HTML: {has_vite}')
        print(f'Main entry in HTML: {has_main}')
        if has_root and has_main:
            print('SUCCESS: Dev server is serving the application correctly!')
        else:
            print('WARNING: Index.html missing root or main.tsx')
except Exception as e:
    print(f'Error connecting to dev server: {e}', file=sys.stderr)
    sys.exit(1)
