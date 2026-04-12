import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getMastersBySalon, type Master } from "../lib/api";
import { API_BASE } from "../lib/api";

export default function ChooseMaster() {
  const nav = useNavigate();
  const { salonId } = useParams();

  const sid = useMemo(() => Number(salonId || 0), [salonId]);

  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nextSlots, setNextSlots] = useState<Record<number, string[]>>({});
  async function load() {
    if (!sid) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMastersBySalon(sid);
      setItems(data);
      await loadNextSlots(data);
    } catch {
      setError("Не удалось загрузить мастеров");
    } finally {
      setLoading(false);
    }
  }
  async function loadNextSlots(masters: Master[]) {
    const today = new Date().toISOString().slice(0, 10);
    const result: Record<number, string[]> = {};

    for (const m of masters) {
      try {
        const res = await fetch(
          `${API_BASE}/slots/free?master_id=${m.id}&day=${today}`,
        );
        const data = await res.json();

        if (data.free && data.free.length > 0) {
          result[m.id] = data.free.slice(0, 3); // 3 ближайших
        }
      } catch {}
    }

    setNextSlots(result);
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
          <div className="loader">
            <div className="loader-spinner"></div>
          </div>
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
                <div
                  className="salon-img"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#eee",
                  }}
                >
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={m.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
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
                  {nextSlots[m.id] && (
                    <div className="master-slots">
                      <div className="master-slots-label">
                        <span className="dot" />
                        Сегодня свободно
                      </div>

                      <div className="master-slots-list">
                        {nextSlots[m.id].map((t) => (
                          <button
                            key={t}
                            className="slot-pill"
                            onClick={() =>
                              nav(
                                `/booking/${sid}/service?masterId=${m.id}&time=${t}`,
                              )
                            }
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="salon-actions">
                    <button
                      className="btn-primary"
                      onClick={() => nav(`/booking/${sid}/service?${qs}`)}
                    >
                      Выбрать
                    </button>
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
