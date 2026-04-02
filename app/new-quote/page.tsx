"use client";

import { useEffect, useState } from "react";

export default function NewQuotePage() {
  const [clientName, setClientName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [projectTotal, setProjectTotal] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");

  useEffect(() => {
    setQuoteDate(new Date().toISOString().slice(0, 10));
  }, []);

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
      clientName,
      projectAddress,
      contactInfo,
      quoteDate,
      projectTotal,
      scopeOfWork,
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