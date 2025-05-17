'use client'

import { useEffect, useState } from 'react'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { JiraCredentials } from '@/lib/types/jira'
import { AICredentials } from '@/lib/types/ai-provider'
import { DatadogCredentials } from '@/lib/types/datadog'
import { loadCredentialsAsync } from '@/lib/storage'

export default function SettingsPage() {
  const [jiraCredentials, setJiraCredentials] = useState<JiraCredentials | undefined>()
  const [aiCredentials, setAICredentials] = useState<AICredentials | undefined>()
  const [datadogCredentials, setDatadogCredentials] = useState<DatadogCredentials | undefined>()

  useEffect(() => {
    async function loadCredentials() {
      const loadedJiraCredentials = await loadCredentialsAsync<JiraCredentials>('jira')
      const loadedAICredentials = await loadCredentialsAsync<AICredentials>('ai')
      const loadedDatadogCredentials = await loadCredentialsAsync<DatadogCredentials>('datadog')

      setJiraCredentials(loadedJiraCredentials || undefined)
      setAICredentials(loadedAICredentials || undefined)
      setDatadogCredentials(loadedDatadogCredentials || undefined)
    }

    loadCredentials()
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <SettingsForm 
        initialJiraCredentials={jiraCredentials}
        initialAICredentials={aiCredentials}
        initialDatadogCredentials={datadogCredentials}
        onJiraCredentialsSave={setJiraCredentials}
        onAICredentialsSave={setAICredentials}
        onDatadogCredentialsSave={setDatadogCredentials}
      />
    </div>
  )
}
