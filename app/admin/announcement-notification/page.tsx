"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Eye,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bell,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

// Announcement shape as returned by the Laravel API (see AnnouncementController).
type Announcement = {
  id: string;
  title: string;
  body: string;
  url?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
};

type AnnouncementFormState = {
  id: string | null;
  title: string;
  body: string;
  url: string;
  is_published: boolean;
};

const EMPTY_FORM: AnnouncementFormState = {
  id: null,
  title: "",
  body: "",
  url: "",
  is_published: true,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // form dialog (shared for add + edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // view dialog
  const [viewAnnouncement, setViewAnnouncement] = useState<Announcement | null>(
    null,
  );

  // delete confirmation
  const [deleteAnnouncement, setDeleteAnnouncement] =
    useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchAnnouncements() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/announcements?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load announcements");
      const data = await res.json();

      const list: Announcement[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setAnnouncements(list);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load announcements";
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAnnouncements();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(
    () => (Array.isArray(announcements) ? announcements : []),
    [announcements],
  );

  // Pagination — 10 rows per page
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search]);

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

  function openEditDialog(announcement: Announcement) {
    setFormMode("edit");
    setForm({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      url: announcement.url ?? "",
      is_published: announcement.is_published,
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title,
        body: form.body,
        url: form.url || null,
        is_published: form.is_published,
      };

      const url =
        formMode === "add"
          ? "/api/announcements"
          : `/api/announcements/${form.id}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save announcement");

      setIsFormOpen(false);
      await fetchAnnouncements();

      toast.success(
        formMode === "add" ? "Announcement posted" : "Announcement updated",
        {
          description:
            formMode === "add" && form.is_published
              ? "Subscribers are being notified now."
              : undefined,
        },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save announcement",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteAnnouncement) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${deleteAnnouncement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      setAnnouncements((prev) =>
        prev.filter((a) => a.id !== deleteAnnouncement.id),
      );
      toast.success("Announcement deleted");
      setDeleteAnnouncement(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete announcement",
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
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground">
              {announcements.length} announcements posted. New ones notify all
              subscribers instantly.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading announcements...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-red-600 shadow-sm">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && filtered.length === 0 && (
          <div className="rounded-2xl border border-moss-200 bg-white py-10 text-center text-sm text-muted-foreground shadow-sm">
            No announcements yet. Create one to notify your subscribers.
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Table — md and up */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-moss-200 bg-moss-50 hover:bg-moss-50">
                    <TableHead>Announcement</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((announcement) => (
                    <TableRow
                      key={announcement.id}
                      className="border-b border-moss-100 last:border-0 hover:bg-moss-50/70"
                    >
                      <TableCell className="max-w-[320px]">
                        <p className="truncate text-sm font-medium text-moss-900">
                          {announcement.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {announcement.body}
                        </p>
                      </TableCell>
                      <TableCell>
                        {announcement.url ? (
                          <span className="inline-flex items-center gap-1 text-xs text-moss-600">
                            <ExternalLink className="h-3 w-3" />
                            {announcement.url}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "gap-1 border-transparent",
                            announcement.is_published
                              ? "bg-green-100 text-green-700"
                              : "bg-moss-100 text-moss-500",
                          )}
                        >
                          <Bell className="h-3 w-3" />
                          {announcement.is_published ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(announcement.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => setViewAnnouncement(announcement)}
                            aria-label={`View ${announcement.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-moss-600 hover:text-moss-900"
                            onClick={() => openEditDialog(announcement)}
                            aria-label={`Edit ${announcement.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteAnnouncement(announcement)}
                            aria-label={`Delete ${announcement.title}`}
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
              {paginated.map((announcement) => (
                <div key={announcement.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-moss-900">
                        {announcement.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {announcement.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-moss-600 hover:text-moss-900"
                        onClick={() => setViewAnnouncement(announcement)}
                        aria-label={`View ${announcement.title}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-moss-600 hover:text-moss-900"
                        onClick={() => openEditDialog(announcement)}
                        aria-label={`Edit ${announcement.title}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeleteAnnouncement(announcement)}
                        aria-label={`Delete ${announcement.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        "gap-1 border-transparent",
                        announcement.is_published
                          ? "bg-green-100 text-green-700"
                          : "bg-moss-100 text-moss-500",
                      )}
                    >
                      <Bell className="h-3 w-3" />
                      {announcement.is_published ? "Published" : "Draft"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(announcement.created_at)}
                    </span>
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
                announcements
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
                {formMode === "add" ? "New Announcement" : "Edit Announcement"}
              </DialogTitle>
              <DialogDescription>
                {formMode === "add"
                  ? "This will be pushed as a notification to every subscribed device."
                  : "Editing does not re-trigger a push notification."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 overflow-y-auto px-6 py-4">
              <div className="grid gap-1.5">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  required
                  maxLength={255}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Flash Sale: 20% off tissue!"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  rows={3}
                  required
                  maxLength={500}
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  placeholder="Short message shown in the notification."
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.body.length}/500 characters
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="url">
                  Link <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="url"
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="/promos/flash-sale"
                />
                <p className="text-[11px] text-muted-foreground">
                  Where tapping the notification should take the user.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-moss-200 bg-moss-50/60 p-4">
                <div>
                  <Label
                    htmlFor="is_published"
                    className="flex items-center gap-1.5 text-sm font-medium text-moss-900"
                  >
                    <Bell className="h-4 w-4 text-moss-600" />
                    Publish & Notify
                  </Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formMode === "add"
                      ? "Sends a push notification to all subscribers immediately."
                      : "Controls visibility in the announcements feed."}
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={form.is_published}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, is_published: checked }))
                  }
                />
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
                {formMode === "add" ? "Post & Notify" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog
        open={!!viewAnnouncement}
        onOpenChange={(open) => !open && setViewAnnouncement(null)}
      >
        <DialogContent className="max-w-md">
          {viewAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle>{viewAnnouncement.title}</DialogTitle>
                <DialogDescription>
                  Posted {formatDate(viewAnnouncement.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">{viewAnnouncement.body}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      "gap-1 border-transparent",
                      viewAnnouncement.is_published
                        ? "bg-green-100 text-green-700"
                        : "bg-moss-100 text-moss-500",
                    )}
                  >
                    <Bell className="h-3 w-3" />
                    {viewAnnouncement.is_published ? "Published" : "Draft"}
                  </Badge>
                  {viewAnnouncement.url && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-moss-200 text-moss-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {viewAnnouncement.url}
                    </Badge>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setViewAnnouncement(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    const a = viewAnnouncement;
                    setViewAnnouncement(null);
                    if (a) openEditDialog(a);
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
        open={!!deleteAnnouncement}
        onOpenChange={(open) => !open && setDeleteAnnouncement(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-moss-900">
                {deleteAnnouncement?.title}
              </span>
              . This does not un-send notifications already delivered.
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
