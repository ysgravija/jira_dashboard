'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'

interface TeamStatisticsProps {
  analytics: TeamAnalytics
}

function TeamStatistics({ analytics }: TeamStatisticsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          <CardDescription>All issues in the project</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-2xl font-bold">{analytics.totalIssues}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-sm font-medium">Total Story Points</CardTitle>
          <CardDescription>All story points in the project</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-2xl font-bold">{analytics.totalStoryPoints}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
          <CardDescription>Average time to resolve issues</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-2xl font-bold">{analytics.averageResolutionTime} days</div>
        </CardContent>
      </Card>
    </div>
  )
}

export { TeamStatistics } 