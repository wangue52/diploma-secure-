
import React, { useState, useEffect } from 'react';
import { Tenant, AcademicCampaign } from '../types';
import { campaignService } from '../services/api';

interface AcademicCampaignProps {
  activeTenant: Tenant;
}

const AcademicCampaignManager: React.FC<AcademicCampaignProps> = ({ activeTenant }) => {
  const [campaigns, setCampaigns] = useState<AcademicCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFreezing, setIsFreezing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    year: new Date().getFullYear().toString(),
    totalDiplomas: 1000,
    startDate: new Date().toISOString().split('T')[0]
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await campaignService.getCampaigns(activeTenant.id);
      setCampaigns(data);
    } catch (e) {
      console.error("Failed to load campaigns", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCampaigns(); 
  }, [activeTenant.id]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignService.createCampaign(activeTenant.id, newCampaign);
      setShowAddModal(false);
      fetchCampaigns();
    } catch (e) {
      alert("Erreur lors de la création de la campagne.");
    }
  };

  const handleFreeze = async (year: string) => {
    const confirm = window.confirm(`⚠️ AVERTISSEMENT SOUVERAIN : Vous allez GELER la campagne ${year}. Cette action est irréversible. Les données seront archivées et scellées. Continuer ?`);
    if (!confirm) return;
    
    setIsFreezing(year);
    try {
      await campaignService.freezeCampaign(activeTenant.id, year);
      fetchCampaigns();
    } catch (e) {
      alert("Erreur lors du gel de la campagne.");
    } finally {
      setIsFreezing(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32 px-4">
      {/* Hero Header */}
      <div className="bg-slate-900 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
          <i className="fas fa-calendar-check text-[200px]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <div className="inline-flex px-4 py-1.5 bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-[0.3em]">
              Gouvernance des Cycles
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Campagnes de Certification</h1>
            <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
              Planifiez les sessions d'examen, gérez les périodes d'ouverture et verrouillez légalement les registres après validation finale.
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-10 py-5 bg-white text-slate-900 hover:bg-blue-50 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3"
          >
            <i className="fas fa-plus"></i> Nouveau Cycle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-32 text-center">
           <div className="w-16 h-16 border-8 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Interrogation du registre des cycles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((camp) => (
            <div key={camp.id} className={`bg-white rounded-[40px] p-10 border-2 transition-all shadow-sm flex flex-col justify-between group ${camp.status === 'FROZEN' ? 'border-amber-100 bg-amber-50/10' : 'border-slate-50 hover:shadow-2xl hover:border-blue-100'}`}>
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">{camp.year}</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">Promotion Académique</p>
                  </div>
                  <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    camp.status === 'OPEN' ? 'bg-green-50 text-green-600 border-green-200' : 
                    camp.status === 'FROZEN' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}>
                    <i className={`fas ${camp.status === 'OPEN' ? 'fa-door-open' : 'fa-snowflake'} mr-2`}></i>
                    {camp.status}
                  </span>
                </div>

                <div className="space-y-5 pt-8 border-t border-slate-50">
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taux de Certification</p>
                       <p className="text-2xl font-black text-slate-900 tracking-tight">
                         {/* @fix: changed snake_case to camelCase */}
                         {camp.validatedDiplomas} <span className="text-slate-300 text-sm font-bold">/ {camp.totalDiplomas}</span>
                       </p>
                    </div>
                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      {/* @fix: changed snake_case to camelCase */}
                      {camp.totalDiplomas > 0 ? Math.round((camp.validatedDiplomas / camp.totalDiplomas) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1">
                    {/* @fix: changed snake_case to camelCase and added safety check for division */}
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${(camp.totalDiplomas > 0 ? (camp.validatedDiplomas / camp.totalDiplomas) * 100 : 0)}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Ouverture</p>
                      {/* @fix: changed snake_case to camelCase */}
                      <p className="text-[10px] font-bold text-slate-700">{camp.startDate}</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{camp.status === 'FROZEN' ? 'Scellé le' : 'Prévu le'}</p>
                      {/* @fix: changed snake_case to camelCase */}
                      <p className="text-[10px] font-bold text-slate-700">{camp.freezeDate || 'En cours'}</p>
                   </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
                {camp.status === 'OPEN' ? (
                  <button 
                    onClick={() => handleFreeze(camp.year)}
                    disabled={isFreezing === camp.year}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl hover:bg-amber-600 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isFreezing === camp.year ? <i className="fas fa-snowflake fa-spin"></i> : <i className="fas fa-lock"></i>}
                    Geler la Promotion
                  </button>
                ) : (
                  <button className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-default flex items-center justify-center gap-3">
                    <i className="fas fa-archive"></i> Cycle Archivé
                  </button>
                )}
                <button className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                   <i className="fas fa-file-invoice-dollar"></i>
                </button>
              </div>
            </div>
          ))}

          {/* New Campaign Shadow Placeholder */}
          {!loading && (
            <div 
              onClick={() => setShowAddModal(true)}
              className="border-4 border-dashed border-slate-100 rounded-[40px] p-12 flex flex-col items-center justify-center text-center space-y-6 hover:border-blue-200 hover:bg-blue-50/10 transition-all group cursor-pointer"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:rotate-90 transition-all duration-500">
                <i className="fas fa-plus text-3xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight italic">Planifier un Nouveau Cycle</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Expansion du Registre National</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
           <div className="bg-white w-full max-w-lg rounded-[50px] p-12 shadow-2xl space-y-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
              <div>
                 <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Initialisation de Cycle</h2>
                 <p className="text-slate-500 font-medium text-sm mt-1">Définition du périmètre de diplomation souverain.</p>
              </div>

              <form onSubmit={handleCreateCampaign} className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Année Académique</label>
                       <input 
                         type="text" 
                         required 
                         value={newCampaign.year} 
                         onChange={e => setNewCampaign({...newCampaign, year: e.target.value})} 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:border-blue-600 transition-all" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Diplômes Prévus</label>
                       <input 
                         type="number" 
                         required 
                         value={newCampaign.totalDiplomas} 
                         onChange={e => setNewCampaign({...newCampaign, totalDiplomas: parseInt(e.target.value)})} 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:border-blue-600 transition-all" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date d'Ouverture du Registre</label>
                    <input 
                      type="date" 
                      required 
                      value={newCampaign.startDate} 
                      onChange={e => setNewCampaign({...newCampaign, startDate: e.target.value})} 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:border-blue-600 transition-all" 
                    />
                 </div>

                 <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <p className="text-[11px] text-blue-800 leading-relaxed font-medium italic">
                      "L'ouverture d'un cycle permet l'importation massive des PV de délibération. Le cycle restera ouvert jusqu'à l'acte de gel manuel par le responsable."
                    </p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest">Annuler</button>
                    <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all">Activer la Campagne</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCampaignManager;
