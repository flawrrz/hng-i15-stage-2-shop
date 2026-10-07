"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  Droplets,
  Sun,
  Sprout,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/Button";
import { useCartStore } from "@/lib/cart-store";
import { CareDetails, Product } from "@/lib/types";
import { formatNaira, FREE_DELIVERY_THRESHOLD } from "@/lib/utils";

interface ProductDetailProps {
  product: Product;
}

/** Renders one care fact; arrays join with commas, booleans read as Yes/No. */
function CareRow({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null || value === "") return null;
  let display: string;
  if (typeof value === "boolean") display = value ? "Yes" : "No";
  else if (Array.isArray(value)) display = value.join(", ");
  else if (typeof value === "object") {
    const v = value as { min?: string; max?: string };
    display = [v.min, v.max].filter(Boolean).join(" – ");
    if (!display) return null;
  } else display = String(value);

  return (
    <div className="flex justify-between gap-4 py-2 border-b border-line last:border-0">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="text-ink font-medium text-right">{display}</dd>
    </div>
  );
}

/** The care card: icon-led headline facts + the full spec list underneath. */
function CareSection({ care }: { care: CareDetails }) {
  const headline = [
    { icon: Droplets, label: "Watering", value: care.watering },
    { icon: Sun, label: "Light", value: Array.isArray(care.sunlight) ? care.sunlight.join(", ") : care.sunlight },
    { icon: Sprout, label: "Care Level", value: care.care_level },
    { icon: Leaf, label: "Cycle", value: care.cycle },
  ].filter((f) => f.value);

  return (
    <section className="border-t border-line pt-6" aria-labelledby="care-heading">
      <h2 id="care-heading" className="font-display text-2xl text-ink mb-4">
        Care Details
      </h2>

      {headline.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {headline.map((fact) => (
            <div key={fact.label} className="bg-surface rounded-2xl p-4">
              <fact.icon className="w-5 h-5 text-leaf mb-2" aria-hidden="true" />
              <p className="text-xs text-ink-soft">{fact.label}</p>
              <p className="text-sm font-medium text-ink mt-0.5">{fact.value}</p>
            </div>
          ))}
        </div>
      )}

      <dl className="text-sm">
        <CareRow label="Scientific name" value={care.scientific_name} />
        <CareRow label="Other names" value={care.other_names} />
        <CareRow label="Type" value={care.type} />
        <CareRow label="Origin" value={care.origin} />
        <CareRow label="Watering" value={care.watering} />
        <CareRow label="Watering guide" value={care.watering_benchmark} />
        <CareRow label="Sunlight" value={care.sunlight} />
        <CareRow label="Soil" value={care.soil} />
        <CareRow label="Care level" value={care.care_level} />
        <CareRow label="Maintenance" value={care.maintenance} />
        <CareRow label="Growth rate" value={care.growth_rate} />
        <CareRow label="Hardiness" value={care.hardiness} />
        <CareRow label="Flowering season" value={care.flowering_season} />
        <CareRow label="Suitable indoors" value={care.indoor} />
      </dl>

      {(care.poisonous_to_pets || care.poisonous_to_humans) && (
        <p className="mt-4 flex items-start gap-2 text-sm bg-sun/20 border border-sun/50 rounded-xl px-4 py-3 text-ink">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-ink" aria-hidden="true" />
          <span>
            {care.poisonous_to_pets && "Toxic to pets. "}
            {care.poisonous_to_humans && "Toxic if ingested by humans."}
          </span>
        </p>
      )}
    </section>
  );
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  // "Added ✓" feedback instead of auto-opening the cart drawer (same policy
  // as ProductCard): the drawer only opens when the header cart is clicked,
  // so the page you're on stays visible after adding.
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending timer on unmount so setAdded never fires afterwards.
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const isOutOfStock = product.stock_quantity <= 0;
  const maxQuantity = Math.min(product.stock_quantity, 10);

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // The store's addItem adds one unit per call, so repeat `quantity` times
    // to honor the chosen picker value (mirrors how the Expo app adds from
    // its product screen). The store caps each call at the stock level.
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        title: product.title,
        price: product.price,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
      });
    }

    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Use product image or placeholder
  const productImages = product.image_url ? [product.image_url] : [];
  const care = product.care_details;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb */}
      <nav className="bg-surface border-b border-line py-4" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-ink-soft hover:text-leaf">Home</Link>
            </li>
            <li className="flex items-center gap-2 text-ink-soft">
              <ChevronRight className="w-4 h-4" />
              <Link href="/products" className="text-ink-soft hover:text-leaf">Shop</Link>
            </li>
            <li className="flex items-center gap-2 text-ink-soft">
              <ChevronRight className="w-4 h-4" />
              <span className="text-ink font-medium" aria-current="page">{product.title}</span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Product Content */}
      <main className="flex-1 py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Product Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-surface">
                {productImages.length > 0 ? (
                  <Image
                    src={productImages[selectedImage]}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-leaf-soft">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Stock Badge */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                    <span className="bg-white text-lg font-semibold px-6 py-3 rounded-xl">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-leaf" : "border-transparent hover:border-leaf-soft"
                      }`}
                      aria-label={`View image ${index + 1}`}
                      aria-current={selectedImage === index ? "true" : "false"}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} - view ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Category & Title */}
              <div>
                {product.category && (
                  <span className="inline-block text-sm font-medium text-leaf mb-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-leaf mr-2 align-middle" />
                    {product.category}
                  </span>
                )}
                <h1 className="font-display text-3xl md:text-4xl text-ink">{product.title}</h1>
                {care?.scientific_name && (
                  <p className="text-ink-soft italic mt-1">{care.scientific_name}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-ink">{formatNaira(product.price)}</span>
                {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                  <span className="text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded-full">
                    Only {product.stock_quantity} left in stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-ink-soft leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="border-t border-b border-line py-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-ink mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-line rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-3 text-ink-soft hover:text-ink hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (val >= 1 && val <= maxQuantity) setQuantity(val);
                      }}
                      min={1}
                      max={maxQuantity}
                      className="w-16 text-center border-x border-line focus:outline-none text-lg font-medium"
                      aria-label="Quantity"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQuantity}
                      className="px-4 py-3 text-ink-soft hover:text-ink hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-sm text-ink-soft">Max {maxQuantity} per order</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full"
                size="lg"
              >
                {isOutOfStock ? "Out of Stock" : added ? "Added ✓" : "Add to Cart"}
              </Button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-line">
                <div className="flex flex-col items-center gap-2 p-4">
                  <Truck className="w-6 h-6 text-leaf" />
                  <span className="text-sm font-medium text-ink">Free Delivery</span>
                  <span className="text-xs text-ink-soft text-center">
                    On orders over {formatNaira(FREE_DELIVERY_THRESHOLD)}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <RotateCcw className="w-6 h-6 text-leaf" />
                  <span className="text-sm font-medium text-ink">Easy Returns</span>
                  <span className="text-xs text-ink-soft">30-day policy</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Shield className="w-6 h-6 text-leaf" />
                  <span className="text-sm font-medium text-ink">Secure Payment</span>
                  <span className="text-xs text-ink-soft">100% protected</span>
                </div>
              </div>

              {/* Product Meta */}
              <dl className="space-y-3 text-sm border-t border-line pt-6">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">SKU</dt>
                  <dd className="font-medium font-mono text-ink">{product.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Availability</dt>
                  <dd className={isOutOfStock ? "text-red-600" : "text-leaf font-medium"}>
                    {isOutOfStock ? "Out of Stock" : "In Stock"}
                  </dd>
                </div>
              </dl>

              {/* Care details — populated from the care_details JSONB column */}
              {care && <CareSection care={care} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
