import { useEffect, useMemo, useState } from "react";
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

function generateTimeGrid(start = "10:00", end = "20:00", stepMin = 30) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const items: string[] = [];
  for (let t = startMinutes; t <= endMinutes; t += stepMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    items.push(`${hh}:${mm}`);
  }

  return items;
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

  const timeGrid = useMemo(() => generateTimeGrid("10:00", "20:00", 30), []);

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

  async function toggleGridSlot(time: string) {
    if (!master) return;

    const existing = blocked.find((s) => s.time === time);

    try {
      setBusy(true);
      setMsg(null);

      if (existing) {
        await unblockSlot({
          master_id: master.id,
          day: blockDay,
          time,
        });
        setMsg(`Слот ${time} освобождён ✅`);
      } else {
        await blockSlot({
          master_id: master.id,
          day: blockDay,
          time,
        });
        setMsg(`Слот ${time} занят ✅`);
      }

      await loadBlocked();
    } catch {
      setMsg("Ошибка: не удалось изменить слот");
    } finally {
      setBusy(false);
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
          <div style={{ fontWeight: 900, fontSize: 14 }}>Дата расписания</div>

          <div className="form" style={{ marginTop: 10 }}>
            <input
              className="input"
              type="date"
              value={blockDay}
              onChange={(e) => setBlockDay(e.target.value)}
            />
          </div>

          <div className="notice" style={{ marginTop: 8 }}>
            Нажми на слот в сетке:
            <br />• свободный слот → занять
            <br />• занятый вручную слот → освободить
          </div>
        </div>

        <div className="section-title">Сетка дня</div>

        {loadingBlocked && (
          <div style={{ padding: 8, opacity: 0.8 }}>Загрузка...</div>
        )}

        <div
          className="card"
          style={{
            padding: 14,
            borderRadius: 26,
            display: "grid",
            gap: 10,
          }}
        >
          {timeGrid.map((time) => {
            const isBlocked = blocked.some((s) => s.time === time);

            return (
              <button
                key={time}
                disabled={busy || !master}
                onClick={() => toggleGridSlot(time)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  border: "1px solid rgba(16,24,40,0.12)",
                  borderRadius: 16,
                  padding: "12px 14px",
                  background: isBlocked
                    ? "rgba(255, 99, 132, 0.12)"
                    : "rgba(255,255,255,0.92)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span>{time}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: isBlocked ? "#b42318" : "#067647",
                  }}
                >
                  {isBlocked ? "⛔ Заблокировано" : "✅ Свободно"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="section-title">Ручная блокировка</div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            Занять время вручную
          </div>
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
