"use client";

import { useEffect, useState } from "react";

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("quotesnapSavedQuotes") || "[]"
    );

    setQuotes([...stored].reverse());
  }, []);

  function openQuote(quote: any) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }

  function goHome() {
    window.location.href = "/";
  }

  const filtered = quotes.filter((q) =>
    `${q.clientName || ""} ${q.quoteNumber || ""}`
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
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        <button
          onClick={goHome}
          style={{
            marginBottom: "20px",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#e7e5e4",
            cursor: "pointer",
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
          placeholder="Search client or quote #"
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
            filtered.map((quote, i) => (
              <div
                key={quote.id || i}
                onClick={() => openQuote(quote)}
                style={{
                  padding: "18px",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fff7ed")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
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
                  }}
                >
                  {quote.quoteNumber || "No Quote #"} •{" "}
                  {quote.quoteDate || "No Date"} •{" "}
                  {quote.projectTotal || "$0"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}