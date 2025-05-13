import { promises as fs } from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { AICredentials, OpenAICredentials } from '@/lib/types/ai-provider'
import path from 'path'

// Path for settings file
const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json')

// Define settings types
interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface Settings {
  jira: JiraCredentials | null;
  ai: AICredentials | null;
  openai?: OpenAICredentials | null; // For backward compatibility
  [key: string]: JiraCredentials | AICredentials | OpenAICredentials | null | undefined; // Index signature for dynamic access
}

// Ensure the data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load settings from file
async function loadSettings(): Promise<Settings> {
  try {
    await ensureDataDirectory()
    const fileExists = await fs.access(settingsFilePath)
      .then(() => true)
      .catch(() => false)
    
    if (!fileExists) {
      // Create default settings file if it doesn't exist
      const defaultSettings: Settings = {
        jira: null,
        ai: null,
        openai: null
      }
      await fs.writeFile(settingsFilePath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
    
    const data = await fs.readFile(settingsFilePath, 'utf8')
    return JSON.parse(data) as Settings
  } catch (error) {
    console.error('Error loading settings:', error)
    return { jira: null, ai: null, openai: null }
  }
}

// Save settings to file
async function saveSettings(settings: Settings) {
  try {
    await ensureDataDirectory()
    await fs.writeFile(settingsFilePath, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Error saving settings:', error)
    return false
  }
}

// GET endpoint to load settings
export async function GET() {
  try {
    const settings = await loadSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// POST endpoint to save settings
export async function POST(request: NextRequest) {
  try {
    const { type, credentials } = await request.json()
    
    if (!type || !credentials) {
      return NextResponse.json(
        { error: 'Type and credentials are required' },
        { status: 400 }
      )
    }
    
    // Only allow specific setting types
    if (type !== 'jira' && type !== 'openai' && type !== 'ai') {
      return NextResponse.json(
        { error: 'Invalid setting type' },
        { status: 400 }
      )
    }
    
    // Load current settings
    const settings = await loadSettings()
    
    // Update the specified setting
    settings[type] = credentials
    
    // Save updated settings
    const success = await saveSettings(settings)
    
    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
