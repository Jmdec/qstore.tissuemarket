"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  Eye,
  Plus,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GripVertical,
} from "lucide-react";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { cn } from "@/lib/utils";

// Banner shape as returned by the Laravel API (see BannerController + the
// Banner model's image_url accessor).
type AdminBanner = {
  id: number;
  image: string; // raw relative path as stored, e.g. "banners/xyz.png" — not used directly by the UI
  image_url: string; // fully-qualified URL built server-side via asset($this->image) — use this for display
  sort_order: number;
};

type BannerFormState = {
  id: number | null;
  imageFile: File | null;
  imagePreview: string; // existing image url (resolved) or object URL preview
  sortOrder: string;
};

const EMPTY_FORM: BannerFormState = {
  id: null,
  imageFile: null,
  imagePreview: "",
  sortOrder: "0",
};

// Resolves a banner's image_url for display. The Laravel API already
// returns a fully-qualified URL (via the Banner model's image_url
// accessor, built server-side with asset()), so there's no path-joining
// or env-var-based host prefixing to do here — just pass it through, or
// return null when there's nothing to show.
function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  return imageUrl || null;
}

// Small helper component: renders the resolved image, or a plain icon
// placeholder (no network request) when there's nothing to load.
function BannerThumbnail({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center text-moss-300",
          className,
        )}
      >
        <ImagePlus className="h-5 w-5" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      className={cn("object-cover", className)}
      sizes={sizes}
    />
  );
}

export default function AdminHeroBannerPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form dialog (shared for add + edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<BannerFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // view dialog
  const [viewBanner, setViewBanner] = useState<AdminBanner | null>(null);

  // delete confirmation
  const [deleteBanner, setDeleteBanner] = useState<AdminBanner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchBanners() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/banners");
      if (!res.ok) throw new Error("Failed to load banners");
      const data: AdminBanner[] = await res.json();
      setBanners(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load banners",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  // Already sorted by the API (orderBy sort_order, id) but keep it stable
  // client-side too in case of optimistic updates.
  const sorted = useMemo(
    () => [...banners].sort((a, b) => a.sort_order - b.sort_order),
    [banners],
  );

  // Pagination — 10 rows per page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  const rangeStart = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, sorted.length);

  function openAddDialog() {
    setFormMode("add");
    setForm({
      ...EMPTY_FORM,
      sortOrder: String(banners.length),
    });
    setIsFormOpen(true);
  }

  function openEditDialog(banner: AdminBanner) {
    setFormMode("edit");
    setForm({
      id: banner.id,
      imageFile: null,
      imagePreview: resolveImageUrl(banner.image_url) ?? "",
      sortOrder: String(banner.sort_order ?? 0),
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

    if (formMode === "add" && !form.imageFile) {
      toast.error("Please upload a banner image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      if (form.imageFile) body.append("image", form.imageFile);
      body.append("sort_order", form.sortOrder || "0");

      const url =
        formMode === "add" ? "/api/banners" : `/api/banners/${form.id}`;

      if (formMode === "edit") {
        // Method spoofing: our proxy route and Laravel both treat a POST
        // with _method=PUT as an update. Needed because file uploads can't
        // travel over a native PUT request.
        body.append("_method", "PUT");
      }

      const res = await fetch(url, { method: "POST", body });
      if (!res.ok) throw new Error("Failed to save banner");

      setIsFormOpen(false);
      await fetchBanners();
      toast.success(formMode === "add" ? "Banner added." : "Banner updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteBanner) return;
    setIsDeleting(true);
    try {
      // BannerController::destroy() deletes the physical file from
      // public/banners as well as the DB row, so no cleanup is needed here.
      const res = await fetch(`/api/banners/${deleteBanner.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete banner");
      setBanners((prev) => prev.filter((b) => b.id !== deleteBanner.id));
      setDeleteBanner(null);
      toast.success("Banner deleted.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete banner",
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
              Hero Banners
            </h1>
            <p className="text-sm text-muted-foreground">
              {banners.length} banner{banners.length === 1 ? "" : "s"} in your
              homepage carousel.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Banner
          </Button>
        </div>

        {/* Shared status states (loading / error / empty) */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading banners...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && sorted.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No banners yet. Add one to populate the homepage carousel.
          </div>
        )}

        {!isLoading && !loadError && sorted.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead className="w-24">Preview</TableHead>
                    <TableHead>Image path</TableHead>
                    <TableHead className="w-32">Position</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((banner) => (
                    <TableRow
                      key={banner.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell>
                        <div className="relative h-12 w-20 overflow-hidden rounded-lg bg-moss-100">
                          <BannerThumbnail
                            src={resolveImageUrl(banner.image_url)}
                            alt={`Banner ${banner.id}`}
                            sizes="80px"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="truncate text-sm text-moss-700">
                          {banner.image}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="gap-1 border-moss-200 text-moss-700"
                        >
                          <GripVertical className="h-3 w-3" />
                          {banner.sort_order}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => setViewBanner(banner)}
                            aria-label={`View banner ${banner.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openEditDialog(banner)}
                            aria-label={`Edit banner ${banner.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteBanner(banner)}
                            aria-label={`Delete banner ${banner.id}`}
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
              {paginated.map((banner) => (
                <div key={banner.id} className="flex gap-3 px-4 py-3">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                    <BannerThumbnail
                      src={resolveImageUrl(banner.image_url)}
                      alt={`Banner ${banner.id}`}
                      sizes="96px"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {banner.image}
                        </p>
                        <Badge
                          variant="outline"
                          className="mt-1 gap-1 border-moss-200 text-moss-700"
                        >
                          <GripVertical className="h-3 w-3" />
                          Position {banner.sort_order}
                        </Badge>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-moss-600 hover:text-moss-900"
                          onClick={() => setViewBanner(banner)}
                          aria-label={`View banner ${banner.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-moss-600 hover:text-moss-900"
                          onClick={() => openEditDialog(banner)}
                          aria-label={`Edit banner ${banner.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteBanner(banner)}
                          aria-label={`Delete banner ${banner.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
                  {sorted.length}
                </span>{" "}
                banners
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
                {formMode === "add" ? "Add Banner" : "Edit Banner"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "add"
                  ? "Upload an image for the homepage hero carousel."
                  : "Update the banner image or its position."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 overflow-y-auto px-6 py-4">
              {/* Image upload */}
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-dashed border-moss-200 bg-moss-50">
                  {form.imagePreview ? (
                    <Image
                      src={form.imagePreview}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="128px"
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
                    accept="image/jpeg,image/png,image/webp"
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
                    JPG, PNG, or WEBP, max 5MB. Saved to the server's public
                    folder.
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="sortOrder">Position</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                  placeholder="0"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lower numbers appear first in the carousel.
                </p>
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
                {formMode === "add" ? "Add Banner" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog
        open={!!viewBanner}
        onOpenChange={(open) => !open && setViewBanner(null)}
      >
        <DialogContent className="max-w-lg">
          {viewBanner && (
            <>
              <DialogHeader>
                <DialogTitle>Banner #{viewBanner.id}</DialogTitle>
                <DialogDescription>{viewBanner.image}</DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[16/6] w-full overflow-hidden rounded-xl bg-moss-100">
                <BannerThumbnail
                  src={resolveImageUrl(viewBanner.image_url)}
                  alt={`Banner ${viewBanner.id}`}
                  sizes="500px"
                />
              </div>
              <div className="flex items-center gap-2 pt-1 text-sm">
                <Badge
                  variant="outline"
                  className="gap-1 border-moss-200 text-moss-700"
                >
                  <GripVertical className="h-3 w-3" />
                  Position {viewBanner.sort_order}
                </Badge>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewBanner(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const b = viewBanner;
                    setViewBanner(null);
                    if (b) openEditDialog(b);
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
        open={!!deleteBanner}
        onOpenChange={(open) => !open && setDeleteBanner(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove banner{" "}
              <span className="font-medium text-moss-900">
                #{deleteBanner?.id}
              </span>{" "}
              and its image file from the server. This action cannot be undone.
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
