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
  const [tab, setTab] = useState<"archive" | "trash">("archive");
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

  const archivedCount = quotes.filter(q => !q.trashedAt).length;
  const trashCount = quotes.filter(q => !!q.trashedAt).length;
  const filtered = quotes.filter((q) => (tab === "trash" ? !!q.trashedAt : !q.trashedAt) &&
    `${q.clientName || ""} ${q.quoteNumber || ""} ${
      q.projectAddress || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
          <h1 style={title}>Archive & Trash</h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <button style={tab === "archive" ? btnOrange : navBtn} onClick={() => setTab("archive")}>Archive ({archivedCount})</button>
            <button style={tab === "trash" ? btnOrange : navBtn} onClick={() => setTab("trash")}>Trash ({trashCount})</button>
            {tab === "trash" && <button style={btnDelete} disabled={busy || !trashCount} onClick={() => void emptyTrash()}>Empty Trash</button>}
          </div>
          {errorMessage && <p role="alert" style={{ color: "#b91c1c" }}>{errorMessage}</p>}
          {tab === "trash" && <p style={{ color: "#57534e", fontSize: "13px" }}>Restore quotes to their previous location or permanently delete them. You decide what goes. Database relationships may still prevent deletion until linked records can be cleaned up.</p>}

          <input
            placeholder="Search archive"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={searchBox}
          />

          {filtered.length === 0 ? (
            <div style={emptyBox}>
              {tab === "trash" ? "Trash is empty." : "No archived quotes found."}
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
