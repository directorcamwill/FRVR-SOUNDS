"use client";

import { useSubmissions } from "@/lib/hooks/use-submissions";
import { SubmissionForm } from "@/components/submissions/submission-form";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";

export default function SubmissionsPage() {
  const { submissions, loading, refetch } = useSubmissions();

  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(
      (s) => s.status === "submitted" || s.status === "under_review"
    ).length;
    const won = submissions.filter((s) => s.status === "selected").length;
    const rejected = submissions.filter((s) => s.status === "rejected").length;
    return { total, pending, won, rejected };
  }, [submissions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Submissions</h2>
          <p className="text-sm text-[#A3A3A3]">
            Track all your sync licensing submissions and their status
          </p>
        </div>
        <SubmissionForm onSuccess={refetch} />
      </div>

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} color="text-white" />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="text-amber-400"
          />
          <StatCard label="Won" value={stats.won} color="text-emerald-400" />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            color="text-red-400"
          />
        </div>
      )}

      <SubmissionTable
        submissions={submissions}
        loading={loading}
        onRefresh={refetch}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-[#A3A3A3] uppercase tracking-wider">
          {label}
        </p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
