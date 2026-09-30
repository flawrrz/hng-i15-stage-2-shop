"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Minus, Plus, Check, Truck, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/Button";
import { useCartStore } from "@/lib/cart-store";
import { Product } from "@/lib/types";
import { format } from "@/lib/utils";

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();

  const isOutOfStock = product.stock_quantity <= 0;
  const maxQuantity = Math.min(product.stock_quantity, 10);

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    });
    openCart();
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Use product image or placeholder
  const productImages = product.image_url ? [product.image_url] : [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b border-gray-100 py-4" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <a href="/" className="text-gray-500 hover:text-gray-700">Home</a>
            </li>
            <li className="flex items-center gap-2 text-gray-400">
              <ChevronRight className="w-4 h-4" />
              <a href="/products" className="text-gray-500 hover:text-gray-700">Shop</a>
            </li>
            <li className="flex items-center gap-2 text-gray-400">
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium" aria-current="page">{product.title}</span>
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
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
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
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Stock Badge */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index ? "border-black" : "border-transparent hover:border-gray-300"
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
                  <span className="inline-block text-sm font-medium text-gray-500 mb-2">{product.category}</span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.title}</h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gray-900">${format(product.price)}</span>
                {product.stock_quantity > 0 && product.stock_quantity < 10 && (
                  <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    Only {product.stock_quantity} left in stock
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity Selector */}
              <div className="border-t border-b border-gray-100 py-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="w-16 text-center border-x border-gray-200 focus:outline-none text-lg font-medium"
                      aria-label="Quantity"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQuantity}
                      className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Max {maxQuantity} per order</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full"
                size="lg"
              >
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="flex flex-col items-center gap-2 p-4">
                  <Truck className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Free Shipping</span>
                  <span className="text-xs text-gray-500">On orders over $50</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <RotateCcw className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Easy Returns</span>
                  <span className="text-xs text-gray-500">30-day policy</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Secure Payment</span>
                  <span className="text-xs text-gray-500">100% protected</span>
                </div>
              </div>

              {/* Product Meta */}
              <dl className="space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-6">
                <div className="flex justify-between">
                  <dt className="text-gray-500">SKU</dt>
                  <dd className="font-medium font-mono">{product.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Availability</dt>
                  <dd className={isOutOfStock ? "text-red-600" : "text-green-600"}>
                    {isOutOfStock ? "Out of Stock" : "In Stock"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}