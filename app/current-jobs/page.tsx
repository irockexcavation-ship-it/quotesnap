"use client";

import { useEffect, useMemo, useState } from "react";

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Completed" | "Archived";

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
  approvedAt?: string;
  completedAt?: string;
  sentAt?: string;
  archivedAt?: string;
  archiveReason?: string;
};

const ACTIVE_KEY = "quotesnapActiveQuotes";
const ARCHIVE_KEY = "quotesnapArchivedQuotes";
const DRAFT_KEY = "quotesnapDraft";

export default function CurrentJobsPage() {
  const [jobs, setJobs] = useState<QuoteItem[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  function loadJobs() {
    const activeQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ACTIVE_KEY) || "[]"
    );

    setJobs(activeQuotes.filter((quote) => quote.status === "Approved"));
  }

  const totalOpenValue = useMemo(() => {
    return jobs.reduce((sum, job) => sum + currencyToNumber(job.projectTotal || ""), 0);
  }, [jobs]);

  function currencyToNumber(value: string) {
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
    const numberValue = Number(cleaned);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function openQuote(job: QuoteItem) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(job));
    window.location.href = "/preview";
  }

  function completeJob(jobId: string) {
    const activeQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ACTIVE_KEY) || "[]"
    );

    const archivedQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ARCHIVE_KEY) || "[]"
    );

    const job = activeQuotes.find((quote) => quote.id === jobId);
    if (!job) return;

    const completedJob: QuoteItem = {
      ...job,
      status: "Completed",
      completedAt: new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      archiveReason: "Completed job",
    };

    const remainingActive = activeQuotes.filter((quote) => quote.id !== jobId);
    const archiveWithoutDuplicate = archivedQuotes.filter((quote) => quote.id !== jobId);

    localStorage.setItem(ACTIVE_KEY, JSON.stringify(remainingActive));
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([completedJob, ...archiveWithoutDuplicate]));

    setJobs(remainingActive.filter((quote) => quote.status === "Approved"));
  }

  function sendBackToQuotes(jobId: string) {
    const activeQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ACTIVE_KEY) || "[]"
    );

    const updatedQuotes = activeQuotes.map((quote) =>
      quote.id === jobId ? { ...quote, status: "Sent" as QuoteStatus } : quote
    );

    localStorage.setItem(ACTIVE_KEY, JSON.stringify(updatedQuotes));
    setJobs(updatedQuotes.filter((quote) => quote.status === "Approved"));
  }

  function goHome() {
    window.location.href = "/";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        fontFamily: "Arial, sans-serif",
        padding: "24px 16px 44px",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "22px",
          }}
        >
          <button type="button" onClick={goHome} style={topButton("#e7e5e4", "#1c1917")}>
            Home
          </button>
          <button type="button" onClick={goQuotes} style={topButton("#1c1917", "#ffffff")}>
            Quotes
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "36px",
                margin: "0 0 8px",
                color: "#1c1917",
                letterSpacing: "-0.02em",
              }}
            >
              Current Jobs
            </h1>
            <p style={{ margin: 0, color: "#57534e", fontSize: "17px" }}>
              Approved quotes waiting in the work queue.
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e7e5e4",
              borderRadius: "14px",
              padding: "14px 18px",
              minWidth: "190px",
              textAlign: "right",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ color: "#78716c", fontSize: "13px", fontWeight: 700 }}>
              OPEN JOB VALUE
            </div>
            <div style={{ color: "#1c1917", fontSize: "26px", fontWeight: 800 }}>
              {formatMoney(totalOpenValue)}
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e7e5e4",
              borderRadius: "16px",
              padding: "28px",
              color: "#57534e",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            No approved jobs in the queue. Either you’re caught up, or the app is judging your pipeline quietly.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e7e5e4",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 360px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: "8px",
                      }}
                    >
                      <h2 style={{ margin: 0, color: "#1c1917", fontSize: "24px" }}>
                        {job.clientName || "Unnamed Client"}
                      </h2>
                      <span style={statusBadge}>Approved</span>
                    </div>

                    <div style={detailLine}>Quote #: {job.quoteNumber || "Pending"}</div>
                    <div style={detailLine}>Address: {job.projectAddress || "-"}</div>
                    <div style={detailLine}>Start Window: {job.startWindow || "-"}</div>
                  </div>

                  <div style={{ flex: "0 1 220px", textAlign: "right" }}>
                    <div style={{ color: "#78716c", fontSize: "13px", fontWeight: 700 }}>
                      PROJECT TOTAL
                    </div>
                    <div style={{ color: "#1c1917", fontSize: "30px", fontWeight: 800 }}>
                      {job.projectTotal || "$0"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "18px",
                    paddingTop: "16px",
                    borderTop: "1px solid #e7e5e4",
                  }}
                >
                  <button type="button" onClick={() => openQuote(job)} style={topButton("#1c1917", "#ffffff")}>
                    Open Quote
                  </button>
                  <button type="button" onClick={() => completeJob(job.id)} style={topButton("#15803d", "#ffffff")}>
                    Mark Complete
                  </button>
                  <button type="button" onClick={() => sendBackToQuotes(job.id)} style={topButton("#d6d3d1", "#1c1917")}>
                    Send Back to Quotes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function topButton(background: string, color: string) {
  return {
    padding: "12px 18px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "none",
    background,
    color,
    cursor: "pointer",
    fontWeight: "bold" as const,
  };
}

const detailLine = {
  color: "#57534e",
  fontSize: "15px",
  lineHeight: 1.7,
};

const statusBadge = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};
