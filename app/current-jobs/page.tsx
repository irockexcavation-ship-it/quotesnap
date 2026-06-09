"use client";

import { useEffect, useState } from "react";

type QuoteStatus = "Draft" | "Sent" | "Approved" | "Archived";
type PaymentStatus = "Unpaid" | "Paid";

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
  paymentStatus?: PaymentStatus;
  approvedAt?: string;
  completedAt?: string;
  sentAt?: string;
  archivedAt?: string;
  archiveReason?: string;
};

const SAVED_KEY = "quotesnapSavedQuotes";
const OLD_ACTIVE_KEY = "quotesnapActiveQuotes";
const ARCHIVE_KEY = "quotesnapArchivedQuotes";
const DRAFT_KEY = "quotesnapDraft";

export default function CurrentJobsPage() {
  const [jobs, setJobs] = useState<QuoteItem[]>([]);

  useEffect(() => {
    loadJobs();
  }, []);

  function safeRead(key: string): QuoteItem[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function safeWrite(key: string, quotes: QuoteItem[]) {
    localStorage.setItem(key, JSON.stringify(quotes));
  }

  function sameQuote(a: QuoteItem, b: QuoteItem) {
    return (
      (a.id && b.id && a.id === b.id) ||
      (a.quoteNumber && b.quoteNumber && a.quoteNumber === b.quoteNumber)
    );
  }

  function loadJobs() {
    const savedQuotes = safeRead(SAVED_KEY);

    const approvedJobs = savedQuotes
      .filter((quote) => quote.status === "Approved")
      .map((quote) => ({
        ...quote,
        paymentStatus: quote.paymentStatus || "Unpaid",
      }));

    setJobs(approvedJobs);
  }

  function goHome() {
    window.location.href = "/";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  function goArchive() {
    window.location.href = "/archive";
  }

  function openJob(job: QuoteItem) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(job));
    window.location.href = "/preview";
  }

  function returnToQuotes(job: QuoteItem) {
    const savedQuotes = safeRead(SAVED_KEY);

    const updatedSaved = savedQuotes.map((quote) => {
      if (!sameQuote(quote, job)) return quote;

      return {
        ...quote,
        status: "Sent" as QuoteStatus,
        approvedAt: undefined,
        paymentStatus: quote.paymentStatus || "Unpaid",
      };
    });

    safeWrite(SAVED_KEY, updatedSaved);

    const oldActive = safeRead(OLD_ACTIVE_KEY);
    const updatedOldActive = oldActive.filter((quote) => !sameQuote(quote, job));
    safeWrite(OLD_ACTIVE_KEY, updatedOldActive);

    loadJobs();
  }

  function markPaid(job: QuoteItem) {
    const savedQuotes = safeRead(SAVED_KEY);

    const updatedSaved = savedQuotes.map((quote) => {
      if (!sameQuote(quote, job)) return quote;

      return {
        ...quote,
        paymentStatus: "Paid" as PaymentStatus,
      };
    });

    safeWrite(SAVED_KEY, updatedSaved);
    loadJobs();
  }

  function markUnpaid(job: QuoteItem) {
    const savedQuotes = safeRead(SAVED_KEY);

    const updatedSaved = savedQuotes.map((quote) => {
      if (!sameQuote(quote, job)) return quote;

      return {
        ...quote,
        paymentStatus: "Unpaid" as PaymentStatus,
      };
    });

    safeWrite(SAVED_KEY, updatedSaved);
    loadJobs();
  }

  function completeJob(job: QuoteItem) {
    const confirmed = window.confirm(
      `Mark job completed and move to archive for ${
        job.clientName || "this client"
      }?`
    );

    if (!confirmed) return;

    const savedQuotes = safeRead(SAVED_KEY);
    const oldActiveQuotes = safeRead(OLD_ACTIVE_KEY);
    const archivedQuotes = safeRead(ARCHIVE_KEY);

    const remainingSaved = savedQuotes.filter((quote) => !sameQuote(quote, job));
    const remainingOldActive = oldActiveQuotes.filter(
      (quote) => !sameQuote(quote, job)
    );

    const alreadyArchived = archivedQuotes.some((quote) =>
      sameQuote(quote, job)
    );

    const completedJob: QuoteItem = {
      ...job,
      status: "Archived",
      paymentStatus: job.paymentStatus || "Unpaid",
      completedAt: job.completedAt || new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      archiveReason: "Completed job",
    };

    safeWrite(SAVED_KEY, remainingSaved);
    safeWrite(OLD_ACTIVE_KEY, remainingOldActive);

    if (!alreadyArchived) {
      safeWrite(ARCHIVE_KEY, [completedJob, ...archivedQuotes]);
    }

    loadJobs();
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
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button onClick={goHome} style={navButton}>
            Home
          </button>

          <button onClick={goQuotes} style={navButton}>
            Quotes
          </button>

          <button onClick={goArchive} style={navButton}>
            Archive
          </button>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            padding: "28px 22px 24px",
          }}
        >
          <h1
            style={{
              fontSize: "34px",
              margin: "0 0 8px 0",
              color: "#1c1917",
              letterSpacing: "-0.02em",
            }}
          >
            Current Jobs
          </h1>

          <p
            style={{
              color: "#78716c",
              marginTop: 0,
              marginBottom: "22px",
              lineHeight: 1.5,
            }}
          >
            Approved quotes live here. Complete jobs move to Archive and stay
            there. No more zombie quotes, ideally. What a concept.
          </p>

          {jobs.length === 0 ? (
            <div
              style={{
                background: "#fafaf9",
                border: "1px solid #e7e5e4",
                borderRadius: "14px",
                padding: "22px",
                color: "#78716c",
                textAlign: "center",
              }}
            >
              No current jobs found.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {jobs.map((job) => (
                <div
                  key={job.id || job.quoteNumber}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e7e5e4",
                    borderRadius: "16px",
                    padding: "18px",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "19px",
                          marginBottom: "6px",
                          color: "#1c1917",
                        }}
                      >
                        {job.clientName || "Unnamed Client"}
                      </div>

                      <div
                        style={{
                          fontSize: "14px",
                          color: "#57534e",
                          lineHeight: 1.6,
                          marginBottom: "6px",
                        }}
                      >
                        {job.quoteNumber || "No Quote #"} •{" "}
                        {job.quoteDate || "No Date"} •{" "}
                        {job.projectTotal || "$0"}
                      </div>

                      <div
                        style={{
                          fontSize: "13px",
                          color: "#78716c",
                          lineHeight: 1.5,
                        }}
                      >
                        {job.projectAddress || ""}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "8px",
                        justifyItems: "end",
                      }}
                    >
                      <StatusPill label="Approved" type="approved" />
                      <StatusPill
                        label={job.paymentStatus || "Unpaid"}
                        type={job.paymentStatus === "Paid" ? "paid" : "unpaid"}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openJob(job)}
                      style={smallButton("#1c1917", "#ffffff")}
                    >
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => returnToQuotes(job)}
                      style={smallButton("#f97316", "#ffffff")}
                    >
                      Return to Quotes
                    </button>

                    {job.paymentStatus === "Paid" ? (
                      <button
                        type="button"
                        onClick={() => markUnpaid(job)}
                        style={smallButton("#fee2e2", "#991b1b", "#fecaca")}
                      >
                        Mark Unpaid
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markPaid(job)}
                        style={smallButton("#dcfce7", "#166534", "#86efac")}
                      >
                        Mark Paid
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => completeJob(job)}
                      style={smallButton("#57534e", "#ffffff")}
                    >
                      Job Completed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusPill({
  label,
  type,
}: {
  label: string;
  type: "approved" | "paid" | "unpaid";
}) {
  const colors =
    type === "approved"
      ? { bg: "#dcfce7", text: "#166534", border: "#86efac" }
      : type === "paid"
      ? { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" }
      : { bg: "#fff7ed", text: "#9a3412", border: "#fdba74" };

  return (
    <div
      style={{
        padding: "7px 11px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 800,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

function smallButton(background: string, color: string, border?: string) {
  return {
    background,
    color,
    border: border ? `1px solid ${border}` : "none",
    borderRadius: "10px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };
}

const navButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#ffffff",
  color: "#1c1917",
  cursor: "pointer",
  fontWeight: "bold" as const,
};