"use client";
import type { Account, Brief } from "../types";

function statusLabel(brief: Brief): { label: string; className: string } {
  if (brief.verdict === "FULFILLED") return { label: "Fulfilled", className: "fulfilled" };
  if (brief.verdict === "BREACHED") return { label: "Breached", className: "breached" };
  if (brief.verdict === "PARTIAL") return { label: "Partial", className: "partial" };
  switch (brief.status) {
    case "draft":
      return { label: "Awaiting signature", className: "" };
    case "locked":
      return { label: "Locked", className: "locked" };
    case "delivered":
      return { label: "Delivered", className: "locked" };
    case "disputed":
      return { label: "Under dispute", className: "locked" };
    case "cancelled":
      return { label: "Cancelled", className: "" };
    case "expired":
      return { label: "Expired", className: "" };
    default:
      return { label: brief.status, className: "" };
  }
}

export default function MyBriefsScreen({
  briefs,
  account,
  onOpen,
  onCreateNew,
}: {
  briefs: Brief[];
  account: Account;
  onOpen: (briefId: string) => void;
  onCreateNew: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
          My briefs
        </h1>
        <button className="btn-primary" onClick={onCreateNew} style={{ padding: "8px 16px", fontSize: 14 }}>
          New brief
        </button>
      </div>

      {briefs.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <p className="text-secondary" style={{ fontSize: 14, margin: "0 0 16px" }}>
            Nothing here yet. Draft a brief or sign one a client sent you.
          </p>
          <button className="btn-primary" onClick={onCreateNew}>Draft a brief</button>
        </div>
      )}

      {briefs.map((brief) => {
        const role = brief.freelancer_address === account.address ? "You're the freelancer" : "You're the client";
        const counterpart =
          brief.freelancer_address === account.address
            ? (brief.client_address ? "Client signed" : "Waiting on client")
            : brief.freelancer_name;
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
            <p className="text-secondary" style={{ fontSize: 13, margin: 0 }}>
              {role} · {counterpart}
            </p>
          </button>
        );
      })}
    </div>
  );
}
