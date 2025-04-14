/**
 * Development Utilities
 * 
 * This file contains utility functions for development purposes.
 * These functions make it easier to work on the project across different computers.
 */

/**
 * Check if the app is running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if mock authentication is enabled
 * This can be enabled by setting NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local
 * We explicitly check for the string "true" to ensure it's not enabled accidentally
 */
export const isMockAuthEnabled = isDevelopment && 
  process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true';

/**
 * Check if we have valid Supabase credentials
 */
export const hasValidSupabaseCredentials = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return Boolean(
    url && 
    key && 
    url !== 'https://your-project-id.supabase.co' && 
    key !== 'your-anon-key'
  );
};

/**
 * Log the current development environment status
 */
export const logDevEnvironmentStatus = (): void => {
  if (!isDevelopment) return;
  
  console.log('🔧 Development Environment Status:');
  
  if (hasValidSupabaseCredentials()) {
    console.log('✅ Valid Supabase credentials found');
  } else {
    console.log('⚠️ No valid Supabase credentials found');
    console.log('   Using mock authentication: ' + (isMockAuthEnabled ? 'Yes' : 'No'));
    
    if (!isMockAuthEnabled) {
      console.log('   ⚠️ Set NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local to enable mock authentication');
      console.log('   ⚠️ or provide valid Supabase credentials');
    }
  }
};

/**
 * Check for dev setup issues and provide suggestions
 */
export const checkDevSetup = (): { 
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} => {
  const warnings = [];
  const suggestions = [];
  
  if (!isDevelopment) {
    return { isValid: true, warnings: [], suggestions: [] };
  }
  
  // Check Supabase credentials
  if (!hasValidSupabaseCredentials()) {
    warnings.push('No valid Supabase credentials found');
    
    if (!isMockAuthEnabled) {
      warnings.push('Mock authentication is not enabled');
      suggestions.push('Set NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local for development without Supabase');
    }
  }
  
  return {
    isValid: warnings.length === 0 || isMockAuthEnabled,
    warnings,
    suggestions
  };
};

// Automatically log environment status in development
if (isDevelopment) {
  logDevEnvironmentStatus();
} 