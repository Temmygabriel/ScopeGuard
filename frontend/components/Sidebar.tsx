"use client";
import type { Screen } from "../types";

const ITEMS: { id: Screen; label: string }[] = [
  { id: "landing", label: "Home" },
  { id: "my_briefs", label: "Mine" },
  { id: "explore", label: "Explore" },
  { id: "profile", label: "Profile" },
];

export default function Sidebar({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <aside
      className="sidebar"
      style={{
        flexDirection: "column",
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "32px 16px",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px 28px" }}>
        <div className="seal" style={{ width: 28, height: 28 }}>
          <div className="seal-mark" style={{ width: 10, height: 10 }} />
        </div>
        <span className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>
          ScopeGuard
        </span>
      </div>

      {ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              background: active ? "var(--surface)" : "transparent",
              border: "none",
              borderRadius: "var(--r-sm)",
              color: active ? "var(--text-1)" : "var(--text-2)",
              fontWeight: active ? 500 : 400,
              fontSize: 15,
              textAlign: "left",
              padding: "10px 12px",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </aside>
  );
}
