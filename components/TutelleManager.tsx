
import React, { useState } from 'react';
import { Tenant, TutelleAgreement } from '../types';

interface TutelleManagerProps {
  activeTenant: Tenant;
}

const TutelleManager: React.FC<TutelleManagerProps> = ({ activeTenant }) => {
  const [agreements, setAgreements] = useState<TutelleAgreement[]>(activeTenant.settings?.tutelleAgreements || [
    { id: 'AG-001', parentUniversityId: 't-uy1', parentUniversityName: 'Université de Yaoundé I', ipesId: 't-udm', ipesName: 'Université des Montagnes', programName: 'Médecine Humaine', status: 'ACTIVE', expiryDate: '2026-12-31' },
    { id: 'AG-002', parentUniversityId: 't-uy1', parentUniversityName: 'Université de Yaoundé I', ipesId: 't-poly', ipesName: 'IPES Tech-Inst', programName: 'Génie Logiciel', status: 'EXPIRED', expiryDate: '2023-06-15' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-10 animate-fadeIn max-w-7xl mx-auto pb-32 px-4">
      <div className="bg-slate-900 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12">
           <i className="fas fa-handshake text-[180px]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
           <div className="space-y-4">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Gouvernance des IPES</h1>
              <p className="text-slate-400 max-w-xl font-medium">
                 Gérez les conventions de tutelle académique. Chaque IPES doit être liée à une université mère pour que ses diplômes soient certifiés par l'État.
              </p>
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
           >
              Déclarer une Convention
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agreements.map((ag) => (
          <div key={ag.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
             <div className="flex justify-between items-start mb-8">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                   <i className="fas fa-building-columns text-xl"></i>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                   ag.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                   {ag.status}
                </span>
             </div>

             <div className="space-y-6">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Université de Tutelle</p>
                   <h3 className="font-black text-slate-800 uppercase tracking-tight">{ag.parentUniversityName}</h3>
                </div>
                
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center border-b border-slate-200 pb-2">Institution sous tutelle</p>
                   <p className="text-sm font-black text-blue-600 text-center uppercase tracking-tighter">{ag.ipesName}</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Filière</span>
                      <span className="text-slate-800">{ag.programName}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Échéance</span>
                      <span className={new Date(ag.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-800'}>{ag.expiryDate}</span>
                   </div>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-slate-50 flex gap-2">
                <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Audit</button>
                <button className="flex-1 py-3 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Renouveler</button>
             </div>
          </div>
        ))}

        <div 
          onClick={() => setShowAddModal(true)}
          className="border-4 border-dashed border-slate-200 rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-200 transition-all cursor-pointer group"
        >
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
              <i className="fas fa-plus text-2xl"></i>
           </div>
           <div>
              <h3 className="text-sm font-black text-slate-800 uppercase">Nouvelle Tutelle</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Lier une IPES au registre</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TutelleManager;
