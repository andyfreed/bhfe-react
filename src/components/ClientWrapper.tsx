'use client';

import { ReactNode, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/lib/errorHandler';

interface ClientWrapperProps {
  children: ReactNode;
}

/**
 * Client wrapper component that provides error boundary and global error handling
 */
export default function ClientWrapper({ children }: ClientWrapperProps) {
  // Set up global error handlers
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
} 