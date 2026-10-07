"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CreditCard, Truck, Lock, Mail, MapPin, Phone, User, RotateCcw } from "lucide-react";
import { Button } from "@/components/Button";
import { useCartStore } from "@/lib/cart-store";
import { formatNaira, deliveryFee, vatFor, EXPRESS_DELIVERY_FEE } from "@/lib/utils";

interface FormData {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
}

const initialFormData: FormData = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
  phone: "",
};

export default function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  // Free delivery at ₦50,000+, otherwise a flat fee (shared with cart & success page).
  const shipping = deliveryFee(subtotal);
  const tax = vatFor(subtotal); // 7.5% Nigerian VAT
  const total = subtotal + shipping + tax;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const orderData = {
        customer: {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        },
        shipping_address: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          address_line_1: formData.address,
          address_line_2: formData.apartment,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode,
          country: formData.country,
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_purchase: item.price,
        })),
        subtotal,
        shipping,
        tax,
        total,
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process order");
      }

      // Clear cart and redirect to success page
      clearCart();
      router.push(`/checkout/success?orderId=${result.orderId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center max-w-md">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Your cart is empty</h1>
            <p className="text-ink-soft mb-6">Add some items to your cart before checking out.</p>
            <Link href="/products">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Checkout Header */}
      <section className="bg-surface border-b border-line py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 max-w-4xl">
            <div className="flex items-center gap-3 text-gray-400">
              <div className="w-8 h-8 rounded-full border-2 border-leaf flex items-center justify-center font-bold text-sm">1</div>
              <div className="w-32 h-0.5 bg-leaf"></div>
              <div className="w-8 h-8 rounded-full border-2 border-line flex items-center justify-center font-bold text-sm">2</div>
              <div className="w-32 h-0.5 bg-line"></div>
              <div className="w-8 h-8 rounded-full border-2 border-line flex items-center justify-center font-bold text-sm">3</div>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <span className="text-ink">Information</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Shipping</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Form */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-12">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Information */}
              <section>
                <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ink-soft mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                        errors.email ? "border-red-500" : "border-line"
                      }`}
                      placeholder="you@example.com"
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section>
                <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-ink-soft mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                          errors.firstName ? "border-red-500" : "border-line"
                        }`}
                        placeholder="John"
                        required
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-ink-soft mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                          errors.lastName ? "border-red-500" : "border-line"
                        }`}
                        placeholder="Doe"
                        required
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-ink-soft mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                        errors.address ? "border-red-500" : "border-line"
                      }`}
                      placeholder="123 Main Street"
                      required
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                  </div>

                  <div>
                    <label htmlFor="apartment" className="block text-sm font-medium text-ink-soft mb-1">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      id="apartment"
                      value={formData.apartment}
                      onChange={(e) => handleChange("apartment", e.target.value)}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-ink-soft mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                          errors.city ? "border-red-500" : "border-line"
                        }`}
                        placeholder="New York"
                        required
                      />
                      {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-ink-soft mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleChange("state", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                          errors.state ? "border-red-500" : "border-line"
                        }`}
                        placeholder="NY"
                        required
                      />
                      {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-ink-soft mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleChange("zipCode", e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                          errors.zipCode ? "border-red-500" : "border-line"
                        }`}
                        placeholder="10001"
                        required
                      />
                      {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-ink-soft mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-ink-soft mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf ${
                        errors.phone ? "border-red-500" : "border-line"
                      }`}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                </div>
              </section>

              {/* Shipping Method */}
              <section>
                <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Method
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 border border-line rounded-lg cursor-pointer hover:border-leaf-soft transition-colors">
                    <input type="radio" name="shipping" value="standard" defaultChecked className="sr-only peer" />
                    <div className="w-5 h-5 border-2 border-line rounded-full peer-checked:border-leaf peer-checked:bg-leaf peer-checked:bg-center peer-checked:bg-[length:10px_10px] peer-checked:bg-[radial-gradient(circle_at_center,_white_50%,_transparent_50%)]"></div>
                    <div className="flex-1">
                      <p className="font-medium text-ink">Standard Shipping</p>
                      <p className="text-sm text-ink-soft">5-7 business days</p>
                    </div>
                    <span className="font-medium text-ink">{shipping === 0 ? "Free" : formatNaira(shipping)}</span>
                  </label>
                  <label className="flex items-center gap-4 p-4 border border-line rounded-lg cursor-pointer hover:border-leaf-soft transition-colors">
                    <input type="radio" name="shipping" value="express" className="sr-only peer" />
                    <div className="w-5 h-5 border-2 border-line rounded-full peer-checked:border-leaf peer-checked:bg-leaf peer-checked:bg-center peer-checked:bg-[length:10px_10px] peer-checked:bg-[radial-gradient(circle_at_center,_white_50%,_transparent_50%)]"></div>
                    <div className="flex-1">
                      <p className="font-medium text-ink">Express Shipping</p>
                      <p className="text-sm text-ink-soft">2-3 business days</p>
                    </div>
                    <span className="font-medium text-ink">{formatNaira(EXPRESS_DELIVERY_FEE)}</span>
                  </label>
                </div>
              </section>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" role="alert">
                  {submitError}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
                Continue to Payment
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-surface rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-ink mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate">{item.title}</p>
                        <p className="text-sm text-ink-soft">Qty: {item.quantity}</p>
                        <p className="text-sm font-medium text-ink">{formatNaira(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Subtotal</span>
                    <span className="font-medium">{formatNaira(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Delivery</span>
                    <span className="font-medium">{shipping === 0 ? "Free" : formatNaira(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-soft">Estimated Tax (7.5%)</span>
                    <span className="font-medium">{formatNaira(tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-3 border-t border-line">
                    <span>Total</span>
                    <span>{formatNaira(total)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-line space-y-3 text-sm text-ink-soft">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span>All major cards accepted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                    <span>30-day returns</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}