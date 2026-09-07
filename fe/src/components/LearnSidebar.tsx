"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    title: "Solana for EVM Devs",
    href: "/learn/solana",
    items: [
      { id: "account-model", label: "Account Model" },
      { id: "programs", label: "Programs" },
      { id: "spl-tokens", label: "SPL Tokens" },
      { id: "pdas", label: "PDAs" },
      { id: "rent", label: "Rent" },
      { id: "transactions", label: "Transactions" },
      { id: "cpi", label: "CPI" },
    ],
  },
  {
    title: "Stellar for EVM Devs",
    href: "/learn/stellar",
    items: [
      { id: "account-model", label: "Account Model" },
      { id: "soroban", label: "Soroban Contracts" },
      { id: "assets-tokens", label: "Assets vs Tokens" },
      { id: "sac", label: "Stellar Asset Contract" },
      { id: "ledger-entries", label: "Ledger Entries" },
      { id: "fees", label: "Fee Model" },
      { id: "trustlines", label: "Trustlines" },
    ],
  },
];

export function LearnSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6" aria-label="Learn navigation">
      {sections.map((section) => {
        const isActive = pathname === section.href;
        return (
          <div key={section.href}>
            <Link
              href={section.href}
              className={`block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              }`}
            >
              {section.title}
            </Link>
            <ul className="mt-2 flex flex-col gap-0.5 border-l border-border pl-3">
              {section.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${section.href}#${item.id}`}
                    className="block rounded px-2 py-1 text-xs text-text-tertiary transition-colors hover:text-text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
