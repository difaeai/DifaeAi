import * as admin from 'firebase-admin';

// This function initializes the Firebase Admin SDK.
// It uses a service account key from an environment variable.
export async function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  // Check if the service account key is available in environment variables.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      'Firebase service account key is not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
  }

  try {
    // Firebase expects the service account to be an object, not a JSON string.
    // We parse it here to ensure it's in the correct format.
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (error) {
    console.error('Error parsing or initializing Firebase Admin SDK:', error);
    // Provide a more informative error message.
    throw new Error('Failed to initialize Firebase Admin. Make sure the FIREBASE_SERVICE_ACCOUNT_KEY environment variable is a valid, unescaped JSON object.');
  }
}
