'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JiraSprint } from '@/lib/types/jira'

interface SprintSelectorProps {
  sprints: JiraSprint[]
  onSelectSprint: (sprintId: string) => void
  selectedSprintId?: string
}

function SprintSelector({ sprints, onSelectSprint, selectedSprintId }: SprintSelectorProps) {
  // Sort sprints with active sprints first, then by state (future, closed), then by name
  const sortedSprints = [...sprints].sort((a, b) => {
    // Active sprints always come first
    if (a.state === 'active' && b.state !== 'active') return -1
    if (a.state !== 'active' && b.state === 'active') return 1
    
    // Then sort by state priority: active > future > closed
    const stateOrder = { active: 0, future: 1, closed: 2 }
    const aOrder = stateOrder[a.state as keyof typeof stateOrder] || 3
    const bOrder = stateOrder[b.state as keyof typeof stateOrder] || 3
    
    if (aOrder !== bOrder) return aOrder - bOrder
    
    // Finally sort by name
    return a.name.localeCompare(b.name)
  })

  // Auto-select first active sprint if none selected
  useEffect(() => {
    if (!selectedSprintId && sortedSprints.length > 0) {
      const activeSprint = sortedSprints.find(sprint => sprint.state === 'active')
      if (activeSprint) {
        onSelectSprint(activeSprint.id)
      } else {
        // If no active sprint, select the first one
        onSelectSprint(sortedSprints[0].id)
      }
    }
  }, [sprints, selectedSprintId, onSelectSprint])
  
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