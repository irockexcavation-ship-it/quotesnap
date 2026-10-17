import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import CustomerApprovalForm from "./CustomerApprovalForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuoteSnapshot = {
  quoteNumber?: string | null;
  clientName?: string | null;
  projectAddress?: string | null;
  contactInfo?: string | null;
  quoteDate?: string | null;
  projectTotal?: string | number | null;
  startWindow?: string | null;
  scopeOfWork?: string | null;
  bannerImage?: string | null;
  includePaymentTerms?: boolean;
  includeWeatherDisclaimer?: boolean;
  includeScopeDisclaimer?: boolean;
  includeDepositNote?: boolean;
  includeAcceptanceLanguage?: boolean;
};

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(String(value ?? "0").replace(/[$,]/g, ""));
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number.isFinite(amount) ? amount : 0
  );
}

function Message({ heading, body }: { heading: string; body: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "#f5f5f4", padding: "70px 16px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ maxWidth: 650, margin: "auto", padding: 30, background: "white", borderRadius: 16 }}>
        <h1 style={{ color: "#1c1917" }}>{heading}</h1>
        <p style={{ color: "#57534e", lineHeight: 1.6 }}>{body}</p>
      </section>
    </main>
  );
}

export default async function CustomerQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token || "")) {
    return <Message heading="Link unavailable" body="This quote link is invalid. Please contact the business that sent you this quote for a new link." />;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return <Message heading="Temporarily unavailable" body="The quote cannot be loaded right now. Please try again later." />;
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: link, error } = await admin
    .from("quote_share_links")
    .select("id, workspace_id, quote_snapshot, revoked_at, expires_at, accepted_at, accepted_name")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error || !link || link.revoked_at || (link.expires_at && Date.parse(link.expires_at) <= Date.now())) {
    return <Message heading="Link unavailable" body="This quote link is no longer available. Please contact the business that sent you this quote for a new link." />;
  }

  // Count valid link opens. This is an access count, not proof a human read the quote.
  // A tracking failure must never prevent a customer from viewing the quote.
  try {
    const { data: tracked, error: trackingError } = await admin.rpc("record_quote_link_view", {
      p_link_id: link.id,
    });
    if (trackingError) console.warn("Quote link tracking unavailable:", trackingError.message);
    void tracked;
  } catch (trackingError) {
    console.warn("Quote link tracking unavailable:", trackingError);
  }

  const { data: business, error: businessError } = await admin
    .from("workspaces")
    .select("name, business_name, phone, website, tagline, logo_path")
    .eq("id", link.workspace_id)
    .maybeSingle();

  if (businessError) console.error("Customer quote business profile lookup failed:", businessError);
  if (!business && !businessError) console.warn("Customer quote business profile not found for linked workspace.");

  const companyName = business?.business_name?.trim() || business?.name?.trim() || "Your contractor";
  const companyPhone = business?.phone?.trim() || "";
  const companyWebsite = business?.website?.trim() || "";
  const companyTagline = business?.tagline?.trim() || "";
  const logoPath = business?.logo_path?.trim();
  const logoUrl = logoPath
    ? /^https?:\/\//i.test(logoPath)
      ? logoPath
      : admin.storage.from("business-logos").getPublicUrl(logoPath).data.publicUrl
    : null;

  const q = (link.quote_snapshot || {}) as QuoteSnapshot;
  const terms = [
    q.includePaymentTerms && "Payment is due upon completion unless other terms are agreed to in writing.",
    q.includeWeatherDisclaimer && "Weather conditions, material availability, and site accessibility may affect scheduling timelines.",
    q.includeScopeDisclaimer && "Work requested outside the listed scope may require additional approval and pricing.",
    q.includeDepositNote && "A deposit may be required prior to scheduling or material delivery.",
    q.includeAcceptanceLanguage && `Approval by reply, signature, or written confirmation authorizes ${companyName} to schedule and perform the work described in this quote.`,
  ].filter(Boolean);

  const section: React.CSSProperties = { background: "white", border: "1px solid #e7e5e4", borderRadius: 14, padding: "20px 22px", marginTop: 18 };
  const label: React.CSSProperties = { fontSize: 12, color: "#78716c", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 5 };

  return (
    <main style={{ background: "#f5f5f4", minHeight: "100vh", padding: "22px 14px 55px", fontFamily: "Arial, sans-serif", color: "#1c1917" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <header style={{ background: "#1c1917", color: "white", borderRadius: 16, padding: "25px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`${companyName} logo`} style={{ width: 82, height: 72, objectFit: "contain" }} />
            )}
            <div>
              {!logoUrl && <div style={{ fontSize: 23, fontWeight: 900 }}>{companyName}</div>}
              {companyTagline && <div style={{ color: "#fdba74", marginTop: 7, fontSize: 13, letterSpacing: 1 }}>{companyTagline}</div>}
              {(companyPhone || companyWebsite) && <div style={{ marginTop: 12, fontSize: 13 }}>{[companyPhone, companyWebsite].filter(Boolean).join(" · ")}</div>}
            </div>
          </div>
        </header>

        {q.bannerImage && /^(https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(q.bannerImage) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.bannerImage} alt="Project" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 14, marginTop: 18 }} />
        )}

        <section style={section}>
          <h1 style={{ marginTop: 0, fontSize: 27 }}>Project Quote</h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
            <div><div style={label}>Prepared for</div><strong>{q.clientName || "Customer"}</strong></div>
            <div><div style={label}>Quote number</div>{q.quoteNumber || "-"}</div>
            <div><div style={label}>Project address</div>{q.projectAddress || "-"}</div>
            <div><div style={label}>Quote date</div>{q.quoteDate || "-"}</div>
            <div><div style={label}>Estimated start window</div>{q.startWindow || "To be scheduled"}</div>
            <div><div style={label}>Contact</div>{q.contactInfo || "-"}</div>
          </div>
        </section>

        <section style={{ ...section, background: "#fff7ed", borderColor: "#fdba74", textAlign: "center" }}>
          <div style={{ ...label, color: "#9a3412" }}>Total project cost</div>
          <div style={{ fontSize: 38, fontWeight: 900 }}>{formatMoney(q.projectTotal)}</div>
        </section>

        <section style={section}>
          <h2 style={{ marginTop: 0 }}>Scope of Work</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{q.scopeOfWork || "Please contact us for scope details."}</div>
        </section>

        {terms.length > 0 && (
          <section style={section}>
            <h2 style={{ marginTop: 0 }}>Terms &amp; Notes</h2>
            {terms.map((term, i) => <p key={i} style={{ lineHeight: 1.7 }}>{term}</p>)}
          </section>
        )}

        <section style={section}>
          <h2 style={{ marginTop: 0 }}>Ready to move forward?</h2>
          <p style={{ lineHeight: 1.7 }}>Review the scope, price, and terms above. You can approve this quote securely below or contact {companyName} with questions.</p>
          <CustomerApprovalForm token={token} alreadyApproved={Boolean(link.accepted_at)} approvedName={link.accepted_name} />
          {companyPhone && <a href={`tel:${companyPhone.replace(/[^\d+]/g, "")}`} style={{ display: "inline-block", marginTop: 16, background: "#f97316", color: "white", padding: "13px 20px", borderRadius: 10, fontWeight: 800, textDecoration: "none" }}>Call {companyName}</a>}
        </section>
        <footer style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#78716c" }}>
          Proposal issued by {companyName}
        </footer>
      </div>
    </main>
  );
}
