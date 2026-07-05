"use client";
import { useEffect, useState } from "react";
import type { Brief } from "../types";
import { getRecentBriefs } from "../lib/contract";

function statusLabel(brief: Brief): { label: string; className: string } {
  if (brief.verdict === "FULFILLED") return { label: "Fulfilled", className: "fulfilled" };
  if (brief.verdict === "BREACHED") return { label: "Breached", className: "breached" };
  if (brief.verdict === "PARTIAL") return { label: "Partial", className: "partial" };
  switch (brief.status) {
    case "locked":
      return { label: "Locked", className: "locked" };
    case "delivered":
      return { label: "Delivered", className: "locked" };
    case "disputed":
      return { label: "Under dispute", className: "locked" };
    case "expired":
      return { label: "Expired", className: "" };
    default:
      return { label: brief.status, className: "" };
  }
}

function truncate(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ExploreScreen({ onOpen }: { onOpen: (briefId: string) => void }) {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getRecentBriefs(20);
        if (!cancelled) setBriefs(result);
      } catch {
        if (!cancelled) setError("Could not load the public feed right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Explore
        </h1>
        <p className="text-secondary" style={{ fontSize: 14, margin: 0 }}>
          Signed briefs from everyone using ScopeGuard, most recent first.
        </p>
      </div>

      {loading && <p className="text-secondary" style={{ fontSize: 14 }}>Loading...</p>}
      {error && <p style={{ color: "var(--breached)", fontSize: 14 }}>{error}</p>}

      {!loading && !error && briefs.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <p className="text-secondary" style={{ fontSize: 14, margin: 0 }}>
            No signed briefs yet. Be the first.
          </p>
        </div>
      )}

      {briefs.map((brief) => {
        const meta = statusLabel(brief);
        return (
          <button
            key={brief.brief_id}
            onClick={() => onOpen(brief.brief_id)}
            className="card"
            style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p className="text-muted mono" style={{ fontSize: 11, margin: "0 0 4px" }}>{brief.brief_id}</p>
                <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{brief.title}</p>
              </div>
              <span className={`status-pill ${meta.className}`}>{meta.label}</span>
            </div>
            <p className="text-secondary mono" style={{ fontSize: 12, margin: 0 }}>
              {brief.freelancer_name} · {truncate(brief.client_address)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
