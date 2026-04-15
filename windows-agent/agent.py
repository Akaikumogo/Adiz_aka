import os
import time

import requests

try:
    from pynput import keyboard, mouse
except ImportError:
    mouse = keyboard = None

MACHINE_TOKEN = os.environ["MACHINE_TOKEN"]
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:3000/api").rstrip("/")
INTERVAL_SEC = int(os.environ.get("INTERVAL_SEC", "60"))
IDLE_SEC = int(os.environ.get("IDLE_SEC", "300"))

last = time.time()


def bump(*_a, **_k):
    global last
    last = time.time()


def main():
    if mouse and keyboard:
        mouse.Listener(on_move=bump, on_click=bump).start()
        keyboard.Listener(on_press=bump).start()
    while True:
        now = time.time()
        gap = now - last
        status = "idle" if gap > IDLE_SEC else "working"
        r = requests.post(
            f"{API_BASE}/activity/batch",
            headers={"Authorization": f"Bearer {MACHINE_TOKEN}"},
            json={
                "events": [
                    {"timestamp": int(now * 1000), "status": status},
                ]
            },
            timeout=60,
        )
        r.raise_for_status()
        time.sleep(INTERVAL_SEC)


if __name__ == "__main__":
    main()
