# JIRA Analyzer - Team Performance Dashboard

JIRA Analyzer is a web application that provides insights into team performance based on JIRA data. It visualizes metrics such as completed tasks, story points, and resolution times for team members.

## Features

- Connect to any JIRA instance using API credentials
- Select from available JIRA projects
- View team-wide performance metrics
- Analyze individual team member contributions
- Visualize issue distribution by type and status
- Track completion trends over time
- Sprint-specific performance analytics
- **AI-powered insights and recommendations with ChatGPT**

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **Data Visualization**: Chart.js
- **State Management**: React Context, Hooks
- **Form Handling**: React Hook Form, Zod
- **API Integration**: JIRA REST API, OpenAI API
- **Testing**: Playwright for end-to-end testing

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- JIRA API access token
- (Optional) OpenAI API key for AI insights
- (Optional) Docker and Docker Compose for containerized deployment

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/jira-dashboard.git
cd jira-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create a .env.local file with the following (optional for AI insights)
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker Deployment

1. Create a `.env` file with your credentials:
```bash
# Jira settings
JIRA_BASE_URL=https://your-jira-instance.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token

# OpenAI settings
OPENAI_API_KEY=your-openai-api-key
```

2. Build and run with Docker Compose:
```bash
docker compose up -d
```

3. Access the application at [http://localhost:3000](http://localhost:3000)

## Usage

1. On the dashboard page, enter your JIRA credentials:
   - JIRA Base URL (e.g., `https://your-domain.atlassian.net`)
   - Email address associated with your JIRA account
   - API token (can be generated in your Atlassian account settings)

2. Select a project from the dropdown menu

3. Navigate between tabs to view:
   - Project Analytics: Overall project metrics
   - Sprint Analytics: Performance metrics for specific sprints
   - AI Insights: ChatGPT-generated analysis and recommendations

4. On the AI Insights tab, click "Generate Insights" to receive AI-powered recommendations based on your team's performance data.

## End-to-End Testing

This project uses Playwright for end-to-end testing. The tests verify that the application works correctly from a user's perspective.

### Running Tests

1. Install Playwright browsers if you haven't already:
```bash
npx playwright install
```

2. Run all tests:
```bash
npm run test:e2e
```

3. Run tests with UI mode for debugging:
```bash
npm run test:e2e:ui
```

4. Run tests in headed mode (visible browser):
```bash
npm run test:e2e:headed
```

5. Run tests in debug mode:
```bash
npm run test:e2e:debug
```

6. Generate tests with Codegen:
```bash
npm run test:codegen
```

### Test Structure

- `tests/home.spec.ts`: Tests for the home page
- `tests/dashboard.spec.ts`: Tests for the dashboard page
- `tests/settings.spec.ts`: Tests for the settings page
- `tests/authenticated-dashboard.spec.ts`: Tests for authenticated dashboard features
- `tests/auth.setup.ts`: Authentication setup for tests

## Notes

- The application does not store your JIRA credentials - they are used only for API requests
- For the best experience, ensure your JIRA project has story points configured (customfield_10016)
- Performance may vary based on the size of your JIRA project

## License

This project is licensed under the MIT License - see the LICENSE file for details.
