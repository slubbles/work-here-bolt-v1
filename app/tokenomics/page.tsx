'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Calculator, TrendingUp, Users, Coins, DollarSign, Target, Download, FileText, Share2, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';

interface DistributionItem {
  value: number;
  label: string;
}

interface Distribution {
  community: DistributionItem;
  team: DistributionItem;
  marketing: DistributionItem;
  development: DistributionItem;
  reserve: DistributionItem;
}

type DistributionKey = keyof Distribution;

export default function TokenomicsPage() {
  const [totalSupply, setTotalSupply] = useState(1000000);
  const [distribution, setDistribution] = useState<Distribution>({
    community: { value: 40, label: 'Community' },
    team: { value: 20, label: 'Team' },
    marketing: { value: 15, label: 'Marketing' },
    development: { value: 15, label: 'Development' },
    reserve: { value: 10, label: 'Reserve' }
  });

  const pieData = [
    { name: distribution.community.label, value: distribution.community.value, color: '#EF4444' },
    { name: distribution.team.label, value: distribution.team.value, color: '#3B82F6' },
    { name: distribution.marketing.label, value: distribution.marketing.value, color: '#10B981' },
    { name: distribution.development.label, value: distribution.development.value, color: '#F59E0B' },
    { name: distribution.reserve.label, value: distribution.reserve.value, color: '#8B5CF6' }
  ];

  const updateDistribution = (category: DistributionKey, value: number) => {
    setDistribution(prev => ({
      ...prev,
      [category]: { ...prev[category], value }
    }));
  };

  const updateDistributionLabel = (category: DistributionKey, label: string) => {
    setDistribution(prev => ({
      ...prev,
      [category]: { ...prev[category], label }
    }));
  };

  const generateDetailedReport = () => {
    const timestamp = new Date().toISOString();
    const reportContent = `
COMPREHENSIVE TOKENOMICS REPORT
===============================

Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Platform: Snarbles Token Creation Platform
Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}

EXECUTIVE SUMMARY
=================
This report provides a comprehensive analysis of the proposed tokenomics structure for your project. The distribution has been designed to balance community incentives, team motivation, growth initiatives, and long-term sustainability.

TOKEN PARAMETERS
================
Total Supply: ${totalSupply.toLocaleString()} tokens
Distribution Model: Fixed supply with strategic allocation
Recommended Vesting: 12-24 months for team and advisor tokens

DETAILED DISTRIBUTION BREAKDOWN
===============================

1. ${distribution.community.label} Allocation: ${distribution.community.value}%
   - Tokens: ${(totalSupply * distribution.community.value / 100).toLocaleString()}
   - Purpose: Public distribution, airdrops, community rewards, governance participation
   - Recommendation: ${distribution.community.value >= 40 ? '✓ EXCELLENT' : distribution.community.value >= 30 ? '⚠ GOOD' : '❌ CONSIDER INCREASING'} - Community-first approach
   - Release Schedule: Gradual release over 6-12 months to prevent market flooding
   - Use Cases: Staking rewards, governance voting, community contests, referral programs

2. ${distribution.team.label} Allocation: ${distribution.team.value}%
   - Tokens: ${(totalSupply * distribution.team.value / 100).toLocaleString()}
   - Purpose: Core team incentives, advisor compensation, key personnel retention
   - Recommendation: ${distribution.team.value <= 25 ? '✓ APPROPRIATE' : '⚠ CONSIDER REDUCING'} - Balanced team incentives
   - Vesting Schedule: 12-month cliff, 24-month linear vesting recommended
   - Governance: Team tokens should have voting rights to align interests

3. ${distribution.marketing.label} Allocation: ${distribution.marketing.value}%
   - Tokens: ${(totalSupply * distribution.marketing.value / 100).toLocaleString()}
   - Purpose: Marketing campaigns, partnerships, influencer collaborations, PR initiatives
   - Recommendation: ${distribution.marketing.value >= 10 && distribution.marketing.value <= 20 ? '✓ BALANCED' : '⚠ REVIEW ALLOCATION'}
   - Strategy: Focus on organic growth and community building
   - Metrics: Track CAC (Customer Acquisition Cost) and community engagement

4. ${distribution.development.label} Allocation: ${distribution.development.value}%
   - Tokens: ${(totalSupply * distribution.development.value / 100).toLocaleString()}
   - Purpose: Technical development, security audits, infrastructure, ongoing maintenance
   - Recommendation: ${distribution.development.value >= 10 ? '✓ SUFFICIENT' : '⚠ INCREASE FOR SUSTAINABILITY'}
   - Timeline: Allocate across multiple development phases
   - Priorities: Security first, then feature development and scaling

5. ${distribution.reserve.label} Allocation: ${distribution.reserve.value}%
   - Tokens: ${(totalSupply * distribution.reserve.value / 100).toLocaleString()}
   - Purpose: Future expansion, emergency fund, strategic partnerships, unforeseen opportunities
   - Recommendation: ${distribution.reserve.value >= 5 && distribution.reserve.value <= 15 ? '✓ PRUDENT' : '⚠ REVIEW SIZE'}
   - Management: Multi-signature wallet recommended for reserve funds
   - Governance: Major reserve usage should require community approval

TOKENOMICS ANALYSIS
===================

Distribution Health Score: ${calculateHealthScore()}%

Strengths:
${getStrengths().map(strength => `• ${strength}`).join('\n')}

Areas for Improvement:
${getImprovements().map(improvement => `• ${improvement}`).join('\n')}

IMPLEMENTATION ROADMAP
======================

Phase 1 (Months 1-3): Token Launch & Initial Distribution
- Deploy smart contract with specified parameters
- Conduct initial community distribution (${Math.floor(distribution.community.value * 0.3)}% of community allocation)
- Begin team vesting schedule
- Launch basic governance mechanisms

Phase 2 (Months 4-6): Growth & Expansion
- Execute marketing campaigns using allocated tokens
- Onboard strategic partners
- Expand development team if needed
- Implement advanced governance features

Phase 3 (Months 7-12): Maturation & Optimization
- Complete community distribution
- Evaluate and adjust tokenomics based on performance
- Consider additional utility mechanisms
- Plan for long-term sustainability

RISK ASSESSMENT
===============

Low Risk Factors:
• Balanced distribution prevents centralization
• Community-first approach builds trust
• Adequate development funding ensures sustainability

Medium Risk Factors:
• Market volatility may affect token value
• Regulatory changes could impact distribution
• Competition may require strategy adjustments

High Risk Factors:
• Team departure could affect locked tokens
• Community adoption slower than expected
• Technical vulnerabilities in smart contract

RECOMMENDATIONS
===============

1. Legal Compliance: Ensure all distributions comply with local regulations
2. Smart Contract Audit: Conduct thorough security audit before deployment
3. Community Engagement: Build strong community before token launch
4. Transparency: Publish regular reports on token usage and project progress
5. Flexibility: Design mechanisms to adjust tokenomics if needed

COMPARATIVE ANALYSIS
====================

Your tokenomics compared to successful projects:
• Community allocation: ${distribution.community.value}% (Industry average: 35-45%)
• Team allocation: ${distribution.team.value}% (Industry average: 15-25%)
• Development fund: ${distribution.development.value}% (Industry average: 10-20%)

CONCLUSION
==========

${getConclusion()}

NEXT STEPS
==========

1. Review this analysis with your team and advisors
2. Consider implementing suggested improvements
3. Conduct legal review of token distribution
4. Plan detailed implementation timeline
5. Prepare community communication strategy
6. Begin smart contract development and testing

DISCLAIMER
==========

This report is for planning purposes only and does not constitute financial, legal, or investment advice. 
Token distribution should be reviewed by qualified legal and financial professionals. 
Regulatory requirements vary by jurisdiction and should be carefully considered.

The tokenomics model should be tested thoroughly before implementation, and mechanisms for 
adjustment should be built into the system to respond to changing market conditions.

---
Report generated by Snarbles Token Creation Platform
Timestamp: ${timestamp}
Visit: https://snarbles.xyz for more information

© 2025 Snarbles Platform. This report is confidential and proprietary.
    `;

    // Create and download the file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokenomics-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize = 12, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont(undefined, 'bold');
        } else {
          doc.setFont(undefined, 'normal');
        }
        
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * (fontSize * 0.5) + 5;
        
        // Add new page if needed
        if (yPosition > doc.internal.pageSize.height - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Title
      addText('TOKENOMICS ANALYSIS REPORT', 20, true);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Token Parameters
      addText('TOKEN PARAMETERS', 16, true);
      addText(`Total Supply: ${totalSupply.toLocaleString()} tokens`);
      addText(`Distribution Health Score: ${calculateHealthScore()}%`);
      yPosition += 10;

      // Distribution Breakdown
      addText('DISTRIBUTION BREAKDOWN', 16, true);
      Object.entries(distribution).forEach(([key, data]) => {
        const tokens = (totalSupply * data.value / 100).toLocaleString();
        addText(`${data.label}: ${data.value}% (${tokens} tokens)`);
      });
      yPosition += 10;

      // Recommendations
      addText('KEY RECOMMENDATIONS', 16, true);
      getStrengths().forEach(strength => {
        addText(`✓ ${strength}`);
      });
      
      if (getImprovements().length > 0) {
        yPosition += 5;
        addText('Areas for Improvement:', 14, true);
        getImprovements().forEach(improvement => {
          addText(`• ${improvement}`);
        });
      }

      // Footer
      yPosition = doc.internal.pageSize.height - 30;
      addText('Generated by Snarbles Token Creation Platform', 8);
      addText('Visit https://snarbles.xyz for more information', 8);

      // Save the PDF
      doc.save(`tokenomics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text report
      generateDetailedReport();
    }
  };

  const calculateHealthScore = (): number => {
    let score = 100;
    
    // Community allocation should be 40-60%
    if (distribution.community.value < 30) score -= 20;
    else if (distribution.community.value < 40) score -= 10;
    else if (distribution.community.value > 60) score -= 15;
    
    // Team allocation should be 15-25%
    if (distribution.team.value > 30) score -= 15;
    else if (distribution.team.value < 10) score -= 10;
    
    // Total should equal 100%
    const total = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);
    if (Math.abs(total - 100) > 1) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  };

  const getStrengths = (): string[] => {
    const strengths = [];
    
    if (distribution.community.value >= 40) {
      strengths.push('Strong community focus builds trust and adoption');
    }
    
    if (distribution.team.value <= 25) {
      strengths.push('Reasonable team allocation prevents centralization concerns');
    }
    
    if (distribution.reserve.value >= 5 && distribution.reserve.value <= 15) {
      strengths.push('Prudent reserve allocation for future opportunities');
    }
    
    if (distribution.development.value >= 10) {
      strengths.push('Adequate development funding ensures sustainability');
    }
    
    return strengths;
  };

  const getImprovements = (): string[] => {
    const improvements = [];
    
    if (distribution.community.value < 40) {
      improvements.push('Consider increasing community allocation to 40%+ for better decentralization');
    }
    
    if (distribution.team.value > 25) {
      improvements.push('Team allocation above 25% may raise centralization concerns');
    }
    
    if (distribution.development.value < 10) {
      improvements.push('Development allocation below 10% may limit long-term sustainability');
    }
    
    const total = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);
    if (Math.abs(total - 100) > 1) {
      improvements.push('Ensure total distribution equals exactly 100%');
    }
    
    return improvements;
  };

  const getConclusion = (): string => {
    const score = calculateHealthScore();
    
    if (score >= 90) {
      return 'Excellent tokenomics structure with strong community focus and balanced allocations. Ready for implementation with minor adjustments if needed.';
    } else if (score >= 75) {
      return 'Good tokenomics foundation with room for optimization. Consider the suggested improvements before finalizing.';
    } else if (score >= 60) {
      return 'Adequate structure but requires significant improvements. Focus on community allocation and overall balance.';
    } else {
      return 'Tokenomics structure needs major revision. Consider redistributing allocations to better align with best practices.';
    }
  };

  const applyTokenomics = () => {
    // Save to localStorage for use in token creation
    const tokenomicsConfig = {
      totalSupply,
      distribution,
      timestamp: new Date().toISOString(),
      healthScore: calculateHealthScore()
    };
    
    localStorage.setItem('snarbles_tokenomics', JSON.stringify(tokenomicsConfig));
    
    // Redirect to create page with applied tokenomics
    window.location.href = '/create?tokenomics=applied';
  };

  const shareTokenomics = async () => {
    const shareData = {
      title: 'My Token Distribution Plan',
      text: `Check out my tokenomics: ${distribution.community.value}% Community, ${distribution.team.value}% Team, ${distribution.marketing.value}% Marketing`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
    }
  };

  const totalPercentage = Object.values(distribution).reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <Calculator className="w-4 h-4" />
            <span className="uppercase tracking-wide">Tokenomics Simulator</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Design Your Token Economy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create a sustainable token distribution that aligns incentives and drives long-term success for your project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Controls */}
          <div className="space-y-8">
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Token Parameters</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-foreground font-medium">Total Supply</Label>
                  <Input
                    type="number"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(Number(e.target.value))}
                    className="input-enhanced mt-2"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Distribution</h3>
                    <div className={`text-sm font-medium ${Math.abs(totalPercentage - 100) < 1 ? 'text-green-500' : 'text-red-500'}`}>
                      Total: {totalPercentage.toFixed(1)}%
                    </div>
                  </div>
                  
                  {(Object.entries(distribution) as [DistributionKey, DistributionItem][]).map(([key, data]) => (
                    <div key={key} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Input
                          value={data.label}
                          onChange={(e) => updateDistributionLabel(key, e.target.value)}
                          className="input-enhanced w-32 text-sm"
                          placeholder="Custom label"
                        />
                        <span className="text-foreground font-medium">{data.value}%</span>
                      </div>
                      <Slider
                        value={[data.value]}
                        onValueChange={(newValue) => updateDistribution(key, newValue[0])}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Health Score */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Distribution Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">Health Score</span>
                  <span className={`text-2xl font-bold ${calculateHealthScore() >= 80 ? 'text-green-500' : calculateHealthScore() >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {calculateHealthScore()}%
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${calculateHealthScore() >= 80 ? 'bg-green-500' : calculateHealthScore() >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${calculateHealthScore()}%` }}
                  ></div>
                </div>

                <div className="space-y-2">
                  {getStrengths().map((strength, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{strength}</span>
                    </div>
                  ))}
                  
                  {getImprovements().map((improvement, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Export & Share</h3>
              <div className="space-y-4">
                <Button 
                  onClick={generatePDFReport}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF Report
                </Button>
                <Button 
                  onClick={generateDetailedReport}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Detailed Analysis
                </Button>
                <Button 
                  onClick={shareTokenomics}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Configuration
                </Button>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="space-y-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Distribution Visualization</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--background)', 
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--foreground)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Token Allocation</h3>
              <div className="space-y-4">
                {Object.entries(distribution).map(([key, data]) => {
                  const tokens = (totalSupply * data.value / 100);
                  return (
                    <div key={key} className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                      <div>
                        <span className="text-foreground font-medium">{data.label}</span>
                        <div className="text-sm text-muted-foreground">{data.value}% of total supply</div>
                      </div>
                      <div className="text-right">
                        <div className="text-foreground font-bold">{tokens.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">tokens</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Best Practices</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <p className="text-foreground font-medium">Community First</p>
                    <p className="text-muted-foreground text-sm">Allocate 40-60% to community to ensure decentralization</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <p className="text-foreground font-medium">Team Vesting</p>
                    <p className="text-muted-foreground text-sm">Lock team tokens for 12-24 months to build trust</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <p className="text-foreground font-medium">Growth Reserve</p>
                    <p className="text-muted-foreground text-sm">Keep 10-20% for future partnerships and development</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <p className="text-foreground font-medium">Transparency</p>
                    <p className="text-muted-foreground text-sm">Publish clear documentation about token usage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apply CTA */}
        <div className="text-center mt-16">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Apply This Tokenomics?</h3>
            <p className="text-muted-foreground mb-6">
              Save this configuration and use it when creating your token. Your distribution will be automatically applied.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={applyTokenomics}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4"
              >
                Apply to Token Creation
              </Button>
              <Link href="/create">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted px-8 py-4"
                >
                  Create Token Manually
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}