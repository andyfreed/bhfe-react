'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { hasValidSupabaseCredentials, isDevelopment } from '@/lib/devUtils';

export default function AuthDiagnosticPage() {
  const [status, setStatus] = useState<'loading' | 'complete'>('loading');
  const [diagnostics, setDiagnostics] = useState<{
    env: Record<string, any>;
    localStorage: string[];
    sessionState: any;
    cookies: string[];
    supabase: any;
  }>({
    env: {},
    localStorage: [],
    sessionState: null,
    cookies: [],
    supabase: null
  });

  useEffect(() => {
    async function runDiagnostics() {
      try {
        // Check environment variables
        const env = {
          isDevelopment,
          mockAuth: process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true',
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 12) + '...',
          validCredentials: hasValidSupabaseCredentials()
        };

        // Check localStorage
        const localStorage: string[] = [];
        if (typeof window !== 'undefined') {
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key) {
              if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
                localStorage.push(`${key}: ${window.localStorage.getItem(key)?.substring(0, 20)}...`);
              }
            }
          }
        }

        // Check cookies
        const cookies = document.cookie.split(';')
          .map(cookie => cookie.trim())
          .filter(cookie => 
            cookie.includes('supabase') || 
            cookie.includes('auth') || 
            cookie.includes('session')
          );

        // Get session state
        let sessionState = null;
        let supabaseState = null;

        try {
          const { data, error } = await supabase.auth.getSession();
          sessionState = {
            hasSession: !!data?.session,
            error: error ? error.message : null,
            userId: data?.session?.user?.id || null,
            userEmail: data?.session?.user?.email || null,
            expires: data?.session?.expires_at 
              ? new Date(data.session.expires_at * 1000).toLocaleString() 
              : null
          };
          
          // Test Supabase connection
          const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
            
          supabaseState = {
            connectionWorks: !testError,
            error: testError ? testError.message : null,
            data: testData ? 'Data received successfully' : 'No data'
          };
        } catch (error) {
          console.error('Error accessing Supabase:', error);
          sessionState = { error: `Failed to access Supabase: ${error}` };
          supabaseState = { error: `Failed to connect to Supabase: ${error}` };
        }

        setDiagnostics({
          env,
          localStorage,
          sessionState,
          cookies,
          supabase: supabaseState
        });
        
        setStatus('complete');
      } catch (error) {
        console.error('Diagnostic error:', error);
        setStatus('complete');
      }
    }

    runDiagnostics();
  }, []);

  const handleClearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      // Clear Supabase-specific items
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase.auth.') || 
        key.includes('token') || 
        key.includes('session')
      );
      
      authKeys.forEach(key => {
        console.log(`Removing: ${key}`);
        localStorage.removeItem(key);
      });
      
      alert('Auth-related localStorage items cleared. The page will now reload.');
      window.location.reload();
    }
  };

  const handleClearCookies = () => {
    document.cookie.split(';').forEach(c => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    
    alert('All cookies cleared. The page will now reload.');
    window.location.reload();
  };

  const handleForceLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      alert('Forced logout completed. The page will now reload.');
      window.location.href = '/login';
    } catch (error) {
      console.error('Forced logout error:', error);
      alert(`Error during forced logout: ${error}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Authentication Diagnostics</h1>
        </div>
        
        <div className="p-6">
          {status === 'loading' ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Environment Variables */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Environment Configuration</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="flex justify-between">
                        <span className="font-medium">Development Mode:</span> 
                        <span className={diagnostics.env.isDevelopment ? 'text-green-600' : 'text-blue-600'}>
                          {diagnostics.env.isDevelopment ? 'Yes' : 'No (Production)'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium">Mock Auth Enabled:</span> 
                        <span className={diagnostics.env.mockAuth ? 'text-amber-600' : 'text-green-600'}>
                          {diagnostics.env.mockAuth ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="flex justify-between">
                        <span className="font-medium">Supabase URL:</span> 
                        <span className={diagnostics.env.hasSupabaseUrl ? 'text-green-600' : 'text-red-600'}>
                          {diagnostics.env.hasSupabaseUrl ? diagnostics.env.supabaseUrl : 'Missing'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium">Supabase Key:</span> 
                        <span className={diagnostics.env.hasSupabaseKey ? 'text-green-600' : 'text-red-600'}>
                          {diagnostics.env.hasSupabaseKey ? 'Present' : 'Missing'}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="font-medium">Valid Credentials:</span> 
                        <span className={diagnostics.env.validCredentials ? 'text-green-600' : 'text-red-600'}>
                          {diagnostics.env.validCredentials ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Session State */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Session State</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {diagnostics.sessionState?.error ? (
                    <div className="text-red-600">
                      <p><span className="font-medium">Error:</span> {diagnostics.sessionState.error}</p>
                    </div>
                  ) : diagnostics.sessionState?.hasSession ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="flex justify-between">
                          <span className="font-medium">Active Session:</span> 
                          <span className="text-green-600">Yes</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium">User ID:</span> 
                          <span className="text-gray-600 text-sm">{diagnostics.sessionState.userId}</span>
                        </p>
                      </div>
                      <div>
                        <p className="flex justify-between">
                          <span className="font-medium">User Email:</span> 
                          <span className="text-gray-600">{diagnostics.sessionState.userEmail}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="font-medium">Expires:</span> 
                          <span className="text-gray-600">{diagnostics.sessionState.expires}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-600">No active session found</p>
                  )}
                </div>
              </div>
              
              {/* Supabase Connection */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Supabase Connection</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {diagnostics.supabase?.error ? (
                    <p className="text-red-600">
                      <span className="font-medium">Error:</span> {diagnostics.supabase.error}
                    </p>
                  ) : (
                    <p className={diagnostics.supabase?.connectionWorks ? 'text-green-600' : 'text-red-600'}>
                      <span className="font-medium">Connection:</span> {diagnostics.supabase?.connectionWorks ? 'Working' : 'Failed'}
                    </p>
                  )}
                </div>
              </div>
              
              {/* LocalStorage */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">LocalStorage Items</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {diagnostics.localStorage.length === 0 ? (
                    <p className="text-gray-600">No auth-related items found in localStorage</p>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {diagnostics.localStorage.map((item, index) => (
                        <li key={index} className="font-mono">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Cookies */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Auth Cookies</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {diagnostics.cookies.length === 0 ? (
                    <p className="text-gray-600">No auth-related cookies found</p>
                  ) : (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {diagnostics.cookies.map((cookie, index) => (
                        <li key={index} className="font-mono">{cookie}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6 flex flex-wrap gap-4">
                <button
                  onClick={handleClearLocalStorage}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  Clear Auth LocalStorage
                </button>
                
                <button
                  onClick={handleClearCookies}
                  className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                >
                  Clear All Cookies
                </button>
                
                <button
                  onClick={handleForceLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Force Global Logout
                </button>
                
                <Link
                  href="/reset-auth"
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                >
                  Reset Auth State
                </Link>
                
                <Link
                  href="/login"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
              
              {/* Help Guide */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Troubleshooting Guide</h2>
                
                <div className="bg-blue-50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium text-blue-800">If you can't log out or switch accounts:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Click "Force Global Logout" to clear all sessions</li>
                    <li>Click "Clear Auth LocalStorage" to remove stored tokens</li>
                    <li>If problems persist, try "Reset Auth State" for a complete reset</li>
                    <li>Visit the login page and try again with your admin credentials</li>
                  </ol>
                  
                  <p className="font-medium text-blue-800 mt-4">For development without real credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>Set <code className="bg-gray-100 px-1">NEXT_PUBLIC_USE_MOCK_AUTH=true</code> in .env.local</li>
                    <li>Use test@example.com / password123 as mock credentials</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 