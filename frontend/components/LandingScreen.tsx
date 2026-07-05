"use client";
import type { Profile } from "../types";

export default function LandingScreen({
  profile,
  onCreateBrief,
  onImportKey,
}: {
  profile: Profile | null;
  onCreateBrief: () => void;
  onImportKey: () => void;
}) {
  const stats = profile?.as_freelancer;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingTop: 24 }}>
      <div className="seal" style={{ width: 56, height: 56 }}>
        <div className="seal-mark" style={{ width: 20, height: 20 }} />
      </div>

      <div>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 600, margin: "0 0 12px" }}>
          Lock the brief before the work starts.
        </h1>
        <p className="text-secondary" style={{ fontSize: 16, lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
          Write what you're building, what it costs, and when it's due. Your client signs
          it with their own address. Once both of you have signed, the wording can never
          change. If a dispute comes up later, an AI reads the locked brief and rules on
          it — nobody's memory of the conversation decides.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button className="btn-primary" onClick={onCreateBrief}>
          Lock a new brief
        </button>
        <button className="btn-secondary" onClick={onImportKey}>
          Import a key
        </button>
      </div>

      {stats && (stats.fulfilled + stats.breached + stats.partial > 0) && (
        <div className="card">
          <p className="text-secondary" style={{ fontSize: 13, margin: "0 0 12px" }}>
            Your record as a freelancer
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="verdict-word fulfilled" style={{ fontSize: 24 }}>{stats.fulfilled}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>fulfilled</div>
            </div>
            <div>
              <div className="verdict-word partial" style={{ fontSize: 24 }}>{stats.partial}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>partial</div>
            </div>
            <div>
              <div className="verdict-word breached" style={{ fontSize: 24 }}>{stats.breached}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>breached</div>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 24, fontWeight: 600 }}>{stats.current_streak}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>streak</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
