import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { createBooking, getMastersBySalon } from "../lib/api";
import {
  getTelegramId,
  getTelegramInitData,
  isTelegramWebApp,
} from "../lib/telegram";

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trimStart();
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+()\-\s]/g, "").slice(0, 20);
}

function isValidName(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 40) return false;

  const hasLetter = /[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]/.test(trimmed);
  return hasLetter;
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && value.trim().length <= 20;
}

export default function Confirm() {
  const nav = useNavigate();
  const loc = useLocation();
  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const salonId = Number(qp.get("salonId") || 0);
  const masterId = Number(qp.get("masterId") || 0);
  const day = qp.get("day") || "";
  const time = qp.get("time") || "";

  const serviceId = Number(qp.get("serviceId") || 0);
  const serviceTitle = qp.get("serviceTitle") || "";
  const servicePrice = Number(qp.get("servicePrice") || 0);
  const serviceDuration = Number(qp.get("serviceDuration") || 0);

  const masterNameFromQuery = qp.get("masterName") ?? "";
  const [masterName, setMasterName] = useState(masterNameFromQuery);

  useEffect(() => {
    if (!salonId || !masterId) return;
    if (masterName && masterName !== "Мастер") return;

    (async () => {
      try {
        const masters = await getMastersBySalon(salonId);
        const found = masters.find((m) => m.id === masterId);
        if (found?.name) setMasterName(found.name);
      } catch {
        // ignore
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
    if (!salonId || !masterId || !serviceId || !day || !time) {
      setError("Не хватает данных для записи");
      return;
    }

    if (!isValidName(name)) {
      setError("Введите корректное имя");
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Введите корректный телефон");
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
        service_id: serviceId,
        service_title: serviceTitle,
        service_price: servicePrice,
        service_duration: serviceDuration,
        day,
        time,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
      });
      nav("/success", {
        state: {
          bookingId: booking.id,
          masterName,
          serviceTitle,
          day,
          time,
          servicePrice,
        },
      });
    } catch {
      setError("Ошибка создания записи");
    } finally {
      setSaving(false);
    }
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
          <div style={{ fontWeight: 900 }}>Подтверждение</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="card confirm-card">
          <div className="confirm-title">Подтверждение записи</div>

          <div className="confirm-master">👤 {masterName}</div>

          <div className="confirm-section">
            <div className="confirm-row">
              <span>Мастер</span>
              <b>{masterName || "Загрузка..."}</b>
            </div>

            <div className="confirm-row">
              <span>Услуга</span>
              <b>{serviceTitle || "—"}</b>
            </div>

            <div className="confirm-row">
              <span>Дата</span>
              <b>{day || "—"}</b>
            </div>

            <div className="confirm-row">
              <span>Время</span>
              <b>{time || "—"}</b>
            </div>

            <div className="confirm-row">
              <span>Цена</span>
              <b>{servicePrice} ₸</b>
            </div>
          </div>

          <div className="form">
            <input
              className="input"
              placeholder="Ваше имя"
              value={name}
              maxLength={40}
              onChange={(e) => setName(normalizeName(e.target.value))}
            />

            <input
              className="input"
              placeholder="Телефон"
              inputMode="tel"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(normalizePhone(e.target.value))}
            />
          </div>

          <div className="notice">Оплата производится в салоне</div>

          {error && (
            <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>
              {error}
            </div>
          )}

          <button
            className="big-primary"
            onClick={onSubmit}
            disabled={saving}
            style={{ marginTop: 12 }}
          >
            {saving ? "Создаю..." : "Подтвердить запись"}
          </button>
        </div>
      </div>
    </div>
  );
}
