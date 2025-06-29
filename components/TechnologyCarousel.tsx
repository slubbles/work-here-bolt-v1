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
      className={`py-12 bg-white dark:bg-zinc-900 transition-all duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-10">
          Built With
        </h2>
        
        <div className="relative overflow-hidden">
          <div className="flex animate-carousel">
            {/* First set of logos */}
            {techPartners.map((partner, index) => (
              <a 
                key={`first-${index}`}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-8 flex items-center justify-center min-w-[150px] h-20 transition-all duration-300 filter grayscale hover:filter-none hover:scale-110"
              >
                <Image 
                  src={partner.logo} 
                  alt={partner.name}
                  width={120}
                  height={40}
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
                className="mx-8 flex items-center justify-center min-w-[150px] h-20 transition-all duration-300 filter grayscale hover:filter-none hover:scale-110"
              >
                <Image 
                  src={partner.logo} 
                  alt={partner.name}
                  width={120}
                  height={40}
                  className="object-contain max-h-full"
                />
              </a>
            ))}
          </div>
          
          {/* Gradient overlays to create fade effect on edges */}
          <div className="absolute top-0 left-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent z-10"></div>
          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-10"></div>
        </div>
      </div>
    </section>
  );
}