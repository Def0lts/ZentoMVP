from datetime import datetime, timedelta
from typing import List, Literal, Optional
import os
import json
import hmac
import hashlib
from urllib.parse import parse_qsl

import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import get_conn

BOT_TOKEN = os.getenv("BOT_TOKEN", "")

app = FastAPI(title="Zento API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://zento-mvp.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Mock data ---
SALONS = [
    {
        "id": 1,
        "name": "Beuty_salon",
        "address": "Костанай, Абая 10",
        "price_from": 3000,
        "rating": 4.8,
        "km": 1.2,
        "category": "hair",
    },
    {
        "id": 2,
        "name": "Svetlana",
        "address": "Костанай, Аль-Фараби 22",
        "price_from": 2500,
        "rating": 4.6,
        "km": 0.7,
        "category": "nails",
    },
]

MASTERS = [
    {
        "id": 101,
        "salon_id": 1,
        "name": "Мария",
        "role": "Парикмахер-универсал",
        "rating": 4.9,
        "reviews": 15,
        "telegram_id": 111111111,
    },
    {
        "id": 102,
        "salon_id": 1,
        "name": "Оксана",
        "role": "Парикмахер-универсал",
        "rating": 4.7,
        "reviews": 87,
        "telegram_id": 1346025315,
    },
    {
        "id": 103,
        "salon_id": 1,
        "name": "Елена",
        "role": "Парикмахер-универсал",
        "rating": 4.8,
        "reviews": 35,
        "telegram_id": 333333333,
    },
    {
        "id": 201,
        "salon_id": 2,
        "name": "Светлана",
        "role": "Мастер ногтей",
        "rating": 4.6,
        "reviews": 24,
        "telegram_id": 444444444,
    },
]


def generate_times(start="10:00", end="20:00", step_min=30):
    t0 = datetime.strptime(start, "%H:%M")
    t1 = datetime.strptime(end, "%H:%M")
    out = []
    cur = t0
    while cur <= t1:
        out.append(cur.strftime("%H:%M"))
        cur += timedelta(minutes=step_min)
    return out


# --- Models ---
class BookingCreate(BaseModel):
    telegram_id: int
    init_data: Optional[str] = None
    salon_id: int
    master_id: int
    master_name: str
    service_id: Optional[int] = None
    service_title: Optional[str] = None
    service_price: Optional[int] = None
    service_duration: Optional[int] = None
    day: str
    time: str
    customer_name: str
    customer_phone: str


class Booking(BaseModel):
    id: int
    telegram_id: int
    salon_id: int
    master_id: int
    master_name: str
    service_id: Optional[int] = None
    service_title: Optional[str] = None
    service_price: Optional[int] = None
    service_duration: Optional[int] = None
    day: str
    time: str
    customer_name: str
    customer_phone: str
    status: Literal["pending", "confirmed", "rejected", "arrived", "no_show", "cancelled"]


class BlockSlot(BaseModel):
    id: int
    master_id: int
    day: str
    time: str


class FavoriteCreate(BaseModel):
    telegram_id: int
    salon_id: int
    init_data: Optional[str] = None


class Service(BaseModel):
    id: int
    salon_id: int
    title: str
    price: int
    duration_min: int
    category: Optional[str] = None
    is_active: bool


class MasterActivateRequest(BaseModel):
    telegram_id: int
    init_data: Optional[str] = None
    code: str


def validate_telegram_init_data(init_data: str) -> dict | None:
    if not init_data or not BOT_TOKEN:
        return None

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(
        b"WebAppData",
        BOT_TOKEN.encode(),
        hashlib.sha256,
    ).digest()
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    if calculated_hash != received_hash:
        return None

    user_raw = parsed.get("user")
    if not user_raw:
        return None

    try:
        user = json.loads(user_raw)
        return user
    except Exception:
        return None


def get_master_from_list(master_id: int):
    for m in MASTERS:
        if m["id"] == master_id:
            return m
    return None


def get_master_by_id(master_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, salon_id, name, role, rating, reviews
            from masters
            where id = %s
            """,
            (master_id,),
        )
        row = cur.fetchone()
    return row


def get_salon_by_id(salon_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, name, address, price_from, rating, km, category
            from salons
            where id = %s
            """,
            (salon_id,),
        )
        row = cur.fetchone()
    return row

def get_service_by_id(service_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, salon_id, title, price, duration_min, category, is_active
            from services
            where id = %s
            """,
            (service_id,),
        )
        row = cur.fetchone()
    return row

def get_bound_master_telegram_id(master_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select telegram_id
            from master_access
            where master_id = %s
            """,
            (master_id,),
        )
        row = cur.fetchone()

    if not row:
        return None

    return row.get("telegram_id")


def build_master_response(master: dict, telegram_id: Optional[int]):
    return {
        "id": master["id"],
        "salon_id": master["salon_id"],
        "name": master["name"],
        "role": master["role"],
        "rating": master["rating"],
        "reviews": master["reviews"],
        "telegram_id": telegram_id,
        "is_activated": telegram_id is not None,
    }


def send_telegram_message(chat_id: int, text: str, reply_markup: dict | None = None):
    if not BOT_TOKEN:
        return None

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    try:
        r = requests.post(url, json=payload, timeout=10)
        return r.json()
    except Exception:
        return None


def answer_callback_query(callback_query_id: str, text: str = ""):
    if not BOT_TOKEN:
        return None

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/answerCallbackQuery"
    payload = {
        "callback_query_id": callback_query_id,
        "text": text,
    }

    try:
        r = requests.post(url, json=payload, timeout=10)
        return r.json()
    except Exception:
        return None


def edit_telegram_message(chat_id: int, message_id: int, text: str):
    if not BOT_TOKEN:
        return None

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/editMessageText"
    payload = {
        "chat_id": chat_id,
        "message_id": message_id,
        "text": text,
    }

    try:
        r = requests.post(url, json=payload, timeout=10)
        return r.json()
    except Exception:
        return None


# --- Validation helpers ---
def normalize_spaces(value: str) -> str:
    return " ".join((value or "").split())


def validate_day_string(day: str) -> str:
    value = (day or "").strip()
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
        return parsed.strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_day_format")


def validate_time_string(time_value: str) -> str:
    value = (time_value or "").strip()
    try:
        parsed = datetime.strptime(value, "%H:%M")
        return parsed.strftime("%H:%M")
    except ValueError:
        raise HTTPException(status_code=422, detail="invalid_time_format")


def validate_customer_name(name: str) -> str:
    value = normalize_spaces(name)

    if len(value) < 2 or len(value) > 40:
        raise HTTPException(status_code=422, detail="invalid_customer_name")

    has_letter = any(ch.isalpha() for ch in value)
    if not has_letter:
        raise HTTPException(status_code=422, detail="invalid_customer_name")

    return value


def validate_customer_phone(phone: str) -> str:
    value = (phone or "").strip()
    digits = "".join(ch for ch in value if ch.isdigit())

    if len(value) > 20 or len(digits) < 7:
        raise HTTPException(status_code=422, detail="invalid_customer_phone")

    allowed = set("0123456789+()- ")
    if any(ch not in allowed for ch in value):
        raise HTTPException(status_code=422, detail="invalid_customer_phone")

    return value


def lock_slot(cur, master_id: int, day: str, time_value: str):
    lock_key = f"slot:{master_id}:{day}:{time_value}"
    cur.execute("select pg_advisory_xact_lock(hashtext(%s))", (lock_key,))


def ensure_salon_and_master(salon_id: int, master_id: int):
    salon = get_salon_by_id(salon_id)
    if not salon:
        raise HTTPException(status_code=404, detail="salon_not_found")

    master = get_master_by_id(master_id)
    if not master:
        raise HTTPException(status_code=404, detail="master_not_found")

    if master["salon_id"] != salon_id:
        raise HTTPException(status_code=409, detail="master_not_in_salon")

    return salon, master


def slot_has_active_booking(cur, master_id: int, day: str, time_value: str) -> bool:
    cur.execute(
        """
        select 1
        from bookings
        where master_id = %s
          and day = %s
          and time = %s
          and status not in ('rejected', 'cancelled')
        limit 1
        """,
        (master_id, day, time_value),
    )
    return cur.fetchone() is not None


def slot_is_blocked(cur, master_id: int, day: str, time_value: str) -> bool:
    cur.execute(
        """
        select 1
        from blocked_slots
        where master_id = %s
          and day = %s
          and time = %s
        limit 1
        """,
        (master_id, day, time_value),
    )
    return cur.fetchone() is not None


# --- Health ---
@app.get("/")
def root():
    return {"message": "Zento API works"}


# --- Salons / masters ---
@app.get("/salons")
def get_salons():
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, name, address, price_from, rating, km, category
            from salons
            order by id
            """
        )
        rows = cur.fetchall()
    return rows


@app.get("/salons/{salon_id}")
def get_salon(salon_id: int):
    salon = get_salon_by_id(salon_id)
    if not salon:
        return {"error": "not_found"}
    return salon


@app.get("/salons/{salon_id}/masters")
def get_salon_masters(salon_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, salon_id, name, role, rating, reviews
            from masters
            where salon_id = %s
            order by id
            """,
            (salon_id,),
        )
        rows = cur.fetchall()
    return rows

@app.get("/salons/{salon_id}/services", response_model=List[Service])
def get_salon_services(salon_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, salon_id, title, price, duration_min, category, is_active
            from services
            where salon_id = %s and is_active = true
            order by id
            """,
            (salon_id,),
        )
        rows = cur.fetchall()
    return rows


@app.get("/masters/{master_id}/services", response_model=List[Service])
def get_master_services(master_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select s.id, s.salon_id, s.title, s.price, s.duration_min, s.category, s.is_active
            from master_services ms
            join services s on s.id = ms.service_id
            where ms.master_id = %s
              and s.is_active = true
            order by s.id
            """,
            (master_id,),
        )
        rows = cur.fetchall()
    return rows


@app.get("/master/by-telegram/{telegram_id}")
def get_master_by_telegram(telegram_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select master_id, telegram_id
            from master_access
            where telegram_id = %s
            """,
            (telegram_id,),
        )
        row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="master_not_found")

    master = get_master_from_list(row["master_id"])
    if not master:
        raise HTTPException(status_code=404, detail="master_not_found")

    return build_master_response(master, row["telegram_id"])


@app.post("/master/activate")
def activate_master(payload: MasterActivateRequest):
    if payload.init_data:
        user = validate_telegram_init_data(payload.init_data)
        if not user:
            raise HTTPException(status_code=403, detail="invalid_telegram_init_data")

        user_id = user.get("id")
        if user_id != payload.telegram_id:
            raise HTTPException(status_code=403, detail="telegram_id_mismatch")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select master_id, telegram_id
            from master_access
            where activation_code = %s
            """,
            (payload.code.strip(),),
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="invalid_activation_code")

        if row["telegram_id"] is not None and row["telegram_id"] != payload.telegram_id:
            raise HTTPException(status_code=409, detail="master_already_activated")

        cur.execute(
            """
            select master_id
            from master_access
            where telegram_id = %s and master_id != %s
            """,
            (payload.telegram_id, row["master_id"]),
        )
        exists_other = cur.fetchone()
        if exists_other:
            raise HTTPException(
                status_code=409,
                detail="telegram_already_bound_to_other_master",
            )

        cur.execute(
            """
            update master_access
            set telegram_id = %s,
                activated_at = now()
            where master_id = %s
            returning master_id, telegram_id
            """,
            (payload.telegram_id, row["master_id"]),
        )
        updated = cur.fetchone()
        conn.commit()

    master = get_master_from_list(updated["master_id"])
    if not master:
        raise HTTPException(status_code=404, detail="master_not_found")

    return build_master_response(master, updated["telegram_id"])


# --- Slots ---
@app.get("/slots/free")
def free_slots(master_id: int, day: str, service_id: int | None = None):
    validated_day = validate_day_string(day)
    all_times = generate_times("10:00", "20:00", 30)

    duration = 30
    if service_id:
        service = get_service_by_id(service_id)
        if service:
            duration = service["duration_min"] or 30

    slots_needed = max(1, duration // 30)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select time, service_duration
            from bookings
            where master_id = %s
              and day = %s
              and status not in ('rejected', 'cancelled')
            """,
            (master_id, validated_day),
        )
        booking_rows = cur.fetchall()

        cur.execute(
            """
            select time
            from blocked_slots
            where master_id = %s
              and day = %s
            """,
            (master_id, validated_day),
        )
        blocked_times = {row["time"] for row in cur.fetchall()}

    booked_times = set()

    for row in booking_rows:
        start_time = row["time"]
        booking_duration = row["service_duration"] or 30
        booking_slots_needed = max(1, booking_duration // 30)

        if start_time not in all_times:
            continue

        start_index = all_times.index(start_time)

        for i in range(booking_slots_needed):
            idx = start_index + i
            if idx < len(all_times):
                booked_times.add(all_times[idx])

    busy = booked_times | blocked_times

    free = []
    for i in range(len(all_times)):
        window = all_times[i:i + slots_needed]

        if len(window) < slots_needed:
            continue

        ok = True
        for t in window:
            if t in busy:
                ok = False
                break

        if ok:
            free.append(all_times[i])

    return {
        "master_id": master_id,
        "day": validated_day,
        "service_id": service_id,
        "duration_min": duration,
        "slots_needed": slots_needed,
        "free": free,
        "busy": sorted(list(busy)),
    }

@app.post("/slots/block", response_model=BlockSlot)
def block_slot(master_id: int, day: str, time: str):
    validated_day = validate_day_string(day)
    validated_time = validate_time_string(time)

    master = get_master_by_id(master_id)
    if not master:
        raise HTTPException(status_code=404, detail="master_not_found")

    with get_conn() as conn, conn.cursor() as cur:
        lock_slot(cur, master_id, validated_day, validated_time)

        if slot_has_active_booking(cur, master_id, validated_day, validated_time):
            raise HTTPException(status_code=409, detail="slot_already_booked")

        if slot_is_blocked(cur, master_id, validated_day, validated_time):
            raise HTTPException(status_code=409, detail="slot_already_blocked")

        cur.execute(
            """
            insert into blocked_slots (master_id, day, time)
            values (%s, %s, %s)
            returning id, master_id, day, time
            """,
            (master_id, validated_day, validated_time),
        )
        row = cur.fetchone()
        conn.commit()

    return row


@app.get("/slots/blocked", response_model=List[BlockSlot])
def get_blocked(master_id: int, day: Optional[str] = None):
    validated_day = validate_day_string(day) if day else None

    with get_conn() as conn, conn.cursor() as cur:
        if validated_day:
            cur.execute(
                """
                select id, master_id, day, time
                from blocked_slots
                where master_id = %s and day = %s
                order by time
                """,
                (master_id, validated_day),
            )
        else:
            cur.execute(
                """
                select id, master_id, day, time
                from blocked_slots
                where master_id = %s
                order by day, time
                """,
                (master_id,),
            )
        items = cur.fetchall()
    return items


@app.post("/slots/unblock")
def unblock_slot(master_id: int, day: str, time: str):
    validated_day = validate_day_string(day)
    validated_time = validate_time_string(time)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            delete from blocked_slots
            where master_id = %s and day = %s and time = %s
            """,
            (master_id, validated_day, validated_time),
        )
        removed = cur.rowcount
        conn.commit()
    return {"ok": True, "removed": removed}


# --- Bookings ---
@app.post("/bookings", response_model=Booking)
def create_booking(payload: BookingCreate):
    if payload.init_data:
        user = validate_telegram_init_data(payload.init_data)
        if not user:
            raise HTTPException(status_code=403, detail="invalid_telegram_init_data")

        user_id = user.get("id")
        if user_id != payload.telegram_id:
            raise HTTPException(status_code=403, detail="telegram_id_mismatch")

    validated_day = validate_day_string(payload.day)
    validated_time = validate_time_string(payload.time)
    validated_name = validate_customer_name(payload.customer_name)
    validated_phone = validate_customer_phone(payload.customer_phone)

    _, master = ensure_salon_and_master(payload.salon_id, payload.master_id)
    real_master_name = master["name"]

    service_row = None
    service_id = None
    service_title = None
    service_price = None
    service_duration = None

    if payload.service_id:
        service_row = get_service_by_id(payload.service_id)

        if not service_row:
            raise HTTPException(status_code=404, detail="service_not_found")

        if service_row["salon_id"] != payload.salon_id:
            raise HTTPException(status_code=409, detail="service_not_in_salon")

        service_id = service_row["id"]
        service_title = service_row["title"]
        service_price = service_row["price"]
        service_duration = service_row["duration_min"]

    with get_conn() as conn, conn.cursor() as cur:
        lock_slot(cur, payload.master_id, validated_day, validated_time)

        if slot_is_blocked(cur, payload.master_id, validated_day, validated_time):
            raise HTTPException(status_code=409, detail="slot_blocked")

        if slot_has_active_booking(cur, payload.master_id, validated_day, validated_time):
            raise HTTPException(status_code=409, detail="slot_already_booked")

        cur.execute(
            """
            insert into bookings (
              telegram_id, salon_id, master_id, master_name,
              service_id, service_title, service_price, service_duration,
              day, time, customer_name, customer_phone, status
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            returning id, telegram_id, salon_id, master_id, master_name,
                      service_id, service_title, service_price, service_duration,
                      day, time, customer_name, customer_phone, status
            """,
            (
                payload.telegram_id,
                payload.salon_id,
                payload.master_id,
                real_master_name,
                service_id,
                service_title,
                service_price,
                service_duration,
                validated_day,
                validated_time,
                validated_name,
                validated_phone,
            ),
        )
        row = cur.fetchone()
        conn.commit()

    master_telegram_id = get_bound_master_telegram_id(payload.master_id)
    if master_telegram_id:
        text = (
            f"🔔 Новая запись\n\n"
            f"Клиент: {validated_name}\n"
            f"Телефон: {validated_phone}\n\n"
            f"Услуга: {service_title or 'Не указана'}\n"
            f"Дата: {validated_day}\n"
            f"Время: {validated_time}\n"
            f"Мастер: {real_master_name}"
        )

        reply_markup = {
            "inline_keyboard": [
                [
                    {
                        "text": "✅ Подтвердить",
                        "callback_data": f"booking:confirm:{row['id']}",
                    },
                    {
                        "text": "❌ Отклонить",
                        "callback_data": f"booking:reject:{row['id']}",
                    },
                ]
            ]
        }

        send_telegram_message(master_telegram_id, text, reply_markup)

    return row


@app.get("/bookings/by-master/{master_id}", response_model=List[Booking])
def bookings_by_master(master_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, telegram_id, salon_id, master_id, master_name,
                service_id, service_title, service_price, service_duration,
                day, time, customer_name, customer_phone, status
            from bookings
            where master_id = %s
            order by id desc
            """,
            (master_id,),
        )
        rows = cur.fetchall()
    return rows


@app.get("/bookings/by-telegram/{telegram_id}", response_model=List[Booking])
def bookings_by_user(telegram_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, telegram_id, salon_id, master_id, master_name,
                service_id, service_title, service_price, service_duration,
                day, time, customer_name, customer_phone, status
            from bookings
            where telegram_id = %s
            order by id desc
            """,
            (telegram_id,),
        )

        rows = cur.fetchall()
    return rows


@app.patch("/bookings/{booking_id}/status", response_model=Booking)
def update_booking_status(
    booking_id: int,
    status: Literal["confirmed", "rejected", "arrived", "no_show", "cancelled"],
    telegram_id: int,
):

    with get_conn() as conn, conn.cursor() as cur:

        cur.execute(
            """
            select telegram_id, master_id
            from bookings
            where id = %s
            """,
            (booking_id,),
        )
        booking = cur.fetchone()

        if not booking:
            raise HTTPException(status_code=404, detail="booking_not_found")

        booking_owner = booking["telegram_id"]
        master_id = booking["master_id"]

        # клиент может только отменять свою запись
        if status == "cancelled":
            if telegram_id != booking_owner:
                raise HTTPException(status_code=403, detail="not_booking_owner")

        else:
            # остальные статусы только мастер
            cur.execute(
                """
                select telegram_id
                from master_access
                where master_id = %s
                """,
                (master_id,),
            )
            row = cur.fetchone()

            if not row or row["telegram_id"] != telegram_id:
                raise HTTPException(status_code=403, detail="not_master")

        cur.execute(
            """
            update bookings
            set status = %s
            where id = %s
            returning id, telegram_id, salon_id, master_id, master_name,
                    service_id, service_title, service_price, service_duration,
                    day, time, customer_name, customer_phone, status

            """,
            (status, booking_id),
        )

        row = cur.fetchone()
        conn.commit()

    return row


# --- Favorites ---
@app.get("/favorites/{telegram_id}")
def get_favorites(telegram_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select salon_id
            from favorites
            where telegram_id = %s
            order by id desc
            """,
            (telegram_id,),
        )
        rows = cur.fetchall()
    return rows


@app.post("/favorites/add")
def add_favorite(payload: FavoriteCreate):
    if payload.init_data:
        user = validate_telegram_init_data(payload.init_data)
        if not user:
            raise HTTPException(status_code=403, detail="invalid_telegram_init_data")

        user_id = user.get("id")
        if user_id != payload.telegram_id:
            raise HTTPException(status_code=403, detail="telegram_id_mismatch")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into favorites (telegram_id, salon_id)
            values (%s, %s)
            on conflict (telegram_id, salon_id) do nothing
            returning id, telegram_id, salon_id
            """,
            (payload.telegram_id, payload.salon_id),
        )
        row = cur.fetchone()
        conn.commit()


    return {"ok": True, "added": bool(row)}


@app.post("/favorites/remove")
def remove_favorite(payload: FavoriteCreate):
    if payload.init_data:
        user = validate_telegram_init_data(payload.init_data)
        if not user:
            raise HTTPException(status_code=403, detail="invalid_telegram_init_data")

        user_id = user.get("id")
        if user_id != payload.telegram_id:
            raise HTTPException(status_code=403, detail="telegram_id_mismatch")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            delete from favorites
            where telegram_id = %s and salon_id = %s
            """,
            (payload.telegram_id, payload.salon_id),
        )
        removed = cur.rowcount
        conn.commit()

    return {"ok": True, "removed": removed}


@app.post("/telegram/webhook")
async def telegram_webhook(update: dict):
    callback = update.get("callback_query")
    if not callback:
        return {"ok": True}

    callback_id = callback.get("id")
    data = callback.get("data", "")
    message = callback.get("message", {})
    chat = message.get("chat", {})
    chat_id = chat.get("id")
    message_id = message.get("message_id")

    parts = data.split(":")
    if len(parts) != 3 or parts[0] != "booking":
        answer_callback_query(callback_id, "Неизвестное действие")
        return {"ok": True}

    action = parts[1]
    booking_id = int(parts[2])

    if action == "confirm":
        new_status = "confirmed"
        result_text = "✅ Запись подтверждена"
        callback_text = "Запись подтверждена"
    elif action == "reject":
        new_status = "rejected"
        result_text = "❌ Запись отклонена"
        callback_text = "Запись отклонена"
    else:
        answer_callback_query(callback_id, "Неизвестное действие")
        return {"ok": True}

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            update bookings
            set status = %s
            where id = %s
            returning id, customer_name, customer_phone, day, time, master_name, telegram_id
            """,
            (new_status, booking_id),
        )
        row = cur.fetchone()
        conn.commit()

        # уведомление клиенту
        client_telegram_id = row["telegram_id"]

        if client_telegram_id:
            if new_status == "confirmed":
                text = (
                    "✅ Ваша запись подтверждена!\n\n"
                    f"Мастер: {row['master_name']}\n"
                    f"Дата: {row['day']}\n"
                    f"Время: {row['time']}\n\n"
                    "Ждём вас в салоне!"
                )
            else:
                text = (
                    "❌ Ваша запись была отклонена.\n\n"
                    f"Мастер: {row['master_name']}\n"
                    f"Дата: {row['day']}\n"
                    f"Время: {row['time']}\n\n"
                    "Попробуйте выбрать другое время."
                )

            send_telegram_message(client_telegram_id, text)

    if not row:
        answer_callback_query(callback_id, "Запись не найдена")
        return {"ok": True}

    answer_callback_query(callback_id, callback_text)

    if chat_id and message_id:
        new_text = (
            f"{result_text}\n\n"
            f"Клиент: {row['customer_name']}\n"
            f"Телефон: {row['customer_phone']}\n\n"
            f"Дата: {row['day']}\n"
            f"Время: {row['time']}\n"
            f"Мастер: {row['master_name']}"
        )
        edit_telegram_message(chat_id, message_id, new_text)

    return {"ok": True}