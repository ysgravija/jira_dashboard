'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SortField = 'name' | 'issuesCompleted' | 'storyPointsCompleted' | 'averageResolutionTime'
type SortDirection = 'asc' | 'desc'

interface TeamPerformanceTableProps {
  analytics: TeamAnalytics
}

function TeamPerformanceTable({ analytics }: TeamPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('storyPointsCompleted')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field and default to descending for most metrics (ascending for name)
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  const sortedUsers = [...analytics.userPerformance].sort((a, b) => {
    let comparison = 0
    
    switch (sortField) {
      case 'name':
        comparison = a.user.displayName.localeCompare(b.user.displayName)
        break
      case 'issuesCompleted':
        comparison = a.issuesCompleted - b.issuesCompleted
        break
      case 'storyPointsCompleted':
        comparison = a.storyPointsCompleted - b.storyPointsCompleted
        break
      case 'averageResolutionTime':
        comparison = a.averageResolutionTime - b.averageResolutionTime
        break
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Helper to render sort indicator
  const getSortIcon = (field: SortField) => {
    if (field !== sortField) return <ArrowUpDownIcon className="ml-2 h-4 w-4" />
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="ml-2 h-4 w-4" />
      : <ArrowDownIcon className="ml-2 h-4 w-4" />
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Team Member Performance</CardTitle>
        <CardDescription>
          Detailed performance metrics for each team member
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('name')}
                  className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                >
                  Team Member
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('issuesCompleted')}
                  className="p-0 h-auto font-medium flex items-center justify-end ml-auto hover:bg-transparent"
                >
                  Issues Completed
                  {getSortIcon('issuesCompleted')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('storyPointsCompleted')}
                  className="p-0 h-auto font-medium flex items-center justify-end ml-auto hover:bg-transparent"
                >
                  Story Points
                  {getSortIcon('storyPointsCompleted')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('averageResolutionTime')}
                  className="p-0 h-auto font-medium flex items-center justify-end ml-auto hover:bg-transparent"
                >
                  Avg. Resolution Time (days)
                  {getSortIcon('averageResolutionTime')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((userData, index) => (
              <TableRow key={`${userData.user.emailAddress || userData.user.displayName}-${index}`}>
                <TableCell className="font-medium">
                  {userData.user.displayName}
                </TableCell>
                <TableCell className="text-right">{userData.issuesCompleted}</TableCell>
                <TableCell className="text-right">{userData.storyPointsCompleted}</TableCell>
                <TableCell className="text-right">{userData.averageResolutionTime.toFixed(1)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export { TeamPerformanceTable }