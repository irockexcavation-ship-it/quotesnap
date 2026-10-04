"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Invoice = {
  id: string;
  invoice_number: string | null;
  client_name: string | null;
  project_address: string | null;
  total: number | null;
  amount_paid: number | null;
  status: string | null;
  invoice_date: string | null;
  due_date: string | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load invoices:", error);
      setInvoices([]);
    } else {
      setInvoices(data || []);
    }

    setLoading(false);
  }

  function money(value: number | null) {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>Invoices</h1>
            <div style={{ color: "#666", marginTop: "5px" }}>
              QuoteSnap billing and payment tracking
            </div>
          </div>

          <button
            onClick={() => (window.location.href = "/")}
            style={{
              background: "#111",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Home
          </button>
        </div>

        {loading ? (
          <div>Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              padding: "30px 20px",
              textAlign: "center",
              color: "#666",
            }}
          >
            No invoices yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {invoices.map((invoice) => {
              const balance =
                Number(invoice.total || 0) -
                Number(invoice.amount_paid || 0);

              return (
               <div
  key={invoice.id}
  onClick={() => {
    window.location.href = `/invoices?id=${invoice.id}`;
  }}
  style={{
                    border: "1px solid #ddd",
                    borderRadius: "14px",
                    padding: "18px",
    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                        }}
                      >
                        {invoice.client_name || "Unnamed Client"}
                      </div>

                      <div
                        style={{
                          color: "#555",
                          marginTop: "4px",
                        }}
                      >
                        {invoice.invoice_number || "No invoice number"}
                      </div>

                      {invoice.project_address && (
                        <div
                          style={{
                            color: "#777",
                            marginTop: "3px",
                          }}
                        >
                          {invoice.project_address}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        background: "#fff7ed",
                        border: "1px solid #fdba74",
                        borderRadius: "999px",
                        padding: "7px 12px",
                        height: "fit-content",
                      }}
                    >
                      {invoice.status || "Draft"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "24px",
                      flexWrap: "wrap",
                      marginTop: "18px",
                    }}
                  >
                    <div>
                      <div style={{ color: "#777", fontSize: "13px" }}>
                        Total
                      </div>
                      <strong>{money(invoice.total)}</strong>
                    </div>

                    <div>
                      <div style={{ color: "#777", fontSize: "13px" }}>
                        Paid
                      </div>
                      <strong>{money(invoice.amount_paid)}</strong>
                    </div>

                    <div>
                      <div style={{ color: "#777", fontSize: "13px" }}>
                        Balance
                      </div>
                      <strong>{money(balance)}</strong>
                    </div>

                    {invoice.due_date && (
                      <div>
                        <div style={{ color: "#777", fontSize: "13px" }}>
                          Due
                        </div>
                        <strong>
                          {new Date(
                            invoice.due_date + "T00:00:00"
                          ).toLocaleDateString()}
                        </strong>
                      </div>
                    )}
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
