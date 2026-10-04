"use client";

export default function DashboardPage() {
  const goTo = (path: string) => {
    window.location.href = path;
  };

  const gaugeStyle = {
    flex: "1 1 140px",
    minWidth: "140px",
    background: "#181818",
    border: "1px solid #333",
    borderRadius: "18px",
    padding: "22px 14px",
    textAlign: "center" as const,
    cursor: "pointer",
    boxShadow: "inset 0 0 18px rgba(255,255,255,0.03)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            gap: "20px",
          }}
        >
          <div>
            <div
              onClick={() => goTo("/")}
              style={{
                color: "#f97316",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "8px",
              }}
            >
              ← HOME
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              QUOTESNAP
            </h1>

            <div
              style={{
                color: "#888",
                marginTop: "4px",
                letterSpacing: "2px",
                fontSize: "12px",
              }}
            >
              CONTROL CENTER
            </div>
          </div>

          <div
            style={{
              background: "#181818",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "10px 14px",
              color: "#f97316",
              fontWeight: 800,
              fontSize: "13px",
            }}
          >
            ● SYSTEM READY
          </div>
        </div>

        {/* GAUGES */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div onClick={() => goTo("/quotes")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>0</div>
            <div style={{ color: "#999", fontSize: "12px" }}>
              OPEN QUOTES
            </div>
          </div>

          <div onClick={() => goTo("/current-jobs")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>0</div>
            <div style={{ color: "#999", fontSize: "12px" }}>
              ACCEPTED JOBS
            </div>
          </div>

          <div onClick={() => goTo("/follow-ups")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏱</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>0</div>
            <div style={{ color: "#999", fontSize: "12px" }}>
              FOLLOW-UPS
            </div>
          </div>

          <div onClick={() => goTo("/current-jobs")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
            <div style={{ fontSize: "28px", fontWeight: 900 }}>$0</div>
            <div style={{ color: "#999", fontSize: "12px" }}>
              ACCEPTED VALUE
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div
          style={{
            background: "#151515",
            border: "1px solid #333",
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#f97316",
              fontWeight: 800,
              letterSpacing: "1px",
              marginBottom: "16px",
            }}
          >
            QUICK ACTIONS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            <Action
              icon="＋"
              label="NEW QUOTE"
              onClick={() => goTo("/new-quote")}
            />

            <Action
              icon="📄"
              label="QUOTES"
              onClick={() => goTo("/quotes")}
            />

            <Action
              icon="⏱"
              label="FOLLOW-UPS"
              onClick={() => goTo("/follow-ups")}
            />

            <Action
              icon="✓"
              label="CURRENT JOBS"
              onClick={() => goTo("/current-jobs")}
            />

            <Action
              icon="📦"
              label="ARCHIVE"
              onClick={() => goTo("/archive")}
            />

            <Action
              icon="⚙"
              label="SETTINGS"
              onClick={() => alert("Coming soon")}
            />
          </div>
        </div>

        {/* FUTURE AI PANEL */}
        <div
          style={{
            background: "#151515",
            border: "1px solid #333",
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#f97316",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              AI
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: "17px" }}>
                QuoteSnap Assistant
              </div>

              <div
                style={{
                  color: "#888",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                AI estimating, quote assistance and workflow tools coming online.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#222",
        border: "1px solid #3a3a3a",
        borderRadius: "12px",
        color: "white",
        padding: "18px 12px",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          color: "#f97316",
          marginBottom: "7px",
        }}
      >
        {icon}
      </div>

      {label}
    </button>
  );
}
