"use client";

export default function HomePage() {
  function startNewQuote() {
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
        background:
          "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          padding: "42px 28px 30px",
          borderRadius: "20px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          textAlign: "center",
          border: "1px solid #e7e5e4",
        }}
      >
        <img
          src="/icon.png"
          alt="QuoteSnap icon"
          style={{
            width: "104px",
            height: "104px",
            marginBottom: "18px",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.14))",
          }}
        />

        <h1
          style={{
            fontSize: "34px",
            margin: "0 0 8px 0",
            color: "#1c1917",
            letterSpacing: "-0.02em",
          }}
        >
          QuoteSnap
        </h1>

        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#9a3412",
            marginBottom: "6px",
          }}
        >
          Fast Field Quotes for Contractors
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#78716c",
            marginBottom: "30px",
            lineHeight: 1.5,
          }}
        >
          Build polished quotes on-site with photos,
          templates, saved clients, and PDF export.
        </div>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          <button onClick={startNewQuote} style={primaryButton}>
            New Quote
          </button>

          <button onClick={openQuotes} style={secondaryButton}>
            Quotes
          </button>

          <button onClick={openTemplates} style={secondaryButton}>
            Templates
          </button>
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid #e7e5e4",
            fontSize: "12px",
            color: "#a8a29e",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Stupid Simple. Stupid Fast.
        </div>
      </div>
    </main>
  );
}

const primaryButton = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "none",
  background: "#f97316",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(249,115,22,0.28)",
};

const secondaryButton = {
  width: "100%",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  background: "#ffffff",
  color: "#1c1917",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};