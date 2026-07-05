"use client";
import { useEffect, useRef, useState } from "react";
import type { Account } from "../types";
import { getBrief, evaluateDispute } from "../lib/contract";

const MESSAGES = [
  "Reading the locked brief...",
  "Comparing it against the delivery...",
  "Weighing the dispute...",
  "This usually takes 3 to 5 minutes.",
];

export default function JudgingScreen({
  account,
  briefId,
  onResolved,
}: {
  account: Account;
  briefId: string;
  onResolved: () => void;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    const rotate = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(rotate);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function kickOff() {
      try {
        const current = await getBrief(briefId);
        if (current.status === "resolved") {
          if (!cancelled) onResolved();
          return;
        }
        if (!startedRef.current && current.status === "disputed") {
          startedRef.current = true;
          evaluateDispute(account, briefId).catch(() => {
            if (!cancelled) setError("The verdict call failed to go through. It's safe to try again.");
          });
        }
      } catch {
        // transient read failure — the poll below will retry
      }
    }
    kickOff();

    const poll = setInterval(async () => {
      try {
        const b = await getBrief(briefId);
        if (b.status === "resolved" && !cancelled) {
          clearInterval(poll);
          onResolved();
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [briefId, account, onResolved]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 64, textAlign: "center" }}>
      <div className="seal" style={{ width: 64, height: 64, animation: "sg-pulse 2s ease-in-out infinite" }}>
        <div className="seal-mark" style={{ width: 24, height: 24 }} />
      </div>
      <h1 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
        Judging the dispute
      </h1>
      <p className="text-secondary" style={{ fontSize: 14, maxWidth: 320 }}>{MESSAGES[messageIndex]}</p>
      {error && <p style={{ color: "var(--breached)", fontSize: 13 }}>{error}</p>}
      <style>{`
        @keyframes sg-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
