import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import SponsorsSection from '@/components/SponsorsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  return (
    <div className="min-h-screen app-background">
      {/* Fixed Bolt.new Badge for Homepage */}
      <div className="fixed top-20 right-4 z-40">
        <a 
          href="https://bolt.new/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block transition-transform hover:scale-110"
        >
          <img 
            src="/white_circle_360x360 copy.png" 
            alt="Powered by Bolt.new" 
            className="w-10 h-10 sm:w-12 sm:h-12"
          />
        </a>
      </div>

      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SponsorsSection />
      <TestimonialsSection />
      <FAQSection />
    </div>
  );
}