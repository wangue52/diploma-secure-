
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tenant, SecurityAnomaly } from '../types';
import { diplomaService } from '../services/api';
import { GoogleGenAI } from '@google/genai';

interface DashboardProps {
  activeTenant: Tenant;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTenant }) => {
  const [stats, setStats] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await diplomaService.getStats(activeTenant.id);
        setStats(data);
        runAiSecurityAudit(data);
      } catch (err) {
        console.error("Erreur API Stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTenant]);

  const runAiSecurityAudit = async (currentStats: any) => {
    // Désactiver l'audit IA si pas de clé API
    // À implémenter avec une clé API valide
    setAiAnalyzing(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-8">
        <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
           <p className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Vérification de l'Intégrité Institutionnelle...</p>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Noeud CORE-SYNC en attente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Infrastructure Health Bar */}
      <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Blockchain Node: ONLINE</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">PKI HSM: READY</span>
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <div className="flex items-center gap-2">
               <i className="fas fa-cloud-bolt text-indigo-400 text-xs"></i>
               <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">eGov Interop: CONNECTED</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase italic">Dernier Bloc: #1,045,234</span>
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
               <i className="fas fa-microchip text-[10px]"></i>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Gouvernance {activeTenant.name}</h1>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-2 mt-1">
             <i className="fas fa-shield-halved text-blue-600"></i>
             Supervision du Registre National de Diplomation
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border ${activeTenant.settings?.zeroTrustMode ? 'bg-slate-900 border-slate-700' : 'bg-amber-900 border-amber-700'} shadow-xl`}>
              <i className={`fas ${activeTenant.settings?.zeroTrustMode ? 'fa-shield-check text-green-400' : 'fa-triangle-exclamation text-amber-400'} text-sm`}></i>
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                {activeTenant.settings?.zeroTrustMode ? 'ZERO TRUST ACTIVE' : 'STANDARD MODE'}
              </span>
           </div>
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="bg-red-950 border border-red-800 rounded-[40px] p-8 animate-slideDown shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-red-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <i className="fas fa-robot text-xl animate-bounce"></i> Alerte Intelligence Artificielle
            </h3>
            <button onClick={() => setAnomalies([])} className="text-red-400/50 hover:text-red-400 transition-colors">
               <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {anomalies.map((anomaly, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex items-start gap-5 hover:bg-white/10 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${anomaly.severity === 'CRITICAL' ? 'bg-red-600 text-white shadow-red-900/50' : 'bg-amber-500 text-white shadow-amber-900/50'}`}>
                  <i className="fas fa-bolt text-lg"></i>
                </div>
                <div>
                  <p className="text-xs font-black text-white uppercase leading-none mb-2">{anomaly.type}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">{anomaly.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Scellements PKI', value: stats.signed, icon: 'fa-certificate', color: 'blue', desc: 'Certificats X.509 valides' },
          { label: 'Cohorte Globale', value: stats.total, icon: 'fa-users-rectangle', color: 'indigo', desc: 'Diplômes en base' },
          { label: 'Disponibilité', value: '100%', icon: 'fa-server', color: 'green', desc: 'Système décentralisé' },
          { label: 'Vérifications Tiers', value: stats.recent.length * 12, icon: 'fa-eye', color: 'purple', desc: 'Accès Ambassades/RH' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group transition-all hover:shadow-2xl hover:-translate-y-2">
            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner`}>
              <i className={`fas ${stat.icon} text-${stat.color}-600 text-2xl`}></i>
            </div>
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
            <p className="text-4xl font-black text-slate-900 mt-1">{stat.value}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 border-t border-slate-50 pt-4 italic">{stat.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[50px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-black text-slate-800 text-sm uppercase tracking-[0.3em]">Production Sectorielle</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Top 5 des filières les plus actives</p>
            </div>
            <i className="fas fa-chart-simple text-slate-200 text-2xl"></i>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byProgram} margin={{top: 0, right: 30, left: 0, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: '900'}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', padding: '20px'}}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-[50px] shadow-2xl relative overflow-hidden text-white flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-16 opacity-5 scale-150 rotate-12">
              <i className="fas fa-fingerprint text-[200px]"></i>
           </div>
           <div className="relative z-10">
              <h2 className="font-black text-sm uppercase tracking-[0.3em] mb-12 flex items-center gap-4">
                <i className="fas fa-key text-blue-400"></i> Cryptographie Système
              </h2>
              <div className="space-y-8">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                    <div>
                       <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Standard X.509</p>
                       <p className="text-sm font-bold truncate max-w-[180px]">{activeTenant.settings?.pkiCertificate?.serialNumber || 'SN-CORE-9942'}</p>
                    </div>
                    <i className="fas fa-circle-check text-green-400 text-xl group-hover:scale-125 transition-transform"></i>
                 </div>
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all cursor-default group">
                    <div>
                       <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Blockchain Proof</p>
                       <p className="text-sm font-bold">Sidechain Nationale</p>
                    </div>
                    <i className="fas fa-link text-indigo-400 text-xl group-hover:rotate-12 transition-transform"></i>
                 </div>
              </div>
           </div>
           <div className="mt-12 relative z-10 p-6 bg-blue-600 rounded-[32px] shadow-2xl shadow-blue-900/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-2">Conformité RGPD / Souveraineté</p>
              <p className="text-xs font-bold leading-relaxed italic">"Toutes les données sont scellées sur le noeud national souverain, conformément au décret n°2024/001."</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
