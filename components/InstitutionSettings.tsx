
import React, { useState, useEffect } from 'react';
import { Tenant, DiplomaFieldConfig, DEFAULT_DIPLOMA_FIELDS } from '../types';
import { tenantService } from '../services/api';
import DiplomaFieldsConfigurator from './DiplomaFieldsConfigurator';

interface InstitutionSettingsProps {
  activeTenant: Tenant;
  onUpdate: (updated: Tenant) => void;
}

const InstitutionSettings: React.FC<InstitutionSettingsProps> = ({ activeTenant, onUpdate }) => {
  const [tenant, setTenant] = useState<Tenant>(activeTenant);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'fields'>('general');

  useEffect(() => { setTenant(activeTenant); }, [activeTenant]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tenantService.updateTenant(tenant.id, tenant);
      onUpdate(tenant);
      alert("Configuration institutionnelle scellée.");
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    } finally { setIsSaving(false); }
  };

  const handleFieldsUpdate = (fields: DiplomaFieldConfig[]) => {
    const updatedTenant = {
      ...tenant,
      settings: {
        ...tenant.settings,
        diplomaFields: fields
      }
    };
    setTenant(updatedTenant);
    onUpdate(updatedTenant);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-32">
      {/* Navigation Tabs */}
      <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
        {[
          { id: 'general', label: 'Configuration Générale', icon: 'fa-cog' },
          { id: 'fields', label: 'Champs des Diplômes', icon: 'fa-list-check' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 space-y-10">
          <div className="border-b border-slate-50 pb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Configuration Gvnt</h1>
            <p className="text-slate-500 font-medium mt-1">Paramètres de sécurité et gouvernance multi-signataires.</p>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-slate-900 rounded-[32px] text-white">
              <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest mb-8 flex items-center gap-3">
                <i className="fas fa-users-gear"></i> Quorum de Signature
              </h3>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre de signataires officiels requis</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range" min="1" max="5" 
                    value={tenant.settings?.signatureRequired || 1}
                    onChange={e => setTenant({...tenant, settings: {...tenant.settings, signatureRequired: parseInt(e.target.value)}})}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-4xl font-black text-blue-400">{tenant.settings?.signatureRequired || 1}</span>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-4">
                  "Le diplôme ne sera considéré comme VALIDE et ARCHIVÉ qu'après l'apposition de ces {tenant.settings?.signatureRequired} signatures distinctes."
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom de l'Institution</label>
                  <input 
                    value={tenant.name}
                    onChange={e => setTenant({...tenant, name: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Devise / Slogan</label>
                  <input 
                    value={tenant.motto || ''}
                    onChange={e => setTenant({...tenant, motto: e.target.value})}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm italic font-medium outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {isSaving ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-shield-halved mr-2"></i>}
              Appliquer la Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'fields' && (
        <DiplomaFieldsConfigurator 
          activeTenant={tenant} 
          onUpdate={handleFieldsUpdate}
        />
      )}
    </div>
  );
};

export default InstitutionSettings;
