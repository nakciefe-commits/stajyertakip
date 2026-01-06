import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, User } from 'lucide-react';
import { UserProfile, WeeklyPlan } from '../types';
import { createPlan, fetchPlans } from '../services/firebaseService';

interface CalendarViewProps {
  users: UserProfile[];
  currentUser: UserProfile | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ users, currentUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  
  // Form State
  const [formUser, setFormUser] = useState(currentUser?.id || '');
  const [formType, setFormType] = useState<'Ofis' | 'İzin' | 'Okul'>('Ofis');

  useEffect(() => {
    loadPlans();
  }, [currentDate]); // Reload when month changes (in a real app)

  const loadPlans = async () => {
    setLoading(true);
    // Logic to get start/end of month could go here for query
    const data = await fetchPlans('2024-01-01', '2025-12-31');
    setPlans(data);
    setLoading(false);
  };

  // Helper to generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Empty slots for previous month
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Start Monday
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDateStr(dateStr);
    setFormUser(currentUser?.id || (users[0]?.id || ''));
    setShowModal(true);
  };

  const handleSavePlan = async () => {
    const selectedUser = users.find(u => u.id === formUser);
    if (!selectedUser) return;

    const newPlan: Partial<WeeklyPlan> = {
      userId: selectedUser.id,
      fullName: `${selectedUser.firstName} ${selectedUser.lastName}`,
      date: selectedDateStr,
      type: formType,
    };

    const saved = await createPlan(newPlan);
    if (saved) {
      setPlans([...plans, saved]);
      setShowModal(false);
    }
  };

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const days = getDaysInMonth(currentDate);

  // Plans for a specific day
  const getPlansForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return plans.filter(p => p.date === dateStr);
  };

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Planlama Takvimi</h2>
        <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1 border border-gray-200">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <span className="font-bold text-gray-700 w-24 text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-gray-100 divide-y">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="bg-gray-50/50 min-h-[100px]" />;
            
            const dayPlans = getPlansForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div 
                key={idx} 
                onClick={() => handleDayClick(date)}
                className={`min-h-[100px] p-2 hover:bg-blue-50/30 transition cursor-pointer relative group ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                 <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                    {date.getDate()}
                 </div>
                 
                 <div className="space-y-1">
                    {dayPlans.map(p => (
                        <div key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                            p.type === 'Ofis' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            p.type === 'İzin' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                           {p.fullName.split(' ')[0]} - {p.type}
                        </div>
                    ))}
                    {dayPlans.length > 3 && (
                        <div className="text-[10px] text-gray-400 pl-1">+{dayPlans.length - 3} kişi daha</div>
                    )}
                 </div>

                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                    <Plus className="w-4 h-4 text-blue-400" />
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Ofis</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> İzinli</div>
         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> Okul/Diğer</div>
      </div>

      {/* Add Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Plan Ekle: {selectedDateStr}</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kişi</label>
                        <select 
                            className="w-full border rounded-lg p-2.5 bg-white"
                            value={formUser}
                            onChange={(e) => setFormUser(e.target.value)}
                            disabled={!!currentUser} // Lock if logged in
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                         <div className="grid grid-cols-3 gap-2">
                            {(['Ofis', 'İzin', 'Okul'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormType(type)}
                                    className={`py-2 rounded-lg text-sm font-medium border transition ${
                                        formType === type 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                         </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-gray-600 bg-gray-100 rounded-xl font-medium">İptal</button>
                    <button onClick={handleSavePlan} className="flex-1 py-2.5 text-white bg-blue-900 rounded-xl font-bold hover:bg-blue-800">Kaydet</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};