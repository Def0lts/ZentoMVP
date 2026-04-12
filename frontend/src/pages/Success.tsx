import { useLocation, useNavigate } from "react-router-dom";

export default function Success() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state ?? {}) as {
    bookingId?: number;
    masterName?: string;
    serviceTitle?: string;
    day?: string;
    time?: string;
    servicePrice?: number;
  };

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button
            className="pill"
            onClick={() => nav("/")}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Готово</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div className="success-check">✅</div>
          <div className="page-title">Запись создана</div>

          <div
            className="center"
            style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.4 }}
          >
            Мы отправили детали мастеру. <br />
            Статус смотри в “Мои записи”.
          </div>

          <div className="success-details">
            <div className="success-row">
              <span>Мастер</span>
              <b>{state.masterName}</b>
            </div>

            <div className="success-row">
              <span>Услуга</span>
              <b>{state.serviceTitle}</b>
            </div>

            <div className="success-row">
              <span>Дата</span>
              <b>{state.day}</b>
            </div>

            <div className="success-row">
              <span>Время</span>
              <b>{state.time}</b>
            </div>

            {state.servicePrice && (
              <div className="success-row">
                <span>Цена</span>
                <b>{state.servicePrice} ₸</b>
              </div>
            )}
          </div>

          {state.bookingId && (
            <div
              className="center"
              style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}
            >
              Номер заявки: <b>{state.bookingId}</b>
            </div>
          )}

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <button className="big-primary" onClick={() => nav("/my-bookings")}>
              Мои записи
            </button>
            <button className="btn-ghost" onClick={() => nav("/")}>
              На главную
            </button>
          </div>
        </div>

        {/* BottomNav тут тоже не нужен */}
      </div>
    </div>
  );
}
