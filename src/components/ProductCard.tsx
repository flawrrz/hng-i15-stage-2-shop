"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "./Button";
import { useCartStore } from "@/lib/cart-store";

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

  return (
    <article className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200">
      {/* Image links to the product detail page: the card must be clickable,
          otherwise /products/[id] (gallery, full description, quantity picker)
          is unreachable from the browsing flow. */}
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Out of Stock Badge (inside the link: tapping a sold-out product
              still opens its detail page) */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-sm font-semibold px-4 py-2 rounded-lg">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1 text-base">
            <Link href={`/products/${product.id}`} className="hover:underline">
              {product.title}
            </Link>
          </h3>
          {product.category && (
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
              {product.category}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 min-h-[3rem]">{product.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</span>
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            size="sm"
            className="w-full sm:w-auto"
          >
            {isOutOfStock ? "Sold Out" : added ? "Added ✓" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
