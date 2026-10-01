"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { formatDate, format } from "@/lib/utils";
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500 mt-1">Manage your profile and orders</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
              {/* User Avatar & Info */}
              <div className="flex items-center gap-4 mb-6">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">{displayName}</h2>
                  <p className="text-sm text-gray-500">{user.email || "No email"}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "profile"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "orders"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100">
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
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                    <p className="text-gray-900">{displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Member Since</label>
                    <p className="text-gray-900">{memberSinceText}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-xl border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
                </div>

                {orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
                    <Link href="/products">
                      <Button variant="primary">Start Shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Order</span>
                            <span className="font-mono font-medium text-gray-900">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-700"
                                  : order.status === "confirmed"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatDate(order.created_at)}</span>
                            <span className="font-medium text-gray-900">${format(order.total_amount)}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {order.order_items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.products?.title || "Product"}
                                </p>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                ${format(item.price_at_purchase * item.quantity)}
                              </p>
                            </div>
                          ))}

                          {order.order_items.length > 3 && (
                            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg col-span-full">
                              <span className="text-sm text-gray-500">
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
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
                <div className="space-y-4 max-w-xl">
                  <div className="p-4 border border-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Signed in as</p>
                    <p className="text-gray-900">{user.email || "No email"}</p>
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