"use client";

// 📁 FILE PATH: app/admin/institutional/page.tsx
// (adjust the folder to wherever your other admin pages live, and add a
// sidebar link to it in AdminSidebar)

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// The institutional page has 3 places that use pictures. Only the pictures are
// saved. Names and captions below are just guides for whoever uploads, so they
// know which picture goes where. They are NOT stored.
//
// Keep `captions` in sync with the headings / product names on the public page.
// ---------------------------------------------------------------------------
type SectionKey = "hero" | "story" | "products";

type Section = {
  key: SectionKey;
  stepName: string; // short name for the step bar
  title: string; // the section's name, same as on the public page
  where: string; // one sentence: where it shows up
  w: number;
  h: number;
  max: number;
  captions?: string[]; // what each picture position is used for
  fallbackCaption: (i: number) => string;
};

const SECTIONS: Section[] = [
  {
    key: "hero",
    stepName: "Hero banner",
    title: "Hero banner",
    where:
      "The big picture at the very top of the page. Add more than one and it becomes a slideshow.",
    w: 1920,
    h: 520,
    max: 10,
    fallbackCaption: (i) => `Slide ${i + 1}`,
  },
  {
    key: "story",
    stepName: "A cleaner standard",
    title: "A cleaner standard for institutions",
    where:
      "The pictures beside each heading, from top to bottom. Left, right, left.",
    w: 1200,
    h: 900,
    max: 3,
    captions: [
      "Hygiene supply you can count on",
      "Designed for heavy daily use",
      "Better for the planet and your budget",
    ],
    fallbackCaption: (i) => `Picture ${i + 1}`,
  },
  {
    key: "products",
    stepName: "Institutional range",
    title: "Our institutional range",
    where:
      "The product grid. Each picture sits behind a product name, from left to right, top to bottom.",
    w: 1200,
    h: 900,
    max: 6,
    captions: [
      "Jumbo Roll Tissue",
      "Interfolded Paper Towels",
      "Kitchen Towels",
      "Facial and Table Napkins",
      "Hand Soap and Sanitizer",
      "Dispensers",
    ],
    fallbackCaption: (i) => `Picture ${i + 1}`,
  },
];

const MAX_FILE_MB = 20; // keep in sync with MAX_BYTES in the Laravel controller
const CHUNK_SIZE = 1024 * 1024; // 1 MB pieces

type ImageSize = { w: number; h: number };

function fitsSlot(size: ImageSize, slot: { w: number; h: number }) {
  const ratio = size.w / size.h;
  const slotRatio = slot.w / slot.h;
  return Math.abs(ratio / slotRatio - 1) <= 0.03;
}

// Shape returned by the Laravel API.
type SavedImage = {
  id: number;
  section: SectionKey;
  image: string; // e.g. "institutional/abc123.png"
  image_url: string;
  sort_order: number;
};

type PendingImage = {
  key: string;
  file: File;
  preview: string; // object URL
  size: ImageSize | null;
};

function emptyBy<T>(): Record<SectionKey, T[]> {
  return { hero: [], story: [], products: [] };
}

function readImageSize(src: string): Promise<ImageSize | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function errorMessage(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (data?.message) return String(data.message);
  } catch {
    // keep fallback
  }
  return fallback;
}

// Sends one file as small pieces, one after another.
// Each piece is retried up to 3 times on network or server errors.
// Validation errors (4xx) are not retried because they won't fix themselves.
// Note: crypto.randomUUID needs https or localhost.
async function uploadInChunks(
  sectionKey: SectionKey,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const uploadId = crypto.randomUUID();
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  for (let index = 0; index < total; index++) {
    const piece = file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);

    let lastError = "Upload failed";
    let ok = false;

    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      let res: Response;
      try {
        const body = new FormData();
        body.append("section", sectionKey);
        body.append("upload_id", uploadId);
        body.append("index", String(index));
        body.append("total", String(total));
        body.append("chunk", piece, `${index}.part`);

        res = await fetch("/api/institutional/chunk", {
          method: "POST",
          body,
        });
      } catch {
        lastError = "Network problem. Please try again.";
        continue; // retry
      }

      if (res.ok) {
        ok = true;
        break;
      }

      lastError = await errorMessage(res, "Upload failed");
      if (res.status >= 400 && res.status < 500) {
        throw new Error(lastError); // won't fix itself, stop now
      }
      // 5xx: loop again and retry
    }

    if (!ok) throw new Error(lastError);

    onProgress?.(Math.round(((index + 1) / total) * 100));
  }
}

// Small drawing of the section so it's obvious which part of the page it is.
function Sketch({ section }: { section: SectionKey }) {
  const box = "rounded-sm bg-green-600/70";
  const line = "h-1 rounded-full bg-moss-200";
  return (
    <div
      className="w-28 shrink-0 rounded-lg border border-moss-200 bg-white p-2"
      aria-hidden
    >
      {section === "hero" && (
        <div className="space-y-1.5">
          <div className={`${box} h-10 w-full`} />
          <div className={`${line} w-2/3`} />
          <div className={`${line} w-1/3`} />
        </div>
      )}
      {section === "story" && (
        <div className="space-y-1.5">
          <div className="h-1 w-3/4 rounded-full bg-moss-300" />
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex gap-1 ${i === 1 ? "flex-row-reverse" : ""}`}
            >
              <div className={`${box} h-6 w-1/2`} />
              <div className="flex-1 space-y-1 pt-1">
                <div className={`${line} w-full`} />
                <div className={`${line} w-2/3`} />
              </div>
            </div>
          ))}
        </div>
      )}
      {section === "products" && (
        <div className="space-y-1.5">
          <div className="h-1 w-3/4 rounded-full bg-moss-300" />
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${box} h-5`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FitNote({
  size,
  slot,
}: {
  size: ImageSize | null;
  slot: { w: number; h: number };
}) {
  if (!size) return null;
  if (fitsSlot(size, slot)) return null;
  return (
    <p className="text-[11px] font-medium text-amber-700">
      {size.w} × {size.h} px: different shape, so it will be cropped. Best at{" "}
      {slot.w} × {slot.h} px.
    </p>
  );
}

function ImageTile({
  src,
  caption,
  position,
  slot,
  size,
  unsaved,
  onRemove,
}: {
  src: string;
  caption: string;
  position: number;
  slot: { w: number; h: number };
  size: ImageSize | null;
  unsaved: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div
        className="relative overflow-hidden rounded-xl bg-moss-100"
        style={{ aspectRatio: `${slot.w} / ${slot.h}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={caption} className="h-full w-full object-cover" />
        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-moss-900/80 text-[11px] font-semibold text-white">
          {position}
        </span>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-2 top-2 h-7 w-7 rounded-full bg-white/90 text-red-600 hover:bg-white"
          onClick={onRemove}
          aria-label={`Remove ${caption}`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        {unsaved && (
          <span className="absolute bottom-2 left-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
            Not saved yet
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-moss-900">{caption}</p>
      <FitNote size={size} slot={slot} />
    </div>
  );
}

export default function AdminInstitutionalPage() {
  const [items, setItems] = useState<SavedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Record<number, ImageSize | null>>({});

  const [stepIdx, setStepIdx] = useState(0);
  const [pending, setPending] =
    useState<Record<SectionKey, PendingImage[]>>(emptyBy<PendingImage>());
  const [removed, setRemoved] =
    useState<Record<SectionKey, number[]>>(emptyBy<number>());
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const section = SECTIONS[stepIdx];

  async function fetchItems() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/institutional");
      if (!res.ok) throw new Error("Failed to load images");
      const data = await res.json();

      const raw: SavedImage[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const list = raw
        .filter((i) => SECTIONS.some((s) => s.key === i.section))
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
      setItems(list);

      // Read the pixel size of each saved image so wrong shapes get flagged.
      list.forEach((img) => {
        readImageSize(img.image_url).then((size) =>
          setSizes((prev) => ({ ...prev, [img.id]: size })),
        );
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load images",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const savedKept = useMemo(() => {
    const out = emptyBy<SavedImage>();
    items.forEach((i) => {
      if (!removed[i.section].includes(i.id)) out[i.section].push(i);
    });
    return out;
  }, [items, removed]);

  const countFor = (key: SectionKey) =>
    savedKept[key].length + pending[key].length;

  const changeCount = SECTIONS.reduce(
    (n, s) => n + pending[s.key].length + removed[s.key].length,
    0,
  );

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (changeCount === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [changeCount]);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const key = section.key;
    const limit = MAX_FILE_MB * 1024 * 1024;
    const tooBig = files.filter((f) => f.size > limit);
    let accepted = files.filter((f) => f.size <= limit);
    const room = section.max - countFor(key);

    const messages: string[] = [];
    if (tooBig.length > 0) {
      messages.push(
        `Skipped (over ${MAX_FILE_MB} MB): ${tooBig.map((f) => f.name).join(", ")}`,
      );
    }
    if (accepted.length > room) {
      accepted = accepted.slice(0, Math.max(0, room));
      messages.push(`This section can hold at most ${section.max} pictures.`);
    }
    if (messages.length > 0) alert(messages.join("\n"));
    if (accepted.length === 0) return;

    const stamp = Date.now();
    const added: PendingImage[] = accepted.map((file, i) => ({
      key: `${file.name}-${file.lastModified}-${stamp}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      size: null,
    }));

    setPending((prev) => ({ ...prev, [key]: [...prev[key], ...added] }));

    await Promise.all(
      added.map(async (p) => {
        const size = await readImageSize(p.preview);
        setPending((prev) => ({
          ...prev,
          [key]: prev[key].map((img) =>
            img.key === p.key ? { ...img, size } : img,
          ),
        }));
      }),
    );
  }

  function removePending(key: SectionKey, imgKey: string) {
    setPending((prev) => {
      const target = prev[key].find((p) => p.key === imgKey);
      if (target) URL.revokeObjectURL(target.preview);
      return { ...prev, [key]: prev[key].filter((p) => p.key !== imgKey) };
    });
  }

  function removeSaved(key: SectionKey, id: number) {
    setRemoved((prev) => ({ ...prev, [key]: [...prev[key], id] }));
  }

  function undoRemovals(key: SectionKey) {
    setRemoved((prev) => ({ ...prev, [key]: [] }));
  }

  async function handleSave() {
    setIsSaving(true);
    const failures: string[] = [];
    const donePending: Record<SectionKey, string[]> = {
      hero: [],
      story: [],
      products: [],
    };
    const doneRemoved = emptyBy<boolean>();

    for (const s of SECTIONS) {
      // 1. Delete removed images
      let deletesOk = true;
      for (const id of removed[s.key]) {
        try {
          const res = await fetch(`/api/institutional/${id}`, {
            method: "DELETE",
          });
          if (!res.ok)
            throw new Error(await errorMessage(res, "Delete failed"));
        } catch (err) {
          deletesOk = false;
          failures.push(
            `${s.title}: ${err instanceof Error ? err.message : "Delete failed"}`,
          );
        }
      }
      if (deletesOk && removed[s.key].length > 0) doneRemoved[s.key].push(true);

      // 2. Upload new images in chunks, one file at a time
      for (const p of pending[s.key]) {
        try {
          await uploadInChunks(s.key, p.file, (pct) =>
            setProgress(`Uploading ${p.file.name} (${pct}%)`),
          );
          donePending[s.key].push(p.key);
        } catch (err) {
          failures.push(
            `${s.title} / ${p.file.name}: ${
              err instanceof Error ? err.message : "Upload failed"
            }`,
          );
        }
      }
    }

    // Clear whatever was saved successfully; keep the rest so nothing is lost.
    setPending((prev) => {
      const next = { ...prev };
      SECTIONS.forEach((s) => {
        const done = new Set(donePending[s.key]);
        prev[s.key].forEach((p) => {
          if (done.has(p.key)) URL.revokeObjectURL(p.preview);
        });
        next[s.key] = prev[s.key].filter((p) => !done.has(p.key));
      });
      return next;
    });
    setRemoved((prev) => {
      const next = { ...prev };
      SECTIONS.forEach((s) => {
        if (doneRemoved[s.key].length > 0) next[s.key] = [];
      });
      return next;
    });

    await fetchItems();
    setProgress(null);
    setIsSaving(false);

    if (failures.length > 0) {
      alert(`Some changes could not be saved:\n${failures.join("\n")}`);
    }
  }

  const slot = { w: section.w, h: section.h };
  const visibleSaved = savedKept[section.key];
  const visiblePending = pending[section.key];
  const total = visibleSaved.length + visiblePending.length;
  const gridCols =
    section.key === "hero"
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-2 lg:grid-cols-3";

  const captionFor = (i: number) =>
    section.captions?.[i] ?? section.fallbackCaption(i);

  return (
    <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
      <AdminSidebar />

      <main className="flex-1 px-6 py-6 md:px-8 md:py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-moss-900">
            Eco-Hygiene Institutional
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload the pictures for the institutional page. Pictures are
            optional. Anything left empty shows a green placeholder.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-moss-200 bg-white py-10 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading pictures...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {loadError}. Saved pictures can&apos;t be shown, but you can still
              pick new ones.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="bg-white"
              onClick={fetchItems}
            >
              Try again
            </Button>
          </div>
        )}

        {!isLoading && (
          <div className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            {/* Step bar */}
            <ol className="flex flex-wrap gap-2 border-b border-moss-100 px-4 py-3 sm:px-6">
              {SECTIONS.map((s, i) => {
                const current = i === stepIdx;
                const count = countFor(s.key);
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setStepIdx(i)}
                      aria-current={current ? "step" : undefined}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        current
                          ? "border-moss-900 bg-moss-900 text-white"
                          : "border-moss-200 text-moss-800 hover:bg-moss-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                          current
                            ? "bg-white text-moss-900"
                            : count > 0
                              ? "bg-green-600 text-white"
                              : "bg-moss-100 text-moss-600"
                        }`}
                      >
                        {count > 0 && !current ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      {s.stepName}
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Current section */}
            <div className="grid gap-5 p-4 sm:p-6">
              <div className="flex items-start gap-4">
                <Sketch section={section.key} />
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-moss-900">
                    {section.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {section.where}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Best size{" "}
                    <span className="font-medium text-moss-900">
                      {section.w} × {section.h} px
                    </span>
                    . JPG, PNG, or WEBP, max {MAX_FILE_MB} MB each. Up to{" "}
                    {section.max} pictures ({total} added).
                  </p>
                </div>
              </div>

              <div className={`grid gap-4 ${gridCols}`}>
                {visibleSaved.map((img, i) => (
                  <ImageTile
                    key={`saved-${img.id}`}
                    src={img.image_url}
                    caption={captionFor(i)}
                    position={i + 1}
                    slot={slot}
                    size={sizes[img.id] ?? null}
                    unsaved={false}
                    onRemove={() => removeSaved(section.key, img.id)}
                  />
                ))}

                {visiblePending.map((img, i) => (
                  <ImageTile
                    key={img.key}
                    src={img.preview}
                    caption={captionFor(visibleSaved.length + i)}
                    position={visibleSaved.length + i + 1}
                    slot={slot}
                    size={img.size}
                    unsaved
                    onRemove={() => removePending(section.key, img.key)}
                  />
                ))}

                {total < section.max && (
                  <div className="grid gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                      className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-moss-300 bg-moss-50 text-moss-700 transition-colors hover:bg-moss-100 disabled:opacity-50"
                      style={{ aspectRatio: `${section.w} / ${section.h}` }}
                    >
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs font-medium">Add pictures</span>
                      <span className="text-[11px] text-muted-foreground">
                        You can select several at once
                      </span>
                    </button>
                    {section.captions?.[total] && (
                      <p className="text-xs text-muted-foreground">
                        Next: {captionFor(total)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFiles}
              />

              {removed[section.key].length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {removed[section.key].length} picture
                  {removed[section.key].length === 1 ? "" : "s"} will be deleted
                  when you save.{" "}
                  <button
                    type="button"
                    className="font-medium text-moss-900 underline underline-offset-2"
                    onClick={() => undoRemovals(section.key)}
                  >
                    Undo
                  </button>
                </p>
              )}
            </div>

            {/* Footer: step navigation + save */}
            <div className="flex flex-col gap-3 border-t border-moss-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                  disabled={stepIdx === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setStepIdx((i) => Math.min(SECTIONS.length - 1, i + 1))
                  }
                  disabled={stepIdx === SECTIONS.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  {progress ??
                    (changeCount === 0
                      ? "All changes saved"
                      : `${changeCount} change${changeCount === 1 ? "" : "s"} not saved yet`)}
                </p>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={changeCount === 0 || isSaving}
                >
                  {isSaving && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
