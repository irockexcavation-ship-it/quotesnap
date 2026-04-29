"use client";

import { useEffect, useState } from "react";

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
    const activeIds = new Set(cleanedActive.map((q) => q.id));

    const cleanedArchived = uniqueById(archived).filter(
      (q) => !activeIds.has(q.id)
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

  function restoreQuote(
    quoteToRestore: QuoteItem,
    status: "Draft" | "Approved"
  ) {
    const archived = safeParseQuotes("quotesnapArchivedQuotes");
    const active = safeParseQuotes("quotesnapActiveQuotes");

    const updatedArchived = archived.filter(
      (q) => q.id !== quoteToRestore.id
    );

    const cleanedActive = active.filter(
      (q) => q.id !== quoteToRestore.id
    );

    cleanedActive.unshift({
      ...quoteToRestore,
      status,
      archivedAt: undefined,
      completedAt: undefined,
      archiveReason: undefined,
      paymentStatus:
        quoteToRestore.paymentStatus || "Unpaid",
    });

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(updatedArchived)
    );

    localStorage.setItem(
      "quotesnapActiveQuotes",
      JSON.stringify(cleanedActive)
    );

    if (status === "Approved") {
      window.location.href = "/current-jobs";
      return;
    }

    window.location.href = "/quotes";
  }

  function deleteArchivedQuote(quoteToDelete: QuoteItem) {
    const confirmed = window.confirm(
      `Delete archived quote for ${
        quoteToDelete.clientName || "this client"
      } forever?`
    );

    if (!confirmed) return;

    const updated = quotes.filter(
      (q) => q.id !== quoteToDelete.id
    );

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(updated.reverse())
    );

    setQuotes(updated);
  }

  function getLabel(quote: QuoteItem) {
    if (quote.status === "Completed") return "Completed Job";
    if (
      quote.archiveReason ===
      "Auto-archived after 30 days sent"
    )
      return "Old Sent Quote";

    return "Archived Quote";
  }

  function getBadge(quote: QuoteItem) {
    if (quote.status === "Completed") {
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

  const filtered = quotes.filter((q) =>
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
          <h1 style={title}>Archive</h1>

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
              No archived quotes found.
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
                      <button
                        onClick={() =>
                          openQuote(quote)
                        }
                        style={btnDark}
                      >
                        Open
                      </button>

                      <button
                        onClick={() =>
                          restoreQuote(
                            quote,
                            "Draft"
                          )
                        }
                        style={btnOrange}
                      >
                        Restore Quotes
                      </button>

                      <button
                        onClick={() =>
                          restoreQuote(
                            quote,
                            "Approved"
                          )
                        }
                        style={btnGreen}
                      >
                        Restore Jobs
                      </button>

                      <button
                        onClick={() =>
                          deleteArchivedQuote(
                            quote
                          )
                        }
                        style={btnDelete}
                      >
                        Delete
                      </button>
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