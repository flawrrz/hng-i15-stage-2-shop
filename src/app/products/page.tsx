import { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "All Products - Shop",
  description: "Browse our complete collection of curated products.",
};

interface ProductsPageProps {
  searchParams?: Promise<{ search?: string }>;
}

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data || [];
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const searchTerm = params?.search?.trim() || "";
  const normalizedSearch = searchTerm.toLowerCase();
  const products = await getProducts();

  const filteredProducts = normalizedSearch
    ? products.filter((product) =>
        [product.title, product.description, product.category]
          .filter((value): value is string => typeof value === "string")
          .some((value) => value.toLowerCase().includes(normalizedSearch))
      )
    : products;

  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gray-50 border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              All Products
            </h1>
            <p className="text-lg text-gray-500">
              {searchTerm
                ? `Showing results for "${searchTerm}".`
                : "Discover our complete collection of curated quality products."}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                No products found
              </h2>
              <p className="text-gray-500">
                Try a different search term or browse all products.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-gray-300 text-lg mb-8">
            Get 10% off your first order when you subscribe to our newsletter.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            action="/api/newsletter"
            method="POST"
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
