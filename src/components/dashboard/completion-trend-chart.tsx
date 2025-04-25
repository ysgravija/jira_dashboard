'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamAnalytics } from '@/lib/types/jira'
import { Chart, registerables } from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
Chart.register(...registerables)

interface CompletionTrendChartProps {
  analytics: TeamAnalytics
}

function CompletionTrendChart({ analytics }: CompletionTrendChartProps) {
  const chartData = useMemo(() => {
    const dates = analytics.completionTrend.map(item => item.date)
    const counts = analytics.completionTrend.map(item => item.count)

    return {
      labels: dates,
      datasets: [
        {
          label: 'Issues Completed',
          data: counts,
          fill: false,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }
      ]
    }
  }, [analytics])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Completed Issues'
        },
        beginAtZero: true
      }
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader className="text-center">
        <CardTitle>Completion Trend</CardTitle>
        <CardDescription>
          Issues completed over time
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <Line data={chartData} options={options} />
      </CardContent>
    </Card>
  )
}

export { CompletionTrendChart } 