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
      return NextResponse.json({ error: "Could not create customer link." }, { status: 500 });
    }

    const origin = new URL(request.url).origin;
    return NextResponse.json({ link: `${origin}/q/${token}` });
  } catch (error) {
    console.error("Quote share route failed:", error);
    return NextResponse.json({ error: "Could not create customer link." }, { status: 500 });
  }
}
