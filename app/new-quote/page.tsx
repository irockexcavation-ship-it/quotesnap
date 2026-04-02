"use client";

import { useEffect, useRef, useState } from "react";

type SavedClient = {
  name: string;
  address: string;
  contact: string;
};

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
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setQuoteDate(new Date().toISOString().slice(0, 10));
    setQuoteNumber(generateQuoteNumber());
    loadSavedClients();
  }, []);

  function loadSavedClients() {
    const quotes = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    const map = new Map<string, SavedClient>();

    for (const q of quotes) {
      const name = (q.clientName || "").trim();
      if (!name) continue;

      if (!map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), {
          name,
          address: q.projectAddress || "",
          contact: q.contactInfo || "",
        });
      }
    }

    setSavedClients(Array.from(map.values()));
  }

  function generateQuoteNumber() {
    const year = new Date().getFullYear();

    const quotes = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    const count = quotes.filter((q: any) =>
      (q.quoteNumber || "").startsWith(`IR-${year}-`)
    ).length;

    return `IR-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  function resizeImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 1400;

          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = await resizeImage(file);
    setBannerImage(img);
  }

  function formatCurrencyInput(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(digits));
  }

  function handlePreview() {
    const quote = {
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
      status: "Draft",
    };

    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));

    const existing = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    existing.unshift(quote);

    localStorage.setItem("quotesnapActiveQuotes", JSON.stringify(existing));

    window.location.href = "/preview";
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main style={{ padding: 20 }}>
      <button onClick={goHome}>Home</button>

      <h1>New Quote</h1>

      <button onClick={() => cameraInputRef.current?.click()}>
        Take Photo
      </button>

      <button onClick={() => galleryInputRef.current?.click()}>
        Upload Photo
      </button>

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

      {bannerImage && (
        <img
          src={bannerImage}
          style={{ width: "100%", maxHeight: 200, objectFit: "cover" }}
        />
      )}

      <input
        placeholder="Client Name"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />

      <input
        placeholder="Address"
        value={projectAddress}
        onChange={(e) => setProjectAddress(e.target.value)}
      />

      <input
        placeholder="Contact"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
      />

      <input
        type="date"
        value={quoteDate}
        onChange={(e) => setQuoteDate(e.target.value)}
      />

      <input
        placeholder="Total"
        value={projectTotal}
        onChange={(e) =>
          setProjectTotal(formatCurrencyInput(e.target.value))
        }
      />

      <textarea
        placeholder="Scope"
        value={scopeOfWork}
        onChange={(e) => setScopeOfWork(e.target.value)}
      />

      <button onClick={handlePreview}>Preview Quote</button>
    </main>
  );
}