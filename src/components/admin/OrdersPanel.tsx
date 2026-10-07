"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/Button";
import { formatDate, formatNaira } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";

/** Shapes returned by GET /api/admin/orders. */
interface AdminOrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: { title: string } | null;
}

interface AdminOrder {
  id: string;
  status: string;
  total_amount: number;
  customer_email: string;
  created_at: string;
  shipping_address: { full_name?: string } & Record<string, unknown>;
  order_items: AdminOrderItem[];
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-sun/25 text-ink border-sun/50",
  confirmed: "bg-mint text-leaf-dark border-leaf-soft",
  shipped: "bg-leaf-soft/20 text-ink border-leaf-soft/40",
  delivered: "bg-leaf/15 text-leaf-dark border-leaf-soft",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export function OrdersPanel() {
  const pushToast = useToastStore((state) => state.push);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetches the list; every setState happens inside a promise callback so the
  // function is safe to call from the mount effect (the
  // react-hooks/set-state-in-effect rule rejects synchronous updates).
  const load = useCallback(() => {
    fetch("/api/admin/orders")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        setOrders(json.orders);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        console.error("orders load:", err);
        setLoadError(err instanceof Error ? err.message : "Could not load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  /** Manual refresh with the loading state — click handlers only. */
  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (order: AdminOrder, status: string) => {
    setUpdatingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      // Optimistic swap: PATCH succeeded, mirror it in the table.
      setOrders((prev) =>
        prev.map((item) => (item.id === order.id ? { ...item, status } : item))
      );
      pushToast(`Order #${order.id.slice(0, 8)} → ${status}`);
    } catch (err) {
      console.error("order status change:", err);
      // The select stays controlled by order.status, so the old value is
      // already back on screen — just tell the user what happened.
      window.alert(
        err instanceof Error ? err.message : "Could not update the order."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <p className="text-ink-soft text-sm py-8 text-center">Loading orders…</p>;
  }

  if (loadError) {
    return (
      <div className="text-center py-10 bg-white border border-line rounded-2xl">
        <Receipt className="w-10 h-10 text-leaf-soft mx-auto mb-3" aria-hidden="true" />
        <p className="text-ink-soft text-sm mb-4">{loadError}</p>
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-ink-soft text-sm text-center py-10 bg-white border border-line rounded-2xl">
        No orders yet.
      </p>
    );
  }

  return (
    <div className="bg-white border border-line rounded-2xl divide-y divide-line overflow-hidden">
      {orders.map((order) => {
        const names = order.order_items
          .map((item) => (item.products?.title ?? "Product").toLowerCase())
          .join(", ");
        return (
          <div key={order.id} className="p-4 sm:p-5 flex flex-wrap gap-4 items-start">
            {/* Order identity */}
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium text-ink">
                <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-ink-soft font-normal"> · {formatDate(order.created_at)}</span>
              </p>
              <p className="text-sm text-ink-soft mt-0.5">
                {order.shipping_address?.full_name || "Customer"} · {order.customer_email}
              </p>
              <p className="text-xs text-ink-soft/80 mt-1 capitalize line-clamp-1">
                {order.order_items.length} item{order.order_items.length === 1 ? "" : "s"}: {names}
              </p>
            </div>

            {/* Total */}
            <div className="text-right w-28">
              <p className="font-medium text-ink">{formatNaira(order.total_amount)}</p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 ml-auto">
              <span
                className={`hidden sm:inline-block text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[order.status] ?? "bg-surface text-ink-soft border-line"}`}
              >
                {order.status}
              </span>
              <select
                value={order.status}
                disabled={updatingId === order.id}
                onChange={(event) => changeStatus(order, event.target.value)}
                aria-label={`Status for order ${order.id.slice(0, 8)}`}
                className="text-sm border border-line rounded-lg px-2 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-leaf/40 disabled:opacity-60"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
