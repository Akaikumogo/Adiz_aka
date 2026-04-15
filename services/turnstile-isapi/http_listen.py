import json
import os
import time
import uuid
from datetime import datetime

import httpx
import requests
from requests.auth import HTTPDigestAuth

DEVICES_IN = ["192.168.30.165", "192.168.30.167"]
DEVICES_OUT = ["192.168.30.168", "192.168.30.169"]
USER = "admin"
PASS = "R12345678z"
LOG_FILE = "raw_events.json"
PICS_DIR = "face_captures"
BACKEND = "http://127.0.0.1:3000/api"
INTERNAL_KEY = "change-me-internal-key-for-python-services"

last_seen_time = {}


def post_event(
    device_ip: str,
    card_id: str,
    ts_iso: str,
    event_type: str,
    full_name: str = "",
) -> None:
    headers = {}
    if INTERNAL_KEY:
        headers["Authorization"] = f"Bearer {INTERNAL_KEY}"
    body = {
        "deviceIp": device_ip,
        "cardId": card_id,
        "timestamp": ts_iso,
        "eventType": event_type,
    }
    fn = full_name.strip()
    if fn:
        body["fullName"] = fn
    res = httpx.post(
        f"{BACKEND}/internal/attendance/events",
        headers=headers,
        json=body,
        timeout=30.0,
    )
    print(f"[POST] {device_ip} -> {res.status_code}")
    res.raise_for_status()


def forward_events(device_ip: str, events: list, event_type: str) -> None:
    seen = set()
    for ev in events:
        minor = ev.get("minor")
        if minor not in (1, 75):
            continue
        raw = ev.get("cardNo") or ev.get("employeeNoString")
        if not raw:
            continue
        card = str(raw).strip()
        if not card:
            continue
        ts = ev.get("time")
        if not ts or len(str(ts)) < 4:
            continue
        sn = ev.get("serialNo")
        if sn is not None:
            k = (device_ip, sn)
            if k in seen:
                continue
            seen.add(k)
        try:
            nm = ev.get("name")
            post_event(
                device_ip,
                card,
                ts,
                event_type,
                nm if isinstance(nm, str) else "",
            )
        except Exception as e:
            print(f"[POST ERROR] {device_ip}: {e}")


def _pic_url(u: str) -> str:
    if "@WEB" in u:
        return u.split("@WEB", 1)[0]
    return u


def download_event_pictures(events_list: list, device_ip: str) -> None:
    auth = HTTPDigestAuth(USER, PASS)
    os.makedirs(PICS_DIR, exist_ok=True)
    for ev in events_list:
        url = ev.get("pictureURL")
        if not url or not isinstance(url, str):
            continue
        url = _pic_url(url.strip())
        sn = ev.get("serialNo", "")
        t = ev.get("time", "") or ""
        safe_ip = device_ip.replace(".", "_")
        name = f"{safe_ip}_{sn}_{t}".replace(":", "").replace("+", "")[:180]
        if not name.endswith(".jpg") and not name.endswith(".jpeg"):
            name += ".jpg"
        path = os.path.join(PICS_DIR, name)
        try:
            r = requests.get(url, auth=auth, timeout=45, stream=True)
            if r.status_code != 200:
                continue
            with open(path, "wb") as f:
                for chunk in r.iter_content(65536):
                    if chunk:
                        f.write(chunk)
        except Exception:
            pass


def check_device(ip: str, event_type: str) -> None:
    url = f"http://{ip}/ISAPI/AccessControl/AcsEvent?format=json"
    payload = {
        "AcsEventCond": {
            "searchID": str(uuid.uuid4()),
            "searchResultPosition": 0,
            "maxResults": 10,
            "major": 0,
            "minor": 0,
            "timeReverseOrder": True,
        }
    }

    try:
        response = requests.post(
            url,
            json=payload,
            auth=HTTPDigestAuth(USER, PASS),
            timeout=15,
        )

        if response.status_code == 200:
            data = response.json()
            events_list = data.get("AcsEvent", {}).get("InfoList", [])

            if events_list:
                newest_event = events_list[0]
                newest_time = newest_event.get("time")

                if last_seen_time.get(ip) == newest_time:
                    print(f"[IDLE] {ip}: O'zgarish yo'q.")
                    return

                last_seen_time[ip] = newest_time

                log_entry = {
                    "ip": ip,
                    "timestamp": datetime.now().isoformat(),
                    "events": events_list,
                }

                with open(LOG_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry) + ",\n")
                download_event_pictures(events_list, ip)
                forward_events(ip, events_list, event_type)
                
                print(f"[NEW] {ip}: {len(events_list)} ta yangi hodisa saqlandi.")
            else:
                print(f"[EMPTY] {ip}: Hodisalar ro'yxati bo'sh.")

        elif response.status_code == 401:
            print(f"[AUTH ERR] {ip}: Login yoki parol xato!")
        else:
            print(f"[ERR] {ip}: Status {response.status_code}")

    except requests.exceptions.Timeout:
        print(f"[TIMEOUT] {ip}: Qurilma juda kech javob beryapti (15s+).")
    except Exception as e:
        print(f"[ERR] {ip}: Xatolik yuz berdi: {e}")


if __name__ == "__main__":
    while True:
        for ip in DEVICES_IN:
            check_device(ip, "entry")
        for ip in DEVICES_OUT:
            check_device(ip, "exit")
        time.sleep(5)
