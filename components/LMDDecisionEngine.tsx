
import React, { useState, useEffect } from 'react';
import { Tenant, AcademicCycle, LMDRuleSet } from '../types';
import { tenantService } from '../services/api';

interface LMDDecisionEngineProps {
  activeTenant: Tenant;
  onSave: (rules: LMDRuleSet[]) => void;
}

const LMDDecisionEngine: React.FC<LMDDecisionEngineProps> = ({ activeTenant, onSave }) => {
  const [rules, setRules] = useState<LMDRuleSet[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeTenant.settings?.lmdRules?.length) {
      setRules(activeTenant.settings.lmdRules);
    } else {
      setRules([
        { cycle: AcademicCycle.LICENCE, requiredCredits: 180, minPassingGrade: 10, compensationAllowed: true, eliminationGrade: 5, calculationMethod: 'WEIGHTED_AVERAGE', ccWeight: 0.3, snWeight: 0.7, requiresAdmissionProof: true },
        { cycle: AcademicCycle.MASTER, requiredCredits: 120, minPassingGrade: 12, compensationAllowed: false, eliminationGrade: 7, calculationMethod: 'WEIGHTED_AVERAGE', ccWeight: 0.4, snWeight: 0.6, requiresAdmissionProof: true }
      ]);
    }
  }, [activeTenant]);

  const handlePersist = async () => {
    setIsSaving(true);
    try {
      await tenantService.saveLMDRules(activeTenant.id, rules);
      onSave(rules);
    } catch (e) {
      alert("Erreur de sauvegarde persistante.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateRule = (index: number, field: keyof LMDRuleSet, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    if (field === 'ccWeight') {
        newRules[index].snWeight = parseFloat((1 - value).toFixed(2));
    }
    setRules(newRules);
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-6xl mx-auto pb-32">
      <div className="bg-slate-900 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10"><i className="fas fa-microchip text-[180px]"></i></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
           <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center shadow-2xl">
              <i className="fas fa-brain text-4xl"></i>
           </div>
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tight">Intelligence LMD & Admission</h1>
              <p className="text-slate-400 mt-2 font-medium max-w-xl">
                 Paramétrez les critères d'éligibilité légale. L'admission par concours ou acte ministériel est vérifiée avant le scellement.
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {rules.map((rule, idx) => (
          <div key={idx} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8 hover:shadow-2xl hover:border-blue-100 transition-all group">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Cycle {rule.cycle}</h2>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Contrôles de Légalité</span>
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[32px] text-white space-y-6">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-400">Preuve d'Admission Requise</p>
                    <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold">(Arrêté Ministériel / Concours)</p>
                  </div>
                  <button 
                    onClick={() => updateRule(idx, 'requiresAdmissionProof', !rule.requiresAdmissionProof)}
                    className={`w-14 h-8 rounded-full relative transition-all ${rule.requiresAdmissionProof ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${rule.requiresAdmissionProof ? 'left-7' : 'left-1'}`}></div>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Crédits Diplôme</label>
                <input 
                  type="number" 
                  value={rule.requiredCredits}
                  onChange={(e) => updateRule(idx, 'requiredCredits', parseInt(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Seuil Capitalisation</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={rule.minPassingGrade}
                  onChange={(e) => updateRule(idx, 'minPassingGrade', parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
               <i className="fas fa-shield-halved text-2xl"></i>
            </div>
            <div>
               <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">Sceau de Conformité LMD</p>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ces paramètres seront appliqués lors de l'interrogation de l'ERP pour filtrer les candidats.</p>
            </div>
         </div>
         <button 
           onClick={handlePersist}
           disabled={isSaving}
           className="px-16 py-5 bg-slate-900 text-white rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all disabled:opacity-50"
         >
           {isSaving ? "Traitement..." : "Sceller la Logique"}
         </button>
      </div>
    </div>
  );
};

export default LMDDecisionEngine;
