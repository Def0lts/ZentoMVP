import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { getMasterByTelegram, type MasterAccount } from "../../lib/api";
import { getTelegramId } from "../../lib/telegram";

export default function MasterProfile() {
  const nav = useNavigate();
  const telegramId = getTelegramId(1111);

  const [master, setMaster] = useState<MasterAccount | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const data = await getMasterByTelegram(telegramId);
      setMaster(data);

      if (data) {
        localStorage.setItem("zento_mode", "master");
      }
    } catch {
      setMaster(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="zento-screen">
        <div className="zento-phone">
          <div style={{ padding: 16 }}>Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!master) {
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
            <div style={{ fontWeight: 900 }}>Профиль мастера</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16, borderRadius: 26 }}>
            <div style={{ fontWeight: 900 }}>Мастер-профиль не активирован</div>
            <div className="notice" style={{ marginTop: 8 }}>
              Чтобы войти в мастер-кабинет, введи код активации.
            </div>

            <button
              className="big-primary"
              onClick={() => nav("/master/activate")}
            >
              Активировать
            </button>
          </div>

          <BottomNav profilePath="/master" />
        </div>
      </div>
    );
  }

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
          <div className="profile-name">{master.name}</div>

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

          <div className="role-switch">
            <div style={{ fontWeight: 900 }}>Режим:</div>
            <div className="role-pill">
              <button
                onClick={() => {
                  localStorage.setItem("zento_mode", "client");
                  nav("/profile");
                }}
              >
                ⚪ Клиент
              </button>

              <button
                className="active"
                onClick={() => {
                  localStorage.setItem("zento_mode", "master");
                  nav("/master");
                }}
              >
                🟢 Мастер
              </button>
            </div>
          </div>
        </div>

        <BottomNav profilePath="/master" />
      </div>
    </div>
  );
}
