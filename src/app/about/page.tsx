import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { NewsletterForm } from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "About - The Green Gazette™",
  description:
    "The story behind The Green Gazette — a neighbourhood plant shop that publishes what it learns about keeping green things alive.",
};

// "Our story" timeline: the template's About page structure (story, author,
// image grid) adapted to the plant shop.
const storyImages = [
  {
    src: "/images/story-bouquet.jpg",
    alt: "A grower carrying a crate of blooms out of the greenhouse",
    caption: "Market day, 6am",
  },
  {
    src: "/images/story-moody.jpg",
    alt: "A moody arrangement of stems in a dark vase",
    caption: "After-hours arranging",
  },
  {
    src: "/images/story-paper.jpg",
    alt: "Dried buds resting on crumpled paper",
    caption: "Pressed for the archive",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header band — mirrors the template's oversized page title */}
      <section className="bg-surface border-b border-line py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-display text-sm tracking-[0.2em] uppercase text-leaf mb-3">
            Est. Lagos
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-ink">About</h1>
        </div>
      </section>

      {/* Our story */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-6">Our Story</h2>
          <div className="space-y-5 text-lg text-ink-soft leading-relaxed">
            <p>
              The Green Gazette started as a notebook. Every time a plant on our
              shelf got sick, recovered, or surprised us, we wrote down what
              worked — light, water, soil, patience. Eventually the notebook got
              long enough to deserve a name, and here it is.
            </p>
            <p>
              We sell indoor plants, succulents, ferns and trees to people across
              Nigeria, and we ship each one with the care notes we&apos;d want if
              it were our plant: what it likes, what it tolerates, and what will
              kill it. No mystery, no jargon — just the entry, published plainly.
            </p>
            <p>
              The Gazette is also a promise: we keep writing. New arrivals get
              new notes, mistakes get logged too, and anything we learn about
              keeping green things alive goes straight back into the care cards
              in every box.
            </p>
          </div>

          {/* Author block, per the template */}
          <div className="mt-10 flex items-center gap-4 border-t border-line pt-6">
            <div className="w-12 h-12 rounded-full bg-leaf text-white flex items-center justify-center font-display text-lg">
              TG
            </div>
            <div>
              <p className="font-medium text-ink">The Editors</p>
              <p className="text-sm text-ink-soft">Founders / Head Growers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Image grid */}
      <section className="bg-white pb-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
            {storyImages.map((img) => (
              <figure key={img.src}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1067}
                  height={1600}
                  className="w-full h-[300px] md:h-[420px] object-cover rounded-3xl"
                />
                <figcaption className="mt-2 text-sm text-ink-soft">{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Big breaker + CTA */}
      <section className="bg-mint py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-5xl text-ink">
            Come Find Your Plant
          </h2>
          <p className="text-ink-soft text-lg mt-4 max-w-2xl mx-auto">
            Browse the catalogue, or write to us with a photo of your space and
            we&apos;ll recommend three plants that will actually thrive in it.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="w-full sm:w-auto">Shop the Catalogue</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="bg-ink text-white py-16 scroll-mt-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl mb-4">Join the Gazette</h2>
          <p className="text-white/70 text-lg mb-8">
            Plant care notes, new arrivals and subscribers-only offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
