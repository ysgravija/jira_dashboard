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
  
  // Create a prompt for an expert Scrum Master analysis
  return `
  As an expert Scrum Master, analyze this sprint data to provide insights and recommendations following Scrum best practices.
  
  SPRINT PERFORMANCE METRICS:
  - Total Issues Completed: ${data.totalIssues}
  - Total Story Points Delivered: ${data.totalStoryPoints}
  - Average Issue Resolution Time: ${data.averageResolutionTime} days
  
  TEAM MEMBER CONTRIBUTIONS:
  ${sortedContributors.map((user: any) => 
    `- ${user.name}:
     * Issues Completed: ${user.issuesCompleted}
     * Story Points Delivered: ${user.storyPointsCompleted}
     * Average Resolution Time: ${user.averageResolutionTime} days`
  ).join('\n\n')}
  
  Analyze this sprint data through the lens of Scrum principles and provide a structured retrospective with these three clearly labeled sections:
  
  ## SPRINT STRENGTHS
  Identify 3 key strengths demonstrated in this sprint, focusing on team velocity, collaboration, story point achievement, and adherence to Scrum practices. Support with specific data points.
  
  ## IMPROVEMENT OPPORTUNITIES
  Highlight 3 areas needing improvement based on Scrum principles, such as sprint planning accuracy, workload balance, story point estimation, or impediment removal. Support with specific data points.
  
  ## RECOMMENDED ACTIONS
  Recommend 3 specific, actionable improvements for the next sprint that follow Scrum best practices. Include concrete suggestions for the team's process, collaboration, and delivery that will help them better achieve sprint goals.
  
  Format your response with proper Markdown using ## for section headers and bullet points with * for each point. Start each bullet point with a bolded key term in **asterisks** followed by a concise explanation. Use professional language appropriate for a Scrum retrospective.
  `
}

function getSystemPrompt() {
  return `
  You are an expert Scrum Master with 10+ years of experience guiding agile teams to success. Your responsibility is to analyze sprint data, identify patterns, and provide actionable advice following Scrum best practices. 
  Your insights should help the team improve their velocity, collaboration, and delivery quality while addressing impediments and fostering continuous improvement.
  You should be able to provide a detailed analysis of the sprint data, including strengths, areas for improvement, and recommended actions.
  `;
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
            { 
              role: 'system', 
              content: getSystemPrompt() 
            },
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
  return `## Configuration Required

**API Configuration Needed**: To access professional Scrum Master insights, please configure your OpenAI API credentials in the settings. This will enable detailed sprint performance analysis based on your team's data.`
}

function generateMockInsights() {
  return `
## SPRINT STRENGTHS

* **Velocity Consistency**: The team maintained a stable velocity, completing 32 story points across 14 issues, which is within 5% of the team's established capacity.
* **Technical Excellence**: Senior team members effectively led complex implementation tasks, completing 45% of total story points while adhering to Definition of Done criteria.
* **Backlog Prioritization**: The team appropriately allocated 70% of story points to high-value product backlog items, aligning delivery with sprint goals and product roadmap.

## IMPROVEMENT OPPORTUNITIES

* **Uneven Work Distribution**: Three team members completed less than 2 story points each, indicating potential skill gaps or impediments that weren't addressed in daily scrums.
* **Story Completion Time**: Average resolution time of 4.2 days exceeds the ideal flow of completing stories throughout the sprint, suggesting stories may be too large or complex.
* **Refinement Process**: Documentation related stories consistently fall behind, indicating a need for better backlog refinement and acceptance criteria clarity.

## RECOMMENDED ACTIONS

* **Implement Pair Programming**: Schedule structured pair programming sessions twice weekly, pairing experienced and less experienced team members to transfer knowledge and improve collective code ownership.
* **Story Slicing Workshop**: Conduct a dedicated refinement session focused on breaking down larger stories into smaller, more manageable increments that can flow through the sprint more effectively.
* **Definition of Ready Enhancement**: Update the team's Definition of Ready to ensure documentation requirements are clearly specified and estimated appropriately before sprint planning.
  `
} 