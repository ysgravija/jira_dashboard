export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: string
    issuetype: {
      name: string
    }
    status: {
      name: string
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    created: string
    updated: string
    resolutiondate?: string
    customfield_10016?: number // Story points field - for GXB instance
    customfield_10058?: number // Story points field - for GXS instance
  }
}

export interface JiraUser {
  displayName: string
  emailAddress: string
  avatarUrls?: Record<string, string>
}

export interface TeamPerformanceData {
  user: JiraUser
  issuesCompleted: number
  storyPointsCompleted: number
  averageResolutionTime: number // in days
  issuesByType: Record<string, number>
}

export interface TeamAnalytics {
  totalIssues: number
  totalStoryPoints: number
  totalClosedStoryPoints: number
  averageResolutionTime: number // in days
  userPerformance: TeamPerformanceData[]
  issuesByType: Record<string, number>
  issuesByStatus: Record<string, number>
  completionTrend: {
    date: string
    count: number
  }[]
}

export interface JiraCredentials {
  baseUrl: string
  email: string
  apiToken: string
}

export interface JiraSprint {
  id: string
  name: string
  state: string  // 'active', 'closed', 'future'
  startDate?: string
  endDate?: string
} 