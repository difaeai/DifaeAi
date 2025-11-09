import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const leadership = [
  {
    name: 'Sara Raza',
    title: 'Co-founder & CEO',
    bio: 'Former SOC director who scaled city-wide surveillance for Karachi SafeCity. Leads vision and customer impact.'
  },
  {
    name: 'Hassan Siddiqui',
    title: 'Co-founder & CTO',
    bio: 'Ex-Google ML engineer focused on real-time perception systems and resilient cloud-native pipelines.'
  },
  {
    name: 'Maria Imran',
    title: 'Head of Product',
    bio: 'Security design specialist translating frontline guard workflows into intuitive experiences and playbooks.'
  }
];

const milestones = [
  {
    year: '2020',
    detail: 'DIFAE founded with a mission to reimagine CCTV as an intelligent, preventive network.'
  },
  {
    year: '2021',
    detail: 'Launched first edge-to-cloud pipeline across 12 industrial sites with 2,000+ cameras onboarded.'
  },
  {
    year: '2022',
    detail: 'Released DIFAE Agent orchestration, expanding to municipal deployments and cross-agency incident routing.'
  },
  {
    year: '2023',
    detail: 'Achieved 99.1% threat classification accuracy benchmarked on local datasets across Pakistan.'
  },
  {
    year: '2024',
    detail: 'Expanded partner ecosystem, enabling integrations with guard tour, HR, and compliance systems.'
  }
];

const values = [
  {
    title: 'Mission-first',
    description: 'Protect communities and infrastructure by turning reactive footage into predictive intelligence.'
  },
  {
    title: 'Human-centred AI',
    description: 'We design with guards, responders, and operators so every detection is explainable and actionable.'
  },
  {
    title: 'Security without compromise',
    description: 'Zero-trust architecture, data residency, and rigorous governance keep sensitive evidence safeguarded.'
  }
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#050815] text-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="section-shell gap-12 pb-20 pt-24">
          <div className="flex flex-col gap-6 md:max-w-3xl">
            <Badge tone="accent" className="w-fit">About DIFAE</Badge>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              We build security intelligence that keeps people and places safe.
            </h1>
            <p className="text-lg text-white/70">
              DIFAE is a Pakistani-founded security intelligence company blending computer vision, automation, and human
              expertise to protect enterprises, smart cities, and mission-critical infrastructure.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="bg-white/[0.04]">
              <CardHeader>
                <CardTitle>7.2K+</CardTitle>
                <CardDescription>Incidents triaged each month across malls, campuses, and logistics hubs.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/[0.04]">
              <CardHeader>
                <CardTitle>120+</CardTitle>
                <CardDescription>Security leaders trained on DIFAE Agent response orchestration playbooks.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-white/[0.04]">
              <CardHeader>
                <CardTitle>24/7</CardTitle>
                <CardDescription>Operations support from local SOC experts who know your environment inside-out.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="section-shell">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">Leadership team</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Veterans of security operations centres, AI research, and enterprise software who care about outcomes on the
              ground.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {leadership.map((person) => (
              <Card key={person.name} className="border-white/10 bg-white/[0.04]">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#22D3EE]" />
                    <div>
                      <CardTitle>{person.name}</CardTitle>
                      <CardDescription>{person.title}</CardDescription>
                    </div>
                  </div>
                  <CardDescription className="text-white/70">{person.bio}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold md:text-4xl">Our journey</h2>
              <p className="text-white/70">
                DIFAE keeps innovating with partners and customers who share the vision of proactive, humane security. Every
                milestone represents tighter collaboration between technology, operators, and communities.
              </p>
            </div>
            <div className="space-y-6">
              {milestones.map((milestone) => (
                <Card key={milestone.year} className="border-white/10 bg-white/[0.03]">
                  <CardHeader>
                    <Badge tone="neutral" className="w-fit">{milestone.year}</Badge>
                    <CardDescription>{milestone.detail}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="section-shell pb-24">
          <div className="space-y-6 text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">What guides us</h2>
            <p className="mx-auto max-w-2xl text-white/70">
              Our values shape the partnerships we build, the technology we ship, and the trust we uphold in every incident
              response.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <Card key={value.title} className="border-[#22D3EE]/30 bg-gradient-to-b from-[#22D3EE]/10 to-transparent">
                <CardHeader>
                  <CardTitle>{value.title}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
