import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addFavorite,
  getFavorites,
  getSalon,
  removeFavorite,
  type Salon,
} from "../lib/api";
import BottomNav from "../components/BottomNav";
import {
  getTelegramId,
  getTelegramInitData,
  getProfileRoute,
} from "../lib/telegram";

export default function SalonDetails() {
  const { salonId } = useParams();
  const nav = useNavigate();

  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  async function loadFavorites() {
    try {
      const data = await getFavorites(telegramId);
      setFavoriteIds(data.map((x) => x.salon_id));
    } catch {
      // не ломаем экран
    }
  }

  async function toggleFavorite() {
    if (!salon) return;

    const isFav = favoriteIds.includes(salon.id);

    try {
      if (isFav) {
        await removeFavorite({
          telegram_id: telegramId,
          salon_id: salon.id,
          init_data: initData,
        });
        setFavoriteIds((prev) => prev.filter((id) => id !== salon.id));
      } else {
        await addFavorite({
          telegram_id: telegramId,
          salon_id: salon.id,
          init_data: initData,
        });
        setFavoriteIds((prev) => [...prev, salon.id]);
      }
    } catch {
      // позже можно красивую ошибку
    }
  }

  useEffect(() => {
    if (!salonId) return;
    (async () => {
      try {
        const data = await getSalon(Number(salonId));
        setSalon(data);
        await loadFavorites();
      } finally {
        setLoading(false);
      }
    })();
  }, [salonId]);

  if (loading) {
    return (
      <div className="zento-screen">
        <div className="zento-phone">Загрузка...</div>
      </div>
    );
  }
  if (!salon) {
    return (
      <div className="zento-screen">
        <div className="zento-phone">Салон не найден</div>
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
          <div style={{ fontWeight: 900 }}>Zento</div>

          <button
            className="pill"
            onClick={() => nav(getProfileRoute())}
            style={{ cursor: "pointer" }}
          >
            👤
          </button>
        </div>
        <div
          style={{
            height: 190,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(16,24,40,0.10)",
            background: "#f3f4f6",
          }}
        >
          {salon.photo_url ? (
            <img
              src={salon.photo_url}
              alt={salon.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: "rgba(16,24,40,0.55)",
                background:
                  "linear-gradient(135deg, rgba(116,168,255,0.45), rgba(255,255,255,0.95))",
              }}
            >
              {salon.name}
            </div>
          )}
        </div>

        <div
          className="card"
          style={{
            padding: 10,
            borderRadius: 26,
            overflow: "hidden",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <div
            style={{
              height: 190,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(116,168,255,0.45), rgba(255,255,255,0.95))",
              border: "1px solid rgba(16,24,40,0.10)",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              color: "rgba(16,24,40,0.55)",
            }}
          >
            {salon.name}
          </div>

          <div style={{ padding: "12px 6px 6px" }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>{salon.name}</div>
            <div
              style={{
                marginTop: 6,
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              ⭐ {salon.rating} • 📍 {salon.km} км
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <button
                className="btn-primary"
                onClick={() => nav(`/salons/${salon.id}/masters`)}
              >
                Записаться
              </button>
              <button
                className="btn-ghost"
                title="В избранное"
                onClick={toggleFavorite}
              >
                {salon && favoriteIds.includes(salon.id) ? "❤️" : "♡"}
              </button>
            </div>

            {/* “Прайс” блок (пока статичный, потому что в API нет прайса) */}
            <div
              style={{
                marginTop: 14,
                borderTop: "1px solid rgba(16,24,40,0.10)",
                paddingTop: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 900 }}>Прайс:</div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>
                • Услуги от {salon.price_from} ₸
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                (Позже можно подтянуть конкретные услуги из отдельного
                API/модели — сейчас просто держим стиль макета)
              </div>

              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                <span>📍 {salon.address}</span>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button
                className="btn-ghost"
                onClick={() => {
                  const url = `${window.location.origin}/salons/${salonId}`;
                  navigator.clipboard.writeText(url);
                  alert("Ссылка на салон скопирована");
                }}
              >
                Скопировать ссылку
              </button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
