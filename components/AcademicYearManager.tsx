import React, { useState, useEffect } from 'react';
import { Tenant, AcademicYear, AcademicCampaign } from '../types';

interface AcademicYearManagerProps {
  activeTenant: Tenant;
  onYearChange: (year: AcademicYear) => void;
}

const AcademicYearManager: React.FC<AcademicYearManagerProps> = ({ activeTenant, onYearChange }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [campaigns, setCampaigns] = useState<AcademicCampaign[]>([]);

  useEffect(() => {
    initializeYears();
  }, [activeTenant.id]);

  const initializeYears = () => {
    const currentDate = new Date();
    const currentYearNum = currentDate.getFullYear();
    
    const academicYears: AcademicYear[] = [];
    for (let i = -2; i <= 2; i++) {
      const year = currentYearNum + i;
      const academicYear: AcademicYear = {
        id: `${year}-${year + 1}`,
        year: `${year}-${year + 1}`,
        label: `Année ${year}-${year + 1}`,
        startDate: `${year}-09-01`,
        endDate: `${year + 1}-08-31`,
        isActive: true,
        isCurrent: i === 0
      };
      academicYears.push(academicYear);
    }
    
    setYears(academicYears);
    const current = academicYears.find(y => y.isCurrent);
    if (current) {
      setCurrentYear(current);
      onYearChange(current);
    }
  };

  const handleYearSelect = (year: AcademicYear) => {
    setCurrentYear(year);
    onYearChange(year);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div>
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Année Académique</h3>
            <p className="text-xs text-slate-500">Campagne de diplômes</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {years.map((year) => (
          <button
            key={year.id}
            onClick={() => handleYearSelect(year)}
            className={`w-full p-3 rounded-xl text-left transition-all ${
              currentYear?.id === year.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{year.label}</p>
                <p className={`text-xs ${
                  currentYear?.id === year.id ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {year.startDate} → {year.endDate}
                </p>
              </div>
              {year.isCurrent && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  currentYear?.id === year.id 
                    ? 'bg-white/20 text-white' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  Actuelle
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {currentYear && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">
            Année sélectionnée
          </p>
          <p className="text-sm font-black text-blue-900 mt-1">
            {currentYear.label}
          </p>
        </div>
      )}
    </div>
  );
};

export default AcademicYearManager;