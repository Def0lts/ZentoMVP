export const API_BASE = "https://zentomvp.onrender.com";

// ---------- Types ----------
export type Salon = {
  id: number;
  name: string;
  address: string;
  price_from: number;
  rating: number;
  km: number;
  category: "nails" | "hair" | "massage" | "brows";
};

export type Master = {
  id: number;
  salon_id: number;
  name: string;
  role: string;
  rating: number;
  reviews: number;
};

export type Booking = {
  id: number;
  telegram_id: number;
  salon_id: number;
  master_id: number;
  master_name: string;
  day: string;
  time: string;
  customer_name: string;
  customer_phone: string;
  status: "pending" | "confirmed" | "rejected" | "arrived" | "no_show" | "cancelled";
};

export type BookingCreate = {
  telegram_id: number;
  init_data?: string;
  salon_id: number;
  master_id: number;
  master_name: string;
  day: string;
  time: string;
  customer_name: string;
  customer_phone: string;
};

export type BlockedSlot = {
  id: number;
  master_id: number;
  day: string;
  time: string;
};

// ---------- Salons ----------
export async function getSalons(): Promise<Salon[]> {
  const res = await fetch(`${API_BASE}/salons`);
  if (!res.ok) throw new Error("Failed to load salons");
  return res.json();
}

export async function getSalon(id: number): Promise<Salon> {
  const res = await fetch(`${API_BASE}/salons/${id}`);
  if (!res.ok) throw new Error("Salon not found");
  return res.json();
}

export async function getMastersBySalon(salonId: number): Promise<Master[]> {
  const res = await fetch(`${API_BASE}/salons/${salonId}/masters`);
  if (!res.ok) throw new Error("Failed to load masters");
  return res.json();
}

// ---------- Bookings ----------
export async function createBooking(payload: BookingCreate): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create booking");
  return res.json();
}

export async function getBookingsByMaster(masterId: number): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/by-master/${masterId}`);
  if (!res.ok) throw new Error("Failed to load master bookings");
  return res.json();
}

export async function getBookingsByTelegram(telegramId: number): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/by-telegram/${telegramId}`);
  if (!res.ok) throw new Error("Failed to load bookings");
  return res.json();
}

export async function setBookingStatus(
  bookingId: number,
  status: "confirmed" | "rejected" | "arrived" | "no_show" | "cancelled"
): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/status?status=${status}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

// ---------- Slots ----------
export async function blockSlot(input: { master_id: number; day: string; time: string }) {
  const url =
    `${API_BASE}/slots/block` +
    `?master_id=${encodeURIComponent(input.master_id)}` +
    `&day=${encodeURIComponent(input.day)}` +
    `&time=${encodeURIComponent(input.time)}`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error("block failed");
  return res.json();
}

export async function unblockSlot(params: { master_id: number; day: string; time: string }) {
  const q = new URLSearchParams({
    master_id: String(params.master_id),
    day: params.day,
    time: params.time,
  });

  const res = await fetch(`${API_BASE}/slots/unblock?${q.toString()}`, { method: "POST" });
  if (!res.ok) throw new Error("unblock failed");
  return res.json() as Promise<{ ok: boolean; removed: number }>;
}

export async function getBlockedSlots(params: { master_id: number; day?: string }) {
  const q = new URLSearchParams();
  q.set("master_id", String(params.master_id));
  if (params.day) q.set("day", params.day);

  const res = await fetch(`${API_BASE}/slots/blocked?${q.toString()}`);
  if (!res.ok) throw new Error("blocked failed");
  return (await res.json()) as BlockedSlot[];
}