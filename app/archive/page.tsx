"use client";

import { useEffect, useState } from "react";

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Completed" | "Archived";

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
  archivedAt?: string;
  completedAt?: string;
  sentAt?: string;
  archiveReason?: string;
};

export default function ArchivePage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    cleanupDuplicateStorage();
    loadArchivedQuotes();
  }, []);

  function safeParseQuotes(key: string): QuoteItem[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function uniqueById(items: QuoteItem[]) {
    const seen = new Set<string>();
    const unique: QuoteItem[] = [];

    for (const item of items) {
      const id = String(item.id || "").trim();
      if (!id || seen.has(id)) continue;

      seen.add(id);
      unique.push(item);
    }

    return unique;
  }

  function cleanupDuplicateStorage() {
    const active = safeParseQuotes("quotesnapActiveQuotes");
    const archived = safeParseQuotes("quotesnapArchivedQuotes");

    const cleanedActive = uniqueById(active);

    const activeIds = new Set(cleanedActive.map((quote) => quote.id));

    const cleanedArchived = uniqueById(archived).filter(
      (quote) => !activeIds.has(quote.id)
    );

    localStorage.setItem(
      "quotesnapActiveQuotes",
      JSON.stringify(cleanedActive)
    );

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(cleanedArchived)
    );
  }

  function loadArchivedQuotes() {
    const stored = safeParseQuotes("quotesnapArchivedQuotes");
    setQuotes([...stored].reverse());
  }

  function saveArchivedQuotes(updatedQuotes: QuoteItem[]) {
    const storageOrder = uniqueById([...updatedQuotes].reverse());

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(storageOrder)
    );

    setQuotes([...storageOrder].reverse());
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

  function restoreQuote(quoteToRestore: QuoteItem, status: Exclude<QuoteStatus, "Archived" | "Completed">) {
    const archived = safeParseQuotes("quotesnapArchivedQuotes");
    const active = safeParseQuotes("quotesnapActiveQuotes");

    const updatedArchived = archived.filter(
      (quote) => quote.id !== quoteToRestore.id
    );

    const cleanedActive = active.filter(
      (quote) => quote.id !== quoteToRestore.id
    );

    const restoredQuote: QuoteItem = {
      ...quoteToRestore,
      status,
      archivedAt: undefined,
      completedAt: undefined,
      archiveReason: undefined,
    };

    cleanedActive.unshift(restoredQuote);

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(uniqueById(updatedArchived))
    );

    localStorage.setItem(
      "quotesnapActiveQuotes",
      JSON.stringify(uniqueById(cleanedActive))
    );

    setQuotes([...uniqueById(updatedArchived)].reverse());

    if (status === "Approved") {
      window.location.href = "/current-jobs";
      return;
    }

    window.location.href = "/quotes";
  }

  function deleteArchivedQuote(quoteToDelete: QuoteItem) {
    const confirmed = window.confirm(
      `Permanently delete archived quote for ${
        quoteToDelete.clientName || "this client"
      }?`
    );

    if (!confirmed) return;

    const updated = quotes.filter((quote) => quote.id !== quoteToDelete.id);
    saveArchivedQuotes(updated);
  }

  function removeDuplicatesNow() {
    cleanupDuplicateStorage();
    loadArchivedQuotes();
    alert("Duplicate cleanup complete.");
  }

  function getArchiveLabel(quote: QuoteItem) {
    if (quote.status === "Completed" || quote.completedAt) return "Completed Job";
    if (quote.archiveReason === "Auto-archived after 30 days sent") return "Old Sent Quote";
    return "Archived Quote";
  }

  function getArchivePillStyle(quote: QuoteItem) {
    if (quote.status === "Completed" || quote.completedAt) {
      return {
        ...archivedPill,
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
      };
    }

    if (quote.archiveReason === "Auto-archived after 30 days sent") {
      return {
        ...archivedPill,
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
      };
    }

    return archivedPill;
  }

  function getArchiveDateLabel(quote: QuoteItem) {
    if (quote.status === "Completed" || quote.completedAt) {
      return `Completed: ${quote.completedAt ? new Date(quote.completedAt).toLocaleDateString() : "Unknown"}`;
    }

    if (quote.archiveReason === "Auto-archived after 30 days sent") {
      return `Auto-archived: ${quote.archivedAt ? new Date(quote.archivedAt).toLocaleDateString() : "Unknown"}`;
    }

    return `Archived: ${quote.archivedAt ? new Date(quote.archivedAt).toLocaleDateString() : "Unknown"}`;
  }

  const filtered = quotes.filter((quote) =>
    `${quote.clientName || ""} ${quote.quoteNumber || ""} ${
      quote.projectAddress || ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div style={topNavRow}>
          <button onClick={goHome} style={navButton}>
            Home
          </button>

          <button onClick={goQuotes} style={navButton}>
            Quotes
          </button>

          <button onClick={goCurrentJobs} style={navButton}>
            Current Jobs
          </button>
        </div>

        <div style={card}>
          <div style={headerRow}>
            <div>
              <h1 style={title}>Archive</h1>
              <p style={subtitle}>
                Completed jobs, old sent quotes, and manually archived quotes live here.
              </p>
            </div>

            <button onClick={removeDuplicatesNow} style={cleanupButton}>
              Clean Duplicates
            </button>
          </div>

          <input
            placeholder="Search archived quotes"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={searchBox}
          />

          {filtered.length === 0 ? (
            <div style={emptyBox}>No archived quotes found.</div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filtered.map((quote) => (
                <div key={quote.id} style={quoteCard}>
                  <div style={rowTop}>
                    <div
                      onClick={() => openQuote(quote)}
                      style={{ flex: 1, cursor: "pointer" }}
                    >
                      <div style={clientName}>
                        {quote.clientName || "Unnamed Client"}
                      </div>

                      <div style={meta}>
                        {quote.quoteNumber || "No Quote #"} •{" "}
                        {quote.quoteDate || "No Date"} •{" "}
                        {quote.projectTotal || "$0"}
                      </div>

                      <div style={address}>
                        {quote.projectAddress || ""}
                      </div>

                      <div style={archivedMeta}>
                        {getArchiveDateLabel(quote)}
                      </div>

                      {quote.archiveReason ? (
                        <div style={archiveReasonStyle}>{quote.archiveReason}</div>
                      ) : null}
                    </div>

                    <div style={getArchivePillStyle(quote)}>{getArchiveLabel(quote)}</div>
                  </div>

                  <div style={buttonRow}>
                    <button onClick={() => openQuote(quote)} style={btnDark}>
                      Open
                    </button>

                    <button
                      onClick={() => restoreQuote(quote, "Draft")}
                      style={btnOrange}
                    >
                      Restore to Quotes
                    </button>

                    <button
                      onClick={() => restoreQuote(quote, "Approved")}
                      style={btnGreen}
                    >
                      Restore to Current Jobs
                    </button>

                    <button
                      onClick={() => deleteArchivedQuote(quote)}
                      style={btnDelete}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
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

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap" as const,
  marginBottom: "16px",
};

const title = {
  fontSize: "30px",
  fontWeight: 800,
  margin: "0 0 4px 0",
};

const subtitle = {
  margin: 0,
  color: "#78716c",
  fontSize: "14px",
};

const searchBox = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  marginBottom: "18px",
  boxSizing: "border-box" as const,
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
  marginBottom: "12px",
  gap: "12px",
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

const archivedMeta = {
  fontSize: "12px",
  color: "#a8a29e",
  marginTop: "6px",
};

const archiveReasonStyle = {
  fontSize: "12px",
  color: "#78716c",
  marginTop: "4px",
};

const archivedPill = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap" as const,
  height: "fit-content",
  background: "#e7e5e4",
  color: "#44403c",
  border: "1px solid #d6d3d1",
};

const buttonRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const topNavRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
  flexWrap: "wrap" as const,
};

const navButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#fff",
  cursor: "pointer",
};

const cleanupButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#fafaf9",
  color: "#44403c",
  cursor: "pointer",
  fontWeight: "bold" as const,
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
