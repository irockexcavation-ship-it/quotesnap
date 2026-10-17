import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !publishableKey || !secretKey) {
      return NextResponse.json({ error: "Server configuration is incomplete." }, { status: 500 });
    }

    const authorization = request.headers.get("authorization") || "";
    const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!bearer) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const authClient = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: auth, error: authError } = await authClient.auth.getUser(bearer);
    if (authError || !auth.user) {
      return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const quoteId = body?.quoteId;
    const recipient = typeof body?.email === "string" ? body.email.trim() : "";
    if (recipient.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      return NextResponse.json({ error: "Enter a valid customer email address." }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }
    if (typeof quoteId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(quoteId)) {
      return NextResponse.json({ error: "Invalid quote ID." }, { status: 400 });
    }

    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: quote, error: quoteError } = await admin
      .from("quotes").select("*").eq("id", quoteId).single();
    if (quoteError || !quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });

    const { data: membership, error: membershipError } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", auth.user.id)
      .eq("workspace_id", quote.workspace_id)
      .limit(1)
      .maybeSingle();
    if (membershipError || !membership) {
      return NextResponse.json({ error: "Not authorized for this quote." }, { status: 403 });
    }

    // The sender's workspace is established from the authorized quote, never from request input.
    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .select("name, business_name, email")
      .eq("id", quote.workspace_id)
      .single();
    if (workspaceError || !workspace) {
      return NextResponse.json({ error: "Business profile not found." }, { status: 500 });
    }
    const businessName = String(workspace.business_name || workspace.name || "").trim();
    const businessEmail = String(workspace.email || "").trim();
    if (!businessName || businessEmail.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      return NextResponse.json(
        { error: "Set a valid business name and email in Settings before emailing quotes." },
        { status: 400 }
      );
    }

    // Explicit customer-facing fields only. Never expose internal notes or workspace records.
    const snapshot = {
      quoteNumber: quote.quote_number,
      clientName: quote.client_name,
      projectAddress: quote.project_address,
      contactInfo: quote.contact_info,
      quoteDate: quote.quote_date,
      projectTotal: quote.project_total,
      startWindow: quote.start_window,
      scopeOfWork: quote.scope_of_work,
      bannerImage: quote.banner_image_url,
      includePaymentTerms: quote.include_payment_terms,
      includeWeatherDisclaimer: quote.include_weather_disclaimer,
      includeScopeDisclaimer: quote.include_scope_disclaimer,
      includeDepositNote: quote.include_deposit_note,
      includeAcceptanceLanguage: quote.include_acceptance_language,
    };

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { error: insertError } = await admin.from("quote_share_links").insert({
      quote_id: quote.id,
      workspace_id: quote.workspace_id,
      token_hash: tokenHash,
      quote_snapshot: snapshot,
    });
    if (insertError) {
      console.error("Quote link creation failed:", insertError);
      return NextResponse.json({ error: "Could not email quote." }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    const link = `${origin}/q/${token}`;
    const quoteNumber = String(quote.quote_number || "Your quote");
    const clientName = String(quote.client_name || "there");
    const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[char] || char));
    const safeLink = escapeHtml(link);
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222">
        <h2 style="color:#ea580c">${escapeHtml(businessName)}</h2>
        <p>Hello ${escapeHtml(clientName)},</p>
        <p>Your quote <strong>${escapeHtml(quoteNumber)}</strong> is ready for review.</p>
        <p>Use the secure link below to view the scope and approve the quote online.</p>
        <p style="margin:28px 0"><a href="${safeLink}" style="background:#ea580c;color:#fff;padding:13px 20px;text-decoration:none;border-radius:8px">View &amp; Approve Quote</a></p>
        <p>If the button doesn't work, copy this link into your browser:<br/><a href="${safeLink}">${safeLink}</a></p>
        <p>Thank you,<br/>${escapeHtml(businessName)}</p>
      </div>`;
    let sent = false;
    try {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "QuoteSnap <quotes@irockx.com>",
          to: [recipient],
          reply_to: businessEmail,
          subject: `${businessName} | Quote ${quoteNumber}`,
          html,
          text: `Hello ${clientName},\n\nYour quote ${quoteNumber} from ${businessName} is ready. View and approve it here:\n${link}\n\nThank you,\n${businessName}`,
        }),
      });
      sent = emailResponse.ok;
      if (!sent) {
        console.error("Resend rejected quote email:", emailResponse.status, await emailResponse.text());
      }
    } catch (emailError) {
      console.error("Quote email delivery request failed:", emailError);
    }
    if (!sent) {
      return NextResponse.json({ error: "Email could not be sent. The quote was not marked Sent. Please retry." }, { status: 502 });
    }
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Quote email route failed:", error);
    return NextResponse.json({ error: "Could not email quote." }, { status: 500 });
  }
}
