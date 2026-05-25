"use client";

import { useEffect, useState } from "react";

export default function NewQuotePage() {
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [projectTotal, setProjectTotal] = useState("");
  const [startWindow, setStartWindow] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [bannerImage, setBannerImage] = useState("");

  // Terms Toggles
  const [includePaymentTerms, setIncludePaymentTerms] = useState(true);
  const [includeWeatherDisclaimer, setIncludeWeatherDisclaimer] =
    useState(true);
  const [includeScopeDisclaimer, setIncludeScopeDisclaimer] =
    useState(true);
  const [includeDepositNote, setIncludeDepositNote] = useState(false);

  useEffect(() => {
    const savedDraft =
      localStorage.getItem("quotesnapEditDraft");

    if (savedDraft) {
      const draft = JSON.parse(savedDraft);

      setClientName(draft.clientName || "");
      setProjectAddress(draft.projectAddress || "");
      setContactInfo(draft.contactInfo || "");
      setQuoteNumber(draft.quoteNumber || "");
      setQuoteDate(draft.quoteDate || "");
      setProjectTotal(draft.projectTotal || "");
      setStartWindow(draft.startWindow || "");
      setScopeOfWork(draft.scopeOfWork || "");
      setBannerImage(draft.bannerImage || "");

      setIncludePaymentTerms(
        draft.includePaymentTerms ?? true
      );

      setIncludeWeatherDisclaimer(
        draft.includeWeatherDisclaimer ?? true
      );

      setIncludeScopeDisclaimer(
        draft.includeScopeDisclaimer ?? true
      );

      setIncludeDepositNote(
        draft.includeDepositNote ?? false
      );
    } else {
      setQuoteDate(new Date().toISOString().slice(0, 10));
    }
  }, []);

  function handlePhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;

      setBannerImage(result);

      const link = document.createElement("a");
      link.href = result;
      link.download = `quotesnap-photo-${Date.now()}.jpg`;
      link.click();
    };

    reader.readAsDataURL(file);
  }

  function saveQuote() {
    const quoteData = {
      id: Date.now().toString(),
      clientName,
      projectAddress,
      contactInfo,
      quoteNumber,
      quoteDate,
      projectTotal,
      startWindow,
      scopeOfWork,
      bannerImage,

      includePaymentTerms,
      includeWeatherDisclaimer,
      includeScopeDisclaimer,
      includeDepositNote,
    };

    localStorage.setItem(
      "quotesnapDraft",
      JSON.stringify(quoteData)
    );

    const existingQuotes = JSON.parse(
      localStorage.getItem("quotesnapSavedQuotes") || "[]"
    );

    const existingIndex = existingQuotes.findIndex(
      (q: any) => q.quoteNumber === quoteNumber
    );

    if (existingIndex >= 0) {
      existingQuotes[existingIndex] = quoteData;
    } else {
      existingQuotes.push(quoteData);
    }

    localStorage.setItem(
      "quotesnapSavedQuotes",
      JSON.stringify(existingQuotes)
    );

    localStorage.removeItem("quotesnapEditDraft");

    window.location.href = "/preview";
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f5f5f4 0%, #ede9e7 100%)",
        padding: "24px 18px 40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <button
          onClick={goHome}
          style={secondaryButton}
        >
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
          <h1
            style={{
              fontSize: "34px",
              marginBottom: "24px",
              color: "#1c1917",
            }}
          >
            New Quote
          </h1>

          <div style={fieldGroup}>
            <label style={labelStyle}>Client Name</label>
            <input
              value={clientName}
              onChange={(e) =>
                setClientName(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>
              Project Address
            </label>
            <input
              value={projectAddress}
              onChange={(e) =>
                setProjectAddress(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Contact Info</label>
            <input
              value={contactInfo}
              onChange={(e) =>
                setContactInfo(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={twoColumn}>
            <div style={fieldGroup}>
              <label style={labelStyle}>
                Quote Number
              </label>
              <input
                value={quoteNumber}
                onChange={(e) =>
                  setQuoteNumber(e.target.value)
                }
                style={inputStyle}
              />
            </div>

            <div style={fieldGroup}>
              <label style={labelStyle}>Quote Date</label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) =>
                  setQuoteDate(e.target.value)
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>
              Project Total
            </label>
            <input
              value={projectTotal}
              onChange={(e) =>
                setProjectTotal(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>
              Estimated Start Window
            </label>
            <input
              value={startWindow}
              onChange={(e) =>
                setStartWindow(e.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>
              Scope of Work
            </label>

            <textarea
              value={scopeOfWork}
              onChange={(e) =>
                setScopeOfWork(e.target.value)
              }
              rows={10}
              style={textareaStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>
              Project Photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Terms Section */}

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
              <input
                type="checkbox"
                checked={includePaymentTerms}
                onChange={(e) =>
                  setIncludePaymentTerms(
                    e.target.checked
                  )
                }
              />
              Include Payment Terms
            </label>

            <label style={toggleStyle}>
              <input
                type="checkbox"
                checked={includeWeatherDisclaimer}
                onChange={(e) =>
                  setIncludeWeatherDisclaimer(
                    e.target.checked
                  )
                }
              />
              Include Weather / Schedule Disclaimer
            </label>

            <label style={toggleStyle}>
              <input
                type="checkbox"
                checked={includeScopeDisclaimer}
                onChange={(e) =>
                  setIncludeScopeDisclaimer(
                    e.target.checked
                  )
                }
              />
              Include Scope Boundary Disclaimer
            </label>

            <label style={toggleStyle}>
              <input
                type="checkbox"
                checked={includeDepositNote}
                onChange={(e) =>
                  setIncludeDepositNote(
                    e.target.checked
                  )
                }
              />
              Include Deposit Required Note
            </label>
          </div>

          <button
            onClick={saveQuote}
            style={{
              ...primaryButton,
              marginTop: "26px",
            }}
          >
            Preview Quote
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