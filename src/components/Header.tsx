"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/cart-store";
import { ChevronDown, LogOut, Menu, Package, Search, User, X } from "lucide-react";

export function Header() {
  const { getItemCount, toggleCart } = useCartStore();
  const itemCount = getItemCount();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    setShowMobileMenu(false);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    const targetPath = query
      ? `/products?search=${encodeURIComponent(query)}`
      : "/products";
    router.push(targetPath);
    setShowSearch(false);
    setShowMobileMenu(false);
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="hidden sm:block">Free shipping on orders over $50</span>
          <span className="sm:hidden">Free shipping on orders over $50</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="max-w-7xl mx-auto px-4" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold text-xl tracking-tight">Shop</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-black transition-colors font-medium">Home</Link>
            <Link href="/products" className="text-gray-700 hover:text-black transition-colors font-medium">Shop</Link>
            <Link href="/contact" className="text-gray-700 hover:text-black transition-colors font-medium">Contact</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              className="p-2 text-gray-600 hover:text-black transition-colors"
              aria-label="Search products"
              onClick={() => {
                setShowSearch((prev) => !prev);
                setShowMobileMenu(false);
              }}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  className="flex items-center gap-2 p-2 text-gray-600 hover:text-black transition-colors"
                  aria-label="Account menu"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  {user.user_metadata?.avatar_url ? (
                    // unoptimized: OAuth avatar URLs point at arbitrary hosts
                    // (Google, GitHub, …) that next/image would refuse unless
                    // whitelisted — for a 32px avatar, pass the bytes through.
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      unoptimized
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <span className="hidden sm:font-medium text-sm">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.user_metadata?.full_name || user.email?.split("@")[0]}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <User className="w-4 h-4" />
                      My Account
                    </Link>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-black transition-colors"
              aria-label={`Shopping cart${itemCount > 0 ? ` with ${itemCount} items` : " is empty"}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                // key remounts the badge whenever the count changes so the
                // pop animation replays — visible confirmation that an item
                // was added (locally or synced from the phone).
                <span
                  key={itemCount}
                  className="animate-badge-pop absolute -top-1 -right-1 bg-black text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              onClick={() => {
                setShowMobileMenu((prev) => !prev);
                setShowSearch(false);
              }}
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {showSearch && (
        <div className="border-t border-gray-100 bg-white">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search for products..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-2">
            <Link href="/" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              Home
            </Link>
            <Link href="/products" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
              Shop
            </Link>
            <Link href="/contact" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
             Contact
            </Link>
          </div>
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            {user ? (
              <div className="space-y-2">
                <Link href="/account" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  My Account
                </Link>
                <Link href="/account" onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50">
                  My Orders
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        @keyframes badge-pop {
          0% { transform: scale(1); }
          40% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .animate-badge-pop {
          animation: badge-pop 0.3s ease-out;
        }
      `}</style>
    </header>
  );
}