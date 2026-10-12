"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError) setError("Couldn't load account details. You can still sign out.");
        setEmail(data.user?.email ?? "Not available");
      } catch {
        if (active) setError("Couldn't load account details. You can still sign out.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadAccount();
    return () => { active = false; };
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(`Could not sign out: ${signOutError.message}`);
        setSigningOut(false);
        return;
      }
      // Full navigation clears protected page state and lets AuthGuard start fresh.
      window.location.replace("/login");
    } catch {
      setError("Could not sign out. Check your connection and try again.");
      setSigningOut(false);
    }
  }

  const panel: React.CSSProperties = {
    background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 14,
    padding: 22, boxShadow: "0 2px 10px rgba(15,23,42,.04)",
  };
  const label: React.CSSProperties = {
    color: "#6b7280", fontSize: 12, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 7,
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f3f4f6", padding: "24px 16px 56px", fontFamily: "Arial, sans-serif", color: "#111827" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>QUOTESNAP</div>
            <h1 style={{ fontSize: 30, margin: 0 }}>Settings</h1>
          </div>
          <Link href="/dashboard" style={{ color: "#111827", background: "white", border: "1px solid #d1d5db", borderRadius: 9, padding: "11px 14px", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>← Dashboard</Link>
        </div>

        <section style={{ ...panel, background: "#111827", color: "#ffffff", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#d1d5db", letterSpacing: ".12em", fontWeight: 700 }}>iROCK INDUSTRIES</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>QuoteSnap</div>
          <div style={{ color: "#d1d5db", marginTop: 5, fontSize: 14 }}>Built from the ground up.</div>
          <div style={{ fontSize: 12, letterSpacing: ".15em", fontWeight: 800, marginTop: 22, color: "#fbbf24" }}>DIRT DON'T LIE.</div>
        </section>

        <section style={{ ...panel, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 19 }}>Your account</h2>
          <div style={label}>Signed-in email</div>
          <div style={{ fontSize: 16, overflowWrap: "anywhere", marginBottom: 20 }}>{loading ? "Loading account..." : email}</div>
          {error && <p role="alert" style={{ color: "#991b1b", background: "#fee2e2", padding: 12, borderRadius: 8 }}>{error}</p>}
          <button type="button" onClick={handleSignOut} disabled={signingOut} style={{ background: signingOut ? "#9ca3af" : "#b91c1c", color: "white", border: "none", borderRadius: 9, padding: "12px 20px", fontSize: 15, fontWeight: 700, cursor: signingOut ? "wait" : "pointer" }}>
            {signingOut ? "Signing out..." : "Log Out"}
          </button>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 0 }}>Signing out returns you to the QuoteSnap login screen.</p>
        </section>

        <section style={{ ...panel, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 19 }}>Business information</h2>
          <div style={label}>Company</div>
          <p style={{ margin: "0 0 17px" }}>iRock LLC · Lite Excavation &amp; Hauling</p>
          <div style={label}>Phone</div>
          <p style={{ margin: "0 0 17px" }}><a href="tel:+15025529462" style={{ color: "#1d4ed8" }}>(502) 552-9462</a></p>
          <div style={label}>Email</div>
          <p style={{ margin: "0 0 17px", overflowWrap: "anywhere" }}><a href="mailto:irockexcavation@gmail.com" style={{ color: "#1d4ed8" }}>irockexcavation@gmail.com</a></p>
          <div style={label}>Website</div>
          <p style={{ margin: 0 }}><a href="https://irockx.com" target="_blank" rel="noopener noreferrer" style={{ color: "#1d4ed8" }}>iRockX.com</a></p>
          <p style={{ margin: "20px 0 0", color: "#6b7280", fontSize: 13 }}>Business details are displayed here for reference. Editing them will be added later.</p>
        </section>

        <section style={panel}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Coming later</h2>
          <p style={{ color: "#6b7280", margin: 0, lineHeight: 1.6 }}>Editable business profile, invoice preferences, notifications, and DIRT integration. We're keeping those controls out until they actually do something.</p>
        </section>
      </div>
    </main>
  );
}
