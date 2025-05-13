import { NextRequest, NextResponse } from 'next/server'
import { AIProvider } from '@/lib/types/ai-provider'

// Define proper types for the analytics data
interface UserPerformance {
  name: string;
  issuesCompleted: number;
  storyPointsCompleted: number;
  averageResolutionTime: number;
}

interface AnalyticsData {
  completedIssues: number;
  completedStoryPoints: number;
  averageResolutionTime: number;
  userPerformance: UserPerformance[];
}

// Interface for AI request data
interface AIRequestData {
  data: AnalyticsData;
  apiKey: string;
  provider?: AIProvider;
}

export async function POST(request: NextRequest) {
  try {
    const { data, apiKey, provider = 'openai' } = await request.json() as AIRequestData
    
    if (!data) {
      return NextResponse.json(
        { 
          error: 'Analytics data is required',
          insights: `## ERROR\n\n* **Missing Data**: Analytics data is required to generate insights.`
        },
        { status: 400 }
      )
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key is required',
          insights: generateConfigurationRequiredMessage(provider)
        },
        { status: 400 }
      )
    }
    
    // Construct a prompt for the AI based on the JIRA analytics data
    const prompt = constructAIPrompt(data)
    
    // Generate insights based on the selected provider
    const insights = await generateAIInsights(prompt, apiKey, provider)
    
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

function constructAIPrompt(data: AnalyticsData) {
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
  ${sortedContributors.map((user: UserPerformance) => 
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

// Main function to generate AI insights based on provider
async function generateAIInsights(prompt: string, apiKey: string, provider: AIProvider = 'openai'): Promise<string> {
  switch (provider) {
    case 'openai':
      return generateOpenAIInsights(prompt, apiKey);
    case 'anthropic':
      return generateAnthropicInsights(prompt, apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

// OpenAI-specific implementation
async function generateOpenAIInsights(prompt: string, apiKey: string): Promise<string> {
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
    
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Anthropic-specific implementation
async function generateAnthropicInsights(prompt: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.7,
        system: getSystemPrompt(),
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      console.error('Anthropic API error:', result.error);
      throw new Error(result.error.message || 'Anthropic API error');
    }
    
    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error('Invalid response format from Anthropic API');
    }
    
    return result.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

// Generate provider-specific error messages
function generateConfigurationRequiredMessage(provider: AIProvider): string {
  const providerName = provider === 'openai' ? 'OpenAI' : 'Anthropic';
  
  return `
## CONFIGURATION REQUIRED

* **API Key Missing**: To access professional Scrum Master insights, please configure your ${providerName} API credentials.
* **Easy Setup**: Navigate to the settings page and enter your ${providerName} API key in the appropriate field.
* **Benefits**: Once configured, you'll receive detailed sprint performance analysis based on your team's actual data.
  `;
}
