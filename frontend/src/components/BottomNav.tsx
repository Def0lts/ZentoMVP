import { useLocation, useNavigate } from "react-router-dom";

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
        <button
          className={`bottom-btn ${onHome ? "active" : ""}`}
          onClick={() => nav(homePath)}
          aria-label="Home"
        >
          🏠
        </button>

        <button
          className={`bottom-btn secondary ${onProfile ? "active" : ""}`}
          onClick={() => nav(resolvedProfilePath)}
          aria-label="Profile"
        >
          👤
        </button>
      </div>
    </div>
  );
}
