import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createBooking } from "../lib/api";
import { getTelegramId, getTelegramInitData } from "../lib/telegram";

export default function Confirm() {
  const nav = useNavigate();
  const loc = useLocation();

  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const salonId = Number(qp.get("salonId") || 0);
  const masterId = Number(qp.get("masterId") || 0);
  const masterName = qp.get("masterName") || "";

  const serviceId = Number(qp.get("serviceId") || 0);
  const serviceTitle = qp.get("serviceTitle") || "";
  const servicePrice = Number(qp.get("servicePrice") || 0);
  const serviceDuration = Number(qp.get("serviceDuration") || 0);

  const day = qp.get("day") || "";
  const time = qp.get("time") || "";

  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!salonId || !masterId || !serviceId || !day || !time) {
      setError("Не хватает данных для записи");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const booking = await createBooking({
        telegram_id: telegramId,
        init_data: initData,
        salon_id: salonId,
        master_id: masterId,
        master_name: masterName,
        day,
        time,
        customer_name: name,
        customer_phone: phone,
      });

      nav(`/success?id=${booking.id}`);
    } catch {
      setError("Ошибка записи");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button className="pill" onClick={() => nav(-1)}>
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Подтверждение</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="notice">
          <div>
            Мастер: <b>{masterName}</b>
          </div>

          <div>
            Услуга: <b>{serviceTitle}</b>
          </div>

          <div>
            Цена: <b>{servicePrice} ₸</b>
          </div>

          <div>
            Длительность: <b>{serviceDuration} мин</b>
          </div>

          <div>
            Дата: <b>{day}</b>
          </div>

          <div>
            Время: <b>{time}</b>
          </div>
        </div>

        <input
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {error && <div style={{ color: "red" }}>{error}</div>}

        <button className="big-primary" onClick={onSubmit} disabled={loading}>
          Подтвердить запись
        </button>
      </div>
    </div>
  );
}
