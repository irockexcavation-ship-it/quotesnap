"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
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
        paymentStatus: parsed.paymentStatus || "Unpaid",
      });
    }
  }, []);

  if (!quote) return <div style={{ padding: 40 }}>Loading...</div>;

  const paid = quote.paymentStatus === "Paid";

  // 🔥 EXPORT IMAGE (NEW)
  async function downloadImage() {
    const element = document.getElementById("quote-card");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });

    const link = document.createElement("a");
    link.download = "quote-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // 🔥 PDF EXPORT (FIXED IMAGE)
  async function exportPDF() {
    const pdf = new jsPDF();
    let y = 20;

    if (quote.bannerImage) {
      try {
        pdf.addImage(quote.bannerImage, "JPEG", 20, y, 170, 55);
        y += 70;
      } catch {}
    }

    pdf.setFontSize(18);
    pdf.text(COMPANY_NAME, 20, y);
    y += 10;

    pdf.setFontSize(11);
    pdf.text(COMPANY_PHONE, 20, y);
    y += 6;
    pdf.text(COMPANY_EMAIL, 20, y);
    y += 6;
    pdf.text(COMPANY_WEBSITE, 20, y);
    y += 10;

    pdf.setFontSize(14);
    pdf.text("Quote Details", 20, y);
    y += 10;

    pdf.setFontSize(11);
    pdf.text(`Client: ${quote.clientName || "-"}`, 20, y); y += 6;
    pdf.text(`Address: ${quote.projectAddress || "-"}`, 20, y); y += 6;
    pdf.text(`Date: ${quote.quoteDate || "-"}`, 20, y); y += 6;
    pdf.text(`Payment: ${quote.paymentStatus}`, 20, y); y += 10;

    pdf.setFontSize(18);
    pdf.text(`Total: ${quote.projectTotal || "$0"}`, 20, y);
    y += 12;

    pdf.setFontSize(12);
    pdf.text("Scope of Work:", 20, y);
    y += 6;

    const scopeLines = pdf.splitTextToSize(
      quote.scopeOfWork || "-",
      170
    );

    pdf.text(scopeLines, 20, y);

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "quote.pdf";
    link.click();
  }

  function updatePayment(status: PaymentStatus) {
    const updated = { ...quote, paymentStatus: status };

    const active = JSON.parse(localStorage.getItem("quotesnapActiveQuotes") || "[]");

    const updatedList = active.map((q: any) =>
      q.id === updated.id ? updated : q
    );

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(updatedList));
    localStorage.setItem("quotesnapDraft", JSON.stringify(updated));
    setQuote(updated);
  }

  function handleApproveJob() {
    const approved = {
      ...quote,
      status: "Approved",
      paymentStatus: quote.paymentStatus || "Unpaid",
    };

    const active = JSON.parse(localStorage.getItem("quotesnapActiveQuotes") || "[]");
    const filtered = active.filter((q: any) => q.id !== approved.id);

    filtered.unshift(approved);

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(filtered));
    localStorage.setItem("quotesnapDraft", JSON.stringify(approved));

    setQuote(approved);
  }

  return (
    <main style={{ padding: 20, background: "#f5f5f4", minHeight: "100vh" }}>
      
      {/* 🔥 BUTTON ROW */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button onClick={exportPDF} style={btn}>Export PDF</button>
        <button onClick={downloadImage} style={btn}>Export Image</button>
        <button onClick={() => updatePayment(paid ? "Unpaid" : "Paid")} style={btn}>
          {paid ? "Mark Unpaid" : "Mark Paid"}
        </button>
        <button onClick={handleApproveJob} style={btn}>Mark Approved</button>
      </div>

      {/* 🔥 QUOTE CARD */}
      <div
        id="quote-card"
        style={{
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          maxWidth: 800,
          margin: "0 auto",
          border: "1px solid #ddd",
        }}
      >
        {quote.bannerImage && (
          <img
            src={quote.bannerImage}
            style={{ width: "100%", height: 250, objectFit: "cover" }}
          />
        )}

        <div style={{ padding: 24 }}>
          <h2>{quote.clientName}</h2>
          <p>{quote.projectAddress}</p>

          <div style={{ marginBottom: 10 }}>
            <strong>Status:</strong> {quote.status || "Draft"} |{" "}
            <strong>{quote.paymentStatus}</strong>
          </div>

          <h1 style={{ fontSize: 32 }}>{quote.projectTotal}</h1>

          <h3>Scope of Work</h3>
          <p style={{ whiteSpace: "pre-line" }}>{quote.scopeOfWork}</p>
        </div>
      </div>
    </main>
  );
}

const btn = {
  padding: "12px 16px",
  borderRadius: 8,
  border: "none",
  background: "#1c1917",
  color: "#fff",
  cursor: "pointer",
};