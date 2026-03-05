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

  const masterIdFromLink = Number(qp.get("masterId") || 0);

  if (!masterIdFromLink) {
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
            <div style={{ fontWeight: 900 }}>Запись</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16, borderRadius: 26 }}>
            <div style={{ fontWeight: 900 }}>Сначала выберите мастера</div>
            <div className="notice" style={{ marginTop: 6 }}>
              Для записи нужно выбрать специалиста.
            </div>
            <button
              className="big-primary"
              onClick={() => nav(`/salons/${salonId}/masters`)}
            >
              Выбрать мастера
            </button>
          </div>
        </div>
      </div>
    );
  }

  const masterId = masterIdFromLink;

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
      `${API_BASE}/slots/free?master_id=${masterId}&day=${day}`,
    );
    const data = await res.json();
    setFree(data.free);
    setBusy(data.busy);
  }

  useEffect(() => {
    load();
    // сбрасываем выбранный слот при смене дня
    setSelectedTime(null);
  }, [day, masterId]);

  function pickTab(next: DayTab) {
    setTab(next);
    if (next === "today") setDay(fmtDate(today));
    if (next === "tomorrow") setDay(fmtDate(tomorrow));
    if (next === "other") {
      // пока просто +2 дня, чтобы не ломать MVP
      const d = new Date();
      d.setDate(d.getDate() + 2);
      setDay(fmtDate(d));
    }
  }

  function goNext() {
    if (!selectedTime) return;
    nav(
      `/confirm?salonId=${salonId}&masterId=${masterId}&day=${day}&time=${selectedTime}`,
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
          <div style={{ fontWeight: 900 }}>Запись</div>
          <button
            className="pill"
            onClick={() => {
              const url = `${window.location.origin}/booking/${salonId}?masterId=${masterId}`;
              navigator.clipboard.writeText(url);
              alert("Ссылка на запись скопирована");
            }}
            style={{ cursor: "pointer" }}
          >
            🔗
          </button>
        </div>

        <div className="page-title">Выберите дату и время</div>

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
          <div style={{ fontWeight: 900, fontSize: 13 }}>Свободные окна</div>
          <div className="notice">
            День: <b>{day}</b>
          </div>

          <div className="slots">
            {busy.map((t) => (
              <button key={`busy-${t}`} className="slot disabled" disabled>
                {t}
              </button>
            ))}
            {free.map((t) => (
              <button
                key={`free-${t}`}
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

        {/* BottomNav здесь НЕ надо — это шаг оформления записи */}
      </div>
    </div>
  );
}
