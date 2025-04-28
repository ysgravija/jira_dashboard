import { test as setup, expect } from '@playwright/test';

// You can use this for saving authentication state
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the settings page
  await page.goto('/settings');
  
  // Fill in mock JIRA credentials for testing
  await page.getByLabel('Jira URL').fill('https://your-domain.atlassian.net');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('API Token').fill('mock-api-token-for-testing');
  
  // Save JIRA credentials
  await page.getByRole('button', { name: /Save JIRA Credentials/i }).click();
  
  // Fill in mock OpenAI API key
  await page.getByLabel('API Key').fill('mock-openai-api-key-for-testing');
  
  // Save OpenAI credentials
  await page.getByRole('button', { name: /Save OpenAI Key/i }).click();
  
  // Storage state will be saved in authFile for use in other tests
  await page.context().storageState({ path: authFile });
}); 