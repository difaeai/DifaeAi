import Image from 'next/image';
import Link from 'next/link';
import {
  BatteryCharging,
  BellRing,
  Cpu,
  HeartPulse,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Wifi
} from 'lucide-react';

const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'Experience', href: '#experience' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' }
];

const featureHighlights = [
  {
    title: 'Intelligent health tracking',
    description:
      'Continuous biometric monitoring with AI-assisted insights that keep you ahead of stress, sleep, and training goals.',
    icon: HeartPulse
  },
  {
    title: 'Resilient design',
    description:
      'Ultra-light titanium chassis, ceramic shield glass, and IP68 protection allow Proland to thrive in any environment.',
    icon: ShieldCheck
  },
  {
    title: 'Always connected',
    description:
      '5G, dual-band Wi-Fi, and onboard eSIM keep notifications, calls, and maps one gesture away even without your phone.',
    icon: Wifi
  },
  {
    title: 'Adaptive battery',
    description:
      'Optimised power profiles learn your routine to unlock up to 72 hours of performance with rapid solar top-ups.',
    icon: BatteryCharging
  },
  {
    title: 'Navigation built-in',
    description:
      'Precision dual-frequency GPS with offline maps, waypoint sharing, and trackback guidance for confident exploration.',
    icon: MapPin
  },
  {
    title: 'Ambient intelligence',
    description:
      'Context-aware assistant anticipates what you need—morning briefings, travel reminders, and smarter home automation.',
    icon: Sparkles
  }
];

const strapOptions = [
  {
    name: 'Midnight Alloy',
    description: 'Brushed titanium links with a magnetic clasp built for workdays and night outs alike.',
    swatch: '#111827'
  },
  {
    name: 'Summit Weave',
    description: 'Breathable alpine nylon that dries fast and flexes with every ascent and descent.',
    swatch: '#1f6feb'
  },
  {
    name: 'Aurora Silicone',
    description: 'Soft-touch fluoroelastomer strap inspired by polar skies for daily training sessions.',
    swatch: '#6366f1'
  }
];

const experiencePillars = [
  {
    title: 'Proland OS 4',
    description:
      'Widgets, complications, and adaptive scenes tailored to your habits deliver just the right glanceable information.',
    icon: Cpu
  },
  {
    title: 'Night mode',
    description:
      'Auto-toned lunar interface preserves melatonin levels and extends overnight vitals tracking.',
    icon: Moon
  },
  {
    title: 'Sunrise routine',
    description:
      'Morning snapshots pair solar charge forecasts with hydration and motion prompts to kick-start the day.',
    icon: Sun
  },
  {
    title: 'Focus alerts',
    description:
      'Smart vibrations and haptic cues surface only the priority updates so you can stay in the zone.',
    icon: BellRing
  }
];

const pricingPlans = [
  {
    name: 'Explorer',
    price: '$349',
    description: 'Everything you need to monitor health metrics, workouts, and stay connected on the go.',
    highlights: ['Titanium watch body', 'Magnetic charging puck', '6 months of Proland OS upgrades', 'Standard support'],
    featured: false
  },
  {
    name: 'Founder Edition',
    price: '$449',
    description: 'Exclusive finishes, extra straps, and 18 months of concierge support for power users.',
    highlights: [
      'Mirror-polished titanium + ceramic crown',
      'Summit Weave & Aurora Silicone straps',
      '18 months of Proland+ premium services',
      'Priority concierge and accidental coverage'
    ],
    featured: true
  }
];

const faqs = [
  {
    question: 'How long does the battery last on a single charge?',
    answer:
      'With adaptive battery modes enabled, Proland delivers up to 72 hours of typical use or 36 hours with continuous GPS and heart monitoring.'
  },
  {
    question: 'Is the watch compatible with my phone?',
    answer:
      'Proland syncs with both iOS and Android using the companion app. Core features like eSIM calling, notifications, and workouts are available on both platforms.'
  },
  {
    question: 'Can I take Proland swimming?',
    answer:
      'Yes. The titanium chassis and sealed gaskets are rated IP68 and tested for water resistance up to 50 meters.'
  },
  {
    question: 'What kind of warranty do I receive?',
    answer:
      'Every watch includes a two-year limited hardware warranty with the option to extend coverage through Proland+.'
  }
];

const stories = [
  {
    title: 'Designing the strap ecosystem',
    excerpt: 'From mountain-ready nylon to lounge-worthy silicone, see how we prototyped 120 strap variations.',
    href: '#'
  },
  {
    title: 'Inside the Proland sensor core',
    excerpt: 'Discover how our optical array captures medical-grade signals even during intense motion.',
    href: '#'
  },
  {
    title: 'Battery breakthroughs that power Proland',
    excerpt: 'A behind-the-scenes look at adaptive cell chemistry and solar augmentation.',
    href: '#'
  }
];

export default function ProlandHomePage() {
  return (
    <main className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_transparent_55%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="#home" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-lg">
              P
            </span>
            Proland
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 lg:flex">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="#pricing"
            className="hidden rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 lg:inline-flex"
          >
            Pre-order now
          </Link>
        </div>
      </header>

      <section id="home" className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-6">
          <span className="w-fit rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-300">
            Limited release
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            A wearable companion engineered for every expedition
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            Proland fuses aerospace-grade materials with ambient intelligence so you can move faster, recover smarter, and stay
            effortlessly connected without your phone.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-slate-200"
            >
              Explore features
            </Link>
            <Link
              href="#experience"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:text-slate-50"
            >
              Watch the experience
            </Link>
          </div>
          <dl className="grid max-w-2xl grid-cols-2 gap-6 pt-4 text-sm text-slate-300 sm:grid-cols-4">
            <div>
              <dt className="font-medium text-white">Battery</dt>
              <dd>72h adaptive power</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Waterproof</dt>
              <dd>IP68 · 50m tested</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Sensors</dt>
              <dd>12-point optical array</dd>
            </div>
            <div>
              <dt className="font-medium text-white">Connectivity</dt>
              <dd>5G · eSIM · Wi-Fi 6E</dd>
            </div>
          </dl>
        </div>
        <div className="relative flex flex-1 justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/10 blur-3xl" />
          <div className="relative flex h-full w-full max-w-md flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_40px_120px_rgba(37,99,235,0.25)] backdrop-blur">
            <Image src="/proland/watch-hero.svg" alt="Proland smartwatch" width={320} height={320} priority />
            <div className="space-y-2 text-sm text-slate-300">
              <p className="font-semibold uppercase tracking-[0.3em] text-blue-200">Pulse sync engine</p>
              <p>Track VO₂ max, HRV, blood oxygen, and body temperature with unrivalled accuracy—even during intense motion.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/10 bg-slate-900/50 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <div className="max-w-2xl space-y-4">
            <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200">
              Features
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Every detail honed for performance and clarity</h2>
            <p className="text-slate-300">
              From the sapphire crystal lens to the neural vibration engine, Proland delivers a refined experience crafted to keep
              you focused on what matters most.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/20">
                <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="showcase" className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <span className="rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
              Strap studio
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Switch looks in seconds</h2>
            <p className="text-lg text-slate-300">
              Each Proland ships with the Founder strap collection. Swap materials with a single click, pair colours to your fit,
              and save routines that auto-adjust watch faces the moment a new strap is detected.
            </p>
            <ul className="space-y-5">
              {strapOptions.map((strap) => (
                <li key={strap.name} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="mt-1 h-10 w-10 rounded-full border border-white/10" style={{ backgroundColor: strap.swatch }} />
                  <div>
                    <p className="text-base font-semibold text-white">{strap.name}</p>
                    <p className="text-sm text-slate-300">{strap.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-1 justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-blue-500/10 p-1 shadow-[0_30px_90px_rgba(59,130,246,0.35)]">
              <div className="aspect-[3/4] overflow-hidden rounded-[calc(theme(borderRadius.3xl)-0.25rem)] bg-slate-950">
                <Image src="/proland/watch-hero.svg" alt="Watch straps" width={600} height={800} className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="border-y border-white/10 bg-slate-900/50 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <div className="max-w-2xl space-y-4">
            <span className="rounded-full border border-purple-400/40 bg-purple-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200">
              Experience
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Proland OS delivers clarity day and night</h2>
            <p className="text-slate-300">
              Designed with explorers, athletes, and creators, our interface moves seamlessly from sunrise to after-hours with
              thoughtful cues and immersive interactions.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {experiencePillars.map((pillar) => (
              <div key={pillar.title} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-900/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                  <p className="text-sm text-slate-300">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Choose your Proland collection</h2>
            <p className="mt-4 text-slate-300">
              Each pre-order ships with express delivery, onboarding support, and free returns within the first 60 days.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`flex h-full flex-col gap-6 rounded-3xl border bg-white/5 p-8 shadow-[0_35px_120px_rgba(37,99,235,0.25)] ${
                  plan.featured ? 'border-blue-500/60' : 'border-white/10'
                }`}
              >
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">{plan.name}</p>
                  <p className="text-4xl font-bold text-white">{plan.price}</p>
                  <p className="text-sm text-slate-300">{plan.description}</p>
                </div>
                <ul className="space-y-3 text-sm text-slate-200">
                  {plan.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 text-[10px] font-semibold text-white">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="#contact"
                  className={`mt-auto inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/40'
                      : 'border border-white/30 text-white hover:border-white/60'
                  }`}
                >
                  Reserve this model
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/10 bg-slate-900/50 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row">
          <div className="flex-1 space-y-4">
            <span className="rounded-full border border-indigo-400/40 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
              Support
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Answers before you unbox</h2>
            <p className="text-slate-300">
              Need more details? Chat with us any time. Our concierge team is ready to guide sizing, strap selection, and setup.
            </p>
          </div>
          <div className="flex-1 space-y-4">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-white/10 bg-white/5 p-5">
                <summary className="cursor-pointer text-base font-semibold text-white group-open:text-blue-200">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">
          <div className="flex flex-col gap-4 text-center">
            <span className="mx-auto w-fit rounded-full border border-purple-400/40 bg-purple-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-200">
              Stories
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Behind the scenes at Proland Labs</h2>
            <p className="mx-auto max-w-2xl text-slate-300">
              Go deeper into our design philosophy, sustainability goals, and the community shaping the next wave of Proland
              experiences.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {stories.map((story) => (
              <article key={story.title} className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">Proland Journal</p>
                <h3 className="text-xl font-semibold text-white">{story.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{story.excerpt}</p>
                <Link href={story.href} className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-blue-100">
                  Read story
                  <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-slate-900/60 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200">
              Concierge
            </span>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Reserve your Proland</h2>
            <p className="text-lg text-slate-300">
              Share a few details and our concierge team will confirm availability, sizing guidance, and delivery timelines for
              your region.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                <p className="font-semibold text-white">Showroom</p>
                <p>Level 18, Innovation Tower<br />Dubai Design District</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                <p className="font-semibold text-white">Support</p>
                <p>concierge@proland.com<br />+971 4 000 1234</p>
              </div>
            </div>
          </div>
          <form className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-[0_35px_120px_rgba(37,99,235,0.35)] backdrop-blur">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-white/80">
                Full name
                <input
                  className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Amina Rahman"
                  type="text"
                  name="name"
                  required
                />
              </label>
              <label className="text-sm font-medium text-white/80">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="you@example.com"
                  type="email"
                  name="email"
                  required
                />
              </label>
              <label className="text-sm font-medium text-white/80">
                Region
                <input
                  className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="City, Country"
                  type="text"
                  name="region"
                />
              </label>
              <label className="text-sm font-medium text-white/80">
                Preferred edition
                <select
                  className="mt-2 w-full appearance-none rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  name="edition"
                >
                  {pricingPlans.map((plan) => (
                    <option key={plan.name} value={plan.name} className="bg-slate-900 text-white">
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-5 block text-sm font-medium text-white/80">
              Message
              <textarea
                className="mt-2 h-28 w-full rounded-xl border border-white/20 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Tell us about your goals, team, or upcoming adventures."
                name="message"
              />
            </label>
            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:from-blue-400 hover:to-indigo-400"
            >
              Submit request
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Proland Labs. Crafted with purpose in Dubai.</p>
          <div className="flex flex-wrap gap-4 text-slate-400">
            <Link href="#features" className="hover:text-white">
              Features
            </Link>
            <Link href="#pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="#contact" className="hover:text-white">
              Contact
            </Link>
            <Link href="#" className="hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
