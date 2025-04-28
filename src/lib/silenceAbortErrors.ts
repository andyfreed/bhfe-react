/**
 * This file is imported in layout.tsx to silence AbortController errors in the console.
 * 
 * When a component is unmounted and there are pending fetch requests, the browser
 * will show errors in the console related to the aborted requests.
 * These errors are not real problems and just add noise to the console.
 * 
 * We now have a more comprehensive error handling solution in errorHandler.ts,
 * so this file now imports that functionality instead of duplicating it.
 */

// Import the improved error handling from errorHandler.ts
// Note: The actual global handlers are set up in ClientWrapper.tsx
// This module now exists just for backwards compatibility
export {}; 