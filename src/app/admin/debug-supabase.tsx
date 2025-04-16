'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isDevelopment, isMockAuthEnabled, hasValidSupabaseCredentials } from '@/lib/devUtils';

export default function DebugSupabase() {
  const [dbResponse, setDbResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testSupabase() {
      try {
        setLoading(true);
        // Try to fetch something simple from the database
        const { data, error } = await supabase.from('users').select('count()', { count: 'exact' });
        
        if (error) throw error;
        
        setDbResponse({
          success: true,
          data
        });
      } catch (err: any) {
        console.error('Supabase test error:', err);
        setError(err.message || 'An error occurred testing Supabase connection');
        setDbResponse({
          success: false,
          error: err
        });
      } finally {
        setLoading(false);
      }
    }

    testSupabase();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Supabase Connection Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Environment Status</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-600">Development Mode:</div>
            <div className={isDevelopment ? "text-green-600 font-medium" : "text-blue-600 font-medium"}>
              {isDevelopment ? "Active" : "Inactive (Production)"}
            </div>
            
            <div className="text-gray-600">Mock Auth Enabled:</div>
            <div className={isMockAuthEnabled ? "text-yellow-600 font-medium" : "text-green-600 font-medium"}>
              {isMockAuthEnabled ? "Yes (Using Mock Supabase)" : "No (Using Real Supabase)"}
            </div>
            
            <div className="text-gray-600">Valid Supabase Credentials:</div>
            <div className={hasValidSupabaseCredentials() ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {hasValidSupabaseCredentials() ? "Yes" : "No"}
            </div>
            
            <div className="text-gray-600">Using Mock Client:</div>
            <div className={(isDevelopment && (isMockAuthEnabled || !hasValidSupabaseCredentials())) 
                ? "text-yellow-600 font-medium" 
                : "text-green-600 font-medium"}>
              {(isDevelopment && (isMockAuthEnabled || !hasValidSupabaseCredentials())) 
                ? "Yes" 
                : "No"}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Supabase Environment Variables</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-600">NEXT_PUBLIC_SUPABASE_URL:</div>
            <div className="font-mono break-all">
              {process.env.NEXT_PUBLIC_SUPABASE_URL 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8)}...` 
                : "Not set"}
            </div>
            
            <div className="text-gray-600">NEXT_PUBLIC_SUPABASE_ANON_KEY:</div>
            <div className="font-mono">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                ? "Set (starts with: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + "...)" 
                : "Not set"}
            </div>
            
            <div className="text-gray-600">NEXT_PUBLIC_USE_MOCK_AUTH:</div>
            <div className="font-mono">
              {process.env.NEXT_PUBLIC_USE_MOCK_AUTH || "Not set"}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Database Connection Test</h2>
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Testing connection...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 p-3 rounded-md">
              <div className="font-medium">Connection failed:</div>
              <div className="text-sm mt-1">{error}</div>
              <div className="mt-2 text-sm text-gray-600">
                This indicates either an issue with your Supabase credentials or that you're in mock mode.
              </div>
            </div>
          ) : (
            <div className="text-green-600 bg-green-50 p-3 rounded-md">
              <div className="font-medium">Connection successful:</div>
              <pre className="text-xs mt-2 bg-white p-2 rounded border overflow-auto">
                {JSON.stringify(dbResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 