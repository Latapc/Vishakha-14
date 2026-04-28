import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { Activity, LogIn, LogOut, User, Clock } from 'lucide-react';

interface PresenceData {
  uid: string;
  email: string;
  lastActive: Timestamp;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<PresenceData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'neelamtiwari81976@gmail.com') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'presence'), orderBy('lastActive', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as PresenceData);
      setUsers(docs);
    }, (error) => {
      console.error("Presence snapshot error:", error);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) return <div className="min-h-screen bg-birthday-dark flex items-center justify-center text-white">Loading...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-birthday-dark flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-3xl text-center max-w-md w-full"
        >
          <Activity className="mx-auto mb-6 text-birthday-accent w-16 h-16" />
          <h2 className="text-3xl font-display text-white mb-4">Admin Access</h2>
          <p className="text-slate-400 mb-8 font-serif">Please log in with the authorized email to view real-time presence data.</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-birthday-accent text-white py-4 rounded-xl font-bold hover:brightness-110 transition-all"
          >
            <LogIn size={20} />
            Log in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const isOnline = (timestamp: Timestamp) => {
    const now = Date.now();
    const lastActive = timestamp.toMillis();
    return (now - lastActive) < 120000; // 2 minutes threshold
  };

  return (
    <div className="min-h-screen bg-birthday-dark p-6 md:p-12 text-white overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-birthday-accent mb-2">Live Presence</h1>
            <p className="text-slate-400 font-serif">Monitoring online activity for Vishakha's Birthday Surprise</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-[40px] flex flex-col items-center justify-center border-2 border-green-500/30"
          >
            <div className="text-6xl font-display font-black text-green-400 mb-2">
              {users.filter(u => isOnline(u.lastActive)).length}
            </div>
            <div className="text-lg text-slate-400 uppercase tracking-widest font-bold">Online Now</div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.1 }}
             className="glass p-8 rounded-[40px] flex flex-col items-center justify-center border-2 border-birthday-accent/30"
          >
            <div className="text-6xl font-display font-black text-birthday-accent mb-2">
              {users.length}
            </div>
            <div className="text-lg text-slate-400 uppercase tracking-widest font-bold">Total Sessions Today</div>
          </motion.div>
        </div>

        <div className="mt-12 bg-white/5 rounded-[40px] overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 font-display text-birthday-accent uppercase tracking-widest text-sm">
              <tr>
                <th className="p-6">User / Session</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Last Interaction</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.uid} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 flex items-center gap-3">
                    <div className="p-3 bg-birthday-accent/10 rounded-full text-birthday-accent">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold">{user.email}</div>
                      <div className="text-xs text-slate-500 font-mono">{user.uid}</div>
                    </div>
                  </td>
                  <td className="p-6">
                    {isOnline(user.lastActive) ? (
                      <span className="flex items-center gap-2 text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right font-serif text-slate-400 italic">
                    {user.lastActive.toDate().toLocaleTimeString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-500 font-serif italic text-xl">
                    No activity recorded yet...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
