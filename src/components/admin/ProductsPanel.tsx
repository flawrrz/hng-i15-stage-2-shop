"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { PackageSearch, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Product } from "@/lib/types";
import { formatNaira } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";

/** Free-text care fields; comma-separated inputs become arrays on save. */
interface CareForm {
  scientific_name: string;
  other_names: string;
  origin: string;
  watering: string;
  sunlight: string;
  soil: string;
  care_level: string;
  cycle: string;
  maintenance: string;
  growth_rate: string;
  flowering_season: string;
  indoor: boolean;
  poisonous_to_pets: boolean;
  poisonous_to_humans: boolean;
}

interface ProductForm {
  title: string;
  description: string;
  price: string;
  stock_quantity: string;
  category: string;
  image_url: string;
  care: CareForm;
}

const emptyCare: CareForm = {
  scientific_name: "",
  other_names: "",
  origin: "",
  watering: "",
  sunlight: "",
  soil: "",
  care_level: "",
  cycle: "",
  maintenance: "",
  growth_rate: "",
  flowering_season: "",
  indoor: false,
  poisonous_to_pets: false,
  poisonous_to_humans: false,
};

const emptyForm: ProductForm = {
  title: "",
  description: "",
  price: "",
  stock_quantity: "0",
  category: "",
  image_url: "",
  care: emptyCare,
};

/** Split "a, b, c" into a clean array (empty string → empty array). */
function toList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** Read the care JSONB back into editable form strings. */
function careToForm(care: Product["care_details"]): CareForm {
  if (!care) return emptyCare;
  return {
    scientific_name: care.scientific_name ?? "",
    other_names: (care.other_names ?? []).join(", "),
    origin: (care.origin ?? []).join(", "),
    watering: care.watering ?? "",
    sunlight: (care.sunlight ?? []).join(", "),
    soil: (care.soil ?? []).join(", "),
    care_level: care.care_level ?? "",
    cycle: care.cycle ?? "",
    maintenance: care.maintenance ?? "",
    growth_rate: care.growth_rate ?? "",
    flowering_season: care.flowering_season ?? "",
    indoor: Boolean(care.indoor),
    poisonous_to_pets: Boolean(care.poisonous_to_pets),
    poisonous_to_humans: Boolean(care.poisonous_to_humans),
  };
}

/** Assemble the JSONB payload; returns null when every field is blank. */
function formToCare(care: CareForm): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  if (care.scientific_name.trim()) out.scientific_name = care.scientific_name.trim();
  const lists: [keyof CareForm, string][] = [
    ["other_names", "other_names"],
    ["origin", "origin"],
    ["sunlight", "sunlight"],
    ["soil", "soil"],
  ];
  for (const [key, jsonKey] of lists) {
    const list = toList(String(care[key]));
    if (list.length) out[jsonKey] = list;
  }
  for (const key of [
    "watering",
    "care_level",
    "cycle",
    "maintenance",
    "growth_rate",
    "flowering_season",
  ] as const) {
    const value = care[key].trim();
    if (value) out[key] = value;
  }
  // Only store toxicity flags when true — an absent key reads the same as
  // false in the UI and keeps the JSONB lean.
  if (care.indoor) out.indoor = true;
  if (care.poisonous_to_pets) out.poisonous_to_pets = true;
  if (care.poisonous_to_humans) out.poisonous_to_humans = true;
  return Object.keys(out).length ? out : null;
}

interface Props {
  /** Refreshes the dashboard's stat counters after create/delete. */
  onChanged: () => void;
}

export function ProductsPanel({ onChanged }: Props) {
  const pushToast = useToastStore((state) => state.push);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetches the list; every setState happens inside a promise callback so the
  // function is safe to call from the mount effect (the
  // react-hooks/set-state-in-effect rule rejects synchronous updates).
  const load = useCallback(() => {
    fetch("/api/admin/products")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setProducts(json.products);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        console.error("products load:", err);
        setLoadError(err instanceof Error ? err.message : "Could not load plants.");
      })
      .finally(() => setLoading(false));
  }, []);

  /** Manual refresh with the loading state — click handlers only. */
  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description ?? "",
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      category: product.category ?? "",
      image_url: product.image_url ?? "",
      care: careToForm(product.care_details),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async () => {
    setFormError(null);
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be a positive number (₦).");
      return;
    }
    const stock = Number(form.stock_quantity);
    if (!Number.isInteger(stock) || stock < 0) {
      setFormError("Stock must be a whole number ≥ 0.");
      return;
    }

    setSaving(true);
    try {
      const care = formToCare(form.care);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price,
        stock_quantity: stock,
        category: form.category.trim() || null,
        image_url: form.image_url.trim() || null,
        care_details: care,
      };

      const res = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);

      pushToast(editingId ? "Plant updated ✓" : "Plant added ✓");
      setFormOpen(false);
      await load();
      onChanged();
    } catch (err) {
      console.error("product save:", err);
      setFormError(err instanceof Error ? err.message : "Could not save the plant.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      pushToast("Plant deleted");
      await load();
      onChanged();
    } catch (err) {
      console.error("product delete:", err);
      window.alert(
        err instanceof Error ? err.message : "Could not delete the plant."
      );
    }
  };

  const visible = products.filter((product) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      product.title.toLowerCase().includes(needle) ||
      (product.category ?? "").toLowerCase().includes(needle)
    );
  });

  const inputClass =
    "w-full px-3 py-2.5 border border-line rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf";

  const textInputs: [keyof ProductForm & string, string, string][] = [
    ["title", "Title *", "e.g. Monstera Deliciosa"],
    ["category", "Category", "Indoor, Succulents, Ferns…"],
    ["price", "Price (₦) *", "15500"],
    ["stock_quantity", "Stock quantity *", "12"],
    ["image_url", "Image URL", "https://…supabase.co/storage/…"],
  ];

  const careTextInputs: [keyof CareForm, string, string][] = [
    ["scientific_name", "Scientific name", "Monstera deliciosa"],
    ["watering", "Watering", "Average"],
    ["care_level", "Care level", "Moderate"],
    ["cycle", "Cycle", "Perennial"],
    ["maintenance", "Maintenance", "Low"],
    ["growth_rate", "Growth rate", "Fast"],
    ["flowering_season", "Flowering season", "Spring"],
    ["sunlight", "Sunlight (comma list)", "partial-shade, indirect"],
    ["soil", "Soil (comma list)", "well-drained, sandy"],
    ["other_names", "Other names (comma list)", "Swiss cheese plant"],
    ["origin", "Origin (comma list)", "Mexico, Panama"],
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search plants…"
            aria-label="Search plants"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={retry}
            aria-label="Reload plants"
            className="p-2.5 rounded-lg border border-line bg-white text-ink-soft hover:text-ink transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" aria-hidden="true" />
            New Plant
          </Button>
        </div>
      </div>

      {/* Create / edit form */}
      {formOpen && (
        <section className="bg-white border border-line rounded-2xl p-5 sm:p-6" aria-label="Plant form">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">
              {editingId ? "Edit Plant" : "New Plant"}
            </h2>
            <button
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="p-1.5 rounded-lg text-ink-soft hover:bg-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <p role="alert" className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {formError}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {textInputs.map(([key, label, placeholder]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-ink mb-1" htmlFor={`f-${key}`}>
                  {label}
                </label>
                <input
                  id={`f-${key}`}
                  type="text"
                  inputMode={key === "price" || key === "stock_quantity" ? "numeric" : undefined}
                  value={form[key] as string}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [key]: event.target.value }))
                  }
                  placeholder={placeholder}
                  className={inputClass}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1" htmlFor="f-description">
                Description
              </label>
              <textarea
                id="f-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="What makes this plant special…"
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Care details — maps to the care_details JSONB column */}
          <details className="mt-5 border-t border-line pt-4">
            <summary className="cursor-pointer font-medium text-ink text-sm select-none">
              Care details (shown on the product page)
            </summary>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {careTextInputs.map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-ink mb-1" htmlFor={`c-${key}`}>
                    {label}
                  </label>
                  <input
                    id={`c-${key}`}
                    type="text"
                    value={form.care[key] as string}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        care: { ...prev.care, [key]: event.target.value },
                      }))
                    }
                    placeholder={placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
              {(
                [
                  ["indoor", "Suitable indoors"],
                  ["poisonous_to_pets", "Toxic to pets"],
                  ["poisonous_to_humans", "Toxic to humans"],
                ] as [keyof CareForm, string][]
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.care[key] as boolean}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        care: { ...prev.care, [key]: event.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-[#486C49]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </details>

          <div className="flex gap-3 mt-6">
            <Button onClick={save} isLoading={saving}>
              {editingId ? "Save Changes" : "Add Plant"}
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {/* States */}
      {loading && (
        <p className="text-ink-soft text-sm py-8 text-center">Loading plants…</p>
      )}
      {loadError && !loading && (
        <div className="text-center py-10 bg-white border border-line rounded-2xl">
          <PackageSearch className="w-10 h-10 text-leaf-soft mx-auto mb-3" aria-hidden="true" />
          <p className="text-ink-soft text-sm mb-4">{loadError}</p>
          <Button variant="outline" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {/* List */}
      {!loading && !loadError && (
        <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
          {visible.length === 0 && (
            <p className="text-ink-soft text-sm text-center py-10 px-4">
              {search ? "No plants match that search." : "No plants yet — add your first one."}
            </p>
          )}

          {visible.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center gap-4 p-4 hover:bg-surface/60 transition-colors"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface shrink-0">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt=""
                    width={48}
                    height={48}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PackageSearch className="w-5 h-5 text-leaf-soft m-auto" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-[140px]">
                <p className="font-medium text-ink text-sm leading-tight">{product.title}</p>
                <p className="text-xs text-ink-soft">
                  {product.category ?? "Uncategorised"}
                  {product.care_details?.scientific_name && (
                    <> · <span className="italic">{product.care_details.scientific_name}</span></>
                  )}
                </p>
              </div>

              <div className="text-right w-24">
                <p className="text-sm font-medium text-ink">{formatNaira(product.price)}</p>
                <p
                  className={`text-xs ${
                    product.stock_quantity === 0
                      ? "text-red-600"
                      : product.stock_quantity < 5
                        ? "text-orange-600"
                        : "text-leaf"
                  }`}
                >
                  {product.stock_quantity === 0 ? "Out of stock" : `${product.stock_quantity} in stock`}
                </p>
              </div>

              <div className="flex gap-1 ml-auto">
                <button
                  onClick={() => openEdit(product)}
                  aria-label={`Edit ${product.title}`}
                  className="p-2 rounded-lg text-ink-soft hover:text-leaf hover:bg-mint/50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(product)}
                  aria-label={`Delete ${product.title}`}
                  className="p-2 rounded-lg text-ink-soft hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
