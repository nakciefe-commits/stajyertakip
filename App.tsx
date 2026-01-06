import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { BottomNav } from './components/BottomNav';
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
  ChevronLeft,
  RefreshCw,
  LayoutDashboard,
  WifiOff,
  AlertTriangle,
  MapPin,
  CalendarCheck
} from 'lucide-react';

const App: React.FC = () => {
  // --- View States ---
  // Main tabs: 'dashboard' (Genel), 'calendar' (Planlar), 'profile' (Profilim)
  // Sub-views are handled within render logic
  const [mainTab, setMainTab] = useState<'dashboard' | 'calendar' | 'profile'>('dashboard');
  
  // 'select-user' and 'register' are sub-states of the 'profile' tab context effectively,
  // but we keep them distinct for the flow.
  const [subView, setSubView] = useState<'none' | 'register'>('none');
  
  // --- Data States ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  
  // --- UI Loading States ---
  const [loading, setLoading] = useState(true); 
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Registration State ---
  const [newProfile, setNewProfile] = useState<Partial<UserProfile>>({
    role: 'Stajyer',
    department: 'Yazılım'
  });

  // --- AI States ---
  const [aiInsight, setAiInsight] = useState('');
  const [pythonCode, setPythonCode] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Initial Data Load
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (!auth.currentUser) {
         await signInAnonymously(auth);
      }
      await loadUsers();
    } catch (error: any) {
      console.error("Initialization error:", error);
      let msg = "Bağlantı hatası oluştu.";
      if (error.code === 'auth/operation-not-allowed') msg = "HATA: Firebase Anonymous Auth kapalı.";
      else if (error.code === 'permission-denied') msg = "HATA: Firestore izin hatası.";
      else if (error.message) msg = `Hata: ${error.message}`;
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Load users error:", e);
      throw e; 
    }
  };

  const handleUserSelect = async (user: UserProfile) => {
    setCurrentUser(user);
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
    setErrorMessage(null);

    try {
        if (!auth.currentUser) await signInAnonymously(auth);

        const created = await createUserProfile(newProfile);
        
        if (created) {
            setUsers(prev => [...prev, created]);
            setCurrentUser(created);
            setSubView('none');
            setNewProfile({ role: 'Stajyer', department: 'Yazılım' });
        } else {
            throw new Error("Kayıt işlemi veritabanı tarafından reddedildi.");
        }
    } catch (error: any) {
        setErrorMessage(error.message || "Kayıt hatası.");
    } finally {
        setActionLoading(false);
    }
  };

  const handleAttendance = async (type: 'Giriş' | 'Çıkış') => {
    if (!currentUser) return;
    setActionLoading(true);
    
    const previousStatus = currentUser.currentStatus;
    const now = new Date();
    
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
      fetchAllUsers().then(setUsers); 
    } else {
      setCurrentUser(prev => prev ? ({...prev, currentStatus: previousStatus}) : null);
      alert("İşlem kaydedilemedi.");
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

  // --- Helpers ---
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

  // --- RENDER CONTENT BASED ON TAB ---

  const renderContent = () => {
    // 1. DASHBOARD
    if (mainTab === 'dashboard') {
        const insideCount = users.filter(u => u.currentStatus === 'Giriş').length;
        
        return (
            <div className="pb-24">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-blue-900">Genel Durum</h2>
                        <p className="text-gray-500 text-sm">BİLTİR OTEST Ekibi</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="bg-red-50 p-4 rounded-lg mb-6 flex flex-col gap-2 border border-red-200">
                        <span className="text-red-700 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Bağlantı Hatası</span>
                        <p className="text-sm text-red-600">{errorMessage}</p>
                        <button onClick={initApp} className="bg-white text-red-700 px-3 py-1 rounded border border-red-200 text-sm font-bold w-fit">Yenile</button>
                    </div>
                )}

                {/* Overall Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Şu an Ofiste</p>
                            <div className="text-4xl font-bold flex items-baseline gap-1">
                                {insideCount} <span className="text-lg font-normal text-blue-300">kişi</span>
                            </div>
                        </div>
                        <MapPin className="absolute -bottom-2 -right-2 w-20 h-20 text-white/10" />
                     </div>

                     <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Toplam Ekip</p>
                        <div className="text-4xl font-bold text-gray-800 flex items-baseline gap-1">
                            {users.length} <span className="text-lg font-normal text-gray-400">kişi</span>
                        </div>
                        <Users className="absolute -bottom-2 -right-2 w-20 h-20 text-gray-100" />
                     </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                    Stajyer Listesi
                </h3>

                {loading && !errorMessage ? (
                    <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 text-blue-900 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {users.map(user => (
                            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${user.currentStatus === 'Giriş' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${user.avatarColor || 'bg-blue-600'}`}>
                                    {user.firstName[0]}{user.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate text-sm">{user.firstName} {user.lastName}</h3>
                                    <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            user.currentStatus === 'Giriş' 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : 'bg-gray-50 text-gray-500'
                                        }`}>
                                            <div className={`w-1 h-1 rounded-full ${user.currentStatus === 'Giriş' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            {user.currentStatus === 'Giriş' ? 'İçeride' : 'Dışarıda'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 2. CALENDAR
    if (mainTab === 'calendar') {
        return <CalendarView users={users} currentUser={currentUser} />;
    }

    // 3. PROFILE (Login/Personal Panel)
    if (mainTab === 'profile') {
        // 3a. Register View
        if (subView === 'register') {
            return (
                <div className="pb-24">
                     <button onClick={() => setSubView('none')} className="mb-6 flex items-center text-gray-500 hover:text-blue-900"><ChevronLeft className="w-4 h-4"/> Geri Dön</button>
                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Yeni Profil Oluştur</h2>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="border p-3 rounded-lg w-full" placeholder="Ad" value={newProfile.firstName || ''} onChange={e => setNewProfile({...newProfile, firstName: e.target.value})} required />
                                <input className="border p-3 rounded-lg w-full" placeholder="Soyad" value={newProfile.lastName || ''} onChange={e => setNewProfile({...newProfile, lastName: e.target.value})} required />
                            </div>
                            <select className="border p-3 rounded-lg w-full bg-white" value={newProfile.role} onChange={e => setNewProfile({...newProfile, role: e.target.value as any})}>
                                <option>Stajyer</option>
                                <option>Aday Mühendis</option>
                            </select>
                            <input className="border p-3 rounded-lg w-full" placeholder="Bölüm (Örn: Ar-Ge)" value={newProfile.department || ''} onChange={e => setNewProfile({...newProfile, department: e.target.value})} />
                            <button disabled={actionLoading} type="submit" className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl">
                                {actionLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
                            </button>
                        </form>
                     </div>
                </div>
            );
        }

        // 3b. Personal Panel (If Logged In)
        if (currentUser) {
            return (
                <div className="pb-24">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-900">Panelim</h2>
                        <button onClick={() => {setCurrentUser(null); setLogs([]);}} className="text-sm text-red-600 font-medium">Çıkış Yap</button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-yellow-400"></div>
                        <div className="mb-2 text-sm text-gray-500">Durumun</div>
                        <div className={`text-3xl font-bold mb-6 ${currentUser?.currentStatus === 'Giriş' ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {currentUser?.currentStatus === 'Giriş' ? 'OFİSTESİN' : 'DIŞARIDASIN'}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleAttendance('Giriş')}
                                disabled={actionLoading || currentUser?.currentStatus === 'Giriş'}
                                className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 ${currentUser?.currentStatus === 'Giriş' ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}
                            >
                                {actionLoading && currentUser?.currentStatus !== 'Giriş' ? <RefreshCw className="animate-spin"/> : <LogIn />}
                                <span className="font-bold">Giriş Yap</span>
                            </button>
                            <button
                                onClick={() => handleAttendance('Çıkış')}
                                disabled={actionLoading || currentUser?.currentStatus !== 'Giriş'}
                                className={`py-4 rounded-xl flex flex-col items-center gap-2 border-2 ${currentUser?.currentStatus !== 'Giriş' ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-red-50 border-red-100 text-red-700'}`}
                            >
                                {actionLoading && currentUser?.currentStatus === 'Giriş' ? <RefreshCw className="animate-spin"/> : <LogOut />}
                                <span className="font-bold">Çıkış Yap</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
                        <h3 className="font-bold flex items-center gap-2 mb-2 relative z-10">
                            <Sparkles className="w-5 h-5 text-yellow-300" /> AI Mentör
                        </h3>
                        <div className="flex gap-2 relative z-10">
                            <button onClick={() => handleGenerateAi('insight')} disabled={aiLoading} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-medium backdrop-blur-sm">
                                {aiLoading ? '...' : 'Durumumu Yorumla'}
                            </button>
                            <button onClick={() => handleGenerateAi('python')} disabled={aiLoading} className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                                <Code className="w-3 h-3" /> Python Kodu
                            </button>
                        </div>
                        {aiInsight && <div className="mt-3 text-xs bg-black/20 p-3 rounded leading-relaxed relative z-10">{aiInsight}</div>}
                        {pythonCode && (
                            <div className="mt-3 relative z-10">
                                <pre className="text-[10px] bg-black/40 p-2 rounded overflow-x-auto max-h-32 text-green-300 font-mono">{pythonCode}</pre>
                            </div>
                        )}
                        <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10" />
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200"><h3 className="font-bold text-gray-700 text-sm">Son Hareketler</h3></div>
                        <div className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <div key={log.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className={`text-sm font-bold ${log.type === 'Giriş' ? 'text-emerald-700' : 'text-red-600'}`}>{log.type.toUpperCase()}</div>
                                        <div className="text-xs text-gray-400">{formatDate(log.timestamp)}</div>
                                    </div>
                                    <div className="font-mono text-gray-600">{formatTime(log.timestamp)}</div>
                                </div>
                            ))}
                            {logs.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">Henüz kayıt yok.</div>}
                        </div>
                    </div>
                </div>
            );
        }

        // 3c. Login List (Default Profile View)
        return (
            <div className="pb-24">
                <div className="bg-blue-900 rounded-2xl p-6 text-center mb-6 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-1">Hoş Geldin!</h2>
                    <p className="text-blue-200 text-sm">İşlem yapmak için profilini seç.</p>
                </div>
                
                <div className="space-y-3 mb-6">
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition shadow-sm"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.avatarColor}`}>
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-bold text-gray-900">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-gray-500">{user.role}</div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>
                    ))}
                </div>

                <button onClick={() => setSubView('register')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" /> Listede Yokum, Kayıt Ol
                </button>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
        <Header currentUser={currentUser} />
        
        {/* Desktop Layout Wrapper (Center Content) */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            {renderContent()}
        </main>

        <BottomNav currentView={mainTab} onChange={setMainTab} />
    </div>
  );
};

export default App;