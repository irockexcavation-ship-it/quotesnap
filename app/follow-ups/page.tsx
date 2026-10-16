"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type FollowUp = {
  id: string;
  quote_id: string;
  workspace_id: string;
  followup_number: number;
  due_at: string;
  status: string;
  sent_at: string | null;
  quotes?: {
    client_name?: string | null;
    quote_number?: string | null;
    project_address?: string | null;
    status?: string | null;
    trashed_at?: string | null;
  } | null;
};

type Filter = "Pending" | "Finished" | "All";

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e7e5e4", borderRadius: 16,
  padding: 18, marginTop: 14,
};
const buttonBase: React.CSSProperties = {
  border: "1px solid #d6d3d1", borderRadius: 10, padding: "10px 13px",
  cursor: "pointer", fontWeight: 700, fontSize: 13,
};
const action = (background: string, color = "#fff"): React.CSSProperties => ({
  ...buttonBase, background, color, borderColor: background,
});

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("Pending");
  const [search, setSearch] = useState("");

  const loadFollowUps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quote_followups")
      .select(`id, quote_id, workspace_id, followup_number, due_at, status, sent_at,
        quotes (client_name, quote_number, project_address, status, trashed_at)`)
      .order("due_at", { ascending: true });

    if (error) {
      console.error("Failed to load follow-ups:", error);
      setErrorMessage(`Could not load follow-ups: ${error.message}`);
    } else {
      setFollowUps((data || []) as unknown as FollowUp[]);
      setErrorMessage("");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadFollowUps(); }, [loadFollowUps]);

  const eligible = useMemo(() => followUps.filter((item) => {
    const quote = item.quotes;
    if (!quote) return false;
    if (quote.trashed_at) return false;
    return !["Approved", "Completed", "Archived"].includes(quote.status || "");
  }), [followUps]);

  const isFinished = (item: FollowUp) => ["Sent", "Completed", "Dismissed"].includes(item.status);
  const pendingCount = eligible.filter((item) => !isFinished(item)).length;
  const finishedCount = eligible.filter(isFinished).length;
  const now = Date.now();
  const isDue = (item: FollowUp) => !isFinished(item) && item.quotes?.status === "Sent" && Number.isFinite(new Date(item.due_at).getTime()) && new Date(item.due_at).getTime() <= now;
  const dueCount = eligible.filter(isDue).length;
  const visible = eligible.filter((item) => {
    if (filter === "Pending" && isFinished(item)) return false;
    if (filter === "Finished" && !isFinished(item)) return false;
    const haystack = `${item.quotes?.client_name || ""} ${item.quotes?.quote_number || ""} ${item.quotes?.project_address || ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  function formatDateTime(date: string) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? "Date unavailable" : parsed.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    });
  }

  async function setStatus(item: FollowUp, status: "Sent" | "Completed" | "Dismissed" | "Pending") {
    if (busy) return;
    setBusy(true);
    setErrorMessage("");
    const { error } = await supabase.from("quote_followups").update({
      status,
      sent_at: status === "Sent" ? new Date().toISOString() : status === "Pending" ? null : item.sent_at,
    }).eq("id", item.id).eq("workspace_id", item.workspace_id);
    if (error) {
      setErrorMessage(`Could not update follow-up: ${error.message}`);
    } else {
      await loadFollowUps();
    }
    setBusy(false);
  }

  async function deleteOne(item: FollowUp) {
    if (busy || !window.confirm(`Delete the follow-up for ${item.quotes?.client_name || "this client"}? The quote will NOT be deleted.`)) return;
    setBusy(true);
    setErrorMessage("");
    const { error } = await supabase.from("quote_followups").delete()
      .eq("id", item.id).eq("workspace_id", item.workspace_id);
    if (error) setErrorMessage(`Could not delete follow-up: ${error.message}`);
    else await loadFollowUps();
    setBusy(false);
  }

  async function clearFinished() {
    const finished = eligible.filter(isFinished);
    if (busy || !finished.length) return;
    if (!window.confirm(`Delete ${finished.length} finished follow-up reminder(s)? Their quotes will remain untouched.`)) return;
    setBusy(true);
    setErrorMessage("");
    // Delete by exact follow-up IDs so no other workspace's reminders are touched.
    const { error } = await supabase.from("quote_followups").delete()
      .in("id", finished.map((item) => item.id));
    if (error) setErrorMessage(`Could not clear finished follow-ups: ${error.message}`);
    else await loadFollowUps();
    setBusy(false);
  }

  function sendFollowUpText(item: FollowUp) {
    const client = item.quotes?.client_name || "there";
    const message = `Hi ${client}, just following up on the quote I sent over. ` +
      `I wanted to see if you had any questions or if you'd like to move forward with the project. - iRock Excavation`;
    // Opening the SMS app does not prove a text was sent; mark it separately after sending.
    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f5f5f4,#ede9e7)", padding: "24px 18px 40px", fontFamily: "Arial,sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <a href="/dashboard" style={{ display: "inline-block", marginBottom: 14, textDecoration: "none", color: "#9a3412", fontWeight: 700 }}>← Dashboard</a>
        <section style={{ background: "#fff", padding: 24, borderRadius: 20, border: "1px solid #e7e5e4" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 30 }}>Quote Follow-Ups</h1>
          <p style={{ color: "#57534e", marginTop: 0 }}>Keep reminders moving. Removing a follow-up never removes its quote.</p>
          <div style={{ color: dueCount ? "#b91c1c" : "#166534", fontWeight: 800, fontSize: 13, marginBottom: 14 }}>● {dueCount ? `${dueCount} follow-up${dueCount === 1 ? "" : "s"} due now` : "All caught up. No follow-ups overdue."}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {(["Pending", "Finished", "All"] as Filter[]).map((choice) => (
              <button key={choice} type="button" onClick={() => setFilter(choice)} style={{
                ...buttonBase, background: filter === choice ? "#fff7ed" : "#fff",
                borderColor: filter === choice ? "#f97316" : "#d6d3d1",
                color: "#292524",
              }}>
                {choice} ({choice === "Pending" ? pendingCount : choice === "Finished" ? finishedCount : eligible.length})
              </button>
            ))}
            <button type="button" onClick={() => void clearFinished()} disabled={busy || finishedCount === 0}
              style={{ ...action("#b91c1c"), opacity: busy || finishedCount === 0 ? 0.45 : 1, marginLeft: "auto" }}>
              Clear Finished
            </button>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client, quote #, or address"
            style={{ width: "100%", boxSizing: "border-box", padding: 13, borderRadius: 10, border: "1px solid #d6d3d1" }} />
          {errorMessage && <p role="alert" style={{ color: "#b91c1c", background: "#fef2f2", padding: 12, borderRadius: 10 }}>{errorMessage}</p>}
          {loading ? <p>Loading follow-ups...</p> : visible.length === 0 ?
            <div style={{ ...card, color: "#57534e" }}>No {filter.toLowerCase()} follow-ups found.</div> :
            visible.map((item) => (
              <article key={item.id} style={{ ...card, border: isDue(item) ? "2px solid #dc2626" : card.border, background: isDue(item) ? "#fff7f7" : "#fff", boxShadow: isDue(item) ? "0 0 0 2px rgba(220,38,38,0.08)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 19 }}>{item.quotes?.client_name || "Unnamed Client"}</h2>
                    <div style={{ fontSize: 13, color: "#57534e", marginTop: 4 }}>{item.quotes?.quote_number || "No quote #"} · Follow-up #{item.followup_number}</div>
                    {item.quotes?.project_address && <div style={{ fontSize: 13, color: "#78716c", marginTop: 3 }}>{item.quotes.project_address}</div>}
                    <div style={{ marginTop: 10, fontSize: 14 }}>Due: <strong>{formatDateTime(item.due_at)}</strong></div>
                    {isDue(item) && <div style={{ color: "#b91c1c", fontWeight: 800, marginTop: 7, fontSize: 13 }}>● DUE NOW {Math.floor((now - new Date(item.due_at).getTime()) / 86400000) > 0 ? `· ${Math.floor((now - new Date(item.due_at).getTime()) / 86400000)} day(s) overdue` : ""}</div>}
                  </div>
                  <span style={{ background: isFinished(item) ? "#dcfce7" : "#fef3c7", color: isFinished(item) ? "#166534" : "#92400e", padding: "7px 12px", borderRadius: 99, height: "fit-content", fontWeight: 700, fontSize: 12 }}>{item.status}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  <button type="button" disabled={busy} onClick={() => sendFollowUpText(item)} style={action("#15803d")}>Prepare Text</button>
                  <button type="button" disabled={busy} onClick={() => void setStatus(item, "Sent")} style={action("#1c1917")}>Mark Sent</button>
                  <button type="button" disabled={busy} onClick={() => void setStatus(item, "Completed")} style={action("#0f766e")}>Complete</button>
                  <button type="button" disabled={busy} onClick={() => void setStatus(item, "Dismissed")} style={action("#57534e")}>Dismiss</button>
                  {isFinished(item) && <button type="button" disabled={busy} onClick={() => void setStatus(item, "Pending")} style={{ ...buttonBase, background: "#fff" }}>Reopen</button>}
                  <button type="button" disabled={busy} onClick={() => void deleteOne(item)} style={action("#dc2626")}>Delete Reminder</button>
                </div>
              </article>
            ))}
        </section>
      </div>
    </main>
  );
}
