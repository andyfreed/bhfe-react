#!/usr/bin/env node

/**
 * Development Setup Script
 * 
 * This script helps set up the development environment for the project.
 * It can be run with 'node setup-dev.js' or 'npm run setup-dev'
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const envExamplePath = path.join(process.cwd(), '.env.example');
const envLocalPath = path.join(process.cwd(), '.env.local');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper function to write colored text
const colorize = (text, color) => `${colors[color]}${text}${colors.reset}`;

console.log(colorize('\n🚀 Setting up development environment...\n', 'bright'));

// Check if .env.local already exists
const envLocalExists = fs.existsSync(envLocalPath);

if (envLocalExists) {
  console.log(colorize('ℹ️  .env.local file already exists.', 'yellow'));
  
  rl.question(colorize('   Do you want to overwrite it? (y/N): ', 'cyan'), (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log(colorize('\n✅ Keeping existing .env.local file.', 'green'));
      askMockAuth();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.error(colorize('\n❌ .env.example file not found!', 'red'));
    console.log('Please create a .env.example file first.');
    rl.close();
    return;
  }

  // Read the .env.example file
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  
  // Ask for Supabase credentials or use mock auth
  console.log(colorize('\nChoose your development setup:', 'bright'));
  console.log('1. Use real Supabase credentials');
  console.log('2. Use mock authentication (no real backend needed)');
  
  rl.question(colorize('\nEnter your choice (1/2): ', 'cyan'), (choice) => {
    if (choice === '1') {
      askSupabaseCredentials(envExample);
    } else {
      useMockAuth(envExample);
    }
  });
}

function askSupabaseCredentials(envContent) {
  console.log(colorize('\nEnter your Supabase credentials:', 'bright'));
  
  rl.question(colorize('Supabase URL: ', 'cyan'), (url) => {
    rl.question(colorize('Supabase Anon Key: ', 'cyan'), (key) => {
      // Update the env content with provided credentials
      let newEnvContent = envContent
        .replace(/NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${url}`)
        .replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${key}`)
        .replace(/NEXT_PUBLIC_USE_MOCK_AUTH=.*$/m, 'NEXT_PUBLIC_USE_MOCK_AUTH=false');
      
      // Write to .env.local file
      fs.writeFileSync(envLocalPath, newEnvContent);
      
      console.log(colorize('\n✅ Created .env.local with real Supabase credentials', 'green'));
      rl.close();
    });
  });
}

function useMockAuth(envContent) {
  // Update the env content to use mock auth
  let newEnvContent = envContent
    .replace(/NEXT_PUBLIC_USE_MOCK_AUTH=.*$/m, 'NEXT_PUBLIC_USE_MOCK_AUTH=true');
  
  // Write to .env.local file
  fs.writeFileSync(envLocalPath, newEnvContent);
  
  console.log(colorize('\n✅ Created .env.local with mock authentication enabled', 'green'));
  console.log(colorize('\nYou can use the following test credentials:', 'bright'));
  console.log('Email:    test@example.com');
  console.log('Password: password123');
  rl.close();
}

function askMockAuth() {
  // Read the current .env.local file
  const envLocal = fs.readFileSync(envLocalPath, 'utf8');
  
  // Check if mock auth is already enabled
  const mockAuthEnabled = envLocal.includes('NEXT_PUBLIC_USE_MOCK_AUTH=true');
  
  if (mockAuthEnabled) {
    console.log(colorize('✅ Mock authentication is already enabled.', 'green'));
    rl.close();
    return;
  }
  
  rl.question(colorize('   Do you want to enable mock authentication? (Y/n): ', 'cyan'), (answer) => {
    if (answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no') {
      // Enable mock auth
      let newEnvContent = envLocal;
      
      if (envLocal.includes('NEXT_PUBLIC_USE_MOCK_AUTH=false')) {
        newEnvContent = envLocal.replace(/NEXT_PUBLIC_USE_MOCK_AUTH=.*$/m, 'NEXT_PUBLIC_USE_MOCK_AUTH=true');
      } else {
        newEnvContent += '\n# Development Mode Configuration\nNEXT_PUBLIC_USE_MOCK_AUTH=true\n';
      }
      
      // Write to .env.local file
      fs.writeFileSync(envLocalPath, newEnvContent);
      
      console.log(colorize('\n✅ Mock authentication enabled in .env.local', 'green'));
      console.log(colorize('\nYou can use the following test credentials:', 'bright'));
      console.log('Email:    test@example.com');
      console.log('Password: password123');
    } else {
      console.log(colorize('\n✅ Kept existing authentication settings.', 'green'));
    }
    
    rl.close();
  });
} 