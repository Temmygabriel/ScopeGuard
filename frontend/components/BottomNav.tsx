"use client";
import type { Screen } from "../types";

const ITEMS: { id: Screen; label: string }[] = [
  { id: "landing", label: "Home" },
  { id: "my_briefs", label: "Mine" },
  { id: "explore", label: "Explore" },
  { id: "profile", label: "Profile" },
];

function Icon({ id, active }: { id: Screen; active: boolean }) {
  const color = active ? "var(--accent)" : "var(--text-3)";
  const common = { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none" as const };
  if (id === "landing") {
    return (
      <svg {...common}>
        <path d="M3 9L10 3l7 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8v8h10V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (id === "my_briefs") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="12" height="14" rx="1.5" stroke={color} strokeWidth="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "explore") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
        <path d="M13 7l-2 5-4 1 2-5 4-1z" fill={color} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="10" cy="7" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M4 17c1-3.5 4-5 6-5s5 1.5 6 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BottomNav({
  screen,
  onNavigate,
}: {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <nav
      className="bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        justifyContent: "space-around",
        padding: "10px 0 14px",
        zIndex: 10,
      }}
    >
      {ITEMS.map((item) => {
        const active = screen === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
            }}
          >
            <Icon id={item.id} active={active} />
            <span
              style={{
                fontSize: 11,
                color: active ? "var(--accent)" : "var(--text-3)",
                fontWeight: 500,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
