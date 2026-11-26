"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

// Category shape as returned by the Laravel API (see
// CategoryController + Category::getImageUrlAttribute). The model only
// stores `image` (relative path under /public) and `sort_order` — the
// API appends `image_url` as the ready-to-use absolute URL.
type AdminCategory = {
  id: number;
  image: string; // e.g. "categories/abc123.png"
  image_url: string; // e.g. "https://api.yoursite.com/categories/abc123.png"
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

type CategoryFormState = {
  id: number | null;
  imageFile: File | null;
  imagePreview: string; // existing image_url or object URL preview
  sortOrder: string;
};

const EMPTY_FORM: CategoryFormState = {
  id: null,
  imageFile: null,
  imagePreview: "",
  sortOrder: "0",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // form dialog (shared for add + edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // view dialog
  const [viewCategory, setViewCategory] = useState<AdminCategory | null>(null);

  // delete confirmation
  const [deleteCategory, setDeleteCategory] = useState<AdminCategory | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchCategories() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();

      // API might return a raw array, or a wrapped shape like
      // { categories: [...] } / { data: [...] } — normalize either way.
      const list: AdminCategory[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
            ? data.data
            : [];

      // Server already orders by sort_order, but sort defensively in case
      // a wrapped/unsorted shape comes back.
      setCategories([...list].sort((a, b) => a.sort_order - b.sort_order));
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load categories",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const sorted = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
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
    // Default the new tile to sort to the end of the list.
    const nextOrder =
      categories.length > 0
        ? Math.max(...categories.map((c) => c.sort_order)) + 1
        : 0;
    setForm({ ...EMPTY_FORM, sortOrder: String(nextOrder) });
    setIsFormOpen(true);
  }

  function openEditDialog(category: AdminCategory) {
    setFormMode("edit");
    setForm({
      id: category.id,
      imageFile: null,
      imagePreview: category.image_url,
      sortOrder: String(category.sort_order),
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
      alert("Please upload an image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      if (form.imageFile) body.append("image", form.imageFile);
      body.append("sort_order", form.sortOrder || "0");

      const url =
        formMode === "add" ? "/api/categories" : `/api/categories/${form.id}`;

      // Both create and update are POST — Laravel's categories route
      // takes updates over POST too, since PHP can't parse multipart
      // bodies on native PUT/PATCH requests.
      const res = await fetch(url, { method: "POST", body });
      if (!res.ok) throw new Error("Failed to save category");

      setIsFormOpen(false);
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteCategory) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteCategory.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
      setDeleteCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category");
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
              Category Tiles
            </h1>
            <p className="text-sm text-muted-foreground">
              {categories.length} tiles shown in "Shop by category" on the
              storefront, ordered left-to-right by sort order.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Tile
          </Button>
        </div>

        {/* Shared status states (loading / error / empty) */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading category tiles...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && sorted.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No category tiles yet. Add one to show it on the storefront.
          </div>
        )}

        {!isLoading && !loadError && sorted.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Sort order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((category) => (
                    <TableRow
                      key={category.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell>
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-moss-100">
                          <Image
                            src={category.image_url}
                            alt={`Category tile #${category.id}`}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-moss-900">
                          <GripVertical className="h-3.5 w-3.5 text-moss-300" />
                          {category.sort_order}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => setViewCategory(category)}
                            aria-label={`View tile ${category.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openEditDialog(category)}
                            aria-label={`Edit tile ${category.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteCategory(category)}
                            aria-label={`Delete tile ${category.id}`}
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
              {paginated.map((category) => (
                <div key={category.id} className="flex gap-3 px-4 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                    <Image
                      src={category.image_url}
                      alt={`Category tile #${category.id}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-moss-900">
                      <GripVertical className="h-3.5 w-3.5 text-moss-300" />
                      Sort {category.sort_order}
                    </span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-moss-600 hover:text-moss-900"
                        onClick={() => setViewCategory(category)}
                        aria-label={`View tile ${category.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-moss-600 hover:text-moss-900"
                        onClick={() => openEditDialog(category)}
                        aria-label={`Edit tile ${category.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteCategory(category)}
                        aria-label={`Delete tile ${category.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                tiles
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
        <DialogContent className="flex max-h-[88vh] max-w-md flex-col gap-0 overflow-hidden p-0">
          <form onSubmit={handleSubmit} className="flex max-h-[88vh] flex-col">
            <DialogHeader className="border-b border-moss-100 px-6 py-4">
              <DialogTitle>
                {formMode === "add"
                  ? "Add Category Tile"
                  : "Edit Category Tile"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "add"
                  ? "Upload an image and set where it appears in the row."
                  : "Replace the image or change its position in the row."}
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
                    JPG, PNG, or WEBP, saved to the server's public folder.
                    {formMode === "edit" &&
                      " Leave empty to keep the current image."}
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  step="1"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: e.target.value }))
                  }
                  placeholder="0"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lower numbers show first (left) in the storefront row.
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
                {formMode === "add" ? "Add Tile" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog
        open={!!viewCategory}
        onOpenChange={(open) => !open && setViewCategory(null)}
      >
        <DialogContent className="max-w-md">
          {viewCategory && (
            <>
              <DialogHeader>
                <DialogTitle>Category Tile #{viewCategory.id}</DialogTitle>
                <DialogDescription>
                  Sort order {viewCategory.sort_order}
                </DialogDescription>
              </DialogHeader>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-moss-100">
                <Image
                  src={viewCategory.image_url}
                  alt={`Category tile #${viewCategory.id}`}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewCategory(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const c = viewCategory;
                    setViewCategory(null);
                    if (c) openEditDialog(c);
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
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove tile{" "}
              <span className="font-medium text-moss-900">
                #{deleteCategory?.id}
              </span>{" "}
              from the "Shop by category" section on the storefront. This action
              cannot be undone.
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
