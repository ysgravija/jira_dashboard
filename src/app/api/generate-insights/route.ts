import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { data, apiKey } = await request.json()
    
    if (!data) {
      return NextResponse.json(
        { error: 'Analytics data is required' },
        { status: 400 }
      )
    }
    
    // Construct a prompt for the AI based on the JIRA analytics data
    const prompt = constructAIPrompt(data)
    
    // Call OpenAI API with the provided API key
    const insights = await generateAIInsights(prompt, apiKey)
    
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

function constructAIPrompt(data: any) {
  // Find highest and lowest contributors based on story points
  const sortedContributors = [...data.userPerformance].sort((a, b) => 
    b.storyPointsCompleted - a.storyPointsCompleted
  );
  
  const highestContributor = sortedContributors[0] || null;
  const lowestContributor = sortedContributors[sortedContributors.length - 1] || null;
  
  // Create a simpler prompt focusing on contributor analysis
  return `
  You are an Agile coach providing a concise, insightful analysis of sprint performance data. Focus on identifying patterns in the team's efficiency and collaboration.
  
  TEAM PERFORMANCE METRICS:
  - Total Issues: ${data.totalIssues}
  - Total Story Points: ${data.totalStoryPoints}
  - Average Resolution Time: ${data.averageResolutionTime} days
  
  TEAM MEMBER CONTRIBUTIONS:
  ${sortedContributors.map((user: any) => 
    `- ${user.name}:
     * Issues Completed: ${user.issuesCompleted}
     * Story Points Completed: ${user.storyPointsCompleted}
     * Average Resolution Time: ${user.averageResolutionTime} days`
  ).join('\n\n')}
  
  Analyze the data above and provide a concise summary with these three clearly labeled sections:
  
  1. "WORKING WELL" - Identify 2-3 strengths or positive patterns based on the data (team velocity, specific contributors, balanced workload, etc.)
  
  2. "NEEDS ATTENTION" - Highlight 2-3 concerning trends or areas needing improvement (bottlenecks, uneven workloads, long resolution times, etc.)
  
  3. "ACTIONABLE IMPROVEMENTS" - Recommend 2-3 specific, practical actions to enhance team performance in the next sprint
  
  Keep your entire response under 200 words, with short bullet points for easy reading. Be direct, practical, and solutions-oriented. Use data to support your insights.
  `
}

async function generateAIInsights(prompt: string, apiKey?: string) {
  // If API key is provided, call OpenAI API
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an experienced Agile coach who provides concise, data-driven insights to help teams improve their sprint performance.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });
      
      const result = await response.json();
      
      if (result.error) {
        console.error('OpenAI API error:', result.error);
        throw new Error(result.error.message || 'OpenAI API error');
      }
      
      return result.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Fall back to generic error response
      return generateErrorMessage();
    }
  }
  
  // If no API key, use mock insights for development/demo purposes
  return generateMockInsights();
}

function generateErrorMessage() {
  return `Error: No API key provided. Please configure your API credentials in the settings.`
}

function generateMockInsights() {
  return `
## WORKING WELL

* **Consistent Delivery**: The team completed 32 story points across 14 issues, maintaining a steady velocity compared to previous sprints.
* **Top Performers**: Alice and Bob handled 45% of the total story points, demonstrating strong technical leadership.
* **Issue Distribution**: Core features received appropriate attention with 70% of story points allocated to user-facing functionality.

## NEEDS ATTENTION

* **Uneven Workload**: Three team members completed less than 2 story points each, indicating potential bottlenecks or skill gaps.
* **Long Resolution Times**: Average resolution time of 4.2 days exceeds the target of 3 days, particularly for bug fixes.
* **Documentation Tasks**: Only 2 documentation issues were completed, continuing a downward trend from previous sprints.

## ACTIONABLE IMPROVEMENTS

* **Pair Programming**: Schedule regular sessions between high and low contributors to share knowledge and balance the workload.
* **Task Breakdown**: Break larger tasks into smaller components that can be completed within 2-3 days to improve flow.
* **Sprint Planning**: Allocate specific capacity for documentation and testing to ensure these areas receive adequate attention.
  `
} 