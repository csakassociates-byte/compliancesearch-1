"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function OnlinePing() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    const ping = () => fetch("/api/ping", { method: "POST" });
    ping(); // ping immediately on mount

    const interval = setInterval(ping, 60_000); // every 60 seconds
    return () => clearInterval(interval);
  }, [session]);

  return null;
}
