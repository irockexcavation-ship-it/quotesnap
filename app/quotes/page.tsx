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
  status?: "Draft" | "Sent" | "Approved";
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");

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
      return {
        bg: "#dcfce7",
        text: "#166534",
        border: "#86efac",
      };
    }

    if (status === "Sent") {
      return {
        bg: "#dbeafe",
        text: "#1d4ed8",
        border: "#93c5fd",
      };
    }

    return {
      bg: "#fff7ed",
      text: "#9a3412",
      border: "#fdba74",
    };
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
        <button
          onClick={goHome}
          style={{
            marginBottom: "20px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d6d3d1",
            background: "#ffffff",
            color: "#1c1917",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Home
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            padding: "28px 22px 24px",
          }}
        >
          <div style={{ marginBottom: "22px" }}>
            <h1
              style={{
                fontSize: "34px",
                margin: "0 0 8px 0",
                color: "#1c1917",
                letterSpacing: "-0.02em",
              }}
            >
              Quotes
            </h1>

            <div
              style={{
                fontSize: "15px",
                color: "#78716c",
                lineHeight: 1.5,
              }}
            >
              Search, open, duplicate, update status, or delete saved quotes.
            </div>
          </div>

          <input
            placeholder="Search client, address, or quote #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 15px",
              borderRadius: "12px",
              border: "1px solid #d6d3d1",
              marginBottom: "20px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: "#fafaf9",
            }}
          />

          {filtered.length === 0 ? (
            <div
              style={{
                background: "#fafaf9",
                border: "1px solid #e7e5e4",
                borderRadius: "14px",
                padding: "22px",
                color: "#78716c",
                textAlign: "center",
              }}
            >
              No quotes found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "14px",
              }}
            >
              {filtered.map((quote, i) => {
                const colors = statusColor(quote.status);

                return (
                  <div
                    key={quote.id || i}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e7e5e4",
                      borderRadius: "16px",
                      padding: "18px",
                      boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        onClick={() => openQuote(quote)}
                        style={{
                          flex: 1,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: "19px",
                            marginBottom: "6px",
                            color: "#1c1917",
                          }}
                        >
                          {quote.clientName || "Unnamed Client"}
                        </div>

                        <div
                          style={{
                            fontSize: "14px",
                            color: "#57534e",
                            lineHeight: 1.6,
                            marginBottom: "6px",
                          }}
                        >
                          {quote.quoteNumber || "No Quote #"} •{" "}
                          {quote.quoteDate || "No Date"} •{" "}
                          {quote.projectTotal || "$0"}
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "#78716c",
                            lineHeight: 1.5,
                          }}
                        >
                          {quote.projectAddress || ""}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: "7px 11px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 800,
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {quote.status || "Draft"}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openQuote(quote)}
                        style={smallButton("#1c1917", "#ffffff")}
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicateQuote(quote)}
                        style={smallButton("#f97316", "#ffffff")}
                      >
                        Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStatus(quote, "Draft")}
                        style={smallButton("#fff7ed", "#9a3412", "#fdba74")}
                      >
                        Draft
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStatus(quote, "Sent")}
                        style={smallButton("#dbeafe", "#1d4ed8", "#93c5fd")}
                      >
                        Sent
                      </button>

                      <button
                        type="button"
                        onClick={() => updateStatus(quote, "Approved")}
                        style={smallButton("#dcfce7", "#166534", "#86efac")}
                      >
                        Approved
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteQuote(quote)}
                        style={smallButton("#dc2626", "#ffffff")}
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

function smallButton(
  background: string,
  color: string,
  border?: string
) {
  return {
    background,
    color,
    border: border ? `1px solid ${border}` : "none",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };
}