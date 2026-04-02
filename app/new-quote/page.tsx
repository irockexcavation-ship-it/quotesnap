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

    loadSavedClients();
  }, []);

  function loadSavedClients() {
    const quotes = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    const clientMap = new Map<string, SavedClient>();

    for (const quote of quotes) {
      const name = String(quote.clientName || "").trim();
      if (!name) continue;

      if (!clientMap.has(name.toLowerCase())) {
        clientMap.set(name.toLowerCase(), {
          name,
          address: String(quote.projectAddress || ""),
          contact: String(quote.contactInfo || ""),
        });
      }
    }

    setSavedClients(Array.from(clientMap.values()));
  }

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }

  function generateQuoteNumber() {
    const year = new Date().getFullYear();

    const existingQuotes = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
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
          if (!ctx) return reject();

          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await resizeImage(file);
      setBannerImage(img);
    } catch {
      alert("Image failed.");
    }
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
      status: "Draft",
    };

    localStorage.setItem("quotesnapDraft", JSON.stringify(quoteData));

    const existing = JSON.parse(
      localStorage.getItem("quotesnapActiveQuotes") || "[]"
    );

    existing.unshift(quoteData);

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
        onChange={(e) => setProjectTotal(formatCurrencyInput(e.target.value))}
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