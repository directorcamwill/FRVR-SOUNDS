"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Shield } from "lucide-react";
import { LLCDashboard } from "@/components/business/llc-dashboard";
import type { BusinessSetup } from "@/types/business-setup";

export default function LLCPage() {
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSetup = useCallback(async () => {
    try {
      const res = await fetch("/api/business-setup");
      if (res.ok) {
        const result = await res.json();
        if (result?.setup) {
          setSetup(result.setup);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSetup();
  }, [fetchSetup]);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      // Optimistic update
      setSetup((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });

      // Debounced save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch("/api/business-setup", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
        } catch {
          fetchSetup();
        }
      }, 800);
    },
    [fetchSetup]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="size-6 text-[#DC2626]" />
            LLC Setup Guide
          </h2>
          <p className="text-sm text-[#A3A3A3] mt-1">Loading your LLC analysis...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="size-12 text-[#333] mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">
              No business setup found
            </h3>
            <p className="text-sm text-[#A3A3A3]">
              Go to Business Setup first to initialize your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LLCDashboard
      setup={setup}
      onFieldChange={handleFieldChange}
      standalone
    />
  );
}
