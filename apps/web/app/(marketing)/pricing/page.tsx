import { SiteHeader } from '../../../components/site-header';
import { SiteFooter } from '../../../components/site-footer';
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from '@difae/ui';

const plans = [
  {
    name: 'Starter',
    price: 'PKR 45,000',
    description: 'Single site coverage with critical alerts and PDF reporting.',
    features: ['Up to 20 cameras', 'Email + WhatsApp alerts', 'Nightly PDF report']
  },
  {
    name: 'Growth',
    price: 'PKR 125,000',
    description: 'Multi-site automation with workflow routing.',
    features: ['Up to 70 cameras', 'Playbook automation', 'Priority support']
  },
  {
    name: 'Enterprise',
    price: 'Let’s design together',
    description: 'Fully tailored deployments with dedicated success architects.',
    features: ['Unlimited cameras', '24/7 SOC handoff', 'Custom integrations']
  }
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="section-shell flex-1">
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-4xl font-semibold">Plans built for resilient security teams</h1>
          <p className="mx-auto max-w-2xl text-white/70">
            Switch between monthly or annual billing anytime. Annual plans save 18% and include onsite onboarding.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.name === 'Growth' ? 'border-[#22D3EE]/40 bg-white/10' : ''}>
              <CardHeader>
                <Badge tone={plan.name === 'Growth' ? 'accent' : 'neutral'}>{plan.name}</Badge>
                <CardTitle>{plan.price}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <ul className="mt-6 space-y-3 text-sm text-white/70">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <Button className="mt-6" variant={plan.name === 'Growth' ? 'primary' : 'secondary'}>
                  Choose plan
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
