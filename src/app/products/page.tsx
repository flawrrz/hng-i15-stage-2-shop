import { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { LoadError } from "@/components/LoadError";
import { NewsletterForm } from "@/components/NewsletterForm";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "All Products - Shop",
  description: "Browse our complete collection of curated products.",
};

interface ProductsPageProps {
  searchParams?: Promise<{ search?: string; category?: string; sort?: string }>;
}

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // Log the detail for the server console, then THROW so the catch in the
    // page component below flips loadFailed and renders the retryable
    // LoadError UI. Returning [] here used to render the "No products found
    // — try a different search term" empty state, i.e. an outage that looked
    // exactly like an empty shop.
    console.error("Error fetching products:", error);
    throw new Error("Could not load products from the database.");
  }

  return data || [];
}

/** Accepted values of the ?sort= URL parameter. The default ("featured")
 *  keeps the newest-first order the query already returns. */
const SORT_OPTIONS = [
  { key: "", label: "Featured" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
] as const;

interface Filters {
  search?: string;
  category?: string;
  sort?: string;
}

/**
 * Builds a /products href for the filter chips. Current params are carried
 * over by default so category, sort and search compose instead of resetting
 * each other; pass null to clear one.
 */
function buildHref(current: Filters, patch: { category?: string | null; sort?: string | null } = {}): string {
  const next: Filters = {
    search: current.search,
    category: "category" in patch ? (patch.category ?? undefined) : current.category,
    sort: "sort" in patch ? (patch.sort ?? undefined) : current.sort,
  };
  const params = new URLSearchParams();
  if (next.search?.trim()) params.set("search", next.search.trim());
  if (next.category) params.set("category", next.category);
  if (next.sort) params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/products?${query}` : "/products";
}

const chipClass = (active: boolean): string =>
  `px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
    active
      ? "bg-black text-white border-black"
      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
  }`;

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const searchTerm = params?.search?.trim() || "";
  const normalizedSearch = searchTerm.toLowerCase();
  const activeCategory = params?.category?.trim() || "";
  const activeSort = SORT_OPTIONS.some((option) => option.key === (params?.sort || ""))
    ? params?.sort || ""
    : "";
  // getProducts logs the detail and throws; catch here so a failed fetch
  // shows the retryable LoadError below instead of the misleading
  // "No products found" empty state (which looked like an empty shop).
  let loadFailed = false;
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    loadFailed = true;
  }

  // Categories come from the data itself (not a hardcoded list) so a chip
  // can never link to a filter that matches nothing because the list went
  // stale after the catalog changed.
  const categories = [...new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))].sort(
    (a, b) => a.localeCompare(b)
  );

  const activeCategoryLabel =
    categories.find((c) => c.toLowerCase() === activeCategory.toLowerCase()) ?? activeCategory;

  // Search and category compose: both must match for a card to show.
  let filteredProducts = products;
  if (normalizedSearch) {
    filteredProducts = filteredProducts.filter((product) =>
      [product.title, product.description, product.category]
        .filter((value): value is string => typeof value === "string")
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }
  if (activeCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => (product.category ?? "").toLowerCase() === activeCategory.toLowerCase()
    );
  }

  // Sorting (the base query is already newest-first, which is the default).
  if (activeSort === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (activeSort === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  const filters: Filters = { search: searchTerm, category: activeCategory, sort: activeSort };

  // Heading / subtitle reflect what's actually being shown.
  const heading = activeCategory ? activeCategoryLabel : "All Products";
  const context: string[] = [];
  if (searchTerm) context.push(`Showing results for "${searchTerm}"`);
  if (activeCategory) context.push(searchTerm ? `in ${activeCategoryLabel}` : `Browsing ${activeCategoryLabel}`);
  const subtitle =
    context.length > 0
      ? `${context.join(" ")}.`
      : "Discover our complete collection of curated quality products.";

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gray-50 border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{heading}</h1>
            <p className="text-lg text-gray-500">{subtitle}</p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loadFailed ? (
          <LoadError what="products" />
        ) : (
          <>
          {/* Category chips — server-rendered links, so the filtered state is
              shareable/bookmarkable and works without JavaScript. */}
          <nav aria-label="Filter by category" className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href={buildHref(filters, { category: null })}
              aria-current={!activeCategory ? "page" : undefined}
              className={chipClass(!activeCategory)}
            >
              All
            </Link>
            {categories.map((category) => {
              const isActive = category.toLowerCase() === activeCategory.toLowerCase();
              return (
                <Link
                  key={category}
                  href={buildHref(filters, { category: category.toLowerCase() })}
                  aria-current={isActive ? "page" : undefined}
                  className={chipClass(isActive)}
                >
                  {category}
                </Link>
              );
            })}
          </nav>

          <nav aria-label="Sort products" className="flex flex-wrap items-center gap-2 mb-6 text-sm">
            <span className="text-gray-500">Sort:</span>
            {SORT_OPTIONS.map((option) => (
              <Link
                key={option.key}
                href={buildHref(filters, { sort: option.key || null })}
                aria-current={activeSort === option.key ? "page" : undefined}
                className={chipClass(activeSort === option.key)}
              >
                {option.label}
              </Link>
            ))}
          </nav>

          <div className="mb-6 text-sm text-gray-500">
            {filteredProducts.length} product
            {filteredProducts.length === 1 ? "" : "s"} found
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm
                  ? "No products found"
                  : activeCategory
                    ? `Nothing in ${activeCategoryLabel} yet`
                    : "No products found"}
              </h2>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try a different search term or browse all products."
                  : "Check back soon — new items land every week."}
              </p>
              {(searchTerm || activeCategory) && (
                <Link
                  href="/products"
                  className="inline-block mt-5 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  View all products
                </Link>
              )}
            </div>
          )}
          </>
        )}
        </div>
      </section>

      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-gray-300 text-lg mb-8">
            Get 10% off your first order when you subscribe to our newsletter.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
