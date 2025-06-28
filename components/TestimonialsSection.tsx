'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Snarbles transformed our community token from concept to reality in minutes. Six months later, we have 12,000+ holders and a thriving ecosystem!",
      author: "Alex Johnson",
      role: "DAO Founder",
      avatar: "AJ"
    },
    {
      quote: "As a non-technical founder, I assumed token creation would require expensive developers. With Snarbles, I launched our governance token myself in under 5 minutes—saving us $15,000 in dev costs.",
      author: "Sarah Chen",
      role: "CEO, MetaVentures",
      avatar: "SC"
    },
    {
      quote: "The tokenomics simulator was a game-changer—we designed a distribution model that perfectly balanced community incentives with investor returns. Our token is now listed on three exchanges!",
      author: "Michael Rodriguez",
      role: "Head of Blockchain Strategy",
      avatar: "MR"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Voices of Success</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join visionaries who transformed their token ideas into thriving digital ecosystems
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="testimonial-card text-center">
            <Quote className="w-12 h-12 text-red-500 mx-auto mb-6" />
            <blockquote className="text-xl text-muted-foreground mb-8 leading-relaxed">
              "{testimonials[currentTestimonial].quote}"
            </blockquote>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-[#fefde0] font-bold">
                {testimonials[currentTestimonial].avatar}
              </div>
              <div className="text-left">
                <div className="text-foreground font-semibold">
                  {testimonials[currentTestimonial].author}
                </div>
                <div className="text-muted-foreground text-sm">
                  {testimonials[currentTestimonial].role}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-4 mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevTestimonial}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-red-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextTestimonial}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}