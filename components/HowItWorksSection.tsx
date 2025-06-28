import { Wallet, Settings, BarChart3, Rocket } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      icon: Wallet,
      title: 'Connect Your Wallet',
      description: 'Securely connect your Solana or Algorand wallet with one click.',
    },
    {
      number: '02',
      icon: Settings,
      title: 'Configure Your Token',
      description: 'Customize name, symbol, supply, and advanced features with our visual builder.',
    },
    {
      number: '03',
      icon: BarChart3,
      title: 'Set Tokenomics',
      description: 'Design optimal distribution models and governance parameters for long-term success.',
    },
    {
      number: '04',
      icon: Rocket,
      title: 'Deploy & Verify',
      description: 'One-click deployment to your chosen network with automatic verification and listing.',
    },
  ];

  return (
    <section className="py-20 app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">The 4-Step Journey</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From concept to launched token in four simple, guided steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="relative mb-6">
                <div className="glass-card p-6 inline-block">
                  <div className="step-number mb-4">
                    {step.number}
                  </div>
                  <step.icon className="w-8 h-8 text-red-500 mx-auto" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}