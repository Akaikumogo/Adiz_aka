import time
import requests
import uuid
import ctypes
from ctypes import Structure, c_uint, sizeof, byref

# -----------------------------
# CONFIG
# -----------------------------
API_BASE = "http://127.0.0.1:3000/api"
INTERVAL_SEC = 60
IDLE_SEC = 300

MAC_ADDRESS = ":".join(f"{(uuid.getnode() >> i) & 0xff:02x}" for i in range(40, -1, -8))

print("MAC:", MAC_ADDRESS)


# -----------------------------
# WINDOWS IDLE DETECTION (REAL)
# -----------------------------
class LASTINPUTINFO(Structure):
    _fields_ = [("cbSize", c_uint), ("dwTime", c_uint)]


def get_idle_time():
    lii = LASTINPUTINFO()
    lii.cbSize = sizeof(LASTINPUTINFO)

    if ctypes.windll.user32.GetLastInputInfo(byref(lii)):
        millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
        return millis / 1000.0
    return 0


def get_status():
    idle = get_idle_time()
    return "idle" if idle > IDLE_SEC else "working"


# -----------------------------
# MAIN LOOP
# -----------------------------
def main():
    while True:
        now = time.time()
        status = get_status()

        payload = {
            "macAddress": MAC_ADDRESS,
            "events": [
                {
                    "timestamp": int(now * 1000),
                    "status": status,
                    "raw": {
                        "idle_sec": get_idle_time()
                    }
                }
            ]
        }

        try:
            r = requests.post(
                f"{API_BASE}/activity/batch",
                json=payload,
                timeout=10,
            )
            r.raise_for_status()
            print("[OK]", status)
        except Exception as e:
            print("[ERROR]", e)

        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()