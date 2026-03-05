import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MasterActivate() {
  const [code, setCode] = useState("");
  const nav = useNavigate();

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
          <div style={{ fontWeight: 900 }}>Активация мастера</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.4 }}>
            Доступ к мастер-кабинету предоставляется по коду после согласования.
          </div>

          <div className="form" style={{ marginTop: 12 }}>
            <input
              className="input"
              placeholder="Введите код"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <button
            className="big-primary"
            onClick={() => nav("/master")}
            disabled={!code.trim()}
          >
            Активировать
          </button>

          <span className="small-link">Нет кода? Свяжитесь с нами.</span>
        </div>

        {/* BottomNav тут не нужен */}
      </div>
    </div>
  );
}
