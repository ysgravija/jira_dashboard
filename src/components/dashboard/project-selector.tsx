'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JiraProject } from '@/lib/types/jira'

interface ProjectSelectorProps {
  projects: JiraProject[]
  onSelectProject: (projectKey: string) => void
  selectedProjectKey?: string
}

function ProjectSelector({ projects, onSelectProject, selectedProjectKey }: ProjectSelectorProps) {
  // Sort projects alphabetically by name
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name))
  
  function handleSelect(value: string) {
    onSelectProject(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select JIRA Project</CardTitle>
        <CardDescription>
          Choose a project to analyze team performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select onValueChange={handleSelect} value={selectedProjectKey}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {sortedProjects.map((project) => (
              <SelectItem key={project.id} value={project.key}>
                {project.name} ({project.key})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}

export { ProjectSelector } 