
import React, { useState, useEffect } from 'react';
import { Tenant, AuditLog } from '../types';
import { diplomaService } from '../services/api';

interface AuditLogsProps {
  activeTenant: Tenant;
}

const AuditLogs: React.FC<AuditLogsProps> = ({ activeTenant }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await diplomaService.getAuditLogs(activeTenant.id);
      setLogs(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [activeTenant.id]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
            <i className="fas fa-clipboard-list text-blue-400 text-xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Journal d'Audit Core DB</h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black">Traçabilité immuable du système</p>
          </div>
        </div>
        
        <button onClick={fetchLogs} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100">
          Actualiser les logs
        </button>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
             <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase">Chargement du grand livre...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Date & Heure</th>
                  <th className="px-8 py-5">Acteur</th>
                  <th className="px-8 py-5">Action</th>
                  <th className="px-8 py-5">Preuve (Hash)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 font-mono text-[10px] text-slate-500">{log.date}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black uppercase">{log.user.substring(0, 2)}</div>
                        <span className="text-xs font-bold text-slate-700">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${log.action === 'LOGIN' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {log.action}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1 italic">{log.details}</p>
                    </td>
                    <td className="px-8 py-4 font-mono text-[10px] text-slate-300">#{log.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
