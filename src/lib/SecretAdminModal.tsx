import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Users, X, Clock, Monitor, MapPin, ExternalLink } from 'lucide-react';

interface PresenceData {
  uid: string;
  name?: string;
  lastActive: Timestamp;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
}

export const SecretAdminModal = ({ onClose, currentSessionId }: { onClose: () => void, currentSessionId?: string | null }) => {
  const [visitors, setVisitors] = useState<PresenceData[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'presence'), orderBy('lastActive', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as PresenceData);
      setVisitors(docs);
    });
    return () => unsubscribe();
  }, []);

  const isOnline = (timestamp: Timestamp) => {
    return (Date.now() - timestamp.toMillis()) < 120000;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 w-full max-w-4xl max-h-[80vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-display font-black text-birthday-accent flex items-center gap-3">
              <Users size={32} />
              Visit Insights
            </h2>
            <p className="text-slate-500 font-serif italic">Real-time attendance for the surprise</p>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass p-6 rounded-3xl border-2 border-green-500/20">
              <div className="text-4xl font-display font-black text-green-400">
                {visitors.filter(v => isOnline(v.lastActive)).length}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Live Visitors</div>
            </div>
            <div className="glass p-6 rounded-3xl border-2 border-birthday-accent/20">
              <div className="text-4xl font-display font-black text-birthday-accent">
                {visitors.length}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Total Sessions</div>
            </div>
          </div>

          <div className="space-y-4">
            {visitors.map((visitor) => (
              <div key={visitor.uid} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border ${visitor.uid === currentSessionId ? 'border-birthday-accent bg-birthday-accent/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isOnline(visitor.lastActive) ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <div className="flex flex-col">
                      <div className="text-white font-bold text-sm">
                        {visitor.name || 'Anonymous Guest'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-[10px] text-slate-500">ID: {visitor.uid}</div>
                        {visitor.uid === currentSessionId && (
                          <span className="bg-birthday-accent text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">You</span>
                        )}
                      </div>
                    </div>
                    {visitor.location ? (
                      <a 
                        href={`https://www.google.com/maps?q=${visitor.location.lat},${visitor.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-birthday-accent flex items-center gap-1 mt-1 hover:underline group"
                      >
                        <MapPin size={10} />
                        {visitor.location.lat.toFixed(4)}, {visitor.location.lng.toFixed(4)}
                        <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <div className="text-[10px] text-slate-600 uppercase tracking-tighter">Location Unknown</div>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-serif">
                  {visitor.lastActive.toDate().toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
