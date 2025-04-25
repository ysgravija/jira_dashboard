'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { loadCredentialsAsync } from '@/lib/storage'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

interface AIInsightsProps {
  analytics: TeamAnalytics
}

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
  const [isRefreshing, setIsRefreshing] = useState(false)

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

  // Generate insights when analytics data changes
  useEffect(() => {
    if (analytics && hasOpenAIKey === true) {
      try {
        // Create a more detailed fingerprint of the data
        const userIds = analytics.userPerformance.map(u => u.user.emailAddress).sort().join(',');
        const issueTypes = Object.keys(analytics.issuesByType).sort().join(',');
        const issueStatuses = Object.keys(analytics.issuesByStatus).sort().join(',');
        const completionTrendPoints = analytics.completionTrend ? 
          analytics.completionTrend.map(p => `${p.date}-${p.count}`).join(',') : '';
          
        // Include sprint-specific data in the key
        const key = `${analytics.totalIssues}-${analytics.totalStoryPoints}-${analytics.averageResolutionTime}-${userIds}-${issueTypes}-${issueStatuses}-${completionTrendPoints}`;
        
        // Only regenerate if the key changed
        if (key !== analyticsKey) {
          setAnalyticsKey(key);
          generateInsights();
        }
      } catch (err) {
        // If there's any error creating the fingerprint, log it but don't auto-generate
        console.error('Error creating analytics fingerprint:', err);
      }
    }
  }, [analytics, hasOpenAIKey, analyticsKey]);

  const generateInsights = async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
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
      
      // Calculate sprint dates
      const trendData = analytics.completionTrend || [];
      let sprintStartDate = new Date();
      let sprintEndDate = new Date();
      
      if (trendData.length > 0) {
        const mostRecentDate = new Date(trendData[trendData.length - 1].date);
        sprintEndDate = new Date(mostRecentDate);
        sprintStartDate = new Date(sprintEndDate);
        sprintStartDate.setDate(sprintEndDate.getDate() - 13); // 14 days (0-13 inclusive)
      } else {
        // Fallback to current date minus 14 days if no trend data
        sprintStartDate.setDate(sprintStartDate.getDate() - 13);
      }
      
      // Filter sprint-specific metrics (in a real app, you would get these directly from the API)
      // For now, we'll simulate this by assuming analytics data is for the sprint
      
      // Prepare a summary of the sprint-specific analytics data for ChatGPT
      const analyticsData = {
        sprintDates: {
          start: sprintStartDate.toISOString().split('T')[0],
          end: sprintEndDate.toISOString().split('T')[0],
        },
        totalIssues: analytics.totalIssues, // In a real app: sprintFilteredIssues.length,
        totalStoryPoints: analytics.totalStoryPoints, // In a real app: calculate from sprint issues
        averageResolutionTime: analytics.averageResolutionTime, // In a real app: calculate from sprint issues
        userPerformance: analytics.userPerformance.map(user => ({
          name: user.user.displayName,
          issuesCompleted: user.issuesCompleted, // In a real app: filter by sprint dates
          storyPointsCompleted: user.storyPointsCompleted, // In a real app: filter by sprint dates
          averageResolutionTime: user.averageResolutionTime, // In a real app: calculate from sprint issues
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
      setIsRefreshing(false)
    }
  }

  // Manual refresh function
  const refreshInsights = () => {
    setIsRefreshing(true)
    generateInsights()
  }

  // Render sprint progress metrics at the top if insights are available
  const renderSprintProgress = () => {
    if (!insights || !analytics) return null;
    
    // Calculate sprint dates
    const trendData = analytics.completionTrend || [];
    const today = new Date();
    
    // Get the last date from completion trend or use today's date
    let lastDataDate = today;
    if (trendData.length > 0) {
      lastDataDate = new Date(trendData[trendData.length - 1].date);
    }
    
    // Assume a 14-day sprint that started 7 days ago from the last data point
    const sprintStartDate = new Date(lastDataDate);
    sprintStartDate.setDate(sprintStartDate.getDate() - 7); // Sprint started 7 days ago
    
    const sprintEndDate = new Date(sprintStartDate);
    sprintEndDate.setDate(sprintStartDate.getDate() + 14); // 14-day sprint
    
    // Calculate days remaining
    const daysRemaining = Math.max(0, Math.ceil((sprintEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalSprintDays = 14;
    const daysElapsed = totalSprintDays - daysRemaining;
    const sprintProgressPercent = Math.min(100, Math.round((daysElapsed / totalSprintDays) * 100));
    
    // For this example, we'll assume the total points planned is 20% higher than completed
    // In a real app, you should get this from your analytics data for the current sprint
    const totalPointsPlanned = Math.round(analytics.totalStoryPoints * 1.2);
    const completionPercentage = Math.round((analytics.totalStoryPoints / totalPointsPlanned) * 100);
    
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-4">Sprint Metrics</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex justify-between">
              <div className="text-sm text-blue-600 dark:text-blue-400">Story Points</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {analytics.totalStoryPoints} / {totalPointsPlanned}
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-muted-foreground">Completion</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {completionPercentage}%
                </div>
              </div>
              <Progress value={completionPercentage} className="h-1.5 bg-blue-100 dark:bg-blue-900/30" />
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs">Completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-200 dark:bg-blue-700"></div>
                <span className="text-xs">Planned</span>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex justify-between">
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Days Left</div>
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{daysRemaining}</div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">Sprint timeline</div>
              <div className="text-xs text-muted-foreground">{sprintProgressPercent}% elapsed</div>
            </div>
            <div className="mt-1">
              <Progress value={sprintProgressPercent} className="h-1 bg-emerald-100 dark:bg-emerald-900/30" />
            </div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
            <div className="flex justify-between">
              <div className="text-sm text-amber-600 dark:text-amber-400">Avg. Resolution</div>
              <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{analytics.averageResolutionTime.toFixed(1)}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">days per issue</div>
          </div>
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
            <p className="text-muted-foreground">
              {isRefreshing ? 'Refreshing insights...' : 'Generating insights...'}
            </p>
          </div>
        ) : insights ? (
          <div className="bg-muted/30 dark:bg-muted/20 p-5 rounded-lg shadow-sm border dark:border-blue-900/30 relative">
            {/* Refresh button */}
            <div className="absolute top-3 right-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refreshInsights} 
                disabled={isLoading}
                title="Refresh insights"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <RefreshCw size={16} />
              </Button>
            </div>
            
            {/* Sprint dates header - centered */}
            <div className="text-center mb-6">
              <div className="text-xs text-muted-foreground inline-block px-4 py-1 bg-muted/50 dark:bg-muted/30 rounded-full">
                {analytics.completionTrend && analytics.completionTrend.length > 0 ? (
                  <>
                    {(() => {
                      // Calculate 2-week sprint dates based on the most recent data point
                      const mostRecentDate = new Date(analytics.completionTrend[analytics.completionTrend.length - 1].date);
                      const sprintEndDate = new Date(mostRecentDate);
                      const sprintStartDate = new Date(sprintEndDate);
                      sprintStartDate.setDate(sprintEndDate.getDate() - 13); // 14 days (0-13 inclusive)
                      
                      return `Sprint: ${sprintStartDate.toLocaleDateString()} - ${sprintEndDate.toLocaleDateString()}`;
                    })()}
                  </>
                ) : (
                  'Current Sprint'
                )}
              </div>
            </div>
            
            {renderSprintProgress()}
            {renderMarkdownContent()}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {!error ? (
              hasOpenAIKey === false ? (
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
              ) : (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p>Preparing your insights...</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-red-500 mb-4">{error}</div>
                <Button 
                  variant="outline" 
                  onClick={refreshInsights}
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