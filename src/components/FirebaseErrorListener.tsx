
"use client";

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This component listens for permission errors and throws them to be caught by the Next.js overlay
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
        // Throw the error so Next.js can catch it and display it in the development overlay.
        // This is only for development and should not be used in production.
        throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}
