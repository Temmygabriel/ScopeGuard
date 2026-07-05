"use client";
import { useCallback, useEffect, useState } from "react";
import type { Account, Brief } from "../types";
import { getBrief, cancelBrief, acceptDelivery } from "../lib/contract";

function formatDate(ms: string) {
  const n = Number(ms);
  if (!n) return "—";
  return new Date(n).toLocaleString();
}

function statusMeta(brief: Brief): { label: string; className: string } {
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

export default function BriefDetail({
  account,
  briefId,
  onBack,
  onSubmitDelivery,
  onSubmitDispute,
  onJudging,
}: {
  account: Account;
  briefId: string;
  onBack: () => void;
  onSubmitDelivery: (briefId: string) => void;
  onSubmitDispute: (briefId: string) => void;
  onJudging: (briefId: string) => void;
}) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const b = await getBrief(briefId);
      setBrief(b);
    } catch {
      setLoadError("Could not load this brief.");
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCancel() {
    setActionLoading(true);
    setActionError("");
    try {
      await cancelBrief(account, briefId);
      await refresh();
    } catch {
      setActionError("Could not cancel this brief. Try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    setActionLoading(true);
    setActionError("");
    try {
      await acceptDelivery(account, briefId);
      await refresh();
    } catch {
      setActionError("Could not accept delivery. Try again.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleCopyLink() {
    const link = `${window.location.origin}${window.location.pathname}?brief=${briefId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-secondary" style={{ paddingTop: 24, fontSize: 14 }}>Loading brief...</p>;
  }

  if (loadError || !brief) {
    return (
      <div style={{ paddingTop: 24 }}>
        <p style={{ color: "var(--breached)", fontSize: 14 }}>{loadError}</p>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: 16 }}>Back</button>
      </div>
    );
  }

  const isFreelancer = brief.freelancer_address === account.address;
  const isClient = brief.client_address === account.address;
  const meta = statusMeta(brief);
  const isResolved = brief.status === "resolved" || brief.status === "fulfilled";
  const isDim = brief.status === "draft" || brief.status === "cancelled" || brief.status === "expired";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <button className="btn-secondary" onClick={onBack} style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 13 }}>
        Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className={`seal ${isResolved ? "cracked" : ""}`} style={{ opacity: isDim ? 0.35 : 1 }}>
          <div className="seal-mark" />
        </div>
        <div>
          <p className="text-muted mono" style={{ fontSize: 12, margin: "0 0 4px" }}>{brief.brief_id}</p>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{brief.title}</h1>
        </div>
      </div>

      <span className={`status-pill ${meta.className}`} style={{ alignSelf: "flex-start" }}>
        {meta.label}
      </span>

      {isResolved && (
        <div>
          <div className={`verdict-word ${meta.className}`}>{meta.label}</div>
          {brief.reasoning && (
            <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
              {brief.reasoning}
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>What counts as done</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{brief.deliverables_text}</p>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Price</p>
            <p style={{ fontSize: 14, margin: 0 }}>{brief.price}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Delivery by</p>
            <p style={{ fontSize: 14, margin: 0 }}>{formatDate(brief.deadline)}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Freelancer</p>
            <p style={{ fontSize: 14, margin: 0 }}>{brief.freelancer_name}</p>
          </div>
        </div>
      </div>

      {(brief.status === "delivered" || brief.status === "disputed" || isResolved) && brief.delivery_text && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>Delivery</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{brief.delivery_text}</p>
          {brief.delivery_link && (
            <a href={brief.delivery_link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--ink)" }}>
              {brief.delivery_link}
            </a>
          )}
        </div>
      )}

      {(brief.status === "disputed" || isResolved) && brief.dispute_text && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>Dispute</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{brief.dispute_text}</p>
          {brief.dispute_link && (
            <a href={brief.dispute_link} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--ink)" }}>
              {brief.dispute_link}
            </a>
          )}
        </div>
      )}

      {actionError && <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{actionError}</p>}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {isFreelancer && brief.status === "draft" && (
          <>
            <button className="btn-secondary" onClick={handleCopyLink}>{copied ? "Copied" : "Copy sign link"}</button>
            <button className="btn-secondary" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? "Cancelling..." : "Cancel brief"}
            </button>
          </>
        )}

        {isFreelancer && brief.status === "locked" && (
          <button className="btn-primary" onClick={() => onSubmitDelivery(briefId)}>
            Submit delivery
          </button>
        )}

        {isClient && brief.status === "delivered" && (
          <>
            <button className="btn-primary" onClick={handleAccept} disabled={actionLoading}>
              {actionLoading ? "Accepting..." : "Accept delivery"}
            </button>
            <button className="btn-secondary" onClick={() => onSubmitDispute(briefId)} disabled={actionLoading}>
              Dispute
            </button>
          </>
        )}

        {(isFreelancer || isClient) && brief.status === "disputed" && (
          <button className="btn-primary" onClick={() => onJudging(briefId)}>
            Get AI verdict
          </button>
        )}
      </div>
    </div>
  );
}
