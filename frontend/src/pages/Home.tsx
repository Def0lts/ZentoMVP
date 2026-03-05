import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSalons, type Salon } from "../lib/api";
import BottomNav from "../components/BottomNav";

type Cat = "nails" | "hair" | "massage" | "brows";

const categories: { key: Cat; title: string; sub: string; icon: string }[] = [
  { key: "nails", title: "Маникюр", sub: "20+ салонов", icon: "💅" },
  { key: "hair", title: "Парикмахер", sub: "90+ салонов", icon: "💇‍♀️" },
  { key: "massage", title: "Массаж", sub: "60+ салонов", icon: "💆" },
  { key: "brows", title: "Брови и ресницы", sub: "80+ салонов", icon: "👁️" },
];

export default function Home() {
  const nav = useNavigate();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await getSalons();
      setSalons(data);
    } catch {
      setError("Не удалось загрузить салоны");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const recommended = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = salons;
    if (query) {
      list = salons.filter((s) => {
        const name = (s.name ?? "").toLowerCase();
        const addr = (s.address ?? "").toLowerCase();
        return name.includes(query) || addr.includes(query);
      });
    }
    // топ по рейтингу, чтобы “Рекомендуем” выглядело логично
    return [...list]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6);
  }, [salons, q]);

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        {/* Top bar */}
        <div className="topbar">
          <div
            className="pill"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <span>📍</span>
            <span style={{ fontWeight: 800, fontSize: 12 }}>Костанай</span>
          </div>

          <div
            style={{
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="pill" style={{ padding: "8px 10px" }}>
              🗓️
            </span>
            <span>Zento</span>
          </div>

          <button
            className="pill"
            onClick={() => nav("/profile")}
            style={{ cursor: "pointer" }}
          >
            👤 Профиль
          </button>
        </div>

        {/* Search */}
        <div className="card search">
          <span style={{ opacity: 0.8 }}>🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск услуги..."
          />
          <button className="btn-ghost" onClick={load}>
            ↻
          </button>
        </div>

        {/* Categories */}
        <div className="section-title">Категории</div>
        <div className="grid2">
          {categories.map((c) => (
            <div
              key={c.key}
              className="cat-card"
              role="button"
              tabIndex={0}
              onClick={() => nav(`/salons?cat=${c.key}`)}
              onKeyDown={(e) =>
                e.key === "Enter" && nav(`/salons?cat=${c.key}`)
              }
            >
              <div className="cat-left">
                <div className="icon-circle">{c.icon}</div>
                <div>
                  <div className="cat-title">{c.title}</div>
                  <div className="cat-sub">{c.sub}</div>
                </div>
              </div>
              <div className="cat-arrow">›</div>
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div className="section-title">Рекомендуем</div>

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && recommended.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Салоны не найдены</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {recommended.map((s) => (
            <div key={s.id} className="salon-card">
              <div className="salon-img">
                {(s.name ?? "S").slice(0, 1).toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div className="salon-name">{s.name}</div>
                  <div title="В избранное" style={{ opacity: 0.7 }}>
                    ♡
                  </div>
                </div>

                <div className="salon-meta">
                  <span>⭐ {s.rating}</span>
                  <span>📍 {s.km} км</span>
                  <span>от {s.price_from} ₸</span>
                </div>

                <div className="salon-actions">
                  <button
                    className="btn-primary"
                    onClick={() => nav(`/booking/${s.id}`)}
                  >
                    Записаться
                  </button>

                  <button
                    className="btn-ghost"
                    onClick={() => nav(`/salons/${s.id}`)}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
