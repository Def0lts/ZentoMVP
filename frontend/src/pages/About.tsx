import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function About() {
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
          <div style={{ fontWeight: 900 }}>О сервисе</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Zento</div>
          <div className="notice" style={{ marginTop: 6 }}>
            Сервис быстрой онлайн-записи к мастерам в вашем городе. Помогаем
            найти свободные слоты и записаться за пару кликов.
          </div>

          <div style={{ marginTop: 14, fontWeight: 900 }}>Правила отмены</div>
          <div className="notice">
            Отмена возможна не позднее чем за <b>24 часа</b> до записи. При
            частых отменах доступ может быть временно ограничен.
          </div>

          <div style={{ marginTop: 14, fontWeight: 900 }}>Безопасность</div>
          <div className="notice">
            Данные нужны только для связи мастера с клиентом. Оплата происходит
            в салоне.
          </div>

          <div
            style={{
              marginTop: 14,
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 12,
            }}
          >
            Версия 1.0 (MVP)
          </div>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
