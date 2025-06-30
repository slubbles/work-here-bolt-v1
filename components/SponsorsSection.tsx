'use client';

import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import Image from 'next/image';

export default function SponsorsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSection, setShowSection] = useState(true); // Control section visibility

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById('sponsors-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // Remove section from display
  if (!showSection) return null;
  
  return (
    <section id="sponsors-section" className="py-12 app-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">
            Built With
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Powered by industry-leading technology partners
          </p>
        </div>

        {/* Logos Grid */}
        <div 
          className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Algorand */}
          <div className="flex justify-center items-center p-4 h-16">
            <Image 
              src="/algorand_full_logo_white.png" 
              alt="Algorand" 
              width={180} 
              height={50} 
              className="object-contain h-12"
            />
          </div>
          
          {/* Supabase */}
          <div className="flex justify-center items-center p-4 h-16">
            <Image 
              src="/supabase-logo-wordmark--dark.png" 
              alt="Supabase" 
              width={180} 
              height={50} 
              className="object-contain h-10"
            />
          </div>
          
          {/* Netlify */}
          <div className="flex justify-center items-center p-4 h-16">
            <Image 
              src="/netlify.svg" 
              alt="Netlify" 
              width={140} 
              height={40} 
              className="object-contain h-10"
            />
          </div>
          
          {/* Vercel */}
          <div className="flex justify-center items-center p-4 h-16">
            <Image 
              src="/wordmark-white.svg" 
              alt="Vercel" 
              width={140} 
              height={40} 
              className="object-contain h-8"
            />
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Our platform leverages cutting-edge technologies from industry-leading partners
          </p>
          <div className="mt-2">
            <Image 
              src="/logotext_poweredby_360w.png" 
              alt="Powered By" 
              width={120} 
              height={30} 
              className="object-contain h-8 mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}