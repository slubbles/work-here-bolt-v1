'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Snarbles made it incredibly easy to launch our community token. We were up and running in less than an hour!",
      author: "Alex Johnson",
      role: "Community Manager",
      avatar: "AJ"
    },
    {
      quote: "As a non-technical founder, I thought creating a token would be impossible. Snarbles proved me wrong - it's as easy as creating a social media account.",
      author: "Sarah Chen",
      role: "Startup Founder",
      avatar: "SC"
    },
    {
      quote: "The tokenomics simulator helped us design the perfect distribution for our project. The visual tools made it simple to explain to our investors.",
      author: "Michael Rodriguez",
      role: "Project Lead",
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
          <h2 className="text-4xl font-bold text-foreground mb-4">What Our Users Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of creators who have successfully launched their tokens with Snarbles
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