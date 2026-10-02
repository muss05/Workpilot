"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CommitmentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/time-logs");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-xs text-slate-400">
      Redirecting to Jira Time Logs...
    </div>
  );
}
