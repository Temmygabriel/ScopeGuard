"use client";
import { useEffect, useState } from "react";
import type { Account, Profile } from "../types";

function truncate(address: string) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Reads directly from localStorage when revealed, rather than taking the
// key as a prop — avoids the stale-prop trap CommitChain hit, where the
// export box could end up showing "undefined" after a re-render.
function KeyExportBox() {
  const [revealed, setRevealed] = useState(false);
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (revealed) {
      setKey(localStorage.getItem("sg_private_key") || "");
    }
  }, [revealed]);

  function handleCopy() {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>Private key</p>
      <p className="text-secondary" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
        This is the only way to use this same address on another device. Anyone with this
        key can act as you — never share it.
      </p>
      {revealed ? (
        <>
          <div className="mono" style={{ fontSize: 12, wordBreak: "break-all", color: "var(--text-2)" }}>
            {key}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-secondary" onClick={handleCopy}>{copied ? "Copied" : "Copy"}</button>
            <button className="btn-secondary" onClick={() => setRevealed(false)}>Hide</button>
          </div>
        </>
      ) : (
        <button className="btn-secondary" onClick={() => setRevealed(true)} style={{ alignSelf: "flex-start" }}>
          Reveal private key
        </button>
      )}
    </div>
  );
}

export default function ProfileScreen({
  account,
  profile,
  name,
  onSaveName,
}: {
  account: Account;
  profile: Profile | null;
  name: string;
  onSaveName: (name: string) => void;
}) {
  const [nameInput, setNameInput] = useState(name);
  const [addressCopied, setAddressCopied] = useState(false);

  useEffect(() => {
    setNameInput(name);
  }, [name]);

  function handleCopyAddress() {
    navigator.clipboard.writeText(account.address);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  }

  const freelancer = profile?.as_freelancer;
  const client = profile?.as_client;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 24 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
          Profile
        </h1>
        <button
          onClick={handleCopyAddress}
          className="mono text-secondary"
          style={{ background: "none", border: "none", fontSize: 13, padding: 0, textAlign: "left" }}
        >
          {addressCopied ? "Copied" : truncate(account.address)}
        </button>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label className="text-muted" style={{ fontSize: 12 }}>Display name</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="How clients see you" />
          <button className="btn-secondary" onClick={() => onSaveName(nameInput.trim())}>Save</button>
        </div>
      </div>

      {freelancer && (freelancer.fulfilled + freelancer.breached + freelancer.partial > 0) && (
        <div className="card">
          <p className="text-muted" style={{ fontSize: 12, margin: "0 0 14px" }}>As a freelancer</p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div className="verdict-word fulfilled" style={{ fontSize: 22 }}>{freelancer.fulfilled}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>fulfilled</div>
            </div>
            <div>
              <div className="verdict-word partial" style={{ fontSize: 22 }}>{freelancer.partial}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>partial</div>
            </div>
            <div>
              <div className="verdict-word breached" style={{ fontSize: 22 }}>{freelancer.breached}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>breached</div>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{freelancer.current_streak}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>current streak</div>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{freelancer.longest_streak}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>longest streak</div>
            </div>
          </div>
        </div>
      )}

      {client && client.disputes_raised > 0 && (
        <div className="card">
          <p className="text-muted" style={{ fontSize: 12, margin: "0 0 14px" }}>As a client</p>
          <div style={{ display: "flex", gap: 24 }}>
            <div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{client.disputes_raised}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>disputes raised</div>
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 22, fontWeight: 600 }}>{client.disputes_upheld}</div>
              <div className="text-muted" style={{ fontSize: 12 }}>disputes upheld</div>
            </div>
          </div>
        </div>
      )}

      <KeyExportBox />
    </div>
  );
}
