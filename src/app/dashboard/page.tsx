'use client'

import { useState, useEffect } from 'react'
import { 
  fetchJiraProjects, 
  fetchTeamAnalytics, 
  fetchBoardsForProject,
  fetchSprintsForBoard,
  fetchSprintAnalytics
} from '@/lib/actions/jira-actions'
import { JiraCredentials, JiraProject, TeamAnalytics, JiraSprint } from '@/lib/types/jira'
import { loadCredentialsAsync } from '@/lib/storage'
import { CredentialsForm } from '@/components/dashboard/credentials-form'
import { ProjectSelector } from '@/components/dashboard/project-selector'
import { SprintSelector } from '@/components/dashboard/sprint-selector'
import { TeamStatistics } from '@/components/dashboard/team-statistics'
import { TeamPerformanceTable } from '@/components/dashboard/team-performance-table'
import { IssueDistributionChart } from '@/components/dashboard/issue-distribution-chart'
import { CompletionTrendChart } from '@/components/dashboard/completion-trend-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIInsights } from '@/components/dashboard/ai-insights'
import Link from 'next/link'
import { Settings } from 'lucide-react'

export default function DashboardPage() {
  // State
  const [credentials, setCredentials] = useState<JiraCredentials | null>(null)
  const [projects, setProjects] = useState<JiraProject[]>([])
  const [selectedProjectKey, setSelectedProjectKey] = useState<string>('')
  const [sprints, setSprints] = useState<JiraSprint[]>([])
  const [selectedSprintId, setSelectedSprintId] = useState<string>('')
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'project' | 'sprint' | 'insights'>('sprint')

  // Handlers
  const handleCredentialsSubmit = async (values: JiraCredentials) => {
    setIsLoading(true)
    setError(null)
    setCredentials(values)
    
    try {
      const result = await fetchJiraProjects(values)
      if (result.data) {
        setProjects(result.data)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to fetch projects')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectProject = async (projectKey: string) => {
    if (!credentials) return
    
    setSelectedProjectKey(projectKey)
    setSelectedSprintId('')
    setSprints([])
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch boards for the selected project
      const boardsResult = await fetchBoardsForProject(credentials, projectKey)
      
      if (boardsResult.data && boardsResult.data.length > 0) {
        // Auto-select the first board
        const firstBoardId = boardsResult.data[0].id
        
        // Fetch sprints for the selected board
        const sprintsResult = await fetchSprintsForBoard(credentials, firstBoardId)
        if (sprintsResult.data) {
          setSprints(sprintsResult.data)
          
          // If sprints are available, auto-select the first sprint for the sprint view
          if (sprintsResult.data.length > 0 && activeTab === 'sprint') {
            const firstSprintId = sprintsResult.data[0].id
            setSelectedSprintId(firstSprintId)
            
            // Fetch sprint analytics for the selected sprint
            const sprintAnalyticsResult = await fetchSprintAnalytics({
              credentials,
              sprintId: firstSprintId
            })
            
            if (sprintAnalyticsResult.data) {
              setAnalytics(sprintAnalyticsResult.data)
            } else if (sprintAnalyticsResult.error) {
              setError(sprintAnalyticsResult.error)
            }
          }
        }
      }
      
      // For project view, fetch all project analytics
      if (activeTab === 'project') {
        const analyticsResult = await fetchTeamAnalytics({
          credentials,
          projectKey,
          startDate: undefined,
          endDate: undefined
        })
        
        if (analyticsResult.data) {
          setAnalytics(analyticsResult.data)
        } else if (analyticsResult.error) {
          setError(analyticsResult.error)
        }
      }
    } catch (err) {
      setError('Failed to fetch project data')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  /* Commented out as it's currently unused but may be needed in the future
  const handleSelectBoard = async (boardId: string) => {
    if (!credentials) return
    
    setSelectedBoardId(boardId)
    setSelectedSprintId('')
    setIsLoading(true)
    setError(null)
    
    try {
      const sprintsResult = await fetchSprintsForBoard(credentials, boardId)
      if (sprintsResult.data) {
        setSprints(sprintsResult.data)
      } else if (sprintsResult.error) {
        setError(sprintsResult.error)
      }
    } catch (err) {
      setError('Failed to fetch sprints')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  */
  
  const handleSelectSprint = async (sprintId: string) => {
    if (!credentials) return
    
    setSelectedSprintId(sprintId)
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await fetchSprintAnalytics({
        credentials,
        sprintId
      })
      
      if (result.data) {
        setAnalytics(result.data)
      } else if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to fetch sprint analytics')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'project' | 'sprint')
    
    // Only clear analytics when switching between project and sprint tabs
    if ((value === 'project' || value === 'sprint') && 
        (activeTab === 'project' || activeTab === 'sprint') && 
        value !== activeTab) {
      setAnalytics(null)
    }
    
    // When switching to project tab, load project analytics
    if (value === 'project' && credentials && selectedProjectKey) {
      handleSelectProject(selectedProjectKey)
    }
    
    // When switching to sprint tab, load sprint analytics if a sprint is selected
    if (value === 'sprint' && credentials && selectedSprintId) {
      handleSelectSprint(selectedSprintId)
    }
  }

  // Replace the existing useEffect for loading credentials
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        setIsLoading(true)
        const savedCredentials = await loadCredentialsAsync<JiraCredentials>('jira')
        
        if (savedCredentials) {
          setCredentials(savedCredentials)
          try {
            const result = await fetchJiraProjects(savedCredentials)
            if (result.data) {
              setProjects(result.data)
            } else if (result.error) {
              setError(result.error)
            }
          } catch (err) {
            setError('Failed to fetch projects with saved credentials')
            console.error(err)
          }
        }
      } catch (err) {
        console.error('Error loading credentials:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSavedCredentials()
  }, [])

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">JIRA Team Performance Dashboard</h1>

      {!credentials && (
        <div className="text-center mb-6">
          <Link href="/settings" className="inline-flex items-center text-blue-500 hover:underline">
            <Settings className="mr-2 h-4 w-4" />
            Configure API Settings
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!credentials && (
        <div className="flex justify-center">
          <CredentialsForm onSubmit={handleCredentialsSubmit} isLoading={isLoading} />
        </div>
      )}

      {credentials && projects.length > 0 && (
        <>
          <div className="mb-8 max-w-md mx-auto">
            <ProjectSelector 
              projects={projects} 
              onSelectProject={handleSelectProject} 
              selectedProjectKey={selectedProjectKey} 
            />
          </div>

          {selectedProjectKey && (
            <>
              <Tabs defaultValue="sprint" onValueChange={handleTabChange} className="mb-8">
                <div className="flex justify-center mb-4">
                  <TabsList>
                    <TabsTrigger value="sprint">Sprint Analytics</TabsTrigger>
                    <TabsTrigger value="project">Project Analytics</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="sprint">
                  {/* Sprint selector */}
                  {sprints.length > 0 ? (
                    <div className="mb-8 max-w-md mx-auto">
                      <SprintSelector 
                        sprints={sprints} 
                        onSelectSprint={handleSelectSprint} 
                        selectedSprintId={selectedSprintId} 
                      />
                    </div>
                  ) : selectedProjectKey ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No sprints found for the selected project.
                    </div>
                  ) : null}
                  
                  {/* Sprint analytics */}
                  {selectedSprintId && analytics && (
                    <div className="space-y-6">
                      <TeamStatistics analytics={analytics} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <IssueDistributionChart analytics={analytics} />
                        <CompletionTrendChart analytics={analytics} />
                      </div>
                      
                      <TeamPerformanceTable analytics={analytics} />
                      
                      <AIInsights analytics={analytics} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="project">
                  {/* Project analytics view */}
                  {analytics && (
                    <div className="space-y-6">
                      <TeamStatistics analytics={analytics} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <IssueDistributionChart analytics={analytics} />
                        <CompletionTrendChart analytics={analytics} />
                      </div>
                      
                      <TeamPerformanceTable analytics={analytics} />
                      
                      <AIInsights analytics={analytics} />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-center">Loading...</p>
          </div>
        </div>
      )}
    </div>
  )
} 