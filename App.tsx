import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UserProfile, AttendanceRecord } from './types';
import { fetchAllUsers, createUserProfile, logAction, fetchUserLogs } from './services/firebaseService';
import { getAttendanceInsight, generatePythonAnalysisCode } from './services/geminiService';
import { auth } from './firebase';
import { signInAnonymously } from "firebase/auth";
import { 
  Users, 
  UserPlus, 
  LogIn, 
  LogOut, 
  History, 
  Sparkles, 
  Code,
  Briefcase,
  UserCheck,
  ChevronRight,
  RefreshCw,
  LayoutDashboard,
  WifiOff
} from 'lucide-react';

const App: React.FC = () => {
  // --- View States ---
  const [view, setView] = useState<'dashboard' | 'select-user' | 'register' | 'intern-panel'>('dashboard');
  
  // --- Data States ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  
  // --- UI Loading States ---
  const [loading, setLoading] = useState(true); // Initial load is true
  const [actionLoading, setActionLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // --- Registration State ---
  const [newProfile, setNewProfile] = useState<Partial<UserProfile>>({
    role: 'Stajyer',
    department: 'Yazılım'
  });

  // --- AI States ---
  const [aiInsight, setAiInsight] = useState('');
  const [pythonCode, setPythonCode] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Initial Data Load with Anonymous Auth
  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Authenticate anonymously first (Prevents Firestore hanging)
        await signInAnonymously(auth);
        
        // 2. Then load data
        await loadUsers();
      } catch (error) {
        console.error("Initialization error:", error);
        setNetworkError(true);
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Load users error:", e);
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: UserProfile) => {
    setCurrentUser(user);
    setView('intern-panel');
    // Don't await this, let it load in background for speed
    loadUserLogs(user.id);
  };

  const loadUserLogs = async (userId: string) => {
    const data = await fetchUserLogs(userId);
    setLogs(data);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.firstName || !newProfile.lastName) return;
    setActionLoading(true);
    const created = await createUserProfile(newProfile);
    if (created) {
      setUsers(prev => [...prev, created]);
      setCurrentUser(created);
      setView('intern-panel');
      setNewProfile({ role: 'Stajyer', department: 'Yazılım' });
    }
    setActionLoading(false);
  };

  const handleAttendance = async (type: 'Giriş' | 'Çıkış') => {
    if (!currentUser) return;
    setActionLoading(true);
    
    // Optimistic Update (Immediate UI change)
    const previousStatus = currentUser.currentStatus;
    const now = new Date();
    
    // Temporarily update UI before server responds
    setCurrentUser(prev => prev ? ({...prev, currentStatus: type}) : null);
    
    const success = await logAction(currentUser, type);
    
    if (success) {
      const newLog: AttendanceRecord = {
        id: 'temp-' + Date.now(),
        userId: currentUser.id,
        fullName: `${currentUser.firstName} ${currentUser.lastName}`,
        type: type,
        timestamp: { seconds: now.getTime() / 1000 }
      };
      
      setLogs(prev => [newLog, ...prev]);
      // Background refresh to sync consistency
      fetchAllUsers().then(setUsers); 
    } else {
      // Revert on failure
      setCurrentUser(prev => prev ? ({...prev, currentStatus: previousStatus}) : null);
      alert("Bağlantı hatası, işlem kaydedilemedi.");
    }
    setActionLoading(false);
  };

  const handleGenerateAi = async (type: 'insight' | 'python') => {
    if (!currentUser) return;
    setAiLoading(true);
    
    const mappedLogs: any[] = logs.map(l => ({
        id: l.id,
        userId: l.userId,
        date: new Date((l.timestamp?.seconds || 0) * 1000).toISOString(),
        type: l.type === 'Giriş' ? 'Çalışma' : 'İzin',
        hours: 4, 
        description: l.type
    }));

    if (type === 'insight') {
        const text = await getAttendanceInsight(currentUser, mappedLogs, []);
        setAiInsight(text);
    } else {
        const code = await generatePythonAnalysisCode(currentUser, mappedLogs);
        setPythonCode(code);
    }
    setAiLoading(false);
  };

  // --- RENDER HELPERS ---

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  // --- VIEWS ---

  // 1. DASHBOARD (Manager View)
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-blue-900">Genel Durum Paneli</h2>
                    <p className="text-gray-500 text-sm">Anlık stajyer ve aday mühendis durumları</p>
                </div>
                <button 
                  onClick={() => setView('select-user')}
                  className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow-sm"
                >
                    <Briefcase className="w-5 h-5" />
                    Stajyer Paneline Git
                </button>
            </div>

            {networkError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                <WifiOff className="w-5 h-5" />
                <span>Bağlantı kurulamadı. İnternetinizi kontrol edip sayfayı yenileyin.</span>
              </div>
            )}

            {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
                  <p className="text-gray-400 text-sm">Veriler çekiliyor...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${user.currentStatus === 'Giriş' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                            
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${user.avatarColor || 'bg-blue-600'}`}>
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 truncate">{user.firstName} {user.lastName}</h3>
                                <p className="text-xs text-gray-500 truncate">{user.department} • {user.role}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        user.currentStatus === 'Giriş' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.currentStatus === 'Giriş' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                        {user.currentStatus === 'Giriş' ? 'İçeride' : 'Dışarıda'}
                                    </span>
                                    {user.lastSeen && (
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <History className="w-3 h-3" />
                                            {formatTime(user.lastSeen)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {users.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                            Henüz kayıtlı stajyer yok. Stajyer Paneline gidip kayıt olabilirsiniz.
                        </div>
                    )}
                </div>
            )}
        </main>
      </div>
    );
  }

  // 2. USER SELECTION (Login)
  if (view === 'select-user') {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
          <Header onBack={() => setView('dashboard')} />
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-blue-900 p-6 text-center">
                    <h2 className="text-xl font-bold text-white">Kimsin?</h2>
                    <p className="text-blue-200 text-sm">İşlem yapmak için profilini seç.</p>
                </div>
                <div className="p-6">
                    {loading && users.length === 0 ? (
                       <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-blue-900" /></div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
                          {users.map(user => (
                              <button
                                  key={user.id}
                                  onClick={() => handleUserSelect(user)}
                                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group text-left"
                              >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.avatarColor}`}>
                                      {user.firstName[0]}{user.lastName[0]}
                                  </div>
                                  <div className="flex-1">
                                      <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                                      <div className="text-xs text-gray-500">{user.role}</div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                              </button>
                          ))}
                      </div>
                    )}
                    <button 
                        onClick={() => setView('register')}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Listede Yokum, Kayıt Ol
                    </button>
                </div>
            </div>
          </div>
        </div>
    );
  }

  // 3. REGISTER
  if (view === 'register') {
      return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
            <Header onBack={() => setView('select-user')} />
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Yeni Profil Oluştur</h2>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input className="border p-3 rounded-lg w-full outline-none focus:border-blue-500" placeholder="Ad" value={newProfile.firstName || ''} onChange={e => setNewProfile({...newProfile, firstName: e.target.value})} required />
                            <input className="border p-3 rounded-lg w-full outline-none focus:border-blue-500" placeholder="Soyad" value={newProfile.lastName || ''} onChange={e => setNewProfile({...newProfile, lastName: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select className="border p-3 rounded-lg w-full bg-white" value={newProfile.role} onChange={e => setNewProfile({...newProfile, role: e.target.value as any})}>
                                <option>Stajyer</option>
                                <option>Aday Mühendis</option>
                            </select>
                            <input className="border p-3 rounded-lg w-full outline-none focus:border-blue-500" placeholder="Bölüm (Örn: Ar-Ge)" value={newProfile.department || ''} onChange={e => setNewProfile({...newProfile, department: e.target.value})} />
                        </div>
                        <button disabled={actionLoading} type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition mt-2 disabled:opacity-50">
                            {actionLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                        </button>
                        <button type="button" onClick={() => setView('select-user')} className="w-full text-gray-500 py-2 text-sm">İptal</button>
                    </form>
                </div>
            </div>
        </div>
      );
  }

  // 4. INTERN PANEL (Personal)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
        <Header currentUser={currentUser} onBack={() => { setCurrentUser(null); setView('dashboard'); setLogs([]); setAiInsight(''); setPythonCode(''); }} />
        
        <main className="max-w-md mx-auto px-4 py-8 pb-20">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 text-center">
                <div className="mb-2 text-sm text-gray-500">Şu anki Durumun</div>
                <div className={`text-3xl font-bold mb-6 ${currentUser?.currentStatus === 'Giriş' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {currentUser?.currentStatus === 'Giriş' ? 'OFİSTESİN' : 'DIŞARIDASIN'}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleAttendance('Giriş')}
                        disabled={actionLoading || currentUser?.currentStatus === 'Giriş'}
                        className={`py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                            currentUser?.currentStatus === 'Giriş' 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 shadow-sm'
                        }`}
                    >
                        {actionLoading && currentUser?.currentStatus !== 'Giriş' ? <RefreshCw className="w-8 h-8 animate-spin" /> : <LogIn className="w-8 h-8" />}
                        <span className="font-bold">Giriş Yap</span>
                    </button>

                    <button
                        onClick={() => handleAttendance('Çıkış')}
                        disabled={actionLoading || currentUser?.currentStatus !== 'Giriş'}
                        className={`py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition border-2 ${
                            currentUser?.currentStatus !== 'Giriş' 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-red-50 border-red-100 text-red-700 hover:bg-red-100 hover:border-red-300 shadow-sm'
                        }`}
                    >
                         {actionLoading && currentUser?.currentStatus === 'Giriş' ? <RefreshCw className="w-8 h-8 animate-spin" /> : <LogOut className="w-8 h-8" />}
                        <span className="font-bold">Çıkış Yap</span>
                    </button>
                </div>
            </div>

            {/* AI Assistant Mini */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        AI Mentör
                    </h3>
                    <div className="flex gap-2 text-sm">
                        <button 
                            onClick={() => handleGenerateAi('insight')}
                            disabled={aiLoading}
                            className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition text-xs font-medium"
                        >
                            {aiLoading ? '...' : 'Yorumla'}
                        </button>
                        <button 
                             onClick={() => handleGenerateAi('python')}
                             disabled={aiLoading}
                             className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition text-xs font-medium flex items-center gap-1"
                        >
                            <Code className="w-3 h-3" /> Python
                        </button>
                    </div>
                    {aiInsight && (
                        <div className="mt-3 text-xs bg-black/20 p-2 rounded leading-relaxed animate-fade-in">
                            {aiInsight}
                        </div>
                    )}
                     {pythonCode && (
                        <div className="mt-3">
                             <button onClick={() => navigator.clipboard.writeText(pythonCode)} className="text-[10px] bg-white text-indigo-900 px-2 py-1 rounded mb-1">Kopyala</button>
                             <pre className="text-[10px] bg-black/40 p-2 rounded overflow-x-auto max-h-32 text-green-300 font-mono">
                                {pythonCode}
                            </pre>
                        </div>
                    )}
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" />
            </div>

            {/* History Log */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <h3 className="font-bold text-gray-700 text-sm">Son Hareketler (Limitli)</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {logs.map(log => (
                        <div key={log.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                             <div>
                                 <div className={`text-sm font-bold ${log.type === 'Giriş' ? 'text-emerald-700' : 'text-red-600'}`}>
                                     {log.type.toUpperCase()}
                                 </div>
                                 <div className="text-xs text-gray-400">{formatDate(log.timestamp)}</div>
                             </div>
                             <div className="text-lg font-mono text-gray-600 font-medium">
                                 {formatTime(log.timestamp)}
                             </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-400">
                           {logs.length === 0 ? 'Veri yok' : 'Yükleniyor...'}
                        </div>
                    )}
                </div>
            </div>
        </main>
    </div>
  );
};

export default App;