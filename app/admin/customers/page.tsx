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

import { formatPHP } from "@/lib/utils";

type UserRole = "customer" | "admin";

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
  // Optional — only present if your /customers endpoint joins order stats.
  // Falls back to 0 / undefined-safe everywhere below.
  orders_count: number | null;
  total_spent: number | string | null;
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Admin" },
];

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-moss-50 text-moss-700 border-moss-200",
  admin: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(firstName: string, lastName: string) {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function RoleBadge({ role }: { role: UserRole }) {
  const label = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${ROLE_STYLES[role]}`}
    >
      {label}
    </span>
  );
}

// Fills in any fields that might be missing/null from the API so the rest
// of the component can safely assume a complete shape.
function normalizeCustomer(u: Partial<Customer> & { id: number }): Customer {
  return {
    id: u.id,
    first_name: u.first_name ?? "",
    last_name: u.last_name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    role: u.role ?? "customer",
    created_at: u.created_at ?? new Date().toISOString(),
    orders_count: u.orders_count ?? null,
    total_spent: u.total_spent ?? null,
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // view dialog
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  async function fetchCustomers() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();

      const rawList: Partial<Customer>[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.customers)
          ? data.customers
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : [];

      // Defensive normalization: guarantee every customer has a complete,
      // safe shape regardless of what the API actually returned.
      const list = rawList
        .filter((u): u is Partial<Customer> & { id: number } => u?.id != null)
        .map(normalizeCustomer);

      setCustomers(list);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load customers",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  const filtered = useMemo(
    () => (Array.isArray(customers) ? customers : []),
    [customers],
  );

  // Pagination — 10 rows per page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  function openViewDialog(customer: Customer) {
    setSelectedCustomer(customer);
  }

  return (
    <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
      <AdminSidebar />

      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold text-moss-900">
              Customers
            </h1>
            <p className="text-sm text-muted-foreground">
              {customers.length} accounts total.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchCustomers}
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
              placeholder="Search by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading customers...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No customers match your search.
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total spent</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[11px] font-semibold text-moss-700">
                            {initials(customer.first_name, customer.last_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-moss-900">
                              {customer.first_name} {customer.last_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              #{customer.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-xs text-moss-700">
                          {customer.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.phone}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {customer.orders_count ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-moss-900">
                          {formatPHP(Number(customer.total_spent ?? 0))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={customer.role} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(customer.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openViewDialog(customer)}
                            aria-label={`View customer ${customer.id}`}
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
              {paginated.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => openViewDialog(customer)}
                  className="flex w-full flex-col gap-1.5 px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-[11px] font-semibold text-moss-700">
                        {initials(customer.first_name, customer.last_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {customer.first_name} {customer.last_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={customer.role} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium text-moss-900">
                      {formatPHP(Number(customer.total_spent ?? 0))}
                    </span>
                    <span>{customer.orders_count ?? 0} orders</span>
                    <span>{customer.phone}</span>
                    <span>Joined {formatDate(customer.created_at)}</span>
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
                customers
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
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      >
        <DialogContent className="flex max-h-[88vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          {selectedCustomer && (
            <>
              <DialogHeader className="border-b border-moss-100 px-6 py-4">
                <DialogTitle>
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </DialogTitle>
                <DialogDescription>
                  Customer #{selectedCustomer.id} · Joined{" "}
                  {formatDate(selectedCustomer.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 overflow-y-auto px-6 py-4">
                {/* Contact */}
                <div className="rounded-xl border border-moss-100 bg-moss-50/60 p-3">
                  <p className="text-xs font-semibold text-moss-800">Contact</p>
                  <div className="mt-1.5 flex items-center gap-2 text-sm text-moss-900">
                    <Mail className="h-3.5 w-3.5 text-moss-500" />
                    {selectedCustomer.email}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-moss-900">
                    <Phone className="h-3.5 w-3.5 text-moss-500" />
                    {selectedCustomer.phone}
                  </div>
                </div>

                {/* Order stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Orders placed
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-moss-900">
                      {selectedCustomer.orders_count ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-moss-100 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      Total spent
                    </p>
                    <p className="mt-0.5 text-lg font-semibold text-moss-900">
                      {formatPHP(Number(selectedCustomer.total_spent ?? 0))}
                    </p>
                  </div>
                </div>

                {/* Role (read-only) */}
                <div className="rounded-xl border border-moss-100 p-3">
                  <p className="text-[11px] text-muted-foreground">Role</p>
                  <div className="mt-1.5">
                    <RoleBadge role={selectedCustomer.role} />
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-moss-100 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedCustomer(null)}
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
