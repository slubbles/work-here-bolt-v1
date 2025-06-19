'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Plus, Flame, Pause, Settings, Users, Rocket, Wallet, BarChart3, Shield } from 'lucide-react';

export default function FAQSection() {
  const faqs = [
    {
      id: 'how-it-works',
      icon: Rocket,
      question: 'How does the token creation process work?',
      answer: 'Creating a token with Snarbles is simple: 1) Connect your wallet, 2) Fill in your token details (name, symbol, supply), 3) Choose features like mintable/burnable, 4) Add social links and description, 5) Click "Launch" and pay a small network fee (~$2-5). Your token will be deployed to the SOON Network in about 30 seconds and you\'ll receive the contract address to share with your community.'
    },
    {
      id: 'wallet-setup',
      icon: Wallet,
      question: 'What wallet do I need and how do I set it up?',
      answer: 'You need a Solana-compatible wallet like Phantom, Solflare, or Backpack. Download the wallet extension, create a new wallet or import an existing one, and make sure you have some SOON tokens for deployment fees. The wallet will automatically connect to our platform when you click "Connect Wallet".'
    },
    {
      id: 'mint-tokens',
      icon: Plus,
      question: 'What does "Mintable" mean and how do I use it?',
      answer: 'If you chose the "Mintable" feature when creating your token, you (the token creator) can generate and add more tokens to the total supply at any time. This is perfect for rewards programs, airdrops, or funding future development. You can access this feature through your dashboard\'s "Manage" tab after your token is deployed.'
    },
    {
      id: 'burn-tokens',
      icon: Flame,
      question: 'How does token burning work?',
      answer: 'If you enabled the "Burnable" feature, you can permanently remove tokens from circulation. This reduces the total supply, potentially increasing the scarcity and value of remaining tokens. It\'s commonly used in deflationary tokenomics models. The burned tokens are sent to an unrecoverable address, making them permanently unusable.'
    },
    {
      id: 'pause-transfers',
      icon: Pause,
      question: 'When should I use the pause feature?',
      answer: 'The "Pausable" feature gives you an emergency switch to temporarily stop all token transfers. This is a critical security measure that can be used during major upgrades, if a bug is discovered, or to prevent unintended transactions during emergencies. Only use this feature when absolutely necessary, as it affects all token holders.'
    },
    {
      id: 'update-metadata',
      icon: Settings,
      question: 'Can I update my token information after deployment?',
      answer: 'Yes! While core properties like name and symbol are usually fixed, you can update associated metadata such as your token\'s logo URL, description, website links, and social media connections. This keeps your token\'s public information current as your project evolves.'
    },
    {
      id: 'transfer-ownership',
      icon: Users,
      question: 'Can I transfer control of my token to someone else?',
      answer: 'Absolutely. The smart contract includes a function that allows you to transfer administrative control (ownership) of the token to another wallet address. This is useful if you need to hand over control to a team member, DAO, or multi-signature wallet for enhanced security.'
    },
    {
      id: 'analytics-tracking',
      icon: BarChart3,
      question: 'How can I track my token\'s performance?',
      answer: 'Your dashboard provides comprehensive analytics including holder count, transaction history, price charts, and distribution metrics. You can monitor your token\'s growth, see who\'s buying/selling, and track community engagement. All data is updated in real-time from the blockchain.'
    },
    {
      id: 'security-verification',
      icon: Shield,
      question: 'How do I verify my token is secure and legitimate?',
      answer: 'Use our Token Verification page to check any token\'s security status. We analyze the smart contract for common vulnerabilities, verify the source code, and provide a security score. Verified tokens get a badge that builds trust with your community and potential investors.'
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <HelpCircle className="w-4 h-4" />
            <span className="uppercase tracking-wide">Complete Guide</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How It Works & Smart Contract Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about creating, managing, and growing your token.
          </p>
        </div>

        <div className="glass-card p-8">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border">
                <AccordionTrigger className="text-left hover:no-underline group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <faq.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6">
                  <div className="ml-14">
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {faq.answer}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            These administrative actions are typically restricted to the wallet address that deployed the token (the token creator), 
            ensuring that only you have the power to perform these functions.
          </p>
        </div>
      </div>
    </section>
  );
}