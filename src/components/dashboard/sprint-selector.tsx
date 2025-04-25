'use client'

import { useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JiraSprint } from '@/lib/types/jira'

interface SprintSelectorProps {
  sprints: JiraSprint[]
  onSelectSprint: (sprintId: string) => void
  selectedSprintId?: string
}

function SprintSelector({ sprints, onSelectSprint, selectedSprintId }: SprintSelectorProps) {
  // Sort sprints by state priority and date
  const sortedSprints = [...sprints].sort((a, b) => {
    // First, sort by state priority: future > active > closed
    const stateOrder = { future: 0, active: 1, closed: 2 }
    const aOrder = stateOrder[a.state as keyof typeof stateOrder] || 3
    const bOrder = stateOrder[b.state as keyof typeof stateOrder] || 3
    
    if (aOrder !== bOrder) return aOrder - bOrder
    
    // Within the same state, sort by start date (most recent first)
    if (a.startDate && b.startDate) {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    } else if (a.endDate && b.endDate) {
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    }
    
    // Finally sort by name as a last resort
    return a.name.localeCompare(b.name)
  })

  // Automatically select the latest sprint by default
  useEffect(() => {
    if (sortedSprints.length > 0 && !selectedSprintId) {
      // Select the first sprint in our sorted list (the latest one)
      onSelectSprint(sortedSprints[0].id)
    }
  }, [sortedSprints, selectedSprintId, onSelectSprint])
  
  function handleSelect(value: string) {
    onSelectSprint(value)
  }

  // Helper to format sprint state as a badge
  function getStateLabel(state: string) {
    const stateColors = {
      active: 'bg-green-100 text-green-800',
      future: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    
    const color = stateColors[state as keyof typeof stateColors] || 'bg-gray-100 text-gray-800'
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${color}`}>
        {state}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Sprint</CardTitle>
        <CardDescription>
          Choose a sprint to analyze team performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select onValueChange={handleSelect} value={selectedSprintId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a sprint" />
          </SelectTrigger>
          <SelectContent>
            {sortedSprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                <div className="flex items-center">
                  {sprint.name} {getStateLabel(sprint.state)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

export { SprintSelector } 