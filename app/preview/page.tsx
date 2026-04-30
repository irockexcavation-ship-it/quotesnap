"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import irockLogo from "../irock-logo.png";

const COMPANY_NAME = "iRock Excavation & Hauling";
const COMPANY_TAGLINE = "Rock Solid Driveway Systems";
const COMPANY_PHONE = "(502) 552-9462";
const COMPANY_EMAIL = "irockexcavation@gmail.com";
const COMPANY_WEBSITE = "iRockX.com";

type PaymentStatus = "Paid" | "Unpaid";

export default function PreviewPage() {
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("quotesnapDraft");
    if (data) {
      const parsed = JSON.parse(data);

      setQuote({
        ...parsed,
        paymentStatus:
          parsed.paymentStatus || "Unpaid",
      });
    }
  }, []);

  if (!quote) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildFileName() {
    const quoteNum =
      quote.quoteNumber || "IR-no-number";

    const client = quote.clientName
      ? slugify(quote.clientName)
      : "client";

    return `${client}_${quoteNum}_quote.pdf`;
  }

  async function exportPDF() {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text(COMPANY_NAME, 20, 20);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(COMPANY_PHONE, 20, 28);
    pdf.text(COMPANY_EMAIL, 20, 34);
    pdf.text(COMPANY_WEBSITE, 20, 40);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Project Quote", 20, 56);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);

    let y = 20;

if (quote.bannerImage) {
  try {
    const imgWidth = 170;
    const imgHeight = 55;

    pdf.addImage(quote.bannerImage, "JPEG", 20, y, imgWidth, imgHeight);
    y += imgHeight + 14;
  } catch {
    y = 68;
  }
} else {
  y = 68;
}

    const rows = [
      ["Quote #", quote.quoteNumber || "-"],
      ["Client", quote.clientName || "-"],
      ["Address", quote.projectAddress || "-"],
      ["Contact", quote.contactInfo || "-"],
      ["Date", quote.quoteDate || "-"],
      ["Payment", quote.paymentStatus || "Unpaid"],
    ];

    rows.forEach((row) => {
      pdf.text(`${row[0]}: ${row[1]}`, 20, y);
      y += 8;
    });

    y += 6;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text(
      `Total: ${quote.projectTotal || "$0"}`,
      20,
      y
    );

    y += 16;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Estimated Start Window", 20, y);

    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const startLines = pdf.splitTextToSize(
      quote.startWindow || "-",
      170
    );

    pdf.text(startLines, 20, y);

    y += startLines.length * 6 + 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("Scope of Work", 20, y);

    y += 8;

    pdf.setFont("helvetica", "normal");

    const scopeLines = pdf.splitTextToSize(
      quote.scopeOfWork || "-",
      170
    );

    pdf.text(scopeLines, 20, y);

    const quoteBytes = pdf.output("arraybuffer");

    const mergedPdf =
      await PDFDocument.create();

    const quoteDoc =
      await PDFDocument.load(quoteBytes);

    const quotePages =
      await mergedPdf.copyPages(
        quoteDoc,
        quoteDoc.getPageIndices()
      );

    quotePages.forEach((page) =>
      mergedPdf.addPage(page)
    );

    try {
      const coiResponse = await fetch(
        "/coi.pdf"
      );

      if (coiResponse.ok) {
        const coiBytes =
          await coiResponse.arrayBuffer();

        const coiDoc =
          await PDFDocument.load(coiBytes);

        const coiPages =
          await mergedPdf.copyPages(
            coiDoc,
            coiDoc.getPageIndices()
          );

        coiPages.forEach((page) =>
          mergedPdf.addPage(page)
        );
      }
    } catch {}

    const finalBytes =
      await mergedPdf.save();

    const pdfBuffer = finalBytes.buffer.slice(
  finalBytes.byteOffset,
  finalBytes.byteOffset + finalBytes.byteLength
);

const blob = new Blob(
  [pdfBuffer as ArrayBuffer],
  {
    type: "application/pdf",
  }
);

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = buildFileName();
    link.click();

    URL.revokeObjectURL(url);
  }

  function updatePayment(
    paymentStatus: PaymentStatus
  ) {
    const updatedQuote = {
      ...quote,
      paymentStatus,
    };

    const activeQuotes = JSON.parse(
      localStorage.getItem(
        "quotesnapActiveQuotes"
      ) || "[]"
    );

    const updated = activeQuotes.map(
      (q: any) =>
        q.id === updatedQuote.id
          ? updatedQuote
          : q
    );

    localStorage.setItem(
      "quotesnapActiveQuotes",
      JSON.stringify(updated)
    );

    localStorage.setItem(
      "quotesnapDraft",
      JSON.stringify(updatedQuote)
    );

    setQuote(updatedQuote);
  }

  function handleApproveJob() {
    const approvedQuote = {
      ...quote,
      status: "Approved",
      paymentStatus:
        quote.paymentStatus || "Unpaid",
      approvedAt:
        quote.approvedAt ||
        new Date().toISOString(),
    };

    const activeQuotes = JSON.parse(
      localStorage.getItem(
        "quotesnapActiveQuotes"
      ) || "[]"
    );

    const updatedQuotes =
      activeQuotes.filter(
        (q: any) =>
          q.id !== approvedQuote.id
      );

    updatedQuotes.unshift(
      approvedQuote
    );

    localStorage.setItem(
      "quotesnapActiveQuotes",
      JSON.stringify(updatedQuotes)
    );

    localStorage.setItem(
      "quotesnapDraft",
      JSON.stringify(approvedQuote)
    );

    setQuote(approvedQuote);
  }

  function handleEdit() {
    localStorage.setItem(
      "quotesnapEditDraft",
      JSON.stringify(quote)
    );

    window.location.href =
      "/new-quote";
  }

  function goHome() {
    window.location.href = "/";
  }

  function goCurrentJobs() {
    window.location.href =
      "/current-jobs";
  }

  const paid =
    quote.paymentStatus === "Paid";

  return (
    <main
      style={{
        background: "#f5f5f4",
        minHeight: "100vh",
        padding: "24px 14px 40px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin:
            "0 auto 20px auto",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={goHome}
          style={topButton(
            "#e7e5e4",
            "#1c1917"
          )}
        >
          Home
        </button>

        <button
          onClick={exportPDF}
          style={topButton(
            "#1c1917",
            "#ffffff"
          )}
        >
          Export PDF
        </button>

        <button
          onClick={handleApproveJob}
          style={topButton(
            "#15803d",
            "#ffffff"
          )}
        >
          Mark Approved
        </button>

        <button
          onClick={() =>
            updatePayment(
              paid
                ? "Unpaid"
                : "Paid"
            )
          }
          style={topButton(
            paid
              ? "#d6d3d1"
              : "#166534",
            paid
              ? "#1c1917"
              : "#ffffff"
          )}
        >
          {paid
            ? "Mark Unpaid"
            : "Mark Paid"}
        </button>

        <button
          onClick={
            goCurrentJobs
          }
          style={topButton(
            "#7c2d12",
            "#ffffff"
          )}
        >
          Current Jobs
        </button>

        <button
          onClick={handleEdit}
          style={topButton(
            "#2563eb",
            "#ffffff"
          )}
        >
          Edit Quote
        </button>
      </div>

      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "16px",
          overflow: "hidden",
          border:
            "1px solid #e7e5e4",
        }}
      >
        {quote.bannerImage ? (
          <img
            src={
              quote.bannerImage
            }
            alt="Project"
            style={{
              width: "100%",
              height: "260px",
              objectFit:
                "cover",
            }}
          />
        ) : null}

        <div
          style={{
            padding:
              "34px 32px 36px",
          }}
        >
          <img
            src={
              irockLogo.src
            }
            alt="Logo"
            style={{
              height: "70px",
              marginBottom:
                "14px",
            }}
          />

          <h1
            style={{
              margin:
                "0 0 10px",
              fontSize:
                "30px",
            }}
          >
            {
              COMPANY_NAME
            }
          </h1>

          <div
            style={{
              color:
                "#57534e",
              marginBottom:
                "24px",
            }}
          >
            {
              COMPANY_TAGLINE
            }
          </div>

          <div
            style={{
              display:
                "grid",
              gap: "8px",
              marginBottom:
                "24px",
            }}
          >
            <InfoRow
              label="Quote #"
              value={
                quote.quoteNumber
              }
            />
            <InfoRow
              label="Client"
              value={
                quote.clientName
              }
            />
            <InfoRow
              label="Address"
              value={
                quote.projectAddress
              }
            />
            <InfoRow
              label="Contact"
              value={
                quote.contactInfo
              }
            />
            <InfoRow
              label="Date"
              value={
                quote.quoteDate
              }
            />
          </div>

          <div
            style={{
              display:
                "flex",
              gap: "10px",
              flexWrap:
                "wrap",
              marginBottom:
                "20px",
            }}
          >
            <span
              style={
                quote.status ===
                "Approved"
                  ? approvedBadge
                  : draftBadge
              }
            >
              {quote.status ||
                "Draft"}
            </span>

            <span
              style={
                paid
                  ? paidBadge
                  : unpaidBadge
              }
            >
              {paid
                ? "Paid"
                : "Unpaid"}
            </span>
          </div>

          <div
            style={{
              fontSize:
                "42px",
              fontWeight:
                800,
              marginBottom:
                "24px",
            }}
          >
            {
              quote.projectTotal
            }
          </div>

          <SectionCard title="Estimated Start Window">
            <p style={bodyText}>
              {quote.startWindow ||
                "-"}
            </p>
          </SectionCard>

          <SectionCard title="Scope of Work">
            <p
              style={{
                ...bodyText,
                whiteSpace:
                  "pre-line",
              }}
            >
              {quote.scopeOfWork ||
                "-"}
            </p>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "90px 1fr",
        gap: "10px",
      }}
    >
      <strong>
        {label}
      </strong>
      <span>
        {value || "-"}
      </span>
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
    <section
      style={{
        marginBottom:
          "18px",
        padding:
          "18px",
        border:
          "1px solid #e7e5e4",
        borderRadius:
          "14px",
      }}
    >
      <h2
        style={{
          margin:
            "0 0 10px",
          fontSize:
            "22px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function topButton(
  background: string,
  color: string
) {
  return {
    padding:
      "12px 18px",
    borderRadius:
      "8px",
    border: "none",
    background,
    color,
    cursor: "pointer",
    fontWeight:
      "bold" as const,
  };
}

const bodyText = {
  margin: 0,
  lineHeight: 1.8,
  color: "#292524",
};

const approvedBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 800,
};

const draftBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#e7e5e4",
  color: "#44403c",
  fontWeight: 800,
};

const paidBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: 800,
};

const unpaidBadge = {
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 800,
};