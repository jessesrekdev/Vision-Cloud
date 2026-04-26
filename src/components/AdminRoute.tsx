import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ShieldAlert, Activity, Users, Database, Globe, Server, TrendingUp, ShieldCheck } from 'lucide-react';
import { collection, query, limit, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const UnauthorizedAdmin = ({ userProfile, firebaseUser }: any) => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <Lock className="w-[120vh] h-[120vh]" />
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 md:p-12 max-w-lg w-full shadow-2xl relative z-10 border border-zinc-100 dark:border-zinc-800 text-center"
      >
        <div className="w-32 h-32 mx-auto mb-8 relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-dashed border-red-500/30"
          />
          <img 
            src={userProfile?.photoURL || firebaseUser?.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${userProfile?.firstName}`} 
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-xl relative z-10"
          />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-500 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center z-20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">Restricted Area</h1>
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em] mb-6">Unauthorized Clearance</p>
        
        <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-6 mb-8 text-left">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
            "This is what you can legally see. You do not have the required clearance to view Vision Cloud operations data."
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back!
          </button>
          
          <button 
            onClick={() => {
              const msg = encodeURIComponent("Hey There i would like to become a publisher of Vision Cloud Store too .");
              window.open(`https://wa.me/256789109035?text=${msg}`, '_blank');
            }}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20"
          >
            Want to become A publisher? Yes
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, apps: 0, downloads: 0, activities: [] as any[]});

  useEffect(() => {
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const appsSnap = await getDocs(collection(db, 'apps'));
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(10)));
      
      const totalDownloads = appsSnap.docs.reduce((acc, doc) => acc + (doc.data().downloads || 0), 0);

      setStats({
        users: usersSnap.size,
        apps: appsSnap.size,
        downloads: totalDownloads,
        activities: activitiesSnap.docs.map(d => d.data())
      });
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Dynamic Background with Scales/Physics vibe */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200vw] h-[200vw] border-[1px] border-emerald-500 rounded-full border-dashed"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: [180, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[180vw] h-[180vw] border-[1px] border-blue-500 rounded-full border-dashed"
        />
      </div>

      <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              <h1 className="text-4xl font-black tracking-tight">Vision Cloud Nexus</h1>
            </div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em]">Master Operations Deck</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-zinc-900 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors border border-zinc-800"
          >
            <Globe className="w-5 h-5" />
            Enter Store
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
             { label: 'Active Users', value: stats.users, icon: <Users className="w-8 h-8 text-blue-400" />, color: 'from-blue-500/20 to-transparent' },
             { label: 'Apps Indexed', value: stats.apps, icon: <Database className="w-8 h-8 text-purple-400" />, color: 'from-purple-500/20 to-transparent' },
             { label: 'Total Visits / DLs', value: stats.downloads, icon: <Activity className="w-8 h-8 text-rose-400" />, color: 'from-rose-500/20 to-transparent' },
             { label: 'Server Status', value: 'Optimal', icon: <Server className="w-8 h-8 text-emerald-400" />, color: 'from-emerald-500/20 to-transparent' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} bg-zinc-900/50 rounded-[32px] p-8 border border-zinc-800/50 backdrop-blur-xl shrink-0`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-black/50 rounded-2xl backdrop-blur-md">
                  {stat.icon}
                </div>
                <Activity className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="text-5xl font-black tracking-tighter mb-2">{stat.value}</h3>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-[32px] p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-6 h-6 text-zinc-400" />
              <h2 className="text-xl font-bold">Recent System Actions</h2>
            </div>
            <div className="space-y-4">
              {stats.activities.length === 0 ? (
                 <p className="text-zinc-500 italic p-4 text-center">No recent physical events detected.</p>
              ) : (
                stats.activities.map((act, i) => (
                  <div key={i} className="bg-black/40 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{act.message}</p>
                      <p className="text-xs text-zinc-500 mt-1">{new Date(act.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-[32px] p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl flex flex-col justify-center items-center relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none">
               <motion.div 
                  animate={{ y: [0, 20, 0] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center opacity-10"
               >
                 <ShieldCheck className="w-[120%] h-[120%]" />
               </motion.div>
            </div>
            <h2 className="text-xl font-bold mb-4 relative z-10 flex items-center gap-3"><Activity className="w-6 h-6 text-blue-400" /> Physics / Scales Matrix</h2>
            <div className="w-64 h-64 border-4 border-dashed border-zinc-700 rounded-full relative z-10 flex flex-col items-center justify-center overflow-hidden">
               <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-full blur-xl opacity-50 absolute"
               />
               <motion.div 
                  animate={{ scaleY: [1, 0.5, 1], scaleX: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-16 h-16 bg-white rounded-2xl z-20 shadow-2xl"
               />
            </div>
            <p className="mt-8 text-center text-zinc-400 font-medium relative z-10 max-w-sm">
              Core systems synchronized. All dimensional matrices are stable.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
