import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

const SENDER_EMAIL = "QuoteSnap <notifications@irockx.com>";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return entities[character];
  });
}

function formatAmount(value: unknown): string {
  if (typeof value !== "number" && typeof value !== "string") return "Not specified";
  const number = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number)
    : String(value);
}

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

    // Keep the existing atomic database approval workflow unchanged.
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
        { error: "This quote link is unavailable or has already been approved. Contact the business for help." },
        { status: 409 },
      );
    }

    // Approval is already committed. Email is best-effort and must never undo it.
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        console.warn("Quote approval email skipped: RESEND_API_KEY is not configured.");
      } else {
        const { data: link, error: linkError } = await admin
          .from("quote_share_links")
          .select("id, quote_id, workspace_id, accepted_name, accepted_at, accepted_quote_snapshot")
          .eq("token_hash", tokenHash)
          .single();

        if (linkError || !link) {
          console.error("Quote approval email: could not load accepted quote:", linkError);
        } else {
          // Resolve the recipient from the workspace associated with this approved link.
          // Never fall back to iRock or to the requester's supplied input.
          const { data: workspace, error: workspaceError } = await admin
            .from("workspaces")
            .select("name, business_name, email")
            .eq("id", link.workspace_id)
            .single();
          const recipient = typeof workspace?.email === "string" ? workspace.email.trim() : "";
          if (workspaceError || !recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            console.error("Quote approval email skipped: workspace notification email missing or invalid.");
          } else {
            const businessName = (workspace.business_name || workspace.name || "Your business").trim();
            const snapshot = (link.accepted_quote_snapshot ?? {}) as Record<string, unknown>;
            const quoteNumber = String(snapshot.quoteNumber ?? "Quote");
            const clientName = String(snapshot.clientName ?? "Customer");
            const amount = formatAmount(snapshot.projectTotal);
            const approvedBy = String(link.accepted_name ?? name.trim());
            const approvedAt = link.accepted_at
              ? new Date(link.accepted_at).toLocaleString("en-US", { timeZone: "America/New_York" }) + " Eastern"
              : "Just now";
            const jobsUrl = "https://quotesnap-six.vercel.app/current-jobs";
            const subject = `Quote Approved: ${quoteNumber} - ${clientName}`;
            const plainText = [
              `A customer has approved a quote for ${businessName}.`,
              `Quote: ${quoteNumber}`,
              `Customer: ${clientName}`,
              `Approved by: ${approvedBy}`,
              `Approved amount: ${amount}`,
              `Approved at: ${approvedAt}`,
              "Status: Approved - added to Current Jobs",
              `View Current Jobs: ${jobsUrl}`,
            ].join("\n");
            const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px">
              <h2 style="margin-bottom:8px">${escapeHtml(businessName)} | Quote Approved</h2>
              <p>A customer approved a QuoteSnap quote.</p>
              <p><strong>Quote:</strong> ${escapeHtml(quoteNumber)}<br>
              <strong>Customer:</strong> ${escapeHtml(clientName)}<br>
              <strong>Approved by:</strong> ${escapeHtml(approvedBy)}<br>
              <strong>Approved amount:</strong> ${escapeHtml(amount)}<br>
              <strong>Approved at:</strong> ${escapeHtml(approvedAt)}<br>
              <strong>Status:</strong> Approved, added to Current Jobs</p>
              <p><a href="${jobsUrl}">Open Current Jobs in QuoteSnap</a></p>
            </div>`;

            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `quotesnap-approval-${link.id}`,
              },
              body: JSON.stringify({
                from: SENDER_EMAIL,
                to: [recipient],
                subject,
                text: plainText,
                html,
              }),
              signal: AbortSignal.timeout(6000),
            });

            if (!response.ok) {
              console.error("Quote approval email failed. Resend status:", response.status);
            }
          }
        }
      }
    } catch (notificationError) {
      console.error("Quote approval recorded, but email notification failed:", notificationError);
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
