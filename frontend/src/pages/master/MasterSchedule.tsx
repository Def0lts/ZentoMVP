import { useEffect, useState } from "react";
import {
  blockSlot,
  getBlockedSlots,
  unblockSlot,
  type BlockedSlot,
} from "../../lib/api";
import { useNavigate } from "react-router-dom";

export default function MasterSchedule() {
  const nav = useNavigate();
  const masterId = 101;

  const [blockDay, setBlockDay] = useState("2026-03-05");
  const [blockTime, setBlockTime] = useState("15:00");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  async function loadBlocked() {
    try {
      setLoadingBlocked(true);
      const data = await getBlockedSlots({
        master_id: masterId,
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
              value={blockDay}
              onChange={(e) => setBlockDay(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
            <input
              className="input"
              value={blockTime}
              onChange={(e) => setBlockTime(e.target.value)}
              placeholder="HH:MM"
            />
          </div>

          <button
            className="big-primary"
            disabled={busy}
            onClick={async () => {
              try {
                setBusy(true);
                setMsg(null);
                await blockSlot({
                  master_id: masterId,
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
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    setMsg(null);
                    await unblockSlot({
                      master_id: masterId,
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

        {/* BottomNav тут не нужен */}
      </div>
    </div>
  );
}
