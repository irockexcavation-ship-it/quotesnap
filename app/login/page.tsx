"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            QuoteSnap
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#6b7280",
              fontSize: "15px",
            }}
          >
            iRock LLC
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontWeight: 700,
              color: "#374151",
            }}
          >
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "18px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991b1b",
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "18px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: "8px",
              background: loading ? "#6b7280" : "#111827",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
