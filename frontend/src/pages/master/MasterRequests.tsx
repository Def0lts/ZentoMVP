import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBookingsByMaster,
  setBookingStatus,
  type Booking,
} from "../../lib/api";

function statusRu(s: Booking["status"]) {
  if (s === "pending") return "Ожидает";
  if (s === "confirmed") return "Подтверждено";
  if (s === "rejected") return "Отклонено";
  if (s === "arrived") return "Пришел";
  return "Не пришел";
}

export default function MasterRequests() {
  const nav = useNavigate();
  const masterId = 101;

  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"new" | "confirmed" | "history">("new");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingsByMaster(masterId);
      setItems(data);
    } catch {
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "new") return items.filter((b) => b.status === "pending");
    if (tab === "confirmed")
      return items.filter((b) => b.status === "confirmed");
    return items.filter(
      (b) =>
        b.status === "rejected" ||
        b.status === "arrived" ||
        b.status === "no_show",
    );
  }, [items, tab]);

  async function doStatus(
    id: number,
    status: "confirmed" | "rejected" | "arrived" | "no_show",
  ) {
    try {
      setBusyId(id);
      const updated = await setBookingStatus(id, status);
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button
            className="pill"
            onClick={() => nav("/master")}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Заявки</div>
          <button className="pill" onClick={load} style={{ cursor: "pointer" }}>
            ↻
          </button>
        </div>

        <div className="chips master-tabs">
          <button
            className={`chip ${tab === "new" ? "chip-active" : ""}`}
            onClick={() => setTab("new")}
          >
            🟡 Новые
          </button>
          <button
            className={`chip ${tab === "confirmed" ? "chip-active" : ""}`}
            onClick={() => setTab("confirmed")}
          >
            🟢 Подтвержденные
          </button>
          <button
            className={`chip ${tab === "history" ? "chip-active" : ""}`}
            onClick={() => setTab("history")}
          >
            ⚪ История
          </button>
        </div>

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Пока пусто</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((b) => (
            <div key={b.id} className="salon-card" style={{ padding: 12 }}>
              <div className="salon-img" style={{ width: 64, height: 64 }}>
                📌
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
                    {b.customer_name}
                  </div>

                  <div
                    className="chip chip-active"
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      boxShadow: "none",
                    }}
                  >
                    {statusRu(b.status)}
                  </div>
                </div>

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>📞 {b.customer_phone}</span>
                </div>

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>📅 {b.day}</span>
                  <span>🕒 {b.time}</span>
                </div>

                {b.status === "pending" && (
                  <div className="master-actions">
                    <button
                      className="btn-ok"
                      onClick={() => doStatus(b.id, "confirmed")}
                      disabled={busyId === b.id}
                    >
                      ✅ Подтвердить
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => doStatus(b.id, "rejected")}
                      disabled={busyId === b.id}
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                )}

                {b.status === "confirmed" && (
                  <div className="master-actions">
                    <button
                      className="btn-ok"
                      onClick={() => doStatus(b.id, "arrived")}
                      disabled={busyId === b.id}
                    >
                      ✔ Пришел
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => doStatus(b.id, "no_show")}
                      disabled={busyId === b.id}
                    >
                      ✖ Не пришел
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* BottomNav тут не нужен */}
      </div>
    </div>
  );
}
