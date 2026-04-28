import { useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const PresenceTracker = () => {
  useEffect(() => {
    // Generate a simple session ID if not logged in, or use UID
    const sessionId = localStorage.getItem('presence_session_id') || Math.random().toString(36).substring(2);
    localStorage.setItem('presence_session_id', sessionId);

    let intervalId: NodeJS.Timeout;

    const updatePresence = async (uid: string | null, email: string | null) => {
      const docId = uid || sessionId;
      try {
        await setDoc(doc(db, 'presence', docId), {
          uid: docId,
          lastActive: serverTimestamp(),
          email: email || 'Anonymous',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.error("Error updating presence:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear existing interval to restart with new user info
      if (intervalId) clearInterval(intervalId);

      // Initial update
      updatePresence(user?.uid || null, user?.email || null);

      // Heartbeat every 30 seconds
      intervalId = setInterval(() => {
        updatePresence(user?.uid || null, user?.email || null);
      }, 30000);
    });

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
};
