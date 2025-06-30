'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function TechnologyCarousel() {
  const [isVisible, setIsVisible] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = carouselRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);

  const techPartners = [
    {
      name: 'Bolt.new',
      logo: '/white_circle_360x360 copy.png',
      url: 'https://bolt.new'
    },
    {
      name: 'Anthropic/Claude',
      logo: '/anthropic.png',
      url: 'https://anthropic.com'
    },
    {
      name: 'Supabase',
      logo: '/supabase-logo-wordmark--dark.png',
      url: 'https://supabase.com'
    },
    {
      name: 'Algorand',
      logo: '/algorand_full_logo_white.png',
      url: 'https://algorand.com'
    },
    {
      name: 'Netlify',
      logo: '/netlify.svg',
      url: 'https://netlify.com'
    },
    {
      name: 'Pera Wallet',
      logo: '/pera.png',
      url: 'https://perawallet.app'
    }
  ];

  return (
    <section 
      ref={carouselRef}
      className={`py-16 relative overflow-hidden transition-all duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-10 border border-red-500/20 shadow-lg">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Built With
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Powered by industry-leading technology partners
            </p>
          </div>
          
          <div className="relative overflow-hidden mx-auto w-full">
            {/* Carousel Container */}
            <div className="animate-carousel items-center justify-center">
              {/* First set of logos */}
              {techPartners.map((partner, index) => (
                <a 
                  key={`first-${index}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 mx-12 flex items-center justify-center h-24 transition-all duration-300 filter grayscale hover:filter-none hover:scale-110"
                >
                  <Image 
                    src={partner.logo} 
                    alt={partner.name}
                    width={140}
                    height={50}
                    className="object-contain max-h-full"
                  />
                </a>
              ))}
              
              {/* Duplicate set for smooth infinite scrolling */}
              {techPartners.map((partner, index) => (
                <a 
                  key={`second-${index}`}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 mx-12 flex items-center justify-center h-24 transition-all duration-300 filter grayscale hover:filter-none hover:scale-110"
                >
                  <Image 
                    src={partner.logo} 
                    alt={partner.name}
                    width={140}
                    height={50}
                    className="object-contain max-h-full"
                  />
                </a>
              ))}
            </div>
            
            {/* Gradient overlays for fade effect */}
            <div className="absolute top-0 left-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          </div>
          
          <div className="flex justify-center mt-8">
            <a 
              href="https://bolt.new" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
            >
              <span>Built with Bolt.new</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}