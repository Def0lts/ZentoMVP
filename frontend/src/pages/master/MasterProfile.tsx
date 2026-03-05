import { useNavigate } from "react-router-dom";

export default function MasterProfile() {
  const nav = useNavigate();

  const name = "Beuty_salon";

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <button
            className="pill"
            onClick={() => nav("/profile")}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>Профиль</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="profile-card">
          <div className="avatar" />
          <div className="profile-name">{name}</div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="badge-green">💚 Аккаунт активен</div>
          </div>

          <div className="menu">
            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/master/requests")}
            >
              <div className="menu-left">
                <div className="menu-ico">🧾</div>
                <div>
                  <div className="menu-title">Заявки</div>
                  <div className="menu-sub">Новые и подтвержденные</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>

            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/master/schedule")}
            >
              <div className="menu-left">
                <div className="menu-ico">🗓️</div>
                <div>
                  <div className="menu-title">График работы</div>
                  <div className="menu-sub">Настройка часов и дней</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>
          </div>
        </div>

        {/* BottomNav тут не нужен — мастерский режим */}
      </div>
    </div>
  );
}
