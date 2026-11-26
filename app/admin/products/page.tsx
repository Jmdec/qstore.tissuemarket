"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Eye,
  Plus,
  Search,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CATEGORIES, BRANDS, type Category } from "@/types/product";
import { cn, formatPHP } from "@/lib/utils";

// Base URL where Laravel serves uploaded images from the public/ folder,
// e.g. NEXT_PUBLIC_IMAGE_URL=https://api.yoursite.com
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

// Product shape as returned by the Laravel API (see ProductController::toArray on the model).
type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number | null; // optional — may be empty
  originalPrice?: number | null;
  rating: number;
  reviews: number;
  tag?: string | null;
  inStock: boolean;
  stock: number;
  blurb: string;
  color: string;
  image: string; // relative path returned by the API, e.g. "/products/xyz.jpg"
  isPromo?: boolean;
  promoStart?: string | null; // ISO date string, e.g. "2026-08-01"
  promoEnd?: string | null; // ISO date string, e.g. "2026-08-15"
};

type ProductFormState = {
  id: string | null;
  name: string;
  brand: string;
  category: Category;
  price: string;
  originalPrice: string;
  stock: string;
  tag: string; // "" | Best Seller | New | Bundle | Eco
  blurb: string;
  imageFile: File | null;
  imagePreview: string; // existing image url (resolved) or object URL preview
  isPromo: boolean;
  promoStart: string; // yyyy-mm-dd for <input type="date">
  promoEnd: string;
};

const EMPTY_FORM: ProductFormState = {
  id: null,
  name: "",
  brand: BRANDS[0],
  category: CATEGORIES[0],
  price: "",
  originalPrice: "",
  stock: "0",
  tag: "",
  blurb: "",
  imageFile: null,
  imagePreview: "",
  isPromo: false,
  promoStart: "",
  promoEnd: "",
};

const TAG_OPTIONS = ["Best Seller", "New", "Bundle", "Eco"];

// Resolves an image path coming back from the API (relative, e.g.
// "/products/foo.jpg") into a fully-qualified URL the <Image> component
// can load. Leaves already-absolute URLs (http..., blob: previews) alone.
function resolveImageUrl(path: string | null | undefined): string {
  if (!path) return "/products/placeholder.jpg";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  return `${IMAGE_BASE_URL}${path}`;
}

// A promo only counts as "live" if the toggle is on AND today falls inside
// the start/end range (missing dates are treated as open-ended on that side).
function isPromoActive(product: AdminProduct): boolean {
  if (!product.isPromo) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (product.promoStart) {
    const start = new Date(product.promoStart);
    if (now < start) return false;
  }
  if (product.promoEnd) {
    const end = new Date(product.promoEnd);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

function formatPromoRange(product: AdminProduct): string {
  if (!product.promoStart && !product.promoEnd) return "No end date";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  if (product.promoStart && product.promoEnd) {
    return `${fmt(product.promoStart)} – ${fmt(product.promoEnd)}`;
  }
  if (product.promoEnd) return `Until ${fmt(product.promoEnd)}`;
  return `From ${fmt(product.promoStart!)}`;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // form dialog (shared for add + edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // view dialog
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);

  // delete confirmation
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchProducts() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();

      // API might return a raw array, or a wrapped shape like
      // { products: [...] } / { data: [...] } — normalize either way.
      const list: AdminProduct[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setProducts(list);
    } catch (err) {
      // Kept as an inline banner rather than a toast — a failed initial
      // load should stay visible until resolved, not auto-dismiss.
      setLoadError(
        err instanceof Error ? err.message : "Failed to load products",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Re-fetch from the server whenever search/category changes (debounced
  // slightly on search so we don't hammer the API on every keystroke).
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  const filtered = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products],
  );

  // Pagination — 10 rows per page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  function openAddDialog() {
    setFormMode("add");
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
  }

  function openEditDialog(product: AdminProduct) {
    setFormMode("edit");
    setForm({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price != null ? String(product.price) : "",
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: String(product.stock ?? (product.inStock ? 10 : 0)),
      tag: product.tag ?? "",
      blurb: product.blurb,
      imageFile: null,
      imagePreview: resolveImageUrl(product.image),
      isPromo: product.isPromo ?? false,
      promoStart: product.promoStart ?? "",
      promoEnd: product.promoEnd ?? "",
    });
    setIsFormOpen(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Guardrail: if promo is on, require at least an end date so it doesn't
    // run forever by accident.
    if (form.isPromo && !form.promoEnd) {
      toast.error("Please set an end date for the special promo.");
      return;
    }
    if (
      form.isPromo &&
      form.promoStart &&
      form.promoEnd &&
      form.promoStart > form.promoEnd
    ) {
      toast.error("Promo start date must be before the end date.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("brand", form.brand);
      body.append("category", form.category);
      body.append("price", form.price);
      if (form.originalPrice) body.append("originalPrice", form.originalPrice);
      body.append("stock", form.stock);
      if (form.tag) body.append("tag", form.tag);
      body.append("blurb", form.blurb);
      if (form.imageFile) body.append("image", form.imageFile);

      body.append("is_promo", form.isPromo ? "1" : "0");
      if (form.isPromo) {
        if (form.promoStart) body.append("promo_start", form.promoStart);
        if (form.promoEnd) body.append("promo_end", form.promoEnd);
      }

      const url =
        formMode === "add" ? "/api/products" : `/api/products/${form.id}`;

      if (formMode === "edit") {
        // Method spoofing: our proxy route and Laravel both treat a POST
        // with _method=PUT as an update. Needed because file uploads can't
        // travel over a native PUT request.
        body.append("_method", "PUT");
      }

      const res = await fetch(url, { method: "POST", body });
      if (!res.ok) throw new Error("Failed to save product");

      toast.success(formMode === "add" ? "Product added." : "Product updated.");
      setIsFormOpen(false);
      await fetchProducts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStock(product: AdminProduct) {
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? { ...p, inStock: !p.inStock, stock: !p.inStock ? p.stock || 10 : 0 }
          : p,
      ),
    );

    try {
      const res = await fetch(`/api/products/${product.id}/toggle-stock`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to update stock status");
      const updated: AdminProduct = await res.json();
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updated : p)),
      );
      toast.success(
        updated.inStock ? "Marked in stock." : "Marked out of stock.",
      );
    } catch (err) {
      // Roll back on failure
      await fetchProducts();
      toast.error(
        err instanceof Error ? err.message : "Failed to update stock status",
      );
    }
  }

  async function confirmDelete() {
    if (!deleteProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteProduct.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      toast.success("Product deleted.");
      setDeleteProduct(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
      <AdminSidebar />

      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-2xl font-semibold text-moss-900">
              Products
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} products in your catalog.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shared status states (loading / error / empty) — sit above both the
            table and the mobile card list so neither has to repeat them. */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading products...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No products match your search.
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead className="w-14">Image</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Category
                    </TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((product) => (
                    <TableRow
                      key={product.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell>
                        <div className="relative h-11 w-11 overflow-hidden rounded-lg bg-moss-100">
                          <Image
                            src={resolveImageUrl(product.image)}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.brand}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="outline"
                          className="border-moss-200 text-moss-700"
                        >
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-moss-900">
                          {product.price != null
                            ? formatPHP(product.price)
                            : "—"}
                        </span>
                        {product.originalPrice && (
                          <span className="ml-1.5 text-xs text-muted-foreground line-through">
                            {formatPHP(product.originalPrice)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleStock(product)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            product.inStock
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-600 hover:bg-red-200",
                          )}
                          title="Click to toggle stock status"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              product.inStock ? "bg-green-600" : "bg-red-500",
                            )}
                          />
                          {product.inStock ? "In stock" : "Out of stock"}
                        </button>
                        {typeof product.stock === "number" && (
                          <p className="mt-1 pl-0.5 text-[11px] text-muted-foreground">
                            {product.stock} units
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isPromo ? (
                          <div>
                            <Badge
                              className={cn(
                                "gap-1 border-transparent",
                                isPromoActive(product)
                                  ? "bg-yellow-300 text-moss-950"
                                  : "bg-moss-100 text-moss-500",
                              )}
                            >
                              <Sparkles className="h-3 w-3" />
                              {isPromoActive(product)
                                ? "Live"
                                : "Scheduled/Ended"}
                            </Badge>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatPromoRange(product)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => setViewProduct(product)}
                            aria-label={`View ${product.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openEditDialog(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteProduct(product)}
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
              {paginated.map((product) => (
                <div key={product.id} className="flex gap-3 px-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                    <Image
                      src={resolveImageUrl(product.image)}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.brand} &middot; {product.category}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-moss-600 hover:text-moss-900"
                          onClick={() => setViewProduct(product)}
                          aria-label={`View ${product.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-moss-600 hover:text-moss-900"
                          onClick={() => openEditDialog(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteProduct(product)}
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="text-sm font-medium text-moss-900">
                        {product.price != null ? formatPHP(product.price) : "—"}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPHP(product.originalPrice)}
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleStock(product)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          product.inStock
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-600 hover:bg-red-200",
                        )}
                        title="Tap to toggle stock status"
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            product.inStock ? "bg-green-600" : "bg-red-500",
                          )}
                        />
                        {product.inStock ? "In stock" : "Out of stock"}
                      </button>
                      {typeof product.stock === "number" && (
                        <span className="text-[11px] text-muted-foreground">
                          {product.stock} units
                        </span>
                      )}
                      {product.isPromo && (
                        <Badge
                          className={cn(
                            "gap-1 border-transparent",
                            isPromoActive(product)
                              ? "bg-yellow-300 text-moss-950"
                              : "bg-moss-100 text-moss-500",
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                          {isPromoActive(product) ? "Live" : "Scheduled/Ended"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
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
                products
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

      {/* Add / Edit dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="flex max-h-[88vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <form onSubmit={handleSubmit} className="flex max-h-[88vh] flex-col">
            <DialogHeader className="border-b border-moss-100 px-6 py-4">
              <DialogTitle>
                {formMode === "add" ? "Add Product" : "Edit Product"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "add"
                  ? "Fill in the details to add a new product to the catalog."
                  : "Update the product details below."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 overflow-y-auto px-6 py-4">
              {/* Image upload */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-dashed border-moss-200 bg-moss-50">
                  {form.imagePreview ? (
                    <Image
                      src={form.imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-moss-300">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload image
                  </Button>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    JPG or PNG, saved to the server's public folder.
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="name">Product name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Interfolded Bamboo Paper Towels"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Select
                    value={form.brand}
                    onValueChange={(v) => setForm((f) => ({ ...f, brand: v }))}
                  >
                    <SelectTrigger id="brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as Category }))
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="price">
                    Price (PHP){" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="originalPrice">
                    Original price{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, originalPrice: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="stock">Stock quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stock: e.target.value }))
                    }
                    placeholder="0"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Status is set automatically — 0 marks it sold out.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="tag">Tag</Label>
                  <Select
                    value={form.tag || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, tag: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger id="tag">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {TAG_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="blurb">Description</Label>
                <Textarea
                  id="blurb"
                  rows={3}
                  value={form.blurb}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, blurb: e.target.value }))
                  }
                  placeholder="Short product description shown on the storefront."
                />
              </div>

              {/* Special Promo */}
              <div className="rounded-xl border border-moss-200 bg-moss-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label
                      htmlFor="isPromo"
                      className="flex items-center gap-1.5 text-sm font-medium text-moss-900"
                    >
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      Special Promo
                    </Label>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Shows a promo badge on the storefront during the date
                      range below.
                    </p>
                  </div>
                  <Switch
                    id="isPromo"
                    checked={form.isPromo}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({ ...f, isPromo: checked }))
                    }
                  />
                </div>

                {form.isPromo && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="promoStart" className="text-xs">
                        Start date{" "}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="promoStart"
                        type="date"
                        value={form.promoStart}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            promoStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="promoEnd" className="text-xs">
                        End date
                      </Label>
                      <Input
                        id="promoEnd"
                        type="date"
                        required={form.isPromo}
                        value={form.promoEnd}
                        min={form.promoStart || undefined}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, promoEnd: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-moss-100 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                {formMode === "add" ? "Add Product" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog
        open={!!viewProduct}
        onOpenChange={(open) => !open && setViewProduct(null)}
      >
        <DialogContent className="max-w-md">
          {viewProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{viewProduct.name}</DialogTitle>
                <DialogDescription>
                  {viewProduct.brand} &middot; {viewProduct.category}
                </DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-moss-100">
                <Image
                  src={resolveImageUrl(viewProduct.image)}
                  alt={viewProduct.name}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{viewProduct.blurb}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {viewProduct.price != null && (
                    <Badge className="border-transparent bg-yellow-300 text-moss-950">
                      {formatPHP(viewProduct.price)}
                    </Badge>
                  )}
                  {viewProduct.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPHP(viewProduct.originalPrice)}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      viewProduct.inStock
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }
                  >
                    {viewProduct.inStock ? "In stock" : "Out of stock"}
                  </Badge>
                  {typeof viewProduct.stock === "number" && (
                    <Badge
                      variant="outline"
                      className="border-moss-200 text-moss-700"
                    >
                      {viewProduct.stock} units
                    </Badge>
                  )}
                  {viewProduct.tag && (
                    <Badge
                      variant="outline"
                      className="border-moss-200 text-moss-700"
                    >
                      {viewProduct.tag}
                    </Badge>
                  )}
                  {viewProduct.isPromo && (
                    <Badge
                      className={cn(
                        "gap-1 border-transparent",
                        isPromoActive(viewProduct)
                          ? "bg-yellow-300 text-moss-950"
                          : "bg-moss-100 text-moss-500",
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      Promo &middot; {formatPromoRange(viewProduct)}
                    </Badge>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewProduct(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    if (p) openEditDialog(p);
                  }}
                >
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-moss-900">
                {deleteProduct?.name}
              </span>{" "}
              from your catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
