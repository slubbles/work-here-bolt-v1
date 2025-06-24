import HeroSection from '@/components/HeroSection';
import StatsSection from '@/components/StatsSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';

export default function Home() {
  return (
    <div className="min-h-screen app-background">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
    </div>
  );
}