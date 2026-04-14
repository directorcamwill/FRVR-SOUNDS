"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Landmark,
  Music,
  Globe,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  Phone,
  Mail,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { BusinessSetup } from "@/types/business-setup";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldKey = keyof BusinessSetup;

interface VaultFieldProps {
  label: string;
  field: FieldKey;
  value: string | null | undefined;
  onChange: (field: string, value: unknown) => void;
  type?: "text" | "date" | "url" | "email" | "phone" | "social" | "textarea";
  placeholder?: string;
  saving: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskEin(ein: string | null | undefined): string {
  if (!ein) return "";
  if (ein.length < 4) return ein;
  return "XX-XXX" + ein.slice(-4);
}

function computeVaultCompletion(setup: BusinessSetup): number {
  const vaultFields: FieldKey[] = [
    "llc_name",
    "llc_state",
    "llc_filing_date",
    "llc_service",
    "llc_registered_agent",
    "ein_number",
    "bank_name",
    "bank_account_type",
    "pro_name",
    "pro_member_id",
    "publisher_name",
    "publisher_ipi",
    "admin_publisher_name",
    "admin_publisher_id",
    "distributor_name",
    "distributor_account_id",
    "website_url",
    "epk_url",
    "business_email",
    "business_phone",
    "social_instagram",
    "social_tiktok",
    "social_youtube",
    "social_spotify",
    "social_apple_music",
  ];
  const filled = vaultFields.filter((f) => {
    const v = setup[f];
    return v !== null && v !== undefined && v !== "" && v !== false;
  }).length;
  return Math.round((filled / vaultFields.length) * 100);
}

// ---------------------------------------------------------------------------
// Reusable Field Component
// ---------------------------------------------------------------------------

function VaultField({
  label,
  field,
  value,
  onChange,
  type = "text",
  placeholder,
  saving,
}: VaultFieldProps) {
  const [showEin, setShowEin] = useState(false);
  const isEin = field === "ein_number";
  const isUrl = type === "url";
  const isSocial = type === "social";
  const isTextarea = type === "textarea";
  const isSaving = saving === field;
  const displayValue = value ?? "";

  const handleChange = (raw: string) => {
    let v = raw;
    if (isSocial && v && !v.startsWith("@")) {
      v = "@" + v;
    }
    onChange(field, v || null);
  };

  if (isTextarea) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#777] flex items-center gap-1.5">
          {label}
          {isSaving && <Loader2 className="size-3 animate-spin text-[#DC2626]" />}
        </label>
        <Textarea
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
          className="min-h-[80px] bg-[#111] border-[#222] text-white placeholder:text-[#444] focus:border-[#DC2626]/50 resize-none"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#777] flex items-center gap-1.5">
        {label}
        {isSaving && <Loader2 className="size-3 animate-spin text-[#DC2626]" />}
      </label>
      <div className="relative flex items-center gap-2">
        <Input
          type={isEin && !showEin ? "text" : type === "date" ? "date" : "text"}
          value={isEin && !showEin ? maskEin(displayValue) : displayValue}
          onChange={(e) => {
            if (isEin && !showEin) return; // don't allow editing masked view
            handleChange(e.target.value);
          }}
          readOnly={isEin && !showEin}
          placeholder={placeholder ?? `Add ${label.toLowerCase()}...`}
          className={cn(
            "bg-[#111] border-[#222] text-white placeholder:text-[#444] focus:border-[#DC2626]/50",
            isEin && !showEin && "cursor-pointer"
          )}
        />
        {isEin && (
          <button
            type="button"
            onClick={() => setShowEin(!showEin)}
            className="absolute right-2 text-[#555] hover:text-white transition-colors"
          >
            {showEin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
        {isUrl && displayValue && (
          <a
            href={displayValue.startsWith("http") ? displayValue : `https://${displayValue}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 text-[#555] hover:text-[#DC2626] transition-colors"
          >
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Wrapper
// ---------------------------------------------------------------------------

function VaultSection({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-[#0D0D0D] border-[#1A1A1A]">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
              <Icon className="size-4 text-[#DC2626]" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          {badge}
        </div>
        <Separator className="bg-[#1A1A1A]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BusinessVaultPage() {
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/business-setup");
      if (res.ok) {
        const result = await res.json();
        if (result?.setup) setSetup(result.setup);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      if (!setup) return;

      // Optimistic update
      setSetup((prev) => {
        if (!prev) return prev;
        return { ...prev, [field]: value };
      });

      // Debounced save per field
      if (debounceRef.current[field]) clearTimeout(debounceRef.current[field]);
      setSaving(field);

      debounceRef.current[field] = setTimeout(async () => {
        try {
          const res = await fetch("/api/business-setup", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          });
          if (res.ok) {
            setSaving((prev) => (prev === field ? null : prev));
            // Brief "saved" flash handled by clearing saving state
          } else {
            fetchData();
          }
        } catch {
          fetchData();
        }
      }, 1500);
    },
    [setup, fetchData]
  );

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-[#0D0D0D] border-[#1A1A1A]">
            <CardContent className="py-5 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-px w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="size-12 text-[#333] mb-4" />
        <h3 className="text-lg font-medium text-white mb-1">
          No business setup found
        </h3>
        <p className="text-sm text-[#A3A3A3] mb-4">
          Complete your business setup first to access the vault.
        </p>
        <Link
          href="/business"
          className="text-sm text-[#DC2626] hover:underline"
        >
          Go to Business Setup
        </Link>
      </div>
    );
  }

  const completion = computeVaultCompletion(setup);

  const llcActive =
    setup.llc_status === "completed" && setup.llc_name;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/business"
            className="size-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center hover:bg-[#252525] transition-colors"
          >
            <ArrowLeft className="size-4 text-[#A3A3A3]" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="size-5 text-[#DC2626]" />
              Business Vault
            </h2>
            <p className="text-xs text-[#777]">
              Your secure business information hub
            </p>
          </div>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-[#DC2626]">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </div>
        )}
        {!saving && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="size-3" />
            All saved
          </div>
        )}
      </div>

      {/* Completion Bar */}
      <Card className="bg-[#0D0D0D] border-[#1A1A1A]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#777]">
              Vault Completion
            </span>
            <span className="text-sm font-bold text-white tabular-nums">
              {completion}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#1A1A1A]">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completion >= 70
                  ? "bg-emerald-400"
                  : completion >= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
              )}
              style={{ width: `${completion}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 1. Business Entity */}
      <VaultSection
        icon={Building2}
        title="Business Entity"
        badge={
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              llcActive
                ? "border-emerald-500/30 text-emerald-400"
                : "border-[#333] text-[#555]"
            )}
          >
            {llcActive ? "Active" : "Not Set Up"}
          </Badge>
        }
      >
        <VaultField
          label="LLC Name"
          field="llc_name"
          value={setup.llc_name}
          onChange={handleFieldChange}
          placeholder="e.g. Nite Room Music LLC"
          saving={saving}
        />
        <VaultField
          label="Formation State"
          field="llc_formation_state"
          value={setup.llc_formation_state ?? setup.llc_state}
          onChange={handleFieldChange}
          placeholder="e.g. Wyoming"
          saving={saving}
        />
        <VaultField
          label="Filing Date"
          field="llc_filing_date"
          value={setup.llc_filing_date}
          onChange={handleFieldChange}
          type="date"
          saving={saving}
        />
        <VaultField
          label="Formation Service"
          field="llc_service"
          value={setup.llc_service}
          onChange={handleFieldChange}
          placeholder="e.g. ZenBusiness"
          saving={saving}
        />
        <VaultField
          label="Registered Agent"
          field="llc_registered_agent"
          value={setup.llc_registered_agent}
          onChange={handleFieldChange}
          placeholder="e.g. Northwest Registered Agent"
          saving={saving}
        />
        <VaultField
          label="EIN Number"
          field="ein_number"
          value={setup.ein_number}
          onChange={handleFieldChange}
          placeholder="XX-XXXXXXX"
          saving={saving}
        />
      </VaultSection>

      {/* 2. Banking */}
      <VaultSection
        icon={Landmark}
        title="Banking"
        badge={
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              setup.business_bank_account
                ? "border-emerald-500/30 text-emerald-400"
                : "border-[#333] text-[#555]"
            )}
          >
            {setup.business_bank_account ? "Set Up" : "Not Set Up"}
          </Badge>
        }
      >
        <VaultField
          label="Bank Name"
          field="bank_name"
          value={setup.bank_name}
          onChange={handleFieldChange}
          placeholder="e.g. Chase, Mercury"
          saving={saving}
        />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#777]">
            Account Type
          </label>
          <Select
            value={setup.bank_account_type ?? ""}
            onValueChange={(v) => handleFieldChange("bank_account_type", v)}
          >
            <SelectTrigger className="bg-[#111] border-[#222] text-white">
              <SelectValue placeholder="Select account type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="business_checking">Business Checking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </VaultSection>

      {/* 3. Royalties & Publishing */}
      <VaultSection icon={Music} title="Royalties & Publishing">
        <VaultField
          label="PRO"
          field="pro_name"
          value={setup.pro_name}
          onChange={handleFieldChange}
          placeholder="ASCAP / BMI / SESAC"
          saving={saving}
        />
        <VaultField
          label="PRO Member ID"
          field="pro_member_id"
          value={setup.pro_member_id}
          onChange={handleFieldChange}
          placeholder="Add member ID..."
          saving={saving}
        />
        <VaultField
          label="Publisher Name"
          field="publisher_name"
          value={setup.publisher_name}
          onChange={handleFieldChange}
          placeholder="Add publisher name..."
          saving={saving}
        />
        <VaultField
          label="Publisher IPI"
          field="publisher_ipi"
          value={setup.publisher_ipi}
          onChange={handleFieldChange}
          placeholder="Add IPI number..."
          saving={saving}
        />
        <VaultField
          label="Admin Publisher"
          field="admin_publisher_name"
          value={setup.admin_publisher_name ?? setup.admin_company}
          onChange={handleFieldChange}
          placeholder="e.g. Songtrust, TuneCore Publishing"
          saving={saving}
        />
        <VaultField
          label="Admin Publisher ID"
          field="admin_publisher_id"
          value={setup.admin_publisher_id}
          onChange={handleFieldChange}
          placeholder="Add admin publisher ID..."
          saving={saving}
        />
      </VaultSection>

      {/* 4. Distribution */}
      <VaultSection
        icon={Send}
        title="Distribution"
        badge={
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              setup.distribution_setup
                ? "border-emerald-500/30 text-emerald-400"
                : "border-[#333] text-[#555]"
            )}
          >
            {setup.distribution_setup ? "Active" : "Not Set Up"}
          </Badge>
        }
      >
        <VaultField
          label="Distributor"
          field="distributor_name"
          value={setup.distributor_name}
          onChange={handleFieldChange}
          placeholder="e.g. DistroKid, TuneCore"
          saving={saving}
        />
        <VaultField
          label="Account ID"
          field="distributor_account_id"
          value={setup.distributor_account_id}
          onChange={handleFieldChange}
          placeholder="Add account ID..."
          saving={saving}
        />
      </VaultSection>

      {/* 5. Online Presence */}
      <VaultSection icon={Globe} title="Online Presence">
        <VaultField
          label="Website"
          field="website_url"
          value={setup.website_url}
          onChange={handleFieldChange}
          type="url"
          placeholder="https://yoursite.com"
          saving={saving}
        />
        <VaultField
          label="EPK"
          field="epk_url"
          value={setup.epk_url}
          onChange={handleFieldChange}
          type="url"
          placeholder="https://epk.link/artist"
          saving={saving}
        />
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-[#555] shrink-0" />
          <div className="flex-1">
            <VaultField
              label="Business Email"
              field="business_email"
              value={setup.business_email}
              onChange={handleFieldChange}
              type="email"
              placeholder="business@example.com"
              saving={saving}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 text-[#555] shrink-0" />
          <div className="flex-1">
            <VaultField
              label="Business Phone"
              field="business_phone"
              value={setup.business_phone}
              onChange={handleFieldChange}
              type="phone"
              placeholder="(555) 123-4567"
              saving={saving}
            />
          </div>
        </div>
        <Separator className="col-span-full bg-[#1A1A1A]" />
        <VaultField
          label="Instagram"
          field="social_instagram"
          value={setup.social_instagram}
          onChange={handleFieldChange}
          type="social"
          placeholder="@handle"
          saving={saving}
        />
        <VaultField
          label="TikTok"
          field="social_tiktok"
          value={setup.social_tiktok}
          onChange={handleFieldChange}
          type="social"
          placeholder="@handle"
          saving={saving}
        />
        <VaultField
          label="YouTube"
          field="social_youtube"
          value={setup.social_youtube}
          onChange={handleFieldChange}
          type="url"
          placeholder="https://youtube.com/@channel"
          saving={saving}
        />
        <VaultField
          label="Spotify"
          field="social_spotify"
          value={setup.social_spotify}
          onChange={handleFieldChange}
          type="url"
          placeholder="https://open.spotify.com/artist/..."
          saving={saving}
        />
        <VaultField
          label="Apple Music"
          field="social_apple_music"
          value={setup.social_apple_music}
          onChange={handleFieldChange}
          type="url"
          placeholder="https://music.apple.com/artist/..."
          saving={saving}
        />
      </VaultSection>

      {/* 6. Notes */}
      <VaultSection icon={Shield} title="Notes">
        <div className="col-span-full">
          <VaultField
            label="Additional Notes"
            field="notes"
            value={setup.notes}
            onChange={handleFieldChange}
            type="textarea"
            placeholder="Any additional business notes, passwords hints, important dates, etc."
            saving={saving}
          />
        </div>
      </VaultSection>
    </div>
  );
}
