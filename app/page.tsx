"use client";

export default function HomePage() {

  function startNewQuote() {
    // Clear any previous draft so the form opens clean
    localStorage.removeItem("quotesnapEditDraft");
    localStorage.removeItem("quotesnapDraft");

    window.location.href = "/new-quote";
  }

  function openQuotes() {
    window.location.href = "/quotes";
  }

  function openTemplates() {
    window.location.href = "/templates";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "40px 30px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
          border: "1px solid #e7e5e4"
        }}
      >
        <img
          src="/icon.png"
          style={{
            width: "80px",
            marginBottom: "20px"
          }}
        />

        <h1
          style={{
            fontSize: "28px",
            marginBottom: "6px",
            color: "#1c1917"
          }}
        >
          QuoteSnap
        </h1>

        <div
          style={{
            fontSize: "14px",
            color: "#78716c",
            marginBottom: "30px"
          }}
        >
          Stupid Simple. Stupid Fast.
        </div>

        <button
          onClick={startNewQuote}
          style={buttonStyle("#1c1917")}
        >
          New Quote
        </button>

        <button
          onClick={openQuotes}
          style={buttonStyle("#57534e")}
        >
          Quotes
        </button>

        <button
          onClick={openTemplates}
          style={buttonStyle("#78716c")}
        >
          Templates
        </button>
      </div>
    </main>
  );
}

function buttonStyle(color: string) {
  return {
    width: "100%",
    padding: "16px",
    marginBottom: "12px",
    borderRadius: "10px",
    border: "none",
    background: color,
    color: "white",
    fontSize: "16px",
    fontWeight: "bold" as const,
    cursor: "pointer"
  };
}