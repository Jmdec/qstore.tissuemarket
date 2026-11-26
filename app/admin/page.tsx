"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  PackageX,
  Tags,
  Star,
  ArrowUpRight,
  Wallet,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, type Product } from "@/types/product";
import { formatPHP } from "@/lib/utils";

const IMAGE_URL = process.env.NEXT_PUBLIC_IMAGE_URL ?? "";

const PIE_COLORS = [
  "#16a34a", // green-600
  "#84cc16", // lime-500
  "#f59e0b", // amber-500
  "#0ea5e9", // sky-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
];

type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
};

type BestSeller = {
  product_id: number;
  name: string;
  qty_sold: number;
  revenue: number;
};

type CategorySales = {
  category: string;
  revenue: number;
};

type Stats = {
  total_sales: number;
  total_orders: number;
  avg_order_value: number;
  revenue_series: RevenuePoint[];
  best_sellers: BestSeller[];
  sales_by_category: CategorySales[];
};

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [productsRes, statsRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/admin/stats?days=30", { cache: "no-store" }),
        ]);

        const productsData = await productsRes.json();
        const statsData = await statsRes.json();

        if (!cancelled) {
          setProducts(
            Array.isArray(productsData.products) ? productsData.products : [],
          );
          setStats(statsRes.ok ? statsData : null);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalProducts = products.length;
  const outOfStock = products.filter((p) => !p.inStock || p.stock <= 0).length;
  const inStock = totalProducts - outOfStock;
  const avgRating =
    totalProducts > 0
      ? products.reduce((sum, p) => sum + p.rating, 0) / totalProducts
      : 0;

  const categoryCounts = CATEGORIES.map((cat) => ({
    category: cat,
    count: products.filter((p) => p.category === cat).length,
  }));

  const lowStockOrOut = products
    .filter((p) => !p.inStock || p.stock <= 0)
    .slice(0, 5);

  const revenueSeries = (stats?.revenue_series ?? []).map((point) => ({
    ...point,
    label: formatShortDate(point.date),
  }));

  const bestSellers = stats?.best_sellers ?? [];
  const salesByCategory = stats?.sales_by_category ?? [];

  const salesStats = [
    {
      label: "Total Sales",
      value: stats ? formatPHP(stats.total_sales) : "—",
      icon: Wallet,
      accent: "bg-green-600",
    },
    {
      label: "Paid Orders",
      value: stats ? stats.total_orders : "—",
      icon: Receipt,
      accent: "bg-emerald-500",
    },
    {
      label: "Avg. Order Value",
      value: stats ? formatPHP(stats.avg_order_value) : "—",
      icon: TrendingUp,
      accent: "bg-lime-500",
    },
  ];

  const catalogStats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      accent: "bg-sky-600",
    },
    {
      label: "In Stock",
      value: inStock,
      icon: Tags,
      accent: "bg-teal-500",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: PackageX,
      accent: "bg-red-500",
    },
    {
      label: "Avg. Rating",
      value: totalProducts > 0 ? avgRating.toFixed(1) : "—",
      icon: Star,
      accent: "bg-amber-400",
    },
  ];

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
        <AdminSidebar />
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-moss-100 sm:h-28"
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
        <AdminSidebar />
        <main className="flex flex-1 items-center justify-center px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          <p className="text-center text-sm text-muted-foreground">
            Couldn&apos;t load dashboard data. Please refresh.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-moss-50/40 md:flex-row">
      <AdminSidebar />

      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
        <div className="mb-5 flex flex-col gap-1 sm:mb-6">
          <h1 className="font-display text-xl font-semibold text-moss-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your catalog and sales, last 30 days.
          </p>
        </div>

        {/* Sales stat cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {salesStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-moss-100 bg-card p-3.5 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs">
                  {stat.label}
                </span>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white sm:h-8 sm:w-8 ${stat.accent}`}
                >
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <p className="mt-2 font-display text-xl font-semibold text-moss-900 sm:mt-3 sm:text-2xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Catalog stat cards */}
        <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-4">
          {catalogStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-moss-100 bg-card p-3.5 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground sm:text-xs">
                  {stat.label}
                </span>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white sm:h-8 sm:w-8 ${stat.accent}`}
                >
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-moss-900 sm:mt-3 sm:text-3xl">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue over time */}
        <div className="mt-4 rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:mt-6 sm:p-5">
          <h2 className="font-display text-base font-semibold text-moss-900">
            Revenue (last 30 days)
          </h2>
          <div className="mt-4 h-64 w-full sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueSeries} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e2" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={56}
                  tickFormatter={(v) => formatPHP(v)}
                />
                <Tooltip formatter={(value) => formatPHP(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders count over time */}
        <div className="mt-4 rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-display text-base font-semibold text-moss-900">
            Orders per Day
          </h2>
          <div className="mt-4 h-56 w-full sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e2" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-2">
          {/* Best sellers */}
          <div className="rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:p-5">
            <h2 className="font-display text-base font-semibold text-moss-900">
              Best Sellers
            </h2>
            {bestSellers.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No paid orders yet.
              </p>
            ) : (
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bestSellers}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e2" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={110}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="qty_sold"
                      name="Units sold"
                      fill="#16a34a"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Sales by category */}
          <div className="rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:p-5">
            <h2 className="font-display text-base font-semibold text-moss-900">
              Sales by Category
            </h2>
            {salesByCategory.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No paid orders yet.
              </p>
            ) : (
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry: { name?: string }) => entry.name ?? ""}
                    >
                      {salesByCategory.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPHP(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-5">
          {/* Category breakdown (catalog, not sales) */}
          <div className="rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:p-5 lg:col-span-2">
            <h2 className="font-display text-base font-semibold text-moss-900">
              Products by Category
            </h2>
            <div className="mt-4 space-y-3">
              {categoryCounts.map(({ category, count }) => {
                const pct =
                  totalProducts > 0
                    ? Math.round((count / totalProducts) * 100)
                    : 0;
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-moss-800">
                        {category}
                      </span>
                      <span className="text-muted-foreground">
                        {count} items
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-moss-100">
                      <div
                        className="h-full rounded-full bg-green-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Needs attention */}
          <div className="rounded-2xl border border-moss-100 bg-card p-4 shadow-sm sm:p-5 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-moss-900">
                Needs Attention
              </h2>
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:underline"
              >
                Manage products <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {lowStockOrOut.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Everything is currently in stock. Nice work.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {lowStockOrOut.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-moss-100 p-2.5"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                      <Image
                        src={`${IMAGE_URL}${product.image}`}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-moss-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.brand} &middot; {formatPHP(product.price)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-red-200 bg-red-50 text-red-600"
                    >
                      Out of stock
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
