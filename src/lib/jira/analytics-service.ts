import { JiraIssue, TeamAnalytics, TeamPerformanceData, JiraUser } from '../types/jira'

// Helper function to calculate resolution time in days
function calculateResolutionTime(created: string, resolved?: string): number {
  if (!resolved) return 0
  
  const createdDate = new Date(created)
  const resolvedDate = new Date(resolved)
  const diffInMs = resolvedDate.getTime() - createdDate.getTime()
  return Math.round(diffInMs / (1000 * 60 * 60 * 24))
}

// Get story points from the issue (customfield_10016 for GXB, customfield_10058 for GXS)
function getStoryPoints(issue: JiraIssue): number {
  return issue.fields.customfield_10016 || issue.fields.customfield_10058 || 0
}

// Group issues by user and generate performance data
function generateUserPerformance(issues: JiraIssue[]): TeamPerformanceData[] {
  const userMap = new Map<string, TeamPerformanceData>()
  
  // First pass: group issues by assignee
  issues.forEach(issue => {
    const assignee = issue.fields.assignee
    if (!assignee) return
    
    const emailAddress = assignee.emailAddress
    if (!userMap.has(emailAddress)) {
      userMap.set(emailAddress, {
        user: {
          displayName: assignee.displayName,
          emailAddress
        },
        issuesCompleted: 0,
        storyPointsCompleted: 0,
        averageResolutionTime: 0,
        issuesByType: {}
      })
    }
    
    const userData = userMap.get(emailAddress)!
    const isCompleted = issue.fields.resolutiondate != null
    const issueType = issue.fields.issuetype.name
    
    // Update issue counts by type
    userData.issuesByType[issueType] = (userData.issuesByType[issueType] || 0) + 1
    
    if (isCompleted) {
      userData.issuesCompleted++
      userData.storyPointsCompleted += getStoryPoints(issue)
    }
  })
  
  // Second pass: calculate average resolution times
  const userResolutionTimes = new Map<string, number[]>()
  
  issues.forEach(issue => {
    const assignee = issue.fields.assignee
    if (!assignee || !issue.fields.resolutiondate) return
    
    const emailAddress = assignee.emailAddress
    if (!userResolutionTimes.has(emailAddress)) {
      userResolutionTimes.set(emailAddress, [])
    }
    
    const resolutionTime = calculateResolutionTime(
      issue.fields.created,
      issue.fields.resolutiondate
    )
    userResolutionTimes.get(emailAddress)!.push(resolutionTime)
  })
  
  // Calculate average resolution times
  userResolutionTimes.forEach((times, email) => {
    if (times.length > 0) {
      const total = times.reduce((sum, time) => sum + time, 0)
      const average = total / times.length
      const userData = userMap.get(email)
      if (userData) {
        userData.averageResolutionTime = Number(average.toFixed(1))
      }
    }
  })
  
  return Array.from(userMap.values())
}

// Generate completion trend data (issues completed per day)
function generateCompletionTrend(issues: JiraIssue[]): { date: string, count: number }[] {
  const dateMap = new Map<string, number>()
  
  issues.forEach(issue => {
    if (!issue.fields.resolutiondate) return
    
    const date = new Date(issue.fields.resolutiondate)
    const dateStr = date.toISOString().split('T')[0]
    
    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
  })
  
  // Sort dates and return as array
  return Array.from(dateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function analyzeTeamPerformance(issues: JiraIssue[]): TeamAnalytics {
  // Count issues by type
  const issuesByType: Record<string, number> = {}
  issues.forEach(issue => {
    const type = issue.fields.issuetype.name
    issuesByType[type] = (issuesByType[type] || 0) + 1
  })
  
  // Count issues by status
  const issuesByStatus: Record<string, number> = {}
  issues.forEach(issue => {
    const status = issue.fields.status.name
    issuesByStatus[status] = (issuesByStatus[status] || 0) + 1
  })
  
  // Calculate total story points
  const totalStoryPoints = issues.reduce((sum, issue) => sum + getStoryPoints(issue), 0)

  // Calculate average resolution time for completed issues
  const completedIssues = issues.filter(
    issue => issue.fields.status.name.toLowerCase() === 'closed' || issue.fields.status.name.toLowerCase() === 'done'
  )

  // Calculate completed story points
  const completedStoryPoints = completedIssues.reduce((sum, issue) => {
    return sum + getStoryPoints(issue)
  }, 0)
  
  let averageResolutionTime = 0
  
  // Calculate average resolution time for completed issues
  if (completedIssues.length > 0) {
    const totalResolutionTime = completedIssues.reduce((sum, issue) => {
      return sum + calculateResolutionTime(issue.fields.created, issue.fields.resolutiondate)
    }, 0)
    averageResolutionTime = Number((totalResolutionTime / completedIssues.length).toFixed(1))
  }
  
  return {
    totalIssues: issues.length,
    totalStoryPoints,
    completedStoryPoints,
    completedIssues: completedIssues.length,
    averageResolutionTime,
    userPerformance: generateUserPerformance(issues),
    issuesByType,
    issuesByStatus,
    completionTrend: generateCompletionTrend(issues)
  }
} 