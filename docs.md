# WorkPulse — loyiha yo‘riqnomasi

## 1. Umumiy oqim

1. **Xodim** — karta bilan turniket; ish joyida kompyuter (Windows agent orqali holat yuboriladi).
2. **Backend** — hodisalarni qabul qiladi, PostgreSQLga yozadi, ixtiyoriy kamera suratini diskda saqlaydi.
3. **Admin** — brauzerdagi panel orqali hisobot va spravochniklarni ko‘radi va boshqaradi.

**Eslatma:** xodim odatda panelga **kirmaydi**; monitoring **admin** o‘tkazadi.

---

## 2. Qaysi faylda nima (qisqa xarita)

### Backend (`Backend/src/`)

| Bo‘lim | Yo‘l | Vazifa |
|--------|------|--------|
| Kirish | `main.ts` | Ilova, `/api` prefiks, CORS, validatsiya |
| Modullar | `app.module.ts` | Barcha modullar, TypeORM |
| Sog‘liq | `app.controller.ts` | `GET /api/health` |
| Login | `auth/auth.controller.ts`, `auth.service.ts` | JWT chiqarish |
| Xodimlar, bo‘limlar, … | `employees/`, `departments/`, `rooms/`, `positions/`, `computers/` | CRUD API |
| Agent qabul | `activity/activity.controller.ts` | `POST /api/activity/batch` |
| Turniket | `turnstile/` | Qurilmalar, `access_events`, ichki ingest |
| Kamera | `camera/camera.service.ts` | Surat yuklab saqlash |
| Fayl | `files/files.controller.ts` | `GET /api/files/snapshots/:name` |
| Analitika | `analytics/` | Hisobotlar, kunlik xodim hisoboti |
| Real vaqt (panel) | `realtime/` | WebSocket — **faqat brauzer** tomoni |
| Entitylar | `database/entities/` | Jadval modellari |

### Frontend (`ADMINPANEL/src/`)

| Bo‘lim | Yo‘l | Vazifa |
|--------|------|--------|
| Marshrut | `router.tsx` | Sahifalar (`/` … `/yoqlama` …) |
| API | `lib/api.ts` | `apiFetch`, JWT |
| Sana ko‘rinishi | `lib/dateDisplay.ts` | `DD.MM.YYYY` (DatePicker xatosiz) |
| Qobiq | `components/layout/AppShellLayout.tsx` | Menyu, kontent |
| Sahifalar | `pages/*.tsx` | Dashboard, **yo‘qlama**, xodimlar (CRUD + bulk), kompyuter (batafsil + kun), analitika, CRUD |

### Agent (`windows-agent/`)

| Fayl | Vazifa |
|------|--------|
| `agent.py` | Intervalli `POST /api/activity/batch` — batareya/server yuki bilan sozlanadi |

---

## 3. Ma’lumot transferi turlari (Data transfer / API shakllari)

Quyidagi **JSON** shakllar asosiy oqimlar uchun ishlatiladi (Content-Type: `application/json`, bundan mustasno aytilgan joylar).

### 3.1 Admin login — javob

**`POST /api/auth/login`**

Request:

```json
{
  "email": "admin@example.com",
  "password": "string"
}
```

Response (muvaffaqiyat):

```json
{
  "access_token": "string (JWT)",
  "user": {
    "id": "uuid",
    "email": "string",
    "role": "admin | superadmin"
  }
}
```

**`GET /api/auth/me`** (header: `Authorization: Bearer <access_token>`)

```json
{
  "id": "uuid",
  "email": "string",
  "role": "string"
}
```

---

### 3.2 Windows agent — faollik partiyasi

**`POST /api/activity/batch`**

Header: `Authorization: Bearer <MACHINE_TOKEN>`  
(`MACHINE_TOKEN` — kompyuter uchun backendda chiqarilgan mashina tokeni.)

Request:

```json
{
  "events": [
    {
      "timestamp": 1730000000000,
      "status": "working | idle | break",
      "raw": {}
    }
  ]
}
```

- **`timestamp`**: millisekund (number), odatda `Date.now()` ga yaqin.
- **`status`**: `working` | `idle` | `break` ([`ActivityStatus`](Backend/src/common/enums/activity-status.enum.ts)).
- **`raw`**: ixtiyoriy, qo‘shimcha JSON.

Response (qisqa):

```json
{
  "accepted": 1
}
```

---

### 3.3 Turniket / ichki attendance ingest

**`POST /api/internal/attendance/events`** (yoki mirroring: `POST /api/internal/turnstile/events` — xuddi shu `IngestDto`)

Header (production majburiy):

- `X-Internal-Key: <INTERNAL_API_KEY>` **yoki** `Authorization: Bearer <INTERNAL_API_KEY>`

Request:

```json
{
  "deviceIp": "192.168.x.x",
  "cardId": "string",
  "timestamp": "2025-01-15T08:00:00.000Z yoki mos qator",
  "eventType": "entry | exit",
  "fullName": "string (ixtiyoriy, yangi kartada ism)"
}
```

- **`eventType`**: ixtiyoriy; bo‘lmasa qurilma yo‘nalishi (seed) bo‘yicha aniqlanadi.

Response: access event obyekti (id, `employeeId`, `timestamp`, `eventType`, …).

---

### 3.4 Frontend — analitika / xodim kunlik (TypeScript tiplar)

[`ADMINPANEL/src/types/analytics.ts`](ADMINPANEL/src/types/analytics.ts) dagi ma’lumotlar backend analytics bilan mos keladi.

**`GET /api/analytics/employees/:employeeId/day?date=YYYY-MM-DD`**

Response (mantiqiy shakl):

```json
{
  "employeeId": "uuid",
  "fullName": "string",
  "date": "YYYY-MM-DD",
  "entries": [{ "id": "uuid", "at": "ISO8601", "snapshotUrl": "/api/files/snapshots/....jpg | null" }],
  "exits": [{ "id": "uuid", "at": "ISO8601", "snapshotUrl": "string | null" }],
  "officeDurationSeconds": 0,
  "pc": {
    "activeSeconds": 0,
    "idleSeconds": 0,
    "breakSeconds": 0
  },
  "breaks": [
    { "start": "ISO8601", "end": "ISO8601", "kind": "break | idle" }
  ]
}
```

**`GET /api/analytics/employees/activity-summary`**

```json
[
  {
    "employeeId": "uuid",
    "recordsCount": 0,
    "lastActivityAt": "ISO8601 | null"
  }
]
```

**`GET /api/analytics/access-turnstile?from=YYYY-MM-DD&to=YYYY-MM-DD`**

```json
{
  "entryCount": 0,
  "exitCount": 0,
  "byEmployee": [
    {
      "employeeId": "uuid",
      "fullName": "string",
      "entries": 0,
      "exits": 0
    }
  ]
}
```

---

## 4. Agent (`agent.py`) va “real-time”

### Hozirgi mexanizm

- Agent **doimiy siklda** ishlaydi: har bir aylanishda joriy holat (`working` yoki `idle`) hisoblanadi va **`POST /api/activity/batch`** orqali **bir martalik** yuboriladi.
- Keyingi yuborishdan oldin **`INTERVAL_SEC`** kutadi (standart **60** soniya — muhit o‘zgaruvchisi).
- Sichqoncha/klaviatura harakati `last` vaqtni yangilaydi; **`IDLE_SEC`** oshib ketsa holat `idle` bo‘ladi.

Bu arxitektura **HTTP orqali davriy yuborish**dir — server tomonda har bir hodisa **alohida yozuv** sifatida saqlanadi. Bu **mil soniyada** WebSocket kabi “true streaming real-time” emas; lekin **`INTERVAL_SEC`** ni kamaytirish** (masalan, 5–15) orqali panel va hisobotlarga yanada tez-tez tushadigan ma’lumot olish mumkin (server va tarmoq yukini hisobga oling).

### Paneldagi “real-time”

- **Admin brauzer** uchun: `realtime` moduli (WebSocket) dashboardni yangilashi mumkin — bu **agent bilan to‘g‘ridan-to‘g‘ri ulanish emas**, balki server ichidagi hodisalar.
- **Agent** hozircha WebSocket client emas — faqat REST `batch`.

### Qisqa xulosa

| Savol | Javob |
|-------|--------|
| Agent “real-time” ishlaydimi? | **Davriy (interval)** rejimda ishlaydi; interval **tez** bo‘lsa monitoring uchun deyarli real-timega yaqin. |
| Haqiqiy uzluksiz real-time (WS) agentda bormi? | **Yo‘q**; keyingi bosqichda alohida loyiha sifatida qo‘shish mumkin. |
| Nima qilish mumkin hozir? | `.env` / muhitda `INTERVAL_SEC` ni kamaytirish; `IDLE_SEC` ni ish jarayoniga moslash. |

**Muhit o‘zgaruvchilari (`agent.py`):**

| O‘zgaruvchi | Standart | Ma’nosi |
|-------------|---------|---------|
| `MACHINE_TOKEN` | majburiy | Backenddagi kompyuter tokeni |
| `API_BASE` | `http://127.0.0.1:3000/api` | API ildizi |
| `INTERVAL_SEC` | `60` | Har necha sekundda bir yuborish |
| `IDLE_SEC` | `300` | Qancha sekund harakatsizlikdan keyin `idle` |

---

## 5. Qisqa xavfsizlik eslatmalari

- Admin: **JWT** (`Bearer`).
- Agent: **mashina tokeni** (`Bearer`).
- Ichki xizmatlar: **`INTERNAL_API_KEY`** — productionda bo‘sh qoldirish mumkin emas (guard 401).

---

*Hujjat loyiha kodiga asoslangan; API kengayganda ushbu bo‘limni yangilang.*
