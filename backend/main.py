from datetime import datetime, timedelta
from typing import List, Literal, Optional
import os
import json
import hmac
import hashlib
from urllib.parse import parse_qsl


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
    {"id": 1, "name": "Beuty_salon", "address": "Костанай, Абая 10", "price_from": 3000, "rating": 4.8, "km": 1.2, "category": "hair"},
    {"id": 2, "name": "Svetlana", "address": "Костанай, Аль-Фараби 22", "price_from": 2500, "rating": 4.6, "km": 0.7, "category": "nails"},
]

MASTERS = [
    {"id": 101, "salon_id": 1, "name": "Мария", "role": "Парикмахер-универсал", "rating": 4.9, "reviews": 15},
    {"id": 102, "salon_id": 1, "name": "Оксана", "role": "Парикмахер-универсал", "rating": 4.7, "reviews": 87},
    {"id": 103, "salon_id": 1, "name": "Елена", "role": "Парикмахер-универсал", "rating": 4.8, "reviews": 35},
    {"id": 201, "salon_id": 2, "name": "Светлана", "role": "Мастер ногтей", "rating": 4.6, "reviews": 24},
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

def validate_telegram_init_data(init_data: str) -> dict | None:
    if not init_data or not BOT_TOKEN:
        return None

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

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

# --- Health ---
@app.get("/")
def root():
    return {"message": "Zento API works"}

# --- Salons / masters ---
@app.get("/salons")
def get_salons():
    return SALONS

@app.get("/salons/{salon_id}")
def get_salon(salon_id: int):
    for s in SALONS:
        if s["id"] == salon_id:
            return s
    return {"error": "not_found"}

@app.get("/salons/{salon_id}/masters")
def get_salon_masters(salon_id: int):
    return [m for m in MASTERS if m["salon_id"] == salon_id]

# --- Slots ---
@app.get("/slots/free")
def free_slots(master_id: int, day: str):
    all_times = generate_times("10:00", "20:00", 30)

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select time
            from bookings
            where master_id = %s and day = %s and status != 'rejected'
            """,
            (master_id, day),
        )
        booked_times = {row["time"] for row in cur.fetchall()}

        cur.execute(
            """
            select time
            from blocked_slots
            where master_id = %s and day = %s
            """,
            (master_id, day),
        )
        blocked_times = {row["time"] for row in cur.fetchall()}

    busy = booked_times | blocked_times
    free = [t for t in all_times if t not in busy]
    return {"master_id": master_id, "day": day, "free": free, "busy": sorted(list(busy))}

@app.post("/slots/block", response_model=BlockSlot)
def block_slot(master_id: int, day: str, time: str):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            insert into blocked_slots (master_id, day, time)
            values (%s, %s, %s)
            returning id, master_id, day, time
            """,
            (master_id, day, time),
        )
        row = cur.fetchone()
        conn.commit()
    return row

@app.get("/slots/blocked", response_model=List[BlockSlot])
def get_blocked(master_id: int, day: Optional[str] = None):
    with get_conn() as conn, conn.cursor() as cur:
        if day:
            cur.execute(
                """
                select id, master_id, day, time
                from blocked_slots
                where master_id = %s and day = %s
                order by time
                """,
                (master_id, day),
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
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            delete from blocked_slots
            where master_id = %s and day = %s and time = %s
            """,
            (master_id, day, time),
        )
        removed = cur.rowcount
        conn.commit()
    return {"ok": True, "removed": removed}

# --- Bookings ---
@app.post("/bookings", response_model=Booking)
def create_booking(payload: BookingCreate):
    # Если пришли из Telegram Mini App — проверяем подпись
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
            insert into bookings (
              telegram_id, salon_id, master_id, master_name,
              day, time, customer_name, customer_phone, status
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            returning id, telegram_id, salon_id, master_id, master_name,
                      day, time, customer_name, customer_phone, status
            """,
            (
                payload.telegram_id,
                payload.salon_id,
                payload.master_id,
                payload.master_name,
                payload.day,
                payload.time,
                payload.customer_name,
                payload.customer_phone,
            ),
        )
        row = cur.fetchone()
        conn.commit()

    return row

@app.get("/bookings/by-master/{master_id}", response_model=List[Booking])
def bookings_by_master(master_id: int):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            select id, telegram_id, salon_id, master_id, master_name,
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
    status: Literal["confirmed", "rejected", "arrived", "no_show", "cancelled"]
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            update bookings
            set status = %s
            where id = %s
            returning id, telegram_id, salon_id, master_id, master_name,
                      day, time, customer_name, customer_phone, status
            """,
            (status, booking_id),
        )
        row = cur.fetchone()
        conn.commit()

    if not row:
        raise HTTPException(status_code=404, detail="not_found")

    return row