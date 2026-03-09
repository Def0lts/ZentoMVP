import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../lib/api";

type DayTab = "today" | "tomorrow" | "other";

function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Booking() {
  const nav = useNavigate();
  const { salonId } = useParams();
  const loc = useLocation();
  const qp = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const masterId = Number(qp.get("masterId") || 0);
  const masterName = qp.get("masterName") || "";

  const serviceId = Number(qp.get("serviceId") || 0);
  const serviceTitle = qp.get("serviceTitle") || "";
  const servicePrice = Number(qp.get("servicePrice") || 0);
  const serviceDuration = Number(qp.get("serviceDuration") || 0);

  if (!masterId || !serviceId) {
    return (
      <div className="zento-screen">
        <div className="zento-phone">
          <div className="topbar">
            <button className="pill" onClick={() => nav(-1)}>
              ←
            </button>
            <div style={{ fontWeight: 900 }}>Запись</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900 }}>
              Сначала выберите мастера и услугу
            </div>

            <button
              className="big-primary"
              onClick={() => nav(`/salons/${salonId}/masters`)}
            >
              Выбрать
            </button>
          </div>
        </div>
      </div>
    );
  }

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const [tab, setTab] = useState<DayTab>("today");
  const [day, setDay] = useState(fmtDate(today));

  const [free, setFree] = useState<string[]>([]);
  const [busy, setBusy] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  async function load() {
    const res = await fetch(
      `${API_BASE}/slots/free?master_id=${masterId}&day=${day}&service_id=${serviceId}`,
    );
    const data = await res.json();

    setFree(data.free);
    setBusy(data.busy);
  }

  useEffect(() => {
    load();
    setSelectedTime(null);
  }, [day, masterId]);

  function pickTab(next: DayTab) {
    setTab(next);

    if (next === "today") setDay(fmtDate(today));
    if (next === "tomorrow") setDay(fmtDate(tomorrow));

    if (next === "other") {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDay(fmtDate(d));
    }
  }

  function goNext() {
    if (!selectedTime) return;

    nav(
      `/confirm?salonId=${salonId}` +
        `&masterId=${masterId}` +
        `&masterName=${encodeURIComponent(masterName)}` +
        `&serviceId=${serviceId}` +
        `&serviceTitle=${encodeURIComponent(serviceTitle)}` +
        `&servicePrice=${servicePrice}` +
        `&serviceDuration=${serviceDuration}` +
        `&day=${day}` +
        `&time=${selectedTime}`,
    );
  }

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button className="pill" onClick={() => nav(-1)}>
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Выберите дату и время</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="notice">
          <div>
            Мастер: <b>{masterName}</b>
          </div>

          <div>
            Услуга: <b>{serviceTitle}</b> • {servicePrice} ₸
          </div>

          <div>
            Длительность: <b>{serviceDuration} мин</b>
          </div>
        </div>

        <div className="segment">
          <button
            className={tab === "today" ? "active" : ""}
            onClick={() => pickTab("today")}
          >
            Сегодня
          </button>

          <button
            className={tab === "tomorrow" ? "active" : ""}
            onClick={() => pickTab("tomorrow")}
          >
            Завтра
          </button>

          <button
            className={tab === "other" ? "active" : ""}
            onClick={() => pickTab("other")}
          >
            Другая дата
          </button>
        </div>

        <div className="slot-box">
          <div className="slots">
            {busy.map((t) => (
              <button key={t} className="slot disabled">
                {t}
              </button>
            ))}

            {free.map((t) => (
              <button
                key={t}
                className={`slot ${selectedTime === t ? "selected" : ""}`}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          className="big-primary"
          onClick={goNext}
          disabled={!selectedTime}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
