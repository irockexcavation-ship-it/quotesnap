"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Profile = {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  tagline: string;
};

const emptyProfile: Profile = {
  business_name: "", contact_name: "", phone: "", email: "",
  address: "", website: "", tagline: "",
};

const fields: { key: keyof Profile; label: string; placeholder: string; type?: string }[] = [
  { key: "business_name", label: "Business name", placeholder: "iRock LLC · Lite Excavation & Hauling" },
  { key: "contact_name", label: "Contact name", placeholder: "Business contact" },
  { key: "phone", label: "Business phone", placeholder: "(502) 555-0123", type: "tel" },
  { key: "email", label: "Business email", placeholder: "contact@example.com", type: "email" },
  { key: "address", label: "Business address", placeholder: "City, State" },
  { key: "website", label: "Website", placeholder: "https://example.com", type: "url" },
  { key: "tagline", label: "Tagline", placeholder: "Built from the ground up." },
];

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [original, setOriginal] = useState<Profile>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active) return;
        if (authError || !data.user) {
          setError("Couldn't load account details. You can still sign out.");
          setProfileError("Sign in again to load your business profile.");
          return;
        }
        setEmail(data.user.email ?? "Not available");

        const { data: memberships, error: membershipError } = await supabase
          .from("workspace_members")
          .select("workspace_id, role")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: true });
        if (!active) return;
        if (membershipError) throw new Error(`Couldn't find your workspace: ${membershipError.message}`);
        const membership = memberships?.find((item) => item.role === "owner") ?? memberships?.[0];
        if (!membership) throw new Error("No workspace is connected to this account.");

        const { data: workspace, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id, name, business_name, contact_name, phone, email, address, website, tagline")
          .eq("id", membership.workspace_id)
          .single();
        if (!active) return;
        if (workspaceError || !workspace) throw new Error(`Couldn't load business information: ${workspaceError?.message ?? "Workspace not found"}`);
        const loaded: Profile = {
          business_name: workspace.business_name ?? workspace.name ?? "",
          contact_name: workspace.contact_name ?? "",
          phone: workspace.phone ?? "",
          email: workspace.email ?? "",
          address: workspace.address ?? "",
          website: workspace.website ?? "",
          tagline: workspace.tagline ?? "",
        };
        setWorkspaceId(workspace.id);
        setCanEdit(membership.role === "owner");
        setProfile(loaded);
        setOriginal(loaded);
      } catch (err) {
        if (active) setProfileError(err instanceof Error ? err.message : "Could not load your business profile.");
      } finally {
        if (active) { setLoading(false); setProfileLoading(false); }
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || !canEdit || saving) return;
    setProfileError("");
    setProfileMessage("");
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        (Object.keys(emptyProfile) as (keyof Profile)[]).map((key) => [key, profile[key].trim()])
      ) as Profile;
      if (!payload.business_name) {
        setProfileError("Business name is required.");
        return;
      }
      const { data, error: saveError } = await supabase
        .from("workspaces")
        .update(payload)
        .eq("id", workspaceId)
        .select("id")
        .single();
      if (saveError || !data) throw new Error(saveError?.message ?? "Save did not update a workspace.");
      setProfile(payload);
      setOriginal(payload);
      setProfileMessage("Business information saved successfully.");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not save business information.");
    } finally {
      setSaving(false);
    }
  }

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
  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db",
    borderRadius: 9, padding: "12px", fontSize: 15, color: "#111827", background: "#fff",
  };
  const dirty = JSON.stringify(profile) !== JSON.stringify(original);

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
          <div style={{ fontSize: 12, letterSpacing: ".15em", fontWeight: 800, marginTop: 22, color: "#fbbf24" }}>DIRT DON&apos;T LIE.</div>
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
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Business information</h2>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>These details are saved to your business workspace. Quotes and invoices will use them in a future update.</p>
          {profileLoading ? <p>Loading business profile...</p> : workspaceId ? (
            <form onSubmit={saveProfile}>
              {!canEdit && <p style={{ color: "#92400e", background: "#fef3c7", padding: 12, borderRadius: 8 }}>Only workspace owners can edit business information.</p>}
              {fields.map((field) => (
                <div key={field.key} style={{ marginBottom: 17 }}>
                  <label htmlFor={`business-${field.key}`} style={{ ...label, display: "block" }}>{field.label}</label>
                  <input id={`business-${field.key}`} type={field.type ?? "text"} placeholder={field.placeholder}
                    value={profile[field.key]} disabled={!canEdit || saving} required={field.key === "business_name"}
                    onChange={(event) => { setProfile((prev) => ({ ...prev, [field.key]: event.target.value })); setProfileMessage(""); }}
                    style={inputStyle} />
                </div>
              ))}
              {profileError && <p role="alert" style={{ color: "#991b1b", background: "#fee2e2", padding: 12, borderRadius: 8 }}>{profileError}</p>}
              {profileMessage && <p role="status" style={{ color: "#166534", background: "#dcfce7", padding: 12, borderRadius: 8 }}>{profileMessage}</p>}
              <button type="submit" disabled={!canEdit || saving || !dirty} style={{ background: !canEdit || saving || !dirty ? "#9ca3af" : "#ea580c", color: "white", border: "none", borderRadius: 9, padding: "12px 20px", fontSize: 15, fontWeight: 800, cursor: !canEdit || saving || !dirty ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : <p role="alert" style={{ color: "#991b1b", background: "#fee2e2", padding: 12, borderRadius: 8 }}>{profileError || "Business profile unavailable."}</p>}
        </section>

        <section style={panel}>
          <h2 style={{ margin: "0 0 8px", fontSize: 19 }}>Coming later</h2>
          <p style={{ color: "#6b7280", margin: 0, lineHeight: 1.6 }}>Company logo uploads, automatic quote and invoice branding, notification preferences, and D.I.R.T. integration.</p>
        </section>
      </div>
    </main>
  );
}
