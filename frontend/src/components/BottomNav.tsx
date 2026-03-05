import { useLocation, useNavigate } from "react-router-dom";

type Props = {
  homePath?: string;
  profilePath?: string;
};

export default function BottomNav({
  homePath = "/",
  profilePath = "/profile",
}: Props) {
  const nav = useNavigate();
  const loc = useLocation();

  const onHome = loc.pathname === homePath;
  const onProfile =
    loc.pathname === profilePath ||
    loc.pathname.startsWith("/profile") ||
    loc.pathname.startsWith("/my-bookings");

  return (
    <div className="bottom-nav-wrap">
      <div className="bottom-nav">
        <button
          className={`bottom-btn ${onHome ? "" : ""}`}
          onClick={() => nav(homePath)}
          aria-label="Home"
        >
          🏠
        </button>
        <button
          className={`bottom-btn secondary ${onProfile ? "" : ""}`}
          onClick={() => nav(profilePath)}
          aria-label="Profile"
        >
          👤
        </button>
      </div>
    </div>
  );
}
