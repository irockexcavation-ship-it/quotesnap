"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import DirtTalk from "./DirtTalk";
// D.I.R.T. Phase 1: transparent, local rules. No AI service or pricing guesses.
type DirtResult = { scope: string; observations: string[]; questions: string[] };
function buildDirtDraft(raw: string): DirtResult {
 const notes = raw.trim();
 
  const lower = notes.toLowerCase();
  const observations: string[] = [];
  const questions: string[] = [];
  const actions: string[] = [];
  const dimensions = notes.match(/\b(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')?\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')?\b/i);
  const lengthWidth = notes.match(/\b(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')\s*(?:long|length)\b[\s\S]{0,90}?\b(\d+(?:\.\d+)?)\s*(?:ft|feet|foot|')\s*(?:wide|width)\b/i);
  const measure = dimensions || lengthWidth;
  let squareFeet: number | null = null;
  if (measure) {
    const a = Number(measure[1]); const b = Number(measure[2]);
    if (a > 0 && b > 0) {
      squareFeet = a * b;
      observations.push(`Rectangular area: ${a.toLocaleString()} ft × ${b.toLocaleString()} ft = ${squareFeet.toLocaleString()} sq ft (verify actual shape).`);
    }
  } else {
    questions.push("Confirm length, width, and any irregular areas before estimating material.");
  }
  const depth = notes.match(/\b(\d+(?:\.\d+)?)\s*(?:inches|inch|in|\")\s*(?:deep|depth|thick|layer)?\b/i);
  if (squareFeet !== null && depth) {
    const inches = Number(depth[1]);
    if (inches > 0 && inches <= 36) {
      const yards = squareFeet * (inches / 12) / 27;
      observations.push(`At ${inches} in uniform depth: approximately ${yards.toFixed(1)} cubic yards BEFORE compaction/waste. Confirm depth and material conversion before ordering.`);
    }
  } else if (/\bdga\b|\bgravel\b|\bstone\b|\b(?:#2|#3|#57)\b/.test(lower)) {
    questions.push("Confirm finished stone depth and tonnage conversion with your supplier.");
  }
  if (/power.rak|harley.rak|soil.condition/.test(lower)) actions.push("Power rake and recondition the existing surface where specified.");
  if (/grad(?:e|ing)|reshap|level|crown/.test(lower)) actions.push("Grade and shape the work area to the agreed drainage profile.");
  if (/\bdga\b/.test(lower)) actions.push("Place and grade dense graded aggregate (DGA) to the approved depth.");
  if (/\b#3\b|\bnumber 3\b/.test(lower)) actions.push("Install #3 stone base in the designated areas.");
  if (/\b#2\b|\bnumber 2\b/.test(lower)) actions.push("Install #2 stone base in the designated areas.");
  if (/fabric|geotextile/.test(lower)) actions.push("Install geotextile fabric in the agreed locations and specification.");
  if (/roll|compact/.test(lower)) actions.push("Compact the finished aggregate with a vibratory roller where accessible.");
  if (/culvert|cross.drain/.test(lower)) actions.push("Install or service the specified culvert/cross-drain after confirming pipe size, grade, and outlet.");
  if (/ditch|swale|drainage/.test(lower)) actions.push("Shape drainage features to direct runoff to an approved outlet.");
  if (/brush|clear(?:ing)?/.test(lower)) actions.push("Cut or clear vegetation within the agreed work limits.");
  if (/\b(?:day|days)\b/.test(lower)) observations.push("Work duration was mentioned; verify the schedule before committing to a start window.");
  if (!actions.length) questions.push("Review the notes and write the exact work steps; no recognizable operation was detected.");
  questions.push("Verify site access, underground utilities, drainage, and exclusions before sending.");
  const scope = actions.map((a, i) => `${i + 1}. ${a}`).join("\n");
  return { scope, observations, questions };
}

export default function NewQuotePage() {
  const [dirtNotes, setDirtNotes] = useState("");
  const [dirtResult, setDirtResult] = useState<DirtResult | null>(null);
  const [dirtMessage, setDirtMessage] = useState("");
  const [dirtBusy, setDirtBusy] = useState(false);
  const [dirtMode, setDirtMode] = useState<"local" | "ai">("local");
  const [quoteId, setQuoteId] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [editingExistingQuote, setEditingExistingQuote] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteDate, setQuoteDate] = useState("");
  const [projectTotal, setProjectTotal] = useState("");
  const [startWindow, setStartWindow] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [status, setStatus] = useState<"Draft" | "Sent" | "Approved" | "Archived">("Draft");

  const [includePaymentTerms, setIncludePaymentTerms] = useState(true);
  const [includeWeatherDisclaimer, setIncludeWeatherDisclaimer] = useState(true);
  const [includeScopeDisclaimer, setIncludeScopeDisclaimer] = useState(true);
  const [includeDepositNote, setIncludeDepositNote] = useState(false);
  const [includeAcceptanceLanguage, setIncludeAcceptanceLanguage] = useState(true);

useEffect(() => {
  async function loadDraft() {
    const savedDraft = localStorage.getItem("quotesnapEditDraft");

    if (savedDraft) {
      setEditingExistingQuote(true);
      const draft = JSON.parse(savedDraft);

      setQuoteId(draft.id || Date.now().toString());
      setClientName(draft.clientName || "");
      setProjectAddress(draft.projectAddress || "");
      setContactInfo(draft.contactInfo || "");

      const nextQuoteNumber =
        draft.quoteNumber || (await generateQuoteNumber());
      setQuoteNumber(nextQuoteNumber);

      setQuoteDate(draft.quoteDate || getToday());
      setProjectTotal(draft.projectTotal || "");
      setStartWindow(draft.startWindow || "");
      setScopeOfWork(draft.scopeOfWork || "");
      setBannerImage(draft.bannerImage || "");
      setStatus(draft.status || "Draft");

      setIncludePaymentTerms(draft.includePaymentTerms ?? true);
      setIncludeWeatherDisclaimer(draft.includeWeatherDisclaimer ?? true);
      setIncludeScopeDisclaimer(draft.includeScopeDisclaimer ?? true);
      setIncludeDepositNote(draft.includeDepositNote ?? false);
      setIncludeAcceptanceLanguage(draft.includeAcceptanceLanguage ?? true);
    } else {
      setQuoteId(Date.now().toString());
      setQuoteNumber(await generateQuoteNumber());
      setQuoteDate(getToday());
      setStatus("Draft");
    }
  }

  loadDraft();
}, []);
  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  // The database generates numbers within the signed-in user's workspace.
  // A preview number is not reserved; the final number is confirmed on save.
  async function generateQuoteNumber(): Promise<string> {
    const { data, error } = await supabase.rpc("next_quote_number");
    if (error || typeof data !== "string") {
      console.error("Could not generate quote number:", error);
      return "";
    }
    return data;
  }

  async function compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 1200;
          const scale = img.width > maxWidth ? maxWidth / img.width : 1;

          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressed);
        };

        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file);
    setBannerImage(compressed);
  }

  async function analyzeWithAI() {
    if (!dirtNotes.trim()) { setDirtMessage("Enter job notes first."); return; }
    setDirtBusy(true);
    setDirtMessage("");
    setDirtResult(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (sessionError || !token) throw new Error("Please sign in again to use D.I.R.T. AI.");
      const response = await fetch("/api/dirt/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: dirtNotes }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `AI request failed (${response.status}).`);
      if (!body.scope || !Array.isArray(body.observations) || !Array.isArray(body.questions)) {
        throw new Error("AI returned an unexpected result. Try again.");
      }
      setDirtResult({ scope: body.scope, observations: body.observations, questions: body.questions });
      setDirtMode("ai");
      setDirtMessage("AI analysis ready. Review the internal notes and customer-facing scope before using it.");
    } catch (err) {
      setDirtMessage(err instanceof Error ? err.message : "D.I.R.T. AI could not analyze these notes.");
    } finally { setDirtBusy(false); }
  }

  async function saveQuote() {
    if (savingQuote) return;
    setSavingQuote(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("You must be logged in to save a quote.");

      const { data: membership, error: membershipError } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userData.user.id)
        .single();
      if (membershipError || !membership) throw new Error("Could not find your QuoteSnap workspace.");

      const id = quoteId || Date.now().toString();
      const fields = {
        workspace_id: membership.workspace_id,
        legacy_id: id,
        client_name: clientName,
        project_address: projectAddress,
        contact_info: contactInfo,
        quote_date: quoteDate,
        project_total: Number(String(projectTotal || "0").replace(/[$,\s]/g, "")),
        start_window: startWindow,
        scope_of_work: scopeOfWork,
        banner_image_url: bannerImage,
        status: status || "Draft",
        include_payment_terms: includePaymentTerms,
        include_weather_disclaimer: includeWeatherDisclaimer,
        include_scope_disclaimer: includeScopeDisclaimer,
        include_deposit_note: includeDepositNote,
        include_acceptance_language: includeAcceptanceLanguage,
      };

      let finalNumber = quoteNumber;
      if (editingExistingQuote) {
        // Edit the original record by its stable legacy ID, not by a quote-number conflict.
        // If the original is missing, stop rather than silently create a duplicate.
        const { data: existing, error: lookupError } = await supabase
          .from("quotes")
          .select("id, quote_number")
          .eq("workspace_id", membership.workspace_id)
          .eq("legacy_id", id)
          .maybeSingle();
        if (lookupError) throw new Error(lookupError.message);
        if (!existing) throw new Error("Original quote not found. No changes were saved.");
        finalNumber = existing.quote_number;
        const { data: updated, error: updateError } = await supabase
          .from("quotes")
          .update(fields)
          .eq("id", existing.id)
          .eq("workspace_id", membership.workspace_id)
          .select("id");
        if (updateError) throw new Error(updateError.message);
        if (!updated?.length) throw new Error("The original quote could not be updated.");
      } else {
        // A displayed draft number is only a preview. Generate again at insert time.
        // Unique(workspace_id, quote_number) protects against concurrent saves.
        let inserted = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          const { data: nextNumber, error: numberError } = await supabase.rpc("next_quote_number");
          if (numberError || typeof nextNumber !== "string") {
            throw new Error(numberError?.message || "Could not generate a quote number.");
          }
          finalNumber = nextNumber;
          const { error: insertError } = await supabase
            .from("quotes")
            .insert({ ...fields, quote_number: finalNumber });
          if (!insertError) { inserted = true; break; }
          // 23505 is a unique-constraint collision. Retry with a fresh number.
          if (insertError.code !== "23505") throw new Error(insertError.message);
        }
        if (!inserted) throw new Error("Quote numbering is busy. Please try saving again.");
      }

      const quoteData = {
        id, clientName, projectAddress, contactInfo, quoteNumber: finalNumber,
        quoteDate, projectTotal, startWindow, scopeOfWork, bannerImage,
        status: status || "Draft", includePaymentTerms, includeWeatherDisclaimer,
        includeScopeDisclaimer, includeDepositNote, includeAcceptanceLanguage,
      };
      setQuoteNumber(finalNumber);
      localStorage.setItem("quotesnapDraft", JSON.stringify(quoteData));
      localStorage.removeItem("quotesnapEditDraft");
      window.location.href = "/preview";
    } catch (error) {
      console.error("Quote save failed:", error);
      alert("Quote could not be saved: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setSavingQuote(false);
    }
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <button onClick={goHome} style={secondaryButton}>
          Home
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            border: "1px solid #e7e5e4",
            boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            padding: "28px 22px 24px",
          }}
        >
          <h1 style={{ fontSize: "34px", marginBottom: "24px", color: "#1c1917" }}>
            New Quote
          </h1>

          <div style={fieldGroup}>
            <label style={labelStyle}>Client Name</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Project Address</label>
            <input value={projectAddress} onChange={(e) => setProjectAddress(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Contact Info</label>
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} style={inputStyle} />
          </div>

          <div style={twoColumn}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Quote Number</label>
              <input value={quoteNumber} readOnly placeholder="Assigned when saved" style={{ ...inputStyle, background: "#f5f5f4" }} />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Quote Date</label>
              <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Project Total</label>
            <input value={projectTotal} onChange={(e) => setProjectTotal(e.target.value)} style={inputStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Estimated Start Window</label>
            <input value={startWindow} onChange={(e) => setStartWindow(e.target.value)} style={inputStyle} />
          </div>

          <section style={{ background: "#111827", color: "#ffffff", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ color: "#fb923c", fontWeight: 800, letterSpacing: "1px", fontSize: "13px" }}>D.I.R.T. • DRAFT BUILDER</div>
            <h2 style={{ margin: "8px 0" }}>Job Notes → Internal Analysis + Customer Scope</h2>
            <p style={{ color: "#d1d5db", lineHeight: 1.5, marginTop: 0 }}>
              Describe the job in your own words. Use quick local rules or the real AI engine. Internal measurements and questions stay out of the customer-facing quote. Neither mode sets a selling price.
            </p>
            <textarea aria-label="D.I.R.T. job notes" value={dirtNotes} onChange={(e) => { setDirtNotes(e.target.value); setDirtMessage(""); }}
              placeholder="Example: 400 ft x 10 ft driveway, power rake, 2 inches DGA, compact with roller. Good access."
              rows={5} style={{ ...textareaStyle, minHeight: "130px", background: "#ffffff", color: "#111827" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px", marginTop: "12px" }}>
              <button type="button" disabled={dirtBusy} onClick={() => {
                if (!dirtNotes.trim()) { setDirtMessage("Enter job notes first."); return; }
                setDirtResult(buildDirtDraft(dirtNotes)); setDirtMode("local"); setDirtMessage("Local analysis ready. Internal notes are separate from the quote scope.");
              }} style={{ ...primaryButton, background: "#374151", opacity: dirtBusy ? 0.5 : 1 }}>Quick Local Analysis</button>
              <button type="button" disabled={dirtBusy} onClick={analyzeWithAI} style={{ ...primaryButton, opacity: dirtBusy ? 0.5 : 1 }}>
                {dirtBusy ? "D.I.R.T. is analyzing..." : "Analyze with D.I.R.T. AI"}
              </button>
            </div>
            <DirtTalk
  notes={dirtNotes}
  draft={dirtResult}
  onProposedRevision={(result, revisedNotes) => {
    setDirtNotes(revisedNotes);
    setDirtResult(result);
    setDirtMode("ai");
    setDirtMessage(
      "Conversation revision approved for review. Use This Draft in Scope of Work when ready."
    );
  }}
/>
            {dirtMessage && <p role="status" style={{ color: "#fdba74" }}>{dirtMessage}</p>}
            {dirtResult && <div style={{ background: "#ffffff", color: "#111827", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
              <strong>Internal estimating notes ({dirtMode === "ai" ? "AI" : "local"}) • NOT included in quote</strong>
              <ul>{dirtResult.observations.length ? dirtResult.observations.map((item, i) => <li key={i}>{item}</li>) : <li>No quantities calculated. Check your measurements.</li>}</ul>
              <strong>Questions and checks • NOT included in quote</strong>
              <ul>{dirtResult.questions.map((item, i) => <li key={i}>{item}</li>)}</ul>
              <strong>Customer-facing scope • copied to quote only when you approve</strong>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.5, border: "1px solid #e5e7eb", padding: "12px", borderRadius: "8px" }}>{dirtResult.scope}</pre>
              <button type="button" style={primaryButton} onClick={() => {
                if (scopeOfWork.trim() && !window.confirm("Replace the current Scope of Work with this D.I.R.T. draft?")) return;
                setScopeOfWork(dirtResult.scope);
                setDirtMessage("Customer-facing scope copied below. Internal notes and questions were NOT copied. Review before previewing your quote.");
              }}>Use This Draft in Scope of Work</button>
            </div>}
          </section>

          <div style={fieldGroup}>
            <label style={labelStyle}>Scope of Work</label>
            <textarea value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} rows={10} style={textareaStyle} />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Project Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          {bannerImage && (
            <img
              src={bannerImage}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: "260px",
                objectFit: "cover",
                borderRadius: "14px",
                marginBottom: "20px",
                border: "1px solid #e7e5e4",
              }}
            />
          )}

          <div
            style={{
              marginTop: "24px",
              background: "#fafaf9",
              border: "1px solid #e7e5e4",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "16px",
                color: "#1c1917",
              }}
            >
              Quote Terms & Notes
            </div>

            <label style={toggleStyle}>
              <input type="checkbox" checked={includePaymentTerms} onChange={(e) => setIncludePaymentTerms(e.target.checked)} />
              Include Payment Terms
            </label>

            <label style={toggleStyle}>
              <input type="checkbox" checked={includeWeatherDisclaimer} onChange={(e) => setIncludeWeatherDisclaimer(e.target.checked)} />
              Include Weather / Schedule Disclaimer
            </label>

            <label style={toggleStyle}>
              <input type="checkbox" checked={includeScopeDisclaimer} onChange={(e) => setIncludeScopeDisclaimer(e.target.checked)} />
              Include Scope Boundary Disclaimer
            </label>

            <label style={toggleStyle}>
              <input type="checkbox" checked={includeDepositNote} onChange={(e) => setIncludeDepositNote(e.target.checked)} />
              Include Deposit Required Note
            </label>

            <label style={toggleStyle}>
              <input type="checkbox" checked={includeAcceptanceLanguage} onChange={(e) => setIncludeAcceptanceLanguage(e.target.checked)} />
              Include Acceptance Language
            </label>
          </div>

          <button
            type="button"
            onClick={saveQuote}
            disabled={savingQuote}
            style={{
              ...primaryButton,
              marginTop: "26px",
            }}
          >
            {savingQuote ? "Saving Quote..." : "Preview Quote"}
          </button>
        </div>
      </div>
    </main>
  );
}

const fieldGroup = {
  marginBottom: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "bold" as const,
  color: "#292524",
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #d6d3d1",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "220px",
  resize: "vertical" as const,
};

const twoColumn = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const primaryButton = {
  width: "100%",
  padding: "16px",
  borderRadius: "12px",
  border: "none",
  background: "#f97316",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const secondaryButton = {
  marginBottom: "20px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d6d3d1",
  background: "#ffffff",
  color: "#1c1917",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const toggleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "12px",
  fontSize: "15px",
  color: "#292524",
};
