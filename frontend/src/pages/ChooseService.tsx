import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getMasterServices, type Service } from "../lib/api";

export default function ChooseService() {
  const nav = useNavigate();
  const { salonId } = useParams();
  const loc = useLocation();

  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const sid = Number(salonId || 0);
  const masterId = Number(qp.get("masterId") || 0);
  const masterName = qp.get("masterName") || "";

  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!masterId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getMasterServices(masterId);
      setItems(data);
    } catch {
      setError("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [masterId]);

  if (!masterId) {
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
            <div style={{ fontWeight: 900 }}>Услуга</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16, borderRadius: 26 }}>
            <div style={{ fontWeight: 900 }}>Сначала выберите мастера</div>
            <div className="notice" style={{ marginTop: 6 }}>
              Для выбора услуги нужен выбранный специалист.
            </div>

            <button
              className="big-primary"
              onClick={() => nav(`/salons/${sid}/masters`)}
            >
              К мастерам
            </button>
          </div>
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
            onClick={() => nav(-1)}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Выберите услугу</div>
          <button className="pill" onClick={load} style={{ cursor: "pointer" }}>
            ↻
          </button>
        </div>

        {masterName && (
          <div className="notice" style={{ marginBottom: 10 }}>
            Мастер: <b>{masterName}</b>
          </div>
        )}

        {loading && (
          <div style={{ padding: 12, opacity: 0.8 }}>Загрузка...</div>
        )}

        {error && (
          <div style={{ padding: 12, color: "crimson", fontWeight: 700 }}>
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div style={{ padding: 12, opacity: 0.8 }}>
            У этого мастера пока нет услуг
          </div>
        )}

        <div style={{ display: "grid", gap: 12, paddingBottom: 10 }}>
          {items.map((s) => {
            const nextQs = new URLSearchParams({
              masterId: String(masterId),
              masterName,
              serviceId: String(s.id),
              serviceTitle: s.title,
              servicePrice: String(s.price),
              serviceDuration: String(s.duration_min),
            }).toString();

            return (
              <div key={s.id} className="salon-card" style={{ padding: 12 }}>
                <div className="salon-img" style={{ width: 64, height: 64 }}>
                  ✂️
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
                      {s.title}
                    </div>

                    <div
                      className="chip chip-active"
                      style={{
                        padding: "6px 10px",
                        fontSize: 11,
                        boxShadow: "none",
                      }}
                    >
                      {s.price} ₸
                    </div>
                  </div>

                  <div className="notice" style={{ marginTop: 6 }}>
                    Длительность: {s.duration_min} мин
                  </div>

                  <div className="salon-actions">
                    <button
                      className="btn-primary"
                      onClick={() => nav(`/booking/${sid}?${nextQs}`)}
                    >
                      Выбрать
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
