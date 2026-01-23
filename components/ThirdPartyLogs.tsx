
import React, { useState, useEffect } from 'react';
// Fixed: Using default import for apiClient
import apiClient from '../services/api';

const ThirdPartyLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/admin/third-party-logs');
        setLogs(res.data);
      } finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-32">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-blue-600 rounded-[28px] flex items-center justify-center text-white shadow-xl">
          <i className="fas fa-building-shield text-2xl"></i>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Journal des Accès Tiers</h1>
          <p className="text-slate-500 font-medium">Monitoring des vérifications effectuées par les Ambassades et Employeurs.</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Date & Heure</th>
              <th className="px-8 py-6">Entité Vérificatrice</th>
              <th className="px-8 py-6">Objet de la Demande</th>
              <th className="px-8 py-6">Hash Cible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-400 tracking-widest">Synchronisation...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic">Aucun accès externe enregistré.</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-[10px] font-mono text-slate-500">{new Date(log.timestamp * 1000).toLocaleString()}</td>
                <td className="px-8 py-5">
                  <span className="font-black text-slate-800 text-xs uppercase tracking-tight">{log.entity}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{log.purpose}</span>
                </td>
                <td className="px-8 py-5 font-mono text-[9px] text-blue-600">#{log.diploma_id.substring(0, 16)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ThirdPartyLogs;
