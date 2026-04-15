import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.resolve()))
from backend_client import forward_events

DEVICES_OUT = frozenset({"192.168.30.168", "192.168.30.169"})


def main():
    path = Path(__file__).parent / "raw_events.json"
    if not path.is_file():
        return
    text = path.read_text(encoding="utf-8")
    for line in text.splitlines():
        line = line.strip().rstrip(",")
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        ip = obj.get("ip")
        events = obj.get("events") or []
        if ip and events:
            et = "exit" if ip in DEVICES_OUT else "entry"
            forward_events(ip, events, et)


if __name__ == "__main__":
    main()
