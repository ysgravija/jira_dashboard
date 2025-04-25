'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JiraCredentialsSchema } from '@/lib/types/actions'
import { JiraCredentials } from '@/lib/types/jira'

const formSchema = JiraCredentialsSchema

interface CredentialsFormProps {
  defaultValues?: z.infer<typeof formSchema>
  onSubmit: (values: JiraCredentials) => void
  isLoading?: boolean
}

function CredentialsForm({ defaultValues, onSubmit, isLoading = false }: CredentialsFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      baseUrl: '',
      email: '',
      apiToken: ''
    }
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>JIRA Credentials</CardTitle>
        <CardDescription>
          Connect to your JIRA instance to analyze team performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JIRA Base URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-domain.atlassian.net" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your-email@example.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your JIRA API token" 
                      type="password"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export { CredentialsForm } 