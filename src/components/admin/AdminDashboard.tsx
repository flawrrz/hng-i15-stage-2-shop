"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Leaf, Package, Receipt, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OrdersPanel } from "./OrdersPanel";
import { ProductsPanel } from "./ProductsPanel";
import { SubscribersPanel } from "./SubscribersPanel";

type Tab = "products" | "orders" | "subscribers";

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "products", label: "Plants", icon: Package },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "subscribers", label: "Subscribers", icon: Users },
];

interface Stats {
  products: number | null;
  orders: number | null;
  subscribers: number | null;
}

interface AdminDashboardProps {
  email: string;
}

export function AdminDashboard({ email }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("products");
  const [stats, setStats] = useState<Stats>({
    products: null,
    orders: null,
    subscribers: null,
  });
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    // The proxy now sees no session and will bounce /admin to /auth/login.
    router.push("/");
  }, [supabase, router]);

  // Counts come from the admin API (service role): orders and subscribers are
  // RLS-restricted, so an anon count would misleadingly show 0.
  // State updates live only inside the promise callbacks so this is safe to
  // call from the mount effect (react-hooks/set-state-in-effect).
  const loadStats = useCallback(() => {
    fetch("/api/admin/stats")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setStats(json.stats);
      })
      .catch((err) => {
        // Cosmetic only — each panel surfaces its own errors.
        console.error("admin stats:", err);
        setStats({ products: null, orders: null, subscribers: null });
      });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    { label: "Plants", value: stats.products, icon: Leaf },
    { label: "Orders", value: stats.orders, icon: Receipt },
    { label: "Subscribers", value: stats.subscribers, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-ink text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <svg className="w-7 h-7 shrink-0" viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M23 7c-7.5.3-13.2 4-14.6 10.2-.5 2.2.1 4.4 1.5 6.1l1.9-1.9c-.7-1-1-2.2-.7-3.5C12 12.6 16.4 9.6 22 9V7h1z"
                fill="#8E9B77"
              />
              <circle cx="9.5" cy="23" r="3" fill="#FFC700" />
            </svg>
            <span className="font-display text-lg truncate">
              Gazette <span className="text-white/50">/ Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-sm text-white/60 truncate max-w-[180px]">
              {email}
            </span>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title + stats */}
        <div className="mb-6">
          <h1 className="font-display text-3xl text-ink">Dashboard</h1>
          <p className="text-ink-soft text-sm mt-1">
            Manage the catalogue, fulfil orders and read the newsletter list.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white border border-line rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-mint flex items-center justify-center shrink-0">
                <card.icon className="w-5 h-5 text-leaf" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-ink-soft">{card.label}</p>
                <p className="font-display text-2xl text-ink">
                  {card.value === null ? "…" : card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs — pill row on every size (mobile-first, no sidebar to hide) */}
        <nav
          aria-label="Admin sections"
          className="flex gap-2 overflow-x-auto pb-1 mb-6"
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
                  active
                    ? "bg-leaf text-white border-leaf"
                    : "bg-white text-ink-soft border-line hover:border-leaf-soft hover:text-ink"
                }`}
              >
                <item.icon className="w-4 h-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Panels fetch their own data on mount */}
        {tab === "products" && <ProductsPanel onChanged={loadStats} />}
        {tab === "orders" && <OrdersPanel />}
        {tab === "subscribers" && <SubscribersPanel onChanged={loadStats} />}
      </div>
    </div>
  );
}
