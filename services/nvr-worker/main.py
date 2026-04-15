import os
import time

import httpx

"""
Idle/break triggerida xona bo‘yicha video kesma olish — faqat ichki siyosat va qonuniy
cheklovlarga rioya qilganda ishlatiladi. JWT va NVR SDK/RTSP integratsiyasini qo‘shing.
"""

NEST = os.environ.get("NEST_URL", "http://127.0.0.1:3000").rstrip("/")
JWT = os.environ.get("ADMIN_JWT", "")


def register_clip(room_id: str, storage_url: str, started_at: str) -> None:
    if not JWT:
        return
    with httpx.Client(timeout=30.0) as c:
        c.post(
            f"{NEST}/api/nvr/clips",
            headers={"Authorization": f"Bearer {JWT}", "Content-Type": "application/json"},
            json={
                "roomId": room_id,
                "storageUrl": storage_url,
                "startedAt": started_at,
                "reason": "idle",
            },
        )


def main() -> None:
    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
