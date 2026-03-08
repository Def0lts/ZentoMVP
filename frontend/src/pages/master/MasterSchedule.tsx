import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import {
  blockSlot,
  getBlockedSlots,
  getMasterByTelegram,
  unblockSlot,
  type BlockedSlot,
  type MasterAccount,
} from "../../lib/api";
import { getTelegramId } from "../../lib/telegram";

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MasterSchedule() {
  const nav = useNavigate();
  const telegramId = getTelegramId(1111);

  const [master, setMaster] = useState<MasterAccount | null>(null);
  const [blockDay, setBlockDay] = useState(getTodayDate());
  const [blockTime, setBlockTime] = useState("15:00");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  async function loadBlocked() {
    try {
      setLoadingBlocked(true);

      const m = await getMasterByTelegram(telegramId);
      if (!m) {
        setMaster(null);
        setBlocked([]);
        return;
      }

      localStorage.setItem("zento_mode", "master");
      setMaster(m);

      const data = await getBlockedSlots({
        master_id: m.id,
        day: blockDay,
      });

      data.sort((a, b) => a.time.localeCompare(b.time));
      setBlocked(data);
    } finally {
      setLoadingBlocked(false);
    }
  }

  useEffect(() => {
    loadBlocked();
  }, [blockDay]);

  if (!loadingBlocked && !master) {
    return (
      <div className="zento-screen">
        <div className="zento-phone">
          <div className="topbar">
            <button
              className="pill"
              onClick={() => nav("/master")}
              style={{ cursor: "pointer" }}
            >
              ←
            </button>
            <div style={{ fontWeight: 900 }}>График</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="card" style={{ padding: 16, borderRadius: 26 }}>
            <div style={{ fontWeight: 900 }}>Мастер не активирован</div>
            <div className="notice" style={{ marginTop: 8 }}>
              Сначала активируй мастер-профиль по коду.
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
            onClick={() => nav("/master")}
            style={{ cursor: "pointer" }}
          >
            ←
          </button>
          <div style={{ fontWeight: 900 }}>График</div>
          <button
            className="pill"
            onClick={loadBlocked}
            style={{ cursor: "pointer" }}
          >
            ↻
          </button>
        </div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Занять время</div>
          <div className="notice">
            Используй, если запись пришла через WhatsApp или клиент записался
            лично.
          </div>

          <div className="form">
            <input
              className="input"
              type="date"
              value={blockDay}
              onChange={(e) => setBlockDay(e.target.value)}
            />
            <input
              className="input"
              type="time"
              value={blockTime}
              onChange={(e) => setBlockTime(e.target.value)}
            />
          </div>

          <button
            className="big-primary"
            disabled={busy || !master || !blockDay || !blockTime}
            onClick={async () => {
              if (!master) return;

              try {
                setBusy(true);
                setMsg(null);

                await blockSlot({
                  master_id: master.id,
                  day: blockDay,
                  time: blockTime,
                });

                await loadBlocked();
                setMsg("Слот занят ✅");
              } catch {
                setMsg("Ошибка: не удалось занять слот");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Занимаю..." : "Занять"}
          </button>

          {msg && (
            <div className="notice" style={{ marginTop: 10 }}>
              {msg}
            </div>
          )}
        </div>

        <div className="section-title">Заблокированные слоты</div>

        {loadingBlocked && (
          <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>
        )}

        {!loadingBlocked && blocked.length === 0 && (
          <div style={{ padding: 8, opacity: 0.75 }}>
            На этот день блокировок нет
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {blocked.map((s) => (
            <div key={s.id} className="menu-item">
              <div className="menu-left">
                <div className="menu-ico">⛔</div>
                <div>
                  <div className="menu-title">{s.time}</div>
                  <div className="menu-sub">{s.day}</div>
                </div>
              </div>

              <button
                className="btn-ghost"
                disabled={busy || !master}
                onClick={async () => {
                  if (!master) return;

                  try {
                    setBusy(true);
                    setMsg(null);

                    await unblockSlot({
                      master_id: master.id,
                      day: s.day,
                      time: s.time,
                    });

                    setMsg(`Слот ${s.time} освобождён ✅`);
                    await loadBlocked();
                  } catch {
                    setMsg("Ошибка: не удалось освободить слот");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Освободить
              </button>
            </div>
          ))}
        </div>

        <BottomNav profilePath="/master" />
      </div>
    </div>
  );
}
