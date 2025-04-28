import { test, expect } from '@playwright/test';

test('Home page has correct title and content', async ({ page }) => {
  await page.goto('/');

  // Check the page title and header
  await expect(page).toHaveTitle(/JIRA Dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('JIRA Team Performance Analyzer');

  // Check if the main description exists
  await expect(page.getByText('Track your team\'s performance metrics')).toBeVisible();

  // Ensure all three cards are present
  await expect(page.getByText('Team Performance Metrics')).toBeVisible();
  await expect(page.getByText('Issue Analytics')).toBeVisible();
  await expect(page.getByText('Completion Trends')).toBeVisible();

  // Check navigation button presence
  const dashboardLink = page.getByRole('link', { name: 'Go to Dashboard' });
  await expect(dashboardLink).toBeVisible();
});

test('Dashboard button navigates to dashboard page', async ({ page }) => {
  await page.goto('/');
  
  // Click the dashboard button
  await page.getByRole('link', { name: 'Go to Dashboard' }).click();
  
  // Check if URL changed to dashboard
  await expect(page).toHaveURL(/.*\/dashboard/);
}); 