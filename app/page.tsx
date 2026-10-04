"use client";

export default function HomePage() {
  const goTo = (path: string) => {
    window.location.href = path;
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
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
          alt="QuoteSnap"
          style={{
            width: "104px",
            height: "104px",
            display: "block",
            margin: "0 auto 18px",
          }}
        />

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 800,
            color: "#111111",
          }}
        >
          QuoteSnap
        </h1>

        <p
          style={{
            margin: "8px 0 30px",
            color: "#666666",
            fontSize: "15px",
          }}
        >
          Fast quotes. Rock-solid workflow.
        </p>

        <button
          onClick={() => goTo("/new-quote")}
          style={buttonStyle}
        >
          ＋ NEW QUOTE
        </button>

        <button
          onClick={() => goTo("/quotes")}
          style={buttonStyle}
        >
          ▤ QUOTES
        </button>

        <button
          onClick={() => goTo("/dashboard")}
          style={{
            ...buttonStyle,
            background: "#111111",
            marginBottom: 0,
          }}
        >
          ◉ DASHBOARD
        </button>

        <div
          style={{
            marginTop: "28px",
            fontSize: "12px",
            color: "#999999",
          }}
        >
          iRock LLC
        </div>
      </div>
    </main>
  );
}

const buttonStyle = {
  width: "100%",
  padding: "17px 18px",
  marginBottom: "14px",
  border: "none",
  borderRadius: "10px",
  background: "#f97316",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 800,
  cursor: "pointer",
  letterSpacing: "0.4px",
};
