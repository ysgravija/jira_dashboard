// Storage utility for managing API credentials

type CredentialType = 'jira' | 'openai';

// Type definitions for credentials
interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface OpenAICredentials {
  apiKey: string;
}

type CredentialValue = JiraCredentials | OpenAICredentials | null;

/**
 * Save credentials to server file
 */
export async function saveCredentials(type: CredentialType, credentials: CredentialValue): Promise<void> {
  try {    
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, credentials }),
    });
  } catch (error) {
    console.error(`Failed to save ${type} credentials:`, error);
    throw error;
  }
}

/**
 * Load credentials - load server file
 */
export async function loadCredentialsAsync<T>(type: CredentialType): Promise<T | null> {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      return null;
    }
    
    const settings = await response.json();    
    return settings[type];
  } catch (error) {
    console.error(`Failed to load ${type} credentials:`, error);
    return null;
  }
}

/**
 * Clear credentials from server file
 */
export async function clearCredentials(type: CredentialType): Promise<void> {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, credentials: null }),
    });
  } catch (error) {
    console.error(`Failed to clear ${type} credentials:`, error);
    throw error;
  }
} 