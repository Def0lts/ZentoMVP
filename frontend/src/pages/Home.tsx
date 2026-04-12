import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  addFavorite,
  getFavorites,
  getSalons,
  removeFavorite,
  type Salon,
} from "../lib/api";
import {
  getTelegramId,
  getTelegramInitData,
  getProfileRoute,
  getStartParam,
} from "../lib/telegram";

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
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

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
  async function loadFavorites() {
    try {
      const data = await getFavorites(telegramId);
      setFavoriteIds(data.map((x) => x.salon_id));
    } catch (e) {
      console.log("load favorites error", e);
    }
  }

  async function toggleFavorite(salonId: number) {
    const isFav = favoriteIds.includes(salonId);

    try {
      if (isFav) {
        await removeFavorite({
          telegram_id: telegramId,
          salon_id: salonId,
          init_data: initData,
        });
        setFavoriteIds((prev) => prev.filter((id) => id !== salonId));
      } else {
        await addFavorite({
          telegram_id: telegramId,
          salon_id: salonId,
          init_data: initData,
        });
        setFavoriteIds((prev) => [...prev, salonId]);
      }
    } catch (e) {
      console.log("favorite error", e);
    }
  }

  useEffect(() => {
    load();
    loadFavorites();
  }, []);

  useEffect(() => {
    const start = getStartParam();

    if (start && start.startsWith("salon_")) {
      const salonId = start.replace("salon_", "");
      nav(`/salons/${salonId}`);
    }
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
            onClick={() => nav(getProfileRoute())}
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
            onChange={(e) => {
              const value = e.target.value;
              setQ(value);

              if (value.trim().length > 1) {
                nav(`/salons?q=${encodeURIComponent(value)}`);
              }
            }}
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
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div className="section-title">Рекомендуем</div>
        <div className="loader">
          <div className="loader-spinner"></div>
        </div>
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && recommended.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Салоны не найдены</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {recommended.map((s) => (
            <div key={s.id} className="salon-card">
              <div
                className="salon-img"
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: 18,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#eee",
                  flexShrink: 0,
                }}
              >
                {s.photo_url ? (
                  <img
                    src={s.photo_url}
                    alt={s.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  (s.name ?? "S").slice(0, 1).toUpperCase()
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
                  <div className="salon-name">{s.name}</div>
                  <button
                    title="В избранное"
                    className="btn-ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => toggleFavorite(s.id)}
                  >
                    {favoriteIds.includes(s.id) ? "❤️" : "♡"}
                  </button>
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
