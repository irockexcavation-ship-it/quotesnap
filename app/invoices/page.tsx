"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

type Invoice = {
  id: string;
  workspace_id: string | null;
  invoice_number: string | null;
  client_name: string | null;
  project_address: string | null;
  total: number | null;
  amount_paid: number | null;
  status: string | null;
  invoice_date: string | null;
  due_date: string | null;
};

type BusinessProfile = {
  business_name: string | null;
  name: string | null;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  logo_path: string | null;
};

const FALLBACK_BUSINESS = {
  name: "iRock Excavation & Hauling",
  tagline: "Rock Solid Driveway Systems",
  phone: "(502) 552-9462",
  email: "irockexcavation@gmail.com",
  website: "iRockX.com",
  address: "",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

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
        "id, workspace_id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
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
        "id, workspace_id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
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
    if (data.workspace_id) {
      await loadBusinessProfile(data.workspace_id);
    } else {
      setBusinessError("Invoice has no workspace association. Using fallback business information.");
    }
  }

  async function loadBusinessProfile(workspaceId: string) {
    setBusinessLoading(true);
    setBusinessError("");
    const { data, error } = await supabase
      .from("workspaces")
      .select("name, business_name, tagline, phone, email, address, website, logo_path")
      .eq("id", workspaceId)
      .single();
    if (error || !data) {
      console.error("Could not load invoice business profile:", error);
      setBusinessError("Business profile unavailable. Invoice will use fallback company details.");
      setBusiness(null);
    } else {
      setBusiness(data);
    }
    setBusinessLoading(false);
  }

  const companyName = business?.business_name?.trim() || business?.name?.trim() || FALLBACK_BUSINESS.name;
  const companyTagline = business?.tagline?.trim() || FALLBACK_BUSINESS.tagline;
  const companyPhone = business?.phone?.trim() || FALLBACK_BUSINESS.phone;
  const companyEmail = business?.email?.trim() || FALLBACK_BUSINESS.email;
  const companyWebsite = business?.website?.trim() || FALLBACK_BUSINESS.website;
  const companyAddress = business?.address?.trim() || FALLBACK_BUSINESS.address;
  const logoUrl = business?.logo_path
    ? supabase.storage.from("business-logos").getPublicUrl(business.logo_path).data.publicUrl
    : "";

  // Convert a remote logo into a PNG data URL for reliable jsPDF embedding.
  async function logoForPDF(url: string): Promise<string | null> {
    if (!url) return null;
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error(`Logo fetch failed (${response.status})`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) return null;
        context.drawImage(image, 0, 0);
        return canvas.toDataURL("image/png");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      console.warn("Invoice logo unavailable for PDF:", error);
      return null;
    }
  }

  function money(value: number | null) {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  function goHome() {
    window.location.href = "/dashboard";
  }

  function backToInvoices() {
    window.location.href = "/invoices";
  }

  function buildInvoiceFileName(invoice: Invoice) {
    const client = (invoice.client_name || "client")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const number = (invoice.invoice_number || "invoice")
      .replace(/[^a-zA-Z0-9-_]+/g, "-");

    return client + "_" + number + ".pdf";
  }

  async function exportInvoicePDF() {
    if (!selectedInvoice || exportingPDF || businessLoading) return;
    setExportingPDF(true);
    try {
      const total = Number(selectedInvoice.total || 0);
      const paid = Number(selectedInvoice.amount_paid || 0);
      const balance = Math.max(total - paid, 0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 18;
      const right = 192;
      let y = 20;
      const logo = await logoForPDF(logoUrl);
      let textX = margin;
      if (logo) {
        try {
          const props = pdf.getImageProperties(logo);
          const maxW = 31;
          const maxH = 23;
          const ratio = Math.min(maxW / props.width, maxH / props.height);
          pdf.addImage(logo, "PNG", margin, y, props.width * ratio, props.height * ratio);
          textX = margin + 36;
        } catch (error) {
          console.warn("Could not embed company logo:", error);
        }
      }

      const headerWidth = right - textX;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      const nameLines = pdf.splitTextToSize(companyName, headerWidth);
      pdf.text(nameLines, textX, y + 5);
      let detailY = y + 5 + nameLines.length * 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const details = [companyTagline, companyPhone, companyEmail, companyWebsite, companyAddress].filter(Boolean);
      for (const detail of details) {
        const lines = pdf.splitTextToSize(detail, headerWidth);
        pdf.text(lines, textX, detailY);
        detailY += lines.length * 4.8;
      }
      y = Math.max(detailY + 10, 55);
      pdf.setDrawColor(220);
      pdf.line(margin, y - 5, right, y - 5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("INVOICE", margin, y + 4);
      y += 16;

      pdf.setFontSize(11);
      const addLabel = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(label, margin, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, 51, y);
        y += 7;
      };
      addLabel("Invoice #:", selectedInvoice.invoice_number || "-");
      addLabel("Invoice Date:", selectedInvoice.invoice_date || "-");
      if (selectedInvoice.due_date) addLabel("Due Date:", selectedInvoice.due_date);

      y += 4;
      pdf.line(margin, y, right, y);
      y += 10;
      pdf.setFont("helvetica", "bold");
      pdf.text("Bill To", margin, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      const clientLines = pdf.splitTextToSize(selectedInvoice.client_name || "Unnamed Client", 174);
      pdf.text(clientLines, margin, y);
      y += clientLines.length * 6;
      if (selectedInvoice.project_address) {
        const addressLines = pdf.splitTextToSize(selectedInvoice.project_address, 174);
        pdf.text(addressLines, margin, y);
        y += addressLines.length * 6;
      }
      y += 8;
      pdf.line(margin, y, right, y);
      y += 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Total", margin, y);
      pdf.text(money(total), right, y, { align: "right" });
      y += 9;
      pdf.text("Paid", margin, y);
      pdf.text(money(paid), right, y, { align: "right" });
      y += 9;
      pdf.setFontSize(14);
      pdf.text("Balance Due", margin, y);
      pdf.text(money(balance), right, y, { align: "right" });
      y += 14;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("Status: " + (selectedInvoice.status || "Draft"), margin, y);
      y += 16;
      pdf.setFont("helvetica", "bold");
      const thanks = pdf.splitTextToSize(`Thank you for choosing ${companyName}.`, 174);
      pdf.text(thanks, margin, y);
      pdf.save(buildInvoiceFileName(selectedInvoice));
    } catch (error) {
      console.error("Failed to export invoice PDF:", error);
      alert("Could not export the invoice PDF. Please try again.");
    } finally {
      setExportingPDF(false);
    }
  }

  function sendInvoiceText() {
    if (!selectedInvoice) return;

    const total = Number(selectedInvoice.total || 0);
    const paid = Number(selectedInvoice.amount_paid || 0);
    const balance = Math.max(total - paid, 0);
    const client = selectedInvoice.client_name || "there";
    const invoiceNumber = selectedInvoice.invoice_number || "your invoice";

    const message =
      "Hi " + client + ", here is " + invoiceNumber +
      " from " + companyName + ". Balance due: " +
      money(balance) +
      ". I can provide the invoice PDF separately. Thank you! - Kenny";

    window.location.href = "sms:?&body=" + encodeURIComponent(message);
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

    if (!window.confirm(`Record a payment of ${money(payment)} for ${selectedInvoice.client_name || "this customer"}?\nRemaining balance afterward: ${money(balance - payment)}. This will update the invoice.`)) return;

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
        "id, workspace_id, invoice_number, client_name, project_address, total, amount_paid, status, invoice_date, due_date"
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
              <button onClick={exportInvoicePDF} disabled={exportingPDF || businessLoading} style={{ ...greenButton, opacity: exportingPDF || businessLoading ? 0.6 : 1 }}>
                {exportingPDF ? "Exporting..." : businessLoading ? "Loading branding..." : "Export Invoice PDF"}
              </button>
              <button onClick={sendInvoiceText} style={greenButton}>
                Send Invoice Text
              </button>
              <button onClick={backToInvoices} style={blackButton}>
                Back to Invoices
              </button>
              <button onClick={goHome} style={blackButton}>
                ← Dashboard
              </button>
            </div>
          </div>

          {businessError && <div style={{ marginBottom: "12px", color: "#9a3412", fontSize: "13px" }}>{businessError}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginBottom: "20px", padding: "18px", border: "1px solid #e7e5e4", borderRadius: "14px", background: "#fafaf9" }}>
            {logoUrl && <img src={logoUrl} alt={`${companyName} logo`} style={{ width: "140px", maxHeight: "90px", objectFit: "contain" }} />}
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "22px" }}>{companyName}</div>
              {companyTagline && <div style={{ color: "#57534e", marginTop: "4px" }}>{companyTagline}</div>}
              <div style={{ fontSize: "13px", color: "#57534e", marginTop: "6px", overflowWrap: "anywhere" }}>{[companyPhone, companyEmail].filter(Boolean).join(" · ")}</div>
              {companyWebsite && <div style={{ fontSize: "13px", color: "#57534e", overflowWrap: "anywhere" }}>{companyWebsite}</div>}
              {companyAddress && <div style={{ fontSize: "13px", color: "#57534e", overflowWrap: "anywhere" }}>{companyAddress}</div>}
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
            ← Dashboard
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
