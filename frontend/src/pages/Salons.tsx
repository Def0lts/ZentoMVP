import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addFavorite,
  getFavorites,
  getSalons,
  removeFavorite,
  type Salon,
} from "../lib/api";

import { API_BASE } from "../lib/api";

import {
  getTelegramId,
  getTelegramInitData,
  getProfileRoute,
} from "../lib/telegram";

import BottomNav from "../components/BottomNav";

type Cat = "all" | "nails" | "hair" | "massage" | "brows";
type Sort = "none" | "price_asc" | "price_desc";

export default function Salons() {
  console.log("RENDER");
  const loc = useLocation();
  const nav = useNavigate();

  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const searchQuery = qp.get("q") || "";
  const cat = (qp.get("cat") || "all") as Cat;

  const [q, setQ] = useState(searchQuery);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [sort, setSort] = useState<Sort>("none");
  const [todayOnly, setTodayOnly] = useState(false);
  const [availableTodayIds, setAvailableTodayIds] = useState<number[]>([]);

  const title =
    cat === "nails"
      ? "Маникюр"
      : cat === "hair"
        ? "Парикмахер"
        : cat === "massage"
          ? "Массаж"
          : cat === "brows"
            ? "Брови и ресницы"
            : "Салоны";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSalons();
        setSalons(data);
        await loadFavorites();
      } catch {
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        console.log("Геолокация не разрешена");
      },
    );
  }, []);

  useEffect(() => {
    if (todayOnly) {
      loadAvailableToday();
    }
  }, [todayOnly]);

  async function loadFavorites() {
    try {
      const data = await getFavorites(telegramId);
      setFavoriteIds(data.map((x) => x.salon_id));
    } catch {
      // ignore
    }
  }

  function calcDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371; // км
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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
    } catch {
      // ignore
    }
  }

  async function loadAvailableToday() {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const res = await fetch(
        `${API_BASE}/salons/available-today?day=${today}`,
      );

      const data = await res.json();

      setAvailableTodayIds(data.salon_ids || []);
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = useMemo(() => {
    let list =
      cat === "all" ? salons : salons.filter((s) => s.category === cat);

    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((s) => {
        const name = (s.name ?? "").toLowerCase();
        const addr = (s.address ?? "").toLowerCase();
        return name.includes(query) || addr.includes(query);
      });
    }
    if (todayOnly) {
      list = list.filter((s) => availableTodayIds.includes(s.id));
    }

    if (sort === "price_asc") {
      list = [...list].sort((a, b) => a.price_from - b.price_from);
    }

    if (sort === "price_desc") {
      list = [...list].sort((a, b) => b.price_from - a.price_from);
    }

    return list;
  }, [salons, cat, q, sort, todayOnly, availableTodayIds]);

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
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button
            className="pill"
            onClick={() => nav(getProfileRoute())}
            style={{ cursor: "pointer" }}
          >
            👤
          </button>
        </div>

        <div className="card search">
          <span style={{ opacity: 0.8 }}>🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по городу"
          />
        </div>

        <div className="chips">
          <button
            className={`chip ${todayOnly ? "chip-active" : ""}`}
            onClick={() => setTodayOnly((v) => !v)}
          >
            Свободно сегодня
          </button>

          <button
            className={`chip ${sort === "price_asc" ? "chip-active" : ""}`}
            onClick={() =>
              setSort((s) => (s === "price_asc" ? "none" : "price_asc"))
            }
          >
            Цена ↑
          </button>

          <button
            className={`chip ${sort === "price_desc" ? "chip-active" : ""}`}
            onClick={() =>
              setSort((s) => (s === "price_desc" ? "none" : "price_desc"))
            }
          >
            Цена ↓
          </button>
        </div>
        {loading && (
          <div className="loader">
            <div className="loader-spinner"></div>
          </div>
        )}

        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 8, opacity: 0.75 }}>
            Результатов больше нет
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((s) => {
            console.log("USER:", userCoords);
            console.log("SALON:", s);

            return (
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

                    <span>
                      📍{" "}
                      {userCoords && s.lat && s.lon
                        ? calcDistance(
                            userCoords.lat,
                            userCoords.lon,
                            s.lat,
                            s.lon,
                          ).toFixed(1)
                        : s.km}{" "}
                      км
                    </span>

                    <span>от {s.price_from} ₸</span>
                  </div>

                  <div className="salon-actions">
                    <button
                      className="btn-primary"
                      onClick={() => nav(`/salons/${s.id}/masters`)}
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
            );
          })}
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
