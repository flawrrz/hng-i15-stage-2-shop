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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found - The Green Gazette™" };
  }

  return {
    title: `${product.title} - The Green Gazette™`,
    description:
      product.description ||
      `Buy ${product.title} from The Green Gazette™ — delivered across Nigeria with care notes.`,
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
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
