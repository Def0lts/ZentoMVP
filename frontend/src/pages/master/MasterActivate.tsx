import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { activateMaster } from "../../lib/api";
import { getTelegramId, getTelegramInitData } from "../../lib/telegram";

export default function MasterActivate() {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const telegramId = getTelegramId(1111);
  const initData = getTelegramInitData();

  async function onActivate() {
    try {
      setSaving(true);
      setError(null);

      await activateMaster({
        telegram_id: telegramId,
        init_data: initData,
        code: code.trim(),
      });

      localStorage.setItem("zento_mode", "master");
      nav("/master");
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.includes("invalid_activation_code")) {
        setError("Неверный код активации");
      } else if (msg.includes("master_already_activated")) {
        setError("Этот мастер уже активирован на другом Telegram аккаунте");
      } else if (msg.includes("telegram_already_bound_to_other_master")) {
        setError("Этот Telegram аккаунт уже привязан к другому мастеру");
      } else {
        setError("Не удалось активировать мастер-профиль");
      }
    } finally {
      setSaving(false);
    }
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

          {error && (
            <div className="notice" style={{ marginTop: 10, color: "crimson" }}>
              {error}
            </div>
          )}

          <button
            className="big-primary"
            onClick={onActivate}
            disabled={!code.trim() || saving}
          >
            {saving ? "Активирую..." : "Активировать"}
          </button>

          <span className="small-link">Нет кода? Свяжитесь с нами.</span>
        </div>
      </div>
    </div>
  );
}
