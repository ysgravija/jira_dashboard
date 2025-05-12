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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

const aiFormSchema = z.object({
  provider: z.enum(['openai', 'anthropic'], {
    required_error: "Please select an AI provider",
  }),
  apiKey: z.string().min(1, 'API key is required'),
})

interface SettingsFormProps {
  initialJiraCredentials?: JiraCredentials
  initialAICredentials?: {
    provider: 'openai' | 'anthropic';
    apiKey: string;
  }
  onJiraCredentialsSave: (credentials: JiraCredentials) => void
  onAICredentialsSave: (credentials: { provider: 'openai' | 'anthropic'; apiKey: string }) => void
}

export function SettingsForm({
  initialJiraCredentials,
  initialAICredentials,
  onJiraCredentialsSave,
  onAICredentialsSave,
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

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: initialAICredentials || {
      provider: 'openai',
      apiKey: '',
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
        className: "bg-red-100 border-red-400 text-red-800",
      })
    }
  }

  const handleAISubmit = async (values: z.infer<typeof aiFormSchema>) => {
    try {
      await saveCredentials('ai', values)
      onAICredentialsSave(values)
      toast({
        title: 'Settings saved',
        description: `Your ${values.provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key has been saved.`,
      })
    } catch (error) {
      console.error('Failed to save AI API key:', error)
      toast({
        title: 'Error',
        description: 'Failed to save AI API key.',
        className: "bg-red-100 border-red-400 text-red-800",
      })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Configure your API credentials for JIRA and AI providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="jira">JIRA API</TabsTrigger>
            <TabsTrigger value="ai">AI Provider</TabsTrigger>
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
          
          <TabsContent value="ai">
            <Form {...aiForm}>
              <form onSubmit={aiForm.handleSubmit(handleAISubmit)} className="space-y-4">
                <FormField
                  control={aiForm.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Provider</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={aiForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {aiForm.watch('provider') === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={aiForm.watch('provider') === 'openai' ? "sk-..." : "sk-ant-..."}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Save AI Settings</Button>
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
