"use client";

import { useEscrowStore } from "@/features/escrow/escrow-store";
import { ActivityEvent } from "./ActivityEvent";

const MAX_EVENTS = 50;

export function ActivityFeed() {
  const events = useEscrowStore((s) => s.events);

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-1 p-6 text-center shadow-1">
        <p className="text-sm text-text-tertiary">
          No activity yet
        </p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const displayed = sorted.slice(0, MAX_EVENTS);

  return (
    <div className="space-y-2">
      {displayed.map((event) => (
        <ActivityEvent key={`${event.chainId}:${event.id}`} event={event} />
      ))}
    </div>
  );
}
