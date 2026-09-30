import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching product:", error);
    return null;
  }

  return data;
}

// Mock products for development
const mockProducts: Product[] = [
  {
    id: "1",
    title: "Classic Cotton T-Shirt",
    description: "Premium quality cotton t-shirt with a comfortable fit. Perfect for everyday wear. Made from 100% organic cotton that gets softer with every wash. Features a classic crew neck and relaxed fit that works for any body type.",
    price: 29.99,
    stock_quantity: 50,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
    category: "Clothing",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with active noise cancellation and 30-hour battery life. Features premium drivers for rich, detailed sound. Comfortable over-ear design with memory foam ear cushions. Includes carrying case and USB-C charging cable.",
    price: 149.99,
    stock_quantity: 25,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    category: "Electronics",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Minimalist Leather Wallet",
    description: "Handcrafted genuine leather wallet with RFID protection. Slim design fits in any pocket while holding up to 8 cards and cash. Made from full-grain leather that develops a beautiful patina over time. Includes a pull-tab for quick card access.",
    price: 49.99,
    stock_quantity: 30,
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop",
    category: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Ceramic Coffee Mug Set",
    description: "Set of 4 handcrafted ceramic mugs. Microwave and dishwasher safe. Each mug holds 12oz and features a comfortable handle. The reactive glaze creates unique patterns on each piece. Perfect for coffee, tea, or hot chocolate.",
    price: 34.99,
    stock_quantity: 40,
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=800&h=800&fit=crop",
    category: "Home",
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Stainless Steel Water Bottle",
    description: "Insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. Double-wall vacuum insulation prevents condensation. Wide mouth fits ice cubes. BPA-free and leak-proof. Includes a carrying loop.",
    price: 24.99,
    stock_quantity: 60,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop",
    category: "Accessories",
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Organic Cotton Hoodie",
    description: "Cozy organic cotton hoodie with brushed interior. Ethically manufactured in a fair-trade certified facility. Features a kangaroo pocket, adjustable drawstring hood, and ribbed cuffs and hem. Pre-shrunk for a consistent fit.",
    price: 69.99,
    stock_quantity: 35,
    image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=800&fit=crop",
    category: "Clothing",
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Bamboo Cutting Board",
    description: "Eco-friendly bamboo cutting board with juice groove. Gentle on knives and naturally antimicrobial. Features a built-in handle for easy carrying and storage. Measures 12x18 inches - perfect size for everyday use.",
    price: 22.99,
    stock_quantity: 45,
    image_url: "https://images.unsplash.com/photo-1584990347449-1514a8a7377e?w=800&h=800&fit=crop",
    category: "Home",
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    title: "Smart Watch Series 5",
    description: "Advanced health tracking, GPS, and cellular connectivity. Water resistant to 50m. Always-on retina display. Features ECG app, blood oxygen monitoring, fall detection, and emergency SOS. 18-hour battery life with fast charging.",
    price: 399.99,
    stock_quantity: 15,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    category: "Electronics",
    created_at: new Date().toISOString(),
  },
];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  let product = await getProduct(id);

  if (!product) {
    product = mockProducts.find((p) => p.id === id) || null;
  }

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: `${product.title} - Shop`,
    description: product.description || `Shop ${product.title} at our store.`,
    openGraph: {
      title: product.title,
      description: product.description || "",
      images: product.image_url ? [product.image_url] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  let product = await getProduct(id);

  if (!product) {
    product = mockProducts.find((p) => p.id === id) || null;
  }

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}