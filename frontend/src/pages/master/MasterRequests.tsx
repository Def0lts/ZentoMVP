import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import {
  getBookingsByMaster,
  getMasterByTelegram,
  setBookingStatus,
  type Booking,
  type MasterAccount,
} from "../../lib/api";
import { getTelegramId } from "../../lib/telegram";

function statusRu(s: Booking["status"]) {
  if (s === "pending") return "Ожидает";
  if (s === "confirmed") return "Подтверждено";
  if (s === "rejected") return "Отклонено";
  if (s === "arrived") return "Пришел";
  if (s === "cancelled") return "Отменено";
  return "Не пришел";
}

export default function MasterRequests() {
  const nav = useNavigate();
  const telegramId = getTelegramId(1111);

  const [master, setMaster] = useState<MasterAccount | null>(null);
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"new" | "confirmed" | "history">("new");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const m = await getMasterByTelegram(telegramId);
      if (!m) {
        setMaster(null);
        setItems([]);
        return;
      }

      localStorage.setItem("zento_mode", "master");
      setMaster(m);

      const data = await getBookingsByMaster(m.id);
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
        b.status === "no_show" ||
        b.status === "cancelled",
    );
  }, [items, tab]);

  async function doStatus(
    id: number,
    status: "confirmed" | "rejected" | "arrived" | "no_show",
  ) {
    try {
      setBusyId(id);
      const updated = await setBookingStatus(id, status, telegramId);
      setItems((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } finally {
      setBusyId(null);
    }
  }

  if (!loading && !master) {
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
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16, borderRadius: 26 }}>
            <div style={{ fontWeight: 900 }}>Мастер не активирован</div>
            <div className="notice" style={{ marginTop: 8 }}>
              Сначала активируй мастер-профиль по коду.
            </div>
            <button
              className="big-primary"
              onClick={() => nav("/master/activate")}
            >
              Активировать
            </button>
          </div>

          <BottomNav profilePath="/master" />
        </div>
      </div>
    );
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

                {b.service_title && (
                  <div className="notice" style={{ marginTop: 6 }}>
                    Услуга: <b>{b.service_title}</b>
                  </div>
                )}

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>📞 {b.customer_phone}</span>
                </div>

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>📅 {b.day}</span>
                  <span>🕒 {b.time}</span>
                </div>

                {(b.service_price || b.service_duration) && (
                  <div className="salon-meta" style={{ marginTop: 6 }}>
                    {b.service_price ? (
                      <span>💸 {b.service_price} ₸</span>
                    ) : null}
                    {b.service_duration ? (
                      <span>⏱ {b.service_duration} мин</span>
                    ) : null}
                  </div>
                )}

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

        <BottomNav profilePath="/master" />
      </div>
    </div>
  );
}
