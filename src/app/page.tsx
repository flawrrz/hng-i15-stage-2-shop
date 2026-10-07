import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/Button";
import { LoadError } from "@/components/LoadError";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ProductCard } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    // Throw (not return []) so the catch in the page body renders the
    // retryable LoadError UI — an empty array would masquerade as "the shop
    // has no products".
    console.error("Error fetching products:", error);
    throw new Error("Could not load products from the database.");
  }

  return data || [];
}

// The three services the template lists as numbered items (adapted from
// floral installations to a plant shop's actual offerings).
const services = [
  {
    number: "1",
    title: "Indoor Plant Delivery",
    body: "Potted and packed with care, then delivered across Lagos and Nigeria — every plant arrives with its own printed care card.",
    image: "/images/service-arrange.jpg",
    alt: "Hands tying a bouquet of fresh stems",
  },
  {
    number: "2",
    title: "Care Consultations",
    body: "Yellowing leaves? Leggy stems? Our team diagnoses light, water and soil problems and writes you a recovery plan.",
    image: "/images/service-consult.jpg",
    alt: "Flat-lay of gardening shears, notebook and dried stems",
  },
  {
    number: "3",
    title: "Custom Plant Styling",
    body: "Offices, weddings, restaurants — we source, pot and arrange greenery to match your space and your budget.",
    image: "/images/service-storefront.jpg",
    alt: "Florist arranging plants at a shop front",
  },
];

const carouselImages = [
  { src: "/images/carousel-1.jpg", alt: "Deep pink peony in a glass vase" },
  { src: "/images/carousel-2.jpg", alt: "Close-up of a white tulip" },
  { src: "/images/carousel-3.jpg", alt: "Purple sweet pea against a lime background" },
  { src: "/images/carousel-4.jpg", alt: "Orange poppies on an olive background" },
  { src: "/images/carousel-5.jpg", alt: "Sunflowers mixed with dried flowers" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ subscribed?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  // The newsletter endpoint redirects back with ?subscribed=true for the
  // no-JavaScript fallback; with JavaScript the NewsletterForm reports
  // success inline instead.
  const subscribed = params?.subscribed === "true";
  // getProducts logs the detail and throws; catch here so the featured
  // section can show a retryable LoadError instead of an empty grid that
  // looks like "the shop has no products".
  let products: Product[] | null = null;
  try {
    products = await getProducts();
  } catch {
    products = null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ---------------------------------------------------------------
          Hero — masthead wordmark + wide photo with the yellow sticker,
          mirroring the template's "Our Blooms® + 10% Off" hero.
      --------------------------------------------------------------- */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16">
          <h1 className="font-display text-[13vw] sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-ink text-center">
            The Green Gazette<sup className="text-[0.4em] align-super">™</sup>
          </h1>

          <div className="relative mt-8 md:mt-10">
            <Image
              src="/images/hero-carnation.jpg"
              alt="A single coral carnation in a glass vase against a mauve background"
              width={1600}
              height={989}
              priority
              className="w-full h-[320px] md:h-[520px] object-cover rounded-3xl"
            />
            {/* Yellow starburst sticker */}
            <div
              aria-hidden="true"
              className="absolute -top-5 right-4 md:right-10 w-28 h-28 md:w-36 md:h-36 bg-sun text-ink rounded-full flex flex-col items-center justify-center text-center rotate-[-12deg] shadow-lg"
            >
              <span className="font-display text-sm md:text-base leading-tight px-2">
                New
                <br />
                10% Off
                <br />
                Your First
                <br />
                Order
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 pb-4">
            <Link href="/products">
              <Button size="lg" className="w-full sm:w-auto">
                Shop the Catalogue
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Who We Are
      --------------------------------------------------------------- */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-leaf mb-6">
            Who We Are
          </p>
          <p className="text-2xl md:text-4xl leading-snug text-ink">
            We&apos;re <span className="font-display">The Green Gazette</span> — a
            neighbourhood plant shop that publishes everything we learn about
            keeping green things alive, and delivers the plants themselves right
            to your door.
          </p>
          <div className="mt-8">
            <Link href="/about">
              <Button variant="outline" size="lg">Read Our Story</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Carousel — five rounded photos in a horizontal rail
      --------------------------------------------------------------- */}
      <section className="bg-white pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
            {carouselImages.map((img) => (
              <div
                key={img.src}
                className="snap-start shrink-0 w-[62vw] sm:w-[38vw] lg:w-[18vw]"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1067}
                  height={1600}
                  className="w-full h-[300px] md:h-[380px] object-cover rounded-3xl"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          What We Do — numbered service list (template's 1 / 2 / 3 layout)
      --------------------------------------------------------------- */}
      <section className="bg-surface py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="font-display text-4xl md:text-6xl text-ink">What We Do</h2>
            <p className="text-xl md:text-2xl text-ink-soft mt-4">
              We bring a touch of that simple green magic into your world.
            </p>
          </div>

          <div className="space-y-12">
            {services.map((service) => (
              <div
                key={service.number}
                className="grid md:grid-cols-2 gap-6 md:gap-10 items-center border-t border-line pt-10"
              >
                <div className="flex items-start gap-6">
                  <span className="font-display text-5xl md:text-6xl text-leaf shrink-0">
                    {service.number}
                  </span>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl uppercase tracking-wide text-ink">
                      {service.title}
                    </h3>
                    <p className="text-ink-soft mt-3 leading-relaxed max-w-md">
                      {service.body}
                    </p>
                  </div>
                </div>
                <Image
                  src={service.image}
                  alt={service.alt}
                  width={1600}
                  height={1067}
                  className="w-full h-[260px] md:h-[340px] object-cover rounded-3xl"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Big image breaker
      --------------------------------------------------------------- */}
      <section className="bg-white">
        <Image
          src="/images/breaker.jpg"
          alt="Overhead view of hands working with dried flowers, ribbon and paper"
          width={1600}
          height={1067}
          className="w-full h-[280px] md:h-[460px] object-cover"
        />
      </section>

      {/* ---------------------------------------------------------------
          Featured Products — real catalogue data
      --------------------------------------------------------------- */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="font-display text-sm tracking-[0.2em] uppercase text-leaf mb-2">
                In This Issue
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-ink">Featured Plants</h2>
              <p className="text-ink-soft mt-2">Handpicked favourites from the greenhouse</p>
            </div>
            <Link href="/products" className="hidden md:inline-flex items-center gap-2 text-ink hover:text-leaf font-medium transition-colors">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {products === null ? (
            <LoadError what="featured plants" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link href="/products">
              <Button variant="outline" size="lg" className="w-full">
                View All Plants
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Newsletter — id matches the footer's /#newsletter link
      --------------------------------------------------------------- */}
      <section id="newsletter" className="bg-ink text-white py-16 md:py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-5xl mb-4">Join the Gazette</h2>
          <p className="text-white/70 text-lg mb-8">
            Plant care notes, new arrivals and subscribers-only offers — one
            letter, twice a month.
          </p>
          {subscribed && (
            <p
              role="status"
              className="mb-6 inline-block px-4 py-2 rounded-full bg-leaf/30 border border-leaf-soft/50 text-mint text-sm font-medium"
            >
              🎉 You&apos;re subscribed — welcome aboard!
            </p>
          )}
          <NewsletterForm />
          <p className="text-xs text-white/50 mt-4">No spam, unsubscribe anytime.</p>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          Work with us CTA
      --------------------------------------------------------------- */}
      <section className="bg-mint py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink">Work With Us</h2>
          <p className="text-ink-soft text-lg mt-4 max-w-2xl mx-auto">
            Planning a green wedding, an office jungle, or a restaurant terrace?
            Tell us about the space and we&apos;ll come back with a proposal.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
