import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-1 p-8 text-center shadow-1"
      data-testid="empty-state"
    >
      {icon && <div className="text-2xl text-text-tertiary">{icon}</div>}
      <div>
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-text-tertiary">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
