import { useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const PresenceTracker = ({ forcedLocation, onIdReady }: { forcedLocation?: GeolocationPosition | null, onIdReady?: (id: string) => void }) => {
  useEffect(() => {
    const sessionId = localStorage.getItem('presence_session_id') || Math.random().toString(36).substring(2);
    localStorage.setItem('presence_session_id', sessionId);
    if (onIdReady) onIdReady(sessionId);

    const updatePresence = async (position?: GeolocationPosition | null) => {
      // Strictly only track if location is known
      if (!position) return;

      try {
        let ip = localStorage.getItem('presence_user_ip');
        if (!ip) {
          const providers = [
            'https://api.ipify.org?format=json',
            'https://api.seeip.org/jsonip',
            'https://ipapi.co/json/'
          ];
          for (const url of providers) {
            try {
              const res = await fetch(url);
              const data = await res.json();
              ip = data.ip || data.ip_addr || data.address;
              if (ip) {
                localStorage.setItem('presence_user_ip', ip);
                break;
              }
            } catch (e) {
              console.warn(`Failed to fetch IP from ${url}:`, e);
            }
          }
        }

        const presenceData: any = {
          uid: sessionId,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userAgent: navigator.userAgent,
          ip: ip || 'unknown',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        };

        await setDoc(doc(db, 'presence', sessionId), presenceData, { merge: true });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    // Initial update on mount if location is already granted
    if (forcedLocation) {
      updatePresence(forcedLocation);
    }

    const interval = setInterval(() => {
      // Periodic update: only run if we have a verified location
      if (forcedLocation) {
        updatePresence(forcedLocation);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [forcedLocation]);

  return null;
};
