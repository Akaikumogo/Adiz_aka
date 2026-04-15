# Windows agent

1. Ro‘yxatdan o‘tkazilgan kompyuter uchun backenddan `machineToken` oling.
2. Muhit: `MACHINE_TOKEN`, ixtiyoriy `API_BASE` (masalan `http://HOST:3000/api`).
3. `pip install -r requirements.txt`
4. `python agent.py`
5. Exe: `pip install pyinstaller` keyin `pyinstaller --onefile agent.py`
