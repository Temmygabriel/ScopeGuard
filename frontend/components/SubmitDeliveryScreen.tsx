"use client";
import { useState } from "react";
import type { Account } from "../types";
import { submitDelivery } from "../lib/contract";

export default function SubmitDeliveryScreen({
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
  const [deliveryText, setDeliveryText] = useState("");
  const [deliveryLink, setDeliveryLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!deliveryText.trim()) {
      setError("Describe what you delivered.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await submitDelivery(account, briefId, deliveryText.trim(), deliveryLink.trim());
      onSubmitted();
    } catch {
      setError("Could not submit delivery. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Submit delivery
        </h1>
        <p className="text-secondary" style={{ fontSize: 14, margin: 0 }}>
          This is what the client reviews, and what an AI would compare against the brief
          if this ever gets disputed.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>What did you deliver</label>
        <textarea
          rows={5}
          value={deliveryText}
          onChange={(e) => setDeliveryText(e.target.value)}
          placeholder="Describe exactly what's done and where to find it."
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>Link (optional)</label>
        <input value={deliveryLink} onChange={(e) => setDeliveryLink(e.target.value)} placeholder="https://..." />
      </div>

      {error && <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit delivery"}
        </button>
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
