import os
import time

import httpx

NEST = os.environ["NEST_INTERNAL_URL"].rstrip("/")
KEY = os.environ["INTERNAL_API_KEY"]

# IP lar backend .env da TURNSTILE_IPS_IN / TURNSTILE_IPS_OUT bilan mos (kirish 30.2–30.3, chiqish 30.4–30.5).
# Backend qurilma yo‘nalishidan entry/exit ni o‘zi qo‘yadi — eventType e’tiborsiz.


def post_event(device_ip: str, card_id: str, ts_iso: str, event_type: str) -> None:
    with httpx.Client(timeout=30.0) as c:
        r = c.post(
            f"{NEST}/api/internal/turnstile/events",
            headers={"X-Internal-Key": KEY, "Content-Type": "application/json"},
            json={
                "deviceIp": device_ip,
                "cardId": card_id,
                "timestamp": ts_iso,
                "eventType": event_type,
            },
        )
        r.raise_for_status()


def main() -> None:
    """
    Hikvision ISAPI hodisalarini bu yerga ulang (HTTP Listen / Digest auth / event stream).
    Namuna: qurilma callbacklari `post_event` chaqiradi.
    """
    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
