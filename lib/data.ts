import { Product } from "@/context/CartContext";

export const categories = [
  { name: "Paper", href: "/collections/paper" },
  { name: "Personal Care", href: "/collections/personal-care" },
  { name: "Oral Care", href: "/collections/oral-care" },
];

export const brands = [
  // Paper Category
  { name: "Fresh", href: "/collections/fresh", category: "Paper" },
  { name: "Kami", href: "/collections/kami", category: "Paper" },
  {
    name: "Smart Choice",
    href: "/collections/smart-choice",
    category: "Paper",
  },
  { name: "Vanitá", href: "/collections/vanita", category: "Paper" },
  { name: "Harmony", href: "/collections/harmony", category: "Paper" },

  // Personal Care Category
  {
    name: "Sweetbaby",
    href: "/collections/sweetbaby",
    category: "Personal Care",
  },
  {
    name: "PrimeCare",
    href: "/collections/primecare",
    category: "Personal Care",
  },
  {
    name: "Life Defender",
    href: "/collections/life-defender",
    category: "Personal Care",
  },

  // Oral Care Category
  {
    name: "Fresh Toothbrush",
    href: "/collections/fresh-toothbrush",
    category: "Oral Care",
  },
  { name: "TeaBiotic", href: "/collections/teabiotic", category: "Oral Care" },
];

export const products: Product[] = [
  {
    id: "qp-001",
    name: "Quanta Bamboo Facial Tissue (1 Box)",
    price: 78,
    unit: "box",
    image:
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-002",
    name: "Quanta Interfolded Paper Towels (1 Pack)",
    price: 60,
    unit: "pack",
    image:
      "https://images.unsplash.com/photo-1583947581924-860bda6a26df?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-003",
    name: "Quanta Recycled Kitchen Roll (Twin)",
    price: 145,
    unit: "twin roll",
    image:
      "https://images.unsplash.com/photo-1615486364587-9bc35eb7e6b4?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-004",
    name: "Quanta Compostable Trash Bags (10 pcs)",
    price: 89,
    unit: "pack",
    image:
      "https://images.unsplash.com/photo-1610557892470-55d587c8a1e7?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-005",
    name: "Quanta Bamboo Cleansing Wipes (15 sheets)",
    price: 35,
    unit: "pack",
    image:
      "https://images.unsplash.com/photo-1626015449568-1f43dc178e10?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-006",
    name: "Quanta Plant-Fibre Baby Wipes (90 sheets)",
    price: 110,
    unit: "pack",
    image:
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-007",
    name: "Quanta Econo Facial Tissue Box",
    price: 53,
    unit: "box",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "qp-008",
    name: "Quanta Cotton Round Pads (100 pcs)",
    price: 97,
    unit: "pack",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=800&auto=format&fit=crop",
  },
];
