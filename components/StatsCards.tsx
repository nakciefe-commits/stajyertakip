import React from 'react';
import { CalendarCheck, Clock, CalendarOff, TrendingUp } from 'lucide-react';
import { UserStats } from '../types';

interface StatsCardsProps {
  stats: UserStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
        <div>
          <p className="text-sm font-medium text-gray-500">Toplam Gelinen Gün</p>
          <h3 className="text-3xl font-bold text-blue-900 mt-1">{stats.totalWorkDays}</h3>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <CalendarCheck className="w-6 h-6 text-blue-700" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
        <div>
          <p className="text-sm font-medium text-gray-500">Toplam Çalışma Saati</p>
          <h3 className="text-3xl font-bold text-blue-900 mt-1">{stats.totalWorkHours}</h3>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <Clock className="w-6 h-6 text-indigo-700" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
        <div>
          <p className="text-sm font-medium text-gray-500">Kullanılan İzin</p>
          <h3 className="text-3xl font-bold text-yellow-600 mt-1">{stats.totalLeaveDays}</h3>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <CalendarOff className="w-6 h-6 text-yellow-600" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition hover:shadow-md">
        <div>
          <p className="text-sm font-medium text-gray-500">Verimlilik Puanı</p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-1">
            {stats.totalWorkDays > 0 ? ((stats.totalWorkHours / stats.totalWorkDays).toFixed(1)) : 0} <span className="text-sm font-normal text-gray-400">saat/gün</span>
          </h3>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};