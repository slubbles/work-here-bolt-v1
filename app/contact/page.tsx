'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, HelpCircle, Send, Clock, MapPin, Globe, Twitter, Github, Check, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name || !email || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate form submission
    toast({
      title: "Sending Message",
      description: "Your message is being sent...",
    });
    
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you as soon as possible",
        variant: "default"
      });
      
      setFormSubmitted(true);
      
      // Reset form after 4 seconds
      setTimeout(() => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setFormSubmitted(false);
      }, 4000);
    }, 1500);
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="uppercase tracking-wide">Get In Touch</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Contact Snarbles <span className="text-red-500">Team</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're here to help with all your token creation and blockchain questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Information - Left Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Multiple ways to reach our team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold">Email</p>
                    <p className="text-muted-foreground text-sm break-all">team@snarbles.xyz</p>
                    <p className="text-xs text-muted-foreground">Typically replies within 24 hours</p>
                  </div>
                </div>
                
                {/* Social */}
                <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Twitter className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold">Twitter/X</p>
                    <p className="text-muted-foreground text-sm">@snarbles</p>
                    <p className="text-xs text-muted-foreground">Follow us for updates and tips</p>
                  </div>
                </div>
                
                {/* Github */}
                <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Github className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold">GitHub</p>
                    <p className="text-muted-foreground text-sm">github.com/snarbles</p>
                    <p className="text-xs text-muted-foreground">Check out our open source contributions</p>
                  </div>
                </div>
                
                {/* Location */}
                <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/50">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold">Headquarters</p>
                    <p className="text-muted-foreground text-sm">San Francisco, California</p>
                    <p className="text-xs text-muted-foreground">With remote team members worldwide</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Support Hours</CardTitle>
                <CardDescription>
                  When you can expect a response
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground font-medium">Monday - Friday</span>
                  <span className="text-muted-foreground">9:00 AM - 6:00 PM ET</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-foreground font-medium">Saturday</span>
                  <span className="text-muted-foreground">10:00 AM - 2:00 PM ET</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground font-medium">Sunday</span>
                  <span className="text-muted-foreground">Closed (Email Only)</span>
                </div>
                
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-600">
                      For urgent matters outside business hours, please include "URGENT" in your email subject line.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form - Right Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="message" className="space-y-8">
              <TabsList className="w-full grid grid-cols-3 mb-8">
                <TabsTrigger value="message" className="text-base py-3">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </TabsTrigger>
                <TabsTrigger value="support" className="text-base py-3">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Get Support
                </TabsTrigger>
                <TabsTrigger value="partnership" className="text-base py-3">
                  <Globe className="w-4 h-4 mr-2" />
                  Partnership
                </TabsTrigger>
              </TabsList>

              <TabsContent value="message">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Send Us a Message</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll get back to you as soon as possible
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {formSubmitted ? (
                      <div className="text-center py-10">
                        <div className="w-20 h-20 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
                          <Check className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-green-600 mb-4">Message Received!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          Thank you for reaching out. We'll respond to your inquiry within 24-48 hours.
                        </p>
                        <Button onClick={() => setFormSubmitted(false)} variant="outline">
                          Send Another Message
                        </Button>
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
                              placeholder="Enter your name"
                              required
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={email} 
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
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
                            placeholder="What's this about?"
                            className="input-enhanced"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message</Label>
                          <Textarea 
                            id="message" 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Your message here..."
                            required
                            rows={6}
                            className="input-enhanced min-h-[200px] resize-none"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-6">
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Get Technical Support</CardTitle>
                    <CardDescription>
                      Need help with your token or platform features?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert className="border-blue-500/30 bg-blue-500/5">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      <AlertDescription>
                        <p className="font-medium text-blue-600">Faster Support Options</p>
                        <p className="text-sm text-blue-500 mt-1">
                          For the quickest response, please include your wallet address and specific error messages.
                        </p>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-8">
                      <div className="bg-muted/30 rounded-lg p-6 hover:bg-muted/40 transition-colors">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Common Support Topics</h3>
                        <div className="space-y-3">
                          <Button variant="outline" className="justify-between w-full py-6">
                            <span>Token Creation Issues</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" className="justify-between w-full py-6">
                            <span>Wallet Connection Problems</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" className="justify-between w-full py-6">
                            <span>Transaction Failures</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" className="justify-between w-full py-6">
                            <span>Dashboard Functionality</span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="support-name">Your Name</Label>
                            <Input 
                              id="support-name" 
                              placeholder="Enter your name"
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="support-email">Email Address</Label>
                            <Input 
                              id="support-email" 
                              type="email" 
                              placeholder="you@example.com"
                              className="input-enhanced"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="wallet-address">Wallet Address (Optional)</Label>
                          <Input 
                            id="wallet-address" 
                            placeholder="Your Solana or Algorand wallet address"
                            className="input-enhanced font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">Providing your wallet address helps us troubleshoot faster</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="support-message">Describe Your Issue</Label>
                          <Textarea 
                            id="support-message" 
                            placeholder="Please provide as much detail as possible including any error messages..."
                            rows={6}
                            className="input-enhanced min-h-[200px] resize-none"
                          />
                        </div>

                        <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-6">
                          <Send className="w-4 h-4 mr-2" />
                          Submit Support Request
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="partnership">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Partnership Opportunities</CardTitle>
                    <CardDescription>
                      Interested in partnering with Snarbles?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-muted/30 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Partnership Types</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/40 rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Technology Integration</h4>
                          <p className="text-sm text-muted-foreground">
                            Integrate your blockchain, wallet, or other crypto technology with our platform
                          </p>
                        </div>
                        <div className="p-4 bg-muted/40 rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Educational Collaboration</h4>
                          <p className="text-sm text-muted-foreground">
                            Create co-branded content or workshops about tokenomics and blockchain
                          </p>
                        </div>
                        <div className="p-4 bg-muted/40 rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Ecosystem Partnership</h4>
                          <p className="text-sm text-muted-foreground">
                            Join our ecosystem as an official partner with cross-promotion
                          </p>
                        </div>
                        <div className="p-4 bg-muted/40 rounded-lg">
                          <h4 className="font-medium text-foreground mb-2">Enterprise Solutions</h4>
                          <p className="text-sm text-muted-foreground">
                            White-label or custom token solutions for your organization
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="partner-name">Your Name</Label>
                          <Input 
                            id="partner-name" 
                            placeholder="Enter your name"
                            className="input-enhanced"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partner-email">Email Address</Label>
                          <Input 
                            id="partner-email" 
                            type="email" 
                            placeholder="you@example.com"
                            className="input-enhanced"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company/Organization</Label>
                          <Input 
                            id="company" 
                            placeholder="Your company name"
                            className="input-enhanced"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website</Label>
                          <Input 
                            id="website" 
                            placeholder="https://your-company.com"
                            className="input-enhanced"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnership-type">Partnership Type</Label>
                        <select 
                          id="partnership-type"
                          className="w-full p-3 rounded-md border border-border bg-background text-foreground focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                        >
                          <option value="">Select partnership type...</option>
                          <option value="technology">Technology Integration</option>
                          <option value="educational">Educational Collaboration</option>
                          <option value="ecosystem">Ecosystem Partnership</option>
                          <option value="enterprise">Enterprise Solutions</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnership-message">Partnership Details</Label>
                        <Textarea 
                          id="partnership-message" 
                          placeholder="Please describe your partnership idea and how we might collaborate..."
                          rows={6}
                          className="input-enhanced min-h-[200px] resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white py-6">
                        <Send className="w-4 h-4 mr-2" />
                        Submit Partnership Inquiry
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}