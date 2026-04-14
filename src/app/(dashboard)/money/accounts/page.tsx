"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  Building2,
  Radio,
  BookOpen,
  Music2,
  Headphones,
  Share2,
  Wallet,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExternalAccount, AccountCategory, AccountStatus } from "@/types/financial";

const CATEGORY_CONFIG: Record<
  AccountCategory,
  { label: string; icon: React.ReactNode; description: string }
> = {
  distribution: {
    label: "Distribution",
    icon: <Building2 className="size-4" />,
    description: "DistroKid, TuneCore, CD Baby",
  },
  pro: {
    label: "PRO",
    icon: <Radio className="size-4" />,
    description: "ASCAP, BMI, SESAC",
  },
  publishing: {
    label: "Publishing",
    icon: <BookOpen className="size-4" />,
    description: "Songtrust, Sentric, TuneCore Publishing",
  },
  sync_library: {
    label: "Sync Libraries",
    icon: <Music2 className="size-4" />,
    description: "Musicbed, Artlist, Marmoset",
  },
  streaming: {
    label: "Streaming",
    icon: <Headphones className="size-4" />,
    description: "Spotify for Artists, Apple Music, etc.",
  },
  social: {
    label: "Social",
    icon: <Share2 className="size-4" />,
    description: "Instagram, TikTok, YouTube",
  },
  financial: {
    label: "Financial",
    icon: <Wallet className="size-4" />,
    description: "PayPal, Bank accounts, Stripe",
  },
  other: {
    label: "Other",
    icon: <MoreHorizontal className="size-4" />,
    description: "Other platforms and services",
  },
};

const STATUS_STYLES: Record<AccountStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/20 text-emerald-300" },
  inactive: { label: "Inactive", className: "bg-amber-500/20 text-amber-300" },
  missing: { label: "Missing", className: "bg-red-500/20 text-red-300" },
  setup_needed: { label: "Setup Needed", className: "bg-[#DC2626]/20 text-[#DC2626]" },
};

const CATEGORIES: AccountCategory[] = [
  "distribution",
  "pro",
  "publishing",
  "sync_library",
  "streaming",
  "social",
  "financial",
  "other",
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<ExternalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<ExternalAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) setAccounts(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: fd.get("platform"),
          category: fd.get("category"),
          account_email: fd.get("account_email") || null,
          account_id: fd.get("account_id") || null,
          account_url: fd.get("account_url") || null,
          status: fd.get("status") || "active",
          notes: fd.get("notes") || null,
        }),
      });
      setShowAdd(false);
      fetchAccounts();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editAccount) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await fetch(`/api/accounts/${editAccount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: fd.get("platform"),
          category: fd.get("category"),
          account_email: fd.get("account_email") || null,
          account_id: fd.get("account_id") || null,
          account_url: fd.get("account_url") || null,
          status: fd.get("status"),
          notes: fd.get("notes") || null,
        }),
      });
      setEditAccount(null);
      fetchAccounts();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      fetchAccounts();
    } catch {
      // ignore
    }
  }

  const accountsByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    config: CATEGORY_CONFIG[cat],
    accounts: accounts.filter((a) => a.category === cat),
  }));

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 bg-[#1A1A1A]" />
        ))}
      </div>
    );
  }

  function AccountForm({
    onSubmit,
    defaults,
    submitLabel,
  }: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    defaults?: ExternalAccount | null;
    submitLabel: string;
  }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label className="text-[#A3A3A3]">Platform Name</Label>
          <Input name="platform" required defaultValue={defaults?.platform || ""} className="bg-black border-[#1A1A1A] text-white" placeholder="e.g. DistroKid, ASCAP" />
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Category</Label>
          <Select name="category" required defaultValue={defaults?.category || ""}>
            <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Status</Label>
          <Select name="status" defaultValue={defaults?.status || "active"}>
            <SelectTrigger className="bg-black border-[#1A1A1A] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_STYLES) as [AccountStatus, { label: string }][]).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Account Email</Label>
          <Input name="account_email" type="email" defaultValue={defaults?.account_email || ""} className="bg-black border-[#1A1A1A] text-white" />
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Account ID</Label>
          <Input name="account_id" defaultValue={defaults?.account_id || ""} className="bg-black border-[#1A1A1A] text-white" />
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Account URL</Label>
          <Input name="account_url" type="url" defaultValue={defaults?.account_url || ""} className="bg-black border-[#1A1A1A] text-white" placeholder="https://" />
        </div>
        <div>
          <Label className="text-[#A3A3A3]">Notes</Label>
          <Input name="notes" defaultValue={defaults?.notes || ""} className="bg-black border-[#1A1A1A] text-white" />
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white">
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
      </form>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Account Hub</h2>
          <p className="text-sm text-[#A3A3A3]">
            All your music industry accounts in one place
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger render={<Button className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white"><Plus className="size-4 mr-1" /> Add Account</Button>} />
          <DialogContent className="bg-[#111111] border-[#1A1A1A] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Add Account</DialogTitle>
            </DialogHeader>
            <AccountForm onSubmit={handleAdd} submitLabel="Add Account" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories */}
      {accountsByCategory.map(({ category, config, accounts: catAccounts }) => (
        <Card key={category} className="bg-[#111111] border-[#1A1A1A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <span className="text-[#DC2626]">{config.icon}</span>
              {config.label}
              <span className="text-xs text-[#666] font-normal ml-1">
                {config.description}
              </span>
              {catAccounts.length > 0 && (
                <span className="text-xs bg-[#1A1A1A] text-[#A3A3A3] px-2 py-0.5 rounded-full ml-auto">
                  {catAccounts.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {catAccounts.length > 0 ? (
              <div className="space-y-2">
                {catAccounts.map((account) => {
                  const statusStyle = STATUS_STYLES[account.status as AccountStatus] || STATUS_STYLES.active;
                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between bg-black rounded-lg px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{account.platform}</p>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-medium", statusStyle.className)}>
                            {statusStyle.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#A3A3A3]">
                          {account.account_email && <span>{account.account_email}</span>}
                          {account.account_id && <span>ID: {account.account_id}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {account.account_url && (
                          <a
                            href={account.account_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-[#1A1A1A] text-[#A3A3A3] hover:text-white"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditAccount(account)}
                          className="h-7 w-7 p-0 text-[#A3A3A3] hover:text-white"
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(account.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#666] py-2">No accounts added yet</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editAccount} onOpenChange={(open) => !open && setEditAccount(null)}>
        <DialogContent className="bg-[#111111] border-[#1A1A1A] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Account</DialogTitle>
          </DialogHeader>
          <AccountForm onSubmit={handleEdit} defaults={editAccount} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
