"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import irockLogo from "../irock-logo.png";

type BusinessProfile = {
  business_name: string | null;
  name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  tagline: string | null;
  logo_path: string | null;
  coi_path: string | null;
  coi_expires_on: string | null;
};

const FALLBACK_COMPANY = {
  name: "iRock Excavation & Hauling",
  tagline: "Rock Solid Driveway Systems",
  phone: "(502) 552-9462",
  email: "irockexcavation@gmail.com",
  website: "iRockX.com",
  logo: irockLogo.src,
};

function logoUrlFromPath(path: string | null | undefined): string {
  if (!path) return FALLBACK_COMPANY.logo;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("business-logos").getPublicUrl(path).data.publicUrl;
}

async function logoAsPngDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image canvas unavailable");
        context.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error("Could not load company logo"));
    image.src = url;
  });
}

// Format display amounts only. Keep stored quote totals numeric/unchanged.
function formatCurrency(value: unknown): string {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "");
  const amount = Number(cleaned);
  if (!cleaned || !Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PreviewPage() {
  const [quote, setQuote] = useState<any>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [businessError, setBusinessError] = useState("");
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  const companyName = business?.business_name?.trim() || business?.name?.trim() || FALLBACK_COMPANY.name;
  const companyTagline = business?.tagline?.trim() || FALLBACK_COMPANY.tagline;
  const companyPhone = business?.phone?.trim() || FALLBACK_COMPANY.phone;
  const companyEmail = business?.email?.trim() || FALLBACK_COMPANY.email;
  const companyWebsite = business?.website?.trim() || FALLBACK_COMPANY.website;
  const companyLogo = logoUrlFromPath(business?.logo_path);

  useEffect(() => {
    const data = localStorage.getItem("quotesnapDraft");

    if (data) {
      setQuote(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function loadBusiness() {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) throw authError || new Error("Not signed in");
        const { data: member, error: memberError } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", auth.user.id)
          .limit(1)
          .single();
        if (memberError || !member) throw memberError || new Error("No workspace found");
        const { data: profile, error: profileError } = await supabase
          .from("workspaces")
          .select("name, business_name, contact_name, phone, email, address, website, tagline, logo_path, coi_path, coi_expires_on")
          .eq("id", member.workspace_id)
          .single();
        if (profileError || !profile) throw profileError || new Error("No business profile found");
        if (active) setBusiness(profile as BusinessProfile);
      } catch (error) {
        console.error("Quote preview business profile load failed:", error);
        if (active) setBusinessError("Business profile unavailable. Using original iRock branding.");
      } finally {
        if (active) setBusinessLoading(false);
      }
    }
    void loadBusiness();
    return () => { active = false; };
  }, []);

  if (!quote) {
    return <div style={{ padding: "40px" }}>Loading...</div>;
  }

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

function buildBaseName() {
  const quoteNum =
    quote.quoteNumber || "IR-no-number";

  const client = quote.clientName
    ? slugify(quote.clientName)
    : "client";

  return client + "_" + quoteNum;
}

function buildFileName() {
  return buildBaseName() + "_quote.pdf";
}

  async function exportPDF() {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin = 18;
    const contentWidth =
      210 - margin * 2;

    const lineHeight = 6.5;

    let y = 20;

    function ensureSpace(
      heightNeeded: number
    ) {
      if (
        y + heightNeeded >
        pageHeight - margin
      ) {
        pdf.addPage();
        y = 20;
      }
    }

    function addTextBlock(text: string) {
      const lines =
        pdf.splitTextToSize(
          text || "-",
          contentWidth
        );

      for (const line of lines) {
        ensureSpace(lineHeight);

        pdf.text(line, margin, y);

        y += lineHeight;
      }

      y += 8;
    }

    if (quote.bannerImage) {
      try {
        pdf.addImage(
          quote.bannerImage,
          "JPEG",
          margin,
          y,
          contentWidth,
          70
        );

        y += 82;
      } catch {}
    }

    pdf.setFillColor(245, 245, 244);

    pdf.roundedRect(
      margin,
      y,
      contentWidth,
      34,
      4,
      4,
      "F"
    );

    try {
      const logoData = await logoAsPngDataUrl(companyLogo);
      pdf.addImage(logoData, "PNG", margin + 4, y + 4, 26, 18);
    } catch (logoError) {
      console.warn("Saved logo unavailable in PDF, trying original logo:", logoError);
      try {
        const fallbackLogo = await logoAsPngDataUrl(FALLBACK_COMPANY.logo);
        pdf.addImage(fallbackLogo, "PNG", margin + 4, y + 4, 26, 18);
      } catch (fallbackError) {
        console.warn("Could not render logo in PDF:", fallbackError);
      }
    }

    pdf.setTextColor(28, 25, 23);

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(18);

    pdf.text(
      companyName,
      margin + 34,
      y + 10
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(11);

    pdf.setTextColor(87, 83, 78);

    pdf.text(
      companyTagline,
      margin + 34,
      y + 17
    );

    pdf.text(
      companyPhone,
      margin + 34,
      y + 23
    );

    pdf.text(
      companyEmail,
      margin + 34,
      y + 28
    );

    pdf.text(
      companyWebsite,
      margin + 34,
      y + 33
    );

    y += 46;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(10);

    pdf.setTextColor(28, 25, 23);

    pdf.text(
      "PROJECT QUOTE",
      margin,
      y
    );

    y += 8;

    pdf.setDrawColor(231, 229, 228);

    pdf.roundedRect(
      margin,
      y,
      contentWidth,
      40,
      4,
      4,
      "S"
    );

    pdf.setFontSize(10);

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "Quote #:",
      margin + 6,
      y + 8
    );

    pdf.text(
      "Client:",
      margin + 6,
      y + 16
    );

    pdf.text(
      "Address:",
      margin + 6,
      y + 24
    );

    pdf.text(
      "Date:",
      margin + 6,
      y + 32
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      String(
        quote.quoteNumber || "-"
      ),
      margin + 30,
      y + 8
    );

    pdf.text(
      String(
        quote.clientName || "-"
      ),
      margin + 30,
      y + 16
    );

    pdf.text(
      String(
        quote.projectAddress || "-"
      ),
      margin + 30,
      y + 24
    );

    pdf.text(
      String(
        quote.quoteDate || "-"
      ),
      margin + 30,
      y + 32
    );

    const rightX = margin + 96;

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.text(
      "Contact:",
      rightX,
      y + 8
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.text(
      String(
        quote.contactInfo || "-"
      ),
      rightX + 20,
      y + 8
    );

    y += 52;

    pdf.setFillColor(
      255,
      247,
      237
    );

    pdf.setDrawColor(
      253,
      186,
      116
    );

    pdf.roundedRect(
      margin,
      y,
      contentWidth,
      28,
      4,
      4,
      "FD"
    );

    pdf.setTextColor(
      154,
      52,
      18
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(9);

    pdf.text(
      "TOTAL PROJECT COST",
      margin + 6,
      y + 8
    );

    pdf.setTextColor(28, 25, 23);

    pdf.setFontSize(24);

    pdf.text(
      formatCurrency(quote.projectTotal),
      margin + 6,
      y + 21
    );

    y += 40;

    function addSection(
      title: string,
      body: string
    ) {
      if (!body || !body.trim())
        return;

      ensureSpace(18);

      pdf.setDrawColor(
        231,
        229,
        228
      );

      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        12,
        3,
        3,
        "S"
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        28,
        25,
        23
      );

      pdf.text(
        title,
        margin + 6,
        y + 8
      );

      y += 18;

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(11);

      pdf.setTextColor(
        41,
        37,
        36
      );

      addTextBlock(body);
    }

    addSection(
      "Estimated Start Window",
      String(
        quote.startWindow || "-"
      )
    );

    addSection(
      "Scope of Work",
      String(
        quote.scopeOfWork || "-"
      )
    );

    const terms: string[] = [];

    if (quote.includePaymentTerms) {
      terms.push(
        "Payment is due upon completion unless other terms are agreed to in writing."
      );
    }

    if (
      quote.includeWeatherDisclaimer
    ) {
      terms.push(
        "Weather conditions, material availability, and site accessibility may affect scheduling timelines."
      );
    }

    if (
      quote.includeScopeDisclaimer
    ) {
      terms.push(
        "Any work requested outside the listed scope may require additional approval and pricing."
      );
    }

    if (quote.includeDepositNote) {
      terms.push(
        "A deposit may be required prior to scheduling or material delivery."
      );
    }

    if (
      quote.includeAcceptanceLanguage
    ) {
      terms.push(
        `Approval by reply, signature, or written confirmation authorizes ${companyName} to schedule and perform the work described in this quote.`
      );
    }

    if (terms.length > 0) {
      addSection(
        "Terms & Notes",
        terms.join("\n\n")
      );
    }

    addSection(
      "Next Steps",
      `To move forward with this project, reply to this quote or contact ${companyName} directly. Once approved, your project will be placed on the schedule.`
    );

    // Attach only the current workspace certificate from private Supabase Storage.
    // Never use the old public /coi.pdf or silently attach an expired document.
    const certificatePath = business?.coi_path;
    const expirationDate = business?.coi_expires_on;
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    if (!certificatePath) {
      pdf.save(buildFileName());
      return;
    }
    if (!expirationDate || expirationDate < localToday) {
      alert("The certificate of insurance is expired or has no expiration date. The quote will download WITHOUT a COI. Update it in Settings.");
      pdf.save(buildFileName());
      return;
    }

    try {
      const { data: certificate, error: downloadError } = await supabase.storage
        .from("business-coi")
        .download(certificatePath);
      if (downloadError || !certificate) {
        throw new Error(downloadError?.message || "Certificate download returned no file.");
      }

      const merged = await PDFDocument.create();
      const quoteDocument = await PDFDocument.load(pdf.output("arraybuffer"));
      const quotePages = await merged.copyPages(quoteDocument, quoteDocument.getPageIndices());
      quotePages.forEach((page) => merged.addPage(page));

      const certificateDocument = await PDFDocument.load(await certificate.arrayBuffer());
      const certificatePages = await merged.copyPages(certificateDocument, certificateDocument.getPageIndices());
      certificatePages.forEach((page) => merged.addPage(page));

      const bytes = await merged.save();
      const output = new Uint8Array(bytes.byteLength);
      output.set(bytes);
      const url = URL.createObjectURL(new Blob([output], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error) {
      console.error("COI attachment failed:", error);
      alert("The COI could not be attached. No PDF was downloaded. Please check the certificate in Settings and try again.");
    }
  }

  function handleEdit() {
    localStorage.setItem(
      "quotesnapEditDraft",
      JSON.stringify(quote)
    );

    window.location.href =
      "/new-quote";
  }

  function handleDuplicate() {
    const duplicate = {
      ...quote,
      id: Date.now().toString(),
      quoteNumber: "",
      status: "Draft",
    };

    localStorage.setItem(
      "quotesnapEditDraft",
      JSON.stringify(duplicate)
    );

    window.location.href =
      "/new-quote";
  }

  function sendQuoteText() {
    const client =
      quote.clientName || "there";

    const quoteNum = quote.quoteNumber
  ? "(" + quote.quoteNumber + ")"
  : "";

    const message =
  "Hi " + client + ", here is your quote" + quoteNum + " for the project we discussed. " +
  "If you have any questions or want to move forward, let me know. " +
  `- ${business?.contact_name?.trim() || "Kenny"}, ${companyName}`;

    window.location.href = "sms:?&body=" + encodeURIComponent(message);
  }
  async function createInvoice() {
    const invoiceNumber = `INV-${Date.now()}`;

    // The preview page is driven by the local draft, so first resolve that
    // draft back to the real Supabase quote row. This gives the invoice the
    // UUIDs required by the invoices table and its RLS policy.
    const { data: savedQuote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, workspace_id")
      .eq("quote_number", quote.quoteNumber)
      .single();

    if (quoteError || !savedQuote) {
      console.error("Could not find saved quote:", quoteError);
      alert("Could not find the saved quote in QuoteSnap.");
      return;
    }

    // projectTotal is the field used everywhere else on this preview page.
    // Strip currency formatting before inserting into numeric DB columns.
    const numericTotal =
      typeof quote.projectTotal === "number"
        ? quote.projectTotal
        : Number(
            String(quote.projectTotal || "0")
              .replace(/[$,]/g, "")
              .trim()
          ) || 0;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        workspace_id: savedQuote.workspace_id,
        quote_id: savedQuote.id,
        invoice_number: invoiceNumber,
        client_name: quote.clientName || "",
        project_address: quote.projectAddress || "",
        contact_info: quote.contactInfo || "",
        scope_of_work: quote.scopeOfWork || "",
        subtotal: numericTotal,
        adjustments: 0,
        total: numericTotal,
        amount_paid: 0,
        status: "Draft",
        invoice_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create invoice:", error);
      alert(`Could not create invoice: ${error.message}`);
      return;
    }

    window.location.href = `/invoices?id=${data.id}`;
  }
  function goHome() {
    window.location.href = "/dashboard";
  }

  return (
    <main
      style={{
        background:
          "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        minHeight: "100vh",
        padding: "24px 14px 40px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto 14px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={goHome} style={topButton("#ffffff", "#1c1917", "#d6d3d1")}>← Dashboard</button>
        <button type="button" onClick={() => { window.location.href = "/quotes"; }} style={topButton("#ffffff", "#1c1917", "#d6d3d1")}>← Quotes</button>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto 20px", padding: "16px", border: "1px solid #e7e5e4", borderRadius: 16, background: "#fff" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={handleEdit} style={topButton("#1c1917", "#ffffff")}>Edit Quote</button>
          <button type="button" onClick={exportPDF} disabled={businessLoading} style={{ ...topButton("#f97316", "#ffffff"), opacity: businessLoading ? 0.6 : 1 }}>
            {businessLoading ? "Loading Branding..." : "Export to PDF"}
          </button>
          <button type="button" onClick={createInvoice} style={topButton("#15803d", "#ffffff")}>Create Invoice</button>
          <button type="button" onClick={() => setMoreActionsOpen((open) => !open)} aria-expanded={moreActionsOpen} aria-controls="preview-more-actions" style={topButton("#f5f5f4", "#292524", "#d6d3d1")}>
            More Actions {moreActionsOpen ? "▴" : "▾"}
          </button>
        </div>
        {moreActionsOpen && (
          <div id="preview-more-actions" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e7e5e4", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={sendQuoteText} style={topButton("#15803d", "#ffffff")}>Prepare Quote Text</button>
            <button type="button" onClick={handleDuplicate} style={topButton("#2563eb", "#ffffff")}>Duplicate Quote</button>
          </div>
        )}
      </div>

      {businessError && (
        <div role="status" style={{ maxWidth: "900px", margin: "0 auto 14px", padding: "12px 16px", borderRadius: 10, background: "#fff7ed", color: "#9a3412" }}>
          {businessError}
        </div>
      )}
      <div
        id="quote-card"
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow:
            "0 16px 40px rgba(0,0,0,0.10)",
          border:
            "1px solid #e7e5e4",
        }}
      >
        {quote.bannerImage && (
          <img
            src={quote.bannerImage}
            alt="Project banner"
            style={{
              width: "100%",
              height: "260px",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        <div
          style={{
            padding:
              "34px 32px 36px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <img src={companyLogo} alt={`${companyName} logo`} crossOrigin="anonymous" onError={(event) => { if (event.currentTarget.src !== new URL(FALLBACK_COMPANY.logo, window.location.href).href) event.currentTarget.src = FALLBACK_COMPANY.logo; }} style={{ maxWidth: 165, maxHeight: 90, objectFit: "contain" }} />
            <div style={{ color: "#57534e", fontSize: 13, lineHeight: 1.6 }}>
              <strong style={{ color: "#1c1917", fontSize: 17 }}>{companyName}</strong>
              <div>{companyTagline}</div>
              <div>{companyPhone} · {companyEmail}</div>
              <div>{companyWebsite}</div>
            </div>
          </div>
          <h1
            style={{
              margin:
                "0 0 6px 0",
              color: "#1c1917",
            }}
          >
            PROJECT QUOTE
          </h1>

          <div
            style={{
              color: "#78716c",
              marginBottom: "24px",
            }}
          >
            {companyName}
          </div>

          <div style={infoGrid}>
            <InfoCard
              label="Client"
              value={
                quote.clientName
              }
            />

            <InfoCard
              label="Quote #"
              value={
                quote.quoteNumber
              }
            />

            <InfoCard
              label="Address"
              value={
                quote.projectAddress
              }
            />

            <InfoCard
              label="Date"
              value={
                quote.quoteDate
              }
            />

            <InfoCard
              label="Contact"
              value={
                quote.contactInfo
              }
            />

            <InfoCard
              label="Start Window"
              value={
                quote.startWindow
              }
            />
          </div>

          <div
            style={{
              marginTop: "30px",
              marginBottom:
                "30px",
              background:
                "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
              border:
                "1px solid #fdba74",
              borderRadius: "18px",
              padding: "24px",
              textAlign:
                "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight:
                  "bold",
                color: "#9a3412",
                marginBottom:
                  "8px",
                letterSpacing:
                  "0.06em",
              }}
            >
              TOTAL PROJECT COST
            </div>

            <div
              style={{
                fontSize: "44px",
                fontWeight: 800,
                color: "#1c1917",
              }}
            >
              {formatCurrency(quote.projectTotal)}
            </div>
          </div>

          <SectionCard title="Scope of Work">
            <div
              style={{
                whiteSpace:
                  "pre-line",
                lineHeight: 1.7,
              }}
            >
              {
                quote.scopeOfWork
              }
            </div>
          </SectionCard>

          {(quote.includePaymentTerms ||
            quote.includeWeatherDisclaimer ||
            quote.includeScopeDisclaimer ||
            quote.includeDepositNote ||
            quote.includeAcceptanceLanguage) && (
            <SectionCard title="Terms & Notes">
              {quote.includePaymentTerms && (
                <p>
                  Payment is due
                  upon completion
                  unless other
                  terms are agreed
                  to in writing.
                </p>
              )}

              {quote.includeWeatherDisclaimer && (
                <p>
                  Weather
                  conditions,
                  material
                  availability,
                  and site
                  accessibility may
                  affect scheduling
                  timelines.
                </p>
              )}

              {quote.includeScopeDisclaimer && (
                <p>
                  Any work
                  requested
                  outside the
                  listed scope may
                  require
                  additional
                  approval and
                  pricing.
                </p>
              )}

              {quote.includeDepositNote && (
                <p>
                  A deposit may be
                  required prior to
                  scheduling or
                  material
                  delivery.
                </p>
              )}

              {quote.includeAcceptanceLanguage && (
                <p>
                  Approval by
                  reply,
                  signature, or
                  written
                  confirmation
                  authorizes {companyName} to schedule and perform the work described in this quote.
                </p>
              )}
            </SectionCard>
          )}

          <SectionCard title="Next Steps">
            To move forward with this project, reply to this quote or contact {companyName} directly. Once approved, your project will be placed on the schedule.
          </SectionCard>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#fafaf9",
        border:
          "1px solid #e7e5e4",
        borderRadius: "14px",
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: "#78716c",
          marginBottom: "6px",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.04em",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#1c1917",
          lineHeight: 1.5,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: "22px",
        background: "#ffffff",
        border:
          "1px solid #e7e5e4",
        borderRadius: "16px",
        padding: "22px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom:
            "14px",
          color: "#1c1917",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function topButton(
  background: string,
  color: string,
  border?: string
) {
  return {
    padding: "14px 18px",
    borderRadius: "10px",
    border: border
      ? `1px solid ${border}`
      : "none",
    background,
    color,
    fontWeight:
      "bold" as const,
    cursor: "pointer",
  };
}

const infoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};
