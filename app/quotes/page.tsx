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
        background: "#f5f5f4",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <button
          onClick={goHome}
          style={{
            marginBottom: "20px",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#e7e5e4",
            color: "#1c1917",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Home
        </button>

        <h1
          style={{
            fontSize: "30px",
            marginBottom: "20px",
            color: "#1c1917",
          }}
        >
          Quotes
        </h1>

        <input
          placeholder="Search client, address, or quote #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "1px solid #d6d3d1",
            marginBottom: "20px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            background: "white",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid #e7e5e4",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "20px", color: "#78716c" }}>
              No quotes found.
            </div>
          ) : (
            filtered.map((quote, i) => {
              const colors = statusColor(quote.status);

              return (
                <div
                  key={quote.id || i}
                  style={{
                    padding: "18px",
                    borderBottom: "1px solid #f0f0f0",
                    background: "white",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "10px",
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
                          fontWeight: "bold",
                          fontSize: "18px",
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
                          lineHeight: 1.5,
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
                        }}
                      >
                        {quote.projectAddress || ""}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
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
                      style={smallButton("#2563eb", "#ffffff")}
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
            })
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
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };
}