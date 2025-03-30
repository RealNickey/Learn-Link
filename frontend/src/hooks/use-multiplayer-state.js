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
    if (!userId) return;
    
    try {
      const doc = new Y.Doc();
      const ymap = doc.getMap('tldraw');
      
      const tldrawStore = createTLStore({
        shapeUtils: defaultShapeUtils,
      });

      const wsUrl = import.meta.env.VITE_WS_SERVER_URL || 'ws://localhost:1234';
      const roomName = `learn-link-canvas-${roomId}`;
      
      console.log(`Connecting to WebSocket at ${wsUrl} for room ${roomName}`);
      
      let wsProvider;
      try {
        wsProvider = new WebsocketProvider(wsUrl, roomName, doc, {
          connect: true,
          maxBackoffTime: 2000,
        });
        
        // Get awareness from provider
        const awarenessInstance = wsProvider.awareness;
        setAwareness(awarenessInstance);
        
        // Set up connection status handling
        wsProvider.on('status', ({ status }) => {
          console.log('WebSocket status:', status);
          setConnectionStatus(status === 'connected' ? 'connected' : 'connecting');
        });
        
        wsProvider.on('connection-error', (error) => {
          console.error('WebSocket connection error:', error);
          setConnectionStatus('failed');
        });
        
        wsProvider.on('connection-close', () => {
          console.log('WebSocket connection closed');
          setConnectionStatus('connecting');
        });
        
      } catch (err) {
        console.error('Failed to create WebSocketProvider:', err);
        setConnectionStatus('failed');
        wsProvider = null;
      }

      // Improve sync frequency for continuous updates
      const syncStoreChanges = (update) => {
        const { source } = update;
        if (source === 'user') {
          try {
            const changes = update.changes;
            if (!changes) return;

            // Handle added/updated records
            const recordsToSync = [];
            
            if (changes.added) {
              Object.values(changes.added).forEach(record => {
                // Handle binary data (like images) specially
                if (record.type === 'image') {
                  // Ensure asset data is properly encoded
                  if (record.props?.src) {
                    ymap.set(`asset:${record.id}`, record);
                  }
                }
                recordsToSync.push(record);
              });
            }

            if (changes.updated) {
              Object.values(changes.updated).forEach(record => {
                recordsToSync.push(record);
              });
            }

            // Batch sync records
            if (recordsToSync.length > 0) {
              recordsToSync.forEach(record => {
                if (record && record.id) {
                  ymap.set(record.id, record);
                }
              });
            }

            // Handle deleted records
            if (changes.removed) {
              Object.values(changes.removed).forEach(record => {
                if (record?.id) {
                  ymap.delete(record.id);
                  // Also clean up any associated assets
                  ymap.delete(`asset:${record.id}`);
                }
              });
            }
          } catch (err) {
            console.error('Error syncing changes:', err);
          }
        }
      };

      // Use requestAnimationFrame for smoother updates
      let rafId;
      const throttledSync = (update) => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          syncStoreChanges(update);
        });
      };

      // Listen to store changes with improved handling
      const unsubscribeStore = tldrawStore.listen(throttledSync);

      // Improve Yjs observer for better real-time sync
      ymap.observe(event => {
        const toRemove = [];
        const toPut = [];

        event.keysChanged.forEach(key => {
          const value = ymap.get(key);
          
          if (value === undefined) {
            toRemove.push(key);
          } else {
            // Handle special cases like assets
            if (key.startsWith('asset:')) {
              // Ensure asset data is properly handled
              if (value.type === 'image') {
                toPut.push(value);
              }
            } else {
              toPut.push(value);
            }
          }
        });

        // Batch updates to the store
        requestAnimationFrame(() => {
          if (toRemove.length) tldrawStore.remove(toRemove);
          if (toPut.length) tldrawStore.put(toPut);
        });
      });

      // Initial state loading with asset handling
      for (const [key, value] of ymap.entries()) {
        if (value) {
          if (key.startsWith('asset:')) {
            // Handle assets specially
            if (value.type === 'image') {
              tldrawStore.put([value]);
            }
          } else {
            tldrawStore.put([value]);
          }
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
      const unsubscribePresence = tldrawStore.listen(({ source }) => {
        if (source !== 'user') return;
        
        try {
          let currentPresence;
          
          if (typeof presenceDerivation.get === 'function') {
            currentPresence = presenceDerivation.get();
          } else if (presenceDerivation.value !== undefined) {
            currentPresence = presenceDerivation.value;
          } else {
            currentPresence = presenceDerivation;
          }
          
          if (currentPresence && wsProvider && wsProvider.awareness) {
            setPresence(currentPresence);
            wsProvider.awareness.setLocalState({ presence: currentPresence });
          }
        } catch (err) {
          console.error('Error handling presence:', err);
        }
      });

      setStore(tldrawStore);
      setYDoc(doc);
      setProvider(wsProvider);

      return () => {
        cancelAnimationFrame(rafId);
        unsubscribeStore();
        unsubscribePresence();
        if (wsProvider) {
          wsProvider.disconnect();
        }
        doc.destroy();
      };
    } catch (error) {
      console.error('Error setting up multiplayer state:', error);
      setConnectionStatus('failed');
      return () => {};
    }
  }, [roomId, userId]);

  return { store, yDoc, provider, awareness, connectionStatus, userId, presence };
}

// Helper to generate a random light color for user cursor
function getRandomLightColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
}
