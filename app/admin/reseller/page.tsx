"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  FileText,
  Facebook,
  Instagram,
  Twitter,
  Download,
} from "lucide-react";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ResellerStatus = "pending" | "approved" | "rejected";

type ResellerReference = {
  id: number;
  name: string;
  position: string;
  contact: string;
  email: string;
};

type ResellerFile = {
  id: number;
  original_name: string;
  path: string;
  mime_type: string;
  size: number;
};

type Reseller = {
  id: number;
  // Account
  email: string;
  username: string;
  // General information
  address_type: string;
  age: number | null;
  cellphone: string;
  telephone: string | null;
  complete_address: string;
  full_name: string;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  // Data
  tin: string;
  birthday: string | null;
  sss_number: string;
  // Authorized signatories
  signatory_1: string;
  signatory_2: string;
  applicant_name: string;
  position: string;
  // Relations
  references: ResellerReference[];
  files: ResellerFile[];
  // Review state
  status: ResellerStatus;
  created_at: string;
};

const STATUS_OPTIONS: { value: ResellerStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<ResellerStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-moss-50 text-moss-700 border-moss-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

// Base URL used to resolve uploaded file/image paths returned by the API.
// Set NEXT_PUBLIC_IMAGE_URL in your .env (e.g. http://localhost:8000).
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL || "";

function fileUrl(path: string) {
  return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

// Social handles/links may be stored without a protocol (e.g.
// "facebook.com/juandelacruz"), which makes <a href="..."> resolve as a
// relative path off the current page. Force an absolute https:// URL.
function socialUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "?";
}

function StatusBadge({ status }: { status: ResellerStatus }) {
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );
}

// Fills in any fields that might be missing/null from the API so the rest
// of the component can safely assume a complete shape.
function normalizeReseller(u: Partial<Reseller> & { id: number }): Reseller {
  return {
    id: u.id,
    email: u.email ?? "",
    username: u.username ?? "",
    address_type: u.address_type ?? "",
    age: u.age ?? null,
    cellphone: u.cellphone ?? "",
    telephone: u.telephone ?? null,
    complete_address: u.complete_address ?? "",
    full_name: u.full_name ?? "",
    facebook: u.facebook ?? null,
    instagram: u.instagram ?? null,
    twitter: u.twitter ?? null,
    tin: u.tin ?? "",
    birthday: u.birthday ?? null,
    sss_number: u.sss_number ?? "",
    signatory_1: u.signatory_1 ?? "",
    signatory_2: u.signatory_2 ?? "",
    applicant_name: u.applicant_name ?? "",
    position: u.position ?? "",
    references: Array.isArray(u.references) ? u.references : [],
    files: Array.isArray(u.files) ? u.files : [],
    status: u.status ?? "pending",
    created_at: u.created_at ?? new Date().toISOString(),
  };
}

export default function AdminResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // view dialog
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(
    null,
  );

  async function fetchResellers() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/resellers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load resellers");
      const data = await res.json();

      const rawList: Partial<Reseller>[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.resellers)
          ? data.resellers
          : Array.isArray(data?.data)
            ? data.data
            : [];

      // Defensive normalization: guarantee every reseller has a complete,
      // safe shape regardless of what the API actually returned.
      const list = rawList
        .filter((u): u is Partial<Reseller> & { id: number } => u?.id != null)
        .map(normalizeReseller);

      setResellers(list);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load resellers",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchResellers();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const filtered = useMemo(
    () => (Array.isArray(resellers) ? resellers : []),
    [resellers],
  );

  // Pagination — 10 rows per page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  function openViewDialog(reseller: Reseller) {
    setSelectedReseller(reseller);
  }

  return (
    <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
      <AdminSidebar />

      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold text-moss-900">
              Resellers
            </h1>
            <p className="text-sm text-muted-foreground">
              {resellers.length} applications total.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchResellers}
            className="gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading resellers...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No reseller applications match your search.
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead>Applicant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>TIN</TableHead>
                    <TableHead>Address type</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((reseller) => (
                    <TableRow
                      key={reseller.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[11px] font-semibold text-moss-700">
                            {initials(reseller.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-moss-900">
                              {reseller.full_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              @{reseller.username}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-xs text-moss-700">
                          {reseller.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reseller.cellphone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {reseller.tin || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {reseller.address_type || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {reseller.files.length} file
                          {reseller.files.length === 1 ? "" : "s"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={reseller.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reseller.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openViewDialog(reseller)}
                            aria-label={`View reseller application ${reseller.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Card list — below md */}
            <div className="divide-y divide-moss-100 md:hidden">
              {paginated.map((reseller) => (
                <button
                  key={reseller.id}
                  onClick={() => openViewDialog(reseller)}
                  className="flex w-full flex-col gap-1.5 px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[11px] font-semibold text-moss-700">
                        {initials(reseller.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {reseller.full_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {reseller.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={reseller.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-moss-900">
                      {reseller.tin || "No TIN"}
                    </span>
                    <span>
                      {reseller.files.length} file
                      {reseller.files.length === 1 ? "" : "s"}
                    </span>
                    <span>{reseller.cellphone}</span>
                    <span>Applied {formatDate(reseller.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-moss-100 px-4 py-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-moss-800">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="font-medium text-moss-800">
                  {filtered.length}
                </span>{" "}
                applications
              </p>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Button
                      key={pageNum}
                      size="icon"
                      variant={pageNum === page ? "default" : "outline"}
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ),
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* View dialog */}
      <Dialog
        open={!!selectedReseller}
        onOpenChange={(open) => !open && setSelectedReseller(null)}
      >
        <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          {selectedReseller && (
            <>
              <DialogHeader className="border-b border-moss-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedReseller.full_name}</DialogTitle>
                  <StatusBadge status={selectedReseller.status} />
                </div>
                <DialogDescription>
                  Application #{selectedReseller.id} · Applied{" "}
                  {formatDate(selectedReseller.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 overflow-y-auto px-6 py-4">
                {/* Account */}
                <div className="rounded-xl border border-moss-100 bg-moss-50/60 p-3">
                  <p className="text-xs font-semibold text-moss-800">Account</p>
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-moss-900">
                    <Mail className="h-3.5 w-3.5 text-moss-500" />
                    {selectedReseller.email}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-moss-900">
                    <Phone className="h-3.5 w-3.5 text-moss-500" />
                    {selectedReseller.cellphone}
                    {selectedReseller.telephone
                      ? ` · ${selectedReseller.telephone}`
                      : ""}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Username: @{selectedReseller.username}
                  </p>
                </div>

                {/* General information */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">Age</p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.age ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Address type
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.address_type || "—"}
                    </p>
                  </div>
                  <div className="col-span-2 rounded-xl border border-moss-100 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Complete address
                    </p>
                    <p className="mt-0.5 text-sm text-moss-900">
                      {selectedReseller.complete_address || "—"}
                    </p>
                  </div>
                </div>

                {/* Social */}
                {(selectedReseller.facebook ||
                  selectedReseller.instagram ||
                  selectedReseller.twitter) && (
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Social accounts
                    </p>
                    <div className="mt-1.5 flex flex-col gap-1 text-sm text-moss-900">
                      {selectedReseller.facebook && (
                        <a
                          href={socialUrl(selectedReseller.facebook)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 hover:text-forest"
                        >
                          <Facebook className="h-3.5 w-3.5 text-moss-500" />
                          <span className="truncate">
                            {selectedReseller.facebook}
                          </span>
                        </a>
                      )}
                      {selectedReseller.instagram && (
                        <a
                          href={socialUrl(selectedReseller.instagram)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 hover:text-forest"
                        >
                          <Instagram className="h-3.5 w-3.5 text-moss-500" />
                          <span className="truncate">
                            {selectedReseller.instagram}
                          </span>
                        </a>
                      )}
                      {selectedReseller.twitter && (
                        <a
                          href={socialUrl(selectedReseller.twitter)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 hover:text-forest"
                        >
                          <Twitter className="h-3.5 w-3.5 text-moss-500" />
                          <span className="truncate">
                            {selectedReseller.twitter}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Data: TIN / birthday / SSS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      BIR / TIN
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.tin || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Birthday
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {formatDate(selectedReseller.birthday)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      SSS number
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.sss_number || "—"}
                    </p>
                  </div>
                </div>

                {/* Character references */}
                <div className="rounded-xl border border-moss-100 p-3">
                  <p className="text-xs font-semibold text-moss-800">
                    Character references
                  </p>
                  {selectedReseller.references.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No references on file.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-col gap-2">
                      {selectedReseller.references.map((ref, i) => (
                        <div
                          key={ref.id ?? i}
                          className="rounded-lg bg-moss-50/60 p-2.5"
                        >
                          <p className="text-sm font-medium text-moss-900">
                            {ref.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ref.position}
                          </p>
                          <p className="mt-0.5 text-xs text-moss-700">
                            {ref.contact} · {ref.email}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Authorized signatories */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Signatory 1
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.signatory_1 || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Signatory 2
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.signatory_2 || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Applicant name
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.applicant_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Position
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-moss-900">
                      {selectedReseller.position || "—"}
                    </p>
                  </div>
                </div>

                {/* Uploaded documents */}
                <div className="rounded-xl border border-moss-100 p-3">
                  <p className="text-xs font-semibold text-moss-800">
                    Uploaded documents
                  </p>
                  {selectedReseller.files.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      No documents uploaded.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-col gap-1.5">
                      {selectedReseller.files.map((file) => (
                        <a
                          key={file.id}
                          href={fileUrl(file.path)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 rounded-lg border border-moss-100 bg-moss-50/40 p-2 hover:bg-moss-50"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-moss-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-moss-900">
                              {file.original_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Download className="h-3.5 w-3.5 shrink-0 text-moss-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-moss-100 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedReseller(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
