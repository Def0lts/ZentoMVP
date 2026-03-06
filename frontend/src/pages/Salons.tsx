import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addFavorite,
  getFavorites,
  getSalons,
  removeFavorite,
  type Salon,
} from "../lib/api";
import { getTelegramId, getTelegramInitData } from "../lib/telegram";

import BottomNav from "../components/BottomNav";

type Cat = "all" | "nails" | "hair" | "massage" | "brows";
type Sort = "none" | "price_asc" | "price_desc";

export default function Salons() {
  const loc = useLocation();
  const nav = useNavigate();

  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const cat = (qp.get("cat") || "all") as Cat;

  const [q, setQ] = useState("");
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  const [sort, setSort] = useState<Sort>("none");
  const [todayOnly, setTodayOnly] = useState(false);

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

  async function loadFavorites() {
    try {
      const data = await getFavorites(telegramId);
      setFavoriteIds(data.map((x) => x.salon_id));
    } catch {
      // не ломаем экран
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
    } catch {
      // позже можно toast
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

    // todayOnly пока просто UI-переключатель, чтобы соответствовать макету.
    // Реальную “свободно сегодня” можно связать со слотами позже.
    if (todayOnly) {
      list = [...list];
    }

    if (sort === "price_asc")
      list = [...list].sort((a, b) => a.price_from - b.price_from);
    if (sort === "price_desc")
      list = [...list].sort((a, b) => b.price_from - a.price_from);

    return list;
  }, [salons, cat, q, sort, todayOnly]);

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        {/* header */}
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
            onClick={() => nav("/profile")}
            style={{ cursor: "pointer" }}
          >
            👤
          </button>
        </div>

        {/* search */}
        <div className="card search">
          <span style={{ opacity: 0.8 }}>🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по городу"
          />
        </div>

        {/* chips */}
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

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: 8, opacity: 0.75 }}>
            Результатов больше нет
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((s) => (
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
                    onClick={() => nav(`/salons/${s.id}`)}
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

        {/* bottom nav */}
        <BottomNav />
      </div>
    </div>
  );
}
