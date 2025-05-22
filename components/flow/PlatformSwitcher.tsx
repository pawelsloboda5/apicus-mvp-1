"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PlatformSwitcherProps, PlatformType } from "@/lib/types";

const PLATFORMS: PlatformType[] = ["zapier", "make", "n8n"];

export function PlatformSwitcher({ value, onChange }: PlatformSwitcherProps) {
  return (
    <div className="inline-flex gap-1 rounded-md border p-1 bg-muted">
      {PLATFORMS.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === value ? "default" : "ghost"}
          className={cn("capitalize", p === value && "shadow")}
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
    </div>
  );
} 