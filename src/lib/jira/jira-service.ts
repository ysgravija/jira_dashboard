import axios from 'axios'
import { JiraCredentials, JiraProject, JiraIssue, JiraUser, JiraSprint } from '../types/jira'

export class JiraApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JiraApiError'
  }
}

function createJiraApi(credentials: JiraCredentials) {
  const { baseUrl, email, apiToken } = credentials
  const authToken = Buffer.from(`${email}:${apiToken}`).toString('base64')
  
  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  // Add response interceptor for error handling
  api.interceptors.response.use(
    response => response,
    error => {
      const message = error.response?.data?.errorMessages?.[0] || 
                     error.response?.data?.message || 
                     'An error occurred while communicating with JIRA'
      throw new JiraApiError(message)
    }
  )
  
  return api
}

export async function getProjects(credentials: JiraCredentials): Promise<JiraProject[]> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.get('/rest/api/2/project')
    return response.data
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to fetch JIRA projects')
  }
}

export async function searchIssues(
  credentials: JiraCredentials, 
  jql: string, 
  fields: string[] = ['summary', 'status', 'assignee', 'issuetype', 'created', 'updated', 'resolutiondate', 'customfield_10016'],
  startAt: number = 0,
  maxResults: number = 100
): Promise<{ issues: JiraIssue[], total: number }> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.post('/rest/api/2/search', {
      jql,
      fields,
      startAt,
      maxResults
    })
    
    return {
      issues: response.data.issues,
      total: response.data.total
    }
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to search JIRA issues')
  }
}

export async function fetchAllIssues(
  credentials: JiraCredentials,
  projectKey: string,
  startDate?: string,
  endDate?: string
): Promise<JiraIssue[]> {
  // Construct JQL query
  let jql = `project = ${projectKey}`
  
  if (startDate) {
    jql += ` AND created >= "${startDate}"`
  }
  
  if (endDate) {
    jql += ` AND created <= "${endDate}"`
  }
  
  const allIssues: JiraIssue[] = []
  let startAt = 0
  const maxResults = 100
  let total = 0
  
  do {
    const { issues, total: issuesTotal } = await searchIssues(credentials, jql, undefined, startAt, maxResults)
    total = issuesTotal
    allIssues.push(...issues)
    startAt += issues.length
  } while (startAt < total)
  
  return allIssues
}

export async function getUsers(credentials: JiraCredentials): Promise<JiraUser[]> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.get('/rest/api/2/users')
    return response.data
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to fetch JIRA users')
  }
}

export async function getBoards(credentials: JiraCredentials, projectKey: string): Promise<{ id: string, name: string }[]> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.get(`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`)
    return response.data.values
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to fetch JIRA boards')
  }
}

export async function getSprints(credentials: JiraCredentials, boardId: string): Promise<JiraSprint[]> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.get(`/rest/agile/1.0/board/${boardId}/sprint`)
    return response.data.values
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to fetch JIRA sprints')
  }
}

export async function getSprintIssues(
  credentials: JiraCredentials,
  sprintId: string
): Promise<JiraIssue[]> {
  try {
    const api = createJiraApi(credentials)
    const response = await api.get(`/rest/agile/1.0/sprint/${sprintId}/issue`)
    return response.data.issues
  } catch (error) {
    if (error instanceof JiraApiError) {
      throw error
    }
    throw new JiraApiError('Failed to fetch sprint issues')
  }
} 