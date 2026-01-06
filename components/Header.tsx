import React from 'react';
import { Briefcase, ChevronLeft, LogOut } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onBack }) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
             {/* Logo */}
             <div className="relative w-12 h-12 flex-shrink-0">
                <div className="absolute inset-0 rounded-full overflow-hidden flex flex-wrap">
                    <div className="w-1/2 h-1/2 bg-blue-900"></div>
                    <div className="w-1/2 h-1/2 bg-yellow-400"></div>
                    <div className="w-1/2 h-1/2 bg-yellow-400"></div>
                    <div className="w-1/2 h-1/2 bg-white"></div>
                </div>
             </div>
             
             <div>
                <h1 className="text-2xl font-bold text-blue-900 tracking-tight leading-none">BİLTİR OTEST</h1>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase mt-1">
                  Stajyer Takip Sistemi
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             {currentUser ? (
               <div className="flex items-center gap-3">
                 <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${currentUser.avatarColor || 'bg-blue-600'}`}>
                      {currentUser.firstName[0]}{currentUser.lastName[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-blue-900 leading-none">{currentUser.firstName} {currentUser.lastName}</span>
                      <span className="text-xs text-blue-600 leading-none mt-1">{currentUser.role}</span>
                    </div>
                 </div>
                 {onBack && (
                   <button 
                    onClick={onBack}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    title="Çıkış Yap"
                   >
                     <LogOut className="w-5 h-5" />
                   </button>
                 )}
               </div>
             ) : (
               <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                 <Briefcase className="w-4 h-4 text-blue-900" />
                 <span>Stajyer Portalı</span>
               </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};