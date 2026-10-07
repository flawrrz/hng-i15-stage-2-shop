import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  // Only routes that actually exist — the old footer pointed at 12 pages
  // (/faq, /shipping, /returns, /track-order, /careers, …) that were never
  // built, plus 5 socials linking to bare network homepages.
  const footerLinks = {
    shop: [
      { label: "All Plants", href: "/products" },
      { label: "Indoor", href: "/products?category=Indoor" },
      { label: "Succulents", href: "/products?category=Succulents" },
      { label: "Ferns", href: "/products?category=Ferns" },
      { label: "Flowering", href: "/products?category=Flowering" },
    ],
    explore: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "My Account", href: "/account" },
      { label: "Newsletter", href: "/#newsletter" },
    ],
  };

  return (
    <footer className="bg-ink text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Go to homepage">
              <svg className="w-8 h-8" viewBox="0 0 32 32" aria-hidden="true">
                <path
                  d="M23 7c-7.5.3-13.2 4-14.6 10.2-.5 2.2.1 4.4 1.5 6.1l1.9-1.9c-.7-1-1-2.2-.7-3.5C12 12.6 16.4 9.6 22 9V7h1z"
                  fill="#8E9B77"
                />
                <circle cx="9.5" cy="23" r="3" fill="#FFC700" />
              </svg>
              <span className="font-display text-xl tracking-tight text-white">
                The Green Gazette<sup className="text-[0.55em] align-super">™</sup>
              </span>
            </Link>
            <p className="text-sm text-white/60 mb-6 max-w-xs">
              Your neighbourhood plant gazette — indoor plants, succulents, ferns
              and trees, each with care notes and delivered across Nigeria.
            </p>
          </div>

          {/* Shop Links */}
          <nav aria-label="Shop">
            <h3 className="font-display text-lg text-white mb-4">The Catalogue</h3>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Explore Links */}
          <nav aria-label="Explore">
            <h3 className="font-display text-lg text-white mb-4">Explore</h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Giant wordmark — mirrors the template's oversized footer initial */}
        <div
          className="font-display text-[18vw] md:text-[10rem] leading-[0.8] text-white/10 select-none pointer-events-none mb-6"
          aria-hidden="true"
        >
          GG.
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/60 text-center md:text-left">
            &copy; {currentYear} The Green Gazette™. Lagos, NG. All rights
            reserved.{" "}
            {/* Staff console — allowlist-gated by ADMIN_EMAILS in src/proxy.ts */}
            <Link
              href="/admin"
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              Staff
            </Link>
          </p>

          <p className="text-xs text-white/40 text-center md:text-right max-w-md">
            Plant data and images sourced from{" "}
            <a
              href="https://perenual.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70"
            >
              Perenual
            </a>{" "}
            under CC BY-SA 4.0. Reproduced with attribution.
          </p>
        </div>
      </div>
    </footer>
  );
}
