"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session && pathname !== "/login") {
        router.replace("/login");
        return;
      }

      if (session && pathname === "/login") {
        router.replace("/");
        return;
      }

      setChecking(false);
    }

    checkAuth();
  }, [pathname, router]);

  if (checking && pathname !== "/login") {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading QuoteSnap...
      </div>
    );
  }

  return <>{children}</>;
}
