export {}; // noop module to register global handler

if (typeof window !== 'undefined') {
  const handler = (event: PromiseRejectionEvent) => {
    const r: any = event?.reason;
    const isAbort = r?.name === 'AbortError' || r?.message === 'Aborted' || r?.canceled;
    if (isAbort) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  window.addEventListener('unhandledrejection', handler);
} 