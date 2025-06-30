'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import { 
  Calculator, 
  Download, 
  PieChart as PieChartIcon,
  Clock, 
  Lock, 
  ChevronRight, 
  Check, 
  X, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Settings,
  Copy,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { jsPDF } from 'jspdf';

// Define distribution categories with default values
const defaultDistribution = {
  team: { label: 'Team', value: 15, color: '#FF6B6B' },
  investors: { label: 'Investors', value: 20, color: '#4ECDC4' },
  community: { label: 'Community', value: 30, color: '#FFD166' },
  liquidity: { label: 'Liquidity', value: 15, color: '#6A0572' },
  marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
  reserve: { label: 'Reserve', value: 10, color: '#3A86FF' }
};

// Define vesting schedules
const defaultVesting = {
  enabled: true,
  team: { period: 24, initialRelease: 10 },
  investors: { period: 12, initialRelease: 20 },
  advisors: { period: 18, initialRelease: 15 }
};

// Define template data
const templates = {
  defi: {
    name: 'DeFi Protocol',
    totalSupply: 100000000,
    distribution: {
      team: { label: 'Team', value: 15, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 15, color: '#4ECDC4' },
      community: { label: 'Community', value: 40, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 20, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 10, color: '#1A535C' },
      reserve: { label: 'Treasury', value: 0, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 24, initialRelease: 10 },
      investors: { period: 12, initialRelease: 20 },
      advisors: { period: 18, initialRelease: 15 }
    },
    supplyType: 'fixed'
  },
  dao: {
    name: 'DAO Governance',
    totalSupply: 50000000,
    distribution: {
      team: { label: 'Team', value: 10, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 15, color: '#4ECDC4' },
      community: { label: 'Community', value: 60, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 5, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 5, color: '#1A535C' },
      reserve: { label: 'Treasury', value: 5, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 36, initialRelease: 0 },
      investors: { period: 24, initialRelease: 10 },
      advisors: { period: 12, initialRelease: 20 }
    },
    supplyType: 'inflationary'
  },
  gamefi: {
    name: 'GameFi Project',
    totalSupply: 200000000,
    distribution: {
      team: { label: 'Team', value: 18, color: '#FF6B6B' },
      investors: { label: 'Investors', value: 22, color: '#4ECDC4' },
      community: { label: 'Players & Rewards', value: 35, color: '#FFD166' },
      liquidity: { label: 'Liquidity', value: 0, color: '#6A0572' },
      marketing: { label: 'Marketing', value: 25, color: '#1A535C' },
      reserve: { label: 'Reserve', value: 0, color: '#3A86FF' }
    },
    vestingSchedule: {
      enabled: true,
      team: { period: 30, initialRelease: 5 },
      investors: { period: 18, initialRelease: 15 },
      advisors: { period: 12, initialRelease: 20 }
    },
    supplyType: 'deflationary'
  }
};

export default function TokenomicsPage() {
  // State for token supply and distribution
  const [totalSupply, setTotalSupply] = useState(100000000);
  const [distribution, setDistribution] = useState(defaultDistribution);
  const [vestingSchedule, setVestingSchedule] = useState(defaultVesting);
  const [activeTab, setActiveTab] = useState('distribution');
  const [supplyType, setSupplyType] = useState('fixed');
  const [vestingEnabled, setVestingEnabled] = useState(true);
  const [healthScore, setHealthScore] = useState(78);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
  
  // Check if we're applying tokenomics from saved config
  useEffect(() => {
    const applyParam = searchParams.get('apply');
    if (applyParam === 'true') {
      // Try to load saved tokenomics from localStorage
      try {
        const saved = localStorage.getItem('snarbles_tokenomics');
        if (saved) {
          const data = JSON.parse(saved);
          
          if (data.totalSupply) setTotalSupply(data.totalSupply);
          if (data.distribution) setDistribution(data.distribution);
          if (data.vestingSchedule) setVestingSchedule(data.vestingSchedule);
          if (data.supplyType) setSupplyType(data.supplyType);
          if (data.healthScore) setHealthScore(data.healthScore);
          
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      } catch (err) {
        console.error('Failed to load tokenomics data:', err);
      }
    }
  }, [searchParams]);
  
  // Calculate health score whenever distribution changes
  useEffect(() => {
    const teamPercent = distribution.team.value;
    const investorsPercent = distribution.investors.value;
    const communityPercent = distribution.community.value;
    
    // A basic algorithm to calculate health score
    // - Community allocation should be high (higher is better)
    // - Team allocation should be reasonable (too high or too low is bad)
    // - Investor allocation should not be too high
    
    const communityScore = Math.min(communityPercent * 2, 100); // Up to 50% of total
    const teamScore = 100 - Math.abs(teamPercent - 15) * 3; // Ideal around 15%
    const investorScore = 100 - Math.max(0, investorsPercent - 25) * 2; // Penalize if over 25%
    
    // Vesting increases score
    const vestingBonus = vestingEnabled ? 10 : 0;
    
    // Total score
    const calculatedScore = Math.round((communityScore * 0.4 + teamScore * 0.3 + investorScore * 0.3) + vestingBonus);
    // Clamp between 0-100
    const finalScore = Math.max(0, Math.min(100, calculatedScore));
    
    setHealthScore(finalScore);
  }, [distribution, vestingEnabled]);
  
  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // Debounced set total supply
  const debouncedSetTotalSupply = useCallback(
    debounce((value) => {
      setTotalSupply(value);
    }, 300),
    []
  );
  
  // Handle total supply change with validation
  const handleTotalSupplyChange = (e) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    
    if (value === '' || isNaN(parsedValue)) {
      e.target.value = '';
      debouncedSetTotalSupply(0);
      return;
    }
    
    if (parsedValue < 0) {
      e.target.value = '0';
      debouncedSetTotalSupply(0);
      return;
    }
    
    debouncedSetTotalSupply(parsedValue);
  };
  
  // Update distribution and ensure total is 100%
  const handleDistributionChange = (category, newValue) => {
    // Calculate how much we need to adjust other categories
    const currentTotal = Object.values(distribution)
      .reduce((sum, item) => sum + item.value, 0);
    
    const currentCategoryValue = distribution[category].value;
    const difference = newValue - currentCategoryValue;
    const newTotal = currentTotal + difference;
    
    // If new total would exceed 100%, adjust other categories proportionally
    if (newTotal > 100) {
      // How much we need to reduce other categories
      const excess = newTotal - 100;
      const otherCategories = Object.keys(distribution).filter(key => key !== category);
      
      // Calculate total value of other categories
      const otherTotal = otherCategories.reduce(
        (sum, key) => sum + distribution[key].value, 0
      );
      
      // Create new distribution
      const newDistribution = { ...distribution };
      newDistribution[category] = { ...distribution[category], value: newValue };
      
      // Adjust other categories proportionally
      otherCategories.forEach(key => {
        const proportion = distribution[key].value / otherTotal;
        const reduction = excess * proportion;
        newDistribution[key] = {
          ...distribution[key],
          value: Math.max(0, distribution[key].value - reduction)
        };
      });
      
      setDistribution(newDistribution);
    } else {
      // Simple case - just update the category and we're still <= 100%
      setDistribution({
        ...distribution,
        [category]: { ...distribution[category], value: newValue }
      });
    }
  };
  
  // Generate distribution data for charts
  const getDistributionData = () => {
    return Object.keys(distribution).map(key => ({
      name: distribution[key].label,
      value: distribution[key].value,
      color: distribution[key].color,
      amount: Math.round(totalSupply * (distribution[key].value / 100))
    }));
  };
  
  // Save tokenomics for use in token creation
  const saveTokenomics = () => {
    const tokenomicsData = {
      name: 'Custom',
      totalSupply,
      distribution,
      vestingSchedule,
      supplyType,
      healthScore,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('snarbles_tokenomics', JSON.stringify(tokenomicsData));
    
    toast({
      title: "Tokenomics Saved",
      description: "Your tokenomics configuration has been saved"
    });
    
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };
  
  // Apply tokenomics to token creation
  const applyToToken = () => {
    saveTokenomics();
    
    toast({
      title: "Applying Tokenomics",
      description: "Redirecting to token creation with your tokenomics"
    });
    
    router.push('/create?tokenomics=applied');
  };
  
  // Custom tooltip for distribution chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm border border-border">
          <p className="font-semibold">{payload[0].name}</p>
          <p>{payload[0].value}% of supply</p>
          <p>{formatNumber(payload[0].payload.amount)} tokens</p>
        </div>
      );
    }
    return null;
  };
  
  // Export tokenomics as PDF
  const exportTokenomics = async () => {
    toast({
      title: "Export Started",
      description: "Preparing your tokenomics document..."
    });
    
    try {
      const doc = new jsPDF();
      const distributionData = getDistributionData();
      
      // Title
      doc.setFontSize(22);
      doc.text("Tokenomics Report", 105, 20, { align: "center" });
      
      // Project info
      doc.setFontSize(16);
      doc.text("Token Supply & Distribution", 20, 40);
      
      // Token details
      doc.setFontSize(12);
      doc.text(`Total Supply: ${formatNumber(totalSupply)} tokens`, 20, 55);
      doc.text(`Supply Type: ${supplyType.charAt(0).toUpperCase() + supplyType.slice(1)}`, 20, 65);
      doc.text(`Health Score: ${healthScore}/100`, 20, 75);
      doc.text(`Vesting Enabled: ${vestingEnabled ? 'Yes' : 'No'}`, 20, 85);
      
      // Distribution table
      doc.setFontSize(16);
      doc.text("Token Distribution", 20, 105);
      
      doc.setFontSize(12);
      doc.text("Category", 20, 115);
      doc.text("Percentage", 90, 115);
      doc.text("Token Amount", 150, 115);
      
      doc.setLineWidth(0.1);
      doc.line(20, 118, 190, 118);
      
      let yPosition = 128;
      distributionData.forEach((item) => {
        doc.text(item.name, 20, yPosition);
        doc.text(`${item.value}%`, 90, yPosition);
        doc.text(formatNumber(item.amount), 150, yPosition);
        yPosition += 10;
      });
      
      // Vesting details if enabled
      if (vestingEnabled) {
        doc.setFontSize(16);
        doc.text("Vesting Schedule", 20, yPosition + 20);
        
        doc.setFontSize(12);
        yPosition += 30;
        doc.text("Team vesting period: " + vestingSchedule.team.period + " months", 20, yPosition);
        yPosition += 10;
        doc.text("Investors vesting period: " + vestingSchedule.investors.period + " months", 20, yPosition);
      }
      
      // Health score analysis
      doc.setFontSize(16);
      yPosition += 30;
      doc.text("Health Score Analysis", 20, yPosition);
      
      doc.setFontSize(12);
      yPosition += 10;
      if (healthScore >= 80) {
        doc.text("Excellent: Your tokenomics design is well balanced and follows best practices.", 20, yPosition);
      } else if (healthScore >= 60) {
        doc.text("Good: Your tokenomics is solid with some room for improvement.", 20, yPosition);
      } else if (healthScore >= 40) {
        doc.text("Average: Consider adjusting your distribution for better balance.", 20, yPosition);
      } else {
        doc.text("Needs Improvement: Your current design may lead to centralization concerns.", 20, yPosition);
      }
      
      // Footer with date
      const date = new Date().toLocaleDateString();
      doc.setFontSize(10);
      doc.text(`Generated on ${date} · Snarbles Tokenomics Simulator`, 105, 280, { align: "center" });
      
      // Save the PDF
      doc.save(`tokenomics_${supplyType}_${date.replace(/\//g, '-')}.pdf`);
      
      toast({
        title: "Export Complete",
        description: "Your tokenomics document has been downloaded"
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your PDF",
        variant: "destructive"
      });
    }
  };
  
  // Get health score indicator
  const getHealthIndicator = () => {
    if (healthScore >= 80) {
      return {
        icon: <Check className="w-4 h-4" />,
        label: 'Excellent',
        color: 'text-green-500 bg-green-500/10 border-green-500/20'
      };
    } else if (healthScore >= 60) {
      return {
        icon: <Check className="w-4 h-4" />,
        label: 'Good',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      };
    } else if (healthScore >= 40) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        label: 'Needs Improvement',
        color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      };
    } else {
      return {
        icon: <X className="w-4 h-4" />,
        label: 'Poor',
        color: 'text-red-500 bg-red-500/10 border-red-500/20'
      };
    }
  };
  
  // Apply template
  const applyTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (!template) return;
    
    setTotalSupply(template.totalSupply);
    setDistribution(template.distribution);
    setVestingSchedule(template.vestingSchedule);
    setVestingEnabled(template.vestingSchedule.enabled);
    setSupplyType(template.supplyType);
    
    toast({
      title: `${template.name} Template Applied`,
      description: "Distribution and vesting schedule have been updated"
    });
  };
  
  const healthIndicator = getHealthIndicator();
  
  return (
    <div className="min-h-screen app-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm">
            <Calculator className="w-4 h-4" />
            <span className="uppercase tracking-wider">Tokenomics Simulator</span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground">Design Your Optimal Token Distribution</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create a balanced tokenomics model with our visual designer, then apply it directly to your token creation
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column - Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Supply Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <span>Supply Configuration</span>
                </CardTitle>
                <CardDescription>
                  Define your token's total supply and economics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalSupply">Total Supply</Label>
                    <Input
                      id="totalSupply"
                      type="number"
                      defaultValue={totalSupply}
                      onChange={handleTotalSupplyChange}
                      min="0"
                      className="input-enhanced"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 100M-1B for utility tokens, 10-100M for governance
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Supply Type</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant={supplyType === 'fixed' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('fixed')}
                        className="flex-1"
                      >
                        Fixed Supply
                      </Button>
                      <Button
                        variant={supplyType === 'inflationary' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('inflationary')}
                        className="flex-1"
                      >
                        Inflationary
                      </Button>
                      <Button
                        variant={supplyType === 'deflationary' ? 'default' : 'outline'}
                        onClick={() => setSupplyType('deflationary')}
                        className="flex-1"
                      >
                        Deflationary
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-foreground">Vesting Schedule</span>
                    </div>
                    <Switch 
                      checked={vestingEnabled}
                      onCheckedChange={setVestingEnabled}
                    />
                  </div>
                  
                  {vestingEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-500/20">
                      <div className="space-y-2">
                        <Label>Team Vesting Period (months)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[vestingSchedule.team.period]}
                            min={6}
                            max={48}
                            step={3}
                            onValueChange={(values) => setVestingSchedule({
                              ...vestingSchedule,
                              team: { ...vestingSchedule.team, period: values[0] }
                            })}
                            className="flex-1"
                          />
                          <span className="w-10 text-center font-mono">{vestingSchedule.team.period}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Investor Vesting Period (months)</Label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[vestingSchedule.investors.period]}
                            min={3}
                            max={24}
                            step={3}
                            onValueChange={(values) => setVestingSchedule({
                              ...vestingSchedule,
                              investors: { ...vestingSchedule.investors, period: values[0] }
                            })}
                            className="flex-1"
                          />
                          <span className="w-10 text-center font-mono">{vestingSchedule.investors.period}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-blue-600">
                          Vesting schedules increase investor confidence by demonstrating long-term commitment
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Distribution Settings */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-red-500" />
                  <span>Token Distribution</span>
                </CardTitle>
                <CardDescription>
                  Allocate your token supply across different stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sliders" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sliders">Sliders</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sliders" className="space-y-6">
                    {Object.keys(distribution).map((key) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: distribution[key].color }}></div>
                            {distribution[key].label}
                          </Label>
                          <span className="text-sm font-mono">
                            {distribution[key].value}% ({formatNumber(Math.round(totalSupply * distribution[key].value / 100))})
                          </span>
                        </div>
                        <Slider
                          value={[distribution[key].value]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(values) => handleDistributionChange(key, values[0])}
                          className="flex-1"
                        />
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="manual" className="space-y-4">
                    {Object.keys(distribution).map((key) => (
                      <div key={key} className="grid grid-cols-4 gap-4 items-center">
                        <div className="col-span-2 flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: distribution[key].color }}></div>
                          <Label>{distribution[key].label}</Label>
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={distribution[key].value}
                            onChange={(e) => handleDistributionChange(key, parseFloat(e.target.value) || 0)}
                            className="input-enhanced"
                          />
                          <div className="w-10 text-center flex items-center">
                            <span className="text-sm font-mono">%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className={`flex items-center space-x-3 p-4 rounded-lg ${healthIndicator.color}`}>
                    <Shield className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">Tokenomics Health Score: {healthScore}%</p>
                        <div className="flex items-center">
                          {healthIndicator.icon}
                          <span className="text-sm ml-1">{healthIndicator.label}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full mt-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${healthScore}%`,
                            background: healthScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                       healthScore >= 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                       healthScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                          'linear-gradient(90deg, #ef4444, #f87171)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
              <Button 
                onClick={saveTokenomics}
                variant="outline" 
                className="border-red-500 text-red-500 hover:bg-red-500/10 flex-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
              <Button 
                onClick={applyToToken} 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Apply to Token
              </Button>
            </div>
          </div>
          
          {/* Right Column - Visualization */}
          <div className="lg:col-span-7 space-y-6">
            {/* Distribution Chart */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="w-5 h-5 text-red-500" />
                  <span>Distribution Visualization</span>
                </CardTitle>
                <CardDescription>
                  Visual breakdown of your token allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getDistributionData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {getDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Bar Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getDistributionData()}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
                      >
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {getDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Distribution Table */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground mb-4">Token Allocation Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-muted-foreground font-medium">Category</th>
                          <th className="text-center py-3 px-4 text-muted-foreground font-medium">Percentage</th>
                          <th className="text-right py-3 px-4 text-muted-foreground font-medium">Token Amount</th>
                          {vestingEnabled && <th className="text-right py-3 px-4 text-muted-foreground font-medium">Vesting</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(distribution).map(key => {
                          const tokenAmount = Math.round(totalSupply * (distribution[key].value / 100));
                          const hasVesting = vestingEnabled && 
                            (key === 'team' || key === 'investors' || key === 'advisors');
                          
                          return (
                            <tr key={key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: distribution[key].color }}
                                  ></div>
                                  <span className="font-medium text-foreground">{distribution[key].label}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className="font-mono">{distribution[key].value}%</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="font-mono">{formatNumber(Math.round(tokenAmount))}</span>
                              </td>
                              {vestingEnabled && (
                                <td className="py-4 px-4 text-right">
                                  {hasVesting && vestingSchedule[key] ? (
                                    <span className="text-sm">
                                      {vestingSchedule[key].period} months
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">None</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recommendations */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Expert Recommendations</CardTitle>
                <CardDescription>Based on your token distribution and market patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-700">Community-centric allocation</p>
                      <p className="text-sm text-green-600">
                        Your {distribution.community.value}% community allocation supports organic growth and helps ensure broad distribution from launch.
                      </p>
                    </div>
                  </div>
                  
                  {distribution.team.value > 20 && (
                    <div className="flex items-start space-x-3 p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-700">Team allocation high</p>
                        <p className="text-sm text-yellow-600">
                          Your team allocation of {distribution.team.value}% is above market average of 15-18%. Consider reducing or extending vesting.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {distribution.liquidity.value < 15 && (
                    <div className="flex items-start space-x-3 p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-yellow-700">Consider increasing liquidity</p>
                        <p className="text-sm text-yellow-600">
                          Liquidity allocation of {distribution.liquidity.value}% may lead to higher price volatility. 15-20% is recommended.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {vestingEnabled && (
                    <div className="flex items-start space-x-3 p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-700">Vesting schedule</p>
                        <p className="text-sm text-green-600">
                          Your vesting schedules demonstrate long-term commitment and reduces selling pressure after launch.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border border-muted mt-4">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Tokenomics Health Score: {healthScore}/100</p>
                      <div className="w-full h-2 bg-muted rounded-full mt-2 mb-3">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${healthScore}%`,
                            background: healthScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                       healthScore >= 60 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                                       healthScore >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                          'linear-gradient(90deg, #ef4444, #f87171)'
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {healthScore >= 80 ? 'Excellent tokenomics design with balanced allocations and strong governance mechanisms.' :
                         healthScore >= 60 ? 'Good tokenomics with some room for improvement. Consider adjustments to optimize distribution.' :
                         healthScore >= 40 ? 'Basic tokenomics with several areas that need attention for long-term success.' :
                                           'Significant improvements needed. Current design may lead to centralization or poor incentives.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Export and Apply */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={exportTokenomics}
                variant="outline" 
                className="border-border text-muted-foreground hover:bg-muted flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button 
                onClick={applyToToken}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex-1"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Apply to Token Creation
              </Button>
            </div>
          </div>
        </div>
        
        {/* Template Gallery */}
        <div className="mt-16 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Tokenomics Templates Gallery</h2>
            <p className="text-muted-foreground">Start with a proven template based on your project's needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle>DeFi Protocol</CardTitle>
                <CardDescription>Optimized for decentralized finance applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Community</span>
                  <span className="font-semibold">40%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Treasury</span>
                  <span className="font-semibold">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Liquidity</span>
                  <span className="font-semibold">20%</span>
                </div>
                
                <Button className="w-full" onClick={() => applyTemplate('defi')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle>DAO Governance</CardTitle>
                <CardDescription>Balanced model for decentralized governance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Community</span>
                  <span className="font-semibold">60%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-semibold">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Investors</span>
                  <span className="font-semibold">15%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Treasury</span>
                  <span className="font-semibold">15%</span>
                </div>
                
                <Button className="w-full" onClick={() => applyTemplate('dao')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardHeader>
                <CardTitle>GameFi Project</CardTitle>
                <CardDescription>Optimized for gaming and metaverse projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Players & Rewards</span>
                  <span className="font-semibold">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team</span>
                  <span className="font-semibold">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Investors</span>
                  <span className="font-semibold">22%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Marketing</span>
                  <span className="font-semibold">25%</span>
                </div>
                
                <Button className="w-full" onClick={() => applyTemplate('gamefi')}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Expert Recommendations */}
        <div className="mt-20 text-center">
          <Link href="/create">
            <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg px-8 py-3 font-semibold">
              <Rocket className="w-5 h-5 mr-2" />
              Create Your Token Now
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">Apply this tokenomics design directly to your token creation</p>
        </div>
      </div>
    </div>
  );
}