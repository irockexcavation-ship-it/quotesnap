"use client";

import { useEffect, useMemo, useState } from "react";

type QuoteStatus =
  | "Draft"
  | "Sent"
  | "Approved"
  | "Completed"
  | "Archived";

type PaymentStatus = "Paid" | "Unpaid";

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

    const approvedJobs = activeQuotes
      .filter((quote) => quote.status === "Approved")
      .map((quote) => ({
        ...quote,
        paymentStatus: quote.paymentStatus || "Unpaid",
      }));

    setJobs(approvedJobs);
  }

  const totalOpenValue = useMemo(() => {
    return jobs.reduce(
      (sum, job) => sum + currencyToNumber(job.projectTotal || ""),
      0
    );
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

  function updatePayment(jobId: string, paymentStatus: PaymentStatus) {
    const activeQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ACTIVE_KEY) || "[]"
    );

    const updated = activeQuotes.map((quote) =>
      quote.id === jobId ? { ...quote, paymentStatus } : quote
    );

    localStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));
    loadJobs();
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
      paymentStatus: job.paymentStatus || "Unpaid",
      status: "Completed",
      completedAt: new Date().toISOString(),
      archivedAt: new Date().toISOString(),
      archiveReason: "Completed job",
    };

    const remainingActive = activeQuotes.filter(
      (quote) => quote.id !== jobId
    );

    const archiveWithoutDuplicate = archivedQuotes.filter(
      (quote) => quote.id !== jobId
    );

    localStorage.setItem(
      ACTIVE_KEY,
      JSON.stringify(remainingActive)
    );

    localStorage.setItem(
      ARCHIVE_KEY,
      JSON.stringify([completedJob, ...archiveWithoutDuplicate])
    );

    setJobs(
      remainingActive.filter(
        (quote) => quote.status === "Approved"
      )
    );
  }

  function sendBackToQuotes(jobId: string) {
    const activeQuotes: QuoteItem[] = JSON.parse(
      localStorage.getItem(ACTIVE_KEY) || "[]"
    );

    const updated = activeQuotes.map((quote) =>
      quote.id === jobId
        ? { ...quote, status: "Sent" as QuoteStatus }
        : quote
    );

    localStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));
    loadJobs();
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
          <button
            type="button"
            onClick={goHome}
            style={topButton("#e7e5e4", "#1c1917")}
          >
            Home
          </button>

          <button
            type="button"
            onClick={goQuotes}
            style={topButton("#1c1917", "#ffffff")}
          >
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
              }}
            >
              Current Jobs
            </h1>

            <p
              style={{
                margin: 0,
                color: "#57534e",
                fontSize: "17px",
              }}
            >
              Approved quotes waiting in queue.
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
            }}
          >
            <div
              style={{
                color: "#78716c",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              OPEN JOB VALUE
            </div>

            <div
              style={{
                color: "#1c1917",
                fontSize: "26px",
                fontWeight: 800,
              }}
            >
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
            }}
          >
            No approved jobs in queue.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {jobs.map((job) => {
              const paid = job.paymentStatus === "Paid";

              return (
                <div
                  key={job.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e7e5e4",
                    borderRadius: "16px",
                    padding: "20px",
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
                          flexWrap: "wrap",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <h2
                          style={{
                            margin: 0,
                            fontSize: "24px",
                            color: "#1c1917",
                          }}
                        >
                          {job.clientName || "Unnamed Client"}
                        </h2>

                        <span style={statusBadge}>
                          Approved
                        </span>

                        <span
                          style={
                            paid
                              ? paidBadge
                              : unpaidBadge
                          }
                        >
                          {paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>

                      <div style={detailLine}>
                        Quote #: {job.quoteNumber || "Pending"}
                      </div>

                      <div style={detailLine}>
                        Address: {job.projectAddress || "-"}
                      </div>

                      <div style={detailLine}>
                        Start Window: {job.startWindow || "-"}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: "0 1 220px",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          color: "#78716c",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        PROJECT TOTAL
                      </div>

                      <div
                        style={{
                          color: "#1c1917",
                          fontSize: "30px",
                          fontWeight: 800,
                        }}
                      >
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
                    <button
                      type="button"
                      onClick={() => openQuote(job)}
                      style={topButton("#1c1917", "#ffffff")}
                    >
                      Open Quote
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updatePayment(
                          job.id,
                          paid ? "Unpaid" : "Paid"
                        )
                      }
                      style={topButton(
                        paid ? "#d6d3d1" : "#15803d",
                        paid ? "#1c1917" : "#ffffff"
                      )}
                    >
                      {paid
                        ? "Mark Unpaid"
                        : "Mark Paid"}
                    </button>

                    <button
                      type="button"
                      onClick={() => completeJob(job.id)}
                      style={topButton("#166534", "#ffffff")}
                    >
                      Mark Complete
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        sendBackToQuotes(job.id)
                      }
                      style={topButton("#d6d3d1", "#1c1917")}
                    >
                      Send Back to Quotes
                    </button>
                  </div>
                </div>
              );
            })}
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
};

const paidBadge = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #86efac",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 800,
};

const unpaidBadge = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fca5a5",
  padding: "5px 10px",
  fontSize: "12px",
  fontWeight: 800,
};