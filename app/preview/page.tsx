"use client";

import { useEffect, useState } from "react";

export default function PreviewPage() {
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("quotesnapDraft");

    if (stored) {
      setQuote(JSON.parse(stored));
    }
  }, []);

  if (!quote) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading Quote...
      </main>
    );
  }

  function goHome() {
    window.location.href = "/";
  }

  function editQuote() {
    localStorage.setItem(
      "quotesnapEditDraft",
      JSON.stringify(quote)
    );

    window.location.href = "/new-quote";
  }

  function exportPDF() {
    window.print();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* Top Buttons */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={goHome}
            style={secondaryButton}
          >
            Home
          </button>

          <button
            onClick={editQuote}
            style={secondaryButton}
          >
            Edit Quote
          </button>

          <button
            onClick={exportPDF}
            style={primaryButton}
          >
            Export to PDF
          </button>
        </div>

        {/* Quote Card */}

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Banner Image */}

          {quote.bannerImage ? (
            <img
              src={quote.bannerImage}
              alt="Project"
              style={{
                width: "100%",
                maxHeight: "320px",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : null}

          <div style={{ padding: "30px 24px" }}>
            {/* Header */}

            <div
              style={{
                marginBottom: "28px",
                paddingBottom: "18px",
                borderBottom: "1px solid #e7e5e4",
              }}
            >
              <h1
                style={{
                  fontSize: "34px",
                  margin: "0 0 6px 0",
                  color: "#1c1917",
                }}
              >
                PROJECT QUOTE
              </h1>

              <div
                style={{
                  fontSize: "15px",
                  color: "#78716c",
                }}
              >
                iRock Excavation & Hauling
              </div>
            </div>

            {/* Info Grid */}

            <div style={infoGrid}>
              <InfoCard
                label="Client"
                value={quote.clientName}
              />

              <InfoCard
                label="Quote Number"
                value={quote.quoteNumber}
              />

              <InfoCard
                label="Address"
                value={quote.projectAddress}
              />

              <InfoCard
                label="Date"
                value={quote.quoteDate}
              />

              <InfoCard
                label="Contact"
                value={quote.contactInfo}
              />

              <InfoCard
                label="Estimated Start"
                value={quote.startWindow}
              />
            </div>

            {/* Total */}

            <div
              style={{
                marginTop: "30px",
                marginBottom: "30px",
                background:
                  "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
                border: "1px solid #fdba74",
                borderRadius: "18px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  color: "#9a3412",
                  marginBottom: "8px",
                  letterSpacing: "0.06em",
                }}
              >
                PROJECT TOTAL
              </div>

              <div
                style={{
                  fontSize: "44px",
                  fontWeight: 800,
                  color: "#1c1917",
                }}
              >
                {quote.projectTotal || "$0"}
              </div>
            </div>

            {/* Scope */}

            <SectionCard title="Scope of Work">
              <div
                style={{
                  whiteSpace: "pre-line",
                  lineHeight: 1.7,
                }}
              >
                {quote.scopeOfWork}
              </div>
            </SectionCard>

            {/* Terms & Notes */}

            {(quote.includePaymentTerms ||
              quote.includeWeatherDisclaimer ||
              quote.includeScopeDisclaimer ||
              quote.includeDepositNote) && (
              <SectionCard title="Terms & Notes">
                <div
                  style={{
                    lineHeight: 1.7,
                  }}
                >
                  {quote.includePaymentTerms && (
                    <p>
                      Payment is due upon completion
                      unless other terms are agreed to
                      in writing.
                    </p>
                  )}

                  {quote.includeWeatherDisclaimer && (
                    <p>
                      Weather conditions, material
                      availability, and site
                      accessibility may affect
                      scheduling timelines.
                    </p>
                  )}

                  {quote.includeScopeDisclaimer && (
                    <p>
                      Any work requested outside the
                      listed scope may require
                      additional approval and pricing.
                    </p>
                  )}

                  {quote.includeDepositNote && (
                    <p>
                      A deposit may be required prior
                      to scheduling or material
                      delivery.
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Next Steps */}

            <SectionCard title="Next Steps">
              <div
                style={{
                  lineHeight: 1.7,
                }}
              >
                To move forward with this project,
                reply to this quote or contact iRock
                Excavation directly. Once approved,
                your project will be placed on the
                schedule.
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#fafaf9",
        border: "1px solid #e7e5e4",
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: "#78716c",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#1c1917",
          lineHeight: 1.5,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: "22px",
        background: "#ffffff",
        border: "1px solid #e7e5e4",
        borderRadius: "16px",
        padding: "22px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "14px",
          color: "#1c1917",
        }}
      >
        {title}
      </h2>

      {children}
    </div>
  );
}

const infoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const primaryButton = {
  padding: "14px 18px",
  borderRadius: "10px",
  border: "none",
  background: "#f97316",
  color: "#ffffff",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "14px 18px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#ffffff",
  color: "#1c1917",
  fontWeight: "bold" as const,
  cursor: "pointer",
};