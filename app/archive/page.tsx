"use client";

import { useEffect, useState } from "react";

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
  status?: "Draft" | "Sent" | "Approved" | "Archived";
  archivedAt?: string;
};

export default function ArchivePage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadArchivedQuotes();
  }, []);

  function loadArchivedQuotes() {
    const stored = JSON.parse(
      localStorage.getItem("quotesnapArchivedQuotes") || "[]"
    );
    setQuotes([...stored].reverse());
  }

  function saveArchivedQuotes(updatedQuotes: QuoteItem[]) {
    const storageOrder = [...updatedQuotes].reverse();
    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(storageOrder)
    );
    setQuotes(updatedQuotes);
  }

  function goHome() {
    window.location.href = "/";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  function openQuote(quote: QuoteItem) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }

  function restoreQuote(quoteToRestore: QuoteItem) {
    const archived = JSON.parse(
      localStorage.getItem("quotesnapArchivedQuotes") || "[]"
    );

    const active = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    const updatedArchived = archived.filter(
      (q: QuoteItem) => q.id !== quoteToRestore.id
    );

    active.unshift({
      ...quoteToRestore,
      status: "Draft",
      archivedAt: undefined,
    });

    localStorage.setItem(
      "quotesnapArchivedQuotes",
      JSON.stringify(updatedArchived)
    );

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(active));

    setQuotes([...updatedArchived].reverse());
  }

  function deleteArchivedQuote(quoteToDelete: QuoteItem) {
    const confirmed = window.confirm(
      `Permanently delete archived quote for ${
        quoteToDelete.clientName || "this client"
      }?`
    );

    if (!confirmed) return;

    const updated = quotes.filter((q) => q.id !== quoteToDelete.id);
    saveArchivedQuotes(updated);
  }

  const filtered = quotes.filter((q) =>
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

          <button onClick={goQuotes} style={navButton}>
            Quotes
          </button>
        </div>

        <div style={card}>
          <h1 style={title}>Archive</h1>

          <input
            placeholder="Search archived quotes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                        Archived:{" "}
                        {quote.archivedAt
                          ? new Date(quote.archivedAt).toLocaleDateString()
                          : "Unknown"}
                      </div>
                    </div>

                    <div style={archivedPill}>Archived</div>
                  </div>

                  <div style={buttonRow}>
                    <button onClick={() => openQuote(quote)} style={btnDark}>
                      Open
                    </button>

                    <button
                      onClick={() => restoreQuote(quote)}
                      style={btnOrange}
                    >
                      Restore
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

const title = {
  fontSize: "30px",
  fontWeight: 800,
  marginBottom: "12px",
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

const btnDelete = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "8px 12px",
  cursor: "pointer",
};