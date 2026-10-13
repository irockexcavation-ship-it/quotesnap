import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      return NextResponse.json({ error: "Server configuration is incomplete." }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    const token = body?.token;
    const name = body?.name;

    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      return NextResponse.json({ error: "Invalid quote link." }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 150) {
      return NextResponse.json({ error: "Enter your full name (2 to 150 characters)." }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const admin = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // The database function atomically freezes the accepted quote and refuses
    // duplicate, expired, or revoked approvals. Never expose the server key.
    const { data: accepted, error } = await admin.rpc("accept_customer_quote", {
      p_token_hash: tokenHash,
      p_customer_name: name.trim(),
    });

    if (error) {
      console.error("Customer quote acceptance failed:", error);
      return NextResponse.json({ error: "Approval could not be recorded. Please try again." }, { status: 500 });
    }
    if (accepted !== true) {
      return NextResponse.json(
        { error: "This quote link is unavailable or has already been approved. Contact iRock for help." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { accepted: true, message: "Your quote approval has been recorded." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Customer quote acceptance route failed:", error);
    return NextResponse.json({ error: "Approval could not be recorded." }, { status: 500 });
  }
}
