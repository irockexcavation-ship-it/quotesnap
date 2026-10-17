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
        boxSizing: "border-box",
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
          boxSizing: "border-box",
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

        <h1 style={{ margin: 0, fontSize: "34px", fontWeight: 800, color: "#111111" }}>
          QuoteSnap
        </h1>

        <p style={{ margin: "8px 0 30px", color: "#666666", fontSize: "15px" }}>
          Fast quotes. Simple invoicing. Built for your business.
        </p>

        <button type="button" onClick={() => goTo("/login")} style={buttonStyle}>
          LOG IN
        </button>

        <button
          type="button"
          onClick={() => goTo("/signup")}
          style={{ ...buttonStyle, background: "#111111", marginBottom: 0 }}
        >
          CREATE ACCOUNT
        </button>

        <p style={{ margin: "24px 0 0", color: "#78716c", fontSize: "12px" }}>
          Your business. Your quotes. Your customers.
        </p>
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
