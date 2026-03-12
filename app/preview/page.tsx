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
    const blob = new Blob([finalBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${quote.quoteNumber || "iRock-Quote"}-with-COI.pdf`;
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
          maxWidth: "850px",
          margin: "0 auto 20px auto",
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={exportPDF}
          style={topButton("#1c1917", "#ffffff")}
        >
          Export Quote + COI PDF
        </button>

        <button
          onClick={sendQuoteText}
          style={topButton("#15803d", "#ffffff")}
        >
          Send Quote Text
        </button>

        <button
          onClick={handleEdit}
          style={topButton("#e7e5e4", "#1c1917")}
        >
          Edit Quote
        </button>

        <button
          onClick={handleDuplicate}
          style={topButton("#2563eb", "#ffffff")}
        >
          Duplicate Quote
        </button>
      </div>

      <div
        id="quote-card"
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 3px 12px rgba(0,0,0,.15)",
        }}
      >
        {quote.bannerImage && (
          <img
            src={quote.bannerImage}
            alt="Project banner"
            style={{
              width: "100%",
              height: "240px",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        <div style={{ padding: "30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div style={{ flex: "1 1 320px" }}>
              <img
                src={irockLogo.src}
                alt="iRock Logo"
                style={{
                  height: "60px",
                  marginBottom: "10px",
                  display: "block",
                }}
              />

              <h1
                style={{
                  fontSize: "28px",
                  margin: "0 0 6px 0",
                  color: "#1c1917",
                }}
              >
                {COMPANY_NAME}
              </h1>

              <div
                style={{
                  color: "#57534e",
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                {COMPANY_TAGLINE}
              </div>

              <div
                style={{
                  color: "#78716c",
                  fontSize: "14px",
                  lineHeight: 1.65,
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
                textAlign: "right",
                minWidth: "220px",
                flex: "0 1 260px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "8px",
                  letterSpacing: "0.08em",
                }}
              >
                PROJECT QUOTE
              </div>

              <div
                style={{
                  fontSize: "15px",
                  lineHeight: 1.8,
                  color: "#292524",
                }}
              >
                <div>
                  <strong>Quote #:</strong> {quote.quoteNumber || "Pending"}
                </div>
                <div>
                  <strong>Client:</strong> {quote.clientName}
                </div>
                <div>
                  <strong>Address:</strong> {quote.projectAddress}
                </div>
                <div>
                  <strong>Contact:</strong> {quote.contactInfo}
                </div>
                <div>
                  <strong>Date:</strong> {quote.quoteDate}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "25px",
              borderRadius: "10px",
              marginBottom: "30px",
              textAlign: "center",
              background: "#fafaf9",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                letterSpacing: "0.08em",
              }}
            >
              PROJECT TOTAL
            </div>

            <div
              style={{
                fontSize: "42px",
                fontWeight: "bold",
                marginTop: "6px",
                color: "#1c1917",
              }}
            >
              {quote.projectTotal}
            </div>
          </div>

          <section style={{ marginBottom: "24px" }}>
            <h2 style={sectionHeading}>Estimated Start Window</h2>
            <p style={bodyText}>{quote.startWindow}</p>
          </section>

          <section style={{ marginBottom: "24px" }}>
            <h2 style={sectionHeading}>Scope of Work</h2>
            <p style={{ ...bodyText, whiteSpace: "pre-line" }}>
              {quote.scopeOfWork}
            </p>
          </section>

          <section>
            <h2 style={sectionHeading}>Next Steps</h2>
            <p style={bodyText}>
              To move forward with this project, reply to this quote or contact
              iRock Excavation directly. Once approved, your project will be
              placed on the schedule. A current Certificate of Insurance is
              attached at the end of this PDF for your records.
            </p>
          </section>
        </div>
      </div>
    </main>
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

const sectionHeading = {
  marginBottom: "8px",
  color: "#1c1917",
};

const bodyText = {
  lineHeight: 1.8,
  color: "#292524",
  margin: 0,
};