"use client";

const templates = [
  {
    title: "Driveway Refresh",
    description: "Best for worn gravel drives that need reshaping and fresh surface stone.",
    scope:
      "• Power rake existing gravel driveway surface\n• Re-establish driveway grade and remove minor ruts",
  },
  {
    title: "Culvert Installation",
    description: "For driveway crossings that need a new culvert or replacement pipe.",
    scope:
      "• Excavate driveway crossing for culvert installation\n• Install properly sized culvert pipe",
  },
  {
    title: "Pad Prep",
    description: "Good starting point for sheds, garages, containers, or small structures.",
    scope:
      "• Strip and prepare pad area\n• Establish proper grade for structure placement",
  },
  {
    title: "Drainage Repair",
    description: "Use when water flow is causing washout, soft spots, or drainage trouble.",
    scope:
      "• Excavate affected drainage area\n• Correct water flow issues where possible",
  },
];

export default function TemplatesPage() {
  function goHome() {
    window.location.href = "/";
  }

  function startFromTemplate(scope: string) {
    const existingDraft = JSON.parse(
      localStorage.getItem("quotesnapEditDraft") ||
        localStorage.getItem("quotesnapDraft") ||
        "{}"
    );

    const updatedDraft = {
      ...existingDraft,
      scopeOfWork: scope,
    };

    localStorage.setItem("quotesnapEditDraft", JSON.stringify(updatedDraft));
    window.location.href = "/new-quote";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        padding: "28px 20px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
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
            fontSize: "44px",
            margin: "0 0 10px 0",
            color: "#1c1917",
          }}
        >
          Templates
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#57534e",
            margin: "0 0 28px 0",
            maxWidth: "760px",
          }}
        >
          Select a template to start a quote with pre-filled scope language.
        </p>

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {templates.map((template) => (
            <button
              key={template.title}
              type="button"
              onClick={() => startFromTemplate(template.scope)}
              style={{
                textAlign: "left",
                width: "100%",
                background: "#ffffff",
                color: "#1c1917",
                border: "1px solid #e7e5e4",
                borderRadius: "16px",
                padding: "22px 22px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  marginBottom: "6px",
                  color: "#1c1917",
                }}
              >
                {template.title}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#9a3412",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                Tap to use this template
              </div>

              <div
                style={{
                  fontSize: "15px",
                  color: "#57534e",
                  marginBottom: "14px",
                  lineHeight: 1.55,
                }}
              >
                {template.description}
              </div>

              <div
                style={{
                  fontSize: "16px",
                  color: "#292524",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {template.scope}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}