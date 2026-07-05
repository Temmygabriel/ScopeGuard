"use client";
import { useState } from "react";
import type { Account } from "../types";
import { submitDispute } from "../lib/contract";

export default function SubmitDisputeScreen({
  account,
  briefId,
  onSubmitted,
  onCancel,
}: {
  account: Account;
  briefId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [disputeText, setDisputeText] = useState("");
  const [disputeLink, setDisputeLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!disputeText.trim()) {
      setError("Explain what's missing or wrong.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await submitDispute(account, briefId, disputeText.trim(), disputeLink.trim());
      onSubmitted();
    } catch {
      setError("Could not submit the dispute. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Raise a dispute
        </h1>
        <p className="text-secondary" style={{ fontSize: 14, margin: 0 }}>
          An AI will compare this against the locked brief and the delivery. Stick to what
          the brief actually asked for — that's the only thing it will weigh.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>What's missing or wrong</label>
        <textarea
          rows={5}
          value={disputeText}
          onChange={(e) => setDisputeText(e.target.value)}
          placeholder="Be specific about what was promised and not delivered."
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>Evidence link (optional)</label>
        <input value={disputeLink} onChange={(e) => setDisputeLink(e.target.value)} placeholder="https://..." />
      </div>

      {error && <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit dispute"}
        </button>
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
