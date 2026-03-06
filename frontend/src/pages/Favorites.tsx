import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import {
  getFavorites,
  getSalons,
  removeFavorite,
  type Salon,
} from "../lib/api";
import { getTelegramId, getTelegramInitData } from "../lib/telegram";

export default function Favorites() {
  const nav = useNavigate();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [favoritesData, salonsData] = await Promise.all([
        getFavorites(telegramId),
        getSalons(),
      ]);

      const ids = favoritesData.map((x) => x.salon_id);
      setFavoriteIds(ids);

      const filtered = salonsData.filter((s) => ids.includes(s.id));
      setSalons(filtered);
    } catch {
      setError("Не удалось загрузить избранные салоны");
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(salonId: number) {
    try {
      await removeFavorite({
        telegram_id: telegramId,
        salon_id: salonId,
        init_data: initData,
      });

      setFavoriteIds((prev) => prev.filter((id) => id !== salonId));
      setSalons((prev) => prev.filter((s) => s.id !== salonId));
    } catch {
      setError("Не удалось удалить из избранного");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => salons, [salons]);

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
          <div style={{ fontWeight: 900 }}>Избранные</div>
          <button className="pill" onClick={load} style={{ cursor: "pointer" }}>
            ↻
          </button>
        </div>

        {loading && <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>}
        {error && <div style={{ padding: 8, color: "crimson" }}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={{ padding: 8, opacity: 0.8 }}>
            Избранных салонов пока нет
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {items.map((s) => (
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
                    title="Убрать из избранного"
                    className="btn-ghost"
                    style={{ padding: "6px 10px" }}
                    onClick={() => onRemove(s.id)}
                  >
                    ❤️
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

        <BottomNav />
      </div>
    </div>
  );
}
