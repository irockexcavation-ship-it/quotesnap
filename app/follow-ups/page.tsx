"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type FollowUp = {
  id: string;
  quote_id: string;
  followup_number: number;
  due_at: string;
  status: string;
  sent_at: string | null;
  quotes?: {
    client_name?: string;
    quote_number?: string;
    project_address?: string;
  } | null;
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowUps();
  }, []);

  async function loadFollowUps() {
    setLoading(true);

    const { data, error } = await supabase
      .from("quote_followups")
      .select(`
        id,
        quote_id,
        followup_number,
        due_at,
        status,
        sent_at,
        quotes (
          client_name,
          quote_number,
          project_address
        )
      `)
      .order("due_at", { ascending: true });

    if (error) {
      console.error("Failed to load follow-ups:", error);
      setFollowUps([]);
    } else {
      setFollowUps((data as FollowUp[]) || []);
    }

    setLoading(false);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

  async function markFollowUpSent(id: string) {
  const { error } = await supabase
    .from("quote_followups")
    .update({
      status: "Sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to mark follow-up sent:", error);
    alert("Could not mark follow-up as sent.");
    return;
  }

  setFollowUps((current) =>
    current.filter((followUp) => followUp.id !== id)
  );
}
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        padding: "24px 18px 40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "white",
          borderRadius: "18px",
          padding: "26px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <a
            href="/"
            style={{
              color: "#ea580c",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← Home
          </a>
        </div>

        <h1 style={{ margin: 0, fontSize: "32px" }}>Quote Follow-Ups</h1>

        <p style={{ color: "#666", marginTop: "8px" }}>
          Quotes waiting for a customer follow-up.
        </p>

        {loading && <p>Loading follow-ups...</p>}

        {!loading && followUps.length === 0 && (
          <div
            style={{
              marginTop: "28px",
              padding: "24px",
              border: "1px solid #ddd",
              borderRadius: "14px",
            }}
          >
            No follow-ups are currently scheduled.
          </div>
        )}

        {!loading &&
          followUps.map((followUp) => (
            <div
              key={followUp.id}
              style={{
                marginTop: "18px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "21px" }}>
                    {followUp.quotes?.client_name || "Unnamed Client"}
                  </h2>

                  <div style={{ color: "#555", marginTop: "5px" }}>
                    {followUp.quotes?.quote_number || "No quote number"}
                  </div>

                  {followUp.quotes?.project_address && (
                    <div style={{ color: "#777", marginTop: "3px" }}>
                      {followUp.quotes.project_address}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#fff7ed",
                    border: "1px solid #fdba74",
                    borderRadius: "999px",
                    padding: "7px 12px",
                    fontWeight: 700,
                    height: "fit-content",
                  }}
                >
                  {followUp.status}
                </div>
              </div>

              <div style={{ marginTop: "16px", fontWeight: 700 }}>
                Follow-up #{followUp.followup_number}
              </div>

              <div style={{ marginTop: "5px" }}>
                Due: {formatDateTime(followUp.due_at)}
              </div>
              <button
  onClick={() => markFollowUpSent(followUp.id)}
  style={{
    marginTop: "16px",
    background: "#111",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  Mark Follow-Up Sent
</button>
            </div>
          ))}
      </div>
    </main>
  );
}
