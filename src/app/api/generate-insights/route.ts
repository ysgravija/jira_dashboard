import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { data, apiKey } = await request.json()
    
    if (!data) {
      return NextResponse.json(
        { 
          error: 'Analytics data is required',
          insights: `## ERROR\n\n* **Missing Data**: Analytics data is required to generate insights.`
        },
        { status: 400 }
      )
    }
    
    // Construct a prompt for the AI based on the JIRA analytics data
    const prompt = constructAIPrompt(data)
    
    // Call OpenAI API with the provided API key
    const insights = await generateAIInsights(prompt, apiKey)
    
    // Return the raw insights without processing
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        insights: `## ERROR\n\n* **Generation Failed**: ${error instanceof Error ? error.message : 'An unexpected error occurred'}.`
      },
      { status: 500 }
    )
  }
}

function constructAIPrompt(data: any) {
  // Find highest and lowest contributors based on story points
  const sortedContributors = [...data.userPerformance].sort((a, b) => 
    b.storyPointsCompleted - a.storyPointsCompleted
  );
    
  // Create a prompt for an expert Scrum Master analysis
  return `
  As an expert Scrum Master, analyze this sprint data to provide insights and recommendations following Scrum best practices.
  
  SPRINT PERFORMANCE METRICS:
  - Total Issues Completed: ${data.completedIssues}
  - Total Story Points Delivered: ${data.completedStoryPoints}
  - Average Issue Resolution Time: ${data.averageResolutionTime} days
  
  TEAM MEMBER CONTRIBUTIONS:
  ${sortedContributors.map((user: any) => 
    `- ${user.name}:
     * Issues Completed: ${user.issuesCompleted}
     * Story Points Delivered: ${user.storyPointsCompleted}
     * Average Resolution Time: ${user.averageResolutionTime} days`
  ).join('\n\n')}
  
  Analyze this sprint data through the lens of Scrum principles and provide a structured retrospective with exactly these three sections in this exact order:
  
  ## SPRINT STRENGTHS
  
  * **Term 1**: Explanation...
  * **Term 2**: Explanation...
  * **Term 3**: Explanation...
  
  ## IMPROVEMENT OPPORTUNITIES
  
  * **Term 1**: Explanation...
  * **Term 2**: Explanation...
  * **Term 3**: Explanation...
  
  ## RECOMMENDED ACTIONS
  
  * **Term 1**: Explanation...
  * **Term 2**: Explanation...
  * **Term 3**: Explanation...
  
  IMPORTANT: Replace the placeholders above with actual insights from the data, but MAINTAIN THE EXACT MARKDOWN FORMATTING shown above. Your response MUST use this exact structure with all section headers using two hash marks (##) and all bullet points using asterisks (*).
  `
}

function getSystemPrompt() {
  return `
  You are an expert Scrum Master with 10+ years of experience guiding agile teams to success. Your responsibility is to analyze sprint data, identify patterns, and provide actionable advice following Scrum best practices. 
  Your insights should help the team improve their velocity, collaboration, and delivery quality while addressing impediments and fostering continuous improvement.
  
  MARKDOWN FORMATTING REQUIREMENTS:
  You must format your entire response using proper Markdown syntax exactly as follows:
  
  1. START with a blank line, then add section headers using exactly two hash marks and the exact section title:
     \`\`\`
     ## SPRINT STRENGTHS
     \`\`\`
  
  2. LEAVE a blank line after each section header
  
  3. INCLUDE exactly these three sections in this order:
     - ## SPRINT STRENGTHS
     - ## IMPROVEMENT OPPORTUNITIES 
     - ## RECOMMENDED ACTIONS
  
  4. CREATE bullet points using a single asterisk followed by a space:
     \`\`\`
     * 
     \`\`\`
  
  5. START each bullet point with a term in bold using double asterisks:
     \`\`\`
     * **Key Term**: Your explanation...
     \`\`\`
  
  6. INCLUDE exactly 3 bullet points under each section
  
  7. DO NOT use any other formatting styles, section titles, or bullet point styles
  
  8. KEEP bullet points concise and data-driven
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
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }
      
      const rawContent = result.choices[0].message.content;
      
      // Return raw content - it will be processed by the markdown library
      return rawContent;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      // Fall back to generic error response
      return generateErrorMessage();
    }
  }
  
  // If no API key, use mock insights for development/demo purposes
  return generateDefaultErrorMessage();
}

function generateErrorMessage() {
  return `
## CONFIGURATION REQUIRED

* **API Key Missing**: To access professional Scrum Master insights, please configure your OpenAI API credentials.
* **Easy Setup**: Navigate to the settings page and enter your OpenAI API key in the appropriate field.
* **Benefits**: Once configured, you'll receive detailed sprint performance analysis based on your team's actual data.
  `;
}

function generateDefaultErrorMessage() {
  return `
## AI INSIGHTS UNAVAILABLE

* **Configuration Required**: AI insights are not available at this time.
* **API Setup Needed**: Please configure your OpenAI API credentials in the settings.
* **Next Steps**: Visit the settings page and enter a valid OpenAI API key to enable AI-powered Scrum Master insights.
  `;
} 