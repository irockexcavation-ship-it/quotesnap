"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SavedQuote = {
  id: string;
  clientName: string;
  projectTotal: string;
};

export default function Home() {
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("quotesnapSavedQuotes");
    if (saved) {
      setSavedQuotes(JSON.parse(saved));
    }
  }, []);

  function openSavedQuote(quote: SavedQuote) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }

  function deleteSavedQuote(id: string) {
    const updatedQuotes = savedQuotes.filter((q) => q.id !== id);
    setSavedQuotes(updatedQuotes);
    localStorage.setItem("quotesnapSavedQuotes", JSON.stringify(updatedQuotes));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        color: "#1c1917",
      }}
    >
      <div
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "24px 16px 40px",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 6vw, 3.2rem)",
              fontWeight: 800,
              margin: "0 0 10px 0",
            }}
          >
            QuoteSnap
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.6vw, 1.2rem)",
              color: "#44403c",
              margin: 0,
              maxWidth: "680px",
            }}
          >
            Fast professional quotes for excavation contractors.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <Link href="/new-quote">
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #e7e5e4",
                minHeight: "130px",
                cursor: "pointer",
              }}
            >
              <h2 style={{ margin: "0 0 10px 0", fontSize: "1.35rem" }}>
                New Quote
              </h2>

              <p style={{ margin: 0, color: "#57534e" }}>
                Create a new excavation quote with price, scope, and photo.
              </p>
            </div>
          </Link>

          <Link href="/templates">
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid #e7e5e4",
                minHeight: "130px",
                cursor: "pointer",
              }}
            >
              <h2 style={{ margin: "0 0 10px 0", fontSize: "1.35rem" }}>
                Templates
              </h2>

              <p style={{ margin: 0, color: "#57534e" }}>
                Start with saved scopes like driveway refresh or culvert installs.
              </p>
            </div>
          </Link>
        </div>

        <section
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            border: "1px solid #e7e5e4",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", fontSize: "1.5rem" }}>
            Recent Saved Quotes
          </h2>

          {savedQuotes.length === 0 ? (
            <p style={{ color: "#78716c" }}>No saved quotes yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {savedQuotes.map((quote) => (
                <div
                  key={quote.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    border: "1px solid #e7e5e4",
                    borderRadius: "12px",
                    background: "#fafaf9",
                    gap: "12px",
                  }}
                >
                  <button
                    onClick={() => openSavedQuote(quote)}
                    style={{
                      background: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      flex: 1,
                      padding: 0,
                      color: "#1c1917",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {quote.clientName || "Unnamed Client"}
                    </div>

                    <div style={{ color: "#57534e" }}>
                      {quote.projectTotal || "$0"}
                    </div>
                  </button>

                  <button
                    onClick={() => deleteSavedQuote(quote.id)}
                    style={{
                      background: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}