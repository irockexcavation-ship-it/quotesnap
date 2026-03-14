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
    const quoteNum = quote.quoteNumber || "iRock-Quote";
    const client = quote.clientName ? slugify(quote.clientName) : "client";
    return `${quoteNum}-${client}.pdf`;
  }

  async function exportPDF() {
    const element = document.getElementById("quote-card");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/png");

    const quotePdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = quotePdf.internal.pageSize.getWidth();
    const pageHeight = quotePdf.internal.pageSize.getHeight();

    const margin = 10;
    const usableWidth = pageWidth - margin * 2;
    const usableHeight = pageHeight - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    quotePdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      quotePdf.addPage();
      quotePdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    const quotePdfBytes = quotePdf.output("arraybuffer");

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
    } catch (error) {
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

  function handleEdit() {
    localStorage.setItem("quotesnapEditDraft", JSON.stringify(quote));
    window.location.href = "/new-quote";
  }

  function handleDuplicate() {
    const duplicate = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: "",
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
        background: "#f5f5f4",
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
        <button onClick={goHome} style={topButton("#e7e5e4", "#1c1917")}>
          Home
        </button>

        <button onClick={exportPDF} style={topButton("#1c1917", "#ffffff")}>
          Export Quote + COI PDF
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
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          border: "1px solid #e7e5e4",
        }}
      >
        {quote.bannerImage ? (
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
        ) : (
          <div
            style={{
              height: "120px",
              background: "linear-gradient(135deg, #e7e5e4, #f5f5f4)",
            }}
          />
        )}

        <div style={{ padding: "34px 32px 36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "24px",
              flexWrap: "wrap",
              marginBottom: "28px",
              paddingBottom: "24px",
              borderBottom: "1px solid #e7e5e4",
            }}
          >
            <div style={{ flex: "1 1 360px" }}>
              <img
                src={irockLogo.src}
                alt="iRock Logo"
                style={{
                  height: "68px",
                  marginBottom: "12px",
                  display: "block",
                }}
              />

              <h1
                style={{
                  fontSize: "30px",
                  margin: "0 0 6px 0",
                  color: "#1c1917",
                  lineHeight: 1.1,
                }}
              >
                {COMPANY_NAME}
              </h1>

              <div
                style={{
                  color: "#57534e",
                  fontSize: "16px",
                  fontWeight: 600,
                  marginBottom: "10px",
                }}
              >
                {COMPANY_TAGLINE}
              </div>

              <div
                style={{
                  color: "#78716c",
                  fontSize: "14px",
                  lineHeight: 1.75,
                }}
              >
                {COMPANY_PHONE}
                <br />
                {COMPANY_EMAIL}
                <br />
                {COMPANY_WEBSITE}
              </div>
            </div>

            <div
              style={{
                flex: "0 1 280px",
                minWidth: "240px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#78716c",
                  marginBottom: "10px",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                PROJECT QUOTE
              </div>

              <div
                style={{
                  background: "#fafaf9",
                  border: "1px solid #e7e5e4",
                  borderRadius: "12px",
                  padding: "16px 18px",
                }}
              >
                <InfoRow label="Quote #" value={quote.quoteNumber || "Pending"} />
                <InfoRow label="Client" value={quote.clientName} />
                <InfoRow label="Address" value={quote.projectAddress} />
                <InfoRow label="Contact" value={quote.contactInfo} />
                <InfoRow label="Date" value={quote.quoteDate} />
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: "30px",
              padding: "28px 24px",
              borderRadius: "14px",
              background: "linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)",
              border: "1px solid #d6d3d1",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                letterSpacing: "0.12em",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              PROJECT TOTAL
            </div>

            <div
              style={{
                fontSize: "50px",
                fontWeight: 800,
                color: "#1c1917",
                lineHeight: 1,
              }}
            >
              {quote.projectTotal}
            </div>
          </div>

          <SectionCard title="Estimated Start Window">
            <p style={bodyText}>{quote.startWindow}</p>
          </SectionCard>

          <SectionCard title="Scope of Work">
            <p style={{ ...bodyText, whiteSpace: "pre-line" }}>
              {quote.scopeOfWork}
            </p>
          </SectionCard>

          <SectionCard title="Next Steps">
            <p style={bodyText}>
              To move forward with this project, reply to this quote or contact
              iRock Excavation directly. Once approved, your project will be
              placed on the schedule. A current Certificate of Insurance is
              attached at the end of this PDF for your records.
            </p>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "78px 1fr",
        gap: "10px",
        alignItems: "start",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#44403c",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "14px",
          color: "#292524",
          wordBreak: "break-word",
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
    <section
      style={{
        marginBottom: "22px",
        padding: "22px 22px 20px",
        borderRadius: "14px",
        background: "#ffffff",
        border: "1px solid #e7e5e4",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <h2
        style={{
          margin: "0 0 10px 0",
          color: "#1c1917",
          fontSize: "22px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function topButton(background: string, color: string) {
  return {
    padding: "14px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "none",
    background,
    color,
    cursor: "pointer",
    fontWeight: "bold" as const,
  };
}

const bodyText = {
  lineHeight: 1.85,
  color: "#292524",
  margin: 0,
  fontSize: "16px",
};