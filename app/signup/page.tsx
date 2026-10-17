"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const name = businessName.trim();
    if (name.length < 2 || name.length > 100) {
      setError("Enter a business name between 2 and 100 characters.");
      return;
    }
    if (password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/setup`,
          data: { business_name: name },
        },
      });
      if (signupError) throw signupError;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account creation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px", borderRadius: "8px",
    border: "1px solid #cbd5e1", fontSize: "16px", marginTop: "6px", marginBottom: "16px",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#111827", display: "grid", placeItems: "center", padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: "440px", padding: "32px", borderRadius: "16px", background: "white", color: "#111827", boxSizing: "border-box" }}>
        <h1 style={{ marginTop: 0 }}>Create your QuoteSnap account</h1>
        {success ? (
          <div role="status">
            <p>Check your email for a confirmation link. After confirming, sign in and finish setting up your business workspace.</p>
            <p>If an account already exists for that email, use the sign-in page instead.</p>
            <Link href="/login">Go to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <label htmlFor="business">Business name</label>
            <input id="business" style={field} value={businessName} onChange={e => setBusinessName(e.target.value)} required minLength={2} maxLength={100} autoComplete="organization" />
            <label htmlFor="email">Email</label>
            <input id="email" style={field} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <label htmlFor="password">Password (12 characters minimum)</label>
            <input id="password" style={field} type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={12} autoComplete="new-password" />
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" style={field} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
            <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px", background: "#111827", color: "white", border: 0, borderRadius: "8px", fontSize: "16px", fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Creating account..." : "Create account"}
            </button>
          </form>
        )}
        <p style={{ marginBottom: 0, marginTop: "20px" }}><Link href="/login">Already have an account? Sign in</Link></p>
      </section>
    </main>
  );
}
