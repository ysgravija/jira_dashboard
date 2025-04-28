#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create settings.json from environment variables
const settings = {
  jira: {
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  }
};

// Write the settings file
fs.writeFileSync(
  path.join(dataDir, 'settings.json'),
  JSON.stringify(settings, null, 2)
);

console.log('Settings file generated successfully.'); 