from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Literal, Optional

app = FastAPI(title="Zento API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://zento-lbmakp85p-def0lts-projects.vercel.app",
    ],
    allow_credentials=True,
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
    status: Literal["pending", "confirmed", "rejected", "arrived", "no_show"]

class BlockSlot(BaseModel):
    id: int
    master_id: int
    day: str
    time: str

BOOKINGS: List[Booking] = []
BLOCKED_SLOTS: List[BlockSlot] = []
BOOKING_ID = 1

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

    booked_times = {
        b.time for b in BOOKINGS
        if b.master_id == master_id and b.day == day and b.status != "rejected"
    }
    blocked_times = {
        s.time for s in BLOCKED_SLOTS
        if s.master_id == master_id and s.day == day
    }

    busy = booked_times | blocked_times
    free = [t for t in all_times if t not in busy]
    return {"master_id": master_id, "day": day, "free": free, "busy": sorted(list(busy))}

@app.post("/slots/block", response_model=BlockSlot)
def block_slot(master_id: int, day: str, time: str):
    new = BlockSlot(id=len(BLOCKED_SLOTS) + 1, master_id=master_id, day=day, time=time)
    BLOCKED_SLOTS.append(new)
    return new

@app.get("/slots/blocked", response_model=List[BlockSlot])
def get_blocked(master_id: int, day: Optional[str] = None):
    items = [s for s in BLOCKED_SLOTS if s.master_id == master_id]
    if day:
        items = [s for s in items if s.day == day]
    return items

@app.post("/slots/unblock")
def unblock_slot(master_id: int, day: str, time: str):
    global BLOCKED_SLOTS
    before = len(BLOCKED_SLOTS)
    BLOCKED_SLOTS = [
        s for s in BLOCKED_SLOTS
        if not (s.master_id == master_id and s.day == day and s.time == time)
    ]
    return {"ok": True, "removed": before - len(BLOCKED_SLOTS)}

# --- Bookings ---
@app.post("/bookings", response_model=Booking)
def create_booking(payload: BookingCreate):
    global BOOKING_ID
    b = Booking(
        id=BOOKING_ID,
        telegram_id=payload.telegram_id,
        salon_id=payload.salon_id,
        master_id=payload.master_id,
        master_name=payload.master_name,
        day=payload.day,
        time=payload.time,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        status="pending",
    )
    BOOKINGS.append(b)
    BOOKING_ID += 1
    return b

@app.get("/bookings/by-master/{master_id}", response_model=List[Booking])
def bookings_by_master(master_id: int):
    return [b for b in BOOKINGS if b.master_id == master_id]

@app.get("/bookings/by-telegram/{telegram_id}", response_model=List[Booking])
def bookings_by_user(telegram_id: int):
    return [b for b in BOOKINGS if b.telegram_id == telegram_id]

@app.patch("/bookings/{booking_id}/status", response_model=Booking)
def update_booking_status(
    booking_id: int,
    status: Literal["confirmed", "rejected", "arrived", "no_show"]
):
    for i, b in enumerate(BOOKINGS):
        if b.id == booking_id:
            updated = b.model_copy(update={"status": status})
            BOOKINGS[i] = updated
            return updated
    return {"error": "not_found"}