import { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "All Products - Shop",
  description: "Browse our complete collection of curated products.",
};

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

// Mock products for development
const mockProducts: Product[] = [
  {
    id: "1",
    title: "Classic Cotton T-Shirt",
    description: "Premium quality cotton t-shirt with a comfortable fit. Perfect for everyday wear.",
    price: 29.99,
    stock_quantity: 50,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    category: "Clothing",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    price: 149.99,
    stock_quantity: 25,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Minimalist Leather Wallet",
    description: "Handcrafted genuine leather wallet with RFID protection. Slim design fits in any pocket.",
    price: 49.99,
    stock_quantity: 30,
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop",
    category: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Ceramic Coffee Mug Set",
    description: "Set of 4 handcrafted ceramic mugs. Microwave and dishwasher safe.",
    price: 34.99,
    stock_quantity: 40,
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop",
    category: "Home",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Stainless Steel Water Bottle",
    description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours.",
    price: 24.99,
    stock_quantity: 60,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    category: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Organic Cotton Hoodie",
    description: "Cozy organic cotton hoodie with brushed interior. Ethically manufactured.",
    price: 69.99,
    stock_quantity: 35,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop",
    category: "Clothing",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Bamboo Cutting Board",
    description: "Eco-friendly bamboo cutting board with juice groove. Gentle on knives.",
    price: 22.99,
    stock_quantity: 45,
    image_url: "https://images.unsplash.com/photo-1584990347449-1514a8a7377e?w=400&h=400&fit=crop",
    category: "Home",
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    title: "Smart Watch Series 5",
    description: "Advanced health tracking, GPS, and cellular connectivity. Water resistant to 50m.",
    price: 399.99,
    stock_quantity: 15,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Electronics",
    created_at: new Date().toISOString(),
  },
  {
    id: "9",
    title: "Linen Throw Blanket",
    description: "Lightweight linen throw perfect for all seasons. Gets softer with every wash.",
    price: 54.99,
    stock_quantity: 20,
    image_url: "https://images.unsplash.com/photo-1608028200219-6b7d4e1d1b1e?w=400&h=400&fit=crop",
    category: "Home",
    created_at: new Date().toISOString(),
  },
  {
    id: "10",
    title: "Canvas Tote Bag",
    description: "Durable canvas tote with leather handles. Perfect for groceries or daily use.",
    price: 39.99,
    stock_quantity: 40,
    image_url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    category: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "11",
    title: "Desk Lamp with Wireless Charging",
    description: "Modern LED desk lamp with built-in Qi wireless charger and adjustable brightness.",
    price: 79.99,
    stock_quantity: 25,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    category: "Electronics",
    created_at: new Date().toISOString(),
  },
  {
    id: "12",
    title: "Wool Beanie",
    description: "100% merino wool beanie. Warm, breathable, and naturally odor-resistant.",
    price: 28.99,
    stock_quantity: 55,
    image_url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop",
    category: "Clothing",
    created_at: new Date().toISOString(),
  },
];

export default async function ProductsPage() {
  let products = await getProducts();

  if (products.length === 0) {
    products = mockProducts;
  }

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="bg-gray-50 border-b border-gray-100 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">All Products</h1>
            <p className="text-lg text-gray-500">
              Discover our complete collection of curated quality products.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg">All</button>
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="sort" className="text-sm text-gray-500">Sort by:</label>
              <select
                id="sort"
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Empty State */}
          {products.length === 0 && (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No products found</h2>
              <p className="text-gray-500">We couldn't find any products matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="text-gray-300 text-lg mb-8">
            Get 10% off your first order when you subscribe to our newsletter.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" action="/api/newsletter" method="POST">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-500"
            />
            <button type="submit" className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}