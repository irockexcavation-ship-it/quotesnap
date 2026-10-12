"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type DirtResult = { scope: string; observations: string[]; questions: string[] };
type ChatMessage = { role: "user" | "assistant"; content: string };

type Props = {
  notes: string;
  draft: DirtResult | null;
  onProposedRevision: (result: DirtResult, revisedNotes: string) => void;
};

export default function DirtTalk({ notes, draft, onProposedRevision }: Props) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<(DirtResult & { revisedNotes: string }) | null>(null);

  async function send() {
    const text = message.trim();
    if (!text || busy) return;
    if (!notes.trim() && !draft?.scope.trim()) { setError("Enter job notes first."); return; }
    setBusy(true);
    setError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (sessionError || !token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dirt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: pending?.revisedNotes || notes, scope: pending?.scope || draft?.scope || "", message: text, history }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `D.I.R.T. request failed (${response.status}).`);
      if (typeof body.reply !== "string" || typeof body.scope !== "string" ||
          typeof body.revisedNotes !== "string" || !Array.isArray(body.observations) || !Array.isArray(body.questions))
        throw new Error("D.I.R.T. returned an unexpected response.");
      setHistory(h => [...h, { role: "user", content: text }, { role: "assistant", content: body.reply }].slice(-12));
      setPending({ scope: body.scope, observations: body.observations, questions: body.questions, revisedNotes: body.revisedNotes });
      setMessage("");
    } catch (e) { setError(e instanceof Error ? e.message : "D.I.R.T. could not answer."); }
    finally { setBusy(false); }
  }

  return (
    <section style={{ marginTop: 16, padding: 16, background: "#1f2937", borderRadius: 12, color: "white" }}>
      <h3 style={{ marginTop: 0, color: "#fb923c" }}>🎙️ Talk to D.I.R.T.</h3>
      <p style={{ fontSize: 14, color: "#d1d5db" }}>Ask questions or request changes. Click the message box and press Windows + H to dictate. D.I.R.T. proposes revisions; nothing enters your quote until you approve it.</p>
      <div aria-live="polite" style={{ maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
        {history.map((m, i) => <div key={i} style={{ margin: "8px 0", padding: 10, borderRadius: 8, background: m.role === "user" ? "#374151" : "#111827", whiteSpace: "pre-wrap" }}>
          <strong style={{ color: m.role === "user" ? "#fdba74" : "#93c5fd" }}>{m.role === "user" ? "You" : "D.I.R.T."}:</strong> {m.content}
        </div>)}
      </div>
      <textarea aria-label="Message D.I.R.T." value={message} onChange={e => setMessage(e.target.value)} rows={3}
        placeholder="D.I.R.T., change the driveway to 350 feet and use #2 stone..."
        style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 8, color: "#111827", background: "white" }} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button type="button" disabled={busy || !message.trim()} onClick={send}
          style={{ padding: "12px 18px", border: 0, borderRadius: 8, background: "#f97316", color: "white", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "D.I.R.T. is thinking..." : "Send to D.I.R.T."}
        </button>
        <button type="button" disabled={busy} onClick={() => { setHistory([]); setPending(null); setError(""); }}
          style={{ padding: "12px 18px", border: "1px solid #6b7280", borderRadius: 8, background: "transparent", color: "white" }}>Clear conversation</button>
      </div>
      {error && <p role="alert" style={{ color: "#fca5a5" }}>{error}</p>}
      {pending && <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "#fff", color: "#111827" }}>
        <strong>Proposed revised scope • NOT copied to quote</strong>
        <p style={{ whiteSpace: "pre-wrap" }}>{pending.scope}</p>
        <strong>Internal estimating notes • NOT copied to quote</strong>
        <ul>{pending.observations.map((o, i) => <li key={i}>{o}</li>)}</ul>
        {pending.questions.length > 0 && <><strong>Questions</strong><ul>{pending.questions.map((q, i) => <li key={i}>{q}</li>)}</ul></>}
        <button type="button" onClick={() => { onProposedRevision({ scope: pending.scope, observations: pending.observations, questions: pending.questions }, pending.revisedNotes); setPending(null); }}
          style={{ padding: "12px 16px", border: 0, borderRadius: 8, background: "#f97316", color: "white", fontWeight: 700 }}>
          Approve revised D.I.R.T. draft
        </button>
        <p style={{ fontSize: 12 }}>Approval updates the D.I.R.T. draft and job notes only. Use the existing orange “Use This Draft in Scope of Work” button to copy it into your quote.</p>
      </div>}
    </section>
  );
}
