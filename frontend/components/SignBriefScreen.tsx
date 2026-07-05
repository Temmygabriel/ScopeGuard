"use client";
import { useEffect, useState } from "react";
import type { Account, Brief } from "../types";
import { getBrief, signBrief } from "../lib/contract";

export default function SignBriefScreen({
  account,
  briefId,
  onSigned,
  onDone,
}: {
  account: Account;
  briefId: string;
  onSigned: () => void;
  onDone: () => void;
}) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await getBrief(briefId);
        if (!cancelled) setBrief(b);
      } catch {
        if (!cancelled) setLoadError("This brief doesn't exist, or the link is wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [briefId]);

  async function handleSign() {
    setSigning(true);
    setSignError("");
    try {
      await signBrief(account, briefId);
      onSigned();
    } catch {
      setSignError("Signing didn't go through. Check your connection and try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 24 }}>
        <p className="text-secondary" style={{ fontSize: 14 }}>Loading brief...</p>
      </div>
    );
  }

  if (loadError || !brief) {
    return (
      <div style={{ paddingTop: 24 }}>
        <p style={{ color: "var(--breached)", fontSize: 14 }}>{loadError}</p>
        <button className="btn-secondary" onClick={onDone} style={{ marginTop: 16 }}>
          Go home
        </button>
      </div>
    );
  }

  if (brief.freelancer_address === account.address) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>
        <p className="text-secondary" style={{ fontSize: 14 }}>
          This is your own brief. Share this link with your client instead — they'll sign
          it with their own address.
        </p>
        <button className="btn-secondary" onClick={onDone}>Go home</button>
      </div>
    );
  }

  if (brief.status === "locked" && brief.client_address === account.address) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>
        <div className="seal"><div className="seal-mark" /></div>
        <p className="text-secondary" style={{ fontSize: 14 }}>You already signed this brief. It's locked.</p>
        <button className="btn-secondary" onClick={onDone}>Go home</button>
      </div>
    );
  }

  if (brief.status !== "draft") {
    const messages: Record<string, string> = {
      cancelled: "The freelancer cancelled this brief before it was signed.",
      expired: "The signing window on this brief has passed.",
      locked: "Someone else already signed this brief.",
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 24 }}>
        <p className="text-secondary" style={{ fontSize: 14 }}>
          {messages[brief.status] || "This brief is no longer open for signing."}
        </p>
        <button className="btn-secondary" onClick={onDone}>Go home</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <p className="text-muted" style={{ fontSize: 13, margin: "0 0 4px" }}>
          Brief from {brief.freelancer_name}
        </p>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
          {brief.title}
        </h1>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>What counts as done</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{brief.deliverables_text}</p>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Price</p>
            <p style={{ fontSize: 14, margin: 0 }}>{brief.price}</p>
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: 12, margin: "0 0 4px" }}>Delivery by</p>
            <p style={{ fontSize: 14, margin: 0 }}>{new Date(Number(brief.deadline)).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
        Signing locks this exact wording permanently. Neither of you will be able to change
        it afterward. If there's a dispute later, this is what gets compared against.
      </p>

      {signError && <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{signError}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={handleSign} disabled={signing}>
          {signing ? "Signing..." : "Sign and lock"}
        </button>
        <button className="btn-secondary" onClick={onDone} disabled={signing}>
          Not now
        </button>
      </div>
    </div>
  );
}
