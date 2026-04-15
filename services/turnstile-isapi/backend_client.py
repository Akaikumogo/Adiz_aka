from typing import Optional

import httpx

BACKEND = "http://127.0.0.1:3000/api"
INTERNAL_KEY = "change-me-internal-key-for-python-services"


def post_event(
    device_ip: str,
    card_id: str,
    ts_iso: str,
    event_type: str,
    full_name: Optional[str] = None,
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
    fn = (full_name or "").strip()
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
                nm if isinstance(nm, str) else None,
            )
        except Exception as e:
            print(f"[POST ERROR] {device_ip}: {e}")
