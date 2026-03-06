import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getTelegramUser } from "../lib/telegram";

export default function Profile() {
  const nav = useNavigate();

  const tgUser = getTelegramUser();

  const firstName = tgUser?.first_name ?? "";
  const lastName = tgUser?.last_name ?? "";
  const fullName = `${firstName}${lastName ? " " + lastName : ""}`.trim();

  const name = fullName || "Пользователь";
  const username = tgUser?.username ? `@${tgUser.username}` : "Telegram user";

  return (
    <div className="zento-screen">
      <div className="zento-phone">
        <div className="topbar">
          <div style={{ width: 44 }} />
          <div style={{ fontWeight: 900 }}>Профиль</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="profile-card">
          <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
          <div className="profile-name">{name}</div>
          <div className="profile-phone">{username}</div>

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

            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/favorites")}
            >
              <div className="menu-left">
                <div className="menu-ico">❤️</div>
                <div>
                  <div className="menu-title">Избранные</div>
                </div>
              </div>
              <div style={{ opacity: 0.7, fontWeight: 900 }}>›</div>
            </div>

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

        <BottomNav />
      </div>
    </div>
  );
}
