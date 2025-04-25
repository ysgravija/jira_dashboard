'use server'

import { createSafeActionClient } from 'next-safe-action'
import { 
  FetchProjectsInputSchema,
  TeamAnalyticsInputSchema,
  FetchProjectsResponse,
  TeamAnalyticsResponse
} from '../types/actions'
import { 
  getProjects, 
  fetchAllIssues, 
  getBoards, 
  getSprints,
  getSprintIssues 
} from '../jira/jira-service'
import { analyzeTeamPerformance } from '../jira/analytics-service'
import { JiraCredentials, JiraSprint } from '../types/jira'

// Create the action client
const action = createSafeActionClient()

// Define server actions
export async function fetchJiraProjects(credentials: JiraCredentials): Promise<FetchProjectsResponse> {
  try {
    const projects = await getProjects(credentials)
    return {
      data: projects
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }
  }
}

export async function fetchTeamAnalytics(
  input: {
    credentials: JiraCredentials;
    projectKey: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<TeamAnalyticsResponse> {
  try {
    const { credentials, projectKey, startDate, endDate } = input
    
    // Fetch all issues for the project
    const issues = await fetchAllIssues(credentials, projectKey, startDate, endDate)
    
    // Generate analytics from issues
    const analytics = analyzeTeamPerformance(issues)
    
    return {
      data: analytics
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to analyze team performance'
    }
  }
}

export async function fetchBoardsForProject(
  credentials: JiraCredentials,
  projectKey: string
): Promise<{ data?: { id: string, name: string }[], error?: string }> {
  try {
    const boards = await getBoards(credentials, projectKey)
    return {
      data: boards
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch boards'
    }
  }
}

export async function fetchSprintsForBoard(
  credentials: JiraCredentials,
  boardId: string
): Promise<{ data?: JiraSprint[], error?: string }> {
  try {
    const sprints = await getSprints(credentials, boardId)
    return {
      data: sprints
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to fetch sprints'
    }
  }
}

export async function fetchSprintAnalytics(
  input: {
    credentials: JiraCredentials;
    sprintId: string;
  }
): Promise<TeamAnalyticsResponse> {
  try {
    const { credentials, sprintId } = input
    
    // Fetch all issues for the sprint
    const issues = await getSprintIssues(credentials, sprintId)
    
    // Generate analytics from issues
    const analytics = analyzeTeamPerformance(issues)
    
    return {
      data: analytics
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to analyze sprint performance'
    }
  }
} 