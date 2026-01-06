import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AttendanceRecord, PlanRecord, RecordType, UserStats, UserProfile } from './types';
import { getAttendanceInsight, generatePythonAnalysisCode } from './services/geminiService';
import { 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Sparkles, 
  ArrowRight,
  ClipboardList,
  AlertCircle,
  Code,
  UserPlus,
  Briefcase,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const App: React.FC = () => {
  // --- Global Data State ---
  // In a real app, this would be fetched from a database. 
  // For this demo, we initialize with empty or localStorage could be used.
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [allPlans, setAllPlans] = useState<PlanRecord[]>([]);
  
  // --- UI State ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'log' | 'plan'>('log');
  const [viewMode, setViewMode] = useState<'login' | 'register'>('login');
  
  // --- Form States ---
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState<number>(8);
  const [type, setType] = useState<RecordType>(RecordType.WORK);
  const [desc, setDesc] = useState<string>('');
  
  const [planDate, setPlanDate] = useState<string>('');
  const [planHours, setPlanHours] = useState<number>(8);
  const [planDesc, setPlanDesc] = useState<string>('');

  // --- AI State ---
  const [aiInsight, setAiInsight] = useState<string>('');
  const [pythonCode, setPythonCode] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // --- Registration Form State ---
  const [newProfile, setNewProfile] = useState<Partial<UserProfile>>({
    role: 'Stajyer',
    department: 'Yazılım'
  });

  // --- Derived Data ---
  const currentUser = useMemo(() => 
    profiles.find(p => p.id === currentUserId) || null
  , [profiles, currentUserId]);

  const currentRecords = useMemo(() => 
    allRecords.filter(r => r.userId === currentUserId)
  , [allRecords, currentUserId]);

  const currentPlans = useMemo(() => 
    allPlans.filter(p => p.userId === currentUserId)
  , [allPlans, currentUserId]);

  const stats: UserStats = useMemo(() => {
    return {
      totalWorkDays: currentRecords.filter(r => r.type === RecordType.WORK).length,
      totalLeaveDays: currentRecords.filter(r => r.type === RecordType.LEAVE).length,
      totalWorkHours: currentRecords
        .filter(r => r.type === RecordType.WORK)
        .reduce((acc, curr) => acc + curr.hours, 0),
    };
  }, [currentRecords]);

  const chartData = useMemo(() => {
    const sorted = [...currentRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted.map(r => ({
      date: new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      hours: r.type === RecordType.WORK ? r.hours : 0,
      type: r.type
    })).slice(-7);
  }, [currentRecords]);

  // --- Reset AI state when switching users ---
  useEffect(() => {
    setAiInsight('');
    setPythonCode('');
  }, [currentUserId]);

  // --- Handlers ---

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.firstName || !newProfile.lastName) return;

    const profile: UserProfile = {
      id: Date.now().toString(),
      firstName: newProfile.firstName,
      lastName: newProfile.lastName,
      email: newProfile.email || '',
      phone: newProfile.phone || '',
      role: newProfile.role as 'Stajyer' | 'Aday Mühendis',
      department: newProfile.department || 'Genel',
      avatarColor: `bg-${['blue', 'indigo', 'purple', 'emerald', 'yellow', 'red'][Math.floor(Math.random()*6)]}-600`
    };

    setProfiles(prev => [...prev, profile]);
    setCurrentUserId(profile.id); // Auto login
    setNewProfile({ role: 'Stajyer', department: 'Yazılım' });
    setViewMode('login');
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: currentUserId,
      date,
      hours: type === RecordType.LEAVE ? 0 : hours,
      type,
      description: desc
    };
    setAllRecords(prev => [...prev, newRecord]);
    setDesc('');
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !planDate) return;
    const newPlan: PlanRecord = {
      id: Date.now().toString(),
      userId: currentUserId,
      date: planDate,
      expectedHours: planHours,
      notes: planDesc
    };
    setAllPlans(prev => [...prev, newPlan]);
    setPlanDesc('');
  };

  const handleGenerateInsight = async () => {
    if (!currentUser) return;
    setLoadingAi(true);
    const insight = await getAttendanceInsight(currentUser, currentRecords, currentPlans);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const handleGeneratePython = async () => {
    if (!currentUser) return;
    setLoadingAi(true);
    const code = await generatePythonAnalysisCode(currentUser, currentRecords);
    setPythonCode(code);
    setLoadingAi(false);
  };

  // --- 1. Login / Register Screen ---
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-gray-800 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            
            <div className="bg-blue-900 p-8 text-center">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4">
                  <Briefcase className="w-8 h-8 text-blue-900" />
               </div>
               <h2 className="text-2xl font-bold text-white mb-1">BİLTİR OTEST</h2>
               <p className="text-blue-200 text-sm">Stajyer & Aday Mühendis Portalı</p>
            </div>

            <div className="p-8">
               {viewMode === 'login' ? (
                 <>
                   <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Hoş Geldiniz</h3>
                   {profiles.length > 0 ? (
                     <div className="space-y-4">
                       <p className="text-sm text-gray-500 text-center mb-4">Devam etmek için profilinizi seçiniz</p>
                       <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                         {profiles.map(profile => (
                           <button
                             key={profile.id}
                             onClick={() => setCurrentUserId(profile.id)}
                             className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group text-left"
                           >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${profile.avatarColor}`}>
                                {profile.firstName[0]}{profile.lastName[0]}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</div>
                                <div className="text-xs text-gray-500">{profile.role}</div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                           </button>
                         ))}
                       </div>
                       <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">veya</span></div>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center py-6 text-gray-500">
                       Henüz kayıtlı profil bulunmuyor.
                     </div>
                   )}
                   
                   <button 
                     onClick={() => setViewMode('register')}
                     className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                   >
                     <UserPlus className="w-5 h-5" />
                     Yeni Stajyer Kaydı Oluştur
                   </button>
                 </>
               ) : (
                 <>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Kayıt Ol</h3>
                    <p className="text-sm text-gray-500 text-center mb-6">Bilgilerinizi girerek portalı kullanmaya başlayın.</p>
                    
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Ad</label>
                          <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 outline-none" value={newProfile.firstName || ''} onChange={e => setNewProfile({...newProfile, firstName: e.target.value})} required placeholder="Adınız" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Soyad</label>
                          <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 outline-none" value={newProfile.lastName || ''} onChange={e => setNewProfile({...newProfile, lastName: e.target.value})} required placeholder="Soyadınız" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">E-posta</label>
                        <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 outline-none" value={newProfile.email || ''} onChange={e => setNewProfile({...newProfile, email: e.target.value})} type="email" placeholder="ornek@email.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Rol</label>
                          <select className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 outline-none" value={newProfile.role} onChange={e => setNewProfile({...newProfile, role: e.target.value as any})}>
                            <option value="Stajyer">Stajyer</option>
                            <option value="Aday Mühendis">Aday Mühendis</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Bölüm</label>
                          <input className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-900 outline-none" value={newProfile.department || ''} onChange={e => setNewProfile({...newProfile, department: e.target.value})} placeholder="Örn: Ar-Ge" />
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition mt-2">
                        Kaydı Tamamla
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={() => setViewMode('login')}
                        className="w-full text-gray-500 hover:text-gray-700 font-medium text-sm py-2"
                      >
                        Giriş Ekranına Dön
                      </button>
                    </form>
                 </>
               )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- 2. Authenticated Intern Portal ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      <Header currentUser={currentUser} onBack={() => setCurrentUserId(null)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
           <h2 className="text-2xl font-bold text-gray-900">Hoş Geldin, {currentUser?.firstName}!</h2>
           <p className="text-gray-500">Kendi staj verilerini buradan yönetebilir ve takip edebilirsin.</p>
        </div>

        {/* Statistics Section */}
        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input Forms & AI */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Tab Switcher */}
            <div className="bg-white rounded-xl shadow-sm p-1 border border-gray-200 flex">
              <button
                onClick={() => setActiveTab('log')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'log' 
                    ? 'bg-blue-900 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Giriş Ekle
              </button>
              <button
                onClick={() => setActiveTab('plan')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'plan' 
                    ? 'bg-yellow-400 text-blue-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Planlama Yap
              </button>
            </div>

            {/* Input Form */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className={`h-1.5 w-full ${activeTab === 'log' ? 'bg-blue-900' : 'bg-yellow-400'}`}></div>
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {activeTab === 'log' ? (
                    <><Calendar className="w-5 h-5 text-blue-900" /> Bugün Ne Yaptın?</>
                  ) : (
                    <><ClipboardList className="w-5 h-5 text-yellow-600" /> Gelecek Planın Ne?</>
                  )}
                </h2>

                {activeTab === 'log' ? (
                  <form onSubmit={handleAddRecord} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                      <input 
                        type="date" 
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                      <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as RecordType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
                      >
                        <option value={RecordType.WORK}>Çalışma (Ofis/Uzaktan)</option>
                        <option value={RecordType.LEAVE}>İzin / Rapor</option>
                      </select>
                    </div>
                    {type === RecordType.WORK && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Çalışılan Saat</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="24"
                          step="0.5"
                          value={hours}
                          onChange={(e) => setHours(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Açıklama</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Proje toplantısı, literatür taraması..."
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2">
                      <PlusCircle className="w-5 h-5" /> Kaydı Ekle
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAddPlan} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ne Zaman Geleceksin?</label>
                      <input 
                        type="date" 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={planDate}
                        onChange={(e) => setPlanDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Tahmini Süre (Saat)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="24"
                          step="0.5"
                          value={planHours}
                          onChange={(e) => setPlanHours(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                        />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan İş (Opsiyonel)</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Tasarım bitirilecek"
                        value={planDesc}
                        onChange={(e) => setPlanDesc(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition"
                      />
                    </div>
                    <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2">
                      <PlusCircle className="w-5 h-5" /> Planımı Kaydet
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* AI Insight & Python Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="w-24 h-24 text-indigo-500" />
               </div>
               <div className="relative z-10">
                  <h3 className="text-indigo-900 font-bold flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Kariyer Mentörü
                  </h3>
                  
                  {aiInsight ? (
                    <div className="bg-white/60 p-3 rounded-lg text-sm text-indigo-900 border border-indigo-100 mb-3 animate-fade-in">
                      {aiInsight}
                    </div>
                  ) : (
                    <p className="text-sm text-indigo-700 mb-4">
                      Staj performansını yapay zeka ile analiz et ve tavsiyeler al.
                    </p>
                  )}

                  {pythonCode && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-indigo-800">Senin için Python Kodu:</span>
                        <button 
                          onClick={() => {navigator.clipboard.writeText(pythonCode); alert('Kopyalandı!');}} 
                          className="text-xs bg-indigo-200 hover:bg-indigo-300 px-2 py-1 rounded text-indigo-800"
                        >
                          Kopyala
                        </button>
                      </div>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-40">
                        {pythonCode}
                      </pre>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleGenerateInsight}
                      disabled={loadingAi || currentRecords.length === 0}
                      className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium py-2 rounded-lg text-xs transition disabled:opacity-50 flex justify-center items-center gap-1"
                    >
                      <Sparkles className="w-4 h-4" /> Mentör Tavsiyesi
                    </button>
                    <button 
                      onClick={handleGeneratePython}
                      disabled={loadingAi || currentRecords.length === 0}
                      className="bg-gray-800 text-green-400 border border-gray-700 hover:bg-gray-700 font-medium py-2 rounded-lg text-xs transition disabled:opacity-50 flex justify-center items-center gap-1"
                    >
                      <Code className="w-4 h-4" /> Python Kodu
                    </button>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Column: Lists and Charts */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-6">Haftalık Performansım</h3>
               {currentRecords.length > 0 ? (
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                       <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                       <YAxis tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                       <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                          cursor={{fill: '#f3f4f6'}}
                       />
                       <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                         {chartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.type === RecordType.WORK ? '#1e3a8a' : '#facc15'} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                   <BarChart className="w-12 h-12 mb-2 opacity-50" />
                   <p>Henüz veri girmedin.</p>
                 </div>
               )}
            </div>

            {/* Attendance History List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="font-bold text-gray-800">Geçmiş Kayıtlarım</h3>
                 <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{currentRecords.length} Kayıt</span>
               </div>
               
               {currentRecords.length === 0 ? (
                 <div className="p-8 text-center text-gray-500">
                    Henüz bir kayıt oluşturmadın.
                 </div>
               ) : (
                 <div className="max-h-96 overflow-y-auto">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-50 text-gray-500 font-medium sticky top-0">
                       <tr>
                         <th className="px-6 py-3">Tarih</th>
                         <th className="px-6 py-3">Durum</th>
                         <th className="px-6 py-3">Süre</th>
                         <th className="px-6 py-3">Açıklama</th>
                         <th className="px-6 py-3 text-right">Sil</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {currentRecords.slice().reverse().map((record) => (
                         <tr key={record.id} className="hover:bg-gray-50/50 transition">
                           <td className="px-6 py-3 font-medium text-gray-900">
                             {new Date(record.date).toLocaleDateString('tr-TR')}
                           </td>
                           <td className="px-6 py-3">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                               record.type === RecordType.WORK 
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                             }`}>
                               {record.type}
                             </span>
                           </td>
                           <td className="px-6 py-3 text-gray-600">
                             {record.type === RecordType.WORK ? `${record.hours} sa` : '-'}
                           </td>
                           <td className="px-6 py-3 text-gray-500 truncate max-w-xs">
                             {record.description || '-'}
                           </td>
                           <td className="px-6 py-3 text-right">
                             <button 
                                onClick={() => setAllRecords(prev => prev.filter(r => r.id !== record.id))}
                                className="text-red-400 hover:text-red-600 transition p-1"
                                title="Kaydı Sil"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>

            {/* Future Plans List */}
            {currentPlans.length > 0 && (
              <div className="bg-yellow-50 rounded-xl border border-yellow-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-yellow-100 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-yellow-700" />
                  <h3 className="font-bold text-yellow-800">Gelecek Planlarım</h3>
                </div>
                <div className="divide-y divide-yellow-100/50">
                  {currentPlans.map((plan) => (
                    <div key={plan.id} className="px-6 py-4 flex items-center justify-between hover:bg-yellow-100/20 transition">
                       <div className="flex items-center gap-4">
                         <div className="bg-white p-2 rounded-lg border border-yellow-200 text-center min-w-[3.5rem]">
                            <div className="text-xs text-gray-500 uppercase">{new Date(plan.date).toLocaleDateString('tr-TR', {month: 'short'})}</div>
                            <div className="text-lg font-bold text-blue-900">{new Date(plan.date).getDate()}</div>
                         </div>
                         <div>
                           <div className="text-yellow-900 font-medium">Ofiste Çalışma ({plan.expectedHours} saat)</div>
                           <div className="text-yellow-700/80 text-sm">{plan.notes || 'Not yok'}</div>
                         </div>
                       </div>
                       <button 
                          onClick={() => setAllPlans(prev => prev.filter(p => p.id !== plan.id))}
                          className="text-yellow-600 hover:text-red-500 transition"
                          title="Planı İptal Et"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Info Footer */}
            <div className="bg-blue-50 rounded-lg p-4 flex gap-3 items-start border border-blue-100">
               <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
               <div className="text-sm text-blue-800">
                 <p className="font-semibold mb-1">Bilgilendirme</p>
                 <p>Girdiğin kayıtlar haftalık olarak İK departmanına iletilmektedir. Eksik günlerini Cuma gününe kadar tamamlamayı unutma.</p>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;