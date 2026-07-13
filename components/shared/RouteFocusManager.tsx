"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RouteFocusManager({ targetId }: { targetId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.focus({ preventScroll: true });
  }, [pathname, targetId]);

  return null;
}
