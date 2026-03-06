import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBookingsByTelegram,
  setBookingStatus,
  type Booking,
} from "../lib/api";
import BottomNav from "../components/BottomNav";
import { getTelegramId } from "../lib/telegram";

function statusLabel(s: Booking["status"]) {
  if (s === "pending") return "⏳ Ожидает подтверждения";
  if (s === "confirmed") return "✅ Подтверждено";
  if (s === "arrived") return "✔ Клиент пришел";
  if (s === "no_show") return "❌ Клиент не пришел";
  if (s === "rejected") return "🚫 Отклонено";
  if (s === "cancelled") return "↩️ Отменено клиентом";
  return s;
}

export default function MyBookings() {
  const nav = useNavigate();

  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const telegramId = getTelegramId(1111);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingsByTelegram(telegramId);
      setItems([...data].reverse());
    } catch {
      setError("Не удалось загрузить записи");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(id: number) {
    try {
      setBusyId(id);
      const updated = await setBookingStatus(id, "cancelled");
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch {
      setError("Не удалось отменить запись");
    } finally {
      setBusyId(null);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button
            className="pill"
            onClick={() => nav(-1)}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Мои записи</div>
          <button className="pill" onClick={load} style={{ cursor: "pointer" }}>
            ↻
          </button>
        </div>

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Записей пока нет</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((b) => (
            <div key={b.id} className="salon-card" style={{ padding: 12 }}>
              <div className="salon-img" style={{ width: 64, height: 64 }}>
                👤
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div className="salon-name" style={{ fontSize: 13 }}>
                    {b.master_name}
                  </div>
                  <div
                    className="chip chip-active"
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      boxShadow: "none",
                    }}
                  >
                    {b.status === "pending"
                      ? "Ожидает"
                      : b.status === "confirmed"
                        ? "Подтверждено"
                        : b.status === "rejected"
                          ? "Отклонено"
                          : b.status === "arrived"
                            ? "Пришел"
                            : b.status === "cancelled"
                              ? "Отменено"
                              : "Не пришел"}
                  </div>
                </div>

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>📅 {b.day}</span>
                  <span>🕒 {b.time}</span>
                </div>

                <div style={{ marginTop: 8, fontSize: 12 }}>
                  Статус: <b>{statusLabel(b.status)}</b>
                </div>

                <div className="salon-actions">
                  {(b.status === "pending" || b.status === "confirmed") && (
                    <button
                      className="btn-danger"
                      onClick={() => cancelBooking(b.id)}
                      disabled={busyId === b.id}
                    >
                      {busyId === b.id ? "Отмена..." : "Отменить"}
                    </button>
                  )}

                  <button className="btn-ghost" onClick={() => nav("/profile")}>
                    Профиль
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
