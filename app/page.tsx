"use client";

import { useEffect, useMemo, useState } from "react";

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Archived" | "Completed";

type QuoteItem = {
  id: string;
  quoteNumber?: string;
  clientName?: string;
  projectAddress?: string;
  contactInfo?: string;
  quoteDate?: string;
  projectTotal?: string;
  startWindow?: string;
  scopeOfWork?: string;
  bannerImage?: string;
  status?: QuoteStatus;
  archivedAt?: string;
  completedAt?: string;
};

export default function HomePage() {
  const [activeQuotes, setActiveQuotes] = useState<QuoteItem[]>([]);
  const [archivedQuotes, setArchivedQuotes] = useState<QuoteItem[]>([]);

  useEffect(() => {
    loadQuoteData();
  }, []);

  function loadQuoteData() {
    try {
      const active: QuoteItem[] = JSON.parse(
        localStorage.getItem("quotesnapActiveQuotes") || "[]"
      );

      const archived: QuoteItem[] = JSON.parse(
        localStorage.getItem("quotesnapArchivedQuotes") || "[]"
      );

      setActiveQuotes(Array.isArray(active) ? active : []);
      setArchivedQuotes(Array.isArray(archived) ? archived : []);
    } catch {
      setActiveQuotes([]);
      setArchivedQuotes([]);
    }
  }

  function startNewQuote() {
    localStorage.removeItem("quotesnapEditDraft");
    localStorage.removeItem("quotesnapDraft");
    window.location.href = "/new-quote";
  }

  function openQuotes() {
    window.location.href = "/quotes";
  }

  function openCurrentJobs() {
    window.location.href = "/current-jobs";
  }

  function openArchive() {
    window.location.href = "/archive";
  }

  function openTemplates() {
    window.location.href = "/templates";
  }

  function parseMoney(value?: string) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function getYearFromQuote(quote: QuoteItem) {
    const dateValue = quote.completedAt || quote.archivedAt || quote.quoteDate;
    if (!dateValue) return null;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;

    return date.getFullYear();
  }

  function money(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const approvedJobs = activeQuotes.filter((quote) => quote.status === "Approved");

    const completedJobs = archivedQuotes.filter((quote) => {
      const isCompleted = quote.status === "Completed" || Boolean(quote.completedAt);
      return isCompleted && getYearFromQuote(quote) === currentYear;
    });

    const sentQuotes = activeQuotes.filter((quote) => quote.status === "Sent");

    const approvedQueueTotal = approvedJobs.reduce(
      (sum, quote) => sum + parseMoney(quote.projectTotal),
      0
    );

    const completedYearTotal = completedJobs.reduce(
      (sum, quote) => sum + parseMoney(quote.projectTotal),
      0
    );

    const sentQuoteTotal = sentQuotes.reduce(
      (sum, quote) => sum + parseMoney(quote.projectTotal),
      0
    );

    return {
      approvedQueueTotal,
      completedYearTotal,
      sentQuoteTotal,
      approvedJobCount: approvedJobs.length,
      completedJobCount: completedJobs.length,
      sentQuoteCount: sentQuotes.length,
      totalPipeline: approvedQueueTotal + completedYearTotal,
    };
  }, [activeQuotes, archivedQuotes, currentYear]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          padding: "36px 24px 28px",
          borderRadius: "20px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
          textAlign: "center",
          border: "1px solid #e7e5e4",
        }}
      >
        <img
          src="/icon.png"
          alt="QuoteSnap icon"
          style={{
            width: "96px",
            height: "96px",
            marginBottom: "16px",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.14))",
          }}
        />

        <h1
          style={{
            fontSize: "34px",
            margin: "0 0 8px 0",
            color: "#1c1917",
            letterSpacing: "-0.02em",
          }}
        >
          QuoteSnap
        </h1>

        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#9a3412",
            marginBottom: "6px",
          }}
        >
          Fast Field Quotes for Contractors
        </div>

        <div
          style={{
            fontSize: "14px",
            color: "#78716c",
            marginBottom: "22px",
            lineHeight: 1.5,
          }}
        >
          Build polished quotes on-site with photos, templates, saved clients,
          and PDF export.
        </div>

        <section style={snapshotCard}>
          <div style={snapshotHeader}>{currentYear} Snapshot</div>

          <div style={snapshotGrid}>
            <StatBox
              label="Completed YTD"
              value={money(stats.completedYearTotal)}
              sub={`${stats.completedJobCount} job${stats.completedJobCount === 1 ? "" : "s"}`}
              highlight
            />

            <StatBox
              label="Approved Queue"
              value={money(stats.approvedQueueTotal)}
              sub={`${stats.approvedJobCount} job${stats.approvedJobCount === 1 ? "" : "s"}`}
            />

            <StatBox
              label="Sent Quotes"
              value={money(stats.sentQuoteTotal)}
              sub={`${stats.sentQuoteCount} quote${stats.sentQuoteCount === 1 ? "" : "s"}`}
            />

            <StatBox
              label="Completed + Queue"
              value={money(stats.totalPipeline)}
              sub="year pulse"
            />
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          <button onClick={startNewQuote} style={primaryButton}>
            New Quote
          </button>

          <button onClick={openQuotes} style={secondaryButton}>
            Quotes
          </button>

          <button onClick={openCurrentJobs} style={secondaryButton}>
            Current Jobs
          </button>

          <button onClick={openArchive} style={secondaryButton}>
            Archive
          </button>

          <button onClick={openTemplates} style={secondaryButton}>
            Templates
          </button>
        </div>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "18px",
            borderTop: "1px solid #e7e5e4",
            fontSize: "12px",
            color: "#a8a29e",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Stupid Simple. Stupid Fast.
        </div>
      </div>
    </main>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 10px",
        borderRadius: "14px",
        background: highlight ? "#fff7ed" : "#fafaf9",
        border: highlight ? "1px solid #fdba74" : "1px solid #e7e5e4",
        textAlign: "left",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: highlight ? "#9a3412" : "#78716c",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          color: "#1c1917",
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#78716c",
          marginTop: "5px",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

const snapshotCard = {
  marginBottom: "24px",
  padding: "16px",
  borderRadius: "18px",
  background: "#ffffff",
  border: "1px solid #e7e5e4",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const snapshotHeader = {
  textAlign: "left" as const,
  fontSize: "14px",
  fontWeight: 900,
  color: "#1c1917",
  marginBottom: "12px",
  letterSpacing: "0.02em",
};

const snapshotGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const primaryButton = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "none",
  background: "#f97316",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(249,115,22,0.28)",
};

const secondaryButton = {
  width: "100%",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  background: "#ffffff",
  color: "#1c1917",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};
