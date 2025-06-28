'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Plus, Flame, Pause, Settings, Users, Rocket, Wallet, BarChart3, Shield } from 'lucide-react';

export default function FAQSection() {
  const faqs = [
    {
      id: 'how-it-works',
      icon: Rocket,
      question: 'How does the token creation process work?',
      answer: 'Creating a token with Snarbles is streamlined for maximum efficiency: 1) Connect your wallet (Solana or Algorand), 2) Customize your token (name, symbol, supply, decimals), 3) Select advanced features (mintable/burnable/pausable), 4) Enhance with metadata (logo, social links, description), 5) Click "Launch" and approve the network transaction (typically $0.001-$5 depending on network). Your token deploys in under 30 seconds with a verified contract address, transaction history, and immediate management capabilities.'
    },
    {
      id: 'wallet-setup',
      icon: Wallet,
      question: 'What wallet do I need and how do I set it up?',
      answer: 'You need either a Solana wallet (Phantom, Solflare, Backpack) or an Algorand wallet (Pera, MyAlgo). For beginners, we recommend Phantom (Solana) or Pera Wallet (Algorand) for their user-friendly interfaces. Download your chosen wallet extension/app, create or import a wallet, and fund it with a small amount of SOL (for Solana) or ALGO (for Algorand) to cover network fees. Our platform detects compatible wallets automatically—simply click "Connect Wallet" to begin securely.'
    },
    {
      id: 'mint-tokens',
      icon: Plus,
      question: 'What does "Mintable" mean and how do I use it?',
      answer: 'The "Mintable" feature gives you (as token creator) the ability to generate additional tokens beyond the initial supply—essential for dynamic tokenomics. This feature enables: 1) Controlled inflation for ecosystem growth, 2) Reward distribution for community engagement, 3) Strategic reserve funding as your project evolves, and 4) Airdrops for marketing campaigns. After deployment, you can mint new tokens instantly through the Dashboard\'s "Manage" tab with full transparency—each mint transaction is recorded on-chain with complete auditability.'
    },
    {
      id: 'burn-tokens',
      icon: Flame,
      question: 'How does token burning work?',
      answer: 'Token burning—available when you enable the "Burnable" feature—permanently removes tokens from circulation by sending them to an unrecoverable zero address. This deflationary mechanism can: 1) Systematically increase token scarcity over time, 2) Balance supply with demand for price stability, 3) Serve as a value-accrual mechanism where a percentage of transaction fees are burned, and 4) Allow redemption mechanisms where tokens are burned in exchange for other assets. Each burn transaction creates an immutable on-chain record, providing transparent tokenomics accountability for your community.'
    },
    {
      id: 'pause-transfers',
      icon: Pause,
      question: 'When should I use the pause feature?',
      answer: 'The "Pausable" feature provides an emergency circuit-breaker to temporarily freeze all token transfers—a critical security capability for responsible token governance. This should be used selectively in three specific scenarios: 1) During critical smart contract upgrades to prevent transaction conflicts, 2) If security vulnerabilities are detected, allowing time for resolution without exploitation, and 3) During major governance transitions to ensure orderly processes. This feature should be used judiciously as it impacts all holders. Many mature projects implement multi-signature controls requiring approval from multiple trusted parties before pausing can be activated.'
    },
    {
      id: 'update-metadata',
      icon: Settings,
      question: 'Can I update my token information after deployment?',
      answer: 'Yes! While certain on-chain parameters like name, symbol and decimals are immutable after creation, you can update all associated metadata including: 1) Logo and brand assets to reflect evolving visual identity, 2) Project descriptions and mission statements as your focus refines, 3) Website URLs and documentation links as your online presence grows, 4) Social media profiles as your community channels expand, and 5) Additional attributes like whitepaper links or team information. All metadata updates are version-controlled and timestamped, giving your community complete transparency into your project\'s evolution.'
    },
    {
      id: 'transfer-ownership',
      icon: Users,
      question: 'Can I transfer control of my token to someone else?',
      answer: 'Absolutely. Our token contracts include comprehensive authority management that allows you to transfer administrative control with granular permissions. This enables three essential governance structures: 1) Transitioning from individual to team management as your project grows, 2) Implementing multi-signature security requiring multiple approvals for critical actions, and 3) Progressive decentralization by transferring control to a DAO or community governance system. The ownership transfer process includes a two-step confirmation system to prevent accidental transfers, with complete on-chain transparency for your community.'
    },
    {
      id: 'analytics-tracking',
      icon: BarChart3,
      question: 'How can I track my token\'s performance?',
      answer: 'Your token dashboard delivers enterprise-grade analytics across four key dimensions: 1) Holder metrics—track growth rates, wallet concentration, and retention/churn, 2) Transaction patterns—monitor volume trends, largest transactions, and liquidity distribution, 3) Market performance—view price movement, volatility metrics, and correlation with major assets, and 4) Community engagement—measure social sentiment, developer activity, and ecosystem growth. All metrics are real-time, on-chain verified, and exportable for custom analysis. For Solana tokens, we provide specialized SPL metrics for supply circulation and program interaction patterns.'
    },
    {
      id: 'security-verification',
      icon: Shield,
      question: 'How do I verify my token is secure and legitimate?',
      answer: 'Our comprehensive Token Verification system provides multi-layered security analysis: 1) Smart contract audit—automated scanning for 20+ common vulnerabilities, 2) Ownership analysis—verification of creator credentials and authorization chains, 3) Liquidity assessment—evaluation of market depth and trading patterns to detect potential manipulation, 4) Distribution scoring—analysis of token concentration and whale activity risks, and 5) Social verification—cross-referencing with known projects and community feedback. Each verified token receives a dynamic security score (0-100) and verification badge, establishing immediate credibility with exchanges, investors and community members. The verification process typically completes within minutes of token creation.'
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
          <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
            How It Works & Smart Contract Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Master the essentials of token creation, management, and ecosystem growth.
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