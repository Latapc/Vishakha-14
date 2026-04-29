import { useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const PresenceTracker = ({ onLocation }: { onLocation?: (pos: GeolocationPosition) => void }) => {
  useEffect(() => {
    const sessionId = localStorage.getItem('presence_session_id') || Math.random().toString(36).substring(2);
    localStorage.setItem('presence_session_id', sessionId);

    const updatePresence = async (position?: GeolocationPosition) => {
      try {
        const presenceData: any = {
          uid: sessionId,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp(),
          userAgent: navigator.userAgent,
        };

        if (position) {
          presenceData.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          if (onLocation) onLocation(position);
        }

        // Only update if we have a position, or if we want to allow entry (but here we'll assume the gate handled the first update)
        await setDoc(doc(db, 'presence', sessionId), presenceData, { merge: true });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    const interval = setInterval(() => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => updatePresence(position),
          () => {} // Don't update if they suddenly deny midway
        );
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [onLocation]);

  return null;
};
