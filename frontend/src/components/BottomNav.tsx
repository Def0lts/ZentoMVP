import { useLocation, useNavigate } from "react-router-dom";

import { Home, User } from "lucide-react";

type Props = {
  homePath?: string;
  profilePath?: string;
};

function getSavedMode(): "client" | "master" {
  const raw = localStorage.getItem("zento_mode");
  return raw === "master" ? "master" : "client";
}

export default function BottomNav({ homePath = "/", profilePath }: Props) {
  const nav = useNavigate();
  const loc = useLocation();

  const mode = getSavedMode();

  const resolvedProfilePath =
    profilePath ?? (mode === "master" ? "/master" : "/profile");

  const onHome = loc.pathname === homePath;

  const onProfile =
    resolvedProfilePath === "/master"
      ? loc.pathname === "/master" || loc.pathname.startsWith("/master/")
      : loc.pathname === "/profile" ||
        loc.pathname.startsWith("/profile") ||
        loc.pathname.startsWith("/my-bookings") ||
        loc.pathname.startsWith("/favorites") ||
        loc.pathname.startsWith("/support") ||
        loc.pathname.startsWith("/about");

  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        <div
          className={`nav-item ${onHome ? "active" : ""}`}
          onClick={() => nav("/")}
        >
          <Home size={22} />
          <span>Главная</span>
        </div>

        <div
          className={`nav-item ${onProfile ? "active" : ""}`}
          onClick={() => nav("/profile")}
        >
          <User size={22} />
          <span>Профиль</span>
        </div>
      </div>
    </div>
  );
}
