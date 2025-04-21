'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { default as AlertTitle } from '@/components/ui/alert-title'
import { AlertDescription } from '@/components/ui/alert-description'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

type ResultDetail = {
  id: string;
  status: string;
  [key: string]: any;
};

export function SyncRolesButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    data?: any
  }>({})

  const handleSyncRoles = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setResult({})
    
    try {
      const response = await fetch('/api/admin/sync-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync roles')
      }
      
      setResult({
        success: true,
        message: `Successfully synchronized roles. Updated ${data.updated} of ${data.total} users.`,
        data
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <Button 
        onClick={handleSyncRoles} 
        disabled={isLoading}
        variant="default"
        className="min-w-[200px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing Roles...
          </>
        ) : (
          'Sync User Roles'
        )}
      </Button>
      
      {result.success !== undefined && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {result.success ? 'Roles Synchronized' : 'Sync Failed'}
          </AlertTitle>
          <AlertDescription>
            {result.message}
            
            {result.success && result.data && (
              <div className="mt-2 text-sm">
                <p>Total users: {result.data.total}</p>
                <p>Updated: {result.data.updated}</p>
                <p>Errors: {result.data.errors}</p>
                
                {result.data.errors > 0 && (
                  <details className="mt-2">
                    <summary>Error Details</summary>
                    <pre className="mt-2 max-h-[200px] overflow-auto p-2 bg-slate-100 rounded text-xs">
                      {JSON.stringify(result.data.details.filter((d: ResultDetail) => d.status === 'error'), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
} 