import { useEffect, useState } from 'react';
import { 
  createTLStore, 
  defaultShapeUtils, 
  throttle,
  createPresenceStateDerivation,
  InstancePresenceRecordType
} from '@tldraw/tldraw';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Helper to generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a hook for multiplayer state
export function useMultiplayerState(roomId, userId) {
  const [store, setStore] = useState(null);
  const [yDoc, setYDoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [awareness, setAwareness] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [presence, setPresence] = useState({});

  useEffect(() => {
    // Skip setup if userId is not available yet
    if (!userId) return;
    
    try {
      // Initialize Yjs document and tldraw store
      const doc = new Y.Doc();
      
      // Create a Y.Map to store our data
      const ymap = doc.getMap('tldraw');
      
      // Create a tldraw store
      const tldrawStore = createTLStore({
        shapeUtils: defaultShapeUtils,
      });

      // Setup WebSocket connection to our synchronization server
      const wsUrl = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:1234';
      const roomName = `learn-link-canvas-${roomId}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl} for room ${roomName}`);
      
      let wsProvider;
      try {
        wsProvider = new WebsocketProvider(wsUrl, roomName, doc);
      } catch (err) {
        console.error('Failed to create WebSocketProvider:', err);
        setConnectionStatus('failed');
        wsProvider = null;
      }

      // Only setup awareness if we have a valid provider
      let awareness = null;
      if (wsProvider) {
        // Handle connection status
        wsProvider.on('status', (event) => {
          console.log('WebSocket status:', event.status);
          setConnectionStatus(event.status === 'connected' ? 'connected' : 'connecting');
        });

        // Setup awareness (presence) for the document
        awareness = wsProvider.awareness;
        setAwareness(awareness);
      }

      // Listen for changes in the tldraw store and sync to Yjs
      // Fix for the changes.records structure
      tldrawStore.listen(
        throttle((update) => {
          // Only sync changes that resulted from user actions
          const { source } = update;
          if (source === 'user') {
            // Safe way to extract changed records
            if (update.changes) {
              // Handle different types of changes structure in different versions
              const addedRecords = [];
              const updatedRecords = [];
              const removedIds = [];
              
              // Check if we have the old structure (records)
              if (update.changes.records) {
                const { added, updated, removed } = update.changes.records;
                
                if (added) Object.values(added).forEach(record => addedRecords.push(record));
                if (updated) Object.values(updated).forEach(record => updatedRecords.push(record));
                if (removed) Object.values(removed).forEach(record => removedIds.push(record.id));
              } 
              // Check if we have the new structure (added, updated, removed)
              else if (update.changes.added) {
                // Handle added - could be array or object
                if (Array.isArray(update.changes.added)) {
                  update.changes.added.forEach(record => addedRecords.push(record));
                } else if (typeof update.changes.added === 'object') {
                  Object.values(update.changes.added).forEach(record => addedRecords.push(record));
                }
                
                // Handle updated - could be array or object
                if (Array.isArray(update.changes.updated)) {
                  update.changes.updated.forEach(record => updatedRecords.push(record));
                } else if (update.changes.updated && typeof update.changes.updated === 'object') {
                  Object.values(update.changes.updated).forEach(record => updatedRecords.push(record));
                }
                
                // Handle removed - could be array of ids or object with id property
                if (Array.isArray(update.changes.removed)) {
                  update.changes.removed.forEach(id => removedIds.push(id));
                } else if (update.changes.removed && typeof update.changes.removed === 'object') {
                  Object.values(update.changes.removed).forEach(record => {
                    // Handle both cases: when record is the ID itself or when it has an id property
                    removedIds.push(typeof record === 'object' ? record.id : record);
                  });
                }
              }
              
              // Process removed records
              removedIds.forEach(id => {
                if (id) ymap.delete(id);
              });
              
              // Process added and updated records
              [...addedRecords, ...updatedRecords].forEach(record => {
                if (record && record.id) ymap.set(record.id, record);
              });
            }
          }
        }, 50)
      );

      // Observer Yjs changes and update tldraw store
      ymap.observe(event => {
        // Create arrays to track what to add and remove from the store
        const toRemove = [];
        const toPut = [];

        // Handle each key that changed
        event.keysChanged.forEach(key => {
          const value = ymap.get(key);
          if (value === undefined) {
            // This key was deleted
            toRemove.push(key);
          } else {
            // This key was added or updated
            toPut.push(value);
          }
        });

        // Apply changes to the tldraw store
        if (toRemove.length) {
          tldrawStore.remove(toRemove);
        }
        
        if (toPut.length) {
          tldrawStore.put(toPut);
        }
      });

      // Load initial state
      // Get all existing values from the Y.Map and put them in the tldraw store
      for (const [key, value] of ymap.entries()) {
        if (value) {
          tldrawStore.put([value]);
        }
      }

      // Initialize presence state
      const userPreferences = {
        color: getRandomLightColor(),
        name: userId,
      };

      // Generate a unique presence ID
      const presenceId = `instance:${generateUUID()}`;

      // Setup presence
      const presenceDerivation = createPresenceStateDerivation(tldrawStore, {
        id: presenceId,
        userId: userId,
        color: userPreferences.color,
        name: userPreferences.name,
      });

      // Subscribe to presence changes
      // Fix the presenceDerivation.get is not a function error
      const unsubscribePresence = tldrawStore.listen(({ source }) => {
        if (source !== 'user') return;
        
        try {
          // Handle different versions of the presence API
          let currentPresence;
          
          // Try to use the .get() method first (newer versions)
          if (typeof presenceDerivation.get === 'function') {
            currentPresence = presenceDerivation.get();
          } 
          // Fall back to accessing .value property (older versions)
          else if (presenceDerivation.value !== undefined) {
            currentPresence = presenceDerivation.value;
          }
          // Direct access as a last resort
          else {
            currentPresence = presenceDerivation;
          }
          
          if (currentPresence) {
            setPresence(currentPresence);
            
            // Only update awareness if it exists
            if (awareness) {
              awareness.setLocalStateField('presence', currentPresence);
            }
          }
        } catch (err) {
          console.error('Error handling presence:', err);
        }
      });

      // Update our store state
      setStore(tldrawStore);
      setYDoc(doc);
      setProvider(wsProvider);

      // Cleanup
      return () => {
        unsubscribePresence();
        if (wsProvider) {
          wsProvider.disconnect();
        }
        doc.destroy();
      };
    } catch (error) {
      console.error('Error setting up multiplayer state:', error);
      setConnectionStatus('failed');
      return () => {}; // Return empty cleanup function
    }
  }, [roomId, userId]);

  return { store, yDoc, provider, awareness, connectionStatus, userId, presence };
}

// Helper to generate a random light color for user cursor
function getRandomLightColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
}
