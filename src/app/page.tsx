import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-16">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          JIRA Team Performance Analyzer
        </h1>
        <p className="text-xl text-muted-foreground">
          Track your team's performance metrics using JIRA data. Get insights into completed tasks, story points, resolution times, and more.
        </p>
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Go to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Metrics</CardTitle>
            <CardDescription>Track individual contributions to the project</CardDescription>
          </CardHeader>
          <CardContent>
            <p>See detailed metrics for each team member, including total issues completed, story points, and average resolution time.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue Analytics</CardTitle>
            <CardDescription>Visualize issue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <p>View breakdowns of issues by type and status with interactive charts and visualizations.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Trends</CardTitle>
            <CardDescription>Track progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Monitor team velocity and productivity trends with historical completion data.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
