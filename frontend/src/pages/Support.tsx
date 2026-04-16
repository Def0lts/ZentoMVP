import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function Support() {
  const nav = useNavigate();
  const handleSupport = () => {
    window.open("https://t.me/Def0lt_s", "_blank");
  };

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
          <div style={{ fontWeight: 900 }}>Поддержка</div>
          <div style={{ width: 44 }} />
        </div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Есть вопрос?</div>
          <div className="notice">
            Напиши нам — ответим в течение рабочего дня.
          </div>

          <button className="btn-primary" onClick={handleSupport}>
            💬 Написать в поддержку
          </button>

          <div className="faq">
            <details>
              <summary>Как записаться?</summary>
              <div className="ans">
                Выберите услугу → день → время → подтвердите запись.
              </div>
            </details>

            <details>
              <summary>Как отменить запись?</summary>
              <div className="ans">
                Отменить можно не позднее чем за 24 часа.
              </div>
            </details>

            <details>
              <summary>Почему нет свободного времени?</summary>
              <div className="ans">
                Слоты заняты или график мастера не настроен.
              </div>
            </details>

            <details>
              <summary>Что делать, если мастер не отвечает?</summary>
              <div className="ans">
                Напишите в поддержку — поможем связаться.
              </div>
            </details>

            <details>
              <summary>Как стать мастером?</summary>
              <div className="ans">
                Профиль → режим “Мастер” → введите код активации.
              </div>
            </details>
          </div>
        </div>

        {/* BottomNav — это профильная зона */}
        <BottomNav />
      </div>
    </div>
  );
}
