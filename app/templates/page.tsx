"use client";

const templates = [
  {
    title: "Driveway Refresh",
    description:
      "Best for gravel drives that need reshaping, fresh stone, and a cleaner finished surface.",
    scope:
      "• Power rake existing gravel driveway surface\n• Re-establish driveway grade and remove minor ruts\n• Add fresh gravel as needed\n• Compact and dress final surface",
  },
  {
    title: "Culvert Installation",
    description:
      "For driveway crossings that need a new culvert, replacement pipe, or widened entrance.",
    scope:
      "• Excavate driveway crossing for culvert installation\n• Install properly sized culvert pipe\n• Backfill and compact around pipe\n• Dress and restore driveway entrance",
  },
  {
    title: "Pad Prep",
    description:
      "A solid starting point for sheds, garages, containers, and other small structure sites.",
    scope:
      "• Strip and prepare pad area\n• Establish proper grade for structure placement\n• Add and compact base material as needed\n• Finish and dress final surface",
  },
  {
    title: "Drainage Repair",
    description:
      "Use when water flow is causing washouts, soft spots, pooling, or drainage trouble.",
    scope:
      "• Excavate affected drainage area\n• Correct water flow issues where possible\n• Install and shape proper drainage path\n• Backfill, compact, and restore disturbed area",
  },
];

export default function TemplatesPage() {
  function goHome() {
    window.location.href = "/";
  }

  function startFromTemplate(scope: string) {
    const existingDraft = JSON.parse(
      localStorage.getItem("quotesnapEditDraft") || "{}"
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
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <button
          onClick={goHome}
          style={{
            marginBottom: "20px",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #d6d3d1",
            background: "#ffffff",
            color: "#1c1917",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Home
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            padding: "28px 22px 24px",
          }}
        >
          <div style={{ marginBottom: "22px" }}>
            <h1
              style={{
                fontSize: "34px",
                margin: "0 0 8px 0",
                color: "#1c1917",
                letterSpacing: "-0.02em",
              }}
            >
              Templates
            </h1>

            <div
              style={{
                fontSize: "15px",
                color: "#78716c",
                lineHeight: 1.5,
              }}
            >
              Start faster with saved scope templates for common excavation jobs.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "14px",
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
                  padding: "18px",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: "20px",
                    marginBottom: "6px",
                    color: "#1c1917",
                  }}
                >
                  {template.title}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 800,
                    background: "#fff7ed",
                    color: "#9a3412",
                    border: "1px solid #fdba74",
                    marginBottom: "12px",
                  }}
                >
                  Tap to use template
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#57534e",
                    lineHeight: 1.6,
                    marginBottom: "12px",
                  }}
                >
                  {template.description}
                </div>

                <div
                  style={{
                    fontSize: "14px",
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
      </div>
    </main>
  );
}