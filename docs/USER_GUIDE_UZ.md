# WorkPulse — foydalanuvchi qo‘llanmasi (o‘zbekcha)

## Tizimga kirish

1. Brauzerda admin panel manzilini oching (masalan `http://localhost:5173`).
2. **Email** va **parol** bilan kiring. Parol korxonaning xavfsiz kanali orqali beriladi.
3. **SuperAdmin** barcha bo‘limlarga, shu jumladan **Administratorlar** sahifasiga kirishi mumkin. **Admin** xodimlar, kompyuterlar va analitikaga kiradi.

## SuperAdmin: administrator yaratish

1. Chap menudan **Administratorlar** ni tanlang.
2. **Administrator qo‘shish** — email va kamida 8 belgili parol kiriting.
3. Administratorni **faol / nofaol** qilish uchun jadvaldagi kalitdan foydalaning.

Birinchi **SuperAdmin** faqat server `.env` dagi `SUPERADMIN_EMAIL` va `SUPERADMIN_PASSWORD` orqali yaratiladi; bu qiymatlar repozitoriyga yozilmaydi.

## Admin: asosiy modullar

- **Faollik** — kunlik yozuvlar, KPI kartalar, qidiruv.
- **Bo‘limlar** (`/bolimlar`) — bo‘lim CRUD.
- **Xonalar** (`/xonalar`) — xona CRUD.
- **Lavozimlar** (`/lavozimlar`) — lavozim katalogi CRUD (standart nomlar).
- **Kompyuterlar** (`/kompyuterlar`) — MAC, xodim/xonaga biriktirish, token (bir marta ko‘rinadi / yangilash).
- **Xodimlar** — ro‘yxat va o‘rtacha samaradorlik.
- **Analitika** — diagrammalar.

## Turniket IP lar

Standart: **kirish** `192.168.30.2`, `192.168.30.3`; **chiqish** `192.168.30.4`, `192.168.30.5`. `.env` da `TURNSTILE_IPS_IN` va `TURNSTILE_IPS_OUT` (vergul bilan) o‘zgartirish mumkin — server ishga tushganda jadvalga yoziladi.

Yangi karta bazada bo‘lmasa, xodim `Karta <id>` nomi bilan **bo‘limsiz** yaratiladi; keyin admin bo‘limga biriktiradi. **Analitika** faqat bo‘limi biriktirilgan xodimlarni hisoblaydi.

## Chekka xizmatlar

- **Turniket (Python)** — `POST /api/internal/turnstile/events` (`X-Internal-Key`). `entry`/`exit` maydoni yuboriladi, lekin backend **qurilma yo‘nalishi** bo‘yicha haqiqiy kirish/chiqishni qo‘yadi.
- **Windows agent** — `MACHINE_TOKEN` bilan faollik partiyalarini yuboradi.
- **NVR** — bo‘sh vaqt / tanaffusda video kesmalar — faqat ruxsat va siyosat asosida.

## Muammolar

- **401** — seans tugagan; qayta kiring.
- **API ulanmayapti** — backend ishlayotganini va (devda) Vite proksi `localhost:3000` ga yo‘naltirilganini tekshiring.
