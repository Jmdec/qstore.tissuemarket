import type { Product } from "@/types/product";

type TypeRule = { label: string; keywords: string[] };

// Key = brand name, lowercase, walang spaces, walang accents/symbols.
// Ang ORDER ng rules ay mahalaga: first match wins.
// Ang mga specific na rule ay nasa taas; ang catch-all ("regular") ay nasa dulo.

// Shared na sub-categories para sa Kami, Smart Choice, Vanita, at Harmony.
// Kapag iba ang types ng isang brand, gumawa ng sarili niyang array sa ibaba.
const COMMON_RULES: TypeRule[] = [
  { label: "Interfolded Paper Towel", keywords: ["interfold"] },
  {
    label: "Bathroom Tissue",
    keywords: ["bathroom", "bath tissue", "toilet"],
  },
  { label: "Kitchen Towel", keywords: ["kitchen"] },
  { label: "Facial Tissue", keywords: ["facial"] },
];

const SWEETBABY_RULES: TypeRule[] = [
  { label: "Sweet Baby Wipes", keywords: ["wipes"] },
  { label: "Sweet Baby Regular Pants", keywords: ["pants"] },
  { label: "Sweet Baby Plus", keywords: ["plus"] },
  { label: "Sweet Baby Dry", keywords: ["dry"] },
  {
    // Pack sizes lang, walang "regular", para hindi makuha ang ibang Regular products.
    label: "Sweet Baby Clothlike Taped",
    keywords: [
      "clothlike",
      "cloth-like",
      "cloth like",
      "mini pack",
      "travel pack",
      "big pack",
      "econo pack",
      "jumbo pack",
      "newborn kit",
    ],
  },
];

const TYPE_RULES: Record<string, TypeRule[]> = {
  fresh: [
    { label: "Interfolded Paper Towel", keywords: ["interfold"] },
    {
      label: "Bathroom Tissue",
      keywords: ["bathroom", "bath tissue", "toilet"],
    },
    { label: "Kitchen Towel", keywords: ["kitchen"] },
    { label: "Facial Tissue", keywords: ["facial"] },
  ],
  sweetbaby: SWEETBABY_RULES,
  sbr: SWEETBABY_RULES, // alias kung "SBR" ang naka-save sa admin
  sweetbabydiapers: SWEETBABY_RULES, // alias kung "Sweet Baby Diapers"
  kami: COMMON_RULES,
  smartchoice: COMMON_RULES,
  vanita: COMMON_RULES,
  harmony: COMMON_RULES,
};

// "Vanitá", "Vanita", "Smart-Choice", "Smart Choice™" -> pare-parehong key.
const brandKey = (brand: string) =>
  brand
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // alisin ang accents (á, à, é, ...)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // alisin lahat ng hindi letter/number

/** Type options na ipapakita sa sidebar para sa isang brand. */
export const getBrandTypes = (brand: string): string[] =>
  (TYPE_RULES[brandKey(brand)] ?? []).map((r) => r.label);

/** Hinuhulaan ang type ng product base sa pangalan niya. */
export const getProductType = (p: Product): string | null => {
  const rules = TYPE_RULES[brandKey(p.brand ?? "")];
  if (!rules) return null;
  const name = (p.name ?? "").toLowerCase();
  return (
    rules.find((r) => r.keywords.some((k) => name.includes(k)))?.label ?? null
  );
};
