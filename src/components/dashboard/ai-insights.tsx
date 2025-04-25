'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { loadCredentials, loadCredentialsAsync } from '@/lib/storage'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface AIInsightsProps {
  analytics: TeamAnalytics
}

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold text-primary mt-8 mb-4 border-b pb-2 dark:text-blue-300 dark:border-blue-800/40">
      {children}
    </h2>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="my-2 text-foreground dark:text-zinc-200">
      {children}
    </p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <span className="font-semibold text-primary dark:text-blue-300">
      {children}
    </span>
  ),
  li: ({ children }: { children: React.ReactNode }) => {
    // Extract the key term if it's wrapped in bold
    let keyTerm = null;
    let restContent = null;
    
    if (children && typeof children === 'string' && children.includes(':')) {
      const parts = children.toString().split(':');
      if (parts.length >= 2) {
        keyTerm = parts[0].trim();
        restContent = parts.slice(1).join(':').trim();
      }
    }
    
    return (
      <div className="py-2 px-3 rounded-md bg-muted/40 hover:bg-muted/60 dark:bg-muted/20 dark:hover:bg-muted/30 mb-3 transition-colors">
        {keyTerm ? (
          <>
            <div className="font-bold text-primary dark:text-blue-300 mb-1">{keyTerm}</div>
            <div className="text-foreground dark:text-zinc-200">{restContent}</div>
          </>
        ) : (
          <div className="text-foreground dark:text-zinc-200">{children}</div>
        )}
      </div>
    );
  },
};

// Section icons mapping
const SectionIcons = {
  "SPRINT STRENGTHS": <CheckCircle className="h-5 w-5 text-green-500" />,
  "IMPROVEMENT OPPORTUNITIES": <AlertTriangle className="h-5 w-5 text-amber-500" />,
  "RECOMMENDED ACTIONS": <ArrowRight className="h-5 w-5 text-blue-500" />
};

function AIInsights({ analytics }: AIInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null)
  const [analyticsKey, setAnalyticsKey] = useState<string>('')

  // Process insights to add section icons and improve formatting
  const processedInsights = insights ? formatInsightsContent(insights) : null;

  // Function to prepare insights for display
  function formatInsightsContent(content: string): string {
    // Add spacing and improve section formatting
    return content
      .replace(/## (.*?)$/gm, '\n\n## $1\n\n')  // Add spacing around headers
      .replace(/\* \*\*(.*?)\*\*:/g, '* **$1**:') // Ensure proper formatting of bold terms
      .trim();
  }

  // Check if OpenAI API key is available
  useEffect(() => {
    async function checkOpenAIKey() {
      try {
        const openAICredentials = await loadCredentialsAsync<{ apiKey: string }>('openai')
        setHasOpenAIKey(Boolean(openAICredentials?.apiKey))
      } catch (err) {
        console.error('Error checking OpenAI key:', err)
        setHasOpenAIKey(false)
      }
    }
    
    checkOpenAIKey()
  }, [])

  // Generate a key for the analytics data to track changes
  useEffect(() => {
    if (analytics) {
      try {
        // Create a more detailed fingerprint of the data
        const userIds = analytics.userPerformance.map(u => u.user.emailAddress).sort().join(',');
        const issueTypes = Object.keys(analytics.issuesByType).sort().join(',');
        const issueStatuses = Object.keys(analytics.issuesByStatus).sort().join(',');
        const completionTrendPoints = analytics.completionTrend ? 
          analytics.completionTrend.map(p => `${p.date}-${p.count}`).join(',') : '';
          
        const key = `${analytics.totalIssues}-${analytics.totalStoryPoints}-${analytics.averageResolutionTime}-${userIds}-${issueTypes}-${issueStatuses}-${completionTrendPoints}`;
        
        // Only regenerate if the key changed
        if (key !== analyticsKey) {
          console.log('Analytics data changed, generating insights');
          setAnalyticsKey(key);
          // Don't auto-generate insights to avoid errors when page loads
          // Instead, let user click the button
          // generateInsights();
        }
      } catch (err) {
        // If there's any error creating the fingerprint, log it but don't auto-generate
        console.error('Error creating analytics fingerprint:', err);
      }
    }
  }, [analytics, analyticsKey]);

  const generateInsights = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get OpenAI API key from storage
      const openAICredentials = await loadCredentialsAsync<{ apiKey: string }>('openai')
      const apiKey = openAICredentials?.apiKey
      
      // Check if OpenAI API key is available
      if (!apiKey) {
        setError('OpenAI API key is required to generate insights')
        setIsLoading(false)
        return
      }
      
      // Prepare a summary of the analytics data for ChatGPT
      const analyticsData = {
        totalIssues: analytics.totalIssues,
        totalStoryPoints: analytics.totalStoryPoints,
        averageResolutionTime: analytics.averageResolutionTime,
        userPerformance: analytics.userPerformance.map(user => ({
          name: user.user.displayName,
          issuesCompleted: user.issuesCompleted,
          storyPointsCompleted: user.storyPointsCompleted,
          averageResolutionTime: user.averageResolutionTime,
          issueTypes: Object.entries(user.issuesByType).map(([type, count]) => ({ type, count }))
        })),
        issueDistribution: {
          byType: Object.entries(analytics.issuesByType).map(([type, count]) => ({ type, count })),
          byStatus: Object.entries(analytics.issuesByStatus).map(([status, count]) => ({ status, count }))
        },
        completionTrend: analytics.completionTrend
      }
      
      // Make direct request to API endpoint
      try {
        // Local API endpoint for insights
        const insightsUrl = window.location.origin + '/api/generate-insights'
        console.log(`Fetching insights from: ${insightsUrl}`)
        
        const response = await fetch(insightsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            data: analyticsData,
            apiKey // Include API key from storage if available
          })
        })
        
        if (!response.ok) {
          const errorData = await response.text()
          console.error('Error response from insights API:', errorData)
          throw new Error(`Failed to generate insights: ${errorData || response.statusText}`)
        }
        
        const result = await response.json()
        
        if (!result.insights) {
          throw new Error('No insights data received from the server')
        }
        
        setInsights(result.insights)
      } catch (fetchErr: unknown) {
        console.error('API request error:', fetchErr)
        throw new Error(fetchErr instanceof Error ? fetchErr.message : 'Network error when generating insights')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error generating insights:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Manually trigger insights generation
  const handleGenerateInsights = () => {
    generateInsights()
  }

  // Render summary metrics at the top if insights are available
  const renderSummaryMetrics = () => {
    if (!insights || !analytics) return null;
    
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900/30 text-center">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Issues</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">{analytics.totalIssues}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 text-center">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Story Points</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{analytics.totalStoryPoints}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30 text-center">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Resolution</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{analytics.averageResolutionTime.toFixed(1)} days</div>
        </div>
      </div>
    );
  };

  // Custom renderer for markdown sections
  const renderMarkdownContent = () => {
    if (!processedInsights) return null;
    
    const sections = processedInsights.split(/## (.*?)(?=\n)/).filter(Boolean);
    
    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          // If this is a section title
          if (index % 2 === 0) {
            const sectionTitle = section.trim().toUpperCase();
            const icon = Object.keys(SectionIcons).includes(sectionTitle) 
              ? SectionIcons[sectionTitle as keyof typeof SectionIcons]
              : null;
              
            return (
              <div key={`section-${index}`} className="mt-8">
                <div className="flex items-center gap-2">
                  {icon}
                  <h2 className="text-xl font-bold text-primary dark:text-blue-300">{section}</h2>
                </div>
                <div className="border-b border-gray-200 dark:border-gray-800 mt-2 mb-4"></div>
              </div>
            );
          } else {
            // This is the section content
            return (
              <div key={`content-${index}`} className="space-y-3">
                {section.split('* ').filter(Boolean).map((item, idx) => {
                  const [keyTerm, ...rest] = item.split(':');
                  const content = rest.join(':').trim();
                  
                  if (!keyTerm || !content) return null;
                  
                  return (
                    <div key={`item-${idx}`} className="p-3 rounded-md bg-muted/40 hover:bg-muted/60 dark:bg-muted/20 dark:hover:bg-muted/30 transition-colors">
                      <div className="font-bold text-primary dark:text-blue-300 mb-1">
                        {keyTerm.replace(/\*\*/g, '')}
                      </div>
                      <div className="text-foreground dark:text-zinc-200">
                        {content}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader className="text-center">
        <CardTitle>Scrum Master Insights</CardTitle>
        <CardDescription>
          Expert sprint analysis and actionable recommendations from your virtual Scrum Master
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Generating insights...</p>
          </div>
        ) : insights ? (
          <div className="bg-muted/30 dark:bg-muted/20 p-5 rounded-lg shadow-sm border dark:border-blue-900/30">
            {renderSummaryMetrics()}
            {renderMarkdownContent()}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {!error ? (
              hasOpenAIKey ? (
                <>
                  <p className="mb-4">Generate AI-powered insights based on your team's performance data.</p>
                  <Button onClick={handleGenerateInsights} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Insights'
                    )}
                  </Button>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4 text-sm text-amber-800">
                  <p className="font-medium mb-2">OpenAI API Configuration Required</p>
                  <p className="mb-3">
                    To access professional Scrum Master insights, please configure your OpenAI API credentials.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="bg-white hover:bg-amber-50">
                      Configure API Key
                    </Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-red-500 mb-4">{error}</div>
                <Button 
                  variant="outline" 
                  onClick={handleGenerateInsights}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { AIInsights } 