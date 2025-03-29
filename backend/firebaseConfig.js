const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Track connection status
let firebaseConnected = false;
let connectionError = null;

/**
 * Initialize Firebase Admin SDK and establish connection to Realtime Database
 */
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log("Firebase already initialized, skipping initialization");
      return true;
    }

    // Validate environment variables
    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    if (!databaseURL) {
      throw new Error("FIREBASE_DATABASE_URL environment variable is missing");
    }
    
    console.log("Using database URL:", databaseURL);

    // Initialize Firebase Admin SDK
    let initialized = false;
    
    // Look for service account file first
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = require(serviceAccountPath);
        console.log("Initializing Firebase with service account file for project:", serviceAccount.project_id);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: databaseURL
        });
        
        initialized = true;
        console.log("Firebase initialized with service account file");
      } catch (error) {
        console.error("Error initializing with service account file:", error.message);
        console.log("Will try alternative initialization methods...");
      }
    }
    
    // If using service account from environment variable
    if (!initialized && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        // Parse service account - handle both JSON string or already parsed object
        let serviceAccount;
        if (typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string') {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else {
          serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
        }
        
        console.log("Initializing Firebase with service account from env for project:", 
          serviceAccount.project_id);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: databaseURL
        });
        
        initialized = true;
        console.log("Firebase initialized with service account from environment variable");
      } catch (error) {
        console.error("Error initializing with service account from env:", error.message);
        if (error.message.includes('SyntaxError')) {
          console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Check format in .env file.");
        }
        console.log("Will try alternative initialization methods...");
      }
    } 
    
    // For environments like Vercel that use application default credentials
    if (!initialized) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL: databaseURL
        });
        initialized = true;
        console.log("Firebase initialized with application default credentials");
      } catch (error) {
        console.error("Error initializing with application default credentials:", error.message);
        throw error;
      }
    }

    // Test the database connection
    const db = admin.database();
    console.log("Database instance created, testing connection...");
    
    // Add timeout for connection test
    const connectionTimeout = setTimeout(() => {
      if (!firebaseConnected) {
        connectionError = "Connection timeout after 10 seconds";
        console.error("Firebase connection timeout. Check your network and database URL.");
      }
    }, 10000);

    db.ref('.info/connected').on('value', (snapshot) => {
      clearTimeout(connectionTimeout); // Clear timeout when we get a response
      
      firebaseConnected = snapshot.val() === true;
      
      if (firebaseConnected) {
        connectionError = null;
        console.log("Firebase Realtime Database connected successfully ✅");
      } else {
        connectionError = "Connected event received but connection status is false";
        console.log("Firebase Realtime Database disconnected ❌");
      }
    }, (error) => {
      clearTimeout(connectionTimeout);
      connectionError = error.message;
      console.error("Firebase connection error:", error.message);
    });

    // Ping the database to test rules
    setTimeout(() => pingDatabase(), 2000);

    return true;
  } catch (error) {
    connectionError = error.message;
    console.error("Firebase initialization error:", error);
    return false;
  }
}

/**
 * Test database access by writing to a test location
 */
async function pingDatabase() {
  try {
    const db = getDatabase();
    await db.ref('connectionTest').set({
      timestamp: Date.now(),
      message: 'Connection test'
    });
    console.log("Database write access confirmed ✅");
  } catch (error) {
    console.error("Database write access failed. Check your database rules:", error.message);
    connectionError = "Database access denied. Check rules: " + error.message;
  }
}

/**
 * Get detailed connection status information
 * @returns {Object} Connection status information
 */
function getConnectionStatus() {
  return {
    connected: firebaseConnected,
    error: connectionError,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get the current database connection status
 * @returns {boolean} Connection status
 */
function isConnected() {
  return firebaseConnected;
}

/**
 * Get the Firebase database instance
 * @returns {FirebaseDatabase} Database instance
 */
function getDatabase() {
  if (!admin.apps.length) {
    throw new Error("Firebase not initialized. Call initializeFirebase() first.");
  }
  return admin.database();
}

/**
 * Write data to a specific path in the database
 * @param {string} path - The database path
 * @param {any} data - The data to write
 * @returns {Promise} Promise that resolves when data is written
 */
async function writeData(path, data) {
  try {
    if (!isConnected()) {
      return { 
        success: false, 
        error: "Firebase not connected. Check your configuration." 
      };
    }
    
    const db = getDatabase();
    await db.ref(path).set(data);
    return { success: true };
  } catch (error) {
    console.error(`Error writing to ${path}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Read data from a specific path in the database
 * @param {string} path - The database path
 * @returns {Promise<any>} Promise that resolves with the data
 */
async function readData(path) {
  try {
    if (!isConnected()) {
      return { 
        success: false, 
        error: "Firebase not connected. Check your configuration." 
      };
    }
    
    const db = getDatabase();
    const snapshot = await db.ref(path).once('value');
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error(`Error reading from ${path}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeFirebase,
  isConnected,
  getDatabase,
  writeData,
  readData,
  getConnectionStatus
};
