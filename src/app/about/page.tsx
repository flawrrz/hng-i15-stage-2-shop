import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Truck, Shield, RotateCcw, Heart, Users, Leaf, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - Shop",
  description: "Learn about our mission to bring you quality products at fair prices.",
};

const features = [
  {
    icon: Heart,
    title: "Quality First",
    description: "Every product is carefully selected for quality and durability. We only sell what we'd buy ourselves.",
  },
  {
    icon: Leaf,
    title: "Sustainable Practices",
    description: "We prioritize eco-friendly materials and ethical manufacturing. Better for you, better for the planet.",
  },
  {
    icon: Users,
    title: "Customer Obsessed",
    description: "Your satisfaction drives everything we do. Easy returns, fast shipping, and real human support.",
  },
  {
    icon: Sparkles,
    title: "Curated Selection",
    description: "No endless scrolling. Just the best products in each category, handpicked by our team.",
  },
];

const values = [
  {
    title: "Transparency",
    description: "Honest pricing, clear policies, no hidden fees. What you see is what you get.",
  },
  {
    title: "Integrity",
    description: "We stand behind every product. If it's not right, we'll make it right.",
  },
  {
    title: "Community",
    description: "We're building more than a store. We're building a community of conscious consumers.",
  },
  {
    title: "Innovation",
    description: "Always improving. Better products, better experience, better impact.",
  },
];

const team = [
  { name: "Sarah Chen", role: "Founder & CEO", bio: "Former product designer with a passion for sustainable commerce." },
  { name: "Marcus Johnson", role: "Head of Operations", bio: "Supply chain expert ensuring every order arrives perfectly." },
  { name: "Emily Rodriguez", role: "Customer Experience Lead", bio: "Dedicated to making every interaction delightful." },
  { name: "David Kim", role: "Product Curator", bio: "Travels the world finding the best products for our store." },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
            Our Story
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Building a Better Way
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">to Shop</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            We started Shop with a simple idea: shopping should be delightful, not overwhelming. 
            Quality products, fair prices, and a experience that respects your time.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <div className="prose prose-gray max-w-none space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed">
                  In a world of endless choices and aggressive marketing, we wanted to create something different. 
                  A place where quality speaks louder than hype, where every product earns its spot on our virtual shelves.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We believe that good design shouldn't come with a luxury price tag, and that ethical 
                  manufacturing isn't a marketing angle—it's the only way to do business.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Every item in our store has been personally vetted by our team. We ask the hard questions: 
                  Who made this? What materials were used? Will it last? Only the products that pass our standards make the cut.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <svg className="w-48 h-48 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Makes Us Different</h2>
            <p className="text-lg text-gray-500">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl border border-gray-100 p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-500">The principles we'll never compromise on</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-lg text-gray-500">Real people who care about your experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience the Difference?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Browse our curated collection and discover products you'll love.
          </p>
          <Link href="/products">
            <Button size="lg" className="w-full sm:w-auto">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}