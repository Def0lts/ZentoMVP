import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getMastersBySalon, type Master } from "../lib/api";

export default function ChooseMaster() {
  const nav = useNavigate();
  const { salonId } = useParams();

  const sid = useMemo(() => Number(salonId || 0), [salonId]);

  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!sid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMastersBySalon(sid);
      setItems(data);
    } catch {
      setError("Не удалось загрузить мастеров");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [sid]);

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
          <div style={{ fontWeight: 900 }}>Выбрать специалиста</div>
          <button className="pill" onClick={load} style={{ cursor: "pointer" }}>
            ↻
          </button>
        </div>

        {loading && (
          <div style={{ padding: 12, opacity: 0.8 }}>Загрузка...</div>
        )}
        {error && (
          <div style={{ padding: 12, color: "crimson", fontWeight: 700 }}>
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ padding: 12, opacity: 0.8 }}>Мастеров пока нет</div>
        )}

        <div style={{ display: "grid", gap: 12, paddingBottom: 10 }}>
          {items.map((m) => {
            const qs = new URLSearchParams({
              masterId: String(m.id),
              masterName: m.name, // URLSearchParams сам кодирует
            }).toString();

            return (
              <div key={m.id} className="salon-card" style={{ padding: 12 }}>
                <div className="salon-img" style={{ width: 64, height: 64 }}>
                  {(m.name ?? "M").slice(0, 1).toUpperCase()}
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
                      {m.name}
                    </div>
                    <div
                      className="chip chip-active"
                      style={{
                        padding: "6px 10px",
                        fontSize: 11,
                        boxShadow: "none",
                      }}
                    >
                      ⭐ {m.rating}
                    </div>
                  </div>

                  <div className="notice" style={{ marginTop: 6 }}>
                    {m.role} • {m.reviews} отзывов
                  </div>

                  <div className="salon-actions">
                    <div className="salon-actions">
                      <button
                        className="btn-primary"
                        onClick={() => nav(`/booking/${sid}/service?${qs}`)}
                      >
                        Выбрать
                      </button>

                      <button
                        className="btn-ghost"
                        onClick={() => nav(`/booking/${sid}/service?${qs}`)}
                      >
                        Услуги
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* В макете нижняя панель есть на большинстве экранов */}
        <BottomNav />
      </div>
    </div>
  );
}
