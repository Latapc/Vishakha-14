import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Clock, Monitor, MapPin, ExternalLink, Edit2, Check, XCircle, LogIn, ShieldCheck } from 'lucide-react';

interface PresenceData {
  uid: string;
  name?: string;
  ip?: string;
  lastActive: Timestamp;
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
}

const VisitorRow = ({ visitor, currentSessionId, isOnline, isAdmin }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(visitor.name || '');

  const handleSave = async () => {
    try {
      const presenceRef = doc(db, 'presence', visitor.uid);
      await updateDoc(presenceRef, {
        name: tempName.trim() || 'Anonymous Guest'
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Permission denied. Ensure you are recognized as an admin.");
    }
  };

  const handleDelete = async () => {
    // If not admin, we only allow deletion if location is missing (enforced by rules too)
    const isInvalid = !visitor.location;
    
    if (!isAdmin && !isInvalid) {
      alert("Only verified admins can delete sessions with valid locations.");
      return;
    }

    if (!window.confirm(`Permanently delete session ${visitor.uid}?`)) return;
    
    const path = `presence/${visitor.uid}`;
    try {
      await deleteDoc(doc(db, 'presence', visitor.uid));
    } catch (error) {
      console.error("Delete failed:", error);
      
      const errInfo = {
        error: error instanceof Error ? error.message : String(error),
        operationType: 'delete',
        path: path,
        auth: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
        }
      };
      
      console.error('Firestore Error Status:', JSON.stringify(errInfo, null, 2));
      alert(`Permission Denied: Unauthorized action.`);
    }
  };

  return (
    <div key={visitor.uid} className={`flex items-center justify-between p-4 bg-white/5 rounded-2xl border ${visitor.uid === currentSessionId ? 'border-birthday-accent bg-birthday-accent/5' : 'border-white/5'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isOnline(visitor.lastActive) ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
        <div>
          <div className="flex flex-col">
            {isEditing ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="bg-slate-800 border border-birthday-accent/30 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-birthday-accent w-40"
                  placeholder="Set name..."
                />
                <button onClick={handleSave} className="p-1 text-green-400 hover:bg-green-400/10 rounded-lg">
                  <Check size={16} />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1 text-red-400 hover:bg-red-400/10 rounded-lg">
                  <XCircle size={16} />
                </button>
              </div>
            ) : (
              <div 
                className="text-white font-bold text-sm flex items-center gap-2 cursor-pointer group"
                onClick={() => setIsEditing(true)}
              >
                {visitor.name || 'Anonymous Guest'}
                <Edit2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-mono text-[10px] text-slate-500">ID: {visitor.uid}</div>
              {visitor.ip && (
                <div className="font-mono text-[10px] text-birthday-accent/60 bg-birthday-accent/5 px-1.5 py-0.5 rounded border border-birthday-accent/10">
                  IP: {visitor.ip}
                </div>
              )}
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
              className="text-[10px] text-birthday-accent flex items-center gap-1 mt-1 hover:underline group inline-flex"
            >
              <MapPin size={10} />
              {visitor.location.lat.toFixed(4)}, {visitor.location.lng.toFixed(4)}
              <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ) : (
            <div className="text-[10px] text-red-400/50 uppercase tracking-widest mt-1 flex items-center gap-1 font-black">
              <ShieldCheck size={10} />
              Pending Verification / At Gate
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="text-right text-xs text-slate-500 font-serif">
          {visitor.lastActive?.toDate ? visitor.lastActive.toDate().toLocaleTimeString() : '...ing'}
        </div>
        {(isAdmin || !visitor.location) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              console.log('Delete clicked for:', visitor.uid);
              handleDelete();
            }}
            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/20 rounded-xl transition-all cursor-pointer relative z-10 mr-1"
            title="Delete Session"
          >
            <XCircle size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const SecretAdminModal = ({ onClose, currentSessionId }: { onClose: () => void, currentSessionId: string | null | undefined }) => {
  const [visitors, setVisitors] = useState<PresenceData[]>([]);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const isAdminUser = user?.email === 'neelamtiwari81976@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const cleanupInvalidSessions = async () => {
    const invalidSessions = visitors.filter(v => !v.location);
    if (invalidSessions.length === 0) {
      alert("No invalid sessions (missing location) found.");
      return;
    }

    if (!window.confirm(`Found ${invalidSessions.length} sessions without location. Permanently delete all of them?`)) return;

    let successCount = 0;
    for (const session of invalidSessions) {
      try {
        await deleteDoc(doc(db, 'presence', session.uid));
        successCount++;
      } catch (error) {
        console.error(`Failed to delete session ${session.uid}:`, error);
      }
    }
    alert(`Cleanup complete. Deleted ${successCount} sessions.`);
  };

  useEffect(() => {
    const q = query(collection(db, 'presence'), orderBy('lastActive', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        ...d.data(),
        uid: d.id
      } as PresenceData));
      setVisitors(docs);
    });
    return () => unsubscribe();
  }, []);

  const isOnline = (timestamp: Timestamp) => {
    if (!timestamp?.toMillis) return true; // Assume online if just created
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
            <div className="flex items-center flex-wrap gap-4 mt-2">
              <p className="text-slate-500 font-serif italic text-sm">Real-time attendance</p>
              
              <button 
                onClick={cleanupInvalidSessions}
                className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest border border-red-500/20 px-3 py-1 rounded-full hover:bg-red-500/10 transition-all"
              >
                Cleanup Invalid
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${isAdminUser ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    <ShieldCheck size={12} />
                    {isAdminUser ? `VERIFIED ADMIN: ${user.email}` : `UNAUTHORIZED: ${user.email}`}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] text-slate-500 hover:text-white underline transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-birthday-accent/10 text-birthday-accent px-3 py-1 rounded-full text-[10px] font-bold border border-birthday-accent/20 hover:bg-birthday-accent/20 transition-all"
                >
                  <LogIn size={12} />
                  ADMIN LOGIN
                </button>
              )}
            </div>
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

          <div className="space-y-8">
            {Object.entries(
              visitors.reduce((acc, visitor) => {
                const ip = visitor.ip || 'unknown';
                if (!acc[ip]) acc[ip] = [];
                acc[ip].push(visitor);
                return acc;
              }, {} as Record<string, PresenceData[]>)
            ).map(([ip, sessionsGroup]) => {
              const sessions = sessionsGroup as PresenceData[];
              return (
              <div key={ip} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                    <Monitor size={10} className="text-birthday-accent" />
                    Network ID: {ip}
                    <span className="text-birthday-accent/50 ml-1">({sessions.length} {sessions.length === 1 ? 'session' : 'sessions'})</span>
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                
                <div className="space-y-3">
                  {sessions.map((visitor) => (
                    <VisitorRow 
                      key={visitor.uid} 
                      visitor={visitor} 
                      currentSessionId={currentSessionId} 
                      isOnline={isOnline}
                      isAdmin={isAdminUser}
                    />
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
