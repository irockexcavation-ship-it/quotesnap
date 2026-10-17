"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const [error, setError] = useState("");

  const publicQuote = pathname.startsWith("/q/");
  const guestPage = pathname === "/login" || pathname === "/signup";
  const welcomePage = pathname === "/";

  useEffect(() => {
    let cancelled = false;
    setCheckedPath(null);
    setError("");

    if (publicQuote) {
      setCheckedPath(pathname);
      return () => { cancelled = true; };
    }

    async function checkAccess() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (authError || !user) {
          if (guestPage || welcomePage) {
            setCheckedPath(pathname);
          } else {
            router.replace("/login");
          }
          return;
        }

        const { data: memberships, error: membershipError } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1);

        if (cancelled) return;
        if (membershipError) throw membershipError;

        const hasWorkspace = Boolean(memberships && memberships.length > 0);
        if (!hasWorkspace && pathname !== "/setup") {
          router.replace("/setup");
          return;
        }
        if (hasWorkspace && (guestPage || welcomePage || pathname === "/setup")) {
          router.replace("/dashboard");
          return;
        }

        setCheckedPath(pathname);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to verify account access.");
        }
      }
    }

    void checkAccess();
    return () => { cancelled = true; };
  }, [pathname, router, publicQuote, guestPage, welcomePage]);

  if (error) {
    return (
      <main role="alert" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif", textAlign: "center" }}>
        <div>
          <strong>QuoteSnap couldn't verify your workspace.</strong>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 18px", cursor: "pointer" }}>Try again</button>
        </div>
      </main>
    );
  }

  if (checkedPath !== pathname) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif" }}>
        Loading QuoteSnap...
      </div>
    );
  }

  return <>{children}</>;
}
