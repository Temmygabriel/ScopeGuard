"use client";
import { useState } from "react";

export default function ImportKeyScreen({
  onImport,
  onCancel,
}: {
  onImport: (privateKey: `0x${string}`) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleImport() {
    const trimmed = value.trim();
    if (!trimmed.startsWith("0x") || trimmed.length < 10) {
      setError("That doesn't look like a private key. It should start with 0x.");
      return;
    }
    setError("");
    onImport(trimmed as `0x${string}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Import a key
        </h1>
        <p className="text-secondary" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          Paste an existing private key to use that address instead of the one generated on
          this device. This replaces your current local key — anything tied only to it will
          no longer be reachable from here.
        </p>
      </div>

      <textarea
        rows={3}
        placeholder="0x..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mono"
        style={{ resize: "none" }}
      />

      {error && (
        <p style={{ color: "var(--breached)", fontSize: 13, margin: 0 }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={handleImport}>
          Import
        </button>
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
