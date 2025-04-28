/**
 * Global error handler utility
 * 
 * This file contains utilities for handling errors globally in the application.
 */

/**
 * Set up global error handlers for uncaught exceptions and unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const isAborted = 
        reason?.name === 'AbortError' || 
        reason?.message?.includes('aborted') || 
        reason?.canceled;

      // Don't report aborted requests
      if (isAborted) {
        event.preventDefault();
        return;
      }

      // Convert the reason to a more useful string
      let errorMessage = 'Unknown error';
      
      if (reason instanceof Error) {
        errorMessage = `${reason.name}: ${reason.message}`;
        // Include stack trace if available
        if (reason.stack) {
          console.error('Unhandled rejection stack:', reason.stack);
        }
      } else if (typeof reason === 'object' && reason !== null) {
        // For objects, stringify them properly
        try {
          errorMessage = `Object Error: ${JSON.stringify(reason)}`;
        } catch (e) {
          errorMessage = `Object Error: [Cannot stringify error object]`;
        }
      } else if (reason !== undefined && reason !== null) {
        // For primitive values
        errorMessage = String(reason);
      }

      console.error(`Global error handler caught unhandled promise rejection: ${errorMessage}`);
      
      // Prevent the default error handling to use our custom handling
      event.preventDefault();
    });

    // Handler for uncaught exceptions
    window.addEventListener('error', (event) => {
      // Don't interfere with loading errors
      if (event.target && (
        event.target instanceof HTMLScriptElement || 
        event.target instanceof HTMLLinkElement || 
        event.target instanceof HTMLImageElement
      )) {
        return;
      }

      console.error('Global error handler caught uncaught exception:', 
        event.error instanceof Error ? event.error.message : String(event.error || event.message));

      // Don't prevent default for regular errors, just log them
    });
  }
}

/**
 * Safe stringification of any value
 */
export function safeStringify(obj: any): string {
  if (obj instanceof Error) {
    return obj.message;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return '[Object cannot be stringified]';
    }
  }
  
  return String(obj);
} 