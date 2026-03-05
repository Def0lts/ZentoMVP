import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  const nav = useNavigate();

  // позже подтянем имя/телефон из Telegram Mini App
  const name = "Анастасия";
  const phone = "+111 11 1111";

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <div style={{ width: 44 }} />
          <div style={{ fontWeight: 900 }}>Профиль</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="profile-card">
          <div className="avatar" />
          <div className="profile-name">{name}</div>
          <div className="profile-phone">{phone}</div>

          <div className="menu">
            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/my-bookings")}
            >
              <div className="menu-left">
                <div className="menu-ico">📅</div>
                <div>
                  <div className="menu-title">Мои записи</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>

            {/* Избранное можно позже, пока не показываем */}
            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/support")}
            >
              <div className="menu-left">
                <div className="menu-ico">💬</div>
                <div>
                  <div className="menu-title">Поддержка</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>

            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/about")}
            >
              <div className="menu-left">
                <div className="menu-ico">ℹ️</div>
                <div>
                  <div className="menu-title">О сервисе</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>
          </div>

          <div className="role-switch">
            <div style={{ fontWeight: 900 }}>Режим:</div>
            <div className="role-pill">
              <button className="active" onClick={() => nav("/profile")}>
                🟢 Клиент
              </button>
              <button onClick={() => nav("/master/activate")}>⚪ Мастер</button>
            </div>
          </div>
        </div>

        {/* BottomNav как в макете */}
        <BottomNav />
      </div>
    </div>
  );
}
