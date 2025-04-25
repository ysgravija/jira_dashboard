'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'
import { Loader2 } from 'lucide-react'
import { loadCredentials, loadCredentialsAsync } from '@/lib/storage'
import Link from 'next/link'

interface AIInsightsProps {
  analytics: TeamAnalytics
}

function AIInsights({ analytics }: AIInsightsProps) {
  const [insights, setInsights] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null)
  const [analyticsKey, setAnalyticsKey] = useState<string>('')

  // Check if OpenAI API key is available
  useEffect(() => {
    async function checkOpenAIKey() {
      const openAICredentials = await loadCredentialsAsync<{ apiKey: string }>('openai')
      setHasOpenAIKey(Boolean(openAICredentials?.apiKey))
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
          console.log('Analytics data changed, regenerating insights');
          setAnalyticsKey(key);
          generateInsights();
        }
      } catch (err) {
        // If there's any error creating the fingerprint, just regenerate
        console.error('Error creating analytics fingerprint:', err);
        generateInsights();
      }
    }
  }, [analytics]);

  const generateInsights = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Get OpenAI API key from storage
      const openAICredentials = await loadCredentialsAsync<{ apiKey: string }>('openai')
      const apiKey = openAICredentials?.apiKey
      
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
      
      // Make request to API endpoint that will talk to ChatGPT
      const response = await fetch('/api/generate-insights', {
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
        throw new Error('Failed to generate insights')
      }
      
      const result = await response.json()
      setInsights(result.insights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="text-center">
        <CardTitle>AI-Powered Insights</CardTitle>
        <CardDescription>
          Data-driven insights and recommendations based on your team's performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights ? (
          <div className="bg-muted/50 p-4 rounded-lg whitespace-pre-line">
            {insights}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {!error ? 
              "Waiting for analytics data to generate insights..." :
              <div className="text-red-500">{error}</div>
            }
          </div>
        )}
        {hasOpenAIKey === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 text-sm text-amber-800">
            <p>
              No OpenAI API key found. 
              <Link href="/settings" className="font-medium ml-1 hover:underline">
                Configure your API key
              </Link> to get personalized insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { AIInsights } 