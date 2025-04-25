'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamAnalytics } from '@/lib/types/jira'
import { Chart, registerables } from 'chart.js'
import { Pie } from 'react-chartjs-2'

// Register Chart.js components
Chart.register(...registerables)

interface IssueDistributionChartProps {
  analytics: TeamAnalytics
}

function IssueDistributionChart({ analytics }: IssueDistributionChartProps) {
  const [activeTab, setActiveTab] = useState('type')
  const [chartData, setChartData] = useState<{
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
    }[]
  }>({
    labels: [],
    datasets: [
      {
        label: '',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }
    ]
  })

  useEffect(() => {
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(255, 99, 255, 0.6)',
      'rgba(54, 162, 164, 0.6)'
    ]
    const borderColors = colors.map(c => c.replace('0.6', '1'))

    const data = activeTab === 'type' ? analytics.issuesByType : analytics.issuesByStatus
    const labels = Object.keys(data)
    const values = Object.values(data)

    setChartData({
      labels,
      datasets: [
        {
          label: `Issues by ${activeTab === 'type' ? 'Type' : 'Status'}`,
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1
        }
      ]
    })
  }, [activeTab, analytics])

  return (
    <Card className="mt-6">
      <CardHeader className="text-center">
        <CardTitle>Issue Distribution</CardTitle>
        <CardDescription>
          Breakdown of issues by type and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="type" onValueChange={setActiveTab}>
          <div className="flex justify-center mb-4">
            <TabsList>
              <TabsTrigger value="type">By Type</TabsTrigger>
              <TabsTrigger value="status">By Status</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="type" className="h-80">
            <Pie
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </TabsContent>
          <TabsContent value="status" className="h-80">
            <Pie
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export { IssueDistributionChart } 