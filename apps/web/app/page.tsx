import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BatteryCharging,
  BellRing,
  CheckCircle2,
  Cpu,
  Droplet,
  ShieldCheck,
  Sparkles,
  Waves
} from 'lucide-react';

interface FeatureCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

interface SpecItem {
  name: string;
  value: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#contact' },
  { label: 'Blog', href: '#blog' }
];

const featureCards: FeatureCard[] = [
  {
    title: 'Wellness insights',
    description: 'Track heart rate variability, oxygen levels, and mindful minutes with medical-grade precision.',
    icon: Activity
  },
  {
    title: 'Adaptive battery',
    description: 'Enjoy 72 hours of continuous use thanks to the auto-optimised solar and kinetic charging system.',
    icon: BatteryCharging
  },
  {
    title: 'Always-on safety',
    description: 'Fall detection, SOS beacons, and live location sharing keep your loved ones informed at all times.',
    icon: ShieldCheck
  },
  {
    title: 'Crystal clear calls',
    description: 'Dual-mic array with intelligent noise cancellation makes every conversation effortless.',
    icon: Waves
  },
  {
    title: 'Smart assistant',
    description: 'Voice-first assistant sets reminders, responds to messages, and orchestrates your smart home devices.',
    icon: Sparkles
  },
  {
    title: 'Hydration coach',
    description: 'Automatic reminders adapt to your activity level so you stay energised throughout the day.',
    icon: Droplet
  }
];

const specs: SpecItem[] = [
  { name: 'Battery life', value: 'Up to 72 hrs' },
  { name: 'Water resistance', value: '50 meters' },
  { name: 'Connectivity', value: '5G + Wi-Fi 6E' },
  { name: 'Compatibility', value: 'iOS & Android' }
];

const testimonials: Testimonial[] = [
  {
    quote:
      'Proland keeps me ahead of my training goals without ever feeling intrusive. The adaptive battery means I never worry about running out midway through the day.',
    author: 'Sania Rahman',
    role: 'Fitness coach'
  },
  {
    quote:
      'The built-in safety tools helped our team stay connected on expeditions. Real-time tracking and incident alerts are absolute game changers.',
    author: 'Eric Diaz',
    role: 'Outdoor guide'
  }
];

const blogHighlights = [
  {
    slug: 'ai-ops-checklist',
    title: 'Designing the ultimate wearable companion',
    summary: 'A look at the product principles that shaped the Proland experience from strap to software.'
  },
  {
    slug: 'soc-automation',
    title: 'How the Proland OS keeps you moving',
    summary: 'Discover the micro-optimisations that extend battery life and make workouts smarter.'
  }
];

export default function ProlandLandingPage() {
  return (
    <div className="bg-[#f5f7fb] text-slate-900">
      <header
        id="home"
        className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-10 md:px-10"
      >
        <div className="flex items-center justify-between gap-8">
          <Link href="#home" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-white">
              P
            </span>
            Proland
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-orange-500">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="#purchase"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200"
          >
            Buy it now
          </Link>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 md:hidden">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-full bg-white px-4 py-2 shadow-sm">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-12 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-6">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-orange-500">Smart wearable</span>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">The future of tech is here</h1>
            <p className="max-w-xl text-lg text-slate-600">
              Holistically incentivise revolutionary collaboration and idea sharing before cost effective users. Actual focused services before highly efficient human capital.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="#product"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Explore the watch
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-orange-400 hover:text-orange-500"
              >
                Discover features
              </Link>
            </div>
            <dl className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Community members', value: '65K+' },
                { label: 'Daily sync sessions', value: '2.4M' },
                { label: 'Global retailers', value: '120+' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white p-4 shadow-md">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative flex flex-1 items-center justify-center">
            <div className="absolute -left-24 top-0 h-64 w-64 rounded-full bg-orange-200 blur-3xl" />
            <div className="absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-pink-200 blur-3xl" />
            <div className="relative flex w-[320px] flex-col items-center">
              <div className="absolute -left-10 top-1/2 h-48 w-20 -translate-y-1/2 rounded-full bg-gradient-to-b from-slate-900 to-slate-700 shadow-lg shadow-slate-400/50" />
              <div className="absolute -right-10 top-1/2 h-48 w-20 -translate-y-1/2 rounded-full bg-gradient-to-b from-slate-900 to-slate-700 shadow-lg shadow-slate-400/50" />
              <div className="relative z-10 h-[460px] w-[220px] overflow-hidden rounded-[3rem] border-[10px] border-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
                <div className="absolute inset-6 rounded-[2.3rem] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" />
                <div className="absolute inset-14 flex flex-col justify-between rounded-[1.6rem] bg-white/95 p-6 text-left">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Proland OS</p>
                    <p className="text-xl font-semibold text-slate-900">09:45</p>
                    <p className="text-sm text-slate-500">Mountaintop focus session</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 px-4 py-3 text-white">
                      <span className="text-sm font-medium">Next insight</span>
                      <span className="text-xs text-orange-200">Breathing break</span>
                    </div>
                    <div className="rounded-2xl bg-orange-100 px-4 py-3 text-sm font-medium text-orange-600">Hydration boost scheduled</div>
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">Step goal: 7,820 / 10,000</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4 rounded-full bg-white px-5 py-2 shadow-lg">
                <BellRing className="h-5 w-5 text-orange-500" />
                <div className="text-sm">
                  <p className="font-semibold">Instant focus alerts</p>
                  <p className="text-xs text-slate-500">Stay in flow wherever you move</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="space-y-24">
        <section id="product" className="relative">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 md:px-10">
            <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex-1 space-y-4">
                <span className="rounded-full bg-orange-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                  Product
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">Designed to move with you</h2>
                <p className="text-base text-slate-600">
                  Crafted from recycled titanium with ceramic inlays, the Proland watch balances durability with elegance. Interchangeable straps snap into place, while the adaptive crown gives precise tactile control.
                </p>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {specs.map((spec) => (
                    <div key={spec.name} className="rounded-2xl bg-white p-5 shadow-md">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{spec.name}</dt>
                      <dd className="mt-2 text-xl font-semibold text-slate-900">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="flex flex-1 flex-col items-center gap-6">
                <Image
                  src="/proland/watch-hero.svg"
                  alt="Proland smart watch"
                  width={420}
                  height={420}
                  className="w-full max-w-sm"
                  priority
                />
                <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <p className="text-sm text-slate-600">
                    Ships with three vegan leather straps and fast magnetic charger
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
            <div className="space-y-4 text-center">
              <span className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Features
              </span>
              <h2 className="text-3xl font-bold md:text-4xl">Everything you need on your wrist</h2>
              <p className="mx-auto max-w-2xl text-base text-slate-600">
                Powerful, intuitive, and crafted for everyday adventures. Proland brings together wellness, productivity, and protection in a single ecosystem.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ title, description, icon: Icon }) => (
                <div key={title} className="group flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-400/70 hover:shadow-xl">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="absolute inset-x-0 top-1/2 -z-10 h-3/4 -translate-y-1/2 bg-gradient-to-b from-orange-100 via-white to-transparent" />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 md:px-10 lg:flex-row">
            <div className="flex flex-1 flex-col gap-6 rounded-3xl bg-white p-10 shadow-xl">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-orange-500">
                <Cpu className="h-4 w-4" /> Core intelligence
              </span>
              <h2 className="text-3xl font-bold">Proland OS keeps pace with your rhythm</h2>
              <p className="text-base text-slate-600">
                From sunrise rituals to late-night wind-downs, adaptive automations learn from your habits and coach you toward healthier focus. Sync seamlessly across phone, tablet, and desktop dashboards.
              </p>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Personalised workout libraries with live coaching feedback
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Context-aware notifications that surface only what matters
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  End-to-end encryption keeps every metric private by default
                </li>
              </ul>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 transition hover:text-orange-600"
              >
                Dive deeper into Proland OS
                <span aria-hidden>&rarr;</span>
              </Link>
            </div>
            <div className="flex flex-1 flex-col justify-between gap-6">
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 text-white shadow-2xl">
                <h3 className="text-2xl font-semibold">Focus sessions that adapt in real time</h3>
                <p className="mt-4 text-sm text-slate-200">
                  Guided breathing, posture nudges, and ambient soundscapes dynamically adjust based on your heart rate and surroundings.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wider text-orange-200">Today</p>
                    <p className="mt-2 text-lg font-semibold">3 Focus streaks</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-wider text-orange-200">Energy</p>
                    <p className="mt-2 text-lg font-semibold">Balanced</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-xl">
                <h3 className="text-xl font-semibold text-slate-900">Find your look</h3>
                <p className="mt-2 text-sm text-slate-600">Swap bands with magnetic connectors. Choose between sport, classic, and woven collections.</p>
                <div className="mt-6 flex flex-wrap gap-4">
                  {['Sunset coral', 'Midnight titanium', 'Olive trail'].map((band) => (
                    <span
                      key={band}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600"
                    >
                      {band}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="reviews" className="bg-white py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
            <div className="space-y-4 text-center">
              <span className="rounded-full bg-orange-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                Reviews
              </span>
              <h2 className="text-3xl font-bold md:text-4xl">Loved by creators and explorers</h2>
              <p className="mx-auto max-w-2xl text-base text-slate-600">
                Hear how people around the world weave Proland into their day. Every story fuels the future of our wearable platform.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <article key={testimonial.author} className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                  <p className="text-lg text-slate-700">“{testimonial.quote}”</p>
                  <div className="mt-auto">
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="relative">
          <div className="absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-br from-pink-50 via-orange-50 to-transparent" />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 md:px-10 lg:flex-row">
            <div className="flex-1 space-y-4">
              <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600 shadow">
                Contact
              </span>
              <h2 className="text-3xl font-bold md:text-4xl">Let’s build your Proland experience</h2>
              <p className="text-base text-slate-600">
                Our specialists can help you choose the right bundles, accessories, and enterprise deployment packages for your team.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showroom</p>
                  <p className="mt-1 font-semibold text-slate-900">Downtown Innovation Hub</p>
                  <p className="text-sm text-slate-500">Visit us Mon-Sat, 10am — 7pm</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-md">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Support</p>
                  <p className="mt-1 font-semibold text-slate-900">support@proland.co</p>
                  <p className="text-sm text-slate-500">We respond within 24 hours</p>
                </div>
              </div>
            </div>
            <form className="flex flex-1 flex-col gap-4 rounded-3xl bg-white p-8 shadow-xl">
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Tell us about your ideal setup..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
              >
                Submit inquiry
              </button>
              <p className="text-xs text-slate-500">
                By submitting this form, you agree to our <Link href="/support" className="text-orange-500 hover:text-orange-600">privacy policy</Link>.
              </p>
            </form>
          </div>
        </section>

        <section id="blog" className="bg-white py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:px-10">
            <div className="space-y-4 text-center">
              <span className="rounded-full bg-orange-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                Blog
              </span>
              <h2 className="text-3xl font-bold md:text-4xl">Stay tuned with the Proland community</h2>
              <p className="mx-auto max-w-2xl text-base text-slate-600">
                Latest stories, behind-the-scenes drops, and tips to make the most of your watch.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {blogHighlights.map((post) => (
                <article key={post.slug} className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Featured</p>
                  <h3 className="text-2xl font-semibold text-slate-900">{post.title}</h3>
                  <p className="text-sm text-slate-600">{post.summary}</p>
                  <Link href={`/blog/${post.slug}`} className="mt-auto text-sm font-semibold text-orange-500 transition hover:text-orange-600">
                    Read more &rarr;
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="purchase" className="pb-24">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-16 text-center text-white shadow-2xl">
            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
              Ready to ship
            </span>
            <h2 className="text-3xl font-bold md:text-4xl">Claim the future of wearable tech today</h2>
            <p className="max-w-2xl text-sm text-slate-200">
              Secure your launch bundle and receive exclusive access to limited edition bands, curated workouts, and priority updates.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-100"
              >
                View bundles
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 text-sm text-slate-300">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="flex items-center gap-3 text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 font-semibold">
              P
            </span>
            <div>
              <p className="font-semibold">Proland</p>
              <p className="text-xs text-slate-400">Smartwatch experiences reinvented</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Proland Labs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
