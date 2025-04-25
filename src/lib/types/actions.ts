import { z } from 'zod'
import { TeamAnalytics, JiraProject } from './jira'

export type ActionState<T> = 
  | { status: 'idle' } 
  | { status: 'loading' } 
  | { status: 'success', data: T } 
  | { status: 'error', error: string }

export type ActionResponse<T = unknown> = {
  data?: T
  error?: string
}

export const JiraCredentialsSchema = z.object({
  baseUrl: z.string().url(),
  email: z.string().email(),
  apiToken: z.string().min(1)
})

export const FetchProjectsInputSchema = JiraCredentialsSchema

export const TeamAnalyticsInputSchema = z.object({
  credentials: JiraCredentialsSchema,
  projectKey: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export type FetchProjectsResponse = ActionResponse<JiraProject[]>
export type TeamAnalyticsResponse = ActionResponse<TeamAnalytics> 