"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { formatDate, formatNaira } from "@/lib/utils";
import { LogOut, User, Package, Settings } from "lucide-react";

interface User {
  id: string;
  email: string | undefined;
  created_at?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    title: string;
    image_url: string | null;
  } | null;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface AccountPageProps {
  user: User;
  orders: Order[];
}

export function AccountPage({ user, orders }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "settings">("profile");
  const [isSigningOut, setIsSigningOut] = useState(false);

  const supabase = createClient();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayName = user.user_metadata.full_name || (user.email ? user.email.split("@")[0] : "User");
  const avatarUrl = user.user_metadata.avatar_url;
  const memberSinceText = user.created_at ? formatDate(user.created_at) : "Not available";

  return (
    <div className="min-h-screen bg-surface py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-ink">My Account</h1>
          <p className="text-ink-soft mt-1">Manage your profile and orders</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-line p-6 sticky top-24">
              {/* User Avatar & Info */}
              <div className="flex items-center gap-4 mb-6">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-ink">{displayName}</h2>
                  <p className="text-sm text-ink-soft">{user.email || "No email"}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-leaf text-white"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "orders"
                      ? "bg-leaf text-white"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-leaf text-white"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-line">
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                  isLoading={isSigningOut}
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl border border-line p-6">
                <h2 className="text-xl font-semibold text-ink mb-6">Profile Information</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-ink-soft mb-1">Email</label>
                    <p className="text-ink">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-soft mb-1">Name</label>
                    <p className="text-ink">{displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-soft mb-1">Member Since</label>
                    <p className="text-ink">{memberSinceText}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-xl border border-line">
                <div className="p-6 border-b border-line">
                  <h2 className="text-xl font-semibold text-ink">Order History</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-ink mb-2">No orders yet</h3>
                    <p className="text-ink-soft mb-6">When you place an order, it will appear here.</p>
                    <Link href="/products">
                      <Button variant="primary">Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-ink-soft">Order</span>
                            <span className="font-mono font-medium text-ink">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === "delivered"
                                  ? "bg-mint text-leaf-dark"
                                  : order.status === "shipped"
                                  ? "bg-leaf text-white"
                                  : order.status === "confirmed"
                                  ? "bg-sun text-ink"
                                  : "bg-surface text-ink-soft"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-ink-soft">
                            <span>{formatDate(order.created_at)}</span>
                            <span className="font-medium text-ink">{formatNaira(order.total_amount)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {order.order_items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                {item.products?.image_url ? (
                                  <img
                                    src={item.products.image_url}
                                    alt={item.products.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-ink truncate">
                                  {item.products?.title || "Product"}
                                </p>
                                <p className="text-sm text-ink-soft">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-medium text-ink">
                                {formatNaira(item.price_at_purchase * item.quantity)}
                              </p>
                            </div>
                          ))}

                          {order.order_items.length > 3 && (
                            <div className="flex items-center justify-center p-4 bg-surface rounded-lg col-span-full">
                              <span className="text-sm text-ink-soft">
                                +{order.order_items.length - 3} more items
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-xl border border-line p-6">
                <h2 className="text-xl font-semibold text-ink mb-6">Account Settings</h2>
                <div className="space-y-4 max-w-xl">
                  <div className="p-4 border border-line rounded-lg">
                    <p className="text-sm font-medium text-ink-soft mb-1">Signed in as</p>
                    <p className="text-ink">{user.email || "No email"}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/contact" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Contact Support
                      </Button>
                    </Link>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="w-full sm:w-auto text-red-600 hover:bg-red-50"
                      isLoading={isSigningOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}