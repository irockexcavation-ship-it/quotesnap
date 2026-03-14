"use client";

import { useEffect, useRef, useState } from "react";

export default function NewQuotePage() {
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [projectTotal, setProjectTotal] = useState("");
  const [startWindow, setStartWindow] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [bannerImage, setBannerImage] = useState("");

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const editData = localStorage.getItem("quotesnapEditDraft");

    if (editData) {
      const parsed = JSON.parse(editData);

      setClientName(parsed.clientName || "");
      setProjectAddress(parsed.projectAddress || "");
      setContactInfo(parsed.contactInfo || "");
      setQuoteDate(parsed.quoteDate || getTodayDate());
      setQuoteNumber(parsed.quoteNumber || generateQuoteNumber());
      setProjectTotal(parsed.projectTotal || "");
      setStartWindow(parsed.startWindow || "");
      setScopeOfWork(parsed.scopeOfWork || "");
      setBannerImage(parsed.bannerImage || "");

      localStorage.removeItem("quotesnapEditDraft");
    } else {
      setQuoteDate(getTodayDate());
      setQuoteNumber(generateQuoteNumber());
    }
  }, []);

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function generateQuoteNumber() {
    const today = new Date();
    const year = today.getFullYear();

    const existingQuotes = JSON.parse(
      localStorage.getItem("quotesnapSavedQuotes") || "[]"
    );

    const currentYearQuotes = existingQuotes.filter((q: any) =>
      String(q.quoteNumber || "").startsWith(`IR-${year}-`)
    );

    const nextNumber = currentYearQuotes.length + 1;

    return `IR-${year}-${String(nextNumber).padStart(3, "0")}`;
  }

  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const maxWidth = 1400;
          const maxHeight = 900;

          let { width, height } = img;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not create canvas context."));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.72);
          resolve(compressed);
        };

        img.onerror = () => reject(new Error("Could not load image."));
        img.src = reader.result as string;
      };

      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressedImage = await resizeImage(file);
      setBannerImage(compressedImage);
    } catch (error) {
      alert("That image could not be processed.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  }

  function formatCurrencyInput(value: string) {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) return "";

    const numberValue = Number(digitsOnly);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(numberValue);
  }

  function handleProjectTotalChange(value: string) {
    const formatted = formatCurrencyInput(value);
    setProjectTotal(formatted);
  }

  function handlePreview() {
    const quoteData = {
      id: Date.now().toString(),
      quoteNumber,
      clientName,
      projectAddress,
      contactInfo,
      quoteDate,
      projectTotal,
      startWindow,
      scopeOfWork,
      bannerImage,
    };

    try {
      localStorage.setItem("quotesnapDraft", JSON.stringify(quoteData));
    } catch (error) {
      alert(
        "This quote is too large to save in the browser. Try a smaller photo."
      );
      return;
    }

    const existingQuotes =
      JSON.parse(localStorage.getItem("quotesnapSavedQuotes") || "[]");

    const quoteSummary = {
      id: quoteData.id,
      quoteNumber: quoteData.quoteNumber,
      clientName: quoteData.clientName,
      projectAddress: quoteData.projectAddress,
      contactInfo: quoteData.contactInfo,
      quoteDate: quoteData.quoteDate,
      projectTotal: quoteData.projectTotal,
      startWindow: quoteData.startWindow,
      scopeOfWork: quoteData.scopeOfWork,
      bannerImage: quoteData.bannerImage,
    };

    const updatedQuotes = [quoteSummary, ...existingQuotes];

    localStorage.setItem(
      "quotesnapSavedQuotes",
      JSON.stringify(updatedQuotes)
    );

    window.location.href = "/preview";
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f5f4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "24px 20px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <button
            type="button"
            onClick={goHome}
            style={topButton("#e7e5e4", "#1c1917")}
          >
            Home
          </button>
        </div>

        <h1
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          New Quote
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#555",
            marginBottom: "30px",
          }}
        >
          Enter the project details below to start building a quote.
        </p>

        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Banner Photo
              </label>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={topButton("#1c1917", "#ffffff")}
                >
                  Take Job Photo
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  style={topButton("#57534e", "#ffffff")}
                >
                  Choose Existing Photo
                </button>
              </div>

              {bannerImage && (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={bannerImage}
                    alt="Banner preview"
                    style={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      border: "1px solid #d6d3d1",
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: "#fafaf9",
                border: "1px solid #e7e5e4",
                borderRadius: "10px",
                color: "#44403c",
                fontSize: "14px",
              }}
            >
              Company COI will be attached automatically from <strong>/public/coi.pdf</strong>.
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Quote Number
              </label>
              <input
                type="text"
                value={quoteNumber}
                readOnly
                style={{
                  ...inputStyle,
                  background: "#fafaf9",
                  color: "#57534e",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Client Name
              </label>
              <input
                type="text"
                placeholder="John Smith"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Project Address
              </label>
              <input
                type="text"
                placeholder="123 Gravel Rd, New Castle, KY"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Phone / Email
              </label>
              <input
                type="text"
                placeholder="(555) 555-5555 / john@email.com"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Project Total
              </label>
              <input
                type="text"
                placeholder="$4,800"
                value={projectTotal}
                onChange={(e) => handleProjectTotalChange(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Estimated Start Window
              </label>
              <input
                type="text"
                placeholder="2–3 weeks after approval"
                value={startWindow}
                onChange={(e) => setStartWindow(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "bold",
                }}
              >
                Scope of Work
              </label>
              <textarea
                placeholder="• Power rake existing gravel driveway surface&#10;• Add and spread 20 tons of DGA&#10;• Compact with vibratory roller"
                rows={8}
                value={scopeOfWork}
                onChange={(e) => setScopeOfWork(e.target.value)}
                style={textAreaStyle}
              />
            </div>

            <button
              type="button"
              onClick={handlePreview}
              style={{
                background: "#1c1917",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "14px 18px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Preview Quote
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function topButton(background: string, color: string) {
  return {
    padding: "12px 18px",
    fontSize: "15px",
    borderRadius: "8px",
    border: "none",
    background,
    color,
    cursor: "pointer",
    fontWeight: "bold" as const,
  };
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d6d3d1",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const textAreaStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d6d3d1",
  fontSize: "16px",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
};