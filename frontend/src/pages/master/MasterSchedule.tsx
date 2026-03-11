import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import {
  blockSlotRange,
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
  const [fromTime, setFromTime] = useState("15:00");
  const [toTime, setToTime] = useState("16:00");
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
        await blockSlotRange({
          master_id: master.id,
          day: blockDay,
          from_time: time,
          to_time: time,
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

  async function blockRange() {
    if (!master) return;

    const fromIndex = timeGrid.indexOf(fromTime);
    const toIndex = timeGrid.indexOf(toTime);

    if (fromIndex === -1 || toIndex === -1) {
      setMsg("Ошибка: выбрано неверное время");
      return;
    }

    if (fromIndex > toIndex) {
      setMsg("Время 'с' не может быть позже времени 'до'");
      return;
    }

    try {
      setBusy(true);
      setMsg(null);

      const result = await blockSlotRange({
        master_id: master.id,
        day: blockDay,
        from_time: fromTime,
        to_time: toTime,
      });

      await loadBlocked();

      setMsg(
        result.created > 0
          ? `Заблокировано слотов: ${result.created} ✅`
          : "Новые слоты не были добавлены",
      );
    } catch {
      setMsg("Ошибка: не удалось занять диапазон");
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

        <div className="section-title">Заблокировать диапазон</div>

        <div className="card" style={{ padding: 16, borderRadius: 26 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            Блокировка по диапазону
          </div>
          <div className="notice">
            Укажи время начала и конца только по сетке 30 минут.
          </div>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 12,
            }}
          >
            <label style={{ fontSize: 13, fontWeight: 700 }}>
              С
              <select
                className="input"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                style={{ marginTop: 6 }}
              >
                {timeGrid.map((time) => (
                  <option key={`from-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 13, fontWeight: 700 }}>
              До
              <select
                className="input"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                style={{ marginTop: 6 }}
              >
                {timeGrid.map((time) => (
                  <option key={`to-${time}`} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="big-primary"
            disabled={busy || !master || !blockDay}
            onClick={blockRange}
          >
            {busy ? "Блокирую..." : "Заблокировать диапазон"}
          </button>

          {msg && (
            <div className="notice" style={{ marginTop: 10 }}>
              {msg}
            </div>
          )}
        </div>

        <BottomNav profilePath="/master" />
      </div>
    </div>
  );
}
