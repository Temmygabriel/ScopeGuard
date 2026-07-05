"use client";
import { useState } from "react";
import type { Account } from "../types";
import { createBrief, getMyBriefs } from "../lib/contract";

const SIGN_WINDOW_OPTIONS = [
  { label: "24 hours", hours: 24 },
  { label: "48 hours", hours: 48 },
  { label: "72 hours", hours: 72 },
];

export default function CreateBriefScreen({
  account,
  name,
  onSaveName,
  onCreated,
  onDone,
}: {
  account: Account;
  name: string;
  onSaveName: (name: string) => void;
  onCreated: (briefId: string) => void;
  onDone: () => void;
}) {
  const [freelancerName, setFreelancerName] = useState(name);
  const [title, setTitle] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [signWindowHours, setSignWindowHours] = useState(48);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdBriefId, setCreatedBriefId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function validate(): string | null {
    if (!freelancerName.trim()) return "Add your name so the client knows who this is from.";
    if (!title.trim()) return "Give the brief a title.";
    if (!deliverablesText.trim()) return "Describe what counts as done.";
    if (!price.trim()) return "Set a price.";
    if (!deadline) return "Set a delivery deadline.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const deadlineMs = new Date(deadline).getTime().toString();
      const signDeadlineMs = (Date.now() + signWindowHours * 3600 * 1000).toString();

      await createBrief(
        account,
        freelancerName.trim(),
        title.trim(),
        deliverablesText.trim(),
        price.trim(),
        deadlineMs,
        signDeadlineMs
      );

      onSaveName(freelancerName.trim());

      const briefs = await getMyBriefs(account.address);
      const newest = briefs[0];
      setCreatedBriefId(newest.brief_id);
      onCreated(newest.brief_id);
    } catch (err) {
      setError("Could not lock the brief. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!createdBriefId) return;
    const link = `${window.location.origin}${window.location.pathname}?brief=${createdBriefId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdBriefId) {
    const link = `${window.location.origin}${window.location.pathname}?brief=${createdBriefId}`;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
        <div className="seal">
          <div className="seal-mark" />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
            Brief drafted
          </h1>
          <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            It won't lock until your client opens this link and signs it with their own
            address. Nothing about the wording can change after that.
          </p>
        </div>

        <div className="card mono" style={{ fontSize: 13, wordBreak: "break-all" }}>
          {link}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-primary" onClick={handleCopy}>
            {copied ? "Copied" : "Copy link"}
          </button>
          <button className="btn-secondary" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Draft a brief
        </h1>
        <p className="text-secondary" style={{ fontSize: 14, margin: 0 }}>
          You can cancel this before it's signed. Once locked, it can't be edited.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>Your name</label>
        <input value={freelancerName} onChange={(e) => setFreelancerName(e.target.value)} placeholder="How the client will see you" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Landing page redesign" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>What counts as done</label>
        <textarea
          rows={4}
          value={deliverablesText}
          onChange={(e) => setDeliverablesText(e.target.value)}
          placeholder="Be specific — this is the only thing the AI will judge against later."
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="text-muted" style={{ fontSize: 13 }}>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$800" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="text-muted" style={{ fontSize: 13 }}>Delivery deadline</label>
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label className="text-muted" style={{ fontSize: 13 }}>How long does the client have to sign?</label>
        <div style={{ display: "flex", gap: 8 }}>
          {SIGN_WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              onClick={() => setSignWindowHours(opt.hours)}
              className={signWindowHours === opt.hours ? "btn-primary" : "btn-secondary"}
              style={{ flex: 1, padding: "10px 0", fontSize: 14 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-muted" style={{ fontSize: 12, margin: "4px 0 0" }}>
          If they haven't signed by then, the brief expires and stops counting against your
          open-brief limit.
        </p>
      </div>

      {error && <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Locking in draft..." : "Draft brief"}
        </button>
        <button className="btn-secondary" onClick={onDone} disabled={loading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
