import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { getTelegramUser } from "../lib/telegram";

import { Calendar, Heart, MessageCircle, Info } from "lucide-react";

export default function Profile() {
  const nav = useNavigate();

  useEffect(() => {
    localStorage.setItem("zento_mode", "client");
  }, []);

  const tgUser = getTelegramUser();
  const photo = (tgUser as any)?.photo_url;
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <img
              src={photo || "/default-avatar.png"}
              alt="avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",

                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              }}
            />
            <div className="profile-name" style={{ fontWeight: 700 }}>
              {name}
            </div>
            <div className="profile-phone" style={{ opacity: 0.6 }}>
              {username}
            </div>
          </div>
          <div className="menu">
            <div
              className="menu-item"
              role="button"
              tabIndex={0}
              onClick={() => nav("/my-bookings")}
            >
              <div className="menu-left">
                <div className="menu-ico">
                  <Calendar size={18} />
                </div>

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
                <div className="menu-ico">
                  <Heart size={18} />
                </div>

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
                <div className="menu-ico">
                  <MessageCircle size={18} />
                </div>

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
                <div className="menu-ico">
                  <Info size={18} />
                </div>

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
              <button
                className="active"
                onClick={() => {
                  localStorage.setItem("zento_mode", "client");
                  nav("/profile");
                }}
              >
                🟢 Клиент
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("zento_mode", "master");
                  nav("/master");
                }}
              >
                ⚪ Мастер
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
