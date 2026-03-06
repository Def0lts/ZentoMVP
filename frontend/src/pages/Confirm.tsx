import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { createBooking, getMastersBySalon } from "../lib/api";
import {
  getTelegramId,
  getTelegramInitData,
  isTelegramWebApp,
} from "../lib/telegram";

export default function Confirm() {
  const nav = useNavigate();
  const loc = useLocation();
  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const salonId = Number(qp.get("salonId") || 0);
  const masterId = Number(qp.get("masterId") || 0);
  const day = qp.get("day") || "";
  const time = qp.get("time") || "";

  // было: const masterName = qp.get("masterName") || "Мастер";
  const masterNameFromQuery = qp.get("masterName") ?? "";
  const [masterName, setMasterName] = useState(masterNameFromQuery);

  useEffect(() => {
    if (!salonId || !masterId) return;

    // Если имя нормальное — не трогаем
    if (masterName && masterName !== "Мастер") return;

    (async () => {
      try {
        const masters = await getMastersBySalon(salonId);
        const found = masters.find((m) => m.id === masterId);
        if (found?.name) setMasterName(found.name);
      } catch {
        // ничего, просто останется fallback в интерфейсе
      }
    })();
  }, [salonId, masterId, masterName]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const telegramId = getTelegramId();
  const initData = getTelegramInitData();
  const isTg = isTelegramWebApp();

  async function onSubmit() {
    if (!salonId || !masterId || !day || !time) {
      setError("Не хватает данных для записи");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Заполни имя и телефон");
      return;
    }

    if (isTg && !initData) {
      setError("Не удалось получить данные Telegram");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const booking = await createBooking({
        telegram_id: telegramId,
        init_data: initData,
        salon_id: salonId,
        master_id: masterId,
        master_name: masterName || "Мастер",
        day,
        time,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
      });

      nav("/success", { state: { bookingId: booking.id } });
    } catch {
      setError("Ошибка создания записи");
    } finally {
      setSaving(false);
    }
  }

  // дальше твой JSX без изменений, только вывод:
  // Мастер: <b>{masterName || "Мастер"}</b>
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
          <div style={{ fontWeight: 900 }}>Подтверждение</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="page-title">Подтвердите запись</div>

        <div className="slot-box">
          <div style={{ fontWeight: 900, fontSize: 13 }}>Детали записи</div>
          <div className="notice" style={{ marginTop: 6 }}>
            Мастер: <b>{masterName || "Загрузка..."}</b>
          </div>

          <div className="notice">
            Дата: <b>{day || "—"}</b>
          </div>
          <div className="notice">
            Время: <b>{time || "—"}</b>
          </div>

          <div className="form">
            <input
              className="input"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="notice">
            Запись бесплатная. Оплата производится в салоне.
          </div>

          {error && (
            <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
              {error}
            </div>
          )}
        </div>

        <button className="big-primary" onClick={onSubmit} disabled={saving}>
          {saving ? "Создаю..." : "Записаться"}
        </button>

        {/* BottomNav здесь НЕ нужен */}
      </div>
    </div>
  );
}
