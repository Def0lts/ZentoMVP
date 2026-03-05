import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMastersBySalon, type Master } from "../lib/api";
import BottomNav from "../components/BottomNav";

export default function ChooseMaster() {
  const nav = useNavigate();
  const { salonId } = useParams();

  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!salonId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMastersBySalon(Number(salonId));
      setItems(data);
    } catch {
      setError("Не удалось загрузить мастеров");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [salonId]);

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

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Мастера не найдены</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((m) => (
            <div
              key={m.id}
              className="salon-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                nav(
                  `/booking/${salonId}?masterId=${m.id}&masterName=${encodeURIComponent(m.name)}`,
                )
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                nav(
                  `/booking/${salonId}?masterId=${m.id}&masterName=${encodeURIComponent(m.name)}`,
                )
              }
              style={{ cursor: "pointer" }}
            >
              <div className="salon-img">
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
                  <div className="salon-name">{m.name}</div>
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

                <div className="salon-meta" style={{ marginTop: 6 }}>
                  <span>{m.role}</span>
                  <span>🗨 {m.reviews} отзывов</span>
                </div>

                <div className="salon-actions">
                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      nav(
                        `/booking/${salonId}?masterId=${m.id}&masterName=${encodeURIComponent(m.name)}`,
                      );
                    }}
                  >
                    Выбрать
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      nav(`/salons/${salonId}`);
                    }}
                  >
                    Назад к салону
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* BottomNav тут можно оставить, как в макете (это часть клиентского потока) */}
        <BottomNav />
      </div>
    </div>
  );
}
