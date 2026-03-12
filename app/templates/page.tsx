"use client";

const templates = [
  {
    id: "driveway-refresh",
    name: "Driveway Refresh",
    startWindow: "2–3 weeks after approval",
    scopeOfWork: `• Power rake existing gravel driveway surface
• Re-establish driveway grade and remove minor ruts
• Add and spread fresh DGA surface layer as needed
• Compact surface using vibratory roller
• Leave driveway with a clean finished appearance`,
  },
  {
    id: "culvert-install",
    name: "Culvert Install",
    startWindow: "2–4 weeks after approval",
    scopeOfWork: `• Excavate driveway crossing for culvert installation
• Install properly sized culvert pipe
• Backfill and compact around pipe
• Restore driveway surface with fresh stone
• Leave work area clean and passable`,
  },
  {
    id: "shed-pad",
    name: "Shed Pad",
    startWindow: "1–2 weeks after approval",
    scopeOfWork: `• Strip and prepare pad area
• Establish proper grade for structure placement
• Install and compact stone base
• Fine grade for clean finished appearance`,
  },
  {
    id: "drainage-repair",
    name: "Drainage Repair",
    startWindow: "2–3 weeks after approval",
    scopeOfWork: `• Excavate affected drainage area
• Correct water flow issues where possible
• Install stone and/or drainage improvements as needed
• Restore disturbed areas to a clean finished condition`,
  },
];

export default function TemplatesPage() {
  function useTemplate(template: (typeof templates)[number]) {
    localStorage.setItem(
      "quotesnapEditDraft",
      JSON.stringify({
        clientName: "",
        projectAddress: "",
        contactInfo: "",
        quoteDate: "",
        projectTotal: "",
        startWindow: template.startWindow,
        scopeOfWork: template.scopeOfWork,
        bannerImage: "",
      })
    );

    window.location.href = "/new-quote";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "42px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Templates
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#555",
            marginBottom: "30px",
          }}
        >
          Select a template to start a quote with pre-filled scope language.
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => useTemplate(template)}
              style={{
                background: "white",
                border: "1px solid #e7e5e4",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
                {template.name}
              </div>
              <div style={{ color: "#57534e", lineHeight: 1.6 }}>
                {template.scopeOfWork.split("\n").slice(0, 2).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}