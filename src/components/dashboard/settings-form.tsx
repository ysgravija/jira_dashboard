'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { JiraCredentials } from '@/lib/types/jira'
import { saveCredentials } from '@/lib/storage'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'

const jiraFormSchema = z.object({
  baseUrl: z.string().url('Please enter a valid URL'),
  email: z.string().email('Please enter a valid email'),
  apiToken: z.string().min(1, 'API token is required'),
})

const openAIFormSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
})

interface SettingsFormProps {
  initialJiraCredentials?: JiraCredentials
  initialOpenAIKey?: string
  onJiraCredentialsSave: (credentials: JiraCredentials) => void
  onOpenAIKeySave: (apiKey: string) => void
}

export function SettingsForm({
  initialJiraCredentials,
  initialOpenAIKey,
  onJiraCredentialsSave,
  onOpenAIKeySave,
}: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<string>('jira')

  const jiraForm = useForm<JiraCredentials>({
    resolver: zodResolver(jiraFormSchema),
    defaultValues: initialJiraCredentials || {
      baseUrl: '',
      email: '',
      apiToken: '',
    },
  })

  const openAIForm = useForm<{ apiKey: string }>({
    resolver: zodResolver(openAIFormSchema),
    defaultValues: {
      apiKey: initialOpenAIKey || '',
    },
  })

  const handleJiraSubmit = async (values: JiraCredentials) => {
    try {
      await saveCredentials('jira', values)
      onJiraCredentialsSave(values)
      toast({
        title: 'Settings saved',
        description: 'Your JIRA credentials have been saved in the application.',
      })
    } catch (error) {
      console.error('Failed to save JIRA credentials:', error)
      toast({
        title: 'Error',
        description: 'Failed to save JIRA credentials.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenAISubmit = async (values: { apiKey: string }) => {
    try {
      await saveCredentials('openai', { apiKey: values.apiKey })
      onOpenAIKeySave(values.apiKey)
      toast({
        title: 'Settings saved',
        description: 'Your OpenAI API key has been saved in the application.',
      })
    } catch (error) {
      console.error('Failed to save OpenAI API key:', error)
      toast({
        title: 'Error',
        description: 'Failed to save OpenAI API key.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Configure your API credentials for JIRA and OpenAI
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="jira">JIRA API</TabsTrigger>
            <TabsTrigger value="openai">OpenAI API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jira">
            <Form {...jiraForm}>
              <form onSubmit={jiraForm.handleSubmit(handleJiraSubmit)} className="space-y-4">
                <FormField
                  control={jiraForm.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JIRA Base URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-domain.atlassian.net" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jiraForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your-email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={jiraForm.control}
                  name="apiToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Token</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your JIRA API token" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save JIRA Settings</Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="openai">
            <Form {...openAIForm}>
              <form onSubmit={openAIForm.handleSubmit(handleOpenAISubmit)} className="space-y-4">
                <FormField
                  control={openAIForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="sk-..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save OpenAI Settings</Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>Your credentials are saved both in your browser and on the server.</p>
      </CardFooter>
    </Card>
  )
} 