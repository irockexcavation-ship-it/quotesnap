"use client";

import { useState } from "react";

type Props = { token: string; alreadyApproved?: boolean; approvedName?: string | null };

export default function CustomerApprovalForm({ token, alreadyApproved = false, approvedName }: Props) {
  const [name, setName] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(alreadyApproved);
  const [acceptedName, setAcceptedName] = useState(approvedName || "");
  const [error, setError] = useState("");

  async function approve() {
    if (busy || approved) return;
    if (name.trim().length < 2 || name.length > 150) {
      setError("Please enter your full name.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm you have reviewed and agree to the quoted scope and price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/quotes/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.accepted !== true) {
        throw new Error(result.error || "We could not record your approval. Please contact iRock.");
      }
      setAcceptedName(name.trim());
      setApproved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not record your approval.");
    } finally {
      setBusy(false);
    }
  }

  if (approved) {
    return (
      <div role="status" style={{ border: "1px solid #86efac", background: "#f0fdf4", borderRadius: 12, padding: 18, color: "#166534" }}>
        <div style={{ fontSize: 21, fontWeight: 800 }}>✓ Quote Approved</div>
        <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
          {acceptedName ? `${acceptedName}, your` : "Your"} approval has been recorded. Thank you! iRock will follow up about scheduling.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 13 }}>
      <label htmlFor="customer-approval-name" style={{ fontWeight: 700 }}>Your full name</label>
      <input
        id="customer-approval-name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={150}
        placeholder="First and last name"
        style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", fontSize: 16, border: "1px solid #a8a29e", borderRadius: 9 }}
      />
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          style={{ width: 19, height: 19, marginTop: 2, flexShrink: 0 }}
        />
        <span>I have reviewed the scope of work, project price, and terms above, and I authorize iRock to proceed as quoted.</span>
      </label>
      {error && <p role="alert" style={{ color: "#b91c1c", margin: 0 }}>{error}</p>}
      <button
        type="button"
        onClick={approve}
        disabled={busy || !confirmed || name.trim().length < 2}
        style={{ background: "#15803d", color: "white", border: 0, borderRadius: 10, padding: "15px 20px", fontSize: 17, fontWeight: 800, cursor: busy ? "wait" : "pointer", opacity: busy || !confirmed || name.trim().length < 2 ? 0.55 : 1 }}
      >
        {busy ? "Recording Approval..." : "Approve Quote"}
      </button>
      <p style={{ color: "#78716c", fontSize: 12, lineHeight: 1.5, margin: 0 }}>
        Clicking Approve Quote records your name, approval time, and the version of this quote you accepted.
      </p>
    </div>
  );
}
