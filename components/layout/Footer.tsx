import { Github, Twitter, Globe, FileText, HelpCircle, Shield, Users, Code, BookOpen, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Create Token', href: '/create', icon: Code },
        { name: 'Tokenomics Simulator', href: '/tokenomics', icon: FileText },
        { name: 'Token Verification', href: '/verify', icon: Shield },
        { name: 'Dashboard', href: '/dashboard', icon: Users },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: 'https://docs.snarbles.xyz', icon: BookOpen },
        { name: 'API Reference', href: 'https://api.snarbles.xyz', icon: Code },
        { name: 'Guides & Tutorials', href: 'https://learn.snarbles.xyz', icon: HelpCircle },
        { name: 'Community Forum', href: 'https://community.snarbles.xyz', icon: MessageCircle },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: 'https://about.snarbles.xyz', icon: Users },
        { name: 'Blog', href: 'https://blog.snarbles.xyz', icon: FileText },
        { name: 'Contact', href: 'https://contact.snarbles.xyz', icon: MessageCircle },
        { name: 'GitHub', href: 'https://github.com/snarbles', icon: Code },
      ],
    },
  ];

  return (
    <footer className="app-background border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">Snarbles</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The decentralized way to create and manage your own tokens. Empowering creators worldwide with professional-grade blockchain tools.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/snarbles" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/snarbles" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://snarbles.xyz" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-foreground font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center space-x-2 group"
                    >
                      <link.icon className="w-4 h-4 group-hover:text-red-500 transition-colors" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2025 Snarbles. All rights reserved. Built with ❤️ for the decentralized future.
            </p>
            <div className="flex space-x-6">
              <Link 
                href="https://legal.snarbles.xyz/terms" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Terms of Service
              </Link>
              <Link 
                href="https://legal.snarbles.xyz/privacy" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-muted-foreground text-xs">
                Snarbles is a fully decentralized token creation platform. Always do your own research before investing in any cryptocurrency or token.
                This platform operates without any centralized dependencies. Please ensure compliance with your local regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}