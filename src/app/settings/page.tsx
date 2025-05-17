'use client'

import { useEffect, useState } from 'react'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { JiraCredentials } from '@/lib/types/jira'
import { AICredentials, OpenAICredentials } from '@/lib/types/ai-provider'
import { loadCredentialsAsync } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SettingsPage() {
  const [jiraCredentials, setJiraCredentials] = useState<JiraCredentials | null>(null)
  const [aiCredentials, setAICredentials] = useState<AICredentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load saved credentials on component mount
  useEffect(() => {
    async function loadCredentialsFromStorage() {
      try {
        setIsLoading(true)
        
        // Load JIRA credentials
        const savedJiraCredentials = await loadCredentialsAsync<JiraCredentials>('jira')
        if (savedJiraCredentials) {
          setJiraCredentials(savedJiraCredentials)
        }
        
        // Load AI credentials
        const savedAICredentials = await loadCredentialsAsync<AICredentials>('ai')
        if (savedAICredentials) {
          setAICredentials(savedAICredentials)
        } else {
          // For backward compatibility, check for OpenAI credentials
          const savedOpenAICredentials = await loadCredentialsAsync<OpenAICredentials>('openai')
          if (savedOpenAICredentials?.apiKey) {
            setAICredentials({
              provider: 'openai',
              apiKey: savedOpenAICredentials.apiKey
            })
          }
        }
      } catch (error) {
        console.error('Failed to load credentials:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadCredentialsFromStorage()
  }, [])
  
  const handleJiraCredentialsSave = (credentials: JiraCredentials) => {
    setJiraCredentials(credentials)
  }
  
  const handleAICredentialsSave = (credentials: AICredentials) => {
    setAICredentials(credentials)
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold mb-8 text-center">API Settings</h1>
        
        <div className="flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <SettingsForm 
              initialJiraCredentials={jiraCredentials || undefined}
              initialAICredentials={aiCredentials || undefined}
              onJiraCredentialsSave={handleJiraCredentialsSave}
              onAICredentialsSave={handleAICredentialsSave}
            />
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-muted-foreground">
        <p className="max-w-2xl mx-auto">
          Configure your API credentials for JIRA and AI providers. These settings are stored securely
          and will be available even if you clear your browser data.
        </p>
        <p className="mt-4 text-sm">
          <strong>JIRA API Token</strong>: Generate from your 
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens" 
             target="_blank" rel="noopener noreferrer"
             className="text-blue-500 hover:underline mx-1">
            Atlassian Account
          </a>
        </p>
        <p className="mt-2 text-sm">
          <strong>OpenAI API Key</strong>: Generate from the
          <a href="https://platform.openai.com/account/api-keys" 
             target="_blank" rel="noopener noreferrer"
             className="text-blue-500 hover:underline mx-1">
            OpenAI Dashboard
          </a>
        </p>
        <p className="mt-2 text-sm">
          <strong>Anthropic API Key</strong>: Generate from the
          <a href="https://console.anthropic.com/account/keys" 
             target="_blank" rel="noopener noreferrer"
             className="text-blue-500 hover:underline mx-1">
            Anthropic Console
          </a>
        </p>
      </div>
    </div>
  )
}
