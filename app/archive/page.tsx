"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
type QuoteStatus =
  | "Draft"
  | "Sent"
  | "Approved"
  | "Completed"
  | "Archived";

type PaymentStatus = "Paid" | "Unpaid";

type QuoteItem = {
  id: string;
  quoteNumber?: string;
  clientName?: string;
  projectAddress?: string;
  contactInfo?: string;
  quoteDate?: string;
  projectTotal?: string;
  startWindow?: string;
  scopeOfWork?: string;
  bannerImage?: string;
  status?: QuoteStatus;
  paymentStatus?: PaymentStatus;
  archivedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  archiveReason?: string;
  trashedAt?: string | null;
  preTrashStatus?: string | null;
};

export default function ArchivePage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"completed" | "invoices" | "inactive" | "trash">("completed");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadArchivedQuotes();
  }, []);

  async function loadArchivedQuotes() {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .or("status.eq.Archived,trashed_at.not.is.null")
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Failed to load archived quotes:", error);
      setErrorMessage("Unable to load Archive and Trash. Please refresh and try again.");
      return;
    }

    setErrorMessage("");
    setQuotes((data || []).map((q) => ({
      id: q.id,
      status: q.status,
      clientName: q.client_name,
      quoteNumber: q.quote_number,
      projectAddress: q.project_address,
      contactInfo: q.contact_info,
      quoteDate: q.quote_date,
      projectTotal: q.project_total,
      bannerImage: q.banner_image_url,
      paymentStatus: q.payment_status,
      archivedAt: q.archived_at,
      completedAt: q.completed_at,
      approvedAt: q.approved_at,
      archiveReason: q.archive_reason,
      trashedAt: q.trashed_at,
      preTrashStatus: q.pre_trash_status,
    })));
  }

  function goHome() {
    window.location.href = "/";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  function goCurrentJobs() {
    window.location.href = "/current-jobs";
  }

  function openQuote(quote: QuoteItem) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }

  async function restoreQuote(
  quoteToRestore: QuoteItem,
  status: "Draft" | "Approved"
) {
  const confirmed = window.confirm(
    status === "Approved"
      ? `Restore ${quoteToRestore.clientName || "this client"} to Current Jobs?`
      : `Restore ${quoteToRestore.clientName || "this client"} to Quotes?`
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("quotes")
    .update({
      status,
      archived_at: null,
      archive_reason: null,
      completed_at: null,
      trashed_at: null,
      pre_trash_status: null,
    })
    .eq("id", quoteToRestore.id);

  if (error) {
    console.error("Failed to restore quote:", error);
    window.alert("Could not restore this quote.");
    return;
  }

  await loadArchivedQuotes();

  if (status === "Approved") {
    window.location.href = "/current-jobs";
    return;
  }

  window.location.href = "/quotes";
}

  async function moveToTrash(quote: QuoteItem) {
    if (busy || !window.confirm(`Move ${quote.clientName || "this quote"} to Trash? You can restore it later.`)) return;
    setBusy(true);
    const { data, error } = await supabase.from("quotes")
      .update({ trashed_at: new Date().toISOString(), pre_trash_status: "Archived" })
      .eq("id", quote.id).eq("status", "Archived").is("trashed_at", null)
      .select("id");
    if (error || !data?.length) {
      window.alert("Could not move this quote to Trash. Nothing was deleted.");
      console.error("Move to Trash failed:", error);
    }
    await loadArchivedQuotes();
    setBusy(false);
  }

  async function restoreFromTrash(quote: QuoteItem) {
    if (busy || !window.confirm(`Restore ${quote.clientName || "this quote"} to its previous location?`)) return;
    setBusy(true);
    const originalStatus = quote.preTrashStatus || "Archived";
    const allowedStatuses: QuoteStatus[] = ["Draft", "Sent", "Approved", "Completed", "Archived"];
    const restoreStatus: QuoteStatus = allowedStatuses.includes(originalStatus as QuoteStatus)
      ? originalStatus as QuoteStatus : "Archived";
    const { data, error } = await supabase.from("quotes")
      .update({
        status: restoreStatus,
        trashed_at: null,
        pre_trash_status: null,
        ...(restoreStatus !== "Archived" ? { archived_at: null, archive_reason: null } : {}),
      })
      .eq("id", quote.id).not("trashed_at", "is", null)
      .select("id");
    if (error || !data?.length) {
      window.alert("Could not restore this quote. Please try again.");
      console.error("Trash restore failed:", error);
    }
    await loadArchivedQuotes();
    setBusy(false);
  }

  // Owner-controlled deletion. Supabase remains responsible for enforcing
  // foreign keys and row-level security; a failed delete never pretends to work.
  async function deleteOne(quote: QuoteItem): Promise<boolean> {
    const { data, error } = await supabase.from("quotes")
      .delete()
      .eq("id", quote.id)
      .not("trashed_at", "is", null)
      .select("id");

    if (error) {
      console.error(`Could not permanently delete quote ${quote.id}:`, error);
      setErrorMessage(
        `Could not delete ${quote.clientName || quote.quoteNumber || "this quote"}: ${error.message}. ` +
        "The database may have linked records that require a server-side cleanup rule."
      );
      return false;
    }
    if (!data?.length) {
      setErrorMessage("Deletion was not confirmed by Supabase. The quote was left in Trash.");
      return false;
    }
    return true;
  }

  async function permanentlyDelete(quote: QuoteItem) {
    if (busy) return;
    if (!window.confirm(`PERMANENTLY delete ${quote.clientName || "this quote"}? This cannot be undone.`)) return;
    setBusy(true);
    setErrorMessage("");
    try {
      const deleted = await deleteOne(quote);
      await loadArchivedQuotes();
      if (deleted) window.alert("Quote permanently deleted.");
    } finally {
      setBusy(false);
    }
  }

  async function emptyTrash() {
    if (busy) return;
    const trash = quotes.filter(q => !!q.trashedAt);
    if (!trash.length) return;
    if (!window.confirm(`PERMANENTLY delete all ${trash.length} quote(s) in Trash? This cannot be undone.`)) return;
    setBusy(true);
    setErrorMessage("");
    let deleted = 0;
    let failed = 0;
    try {
      for (const quote of trash) {
        if (await deleteOne(quote)) deleted++;
        else failed++;
      }
      await loadArchivedQuotes();
      window.alert(`${deleted} quote(s) permanently deleted. ${failed} could not be deleted and remain in Trash.`);
    } finally {
      setBusy(false);
    }
  }

  function getLabel(quote: QuoteItem) {
    if (quote.completedAt || quote.archiveReason === "Completed job") return "Completed Job";
    if (
      quote.archiveReason ===
      "Auto-archived after 30 days sent"
    )
      return "Old Sent Quote";

    return "Archived Quote";
  }

  function getBadge(quote: QuoteItem) {
    if (quote.completedAt || quote.archiveReason === "Completed job") {
      return completedBadge;
    }

    if (
      quote.archiveReason ===
      "Auto-archived after 30 days sent"
    ) {
      return sentBadge;
    }

    return archivedBadge;
  }

  function isCompleted(quote: QuoteItem) {
    return !!quote.completedAt || quote.archiveReason === "Completed job";
  }

  const activeArchive = quotes.filter(q => !q.trashedAt);
  const completedCount = activeArchive.filter(isCompleted).length;
  const inactiveCount = activeArchive.filter(q => !isCompleted(q)).length;
  const trashCount = quotes.filter(q => !!q.trashedAt).length;
  const filtered = quotes.filter((q) => {
    const matchesSection = tab === "trash" ? !!q.trashedAt
      : tab === "completed" ? !q.trashedAt && isCompleted(q)
      : tab === "inactive" ? !q.trashedAt && !isCompleted(q)
      : false;
    return matchesSection && `${q.clientName || ""} ${q.quoteNumber || ""} ${q.projectAddress || ""}`
      .toLowerCase().includes(search.toLowerCase());
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#f5f5f4 0%,#ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={topNav}>
          <button onClick={goHome} style={navBtn}>
            Home
          </button>

          <button onClick={goQuotes} style={navBtn}>
            Quotes
          </button>

          <button
            onClick={goCurrentJobs}
            style={navBtn}
          >
            Current Jobs
          </button>
        </div>

        <div style={card}>
          <h1 style={title}>Archive Control Panel</h1>
          <p style={{ color: "#57534e", fontSize: "14px", marginTop: "-4px" }}>
            Job history, old estimates, and Trash. Pick a section below.
          </p>
          <div style={tileGrid}>
            <button type="button" onClick={() => { setTab("completed"); setSearch(""); setErrorMessage(""); }}
              style={{ ...tile, ...(tab === "completed" ? selectedTile : {}) }} aria-pressed={tab === "completed"}>
              <span style={tileTop}><span style={tileIcon}>✓</span><span style={{ ...statusLight, background: tab === "completed" ? "#16a34a" : "#d6d3d1" }} /></span>
              <span style={tileTitle}>Completed Jobs</span>
              <span style={tileDescription}>Finished work and job history</span>
              <span style={tileCount}>{completedCount} records</span>
            </button>
            <button type="button" onClick={() => { setTab("invoices"); setSearch(""); setErrorMessage(""); }}
              style={{ ...tile, ...(tab === "invoices" ? selectedTile : {}) }} aria-pressed={tab === "invoices"}>
              <span style={tileTop}><span style={tileIcon}>$</span><span style={{ ...statusLight, background: tab === "invoices" ? "#64748b" : "#d6d3d1" }} /></span>
              <span style={tileTitle}>Invoices</span>
              <span style={tileDescription}>Historical invoices and payments</span>
              <span style={tileCount}>Connection coming next</span>
            </button>
            <button type="button" onClick={() => { setTab("inactive"); setSearch(""); setErrorMessage(""); }}
              style={{ ...tile, ...(tab === "inactive" ? selectedTile : {}) }} aria-pressed={tab === "inactive"}>
              <span style={tileTop}><span style={tileIcon}>▤</span><span style={{ ...statusLight, background: tab === "inactive" ? "#f59e0b" : "#d6d3d1" }} /></span>
              <span style={tileTitle}>Inactive Quotes</span>
              <span style={tileDescription}>Archived estimates and old proposals</span>
              <span style={tileCount}>{inactiveCount} records</span>
            </button>
            <button type="button" onClick={() => { setTab("trash"); setSearch(""); setErrorMessage(""); }}
              style={{ ...tile, ...(tab === "trash" ? selectedTile : {}) }} aria-pressed={tab === "trash"}>
              <span style={tileTop}><span style={tileIcon}>×</span><span style={{ ...statusLight, background: tab === "trash" ? "#dc2626" : "#d6d3d1" }} /></span>
              <span style={tileTitle}>Trash</span>
              <span style={tileDescription}>Restore or permanently delete</span>
              <span style={tileCount}>{trashCount} records</span>
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#292524" }}>
              {tab === "completed" ? "Completed Jobs" : tab === "invoices" ? "Invoices" : tab === "inactive" ? "Inactive Quotes" : "Trash"}
            </h2>
            {tab === "trash" && <button style={btnDelete} disabled={busy || !trashCount} onClick={() => void emptyTrash()}>Empty Trash</button>}
          </div>
          {errorMessage && <p role="alert" style={{ color: "#b91c1c" }}>{errorMessage}</p>}
          {tab === "trash" && <p style={{ color: "#57534e", fontSize: "13px" }}>Restore quotes to their previous location or permanently delete them. You decide what goes. Database relationships may still prevent deletion until linked records can be cleaned up.</p>}

          {tab === "invoices" ? (
            <div style={emptyBox}>Invoice history will appear here when we connect the existing invoice records. No invoices have been moved or deleted.</div>
          ) : (<>
          <input
            placeholder="Search this section"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={searchBox}
          />

          {filtered.length === 0 ? (
            <div style={emptyBox}>
              {tab === "trash" ? "Trash is empty." : tab === "completed" ? "No completed jobs in Archive." : "No inactive quotes in Archive."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filtered.map((quote) => {
                const paid =
                  quote.paymentStatus === "Paid";

                return (
                  <div
                    key={quote.id}
                    style={quoteCard}
                  >
                    <div style={rowTop}>
                      <div
                        onClick={() =>
                          openQuote(quote)
                        }
                        style={{
                          flex: 1,
                          cursor: "pointer",
                        }}
                      >
                        <div style={clientName}>
                          {quote.clientName ||
                            "Unnamed Client"}
                        </div>

                        <div style={meta}>
                          {quote.quoteNumber ||
                            "No Quote #"}{" "}
                          •{" "}
                          {quote.quoteDate ||
                            "No Date"}{" "}
                          •{" "}
                          {quote.projectTotal ||
                            "$0"}
                        </div>

                        <div style={address}>
                          {quote.projectAddress ||
                            ""}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                          justifyItems: "end",
                        }}
                      >
                        <span style={getBadge(quote)}>
                          {getLabel(quote)}
                        </span>

                        <span
                          style={
                            paid
                              ? paidBadge
                              : unpaidBadge
                          }
                        >
                          {paid
                            ? "Paid"
                            : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    <div style={buttonRow}>
                      {tab === "trash" ? (
                        <>
                          <button disabled={busy} onClick={() => void restoreFromTrash(quote)} style={btnGreen}>Restore</button>
                          <button disabled={busy} onClick={() => void permanentlyDelete(quote)} style={btnDelete} title="Permanently delete">Delete Forever</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openQuote(quote)} style={btnDark}>Open</button>
                          <button disabled={busy} onClick={() => void restoreQuote(quote, "Draft")} style={btnOrange}>Restore Quotes</button>
                          <button disabled={busy} onClick={() => void restoreQuote(quote, "Approved")} style={btnGreen}>Restore Jobs</button>
                          <button disabled={busy} onClick={() => void moveToTrash(quote)} style={btnDelete}>Move to Trash</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </>)}
        </div>
      </div>
    </main>
  );
}

const card = {
  background: "#fff",
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid #e7e5e4",
};

const title = {
  fontSize: "30px",
  fontWeight: 800,
  marginBottom: "14px",
};

const searchBox = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  marginBottom: "18px",
};

const emptyBox = {
  padding: "20px",
  textAlign: "center" as const,
  color: "#78716c",
};

const quoteCard = {
  border: "1px solid #e7e5e4",
  borderRadius: "16px",
  padding: "16px",
  background: "#fff",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "14px",
};

const clientName = {
  fontWeight: 800,
  fontSize: "18px",
};

const meta = {
  fontSize: "14px",
  color: "#57534e",
};

const address = {
  fontSize: "13px",
  color: "#78716c",
};

const buttonRow = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const topNav = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
  flexWrap: "wrap" as const,
};

const navBtn = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#fff",
  cursor: "pointer",
};

const archivedBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#e7e5e4",
  color: "#44403c",
  fontSize: "12px",
  fontWeight: 800,
};

const completedBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 800,
};

const sentBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 800,
};

const paidBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 800,
};

const unpaidBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: 800,
};

const btnDark = {
  background: "#1c1917",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
};

const btnOrange = {
  background: "#f97316",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
};

const btnGreen = {
  background: "#15803d",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
};

const btnDelete = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
};

const tileGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
  marginBottom: "22px",
};
const tile = {
  textAlign: "left" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
  padding: "16px",
  background: "#fafaf9",
  border: "2px solid #e7e5e4",
  borderRadius: "16px",
  cursor: "pointer",
  minWidth: 0,
  color: "#292524",
};
const selectedTile = { background: "#fff7ed", borderColor: "#f97316" };
const tileTop = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const tileIcon = { fontSize: "24px", fontWeight: 800, lineHeight: 1 };
const statusLight = { width: "12px", height: "12px", borderRadius: "50%", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.1)" };
const tileTitle = { fontSize: "16px", fontWeight: 800 };
const tileDescription = { fontSize: "12px", color: "#57534e" };
const tileCount = { fontSize: "12px", fontWeight: 700, color: "#9a3412" };
