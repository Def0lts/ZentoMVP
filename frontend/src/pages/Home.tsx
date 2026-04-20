import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import nailIcon from "../assets/icons/Home_nail.png";
import hairIcon from "../assets/icons/Home_hair.png";
import massageIcon from "../assets/icons/Home_massage.png";
import browsIcon from "../assets/icons/Home_brows.png";

import logo from "../assets/icons/Zento_logo-removebg.png";

import { MapPin, Star, Heart } from "lucide-react";

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

const categories = [
  { key: "nails", title: "Маникюр", icon: nailIcon },
  { key: "hair", title: "Парикмахер", icon: hairIcon },
  { key: "massage", title: "Массаж", icon: massageIcon },
  { key: "brows", title: "Брови и ресницы", icon: browsIcon },
];

export default function Home() {
  const nav = useNavigate();

  const [salons, setSalons] = useState<Salon[]>([]);
  const categoryCounts = {
    all: salons.length,
    hair: salons.filter((s) => s.category === "hair").length,
    nails: salons.filter((s) => s.category === "nails").length,
    massage: salons.filter((s) => s.category === "massage").length,
    brows: salons.filter((s) => s.category === "brows").length,
  };
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  const tg = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user;

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
          {/* ЛЕВО */}
          <div className="topbar-left">
            <div className="pill">Костанай</div>
          </div>

          {/* ЦЕНТР (ЛОГО) */}
          <div className="topbar-center">
            <img
              src={logo}
              style={{
                height: 64,
                objectFit: "contain",
                transform: "translateY(4px)",
              }}
            />
          </div>

          {/* ПРАВО */}

          <div
            className="topbar-right"
            onClick={() => nav(getProfileRoute())}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              src={user?.photo_url || "/default-avatar.png"}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                objectFit: "cover",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
              }}
            />

            <span
              style={{
                fontSize: 12,
                opacity: 0.6,
                marginTop: 3,
                fontWeight: 500,
              }}
            >
              Профиль
            </span>
          </div>
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
                <div className="icon-circle">
                  <img
                    src={c.icon}
                    style={{
                      width: 40,
                      height: 40,
                      objectFit: "contain",
                    }}
                  />
                </div>

                <div>
                  <div className="cat-title">{c.title}</div>
                  <div className="cat-sub">
                    {categoryCounts[c.key as keyof typeof categoryCounts] > 0
                      ? `${categoryCounts[c.key as keyof typeof categoryCounts]} салонов`
                      : "Нет салонов"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div className="section-title">Рекомендуем</div>
        {loading && (
          <div className="loader">
            <div className="loader-spinner"></div>
          </div>
        )}

        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && recommended.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>Салоны не найдены</div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {recommended.map((s) => (
            <div key={s.id} className="salon-card fade-in">
              <div
                className="salon-img"
                style={{
                  width: 82,
                  height: 82,
                  borderRadius: 20,
                  overflow: "hidden",
                  background: "#f3f4f6",
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
                    style={{
                      padding: "6px",
                      borderRadius: "50%",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => toggleFavorite(s.id)}
                  >
                    {favoriteIds.includes(s.id) ? (
                      <Heart
                        size={16}
                        fill={favoriteIds.includes(s.id) ? "#ff4d6d" : "none"}
                        strokeWidth={2}
                      />
                    ) : (
                      "♡"
                    )}
                  </button>
                </div>

                <div
                  className="salon-meta"
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 4,
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Star size={14} strokeWidth={2} color="#f5b301" />
                    {s.rating}
                  </span>

                  <span
                    style={{ display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <MapPin size={14} strokeWidth={2} color="#6b7280" />
                    {s.km} км
                  </span>

                  <span style={{ fontWeight: 600 }}>от {s.price_from} ₸</span>
                </div>

                <div
                  className="salon-actions"
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
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
