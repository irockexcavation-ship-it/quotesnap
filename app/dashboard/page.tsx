"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
export default function DashboardPage() {
    const [openQuotes, setOpenQuotes] = useState(0);
  const [acceptedJobs, setAcceptedJobs] = useState(0);
    const [currentJobs, setCurrentJobs] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState(0);
    const [dueFollowUps, setDueFollowUps] = useState<any[]>([]);
  const [acceptedValue, setAcceptedValue] = useState(0);
  const [overduePayments, setOverduePayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dayMode, setDayMode] = useState(false);
  const [recentApprovals, setRecentApprovals] = useState(0);

  useEffect(() => {
    try { setDayMode(localStorage.getItem("quotesnap-dashboard-theme") === "day"); } catch {}
  }, []);

  function chooseTheme(day: boolean) {
    setDayMode(day);
    try { localStorage.setItem("quotesnap-dashboard-theme", day ? "day" : "night"); } catch {}
  }


  useEffect(() => {
    loadDashboard();
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") loadDashboard();
    };
    window.addEventListener("focus", refreshOnReturn);
    return () => window.removeEventListener("focus", refreshOnReturn);
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setLoadFailed(false);

    try {
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("*");

      if (quotesError) {
        console.error("Dashboard quote load failed:", quotesError);
        setLoadFailed(true);
      } else if (quotes) {
        const open = quotes.filter(
          (quote) => quote.status === "Sent" || quote.status === "Draft"
        );

        const accepted = quotes.filter(
          (quote) => quote.status === "Approved"
        );

        setOpenQuotes(open.length);
        setAcceptedJobs(accepted.length);
        const lastDay = Date.now() - 24 * 60 * 60 * 1000;
        setRecentApprovals(accepted.filter((q: any) => {
          const stamp = new Date(q.approved_at || "").getTime();
          return Number.isFinite(stamp) && stamp >= lastDay;
        }).length);
setCurrentJobs(accepted);
        const total = accepted.reduce((sum, quote) => {
          const amount = Number(quote.project_total || 0);
          return sum + amount;
        }, 0);

        setAcceptedValue(total);
        setOverduePayments(accepted.filter((quote) => String(quote.payment_status || "").toLowerCase() === "overdue").length);
      }

      const { data: followUpData, error: followUpError } = await supabase
  .from("quote_followups")
  .select(`
    id,
    quote_id,
    due_at,
    status,
    quotes (
      *
    )
  `)
  .eq("status", "Pending")
  .order("due_at", { ascending: true });

      if (followUpError) {
        console.error("Dashboard follow-up load failed:", followUpError);
        setLoadFailed(true);
        setFollowUps(0);
        setDueFollowUps([]);
      } else {
        // Only active, sent quotes can require a customer follow-up.
        // Completed, dismissed, deleted, or archived reminders must not
        // linger in the dashboard's Needs Attention panel.
        const activeReminders = (followUpData || []).filter((followUp: any) => {
          const quote = Array.isArray(followUp.quotes)
            ? followUp.quotes[0]
            : followUp.quotes;
          return quote?.status === "Sent" && !quote?.trashed_at;
        });
        const now = Date.now();
        const dueReminders = activeReminders.filter((followUp: any) => {
          const due = new Date(followUp.due_at).getTime();
          return Number.isFinite(due) && due <= now;
        });
        setFollowUps(activeReminders.length);
        setDueFollowUps(dueReminders);
      }
    } catch (error) {
      console.error("Dashboard load failed:", error);
      setLoadFailed(true);
    }

    setLoading(false);
  }
  // Preview expects camelCase fields under quotesnapDraft.
  // Supabase rows use snake_case, so normalize them before navigating.
  function openQuotePreview(record: any) {
    if (!record?.id) {
      alert("Could not open this quote. Please try again from Quotes.");
      return;
    }

    const previewQuote = {
      id: record.id,
      quoteNumber: record.quote_number || "",
      clientName: record.client_name || "",
      projectAddress: record.project_address || "",
      contactInfo: record.contact_info || "",
      quoteDate: record.quote_date || "",
      projectTotal: record.project_total ?? "",
      startWindow: record.start_window || "",
      scopeOfWork: record.scope_of_work || "",
      bannerImage: record.banner_image || "",
      status: record.status || "Draft",
      paymentStatus: record.payment_status || "Unpaid",
      approvedAt: record.approved_at || "",
      scheduledDate: record.scheduled_date || "",
      completedAt: record.completed_at || "",
      sentAt: record.sent_at || "",
      archivedAt: record.archived_at || "",
      archiveReason: record.archive_reason || "",
    };

    localStorage.setItem("quotesnapDraft", JSON.stringify(previewQuote));
    window.location.href = "/preview";
  }

  const goTo = (path: string) => {
    window.location.href = path;
  };

  const isRed = !loading && (loadFailed || overduePayments > 0);
  const isAmber = !loading && !isRed && (dueFollowUps.length > 0 || recentApprovals > 0);
  const activeStatus = loading ? "loading" : isRed ? "red" : isAmber ? "amber" : "green";
  const pageBg = dayMode ? "#eaf2f9" : "#0d0d0d";
  const panelBg = dayMode ? "#ffffff" : "#151515";
  const gaugeBg = dayMode ? "#f8fafc" : "#181818";
  const mainText = dayMode ? "#17263b" : "#ffffff";
  const mutedText = dayMode ? "#52647a" : "#aaaaaa";
  const panelBorder = dayMode ? "#c7d6e7" : "#333333";
  const accent = dayMode ? "#1765b1" : "#f97316";

  const gaugeStyle = {
    flex: "1 1 140px",
    minWidth: "140px",
    background: gaugeBg,
    border: `1px solid ${panelBorder}`,
    borderRadius: "18px",
    padding: "22px 14px",
    textAlign: "center" as const,
    cursor: "pointer",
    boxShadow: "inset 0 0 18px rgba(255,255,255,0.03)",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: mainText,
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <style jsx>{`@keyframes qsPulse { 0%,100% { opacity: 1; filter: brightness(1.1); } 50% { opacity: .38; filter: brightness(.65); } } .qs-attention-light { animation: qsPulse 1.2s ease-in-out infinite; }`}</style>
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
            gap: "20px",
          }}
        >
          <div>
            <div
              onClick={() => goTo("/")}
              style={{
                color: accent,
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: "8px",
              }}
            >
              ← HOME
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              QUOTESNAP
            </h1>

            <div
              style={{
                color: mutedText,
                marginTop: "4px",
                letterSpacing: "2px",
                fontSize: "12px",
              }}
            >
              CONTROL CENTER
            </div>
            <div style={{ color: "#fbbf24", fontWeight: 900, fontSize: "13px", letterSpacing: "2px", marginTop: "12px" }}>
              DIRT DON&apos;T LIE.
            </div>
            <div style={{ color: mutedText, fontSize: "11px", letterSpacing: "1px", marginTop: "5px" }}>
              BUILT FOR THE PEOPLE WHO BUILD THINGS
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
            <div style={{ background: gaugeBg, border: `1px solid ${panelBorder}`, borderRadius: 14, padding: "13px 16px", minWidth: 215 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: mutedText, marginBottom: 10 }}>SYSTEM STATUS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {([
                  { key: "green", title: "SYSTEM READY", color: "#22c55e", path: "/dashboard" },
                  { key: "amber", title: "NEEDS ATTENTION", color: "#f59e0b", path: "/follow-ups" },
                  { key: "red", title: "RED ALERT", color: "#ef4444", path: loadFailed ? "/dashboard" : "/current-jobs" },
                ] as const).map((light) => {
                  const active = activeStatus === light.key;
                  return (
                    <button key={light.key} type="button" onClick={() => goTo(light.path)}
                      title={light.key === "amber" ? "Due follow-ups or new approvals in the past 24 hours" : light.key === "red" ? "Data load error or overdue payments" : "Dashboard operating normally"}
                      style={{ display: "flex", alignItems: "center", gap: 11, padding: 0, background: "none", border: 0, cursor: "pointer", textAlign: "left", color: active ? mainText : mutedText, fontWeight: active ? 900 : 600, fontSize: 11, letterSpacing: .7 }}>
                      <span className={active && light.key === "amber" ? "qs-attention-light" : ""}
                        style={{ display: "inline-block", width: 15, height: 15, borderRadius: "50%", flexShrink: 0,
                          background: active ? light.color : dayMode ? "#c8d0d9" : "#353535",
                          border: `1px solid ${active ? light.color : dayMode ? "#aab9c9" : "#555"}`,
                          boxShadow: active ? `0 0 14px ${light.color}, inset 0 0 5px #ffffff66` : "none" }} />
                      {light.title}
                    </button>
                  );
                })}
              </div>
              {activeStatus === "amber" && <div style={{ marginTop: 10, color: mutedText, fontSize: 11 }}>
                {dueFollowUps.length > 0 ? `${dueFollowUps.length} follow-up(s) due` : `${recentApprovals} recently approved quote(s)`}
              </div>}
              {activeStatus === "red" && <div style={{ marginTop: 10, color: "#dc2626", fontSize: 11 }}>
                {loadFailed ? "Dashboard data unavailable" : `${overduePayments} overdue payment(s)`}
              </div>}
            </div>
            <div style={{ background: gaugeBg, border: `1px solid ${panelBorder}`, borderRadius: 14, padding: "13px 16px", minWidth: 145 }}>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: mutedText, marginBottom: 11 }}>DISPLAY MODE</div>
              <div style={{ display: "flex", gap: 6, background: dayMode ? "#dbeafe" : "#0b1220", borderRadius: 11, padding: 5 }}>
                <button type="button" onClick={() => chooseTheme(true)} aria-pressed={dayMode} title="Daylight mode"
                  style={{ flex: 1, cursor: "pointer", border: 0, borderRadius: 8, padding: "10px 12px", background: dayMode ? "#2563eb" : "transparent", color: dayMode ? "white" : "#a4b7d4", fontSize: 19, boxShadow: dayMode ? "0 0 12px #60a5fa" : "none" }}>☀</button>
                <button type="button" onClick={() => chooseTheme(false)} aria-pressed={!dayMode} title="Night mode"
                  style={{ flex: 1, cursor: "pointer", border: 0, borderRadius: 8, padding: "10px 12px", background: !dayMode ? "#1d4ed8" : "transparent", color: !dayMode ? "white" : "#47617c", fontSize: 19, boxShadow: !dayMode ? "0 0 12px #3b82f6" : "none" }}>☾</button>
              </div>
              <div style={{ fontSize: 11, color: mutedText, marginTop: 10, textAlign: "center" }}>{dayMode ? "DAYLIGHT" : "NIGHT"} ACTIVE</div>
            </div>
          </div>
        </div>

        {/* GAUGES */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          <div onClick={() => goTo("/quotes")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{loading ? "..." : openQuotes}</div>
            <div style={{ color: mutedText, fontSize: "12px" }}>
              OPEN QUOTES
            </div>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "11px", fontWeight: 700, color: "#aaa" }}>
              <span style={{ width: 11, height: 11, flexShrink: 0, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(255,255,255,0.1)" }} />
              Normal
            </div>
          </div>

          <div onClick={() => goTo("/current-jobs")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{loading ? "..." : acceptedJobs}</div>
            <div style={{ color: mutedText, fontSize: "12px" }}>
              ACCEPTED JOBS
            </div>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "11px", fontWeight: 700, color: (overduePayments > 0) ? "#fca5a5" : "#86efac" }}>
              <span style={{ width: 11, height: 11, flexShrink: 0, borderRadius: "50%", background: (overduePayments > 0) ? "#ef4444" : "#22c55e", boxShadow: "0 0 8px rgba(255,255,255,0.1)" }} />
              {(overduePayments > 0) ? "Overdue payment" : "Normal"}
            </div>
          </div>

          <div onClick={() => goTo("/follow-ups")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏱</div>
            <div style={{ fontSize: "32px", fontWeight: 900 }}>{loading ? "..." : followUps}</div>
            <div style={{ color: mutedText, fontSize: "12px" }}>
              FOLLOW-UPS
            </div>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "11px", fontWeight: 700, color: (dueFollowUps.length > 0) ? "#fca5a5" : "#86efac" }}>
              <span style={{ width: 11, height: 11, flexShrink: 0, borderRadius: "50%", background: (dueFollowUps.length > 0) ? "#ef4444" : "#22c55e", boxShadow: "0 0 8px rgba(255,255,255,0.1)" }} />
              {(dueFollowUps.length > 0) ? "Due now" : "All caught up"}
            </div>
            {!loading && dueFollowUps.length > 0 && <div style={{ color: "#fca5a5", fontSize: "11px", marginTop: 5 }}>{dueFollowUps.length} reminder{dueFollowUps.length === 1 ? "" : "s"} need attention</div>}
          </div>

          <div onClick={() => goTo("/current-jobs")} style={gaugeStyle}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
           <div style={{ fontSize: "28px", fontWeight: 900 }}>
  {loading ? "..." : `$${acceptedValue.toLocaleString()}`}
</div>
            <div style={{ color: mutedText, fontSize: "12px" }}>
              ACCEPTED VALUE
            </div>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "11px", fontWeight: 700, color: (overduePayments > 0) ? "#fca5a5" : "#86efac" }}>
              <span style={{ width: 11, height: 11, flexShrink: 0, borderRadius: "50%", background: (overduePayments > 0) ? "#ef4444" : "#22c55e", boxShadow: "0 0 8px rgba(255,255,255,0.1)" }} />
              {(overduePayments > 0) ? "Payment overdue" : "Normal"}
            </div>
          </div>
        </div>
          {/* CURRENT JOBS */}
{currentJobs.length > 0 && (
  <div
    style={{
      background: "#151515",
      border: "1px solid #333",
      borderRadius: "18px",
      padding: "22px",
      marginBottom: "20px",
    }}
  >
    <div
      style={{
        fontSize: "13px",
        color: accent,
        fontWeight: 800,
        letterSpacing: "1px",
        marginBottom: "16px",
      }}
    >
      CURRENT JOBS
    </div>

    {currentJobs.map((job: any) => (
      <div
        key={job.id}
        onClick={() => openQuotePreview(job)}
        style={{
          background: gaugeBg,
          border: `1px solid ${panelBorder}`,
          borderRadius: "14px",
          padding: "16px",
          marginBottom: "10px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 800,
                marginBottom: "5px",
              }}
            >
              {job.client_name || "Customer"}
            </div>

            <div
              style={{
                color: mutedText,
                fontSize: "13px",
                marginBottom: "4px",
              }}
            >
              {job.quote_number || ""}
            </div>

            <div
              style={{
                color: mutedText,
                fontSize: "13px",
              }}
            >
              {job.project_address || ""}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 900,
                marginBottom: "5px",
              }}
            >
              ${Number(job.project_total || 0).toLocaleString()}
            </div>

            <div
              style={{
                color: job.payment_status === "Paid" ? "#22c55e" : "#f97316",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              {job.payment_status || "Unpaid"}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
        {/* QUICK ACTIONS */}
        <div
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: "18px",
            padding: "22px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: accent,
              fontWeight: 800,
              letterSpacing: "1px",
              marginBottom: "16px",
            }}
          >
            QUICK ACTIONS
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            <Action dayMode={dayMode}
              icon="＋"
              label="NEW QUOTE"
              onClick={() => {
  localStorage.removeItem("quotesnapEditDraft");
  goTo("/new-quote");
}}
            />

            <Action dayMode={dayMode}
              icon="📄"
              label="QUOTES"
              onClick={() => goTo("/quotes")}
            />

            <Action dayMode={dayMode}
              icon="⏱"
              label="FOLLOW-UPS"
              onClick={() => goTo("/follow-ups")}
            />

            <Action dayMode={dayMode}
              icon="✓"
              label="CURRENT JOBS"
              onClick={() => goTo("/current-jobs")}
            />

            <Action dayMode={dayMode}
              icon="🧾"
              label="INVOICES"
              onClick={() => goTo("/invoices")}
            />

            <Action dayMode={dayMode}
              icon="📦"
              label="ARCHIVE"
              onClick={() => goTo("/archive")}
            />

            <Action dayMode={dayMode}
              icon="⚙"
              label="SETTINGS"
              onClick={() => goTo("/settings")}
            />
          </div>
        </div>

        {/* FUTURE AI PANEL */}
        <div
          style={{
            background: panelBg,
            border: `1px solid ${panelBorder}`,
            borderRadius: "18px",
            padding: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#f97316",
                color: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              AI
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: "17px" }}>
                QuoteSnap Assistant
              </div>

              <div
                style={{
                  color: "#888",
                  fontSize: "13px",
                  marginTop: "4px",
                }}
              >
                AI estimating, quote assistance and workflow tools coming online.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Action({
  icon,
  label,
  onClick,
  dayMode,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  dayMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: dayMode ? "#f1f6fc" : "#222",
        border: dayMode ? "1px solid #c7d6e7" : "1px solid #3a3a3a",
        borderRadius: "12px",
        color: dayMode ? "#17263b" : "white",
        padding: "18px 12px",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: "13px",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          color: "#f97316",
          marginBottom: "7px",
        }}
      >
        {icon}
      </div>

      {label}
    </button>
  );
}
