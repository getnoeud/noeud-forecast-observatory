"use client";

import { AlertTriangle, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type DataAvailabilityBannerProps = {
  title: string;
  description: string;
  variant?: "warning" | "error";
  action?: {
    label: string;
    onClick: () => void;
  };
};

const styles = {
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  error: "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-100",
} as const;

const icons = {
  warning: AlertTriangle,
  error: CircleAlert,
} as const;

export function DataAvailabilityBanner({
  title,
  description,
  variant = "warning",
  action,
}: DataAvailabilityBannerProps) {
  const Icon = icons[variant];

  return (
    <div
      className={`mx-4 rounded-xl border px-4 py-3 lg:mx-6 ${styles[variant]}`}
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-background/70 p-1">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
        {action ? (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="border-current/30 bg-background/70"
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
