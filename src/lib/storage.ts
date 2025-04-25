// Storage utility for managing API credentials

type CredentialType = 'jira' | 'openai';

/**
 * Save credentials to both local storage and server file
 */
export async function saveCredentials(type: CredentialType, credentials: any): Promise<void> {
  try {
    // Save to local storage
    localStorage.setItem(`${type}_credentials`, JSON.stringify(credentials));
    
    // Save to server file
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
 * Load credentials - first try local storage, then server file if not found
 */
export async function loadCredentialsAsync<T>(type: CredentialType): Promise<T | null> {
  try {
    // Try local storage first
    const localCredentials = localStorage.getItem(`${type}_credentials`);
    
    if (localCredentials) {
      return JSON.parse(localCredentials) as T;
    }
    
    // If not in local storage, try server file
    const response = await fetch('/api/settings');
    if (!response.ok) {
      return null;
    }
    
    const settings = await response.json();
    const serverCredentials = settings[type];
    
    if (serverCredentials) {
      // Update local storage with server credentials
      localStorage.setItem(`${type}_credentials`, JSON.stringify(serverCredentials));
      return serverCredentials as T;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to load ${type} credentials:`, error);
    return null;
  }
}

/**
 * Load credentials synchronously from local storage only
 */
export function loadCredentials<T>(type: CredentialType): T | null {
  try {
    const credentials = localStorage.getItem(`${type}_credentials`);
    
    if (!credentials) {
      return null;
    }
    
    return JSON.parse(credentials) as T;
  } catch (error) {
    console.error(`Failed to load ${type} credentials:`, error);
    return null;
  }
}

/**
 * Clear credentials from both local storage and server file
 */
export async function clearCredentials(type: CredentialType): Promise<void> {
  try {
    // Clear from local storage
    localStorage.removeItem(`${type}_credentials`);
    
    // Clear from server file by setting to null
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