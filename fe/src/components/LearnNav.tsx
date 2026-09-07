"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function LearnNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-text-secondary transition-colors hover:text-text-primary"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Learn
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface-1 p-2 shadow-2">
          <Link
            href="/learn/solana"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            Solana for EVM Devs
          </Link>
          <Link
            href="/learn/stellar"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            Stellar for EVM Devs
          </Link>
          <div className="my-1 h-px bg-border" />
          <Link
            href="/how-it-works"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            How It Works
          </Link>
        </div>
      )}
    </div>
  );
}
