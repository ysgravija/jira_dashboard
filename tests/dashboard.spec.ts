import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('Dashboard page loads and shows credentials form when not authenticated', async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('/dashboard');
    
    // Check if we're on the dashboard page
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // The credentials form should be visible when not authenticated
    await expect(page.getByText('Jira Credentials')).toBeVisible();
    await expect(page.getByLabel('Jira URL')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('API Token')).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect/i })).toBeVisible();
  });
  
  test('Settings link is visible and navigates to settings page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if the settings icon/link is visible
    const settingsLink = page.getByRole('link').filter({ has: page.locator('svg[data-icon="settings"]') });
    if (await settingsLink.count() === 0) {
      // Alternative: try to find by text if icon approach doesn't work
      const altSettingsLink = page.getByRole('link', { name: /settings/i });
      await expect(altSettingsLink).toBeVisible();
      
      // Click on settings link
      await altSettingsLink.click();
    } else {
      await expect(settingsLink).toBeVisible();
      
      // Click on settings link
      await settingsLink.click();
    }
    
    // Check that we navigated to the settings page
    await expect(page).toHaveURL(/.*\/settings/);
  });
  
  test('Dashboard has proper tab structure', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for the tabs
    await expect(page.getByRole('tab', { name: /sprint/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /project/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /insights/i })).toBeVisible();
  });
}); 