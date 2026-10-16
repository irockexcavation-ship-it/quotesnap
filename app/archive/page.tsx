"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
type QuoteStatus =
  | "Draft"
  | "Sent"
  | "Approved"
  | "Completed"
  | "Archived";

type PaymentStatus = "Paid" | "Unpaid";

type QuoteItem = {
  id: string;
  quoteNumber?: string;
  clientName?: string;
  projectAddress?: string;
  contactInfo?: string;
  quoteDate?: string;
  projectTotal?: string;
  startWindow?: string;
  scopeOfWork?: string;
  bannerImage?: string;
  status?: QuoteStatus;
  paymentStatus?: PaymentStatus;
  archivedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  archiveReason?: string;
  trashedAt?: string | null;
  preTrashStatus?: string | null;
};

export default function ArchivePage() {
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"archive" | "trash">("archive");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    void loadArchivedQuotes();
  }, []);

  async function loadArchivedQuotes() {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("status", "Archived")
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Failed to load archived quotes:", error);
      setErrorMessage("Unable to load Archive and Trash. Please refresh and try again.");
      return;
    }

    setErrorMessage("");
    setQuotes((data || []).map((q) => ({
      id: q.id,
      status: q.status,
      clientName: q.client_name,
      quoteNumber: q.quote_number,
      projectAddress: q.project_address,
      contactInfo: q.contact_info,
      quoteDate: q.quote_date,
      projectTotal: q.project_total,
      bannerImage: q.banner_image_url,
      paymentStatus: q.payment_status,
      archivedAt: q.archived_at,
      completedAt: q.completed_at,
      approvedAt: q.approved_at,
      archiveReason: q.archive_reason,
      trashedAt: q.trashed_at,
      preTrashStatus: q.pre_trash_status,
    })));
  }

  function goHome() {
    window.location.href = "/";
  }

  function goQuotes() {
    window.location.href = "/quotes";
  }

  function goCurrentJobs() {
    window.location.href = "/current-jobs";
  }

  function openQuote(quote: QuoteItem) {
    localStorage.setItem("quotesnapDraft", JSON.stringify(quote));
    window.location.href = "/preview";
  }
