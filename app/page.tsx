"use client";

export default function HomePage() {
  function goNewQuote() {
    window.location.href = "/new-quote";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  function goTemplates() {
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
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "14px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          border: "1px solid #e7e5e4",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
            color: "#1c1917",
          }}
        >
          QuoteSnap
        </h1>

        <p
          style={{
            color: "#57534e",
            marginBottom: "28px",
            fontSize: "15px",
          }}
        >
          Fast field quotes for excavation work
        </p>

        <div style={{ display: "grid", gap: "14px" }}>
          <button onClick={goNewQuote} style={buttonStyle}>
            New Quote
          </button>

          <button onClick={goQuotes} style={buttonStyle}>
            Quotes
          </button>

          <button onClick={goTemplates} style={buttonStyle}>
            Templates
          </button>
        </div>
      </div>
    </main>
  );
}

const buttonStyle = {
  padding: "14px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "10px",
  border: "none",
  background: "#f97316",
  color: "white",
  cursor: "pointer",
  width: "100%",
};