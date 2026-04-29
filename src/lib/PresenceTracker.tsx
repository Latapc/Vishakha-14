import { useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const PresenceTracker = ({ forcedLocation, userName }: { forcedLocation?: GeolocationPosition | null, userName?: string | null }) => {
  useEffect(() => {
    const sessionId = localStorage.getItem('presence_session_id') || Math.random().toString(36).substring(2);
    localStorage.setItem('presence_session_id', sessionId);

    const updatePresence = async (position?: GeolocationPosition | null) => {
      try {
        const presenceData: any = {
          uid: sessionId,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userAgent: navigator.userAgent,
        };

        if (userName) {
          presenceData.name = userName;
        }

        if (position) {
          presenceData.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        }

        await setDoc(doc(db, 'presence', sessionId), presenceData, { merge: true });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    // Initial update on mount (Anonymous session)
    updatePresence(forcedLocation);

    const interval = setInterval(() => {
      // Periodic update to keep online status fresh
      if (forcedLocation) {
        updatePresence(forcedLocation);
      } else if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => updatePresence(position),
          () => updatePresence() // Still update even if denied, to keep lastActive fresh
        );
      } else {
        updatePresence();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [forcedLocation]);

  return null;
};
