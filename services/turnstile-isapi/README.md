# Turniket → Nest (Hikvision HTTP Listen)

1. `pip install -r requirements.txt`
2. `.env` yoki muhit: `NEST_INTERNAL_URL`, `INTERNAL_API_KEY` (backend bilan bir xil).
3. `python http_listen.py` — standart `:8080`. Hikvision qurilmada **HTTP Notification** URL: `http://<server-ip>:8080/`
4. `CALLBACK_ALLOWED_IPS` — vergul bilan (default turniket IP lari).
5. Backend `entry`/`exit` ni qurilma IP bo‘yicha o‘zi qo‘yadi; `eventType` ixtiyoriy.
