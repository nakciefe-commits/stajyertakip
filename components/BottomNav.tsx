import React from 'react';
import { LayoutDashboard, Calendar, UserCircle } from 'lucide-react';

interface BottomNavProps {
  currentView: 'dashboard' | 'calendar' | 'profile';
  onChange: (view: 'dashboard' | 'calendar' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-lg z-40 flex justify-between items-center h-20 md:hidden">
      <button 
        onClick={() => onChange('dashboard')}
        className={`flex flex-col items-center gap-1 w-16 ${currentView === 'dashboard' ? 'text-blue-900' : 'text-gray-400'}`}
      >
        <LayoutDashboard className={`w-6 h-6 ${currentView === 'dashboard' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-bold">Genel</span>
      </button>

      <button 
        onClick={() => onChange('calendar')}
        className={`flex flex-col items-center gap-1 w-16 ${currentView === 'calendar' ? 'text-blue-900' : 'text-gray-400'}`}
      >
        <Calendar className={`w-6 h-6 ${currentView === 'calendar' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-bold">Planlar</span>
      </button>

      <button 
        onClick={() => onChange('profile')}
        className={`flex flex-col items-center gap-1 w-16 ${currentView === 'profile' ? 'text-blue-900' : 'text-gray-400'}`}
      >
        <UserCircle className={`w-6 h-6 ${currentView === 'profile' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-bold">Profilim</span>
      </button>
    </div>
  );
};