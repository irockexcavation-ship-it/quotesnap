"use client";

import { useEffect, useState } from "react";

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Archived";

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
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    migrateLegacyQuotesIfNeeded();
    cleanDuplicateActiveQuotes();
    loadQuotes();
  }, []);

  function safeParseQuotes(key: string): QuoteItem[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function dedupeQuotes(items: QuoteItem[]) {
    const seen = new Set<string>();
    const cleaned: QuoteItem[] = [];

    for (const quote of items) {
      const key = quote.id || `${quote.quoteNumber || ""}-${quote.clientName || ""}-${quote.projectAddress || ""}`;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      cleaned.push(quote);
    }

    return cleaned;
  }

  function migrateLegacyQuotesIfNeeded() {
    const legacyRaw = localStorage.getItem("quotesnapSavedQuotes");
    const activeRaw = localStorage.getItem("quotesnapActiveQuotes");
    const archivedRaw = localStorage.getItem("quotesnapArchivedQuotes");

    const hasNewData =
      (activeRaw && safeParseQuotes("quotesnapActiveQuotes").length > 0) ||
      (archivedRaw && safeParseQuotes("quotesnapArchivedQuotes").length > 0);

    if (!legacyRaw || hasNewData) return;

    const legacyQuotes: QuoteItem[] = safeParseQuotes("quotesnapSavedQuotes");

    const normalized = legacyQuotes.map((q) => ({
      ...q,
      status: q.status || "Draft",
    }));

    const activeQuotes = dedupeQuotes(normalized.filter((q) => q.status !== "Archived"));
    const archivedQuotes = dedupeQuotes(
      normalized
        .filter((q) => q.status === "Archived")
        .map((q) => ({
          ...q,
          archivedAt: q.archivedAt || new Date().toISOString(),
        }))
    );

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(activeQuotes));
    localStorage.setItem("quotesnapArchivedQuotes", JSON.stringify(archivedQuotes));
  }

  function cleanDuplicateActiveQuotes() {
    const active = safeParseQuotes("quotesnapActiveQuotes");
    const cleaned = dedupeQuotes(active);

    if (cleaned.length !== active.length) {
      localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(cleaned));
    }
  }

  function loadQuotes() {
    const stored = safeParseQuotes("quotesnapActiveQuotes");
    const cleaned = dedupeQuotes(stored);

    if (cleaned.length !== stored.length) {
      localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(cleaned));
    }

    setQuotes([...cleaned].reverse());
  }

  function saveActiveQuotes(updatedQuotes: QuoteItem[]) {
    const storageOrder = dedupeQuotes([...updatedQuotes].reverse());
    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(storageOrder));
    setQuotes([...storageOrder].reverse());
  }

  function goHome() {
    window.location.href = "/";
  }

  function goArchive() {
    window.location.href = "/archive";
  }

  function goCurrentJobs() {
    window.location.href = "/current-jobs";
  }

  function openQuote(quote: QuoteItem) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }

  function duplicateQuote(quote: QuoteItem) {
    const duplicate: QuoteItem = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: "",
      quoteDate: new Date().toISOString().slice(0, 10),
      status: "Draft",
      archivedAt: undefined,
    };

    localStorage.setItem("quotesnapEditDraft", JSON.stringify(duplicate));
    window.location.href = "/new-quote";
  }

  function deleteQuote(quoteToDelete: QuoteItem) {
    const confirmed = window.confirm(
      `Delete quote for ${quoteToDelete.clientName || "this client"}?`
    );

    if (!confirmed) return;

    const updated = quotes.filter((q) => q.id !== quoteToDelete.id);
    saveActiveQuotes(updated);
  }

  function updateStatus(quoteToUpdate: QuoteItem, status: QuoteStatus) {
    const active = safeParseQuotes("quotesnapActiveQuotes");
    const cleanedActive = dedupeQuotes(active);

    if (status === "Archived") {
      const archived = safeParseQuotes("quotesnapArchivedQuotes");

      const updatedActive = cleanedActive.filter(
        (q: QuoteItem) => q.id !== quoteToUpdate.id
      );

      const cleanedArchived = archived.filter(
        (q: QuoteItem) => q.id !== quoteToUpdate.id
      );

      cleanedArchived.unshift({
        ...quoteToUpdate,
        status: "Archived",
        archivedAt: new Date().toISOString(),
      });

      localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(updatedActive));
      localStorage.setItem(
        "quotesnapArchivedQuotes",
        JSON.stringify(dedupeQuotes(cleanedArchived))
      );

      setQuotes([...updatedActive].reverse());
      return;
    }

    const updatedActive = cleanedActive.map((q) =>
      q.id === quoteToUpdate.id ? { ...q, status, archivedAt: undefined } : q
    );

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(updatedActive));
    setQuotes([...updatedActive].reverse());
  }

  function statusColor(status: QuoteItem["status"]) {
    if (status === "Approved") {
      return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
    }
    if (status === "Sent") {
      return { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" };
    }
    return { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" };
  }

  const visibleQuotes = quotes.filter((q) => (q.status || "Draft") !== "Approved");

  const filtered = visibleQuotes.filter((q) =>
    `${q.clientName || ""} ${q.quoteNumber || ""} ${q.projectAddress || ""}`
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

          <button onClick={goCurrentJobs} style={navButton}>
            Current Jobs
          </button>

          <button onClick={goArchive} style={navButton}>
            Archive
          </button>
        </div>

        <div style={card}>
          <h1 style={title}>Quotes</h1>

          <p style={subtitle}>
            Draft and sent quotes live here. Approved jobs move to Current Jobs.
          </p>

          <input
            placeholder="Search client, address, or quote #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchBox}
          />

          {filtered.length === 0 ? (
            <div style={emptyBox}>No draft or sent quotes found.</div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {filtered.map((quote) => {
                const colors = statusColor(quote.status);

                return (
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
                          {quote.quoteNumber || "No Quote #"} • {" "}
                          {quote.quoteDate || "No Date"} • {" "}
                          {quote.projectTotal || "$0"}
                        </div>

                        <div style={address}>{quote.projectAddress || ""}</div>
                      </div>

                      <div
                        style={{
                          ...statusPill,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {quote.status || "Draft"}
                      </div>
                    </div>

                    <div style={buttonRow}>
                      <button onClick={() => openQuote(quote)} style={btnDark}>
                        Open
                      </button>

                      <button
                        onClick={() => duplicateQuote(quote)}
                        style={btnOrange}
                      >
                        Duplicate
                      </button>

                      <button
                        onClick={() => updateStatus(quote, "Draft")}
                        style={btnLight}
                      >
                        Draft
                      </button>

                      <button
                        onClick={() => updateStatus(quote, "Sent")}
                        style={btnLight}
                      >
                        Sent
                      </button>

                      <button
                        onClick={() => updateStatus(quote, "Approved")}
                        style={btnGreen}
                      >
                        Move to Current Jobs
                      </button>

                      <button
                        onClick={() => updateStatus(quote, "Archived")}
                        style={btnGray}
                      >
                        Archive
                      </button>

                      <button
                        onClick={() => deleteQuote(quote)}
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
  marginBottom: "8px",
};

const subtitle = {
  fontSize: "14px",
  color: "#78716c",
  marginTop: 0,
  marginBottom: "16px",
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

const statusPill = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  whiteSpace: "nowrap" as const,
  height: "fit-content",
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

const btnLight = {
  background: "#fff7ed",
  color: "#9a3412",
  border: "1px solid #fdba74",
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

const btnGray = {
  background: "#e7e5e4",
  color: "#44403c",
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
