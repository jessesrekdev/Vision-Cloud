import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, ShieldAlert, Activity, Users, Database, Globe, Server, TrendingUp, ShieldCheck, Download, CheckCircle, Clock } from 'lucide-react';
import { collection, query, limit, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const mockWeeklyData = [
  { name: 'Mon', visits: 4000, downloads: 2400 },
  { name: 'Tue', visits: 3000, downloads: 1398 },
  { name: 'Wed', visits: 2000, downloads: 9800 },
  { name: 'Thu', visits: 2780, downloads: 3908 },
  { name: 'Fri', visits: 1890, downloads: 4800 },
  { name: 'Sat', visits: 2390, downloads: 3800 },
  { name: 'Sun', visits: 3490, downloads: 4300 },
];

const mockDeviceData = [
  { name: 'iOS', value: 400 },
  { name: 'Android', value: 300 },
  { name: 'Web', value: 300 },
  { name: 'Desktop', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f43f5e'];

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
  const [stats, setStats] = useState({ users: 0, apps: 0, downloads: 0, activities: [] as any[], userList: [] as any[]});
  const [weeklyData, setWeeklyData] = useState(mockWeeklyData);
  const [deviceData, setDeviceData] = useState(mockDeviceData);
  const [locationData, setLocationData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const appsSnap = await getDocs(collection(db, 'apps'));
      const activitiesSnap = await getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(20)));
      const analyticsSnap = await getDocs(query(collection(db, 'analytics'), orderBy('timestamp', 'desc'), limit(1000))).catch(() => ({ docs: [] }));
      
      const totalDownloads = appsSnap.docs.reduce((acc, doc) => acc + (doc.data().downloads || 0), 0);

      setStats({
        users: usersSnap.size,
        apps: appsSnap.size,
        downloads: totalDownloads,
        activities: activitiesSnap.docs.map(d => d.data()),
        userList: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      });
      
      if (analyticsSnap.docs && analyticsSnap.docs.length > 0) {
        const last7Days = Array.from({length: 7}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
            dateString: d.toISOString().split('T')[0],
            visits: 0,
            downloads: 0
          };
        });

        const devices: Record<string, number> = { 'iOS': 0, 'Android': 0, 'Web': 0, 'Desktop': 0 };
        const locations: Record<string, number> = {};
        
        let hasHits = false;
        analyticsSnap.docs.forEach((doc: any) => {
          const data = doc.data();
          hasHits = true;
          const dayMatch = last7Days.find(d => d.dateString === data.date);
          if (dayMatch) {
            if (data.type === 'visit') dayMatch.visits += 1;
            if (data.type === 'download') dayMatch.downloads += 1;
          }
          if (data.type === 'visit' && data.device) {
            if (devices[data.device] !== undefined) devices[data.device] += 1;
          }
          if (data.type === 'visit' && data.country && data.country !== 'Unknown') {
            locations[data.country] = (locations[data.country] || 0) + 1;
          }
        });
        
        if (hasHits) {
          setWeeklyData(last7Days);
          const computedDeviceData = Object.entries(devices).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
          if (computedDeviceData.length > 0) {
            setDeviceData(computedDeviceData);
          }
          const computedLocs = Object.entries(locations)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // top 5
          setLocationData(computedLocs);
        }
      }
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Network Traffic / Scales Matrix</h2>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <div className="w-3 h-3 rounded-full border-[2px] border-emerald-500 bg-emerald-500/20" /> Visits
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                  <div className="w-3 h-3 rounded-full border-[2px] border-emerald-500 bg-transparent" /> Downloads
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                  <Line type="monotone" dataKey="downloads" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl flex flex-col justify-center items-center relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6 w-full relative z-10">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold">Device Signatures</h2>
            </div>
            
            <div className="h-[250px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}
                    itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full mt-4 relative z-10">
              {deviceData.map((device, i) => (
                <div key={device.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm font-medium text-zinc-300">{device.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold">Account Registry</h2>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-12 gap-4 pb-4 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-4">
                  <div className="col-span-4">User Identity</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-3">Joined / Last Active</div>
                </div>
                <div className="divide-y divide-zinc-800/50 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {stats.userList.length === 0 ? (
                    <p className="text-zinc-500 italic p-8 text-center">No structural user data found.</p>
                  ) : (
                    stats.userList.map((user, i) => (
                      <div key={user.id || i} className="grid grid-cols-12 gap-4 py-4 items-center pl-4 hover:bg-white/5 transition-colors rounded-xl">
                        <div className="col-span-4 flex items-center gap-3">
                          <img src={user.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.firstName}`} alt="" className="w-10 h-10 rounded-full border border-zinc-700 object-cover" />
                          <div>
                            <p className="font-bold text-sm">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-zinc-500">@{user.username || 'unknown'}</p>
                          </div>
                        </div>
                        <div className="col-span-3 text-sm text-zinc-400 truncate pr-2">
                          {user.email}
                        </div>
                        <div className="col-span-2">
                           <span className={`text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full ${user.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                             {user.role || 'user'}
                           </span>
                        </div>
                        <div className="col-span-3 text-xs text-zinc-500 font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl flex flex-col h-full"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-zinc-400" />
              <h2 className="text-xl font-bold">Activity Feed</h2>
            </div>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex-1">
              {stats.activities.length === 0 ? (
                 <p className="text-zinc-500 italic p-4 text-center">No recent physical events detected.</p>
              ) : (
                stats.activities.map((act, i) => {
                  let dotColor = "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                  if (act.type === 'user_login') dotColor = "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
                  else if (act.type === 'user_logout') dotColor = "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
                  else if (act.type?.includes('system')) dotColor = "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]";
                  else if (act.type?.includes('delete')) dotColor = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";

                  return (
                    <div key={i} className="bg-black/40 p-4 rounded-2xl flex gap-4">
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        {i < stats.activities.length - 1 && <div className="w-px h-8 bg-zinc-800" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-medium leading-snug">{act.userName || 'System'}</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                          <span className="opacity-50 uppercase text-[9px] mr-2">{act.type}</span>
                          {act.message}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(act.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/50 rounded-[32px] p-6 md:p-8 border border-zinc-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <Globe className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold">Global Presence</h2>
            </div>
            <div className="space-y-4 relative z-10">
              {locationData.length === 0 ? (
                <p className="text-zinc-500 italic p-4 text-center">Awaiting geo-spatial telemetry...</p>
              ) : (
                locationData.map((loc, i) => (
                  <div key={loc.name} className="flex items-center justify-between bg-black/30 p-3 rounded-2xl">
                     <span className="font-bold text-zinc-300">{loc.name}</span>
                     <span className="text-indigo-400 font-mono text-sm">{loc.value} sessions</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
