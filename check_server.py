import urllib.request
try:
    r = urllib.request.urlopen('http://localhost:5050/health', timeout=3)
    print("SERVER OK:", r.read().decode())
except Exception as e:
    print("SERVER NOT REACHABLE:", e)
