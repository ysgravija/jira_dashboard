import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test('Settings page loads correctly', async ({ page }) => {
    // Navigate to the settings page
    await page.goto('/settings');
    
    // Check if we're on the settings page
    await expect(page).toHaveTitle(/JIRA Dashboard/);
    
    // Check for the heading
    await expect(page.getByRole('heading', { name: 'API Settings' })).toBeVisible();
    
    // Check for the back to dashboard button
    await expect(page.getByRole('link', { name: /Back to Dashboard/i })).toBeVisible();
  });
  
  test('Settings page shows the settings form', async ({ page }) => {
    await page.goto('/settings');
    
    // Check for JIRA credentials form
    await expect(page.getByText('JIRA Credentials')).toBeVisible();
    await expect(page.getByLabel('Jira URL')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('API Token')).toBeVisible();
    
    // Check for OpenAI API key form
    await expect(page.getByText('OpenAI API Key')).toBeVisible();
    await expect(page.getByLabel('API Key')).toBeVisible();
    
    // Check for save buttons
    await expect(page.getByRole('button', { name: /Save JIRA Credentials/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save OpenAI Key/i })).toBeVisible();
  });
  
  test('Back to Dashboard button navigates to dashboard', async ({ page }) => {
    await page.goto('/settings');
    
    // Click the back to dashboard button
    await page.getByRole('link', { name: /Back to Dashboard/i }).click();
    
    // Check if we navigated to the dashboard page
    await expect(page).toHaveURL(/.*\/dashboard/);
  });
  
  test('Settings page contains external links', async ({ page }) => {
    await page.goto('/settings');
    
    // Check for Atlassian Account link
    const atlassianLink = page.getByRole('link', { name: /Atlassian Account/i });
    await expect(atlassianLink).toBeVisible();
    await expect(atlassianLink).toHaveAttribute('href', 'https://id.atlassian.com/manage-profile/security/api-tokens');
    
    // Check for OpenAI Dashboard link
    const openaiLink = page.getByRole('link', { name: /OpenAI Dashboard/i });
    await expect(openaiLink).toBeVisible();
    await expect(openaiLink).toHaveAttribute('href', 'https://platform.openai.com/account/api-keys');
  });
}); 