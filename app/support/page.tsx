'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, Mail, MessageSquare, HelpCircle, CheckCircle, AlertTriangle, Send, Phone, Clock, Info, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    setShowSuccess(true);
    
    // Reset form after 4 seconds
    setTimeout(() => {
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setShowSuccess(false);
    }, 4000);
    
    // Open mailto link
    window.open(`mailto:snarblescorp@gmail.com?subject=${encodeURIComponent(subject || 'Support Request')}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`);
  };
  
  const copyEmail = () => {
    navigator.clipboard.writeText('snarblescorp@gmail.com');
    setCopySuccess(true);
    toast({
      title: "Email copied!",
      description: "Support email address copied to clipboard",
    });
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const supportFaqs = [
    {
      question: "How long does it typically take to get a response?",
      answer: "We aim to respond to all support inquiries within 24-48 hours during business days. For urgent matters related to token creation or wallet issues, we prioritize response times."
    },
    {
      question: "What information should I include in my support request?",
      answer: "To help us resolve your issue faster, please include: your wallet address (if relevant), the blockchain network you're using, a detailed description of the issue, any error messages you received, and steps to reproduce the problem."
    },
    {
      question: "Do you offer phone support?",
      answer: "We currently offer support primarily via email. This allows our technical team to thoroughly investigate issues and provide comprehensive solutions. For urgent matters, we may arrange a call after initial email contact."
    },
    {
      question: "Can I get help with recovering lost tokens or wallet access?",
      answer: "We can provide guidance, but due to the decentralized nature of blockchain, we cannot directly recover lost tokens or wallet access. Always keep your seed phrases and private keys secure, as they cannot be reset or recovered by anyone."
    },
    {
      question: "Is there a fee for support services?",
      answer: "Basic support is provided free of charge to all users. For premium support with faster response times or complex enterprise solutions, we offer paid support packages. Contact us for details."
    }
  ];

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <MessageSquare className="w-4 h-4" />
            <span className="uppercase tracking-wide">Support Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            We're Here to <span className="text-red-500">Help</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get assistance with token creation, wallet connections, or any questions about the platform
          </p>
        </div>

        <Tabs defaultValue="contact" className="space-y-8">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="contact" className="text-base py-3">
              <Mail className="w-4 h-4 mr-2" />
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-base py-3">
              <HelpCircle className="w-4 h-4 mr-2" />
              Support FAQs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info Card */}
              <div className="lg:col-span-1">
                <Card className="glass-card h-full">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Reach out to us through these channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/50">
                        <Mail className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <p className="text-foreground font-medium">Email Support</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-muted-foreground text-sm font-mono">snarblescorp@gmail.com</p>
                            <button 
                              onClick={copyEmail} 
                              className="text-blue-500 hover:text-blue-600 transition-colors"
                              aria-label="Copy email address"
                            >
                              {copySuccess ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">Fastest response channel</p>
                        </div>
                      </div>
                      
                      {/* Response Time */}
                      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                        <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium">Response Time</p>
                          <p className="text-muted-foreground text-sm">Within 24-48 hours</p>
                        </div>
                      </div>
                      
                      {/* Hours */}
                      <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg">
                        <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-foreground font-medium">Support Hours</p>
                          <p className="text-muted-foreground text-sm">Monday - Friday: 9AM - 6PM ET</p>
                          <p className="text-muted-foreground text-sm">Weekend: Limited Support</p>
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="border-red-500/30 bg-red-500/5">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-semibold">Security Notice:</span> We will never ask for your private keys, seed phrases, or passwords.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Send us a Message</CardTitle>
                    <CardDescription>
                      Fill out this form and we'll get back to you as soon as possible
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {showSuccess ? (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center mb-4">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-green-600 mb-2">Message Sent!</h3>
                        <p className="text-muted-foreground">
                          Thank you for contacting us. We'll respond to your inquiry as soon as possible.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name">Your Name</Label>
                            <Input 
                              id="name" 
                              value={name} 
                              onChange={(e) => setName(e.target.value)} 
                              placeholder="John Doe"
                              required
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Your Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="john@example.com"
                              required
                              className="input-enhanced"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input 
                            id="subject" 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Help with token creation"
                            required
                            className="input-enhanced"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea 
                            id="message" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue or question in detail..."
                            required
                            rows={5}
                            className="input-enhanced min-h-[120px]"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          By submitting this form, you agree to our privacy policy and terms of service.
                        </p>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faq">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find quick answers to common support questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {supportFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-border py-2">
                      <AccordionTrigger className="text-foreground hover:no-underline">
                        <div className="flex items-center text-left">
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-700 mb-2">Still Need Help?</h3>
                      <p className="text-blue-600 mb-4">
                        If you couldn't find the answer to your question in our FAQ, please reach out directly:
                      </p>
                      <Button 
                        onClick={copyEmail}
                        variant="outline" 
                        className="border-blue-500/30 text-blue-700 hover:bg-blue-500/10"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {copySuccess ? 'Copied!' : 'Copy Email Address'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Support Info */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">We Support You Every Step of the Way</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Token Support</h3>
                <p className="text-muted-foreground">
                  Get help with token creation, management and blockchain integration issues
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Wallet Assistance</h3>
                <p className="text-muted-foreground">
                  Help with wallet connections, asset transfers and wallet troubleshooting
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass-card-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">General Questions</h3>
                <p className="text-muted-foreground">
                  Answers to frequently asked questions about our platform and services
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}