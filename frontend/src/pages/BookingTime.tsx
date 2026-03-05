import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function BookingTime() {
  const nav = useNavigate();
  const loc = useLocation();
  const data = (loc.state ?? {}) as {
    salonId?: number;
    masterId?: number;
    masterName?: string;
  };

  const [day, setDay] = useState<"today" | "tomorrow" | "other">("today");
  const slots = ["13:45", "14:30", "17:20"]; // пока мок

  if (!data.masterId)
    return <div style={{ padding: 16 }}>Нет данных мастера</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Дата и время</h2>
      <div style={{ marginBottom: 8, opacity: 0.8 }}>
        Мастер: <b>{data.masterName}</b>
      </div>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setDay("today")}>Сегодня</button>
        <button onClick={() => setDay("tomorrow")}>Завтра</button>
        <button onClick={() => setDay("other")}>Другая дата</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {slots.map((t) => (
          <button
            key={t}
            onClick={() =>
              nav("/confirm", {
                state: {
                  salonId: data.salonId,
                  masterId: data.masterId,
                  masterName: data.masterName,
                  day,
                  time: t,
                },
              })
            }
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
