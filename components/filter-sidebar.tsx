"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BRANDS } from "@/types/product";
import { getBrandTypes } from "@/lib/product-types";

export type Filters = {
  brands: string[];
  types: string[];
  maxPrice: number;
  inStockOnly: boolean;
  onSaleOnly: boolean;
};

const MAX_PRICE_CEILING = 10000;

export const DEFAULT_FILTERS: Filters = {
  brands: [],
  types: [],
  maxPrice: MAX_PRICE_CEILING,
  inStockOnly: false,
  onSaleOnly: false,
};

// Separate brand entry for Fresh toothbrush products.
export const FRESH_TOOTHBRUSH = "Fresh Toothbrush";

// Brand list shown in the sidebar: "Fresh Toothbrush" goes right after "Fresh".
const SIDEBAR_BRANDS: string[] = (() => {
  const list: string[] = [...BRANDS];
  if (list.includes(FRESH_TOOTHBRUSH)) return list;
  const i = list.findIndex((b) => b.trim().toLowerCase() === "fresh");
  if (i === -1) list.push(FRESH_TOOTHBRUSH);
  else list.splice(i + 1, 0, FRESH_TOOTHBRUSH);
  return list;
})();

export function FilterSidebar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const toggleBrand = (brand: string) => {
    const isOn = filters.brands.includes(brand);
    const brands = isOn
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    // Pag na-uncheck ang brand, tanggalin din ang mga type niya.
    const types = isOn
      ? filters.types.filter((t) => !getBrandTypes(brand).includes(t))
      : filters.types;
    onChange({ ...filters, brands, types });
  };

  const toggleType = (brand: string, type: string) => {
    const isOn = filters.types.includes(type);
    const types = isOn
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    // Pag may pinili na type, awtomatikong i-check ang brand niya para
    // hindi maapektuhan ang ibang brands sa listahan.
    const brands =
      !isOn && !filters.brands.includes(brand)
        ? [...filters.brands, brand]
        : filters.brands;
    onChange({ ...filters, brands, types });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-moss-900">
        <SlidersHorizontal className="h-4 w-4" />
        <h3 className="font-display text-lg font-semibold">Filter results</h3>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-moss-800">Max price</p>
        <Slider
          value={[filters.maxPrice]}
          max={MAX_PRICE_CEILING}
          step={100}
          onValueChange={([v]) => onChange({ ...filters, maxPrice: v })}
        />
        <p className="text-xs text-muted-foreground">
          Up to ₱{filters.maxPrice}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-sm font-semibold text-moss-800">Brand</p>
        <div className="space-y-2.5">
          {SIDEBAR_BRANDS.map((brand) => {
            const checked = filters.brands.includes(brand);
            const typeOptions = getBrandTypes(brand);

            return (
              <div key={brand}>
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={checked}
                    onCheckedChange={() => toggleBrand(brand)}
                  />
                  <Label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-normal text-moss-800"
                  >
                    {brand}
                  </Label>
                </div>

                {/* Lalabas lang ang sub-categories kapag naka-check ang brand */}
                {checked && typeOptions.length > 0 && (
                  <div className="ml-2 mt-2.5 space-y-2.5 border-l border-[#C6C8C5] pl-4">
                    {typeOptions.map((type) => (
                      <div key={type} className="flex items-center gap-2.5">
                        <Checkbox
                          id={`type-${brand}-${type}`}
                          checked={filters.types.includes(type)}
                          onCheckedChange={() => toggleType(brand, type)}
                        />
                        <Label
                          htmlFor={`type-${brand}-${type}`}
                          className="text-xs font-normal text-moss-800"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(v) => onChange({ ...filters, inStockOnly: !!v })}
          />
          <Label
            htmlFor="in-stock"
            className="text-sm font-normal text-moss-800"
          >
            In stock only
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="on-sale"
            checked={filters.onSaleOnly}
            onCheckedChange={(v) => onChange({ ...filters, onSaleOnly: !!v })}
          />
          <Label
            htmlFor="on-sale"
            className="text-sm font-normal text-moss-800"
          >
            On sale
          </Label>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => onChange(DEFAULT_FILTERS)}
      >
        Clear filters
      </Button>
    </div>
  );
}
