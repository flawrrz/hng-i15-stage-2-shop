"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "./Button";
import { useCartStore } from "@/lib/cart-store";
import { formatNaira } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  // "Added ✓" replaces the old behaviour of flinging the cart drawer open on
  // every click — you can keep browsing (or add several items) without
  // dismissing the drawer each time. The header badge popping is the signal.
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the pending timer on unmount so setAdded never fires afterwards.
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${Date.now()}`, // Unique cart item ID
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity, // lets the store cap quantities
    });
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  const isOutOfStock = product.stock_quantity <= 0;

  // Template's gallery card: a bare info row (name left, price right) sitting
  // ABOVE a rounded photo — no border, no card background. Category shows as
  // a small dot-prefixed label, echoing the template's product-information row.
  return (
    <article className="group">
      {/* Info row above the image — matches the template's gallery layout */}
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="font-display text-base md:text-lg text-ink line-clamp-1">
          <Link href={`/products/${product.id}`} className="hover:text-leaf transition-colors">
            <span className="inline-block w-2 h-2 rounded-full bg-leaf mr-2 align-middle" />
            {product.title}
          </Link>
        </h3>
        <span className="text-sm md:text-base text-ink whitespace-nowrap">
          {formatNaira(product.price)}
        </span>
      </div>

      {/* Image links to the product detail page: the card must be clickable,
          otherwise /products/[id] (gallery, full description, quantity picker)
          is unreachable from the browsing flow. */}
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-surface">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-leaf-soft">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of Stock Badge (inside the link: tapping a sold-out product
              still opens its detail page) */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
              <span className="bg-white text-sm font-semibold px-4 py-2 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Add to cart */}
      <div className="mt-3">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          size="sm"
          variant="secondary"
          className="w-full"
        >
          {isOutOfStock ? "Sold Out" : added ? "Added ✓" : "Add to Cart"}
        </Button>
      </div>
    </article>
  );
}
