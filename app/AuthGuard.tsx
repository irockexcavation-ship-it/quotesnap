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
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/q/");

  useEffect(() => {
    if (pathname.startsWith("/q/")) return;

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && pathname === "/login") {
        router.replace("/");
        return;
      }

      if (!session && pathname !== "/login") {
        router.replace("/login");
        return;
      }

      setCheckedPath(pathname);
    }

    checkAuth();
  }, [pathname, router, isPublicRoute]);

  if (!isPublicRoute && checkedPath !== pathname) {
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
