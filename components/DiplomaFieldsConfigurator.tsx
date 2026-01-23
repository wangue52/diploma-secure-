import React, { useState, useEffect } from 'react';
import { Tenant, DiplomaFieldConfig, DEFAULT_DIPLOMA_FIELDS } from '../types';
import { tenantService } from '../services/api';

interface DiplomaFieldsConfiguratorProps {
  activeTenant: Tenant;
  onUpdate: (fields: DiplomaFieldConfig[]) => void;
}

const DiplomaFieldsConfigurator: React.FC<DiplomaFieldsConfiguratorProps> = ({ activeTenant, onUpdate }) => {
  const [fields, setFields] = useState<DiplomaFieldConfig[]>(
    activeTenant.settings?.diplomaFields || DEFAULT_DIPLOMA_FIELDS
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldUpdate = (index: number, updates: Partial<DiplomaFieldConfig>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tenantService.updateTenant(activeTenant.id, {
        settings: {
          ...activeTenant.settings,
          diplomaFields: fields
        }
      });
      onUpdate(fields);
      alert('Configuration des champs sauvegardée avec succès');
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomField = () => {
    const newField: DiplomaFieldConfig = {
      id: `custom_${Date.now()}`,
      label: "Nouveau champ",
      type: "text",
      required: false,
      position: fields.length + 1,
      visibility: "visible",
      validation: {},
      helpText: "Champ personnalisé"
    };
    setFields([...fields, newField]);
  };

  const removeField = (index: number) => {
    if (confirm('Supprimer ce champ ?')) {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
    }
  };

  const activeFields = fields.filter(f => f.visibility === 'visible').sort((a, b) => a.position - b.position);
  const requiredFields = activeFields.filter(f => f.required);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="bg-slate-900 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <i className="fas fa-cogs text-[180px]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Configuration des Champs</h1>
            <p className="text-slate-400 max-w-xl font-medium">
              Configurez exactement les champs qui apparaîtront sur vos diplômes et dans les templates d'importation.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={addCustomField}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
            >
              + Ajouter Champ
            </button>
            <button 
              onClick={() => {
                if (confirm('Réinitialiser à la configuration par défaut ?')) {
                  setFields(DEFAULT_DIPLOMA_FIELDS);
                }
              }}
              className="px-8 py-4 bg-amber-600 hover:bg-amber-500 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all"
            >
              Réinitialiser
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <i className="fas fa-eye"></i>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Champs Actifs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeFields.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <i className="fas fa-exclamation"></i>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Champs Obligatoires</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{requiredFields.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
            <i className="fas fa-file-excel"></i>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colonnes Template</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeFields.length}</p>
        </div>
      </div>

      {/* Fields Configuration */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configuration des Champs</h3>
          <p className="text-sm text-slate-600 mt-1">Activez/désactivez les champs et configurez leur validation</p>
        </div>

        <div className="p-8 space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className={`p-6 rounded-2xl border-2 transition-all ${
              field.visibility === 'visible' 
                ? 'border-blue-200 bg-blue-50/30' 
                : 'border-slate-200 bg-slate-50/30'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    field.visibility === 'visible' ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'
                  }`}>
                    <i className={`fas ${
                      field.type === 'text' ? 'fa-font' :
                      field.type === 'date' ? 'fa-calendar' :
                      field.type === 'select' ? 'fa-list' :
                      field.type === 'number' ? 'fa-hashtag' : 'fa-check'
                    }`}></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{field.label}</h4>
                    <p className="text-sm text-slate-600">ID: {field.id} • Type: {field.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600">Actif</label>
                    <button
                      onClick={() => handleFieldUpdate(index, { 
                        visibility: field.visibility === 'visible' ? 'hidden' : 'visible' 
                      })}
                      className={`w-12 h-6 rounded-full relative transition-all ${
                        field.visibility === 'visible' ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        field.visibility === 'visible' ? 'left-7' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                  
                  {field.visibility === 'visible' && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-600">Obligatoire</label>
                      <button
                        onClick={() => handleFieldUpdate(index, { required: !field.required })}
                        className={`w-12 h-6 rounded-full relative transition-all ${
                          field.required ? 'bg-red-600' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          field.required ? 'left-7' : 'left-1'
                        }`}></div>
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => removeField(index)}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center"
                      title="Supprimer ce champ"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>

              {field.visibility === 'visible' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-2 block">Position</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={field.position}
                      onChange={(e) => handleFieldUpdate(index, { position: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm"
                    />
                  </div>
                  
                  {field.helpText && (
                    <div>
                      <label className="text-xs font-bold text-slate-600 mb-2 block">Aide</label>
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{field.helpText}</p>
                    </div>
                  )}
                  
                  {field.validation?.options && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 mb-2 block">Options disponibles</label>
                      <div className="flex flex-wrap gap-2">
                        {field.validation.options.map((option, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        {/* Preview */}
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Aperçu du Template Excel</h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                {activeFields.map((field) => (
                  <th key={field.id} className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${
                    field.required ? 'text-red-600 bg-red-50' : 'text-slate-600'
                  }`}>
                    {field.label}
                    {field.required && <span className="ml-1">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-200">
                {activeFields.map((field) => (
                  <td key={field.id} className="px-4 py-3 text-xs text-slate-500 italic">
                    {field.defaultValue || field.helpText || `Exemple ${field.type}`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-4 italic">
          * Les colonnes en rouge sont obligatoires dans le template Excel
        </p>
      </div>
    </div>
  );
};

export default DiplomaFieldsConfigurator;