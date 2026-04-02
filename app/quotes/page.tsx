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
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  function loadQuotes() {
    const stored = JSON.parse(
      localStorage.getItem("quotesnapSavedQuotes") || "[]"
    );

    const normalized = stored.map((q: QuoteItem) => ({
      ...q,
      status: q.status || "Draft",
    }));

    setQuotes([...normalized].reverse());
    localStorage.setItem("quotesnapSavedQuotes", JSON.stringify(normalized));
  }

  function goHome() {
    window.location.href = "/";
  }

  function saveQuotes(updatedQuotes: QuoteItem[]) {
    const newestFirst = [...updatedQuotes];
    const storageOrder = [...newestFirst].reverse();
    localStorage.setItem("quotesnapSavedQuotes", JSON.stringify(storageOrder));
    setQuotes(newestFirst);
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
    saveQuotes(updated);
  }

  function updateStatus(quoteToUpdate: QuoteItem, status: QuoteItem["status"]) {
    const updated = quotes.map((q) =>
      q.id === quoteToUpdate.id ? { ...q, status } : q
    );
    saveQuotes(updated);
  }

  function statusColor(status: QuoteItem["status"]) {
    if (status === "Approved") {
      return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
    }
    if (status === "Sent") {
      return { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" };
    }
    if (status === "Archived") {
      return { bg: "#e7e5e4", text: "#44403c", border: "#d6d3d1" };
    }
    return { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" };
  }

  const filtered = quotes
    .filter((q) => (showArchived ? true : q.status !== "Archived"))
    .filter((q) =>
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
        <button onClick={goHome} style={navButton}>
          Home
        </button>

        <div style={card}>
          <h1 style={title}>Quotes</h1>

          <div style={{ marginBottom: "12px" }}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={navButton}
            >
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
          </div>

          <input
            placeholder="Search client, address, or quote #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchBox}
          />

          {filtered.length === 0 ? (
            <div style={emptyBox}>No quotes found.</div>
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
                          {quote.quoteNumber || "No Quote #"} •{" "}
                          {quote.quoteDate || "No Date"} •{" "}
                          {quote.projectTotal || "$0"}
                        </div>

                        <div style={address}>
                          {quote.projectAddress || ""}
                        </div>
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
                        style={btnLight}
                      >
                        Approved
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

/* styles */

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
};

const buttonRow = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const navButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#fff",
  cursor: "pointer",
  marginBottom: "12px",
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