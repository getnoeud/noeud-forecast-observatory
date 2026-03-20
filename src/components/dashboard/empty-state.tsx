"use client";

import { motion } from "framer-motion";
import { AlertCircle, Inbox, ServerCrash } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  variant?: "empty" | "error" | "offline";
  action?: { label: string; onClick: () => void };
}

const icons = {
  empty: Inbox,
  error: AlertCircle,
  offline: ServerCrash,
};

export function EmptyState({ title, description, variant = "empty", action }: EmptyStateProps) {
  const Icon = icons[variant];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
          {action && (
            <Button className="mt-4" variant="outline" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
