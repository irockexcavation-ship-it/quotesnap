"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function SetupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.replace("/login");
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1);

        if (membershipError) throw membershipError;
        if (memberships && memberships.length > 0) {
          router.replace("/");
          return;
        }

        if (active) {
          const suggested = user.user_metadata?.business_name;
          setBusinessName(typeof suggested === "string" ? suggested : "");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to check your account.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => { active = false; };
  }, [router]);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const name = businessName.trim();
    if (name.length < 2 || name.length > 120) {
      setError("Business name must be between 2 and 120 characters.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { error: createError } = await supabase.rpc("create_my_workspace", {
        p_business_name: name,
      });
      if (createError) throw createError;

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workspace setup failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "13px", fontSize: "16px",
    border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "7px",
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#111827", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: "440px", padding: "32px", borderRadius: "16px", background: "white", color: "#111827", boxSizing: "border-box" }}>
        <h1 style={{ marginTop: 0 }}>Set up your business</h1>
        <p style={{ color: "#475569", lineHeight: 1.5 }}>QuoteSnap will create a private workspace for your business. Your quotes and jobs will be separate from other businesses.</p>
        {loading ? (
          <p role="status">Checking your account...</p>
        ) : (
          <form onSubmit={createWorkspace}>
            <label htmlFor="business-name" style={{ fontWeight: 700 }}>Business name</label>
            <input id="business-name" style={inputStyle} value={businessName} onChange={(event) => setBusinessName(event.target.value)} required minLength={2} maxLength={120} autoComplete="organization" />
            {error && <p role="alert" style={{ color: "#b91c1c", lineHeight: 1.5 }}>{error}</p>}
            <button type="submit" disabled={saving} style={{ width: "100%", marginTop: "18px", padding: "14px", border: 0, borderRadius: "8px", background: saving ? "#64748b" : "#111827", color: "white", fontWeight: 700, fontSize: "16px", cursor: saving ? "wait" : "pointer" }}>
              {saving ? "Creating workspace..." : "Create my workspace"}
            </button>
          </form>
        )}
        <p style={{ marginBottom: 0, marginTop: "20px" }}><Link href="/login">Back to sign in</Link></p>
      </section>
    </main>
  );
}
