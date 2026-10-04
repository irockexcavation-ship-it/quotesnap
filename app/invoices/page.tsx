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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    setSelectedId(id);

    if (id) {
      loadInvoice(id);
    } else {
      loadInvoices();
    }
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

  async function loadInvoice(id: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Failed to load invoice:", error);
      alert("Could not load this invoice.");
      window.location.href = "/invoices";
      return;
    }

    setSelectedInvoice(data);
    setLoading(false);
  }

  function money(value: number | null) {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function goHome() {
    window.location.href = "/";
  }

  function backToInvoices() {
    window.location.href = "/invoices";
  }

  async function recordPayment() {
    if (!selectedInvoice) return;

    const payment = Number(paymentAmount.replace(/[$,]/g, "").trim());

    if (!Number.isFinite(payment) || payment <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    const total = Number(selectedInvoice.total || 0);
    const alreadyPaid = Number(selectedInvoice.amount_paid || 0);
    const balance = Math.max(total - alreadyPaid, 0);

    if (payment > balance) {
      alert(`Payment cannot be more than the remaining balance of ${money(balance)}.`);
      return;
    }

    const newAmountPaid = Math.min(alreadyPaid + payment, total);
    const newStatus =
      newAmountPaid >= total ? "Paid" : newAmountPaid > 0 ? "Partially Paid" : "Draft";

    setSavingPayment(true);

    const updates: {
      amount_paid: number;
      status: string;
      paid_at?: string;
    } = {
      amount_paid: newAmountPaid,
      status: newStatus,
    };

    if (newStatus === "Paid") {
      updates.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", selectedInvoice.id)
      .select(
        "id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
      )
      .single();

    setSavingPayment(false);

    if (error || !data) {
      console.error("Failed to record payment:", error);
      alert(`Could not record payment: ${error?.message || "Unknown error"}`);
      return;
    }

    setSelectedInvoice(data);
    setPaymentAmount("");
  }

  const pageStyle = {
    minHeight: "100vh",
    background: "#f5f5f4",
    padding: "24px 18px 40px",
    fontFamily: "Arial, sans-serif",
    color: "#1c1917",
  };

  const shellStyle = {
    maxWidth: "900px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  };

  const blackButton = {
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const greenButton = {
    border: "none",
    borderRadius: "8px",
    padding: "12px 18px",
    background: "#15803d",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>Loading invoices...</div>
      </main>
    );
  }

  if (selectedId && selectedInvoice) {
    const total = Number(selectedInvoice.total || 0);
    const paid = Number(selectedInvoice.amount_paid || 0);
    const balance = Math.max(total - paid, 0);

    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <div>
              <h1 style={{ margin: "0 0 6px", fontSize: "30px" }}>Invoice</h1>
              <div style={{ color: "#78716c" }}>
                QuoteSnap billing and payment tracking
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={backToInvoices} style={blackButton}>
                Back to Invoices
              </button>
              <button onClick={goHome} style={blackButton}>
                Home
              </button>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "15px",
                flexWrap: "wrap",
                marginBottom: "22px",
              }}
            >
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700 }}>
                  {selectedInvoice.client_name || "Unnamed Client"}
                </div>
                <div style={{ color: "#555", marginTop: "4px" }}>
                  {selectedInvoice.invoice_number || "No invoice number"}
                </div>
                {selectedInvoice.project_address && (
                  <div style={{ color: "#777", marginTop: "4px" }}>
                    {selectedInvoice.project_address}
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
                {selectedInvoice.status || "Draft"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "14px",
                marginBottom: "26px",
              }}
            >
              <MoneyBox label="Total" value={money(total)} />
              <MoneyBox label="Paid" value={money(paid)} />
              <MoneyBox label="Balance" value={money(balance)} />
            </div>

            <div
              style={{
                borderTop: "1px solid #e7e5e4",
                paddingTop: "22px",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: "20px" }}>
                Record Payment
              </h2>

              {balance <= 0 ? (
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    fontWeight: 700,
                  }}
                >
                  Paid in full
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Payment amount"
                    style={{
                      flex: "1 1 220px",
                      padding: "12px 14px",
                      border: "1px solid #d6d3d1",
                      borderRadius: "8px",
                      fontSize: "16px",
                    }}
                  />

                  <button
                    onClick={recordPayment}
                    disabled={savingPayment}
                    style={{
                      ...greenButton,
                      opacity: savingPayment ? 0.6 : 1,
                    }}
                  >
                    {savingPayment ? "Saving..." : "Record Payment"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "30px" }}>Invoices</h1>
            <div style={{ color: "#78716c" }}>
              QuoteSnap billing and payment tracking
            </div>
          </div>

          <button onClick={goHome} style={blackButton}>
            Home
          </button>
        </div>

        {invoices.length === 0 ? (
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
                Number(invoice.total || 0) - Number(invoice.amount_paid || 0);

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
                      <div style={{ fontSize: "20px", fontWeight: 700 }}>
                        {invoice.client_name || "Unnamed Client"}
                      </div>

                      <div style={{ color: "#555", marginTop: "4px" }}>
                        {invoice.invoice_number || "No invoice number"}
                      </div>

                      {invoice.project_address && (
                        <div style={{ color: "#777", marginTop: "3px" }}>
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
                    <SmallMoney label="Total" value={money(invoice.total)} />
                    <SmallMoney label="Paid" value={money(invoice.amount_paid)} />
                    <SmallMoney
                      label="Balance"
                      value={money(Math.max(balance, 0))}
                    />
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

function SmallMoney({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: "#777", fontSize: "13px" }}>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function MoneyBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e7e5e4",
        borderRadius: "12px",
        padding: "16px",
        background: "#fafaf9",
      }}
    >
      <div style={{ color: "#78716c", fontSize: "13px", marginBottom: "5px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
