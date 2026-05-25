"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import irockLogo from "../irock-logo.png";

const COMPANY_NAME = "iRock Excavation & Hauling";
const COMPANY_TAGLINE = "Rock Solid Driveway Systems";
const COMPANY_PHONE = "(502) 552-9462";
const COMPANY_EMAIL = "irockexcavation@gmail.com";
const COMPANY_WEBSITE = "iRockX.com";

export default function PreviewPage() {
  const [quote, setQuote] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("quotesnapDraft");
    if (data) setQuote(JSON.parse(data));
  }, []);

  if (!quote) return <div style={{ padding: "40px" }}>Loading...</div>;

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function buildBaseName() {
    const quoteNum = quote.quoteNumber || "IR-no-number";
    const client = quote.clientName ? slugify(quote.clientName) : "client";
    return `${client}_${quoteNum}`;
  }

  function buildFileName() {
    return `${buildBaseName()}_quote.pdf`;
  }

  function buildImageFileName() {
    return `${buildBaseName()}_quote-image.png`;
  }

  function buildPhotoFileName() {
    return `${buildBaseName()}_photo.jpg`;
  }

  async function saveQuoteImage() {
    const element = document.getElementById("quote-card");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const image = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = image;
    link.download = buildImageFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportPDF() {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = 210 - margin * 2;
    const lineHeight = 6.5;
    let y = 20;

    function ensureSpace(heightNeeded: number) {
      if (y + heightNeeded > pageHeight - margin) {
        pdf.addPage();
        y = 20;
      }
    }

    function addTextBlock(text: string) {
      const lines = pdf.splitTextToSize(text || "-", contentWidth);
      for (const line of lines) {
        ensureSpace(lineHeight);
        pdf.text(line, margin, y);
        y += lineHeight;
      }
      y += 8;
    }

    if (quote.bannerImage) {
      try {
        pdf.addImage(quote.bannerImage, "JPEG", margin, y, contentWidth, 70);
        y += 82;
      } catch {}
    }

    pdf.setFillColor(245, 245, 244);
    pdf.roundedRect(margin, y, contentWidth, 34, 4, 4, "F");

    try {
      pdf.addImage(irockLogo.src, "PNG", margin + 4, y + 4, 26, 18);
    } catch {}

    pdf.setTextColor(28, 25, 23);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(COMPANY_NAME, margin + 34, y + 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(87, 83, 78);
    pdf.text(COMPANY_TAGLINE, margin + 34, y + 17);
    pdf.text(COMPANY_PHONE, margin + 34, y + 23);
    pdf.text(COMPANY_EMAIL, margin + 34, y + 28);
    pdf.text(COMPANY_WEBSITE, margin + 34, y + 33);

    y += 46;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(28, 25, 23);
    pdf.text("PROJECT QUOTE", margin, y);
    y += 8;

    pdf.setDrawColor(231, 229, 228);
    pdf.roundedRect(margin, y, contentWidth, 40, 4, 4, "S");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Quote #:", margin + 6, y + 8);
    pdf.text("Client:", margin + 6, y + 16);
    pdf.text("Address:", margin + 6, y + 24);
    pdf.text("Date:", margin + 6, y + 32);

    pdf.setFont("helvetica", "normal");
    pdf.text(String(quote.quoteNumber || "-"), margin + 30, y + 8);
    pdf.text(String(quote.clientName || "-"), margin + 30, y + 16);
    pdf.text(String(quote.projectAddress || "-"), margin + 30, y + 24);
    pdf.text(String(quote.quoteDate || "-"), margin + 30, y + 32);

    const rightX = margin + 96;
    pdf.setFont("helvetica", "bold");
    pdf.text("Contact:", rightX, y + 8);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(quote.contactInfo || "-"), rightX + 20, y + 8);

    y += 52;

    pdf.setFillColor(255, 247, 237);
    pdf.setDrawColor(253, 186, 116);
    pdf.roundedRect(margin, y, contentWidth, 28, 4, 4, "FD");

    pdf.setTextColor(154, 52, 18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("TOTAL PROJECT COST", margin + 6, y + 8);

    pdf.setTextColor(28, 25, 23);
    pdf.setFontSize(24);
    pdf.text(String(quote.projectTotal || "$0"), margin + 6, y + 21);

    y += 40;

    function addSection(title: string, body: string) {
      if (!body || !body.trim()) return;

      ensureSpace(18);
      pdf.setDrawColor(231, 229, 228);
      pdf.roundedRect(margin, y, contentWidth, 12, 3, 3, "S");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(28, 25, 23);
      pdf.text(title, margin + 6, y + 8);

      y += 18;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(41, 37, 36);
      addTextBlock(body);
    }

    addSection("Estimated Start Window", String(quote.startWindow || "-"));
    addSection("Scope of Work", String(quote.scopeOfWork || "-"));

    const terms: string[] = [];

    if (quote.includePaymentTerms) {
      terms.push("Payment is due upon completion unless other terms are agreed to in writing.");
    }

    if (quote.includeWeatherDisclaimer) {
      terms.push("Weather conditions, material availability, and site accessibility may affect scheduling timelines.");
    }

    if (quote.includeScopeDisclaimer) {
      terms.push("Any work requested outside the listed scope may require additional approval and pricing.");
    }

    if (quote.includeDepositNote) {
      terms.push("A deposit may be required prior to scheduling or material delivery.");
    }

    if (terms.length > 0) {
      addSection("Terms & Notes", terms.join("\n\n"));
    }

    addSection(
      "Next Steps",
      "To move forward with this project, reply to this quote or contact iRock Excavation directly. Once approved, your project will be placed on the schedule. A current Certificate of Insurance is attached at the end of this PDF for your records."
    );

    const quotePdfBytes = pdf.output("arraybuffer");
    const mergedPdf = await PDFDocument.create();

    const quoteDoc = await PDFDocument.load(quotePdfBytes);
    const quotePages = await mergedPdf.copyPages(
      quoteDoc,
      quoteDoc.getPageIndices()
    );
    quotePages.forEach((page) => mergedPdf.addPage(page));

    try {
      const coiResponse = await fetch("/coi.pdf");
      if (coiResponse.ok) {
        const coiBytes = await coiResponse.arrayBuffer();
        const coiDoc = await PDFDocument.load(coiBytes);
        const coiPages = await mergedPdf.copyPages(
          coiDoc,
          coiDoc.getPageIndices()
        );
        coiPages.forEach((page) => mergedPdf.addPage(page));
      }
    } catch {
      alert("COI could not be attached. The quote will still export.");
    }

    const finalBytes = await mergedPdf.save();
    const finalBuffer = finalBytes.buffer.slice(
      finalBytes.byteOffset,
      finalBytes.byteOffset + finalBytes.byteLength
    ) as ArrayBuffer;

    const blob = new Blob([finalBuffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = buildFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function savePhotoToDevice() {
    if (!quote.bannerImage) {
      alert("No photo is attached to this quote.");
      return;
    }

    const link = document.createElement("a");
    link.href = quote.bannerImage;
    link.download = buildPhotoFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleEdit() {
    localStorage.setItem("quotesnapEditDraft", JSON.stringify(quote));
    window.location.href = "/new-quote";
  }

  function handleDuplicate() {
    const duplicate = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: "",
      status: "Draft",
    };

    localStorage.setItem("quotesnapEditDraft", JSON.stringify(duplicate));
    window.location.href = "/new-quote";
  }

  function sendQuoteText() {
    const client = quote.clientName || "there";
    const quoteNum = quote.quoteNumber ? ` (${quote.quoteNumber})` : "";
    const message =
      `Hi ${client}, here is your quote${quoteNum} for the project we discussed. ` +
      `If you have any questions or want to move forward, let me know. ` +
      `- Kenny, iRock Excavation`;

    window.location.href = `sms:?&body=${encodeURIComponent(message)}`;
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main
      style={{
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        minHeight: "100vh",
        padding: "24px 14px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto 20px auto",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button onClick={goHome} style={topButton("#ffffff", "#1c1917", "#d6d3d1")}>
          Home
        </button>

        <button onClick={exportPDF} style={topButton("#f97316", "#ffffff")}>
          Export to PDF
        </button>

        <button onClick={saveQuoteImage} style={topButton("#1c1917", "#ffffff")}>
          Save Quote Image
        </button>

        <button onClick={savePhotoToDevice} style={topButton("#57534e", "#ffffff")}>
          Save Photo to Device
        </button>

        <button onClick={sendQuoteText} style={topButton("#15803d", "#ffffff")}>
          Send Quote Text
        </button>

        <button onClick={handleEdit} style={topButton("#d6d3d1", "#1c1917")}>
          Edit Quote
        </button>

        <button onClick={handleDuplicate} style={topButton("#2563eb", "#ffffff")}>
          Duplicate Quote
        </button>
      </div>

      <div
        id="quote-card"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
          border: "1px solid #e7e5e4",
        }}
      >
        {quote.bannerImage && (
          <img
            src={quote.bannerImage}
            alt="Project banner"
            style={{
              width: "100%",
              height: "260px",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        <div style={{ padding: "34px 32px 36px" }}>
          <h1 style={{ margin: "0 0 6px 0", color: "#1c1917" }}>
            PROJECT QUOTE
          </h1>

          <div style={{ color: "#78716c", marginBottom: "24px" }}>
            iRock Excavation & Hauling
          </div>

          <div style={infoGrid}>
            <InfoCard label="Client" value={quote.clientName} />
            <InfoCard label="Quote #" value={quote.quoteNumber} />
            <InfoCard label="Address" value={quote.projectAddress} />
            <InfoCard label="Date" value={quote.quoteDate} />
            <InfoCard label="Contact" value={quote.contactInfo} />
            <InfoCard label="Start Window" value={quote.startWindow} />
          </div>

          <div
            style={{
              marginTop: "30px",
              marginBottom: "30px",
              background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
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
              TOTAL PROJECT COST
            </div>

            <div style={{ fontSize: "44px", fontWeight: 800, color: "#1c1917" }}>
              {quote.projectTotal || "$0"}
            </div>
          </div>

          <SectionCard title="Scope of Work">
            <div style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>
              {quote.scopeOfWork}
            </div>
          </SectionCard>

          {(quote.includePaymentTerms ||
            quote.includeWeatherDisclaimer ||
            quote.includeScopeDisclaimer ||
            quote.includeDepositNote) && (
            <SectionCard title="Terms & Notes">
              {quote.includePaymentTerms && (
                <p>Payment is due upon completion unless other terms are agreed to in writing.</p>
              )}
              {quote.includeWeatherDisclaimer && (
                <p>Weather conditions, material availability, and site accessibility may affect scheduling timelines.</p>
              )}
              {quote.includeScopeDisclaimer && (
                <p>Any work requested outside the listed scope may require additional approval and pricing.</p>
              )}
              {quote.includeDepositNote && (
                <p>A deposit may be required prior to scheduling or material delivery.</p>
              )}
            </SectionCard>
          )}

          <SectionCard title="Next Steps">
            To move forward with this project, reply to this quote or contact
            iRock Excavation directly. Once approved, your project will be placed
            on the schedule.
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
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

      <div style={{ color: "#1c1917", lineHeight: 1.5 }}>
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
      <h2 style={{ marginTop: 0, marginBottom: "14px", color: "#1c1917" }}>
        {title}
      </h2>
      <div style={{ lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function topButton(background: string, color: string, border?: string) {
  return {
    padding: "14px 18px",
    borderRadius: "10px",
    border: border ? `1px solid ${border}` : "none",
    background,
    color,
    fontWeight: "bold" as const,
    cursor: "pointer",
  };
}

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};